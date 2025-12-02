import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { usePrintSettings } from "@/hooks/use-print-settings";
import { Plus, Trash2, Save, Barcode, Search, Printer, AlertCircle, CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format } from "date-fns";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface Party {
  id: number;
  code: string;
  name: string;
  shortname: string | null;
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
  packType: string;
}

interface DebitNoteLineItem {
  tempId: string;
  itemId: number | null;
  purchaseItemId: number | null;
  barcode: string;
  itemCode: string;
  itemName: string;
  hsnCode: string;
  quantity: number;
  rate: number;
  mrp: number;
  discount: number;
  discountPercent: number;
  amount: number;
  taxRate: number;
  cgstRate: number;
  sgstRate: number;
  saleValue: number;
  taxValue: number;
  cgst: number;
  sgst: number;
  stockQty: number | null;
}

export default function DebitNote() {
  const { toast } = useToast();
  const { shouldAutoPrint } = usePrintSettings();
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedPartyId, setSelectedPartyId] = useState<number | null>(null);
  const [gstType, setGstType] = useState<0 | 1>(0);
  const [inclusiveTax, setInclusiveTax] = useState(false);
  const [lineItems, setLineItems] = useState<DebitNoteLineItem[]>([]);
  const [invoiceDate, setInvoiceDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [barcodeInput, setBarcodeInput] = useState("");
  const [searchMode, setSearchMode] = useState<"item" | "barcode">("item");
  const [paymentMode, setPaymentMode] = useState<"CASH" | "CARD">("CASH");
  const [amountGiven, setAmountGiven] = useState<number>(0);
  const [partyOutstanding, setPartyOutstanding] = useState<number>(0);
  const [originalInvoiceNo, setOriginalInvoiceNo] = useState<string>("");
  const [reason, setReason] = useState<string>("");

  const { data: parties } = useQuery<Party[]>({
    queryKey: ["/api/parties"],
  });

  const { data: items } = useQuery<Item[]>({
    queryKey: ["/api/items"],
  });

  const { data: stock } = useQuery<any[]>({
    queryKey: ["/api/stock"],
  });

  const { data: stockInfo = {} } = useQuery<{ [key: number]: { itemId: number; availableQty: number; isBarcoded: boolean } }>({
    queryKey: ["/api/stock/info"],
  });

  const selectedParty = parties?.find((p) => p.id === selectedPartyId);

  useEffect(() => {
    if (selectedPartyId) {
      apiRequest("GET", `/api/parties/${selectedPartyId}/outstanding`)
        .then((data: any) => setPartyOutstanding(data.outstanding || 0))
        .catch(() => setPartyOutstanding(0));
    } else {
      setPartyOutstanding(0);
    }
  }, [selectedPartyId]);

  const getStockQuantity = (itemId: number | null) => {
    if (!itemId || !stock) return null;
    const stockItem = stock.find((s) => s.itemId === itemId);
    return stockItem ? parseFloat(stockItem.quantity) : 0;
  };

  const handleBarcodeSearch = async () => {
    if (!barcodeInput.trim()) return;

    try {
      const data: any = await apiRequest("GET", `/api/inventory/barcode/${encodeURIComponent(barcodeInput.trim())}`);
      
      // Check if this barcode item (qty=1) is already in the bill
      if (data.stockQty === 1) {
        const alreadyAdded = lineItems.some(item => item.barcode === data.barcode || (item.itemId === data.itemId && item.quantity === 1));
        if (alreadyAdded) {
          toast({
            title: "Barcode Already Used",
            description: `${data.itemName} (${data.barcode}) has already been added to this bill`,
            variant: "destructive",
          });
          setBarcodeInput("");
          return;
        }
      }
      
      const newItem: DebitNoteLineItem = {
        tempId: Date.now().toString(),
        itemId: data.itemId,
        purchaseItemId: data.purchaseItemId,
        barcode: data.barcode || "",
        itemCode: "",
        itemName: data.itemName || "",
        hsnCode: data.hsnCode || "",
        quantity: 1,
        rate: inclusiveTax ? parseFloat(data.brate) : parseFloat(data.brate) / (1 + parseFloat(data.tax || "0") / 100),
        mrp: parseFloat(data.mrp) || 0,
        discount: 0,
        discountPercent: 0,
        amount: 0,
        taxRate: parseFloat(data.tax) || 0,
        cgstRate: parseFloat(data.cgst) || 0,
        sgstRate: parseFloat(data.sgst) || 0,
        saleValue: 0,
        taxValue: 0,
        cgst: 0,
        sgst: 0,
        stockQty: parseFloat(data.stockQty) || 0,
      };

      recalculateItem(newItem);
      setLineItems([...lineItems, newItem]);
      setBarcodeInput("");
      barcodeInputRef.current?.focus();
      
      toast({
        title: "Item Added",
        description: `${data.itemName} added from barcode scan`,
      });
    } catch (error) {
      toast({
        title: "Barcode Not Found",
        description: "No item found with this barcode in inventory",
        variant: "destructive",
      });
    }
  };

  const recalculateItem = (item: DebitNoteLineItem) => {
    const qty = parseFloat(item.quantity.toString()) || 0;
    const rate = parseFloat(item.rate.toString()) || 0;
    const discountPercent = parseFloat(item.discountPercent.toString()) || 0;
    const taxRate = item.taxRate || 0;

    let amount = qty * rate;
    const discount = amount * (discountPercent / 100);
    amount = amount - discount;
    item.discount = discount;

    let saleValue: number;
    let taxValue: number;

    if (inclusiveTax) {
      saleValue = amount / (1 + taxRate / 100);
      taxValue = amount - saleValue;
    } else {
      saleValue = amount;
      taxValue = saleValue * (taxRate / 100);
    }

    item.amount = inclusiveTax ? amount : saleValue;
    item.saleValue = saleValue;
    item.taxValue = taxValue;

    if (gstType === 0) {
      item.cgst = taxValue / 2;
      item.sgst = taxValue / 2;
    } else {
      item.cgst = taxValue;
      item.sgst = 0;
    }
  };

  const addLineItem = () => {
    const newItem: DebitNoteLineItem = {
      tempId: Date.now().toString(),
      itemId: null,
      purchaseItemId: null,
      barcode: "",
      itemCode: "",
      itemName: "",
      hsnCode: "",
      quantity: 1,
      rate: 0,
      mrp: 0,
      discount: 0,
      discountPercent: 0,
      amount: 0,
      taxRate: 0,
      cgstRate: 0,
      sgstRate: 0,
      saleValue: 0,
      taxValue: 0,
      cgst: 0,
      sgst: 0,
      stockQty: null,
    };
    setLineItems([...lineItems, newItem]);
  };

  const removeLineItem = (tempId: string) => {
    setLineItems(lineItems.filter((item) => item.tempId !== tempId));
  };

  const updateLineItem = (tempId: string, field: keyof DebitNoteLineItem, value: any) => {
    setLineItems(
      lineItems.map((item) => {
        if (item.tempId !== tempId) return item;

        const updated = { ...item };

        if (field === "itemId") {
          const selectedItem = items?.find((i) => i.id === parseInt(value));
          if (selectedItem) {
            updated.itemId = selectedItem.id;
            updated.itemCode = selectedItem.code;
            updated.itemName = selectedItem.name;
            updated.hsnCode = selectedItem.hsnCode || "";
            updated.rate = parseFloat(selectedItem.cost);
            updated.taxRate = parseFloat(selectedItem.tax);
            updated.cgstRate = parseFloat(selectedItem.cgst);
            updated.sgstRate = parseFloat(selectedItem.sgst);
            updated.stockQty = getStockQuantity(selectedItem.id);
          }
        } else if (field === "quantity" || field === "rate" || field === "discountPercent") {
          (updated as any)[field] = parseFloat(value) || 0;
        } else {
          (updated as any)[field] = value;
        }

        recalculateItem(updated);
        return updated;
      })
    );
  };

  useEffect(() => {
    setLineItems(
      lineItems.map((item) => {
        const updated = { ...item };
        recalculateItem(updated);
        return updated;
      })
    );
  }, [inclusiveTax, gstType]);

  const totals = lineItems.reduce(
    (acc, item) => ({
      quantity: acc.quantity + (parseFloat(item.quantity.toString()) || 0),
      saleValue: acc.saleValue + item.saleValue,
      discountTotal: acc.discountTotal + item.discount,
      taxValue: acc.taxValue + item.taxValue,
      cgstTotal: acc.cgstTotal + item.cgst,
      sgstTotal: acc.sgstTotal + item.sgst,
      grandTotal: acc.grandTotal + item.amount,
    }),
    { quantity: 0, saleValue: 0, discountTotal: 0, taxValue: 0, cgstTotal: 0, sgstTotal: 0, grandTotal: 0 }
  );

  const roundOff = Math.round(totals.grandTotal) - totals.grandTotal;
  const finalTotal = Math.round(totals.grandTotal);
  const amountReturn = amountGiven - finalTotal;

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPartyId) {
        throw new Error("Please select a party/customer for debit note");
      }
      if (lineItems.length === 0) {
        throw new Error("Please add at least one item");
      }

      const debitNoteData = {
        billType: "DN",
        saleType: "DEBIT_NOTE",
        paymentMode,
        inclusiveTax,
        date: invoiceDate,
        partyId: selectedPartyId,
        partyName: selectedParty?.name || "",
        partyCity: selectedParty?.city || "",
        partyAddress: selectedParty?.address || "",
        partyGstNo: selectedParty?.gstNo || "",
        gstType,
        saleValue: totals.saleValue,
        discountTotal: totals.discountTotal,
        taxValue: totals.taxValue,
        cgstTotal: totals.cgstTotal,
        sgstTotal: totals.sgstTotal,
        roundOff,
        grandTotal: finalTotal,
        totalQty: totals.quantity,
        amountGiven,
        amountReturn: amountReturn > 0 ? amountReturn : 0,
        byCash: paymentMode === "CASH" ? finalTotal : 0,
        byCard: paymentMode === "CARD" ? finalTotal : 0,
        printOutstanding: false,
        partyOutstanding,
        originalInvoiceNo,
        reason,
        items: lineItems.map((item) => ({
          itemId: item.itemId,
          purchaseItemId: item.purchaseItemId,
          barcode: item.barcode,
          itemCode: item.itemCode,
          itemName: item.itemName,
          hsnCode: item.hsnCode,
          quantity: item.quantity,
          rate: item.rate,
          mrp: item.mrp,
          discount: item.discount,
          discountPercent: item.discountPercent,
          amount: item.amount,
          tax: item.taxRate,
          cgst: item.cgst,
          sgst: item.sgst,
        })),
      };

      return apiRequest("POST", "/api/sales", debitNoteData);
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stock"] });
      queryClient.invalidateQueries({ queryKey: ["/api/parties", selectedPartyId, "outstanding"] });
      
      toast({
        title: "Success",
        description: "Debit Note saved successfully - stock reduced",
      });

      const printParam = shouldAutoPrint("DN") ? "?print=auto" : "";
      window.open(`/invoice/${data.id}${printParam}`, '_blank');
      
      setLineItems([]);
      setSelectedPartyId(null);
      setAmountGiven(0);
      setOriginalInvoiceNo("");
      setReason("");
      barcodeInputRef.current?.focus();
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
          <h1 className="text-3xl font-semibold tracking-tight">Debit Note (Damage/Loss)</h1>
          <p className="text-muted-foreground mt-2">
            Issue debit notes for damaged items and stock loss - reduces inventory
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || lineItems.length === 0 || !selectedPartyId}
            data-testid="button-save-debit-note"
          >
            <Save className="mr-2 h-4 w-4" />
            {saveMutation.isPending ? "Saving..." : "Save & Print"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Debit Note Details
              </CardTitle>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label htmlFor="inclusive-tax" className="text-sm">Tax Inclusive</Label>
                  <Switch
                    id="inclusive-tax"
                    checked={inclusiveTax}
                    onCheckedChange={setInclusiveTax}
                    data-testid="switch-inclusive-tax"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="invoiceDate">Date</Label>
                <Input
                  id="invoiceDate"
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  data-testid="input-invoice-date"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="party">Party/Vendor *</Label>
                <Select
                  value={selectedPartyId?.toString() || ""}
                  onValueChange={(v) => setSelectedPartyId(parseInt(v))}
                >
                  <SelectTrigger id="party" data-testid="select-party">
                    <SelectValue placeholder="Select Party" />
                  </SelectTrigger>
                  <SelectContent>
                    {parties?.map((party) => (
                      <SelectItem key={party.id} value={party.id.toString()}>
                        {party.name} - {party.city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason">Reason *</Label>
                <Input
                  id="reason"
                  placeholder="Damage, Loss, Expired, etc"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  data-testid="input-reason"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="originalInvoice">Original Invoice No.</Label>
                <Input
                  id="originalInvoice"
                  placeholder="Reference Bill (optional)"
                  value={originalInvoiceNo}
                  onChange={(e) => setOriginalInvoiceNo(e.target.value)}
                  data-testid="input-original-invoice"
                />
              </div>
            </div>

            {selectedParty && (
              <div className="p-3 border rounded-md bg-muted/50">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="text-sm">
                    <span className="font-medium">{selectedParty.name}</span>
                    {selectedParty.city && <span className="text-muted-foreground"> - {selectedParty.city}</span>}
                    {selectedParty.gstNo && <span className="text-muted-foreground ml-2">(GST: {selectedParty.gstNo})</span>}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/50">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={searchMode === "barcode" ? "default" : "outline"}
                  onClick={() => {
                    setSearchMode("barcode");
                    setTimeout(() => barcodeInputRef.current?.focus(), 100);
                  }}
                  data-testid="button-search-mode-barcode"
                >
                  <Barcode className="mr-1 h-3 w-3" />
                  Barcode Scan
                </Button>
                <Button
                  size="sm"
                  variant={searchMode === "item" ? "default" : "outline"}
                  onClick={() => setSearchMode("item")}
                  data-testid="button-search-mode-item"
                >
                  <Search className="mr-1 h-3 w-3" />
                  Item Search
                </Button>
              </div>
              {searchMode === "barcode" && (
                <div className="flex-1 flex gap-2">
                  <Input
                    ref={barcodeInputRef}
                    placeholder="Scan barcode..."
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleBarcodeSearch()}
                    className="flex-1"
                    autoFocus
                    data-testid="input-barcode"
                  />
                  <Button onClick={handleBarcodeSearch} data-testid="button-barcode-add">
                    Add
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Damaged/Lost Items ({lineItems.length})</Label>
                {searchMode === "item" && (
                  <Button size="sm" onClick={addLineItem} data-testid="button-add-line-item">
                    <Plus className="mr-1 h-3 w-3" />
                    Add Item
                  </Button>
                )}
              </div>

              <div className="border rounded-md overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Item</TableHead>
                      <TableHead className="w-[70px]">Stock</TableHead>
                      <TableHead className="w-[70px]">Qty</TableHead>
                      <TableHead className="w-[90px]">Rate</TableHead>
                      <TableHead className="w-[70px]">Disc%</TableHead>
                      <TableHead className="w-[100px] text-right">Amount</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lineItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          Add items to create debit note
                        </TableCell>
                      </TableRow>
                    ) : (
                      lineItems.map((item) => (
                        <TableRow key={item.tempId}>
                          <TableCell>
                            {item.barcode ? (
                              <div>
                                <div className="font-medium">{item.itemName}</div>
                                <div className="text-xs text-muted-foreground">BC: {item.barcode}</div>
                              </div>
                            ) : (
                              <Select
                                value={item.itemId?.toString() || ""}
                                onValueChange={(v) => updateLineItem(item.tempId, "itemId", v)}
                              >
                                <SelectTrigger data-testid={`select-item-${item.tempId}`}>
                                  <SelectValue placeholder="Select item" />
                                </SelectTrigger>
                                <SelectContent>
                                  {items?.map((i) => (
                                    <SelectItem key={i.id} value={i.id.toString()}>
                                      {i.name} ({i.code})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </TableCell>
                          <TableCell>
                            {item.stockQty !== null && (
                              <Badge variant={item.stockQty < item.quantity ? "destructive" : "secondary"}>
                                {item.stockQty}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0.01"
                              step="0.01"
                              value={item.quantity}
                              onChange={(e) => updateLineItem(item.tempId, "quantity", e.target.value)}
                              className="w-16"
                              data-testid={`input-qty-${item.tempId}`}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.rate}
                              onChange={(e) => updateLineItem(item.tempId, "rate", e.target.value)}
                              className="w-20"
                              data-testid={`input-rate-${item.tempId}`}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              value={item.discountPercent}
                              onChange={(e) => updateLineItem(item.tempId, "discountPercent", e.target.value)}
                              className="w-16"
                              data-testid={`input-disc-${item.tempId}`}
                            />
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ₹{item.amount.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeLineItem(item.tempId)}
                              data-testid={`button-delete-${item.tempId}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quantity:</span>
                <span className="font-medium">{totals.quantity.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sale Value:</span>
                <span className="font-medium">₹{totals.saleValue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Discount:</span>
                <span className="font-medium">₹{totals.discountTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax:</span>
                <span className="font-medium">₹{totals.taxValue.toFixed(2)}</span>
              </div>
              {gstType === 0 && (
                <>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>CGST:</span>
                    <span>₹{totals.cgstTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>SGST:</span>
                    <span>₹{totals.sgstTotal.toFixed(2)}</span>
                  </div>
                </>
              )}
              <div className="border-t pt-3 flex justify-between font-semibold">
                <span>Total:</span>
                <span>₹{finalTotal.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
