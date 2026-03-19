import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Save, ArrowLeft, Printer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useLocation, useParams, Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";

interface Party {
  id: number;
  code: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  stateCode: string | null;
  gstNo: string | null;
}

interface Item {
  id: number;
  code: string;
  name: string;
  hsnCode: string | null;
  cost: string;
  tax: string;
  cgst: string;
  sgst: string;
}

interface SaleLineItem {
  tempId: string;
  itemId: number | null;
  itemCode: string;
  itemName: string;
  hsnCode: string;
  quantity: number;
  rate: number;
  amount: number;
  taxRate: number;
  cgstRate: number;
  sgstRate: number;
  saleValue: number;
  taxValue: number;
  cgst: number;
  sgst: number;
}

interface ExistingSaleItem {
  id: number;
  itemId: number | null;
  itemCode: string;
  itemName: string;
  hsnCode: string | null;
  quantity: string;
  rate: string;
  amount: string;
  tax: string | null;
  cgst: string | null;
  sgst: string | null;
}

interface ExistingSale {
  id: number;
  invoiceNo: number;
  billType: string;
  saleType: string | null;
  paymentMode: string | null;
  date: string;
  partyId: number | null;
  partyName: string | null;
  partyCity: string | null;
  partyAddress: string | null;
  partyGstNo: string | null;
  mobile: string | null;
  gstType: number;
  saleValue: string;
  discountTotal: string | null;
  taxValue: string | null;
  cgstTotal: string | null;
  sgstTotal: string | null;
  roundOff: string | null;
  grandTotal: string;
  totalQty: string;
  amountGiven: string | null;
  amountReturn: string | null;
  byCash: string | null;
  byCard: string | null;
}

export default function EditSale() {
  const params = useParams();
  const saleId = params.id;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [billType, setBillType] = useState<"GST" | "EST">("GST");
  const [saleType, setSaleType] = useState<string>("B2C");
  const [selectedPartyId, setSelectedPartyId] = useState<number | null>(null);
  const [gstType, setGstType] = useState<0 | 1>(0);
  const [lineItems, setLineItems] = useState<SaleLineItem[]>([]);
  const [invoiceDate, setInvoiceDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [mobile, setMobile] = useState("");
  const [amountGiven, setAmountGiven] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("cash");
  const [isInitialized, setIsInitialized] = useState(false);

  const { data: existingSale, isLoading: saleLoading } = useQuery<ExistingSale>({
    queryKey: ["/api/sales", saleId],
  });

  const { data: existingItems, isLoading: itemsLoading } = useQuery<ExistingSaleItem[]>({
    queryKey: ["/api/sales", saleId, "items"],
  });

  const { data: parties } = useQuery<Party[]>({
    queryKey: ["/api/parties"],
  });

  const { data: items } = useQuery<Item[]>({
    queryKey: ["/api/items"],
  });

  const { data: stock } = useQuery<any[]>({
    queryKey: ["/api/stock"],
  });

  useEffect(() => {
    if (existingSale && existingItems && !isInitialized) {
      setBillType(existingSale.billType === "EST" ? "EST" : "GST");
      setSaleType(existingSale.saleType || "B2C");
      setSelectedPartyId(existingSale.partyId);
      setGstType(existingSale.gstType as 0 | 1);
      setInvoiceDate(existingSale.date);
      setMobile(existingSale.mobile || "");
      setAmountGiven(existingSale.amountGiven ? parseFloat(existingSale.amountGiven) : 0);
      setPaymentMethod(parseFloat(existingSale.byCard || "0") > 0 ? "card" : "cash");

      const mappedItems: SaleLineItem[] = existingItems.map((item, index) => ({
        tempId: `existing-${item.id}-${index}`,
        itemId: item.itemId,
        itemCode: item.itemCode,
        itemName: item.itemName,
        hsnCode: item.hsnCode || "",
        quantity: parseFloat(item.quantity),
        rate: parseFloat(item.rate),
        amount: parseFloat(item.amount),
        taxRate: item.tax ? parseFloat(item.tax) : 0,
        cgstRate: item.cgst ? parseFloat(item.cgst) / parseFloat(item.quantity) : 0,
        sgstRate: item.sgst ? parseFloat(item.sgst) / parseFloat(item.quantity) : 0,
        saleValue: parseFloat(item.amount) - (item.cgst ? parseFloat(item.cgst) : 0) - (item.sgst ? parseFloat(item.sgst) : 0),
        taxValue: (item.cgst ? parseFloat(item.cgst) : 0) + (item.sgst ? parseFloat(item.sgst) : 0),
        cgst: item.cgst ? parseFloat(item.cgst) : 0,
        sgst: item.sgst ? parseFloat(item.sgst) : 0,
      }));

      setLineItems(mappedItems);
      setIsInitialized(true);
    }
  }, [existingSale, existingItems, isInitialized]);

  const getStockQuantity = (itemId: number | null) => {
    if (!itemId || !stock) return null;
    const stockItem = stock.find((s) => s.itemId === itemId);
    return stockItem ? parseFloat(stockItem.quantity) : 0;
  };

  const selectedParty = parties?.find((p) => p.id === selectedPartyId);

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        tempId: Date.now().toString(),
        itemId: null,
        itemCode: "",
        itemName: "",
        hsnCode: "",
        quantity: 1,
        rate: 0,
        amount: 0,
        taxRate: 0,
        cgstRate: 0,
        sgstRate: 0,
        saleValue: 0,
        taxValue: 0,
        cgst: 0,
        sgst: 0,
      },
    ]);
  };

  const removeLineItem = (tempId: string) => {
    setLineItems(lineItems.filter((item) => item.tempId !== tempId));
  };

  const updateLineItem = (tempId: string, field: string, value: any) => {
    setLineItems(
      lineItems.map((item) => {
        if (item.tempId !== tempId) return item;

        const updated = { ...item, [field]: value };

        if (field === "itemId" && value && items) {
          const selectedItem = items.find((i) => i.id === parseInt(value));
          if (selectedItem) {
            updated.itemCode = selectedItem.code;
            updated.itemName = selectedItem.name;
            updated.hsnCode = selectedItem.hsnCode || "";
            updated.rate = parseFloat(selectedItem.cost);
            updated.taxRate = parseFloat(selectedItem.tax);
            updated.cgstRate = parseFloat(selectedItem.cgst);
            updated.sgstRate = parseFloat(selectedItem.sgst);
          }
        }

        const qty = parseFloat(updated.quantity.toString()) || 0;
        const rate = parseFloat(updated.rate.toString()) || 0;
        const taxRate = parseFloat(updated.taxRate.toString()) || 0;

        const amount = qty * rate;
        const saleValue = billType === "GST" ? amount / (1 + taxRate / 100) : amount;
        const taxValue = billType === "GST" ? amount - saleValue : 0;

        if (billType === "GST") {
          if (gstType === 0) {
            updated.cgst = taxValue / 2;
            updated.sgst = taxValue / 2;
          } else {
            updated.cgst = taxValue;
            updated.sgst = 0;
          }
        } else {
          updated.cgst = 0;
          updated.sgst = 0;
        }

        updated.amount = amount;
        updated.saleValue = saleValue;
        updated.taxValue = taxValue;

        return updated;
      })
    );
  };

  const calculateTotals = () => {
    const totalQty = lineItems.reduce((sum, item) => sum + (parseFloat(item.quantity.toString()) || 0), 0);
    const saleValue = lineItems.reduce((sum, item) => sum + item.saleValue, 0);
    const taxValue = lineItems.reduce((sum, item) => sum + item.taxValue, 0);
    const cgstTotal = lineItems.reduce((sum, item) => sum + item.cgst, 0);
    const sgstTotal = lineItems.reduce((sum, item) => sum + item.sgst, 0);
    const subTotal = saleValue + taxValue;
    const roundOff = Math.round(subTotal) - subTotal;
    const grandTotal = Math.round(subTotal);
    const amountReturn = amountGiven - grandTotal;

    return {
      totalQty,
      saleValue,
      taxValue,
      cgstTotal,
      sgstTotal,
      subTotal,
      roundOff,
      grandTotal,
      amountReturn,
    };
  };

  const totals = calculateTotals();

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (lineItems.length === 0) {
        throw new Error("Please add at least one item");
      }

      const saleData = {
        billType,
        saleType,
        date: invoiceDate,
        partyId: selectedPartyId,
        partyName: selectedParty?.name || existingSale?.partyName || "",
        partyCity: selectedParty?.city || existingSale?.partyCity || "",
        partyAddress: selectedParty?.address || existingSale?.partyAddress || "",
        partyGstNo: selectedParty?.gstNo || existingSale?.partyGstNo || "",
        gstType,
        saleValue: totals.saleValue,
        taxValue: totals.taxValue,
        cgstTotal: totals.cgstTotal,
        sgstTotal: totals.sgstTotal,
        roundOff: totals.roundOff,
        grandTotal: totals.grandTotal,
        totalQty: totals.totalQty,
        amountGiven: amountGiven,
        amountReturn: totals.amountReturn,
        byCash: paymentMethod === "cash" ? totals.grandTotal : 0,
        byCard: paymentMethod === "card" ? totals.grandTotal : 0,
        mobile,
        items: lineItems.map((item) => ({
          itemId: item.itemId,
          itemCode: item.itemCode,
          itemName: item.itemName,
          hsnCode: item.hsnCode,
          quantity: item.quantity,
          rate: item.rate,
          amount: item.amount,
          saleValue: item.saleValue,
          taxValue: item.taxValue,
          tax: item.taxRate,
          cgst: item.cgst,
          sgst: item.sgst,
          cgstRate: item.cgstRate,
          sgstRate: item.sgstRate,
        })),
      };

      return apiRequest("PUT", `/api/sales/${saleId}`, saleData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sales", saleId] });
      queryClient.invalidateQueries({ queryKey: ["/api/sales", saleId, "items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      toast({
        title: "Success",
        description: "Invoice updated successfully",
      });
      setLocation("/sales");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const isLoading = saleLoading || itemsLoading;

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  if (!existingSale) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Invoice not found</p>
            <Button asChild className="mt-4">
              <Link href="/sales">Back to Sales</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" asChild>
            <Link href="/sales">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Edit Invoice</h1>
            <p className="text-muted-foreground mt-1">
              Editing {existingSale.saleType}-{existingSale.invoiceNo}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => window.open(`/invoice/${saleId}`, '_blank')}
            data-testid="button-view-invoice"
          >
            <Printer className="mr-2 h-4 w-4" />
            View & Print
          </Button>
          <Button
            onClick={() => updateMutation.mutate()}
            disabled={updateMutation.isPending || lineItems.length === 0}
            data-testid="button-save-sale"
                  tabIndex={-1}
          >
            <Save className="mr-2 h-4 w-4" />
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Invoice Details</CardTitle>
              <Badge variant={billType === "GST" ? "default" : "secondary"}>
                {billType === "GST" ? "Tax Invoice" : "Estimate"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="invoiceDate">Invoice Date</Label>
                <Input
                  id="invoiceDate"
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  data-testid="input-invoice-date"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="saleType">Sale Type</Label>
                <Select value={saleType} onValueChange={setSaleType}>
                  <SelectTrigger id="saleType" data-testid="select-sale-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="B2B">B2B (Credit)</SelectItem>
                    <SelectItem value="B2C">B2C (Cash/Retail)</SelectItem>
                    <SelectItem value="ESTIMATE">Estimate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="party">Customer</Label>
                <Select
                  value={selectedPartyId?.toString() || ""}
                  onValueChange={(v) => setSelectedPartyId(v ? parseInt(v) : null)}
                >
                  <SelectTrigger id="party" data-testid="select-party">
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {parties?.map((party) => (
                      <SelectItem key={party.id} value={party.id.toString()}>
                        {party.name} ({party.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="gstType">GST Type</Label>
                <Select
                  value={gstType.toString()}
                  onValueChange={(v) => setGstType(parseInt(v) as 0 | 1)}
                >
                  <SelectTrigger id="gstType" data-testid="select-gst-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Local (CGST + SGST)</SelectItem>
                    <SelectItem value="1">Inter-State (IGST)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobile">Mobile (Optional)</Label>
                <Input
                  id="mobile"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="Customer mobile"
                  data-testid="input-mobile"
                />
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Item</TableHead>
                    <TableHead className="w-[100px]">Qty</TableHead>
                    <TableHead className="w-[100px]">Rate</TableHead>
                    <TableHead className="w-[100px]">Amount</TableHead>
                    <TableHead className="w-[80px]">Tax</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lineItems.map((lineItem) => (
                    <TableRow key={lineItem.tempId}>
                      <TableCell>
                        <Select
                          value={lineItem.itemId?.toString() || ""}
                          onValueChange={(v) => updateLineItem(lineItem.tempId, "itemId", v)}
                        >
                          <SelectTrigger data-testid={`select-item-${lineItem.tempId}`}>
                            <SelectValue placeholder="Select item">
                              {lineItem.itemName || "Select item"}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {items?.map((item) => (
                              <SelectItem key={item.id} value={item.id.toString()}>
                                {item.name} ({item.code})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {lineItem.itemId && (
                          <span className="text-xs text-muted-foreground">
                            Stock: {getStockQuantity(lineItem.itemId)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={lineItem.quantity}
                          onFocus={(e) => e.target.select()}
              onChange={(e) => updateLineItem(lineItem.tempId, "quantity", parseFloat(e.target.value) || 0)}
                          onFocus={(e) => setTimeout(() => e.currentTarget.setSelectionRange(0, e.currentTarget.value.length), 0)}
                          className="w-20"
                          data-testid={`input-qty-${lineItem.tempId}`}
                          inputMode="decimal"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={lineItem.rate}
                          onFocus={(e) => e.target.select()}
              onChange={(e) => updateLineItem(lineItem.tempId, "rate", parseFloat(e.target.value) || 0)}
                          onFocus={(e) => setTimeout(() => e.currentTarget.setSelectionRange(0, e.currentTarget.value.length), 0)}
                          className="w-24"
                          data-testid={`input-rate-${lineItem.tempId}`}
                          inputMode="decimal"
                        />
                      </TableCell>
                      <TableCell className="font-mono">
                        ₹{lineItem.amount.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {lineItem.taxRate}%
                      </TableCell>
                      <TableCell>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removeLineItem(lineItem.tempId)}
                          data-testid={`button-remove-item-${lineItem.tempId}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <Button variant="outline" onClick={addLineItem} className="w-full" data-testid="button-add-item">
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Sale Value:</span>
                <span className="font-mono">₹{totals.saleValue.toFixed(2)}</span>
              </div>
              {billType === "GST" && (
                <>
                  {gstType === 0 ? (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">CGST:</span>
                        <span className="font-mono">₹{totals.cgstTotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">SGST:</span>
                        <span className="font-mono">₹{totals.sgstTotal.toFixed(2)}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">IGST:</span>
                      <span className="font-mono">₹{totals.taxValue.toFixed(2)}</span>
                    </div>
                  )}
                </>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Round Off:</span>
                <span className="font-mono">₹{totals.roundOff.toFixed(2)}</span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between font-semibold">
                  <span>Grand Total:</span>
                  <span className="font-mono text-lg">₹{totals.grandTotal.toFixed(2)}</span>
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Qty:</span>
                <span className="font-mono">{totals.totalQty}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select
                  value={paymentMethod}
                  onValueChange={(v) => setPaymentMethod(v as "cash" | "card")}
                >
                  <SelectTrigger data-testid="select-payment-method">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amountGiven">Amount Given</Label>
                <Input
                  id="amountGiven"
                  type="number"
                  value={amountGiven}
                  onFocus={(e) => e.target.select()}
              onChange={(e) => setAmountGiven(parseFloat(e.target.value) || 0)}
                  onFocus={(e) => e.currentTarget.select()}
                  data-testid="input-amount-given"
                />
              </div>
              {totals.amountReturn > 0 && (
                <div className="flex justify-between text-sm p-2 bg-muted rounded">
                  <span>Return:</span>
                  <span className="font-mono font-medium">₹{totals.amountReturn.toFixed(2)}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
