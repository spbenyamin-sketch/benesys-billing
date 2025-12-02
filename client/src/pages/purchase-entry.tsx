import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { PartySearchModal } from "@/components/party-search-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, FileText, Eye, Truck, ChevronRight, Package } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Link } from "wouter";

const purchaseEntrySchema = z.object({
  date: z.string().min(1, "Date required"),
  invoiceNo: z.string().min(1, "Invoice number required"),
  partyId: z.number().nullable().optional(),
  partyName: z.string().optional(),
  city: z.string().optional(),
  amount: z.string().optional(),
  totalQty: z.string().optional(),
  cgst: z.string().optional(),
  sgst: z.string().optional(),
  igst: z.string().optional(),
  cess: z.string().optional(),
  gstType: z.enum(["local", "interstate", "exempt"]).default("local"),
  remarks: z.string().optional(),
  // Multiple tax rates for Tally-style invoicing
  val0: z.string().default("0").optional(),
  val5: z.string().default("0").optional(),
  val12: z.string().default("0").optional(),
  val18: z.string().default("0").optional(),
  val28: z.string().default("0").optional(),
  ctax0: z.string().default("0").optional(),
  ctax5: z.string().default("0").optional(),
  ctax12: z.string().default("0").optional(),
  ctax18: z.string().default("0").optional(),
  ctax28: z.string().default("0").optional(),
  stax0: z.string().default("0").optional(),
  stax5: z.string().default("0").optional(),
  stax12: z.string().default("0").optional(),
  stax18: z.string().default("0").optional(),
  stax28: z.string().default("0").optional(),
});

type PurchaseEntryForm = z.infer<typeof purchaseEntrySchema>;

interface Purchase {
  id: number;
  purchaseNo: number;
  date: string;
  invoiceNo: string | null;
  partyId: number | null;
  partyName: string | null;
  city: string | null;
  totalQty: string;
  amount: string;
  cgst: string | null;
  sgst: string | null;
  igst: string | null;
  status: string;
  stockInwardCompleted: boolean;
}

interface Party {
  id: number;
  code: string;
  name: string;
  city: string | null;
}

export default function PurchaseEntry() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("entry");
  const [gstType, setGstType] = useState<"local" | "interstate" | "exempt">("local");
  const [showPartySearch, setShowPartySearch] = useState(false);
  const [selectedPartyId, setSelectedPartyId] = useState<number | null>(null);

  const { data: parties, isLoading: partiesLoading } = useQuery<Party[]>({
    queryKey: ["/api/parties"],
  });

  const selectedParty = (parties as any)?.find((p: any) => p.id === selectedPartyId);

  const { data: purchases, isLoading: purchasesLoading } = useQuery<Purchase[]>({
    queryKey: ["/api/purchases"],
  });

  const { data: pendingPurchases, isLoading: pendingLoading } = useQuery<Purchase[]>({
    queryKey: ["/api/pending-purchases"],
  });

  const form = useForm<PurchaseEntryForm>({
    resolver: zodResolver(purchaseEntrySchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      invoiceNo: "",
      partyId: null,
      partyName: "",
      city: "",
      amount: "0",
      totalQty: "0",
      cgst: "0",
      sgst: "0",
      igst: "0",
      cess: "0",
      gstType: "local",
      remarks: "",
    },
  });

  const createPurchaseMutation = useMutation({
    mutationFn: async (data: PurchaseEntryForm) => {
      const party = (parties as any)?.find((p: any) => p.id === data.partyId);
      const convertToNumber = (val: string | undefined) => parseFloat(val || "0") || 0;
      const res = await apiRequest("POST", "/api/purchase-entries", {
        ...data,
        partyName: party?.name || data.partyName || "",
        city: party?.city || data.city || "",
        amount: convertToNumber(data.amount),
        totalQty: convertToNumber(data.totalQty),
        cgst: convertToNumber(data.cgst),
        sgst: convertToNumber(data.sgst),
        igst: convertToNumber(data.igst),
        cess: convertToNumber(data.cess),
        val0: data.val0 || "0",
        val5: data.val5 || "0",
        val12: data.val12 || "0",
        val18: data.val18 || "0",
        val28: data.val28 || "0",
        ctax0: data.ctax0 || "0",
        ctax5: data.ctax5 || "0",
        ctax12: data.ctax12 || "0",
        ctax18: data.ctax18 || "0",
        ctax28: data.ctax28 || "0",
        stax0: data.stax0 || "0",
        stax5: data.stax5 || "0",
        stax12: data.stax12 || "0",
        stax18: data.stax18 || "0",
        stax28: data.stax28 || "0",
      });
      return res.json();
    },
    onSuccess: (result: any) => {
      toast({ 
        title: "Success", 
        description: `Purchase Entry #${result.purchaseNo} created. Proceed to Stock Inward to add items.` 
      });
      queryClient.invalidateQueries({ queryKey: ["/api/purchases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pending-purchases"] });
      form.reset({
        date: new Date().toISOString().split('T')[0],
        invoiceNo: "",
        partyId: null,
        amount: "0",
        totalQty: "0",
        cgst: "0",
        sgst: "0",
        igst: "0",
        cess: "0",
        gstType: "local",
        remarks: "",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create purchase entry",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: PurchaseEntryForm) => {
    createPurchaseMutation.mutate(data);
  };

  const handlePartyChange = (partyId: string) => {
    const party = (parties as any)?.find((p: any) => p.id === parseInt(partyId));
    if (party) {
      form.setValue("partyId", party.id);
      form.setValue("partyName", party.name);
      form.setValue("city", party.city || "");
    }
  };

  const pendingCount = pendingPurchases?.length || 0;

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-page-title">Purchase Entry</h1>
            <p className="text-muted-foreground mt-1">Phase 1: Enter bill outline details</p>
          </div>
          {pendingCount > 0 && (
            <Button asChild variant="default" data-testid="button-goto-stock-inward">
              <Link href="/stock-inward">
                <Package className="mr-2 h-4 w-4" />
                Stock Inward ({pendingCount} pending)
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 max-w-lg">
            <TabsTrigger value="entry" data-testid="tab-entry">
              <Plus className="mr-2 h-4 w-4" />
              New Entry
            </TabsTrigger>
            <TabsTrigger value="pending" data-testid="tab-pending">
              <Truck className="mr-2 h-4 w-4" />
              Pending ({pendingCount})
            </TabsTrigger>
            <TabsTrigger value="list" data-testid="tab-list">
              <FileText className="mr-2 h-4 w-4" />
              All Purchases
            </TabsTrigger>
          </TabsList>

          <TabsContent value="entry" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Bill Outline Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="date">Bill Date *</Label>
                      <Input
                        id="date"
                        type="date"
                        {...form.register("date")}
                        data-testid="input-date"
                      />
                      {form.formState.errors.date && (
                        <p className="text-sm text-destructive mt-1">{form.formState.errors.date.message}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="invoiceNo">Invoice / Bill No *</Label>
                      <Input
                        id="invoiceNo"
                        {...form.register("invoiceNo")}
                        placeholder="Supplier bill number"
                        data-testid="input-invoice-no"
                      />
                      {form.formState.errors.invoiceNo && (
                        <p className="text-sm text-destructive mt-1">{form.formState.errors.invoiceNo.message}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="party">Supplier / Party</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full justify-start h-9"
                        onClick={() => setShowPartySearch(true)}
                        data-testid="button-select-party"
                      >
                        {selectedParty ? (
                          <span className="text-sm">{selectedParty.name}</span>
                        ) : (
                          <span className="text-muted-foreground text-sm">Click to search supplier...</span>
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="amount">Bill Amount</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        {...form.register("amount")}
                        placeholder="0.00"
                        data-testid="input-amount"
                      />
                    </div>
                    <div>
                      <Label htmlFor="totalQty">Total Quantity</Label>
                      <Input
                        id="totalQty"
                        type="number"
                        step="0.01"
                        {...form.register("totalQty")}
                        placeholder="0"
                        data-testid="input-qty"
                      />
                    </div>
                    <div>
                      <Label htmlFor="gstType">GST Type</Label>
                      <Select 
                        value={gstType} 
                        onValueChange={(v: "local" | "interstate" | "exempt") => {
                          setGstType(v);
                          form.setValue("gstType", v);
                          if (v === "interstate") {
                            form.setValue("cgst", "0");
                            form.setValue("sgst", "0");
                          } else if (v === "local") {
                            form.setValue("igst", "0");
                          } else {
                            form.setValue("cgst", "0");
                            form.setValue("sgst", "0");
                            form.setValue("igst", "0");
                          }
                        }}
                      >
                        <SelectTrigger data-testid="select-gst-type">
                          <SelectValue placeholder="Select GST type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="local">Local (CGST + SGST)</SelectItem>
                          <SelectItem value="interstate">Interstate (IGST)</SelectItem>
                          <SelectItem value="exempt">Exempt (No GST)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="cess">Cess</Label>
                      <Input
                        id="cess"
                        type="number"
                        step="0.01"
                        {...form.register("cess")}
                        placeholder="0.00"
                        data-testid="input-cess"
                      />
                    </div>
                  </div>

                  {gstType === "local" && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="cgst">CGST Amount</Label>
                        <Input
                          id="cgst"
                          type="number"
                          step="0.01"
                          {...form.register("cgst")}
                          placeholder="0.00"
                          data-testid="input-cgst"
                        />
                      </div>
                      <div>
                        <Label htmlFor="sgst">SGST Amount</Label>
                        <Input
                          id="sgst"
                          type="number"
                          step="0.01"
                          {...form.register("sgst")}
                          placeholder="0.00"
                          data-testid="input-sgst"
                        />
                      </div>
                    </div>
                  )}

                  {gstType === "interstate" && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="igst">IGST Amount</Label>
                        <Input
                          id="igst"
                          type="number"
                          step="0.01"
                          {...form.register("igst")}
                          placeholder="0.00"
                          data-testid="input-igst"
                        />
                      </div>
                    </div>
                  )}

                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold mb-4">Tax Rates Breakdown (Tally Import)</h3>
                    <p className="text-sm text-muted-foreground mb-4">Enter amounts before tax (Camount) for each tax rate if your bill has multiple tax rates</p>
                    <div className="grid grid-cols-5 gap-3">
                      {[0, 5, 12, 18, 28].map((rate) => (
                        <div key={`val${rate}`}>
                          <Label htmlFor={`val${rate}`} className="text-xs">0% Amount</Label>
                          <Input
                            id={`val${rate}`}
                            type="number"
                            step="0.01"
                            {...form.register(`val${rate}` as any)}
                            placeholder="0"
                            data-testid={`input-val${rate}`}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-5 gap-3 mt-4">
                      {[0, 5, 12, 18, 28].map((rate) => (
                        <div key={`ctax${rate}`}>
                          <Label htmlFor={`ctax${rate}`} className="text-xs">CGST {rate}%</Label>
                          <Input
                            id={`ctax${rate}`}
                            type="number"
                            step="0.01"
                            {...form.register(`ctax${rate}` as any)}
                            placeholder="0"
                            data-testid={`input-ctax${rate}`}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-5 gap-3 mt-4">
                      {[0, 5, 12, 18, 28].map((rate) => (
                        <div key={`stax${rate}`}>
                          <Label htmlFor={`stax${rate}`} className="text-xs">SGST {rate}%</Label>
                          <Input
                            id={`stax${rate}`}
                            type="number"
                            step="0.01"
                            {...form.register(`stax${rate}` as any)}
                            placeholder="0"
                            data-testid={`input-stax${rate}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="remarks">Remarks</Label>
                    <Input
                      id="remarks"
                      {...form.register("remarks")}
                      placeholder="Optional notes"
                      data-testid="input-remarks"
                    />
                  </div>

                  <div className="flex justify-end gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => form.reset()}
                      data-testid="button-reset"
                    >
                      Clear Form
                    </Button>
                    <Button
                      type="submit"
                      disabled={createPurchaseMutation.isPending}
                      data-testid="button-save"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      {createPurchaseMutation.isPending ? "Creating..." : "Create Entry"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Truck className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Two-Phase Purchase Workflow</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      <strong>Phase 1 (This Page):</strong> Enter bill outline details - supplier, date, bill number, amounts, GST.<br />
                      <strong>Phase 2 (Stock Inward):</strong> Select a pending entry and add detailed item information with barcode generation.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pending" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <CardTitle>Pending for Stock Inward</CardTitle>
                <Button asChild size="sm" data-testid="button-stock-inward">
                  <Link href="/stock-inward">
                    <Package className="mr-2 h-4 w-4" />
                    Open Stock Inward
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {pendingLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading pending entries...</div>
                ) : pendingPurchases && pendingPurchases.length > 0 ? (
                  <div className="border rounded-md overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Entry No</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Invoice No</TableHead>
                          <TableHead>Supplier</TableHead>
                          <TableHead>City</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-center">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingPurchases.map((purchase) => (
                          <TableRow key={purchase.id} data-testid={`row-pending-${purchase.id}`}>
                            <TableCell>
                              <Badge variant="outline">{purchase.purchaseNo}</Badge>
                            </TableCell>
                            <TableCell>
                              {purchase.date ? format(new Date(purchase.date), "dd/MM/yyyy") : "-"}
                            </TableCell>
                            <TableCell>{purchase.invoiceNo || "-"}</TableCell>
                            <TableCell>{purchase.partyName || "-"}</TableCell>
                            <TableCell>{purchase.city || "-"}</TableCell>
                            <TableCell className="text-right">
                              ₹{parseFloat(purchase.amount || "0").toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">Pending Stock Inward</Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Button variant="default" size="sm" asChild data-testid={`button-inward-${purchase.id}`}>
                                <Link href={`/stock-inward?purchaseId=${purchase.id}`}>
                                  <Package className="mr-1 h-4 w-4" />
                                  Add Items
                                </Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No pending entries. Create a new purchase entry to start.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="list" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>All Purchases</CardTitle>
              </CardHeader>
              <CardContent>
                {purchasesLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading purchases...</div>
                ) : purchases && purchases.length > 0 ? (
                  <div className="border rounded-md overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Purchase No</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Invoice No</TableHead>
                          <TableHead>Party Name</TableHead>
                          <TableHead>City</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-center">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {purchases.map((purchase) => (
                          <TableRow key={purchase.id} data-testid={`row-purchase-${purchase.id}`}>
                            <TableCell>
                              <Badge variant="outline">{purchase.purchaseNo}</Badge>
                            </TableCell>
                            <TableCell>
                              {purchase.date ? format(new Date(purchase.date), "dd/MM/yyyy") : "-"}
                            </TableCell>
                            <TableCell>{purchase.invoiceNo || "-"}</TableCell>
                            <TableCell>{purchase.partyName || "-"}</TableCell>
                            <TableCell>{purchase.city || "-"}</TableCell>
                            <TableCell className="text-right">{parseFloat(purchase.totalQty || "0").toFixed(2)}</TableCell>
                            <TableCell className="text-right">₹{parseFloat(purchase.amount || "0").toFixed(2)}</TableCell>
                            <TableCell>
                              {purchase.stockInwardCompleted ? (
                                <Badge variant="default">Completed</Badge>
                              ) : (
                                <Badge variant="secondary">Pending</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <Button variant="ghost" size="sm" asChild data-testid={`button-view-${purchase.id}`}>
                                <Link href={`/purchases/${purchase.id}`}>
                                  <Eye className="mr-1 h-4 w-4" />
                                  View
                                </Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No purchases found. Create your first purchase entry.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <PartySearchModal
          open={showPartySearch}
          parties={parties}
          isLoading={partiesLoading}
          onSelect={(party) => {
            setSelectedPartyId(party.id);
            form.setValue("partyId", party.id);
            form.setValue("partyName", party.name);
            form.setValue("city", party.city || "");
          }}
          onClose={() => setShowPartySearch(false)}
          title="Search & Select Supplier"
        />
      </div>
    </div>
  );
}
