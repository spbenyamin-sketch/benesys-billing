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
import { Plus, Trash2, Save, FileText } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useLocation } from "wouter";

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

export default function SalesBilling() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [billType, setBillType] = useState<"GST" | "EST">("GST");
  const [selectedPartyId, setSelectedPartyId] = useState<number | null>(null);
  const [gstType, setGstType] = useState<0 | 1>(0); // 0=local, 1=inter-state
  const [lineItems, setLineItems] = useState<SaleLineItem[]>([]);
  const [invoiceDate, setInvoiceDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [mobile, setMobile] = useState("");
  const [amountGiven, setAmountGiven] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("cash");

  const { data: parties } = useQuery<Party[]>({
    queryKey: ["/api/parties"],
  });

  const { data: items } = useQuery<Item[]>({
    queryKey: ["/api/items"],
  });

  const { data: stock } = useQuery<any[]>({
    queryKey: ["/api/stock"],
  });

  // Helper function to get stock quantity for an item
  const getStockQuantity = (itemId: number | null) => {
    if (!itemId || !stock) return null;
    const stockItem = stock.find((s) => s.itemId === itemId);
    return stockItem ? parseFloat(stockItem.quantity) : 0;
  };

  const selectedParty = parties?.find((p) => p.id === selectedPartyId);

  // Auto-detect GST type based on party state
  useEffect(() => {
    if (selectedParty) {
      // If party state is different from company state (assuming company is local)
      // Set IGST (inter-state), otherwise CGST+SGST (local)
      // For now, default to local (0) unless party stateCode differs
      // You can enhance this with company state comparison
      setGstType(0);
    }
  }, [selectedParty]);

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

        // If item selected, populate details
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

        // Recalculate amounts
        const qty = parseFloat(updated.quantity.toString()) || 0;
        const rate = parseFloat(updated.rate.toString()) || 0;
        const taxRate = parseFloat(updated.taxRate.toString()) || 0;

        const amount = qty * rate;
        const saleValue = billType === "GST" ? amount / (1 + taxRate / 100) : amount;
        const taxValue = billType === "GST" ? amount - saleValue : 0;

        // For GST bills
        if (billType === "GST") {
          if (gstType === 0) {
            // Local: CGST + SGST
            updated.cgst = taxValue / 2;
            updated.sgst = taxValue / 2;
          } else {
            // Inter-state: IGST (stored as CGST for simplicity)
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

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (lineItems.length === 0) {
        throw new Error("Please add at least one item");
      }

      const saleData = {
        billType,
        date: invoiceDate,
        partyId: selectedPartyId,
        partyName: selectedParty?.name || "",
        partyCity: selectedParty?.city || "",
        partyAddress: selectedParty?.address || "",
        partyGstNo: selectedParty?.gstNo || "",
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

      return apiRequest("POST", "/api/sales", saleData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      toast({
        title: "Success",
        description: "Sale invoice saved successfully",
      });
      // Reset form
      setLineItems([]);
      setSelectedPartyId(null);
      setAmountGiven(0);
      setMobile("");
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">New Sale Invoice</h1>
          <p className="text-muted-foreground mt-2">
            Create GST or estimate invoice with automatic tax calculations
          </p>
        </div>
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending || lineItems.length === 0}
          data-testid="button-save-sale"
        >
          <Save className="mr-2 h-4 w-4" />
          {saveMutation.isPending ? "Saving..." : "Save Invoice"}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Invoice Details</CardTitle>
              <Tabs value={billType} onValueChange={(v) => setBillType(v as "GST" | "EST")}>
                <TabsList>
                  <TabsTrigger value="GST" data-testid="tab-gst">GST Bill</TabsTrigger>
                  <TabsTrigger value="EST" data-testid="tab-est">Estimate</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
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
                <Label htmlFor="party">Customer (Optional)</Label>
                <Select
                  value={selectedPartyId?.toString() || ""}
                  onValueChange={(v) => setSelectedPartyId(v ? parseInt(v) : null)}
                >
                  <SelectTrigger id="party" data-testid="select-party">
                    <SelectValue placeholder="Select customer or leave for cash sale" />
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

            {billType === "GST" && (
              <div className="flex items-center gap-4 p-3 bg-muted rounded-md">
                <Label>Tax Type:</Label>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={gstType === 0 ? "default" : "outline"}
                    onClick={() => setGstType(0)}
                    data-testid="button-local-gst"
                  >
                    Local (CGST + SGST)
                  </Button>
                  <Button
                    size="sm"
                    variant={gstType === 1 ? "default" : "outline"}
                    onClick={() => setGstType(1)}
                    data-testid="button-inter-state-gst"
                  >
                    Inter-State (IGST)
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Items</Label>
                <Button size="sm" onClick={addLineItem} data-testid="button-add-line-item">
                  <Plus className="mr-1 h-3 w-3" />
                  Add Item
                </Button>
              </div>

              <div className="border rounded-md overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Item</TableHead>
                      <TableHead className="w-[100px]">HSN</TableHead>
                      <TableHead className="w-[80px]">Stock</TableHead>
                      <TableHead className="w-[100px]">Qty</TableHead>
                      <TableHead className="w-[100px]">Rate</TableHead>
                      {billType === "GST" && <TableHead className="w-[80px]">Tax%</TableHead>}
                      <TableHead className="w-[120px] text-right">Amount</TableHead>
                      <TableHead className="w-[60px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lineItems.map((lineItem) => (
                      <TableRow key={lineItem.tempId}>
                        <TableCell>
                          <Select
                            value={lineItem.itemId?.toString() || ""}
                            onValueChange={(v) => updateLineItem(lineItem.tempId, "itemId", Number(v))}
                          >
                            <SelectTrigger data-testid={`select-item-${lineItem.tempId}`}>
                              <SelectValue placeholder="Select item" />
                            </SelectTrigger>
                            <SelectContent>
                              {items?.map((item) => (
                                <SelectItem key={item.id} value={item.id.toString()}>
                                  {item.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            value={lineItem.hsnCode}
                            onChange={(e) => updateLineItem(lineItem.tempId, "hsnCode", e.target.value)}
                            className="font-mono"
                            data-testid={`input-hsn-${lineItem.tempId}`}
                          />
                        </TableCell>
                        <TableCell>
                          {lineItem.itemId ? (
                            <div className="flex items-center gap-1">
                              <span className="font-mono text-sm" data-testid={`text-stock-${lineItem.tempId}`}>
                                {getStockQuantity(lineItem.itemId)?.toFixed(2) || "0.00"}
                              </span>
                              {getStockQuantity(lineItem.itemId) !== null && getStockQuantity(lineItem.itemId)! < 10 && (
                                <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200">
                                  Low
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.001"
                            value={lineItem.quantity}
                            onChange={(e) => updateLineItem(lineItem.tempId, "quantity", e.target.value)}
                            className="font-mono"
                            data-testid={`input-qty-${lineItem.tempId}`}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            value={lineItem.rate}
                            onChange={(e) => updateLineItem(lineItem.tempId, "rate", e.target.value)}
                            className="font-mono"
                            data-testid={`input-rate-${lineItem.tempId}`}
                          />
                        </TableCell>
                        {billType === "GST" && (
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              value={lineItem.taxRate}
                              onChange={(e) => updateLineItem(lineItem.tempId, "taxRate", e.target.value)}
                              className="font-mono"
                              data-testid={`input-tax-${lineItem.tempId}`}
                            />
                          </TableCell>
                        )}
                        <TableCell className="text-right font-mono">
                          ₹{lineItem.amount.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => removeLineItem(lineItem.tempId)}
                            data-testid={`button-remove-${lineItem.tempId}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {lineItems.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={billType === "GST" ? 7 : 6} className="text-center py-8 text-muted-foreground">
                          Click "Add Item" to start adding products
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="mobile">Mobile (Optional)</Label>
                <Input
                  id="mobile"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  data-testid="input-mobile"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment">Payment Method</Label>
                <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as "cash" | "card")}>
                  <SelectTrigger id="payment" data-testid="select-payment-method">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Qty:</span>
              <span className="font-mono font-medium" data-testid="text-total-qty">
                {totals.totalQty.toFixed(3)}
              </span>
            </div>

            {billType === "GST" && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sale Value:</span>
                  <span className="font-mono" data-testid="text-sale-value">
                    ₹{totals.saleValue.toFixed(2)}
                  </span>
                </div>

                {gstType === 0 ? (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">CGST:</span>
                      <span className="font-mono" data-testid="text-cgst">
                        ₹{totals.cgstTotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">SGST:</span>
                      <span className="font-mono" data-testid="text-sgst">
                        ₹{totals.sgstTotal.toFixed(2)}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">IGST:</span>
                    <span className="font-mono" data-testid="text-igst">
                      ₹{totals.cgstTotal.toFixed(2)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax Value:</span>
                  <span className="font-mono" data-testid="text-tax-value">
                    ₹{totals.taxValue.toFixed(2)}
                  </span>
                </div>
              </>
            )}

            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Round Off:</span>
              <span className="font-mono" data-testid="text-round-off">
                ₹{totals.roundOff.toFixed(2)}
              </span>
            </div>

            <div className="border-t pt-3">
              <div className="flex justify-between">
                <span className="font-semibold">Grand Total:</span>
                <span className="text-xl font-semibold font-mono" data-testid="text-grand-total">
                  ₹{totals.grandTotal.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="border-t pt-3 space-y-2">
              <div className="space-y-2">
                <Label htmlFor="amountGiven">Amount Given</Label>
                <Input
                  id="amountGiven"
                  type="number"
                  step="0.01"
                  value={amountGiven}
                  onChange={(e) => setAmountGiven(parseFloat(e.target.value) || 0)}
                  className="font-mono"
                  data-testid="input-amount-given"
                />
              </div>

              {amountGiven > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Return:</span>
                  <span className="font-mono font-medium" data-testid="text-amount-return">
                    ₹{totals.amountReturn.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
