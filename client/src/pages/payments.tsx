import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { PartySearchModal } from "@/components/party-search-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Wallet, ArrowDownCircle, ArrowUpCircle, Printer, Pencil, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useReactToPrint } from "react-to-print";
import { useCompany } from "@/contexts/CompanyContext";

const paymentFormSchema = z.object({
  date: z.string().min(1, "Date is required"),
  partyId: z.coerce.number().optional(),
  partyName: z.string().optional(),
  type: z.enum(["credit", "debit"]),
  amount: z.string().refine((val) => parseFloat(val) > 0, "Amount must be greater than 0"),
  details: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

interface Payment {
  id: number;
  date: string;
  partyName: string | null;
  credit: string;
  debit: string;
  details: string | null;
}

interface Party {
  id: number;
  code: string;
  name: string;
}

interface PaymentReceipt {
  payment: Payment;
  companyName: string;
}

function PaymentReceiptPrint({ payment, companyName }: PaymentReceipt) {
  const isCredit = parseFloat(payment.credit) > 0;
  const amount = isCredit ? parseFloat(payment.credit) : parseFloat(payment.debit);
  
  return (
    <div className="p-8 bg-white text-black max-w-md mx-auto" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="text-center border-b-2 border-black pb-4 mb-4">
        <h1 className="text-xl font-bold">{companyName}</h1>
        <p className="text-lg font-semibold mt-2">
          {isCredit ? "PAYMENT RECEIPT" : "PAYMENT VOUCHER"}
        </p>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
        <div>
          <span className="text-gray-600">Receipt No:</span>
          <span className="font-medium ml-2">#{payment.id}</span>
        </div>
        <div className="text-right">
          <span className="text-gray-600">Date:</span>
          <span className="font-medium ml-2">{format(new Date(payment.date), "dd MMM yyyy")}</span>
        </div>
      </div>
      
      <div className="border rounded-lg p-4 mb-6 bg-gray-50">
        <div className="mb-3">
          <span className="text-gray-600 text-sm">Received From / Paid To:</span>
          <p className="font-semibold text-lg">{payment.partyName || "Cash"}</p>
        </div>
        
        <div className="mb-3">
          <span className="text-gray-600 text-sm">Amount:</span>
          <p className="font-bold text-2xl text-green-700">₹{amount.toFixed(2)}</p>
        </div>
        
        <div className="mb-3">
          <span className="text-gray-600 text-sm">Amount in Words:</span>
          <p className="font-medium">{numberToWords(amount)} Rupees Only</p>
        </div>
        
        {payment.details && (
          <div>
            <span className="text-gray-600 text-sm">Details:</span>
            <p className="font-medium">{payment.details}</p>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-8 mt-12 pt-8 border-t">
        <div className="text-center">
          <div className="border-t border-gray-400 pt-2 mt-8">
            <p className="text-sm text-gray-600">Receiver's Signature</p>
          </div>
        </div>
        <div className="text-center">
          <div className="border-t border-gray-400 pt-2 mt-8">
            <p className="text-sm text-gray-600">Authorized Signature</p>
          </div>
        </div>
      </div>
      
      <div className="text-center mt-8 text-xs text-gray-500">
        This is a computer generated receipt
      </div>
    </div>
  );
}

function numberToWords(num: number): string {
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  
  const numToWord = (n: number): string => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
    if (n < 1000) return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + numToWord(n % 100) : "");
    if (n < 100000) return numToWord(Math.floor(n / 1000)) + " Thousand" + (n % 1000 ? " " + numToWord(n % 1000) : "");
    if (n < 10000000) return numToWord(Math.floor(n / 100000)) + " Lakh" + (n % 100000 ? " " + numToWord(n % 100000) : "");
    return numToWord(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 ? " " + numToWord(n % 10000000) : "");
  };
  
  const intPart = Math.floor(num);
  return intPart === 0 ? "Zero" : numToWord(intPart);
}

export default function Payments() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState<number | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showPartySearch, setShowPartySearch] = useState(false);
  const [isPrintReady, setIsPrintReady] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { currentCompany } = useCompany();

  const { data: payments, isLoading } = useQuery<Payment[]>({
    queryKey: ["/api/payments"],
  });

  const { data: parties } = useQuery<Party[]>({
    queryKey: ["/api/parties"],
  });

  const handlePrintReceipt = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Payment-Receipt-${selectedPayment?.id}`,
    onAfterPrint: () => {
      setSelectedPayment(null);
      setIsPrintReady(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/payments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      toast({
        title: "Success",
        description: "Payment deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const printReceipt = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsPrintReady(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this payment?")) {
      deleteMutation.mutate(id);
    }
  };

  // Trigger print when ready using useEffect
  useEffect(() => {
    if (isPrintReady && selectedPayment) {
      const timer = setTimeout(() => {
        handlePrintReceipt();
        setIsPrintReady(false);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isPrintReady, selectedPayment, handlePrintReceipt]);

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      date: format(new Date(), "yyyy-MM-dd"),
      partyId: undefined,
      partyName: "",
      type: "credit",
      amount: "0",
      details: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: PaymentFormValues) => {
      const selectedParty = parties?.find(p => p.id === data.partyId);
      const amount = parseFloat(data.amount) || 0;
      return apiRequest("POST", "/api/payments", {
        date: data.date,
        partyId: data.partyId || null,
        partyName: selectedParty?.name || data.partyName,
        credit: data.type === "credit" ? amount.toString() : "0",
        debit: data.type === "debit" ? amount.toString() : "0",
        details: data.details,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      toast({
        title: "Success",
        description: "Payment entry created successfully",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: PaymentFormValues) => {
      if (!editingPaymentId) throw new Error("No payment selected");
      const selectedParty = parties?.find(p => p.id === data.partyId);
      const amount = parseFloat(data.amount) || 0;
      return apiRequest("PUT", `/api/payments/${editingPaymentId}`, {
        date: data.date,
        partyId: data.partyId || null,
        partyName: selectedParty?.name || data.partyName,
        credit: data.type === "credit" ? amount.toString() : "0",
        debit: data.type === "debit" ? amount.toString() : "0",
        details: data.details,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      toast({
        title: "Success",
        description: "Payment entry updated successfully",
      });
      setIsDialogOpen(false);
      setEditingPaymentId(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: PaymentFormValues) => {
    if (editingPaymentId) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEditPayment = (payment: Payment) => {
    setEditingPaymentId(payment.id);
    const type = parseFloat(payment.credit) > 0 ? "credit" : "debit";
    const amount = type === "credit" ? payment.credit : payment.debit;
    
    // Find party ID by matching party name
    const selectedParty = parties?.find(p => p.name === payment.partyName);
    
    form.reset({
      date: payment.date,
      partyId: selectedParty?.id,
      partyName: payment.partyName || "",
      type,
      amount,
      details: payment.details || "",
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingPaymentId(null);
    form.reset();
  };

  const totalCredit = payments?.reduce((sum, p) => sum + parseFloat(p.credit), 0) || 0;
  const totalDebit = payments?.reduce((sum, p) => sum + parseFloat(p.debit), 0) || 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Payments</h1>
          <p className="text-muted-foreground mt-2">
            Record payment receipts and transactions
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => !open ? handleCloseDialog() : setIsDialogOpen(true)}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-payment">
              <Plus className="mr-2 h-4 w-4" />
              Add Payment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingPaymentId ? "Edit Payment Entry" : "Add Payment Entry"}</DialogTitle>
              <DialogDescription>
                {editingPaymentId ? "Update payment details" : "Record a payment or receipt transaction"}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-payment-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="partyId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Party (Optional)</FormLabel>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start text-left h-9"
                        onClick={() => setShowPartySearch(true)}
                        data-testid="button-search-payment-party"
                      >
                        {field.value ? parties?.find(p => p.id === field.value)?.name : "Click to search party..."}
                      </Button>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Transaction Type *</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger data-testid="select-payment-type">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="credit">Payment Received (Credit)</SelectItem>
                          <SelectItem value="debit">Payment Made (Debit)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          data-testid="input-payment-amount"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="details"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Details</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Payment details, reference, etc."
                          data-testid="input-payment-details"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseDialog}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={editingPaymentId ? updateMutation.isPending : createMutation.isPending}
                    data-testid="button-save-payment"
                  >
                    {editingPaymentId
                      ? updateMutation.isPending ? "Updating..." : "Update"
                      : createMutation.isPending ? "Saving..." : "Save"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Received</CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold font-mono text-green-600" data-testid="text-total-credit">
              ₹{totalCredit.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold font-mono text-red-600" data-testid="text-total-debit">
              ₹{totalDebit.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold font-mono" data-testid="text-net-balance">
              ₹{(totalCredit - totalDebit).toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : payments && payments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Party</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead className="text-right">Credit</TableHead>
                  <TableHead className="text-right">Debit</TableHead>
                  <TableHead className="w-16">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{format(new Date(payment.date), "dd MMM yyyy")}</TableCell>
                    <TableCell>{payment.partyName || "—"}</TableCell>
                    <TableCell className="text-muted-foreground max-w-xs truncate">
                      {payment.details || "—"}
                    </TableCell>
                    <TableCell className="text-right font-mono text-green-600">
                      {parseFloat(payment.credit) > 0 ? `₹${parseFloat(payment.credit).toFixed(2)}` : "—"}
                    </TableCell>
                    <TableCell className="text-right font-mono text-red-600">
                      {parseFloat(payment.debit) > 0 ? `₹${parseFloat(payment.debit).toFixed(2)}` : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEditPayment(payment)}
                          title="Edit Payment"
                          data-testid={`button-edit-payment-${payment.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => printReceipt(payment)}
                          title="Print Receipt"
                          data-testid={`button-print-receipt-${payment.id}`}
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(payment.id)}
                          title="Delete Payment"
                          data-testid={`button-delete-payment-${payment.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Wallet className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-sm text-muted-foreground mb-1">No payments yet</p>
              <p className="text-xs text-muted-foreground mb-4">
                Add your first payment entry to get started
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedPayment && (
        <div style={{ position: 'absolute', left: '-9999px', top: '0' }}>
          <div ref={printRef}>
            <PaymentReceiptPrint 
              payment={selectedPayment} 
              companyName={currentCompany?.name || "Your Company"} 
            />
          </div>
        </div>
      )}
    </div>
  );
}
