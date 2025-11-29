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
import { Plus, Trash2, Save, Barcode, Search, Printer, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { useLocation } from "wouter";

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

interface SaleLineItem {
  tempId: string;
  itemId: number | null;
  purchaseItemId: number | null;
  stockInwardId?: number | null;
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
  isFromBarcode?: boolean;
}

export default function SalesB2B() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedPartyId, setSelectedPartyId] = useState<number | null>(null);
  const [gstType, setGstType] = useState<0 | 1>(0);
  const [inclusiveTax, setInclusiveTax] = useState(false);
  const [lineItems, setLineItems] = useState<SaleLineItem[]>([]);
  const [invoiceDate, setInvoiceDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [barcodeInput, setBarcodeInput] = useState("");
  const [searchMode, setSearchMode] = useState<"item" | "barcode">("item");
  const [printOutstanding, setPrintOutstanding] = useState(true);
  const [partyOutstanding, setPartyOutstanding] = useState<number>(0);

  const { data: parties } = useQuery<Party[]>({
    queryKey: ["/api/parties"],
  });

  const { data: items } = useQuery<Item[]>({
    queryKey: ["/api/items"],
  });

  const { data: stock } = useQuery<any[]>({
    queryKey: ["/api/stock"],
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
      const response = await apiRequest("GET", `/api/inventory/barcode/${encodeURIComponent(barcodeInput.trim())}`);
      const data: any = await response.json();
      
      // Get rate from barcode data - use mrp first, then rate (selling rate from stock inward)
      const saleRate = parseFloat(data.mrp) || parseFloat(data.rate) || 0;
      
      const newItem: SaleLineItem = {
        tempId: Date.now().toString(),
        itemId: data.itemId,
        purchaseItemId: data.purchaseItemId,
        stockInwardId: data.stockInwardId,
        barcode: data.barcode || "",
        itemCode: data.itemCode || "",
        itemName: data.itemName || "",
        hsnCode: data.hsnCode || "",
        quantity: 1,
        rate: saleRate,
        mrp: parseFloat(data.mrp) || saleRate,
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
        stockQty: parseFloat(data.stockQty) || 1,
        isFromBarcode: true,
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

  const recalculateItem = (item: SaleLineItem) => {
    const qty = parseFloat(item.quantity.toString()) || 0;
    const rate = parseFloat(item.rate.toString()) || 0;
    const taxRate = parseFloat(item.taxRate.toString()) || 0;
    const discountPercent = parseFloat(item.discountPercent.toString()) || 0;

    let baseAmount = qty * rate;
    const discountAmount = baseAmount * (discountPercent / 100);
    baseAmount = baseAmount - discountAmount;
    item.discount = discountAmount;

    let saleValue: number;
    let taxValue: number;

    if (inclusiveTax) {
      saleValue = baseAmount / (1 + taxRate / 100);
      taxValue = baseAmount - saleValue;
    } else {
      saleValue = baseAmount;
      taxValue = saleValue * (taxRate / 100);
    }

    item.amount = baseAmount;
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
    setLineItems([
      ...lineItems,
      {
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
            updated.stockQty = getStockQuantity(parseInt(value));
          }
        }

        recalculateItem(updated);
        return updated;
      })
    );
  };

  useEffect(() => {
    setLineItems(
      lineItems.map((item) => {
        recalculateItem(item);
        return { ...item };
      })
    );
  }, [inclusiveTax, gstType]);

  const calculateTotals = () => {
    const totalQty = lineItems.reduce((sum, item) => sum + (parseFloat(item.quantity.toString()) || 0), 0);
    const saleValue = lineItems.reduce((sum, item) => sum + item.saleValue, 0);
    const discountTotal = lineItems.reduce((sum, item) => sum + item.discount, 0);
    const taxValue = lineItems.reduce((sum, item) => sum + item.taxValue, 0);
    const cgstTotal = lineItems.reduce((sum, item) => sum + item.cgst, 0);
    const sgstTotal = lineItems.reduce((sum, item) => sum + item.sgst, 0);
    const subTotal = saleValue + taxValue;
    const roundOff = Math.round(subTotal) - subTotal;
    const grandTotal = Math.round(subTotal);

    return {
      totalQty,
      saleValue,
      discountTotal,
      taxValue,
      cgstTotal,
      sgstTotal,
      subTotal,
      roundOff,
      grandTotal,
    };
  };

  const totals = calculateTotals();

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPartyId) {
        throw new Error("Please select a customer for B2B sale");
      }
      if (lineItems.length === 0) {
        throw new Error("Please add at least one item");
      }

      const saleData = {
        billType: "GST",
        saleType: "B2B",
        paymentMode: "CREDIT",
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
        roundOff: totals.roundOff,
        grandTotal: totals.grandTotal,
        totalQty: totals.totalQty,
        amountGiven: 0,
        amountReturn: 0,
        byCash: 0,
        byCard: 0,
        printOutstanding,
        partyOutstanding,
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
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stock"] });
      
      toast({
        title: "Success",
        description: "B2B Credit Invoice saved successfully",
      });

      window.open(`/invoice/${data.id}`, '_blank');
      
      setLineItems([]);
      setSelectedPartyId(null);
      setPartyOutstanding(0);
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
          <h1 className="text-3xl font-semibold tracking-tight">B2B Sales (Credit)</h1>
          <p className="text-muted-foreground mt-2">
            Create credit invoices for business customers with GST
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || lineItems.length === 0 || !selectedPartyId}
            data-testid="button-save-b2b-sale"
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
              <CardTitle>Invoice Details</CardTitle>
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
                <Badge variant="secondary">Credit Sale</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
              <div className="space-y-2 lg:col-span-2">
                <Label htmlFor="party">Customer (Required for B2B)</Label>
                <Select
                  value={selectedPartyId?.toString() || ""}
                  onValueChange={(v) => setSelectedPartyId(v ? parseInt(v) : null)}
                >
                  <SelectTrigger id="party" data-testid="select-party">
                    <SelectValue placeholder="Select business customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {parties?.map((party) => (
                      <SelectItem key={party.id} value={party.id.toString()}>
                        {party.name} {party.shortname && `(${party.shortname})`} - {party.city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedParty && partyOutstanding !== 0 && (
              <Alert variant={partyOutstanding > 0 ? "destructive" : "default"}>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>
                    Outstanding Balance: <strong className="text-lg">₹{partyOutstanding.toFixed(2)}</strong>
                    {partyOutstanding > 0 ? " (Receivable)" : " (Payable)"}
                  </span>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="print-outstanding"
                      checked={printOutstanding}
                      onCheckedChange={(checked) => setPrintOutstanding(checked as boolean)}
                      data-testid="checkbox-print-outstanding"
                    />
                    <Label htmlFor="print-outstanding" className="text-sm">Print on Invoice</Label>
                  </div>
                </AlertDescription>
              </Alert>
            )}

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
                  data-testid="button-igst"
                >
                  Inter-State (IGST)
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 border rounded-md">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={searchMode === "item" ? "default" : "outline"}
                  onClick={() => setSearchMode("item")}
                  data-testid="button-search-mode-item"
                >
                  <Search className="mr-1 h-3 w-3" />
                  Item Search
                </Button>
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
              </div>
              {searchMode === "barcode" && (
                <div className="flex-1 flex gap-2">
                  <Input
                    ref={barcodeInputRef}
                    placeholder="Scan or enter barcode..."
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleBarcodeSearch()}
                    data-testid="input-barcode"
                  />
                  <Button size="sm" onClick={handleBarcodeSearch} data-testid="button-barcode-search">
                    Add
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Items</Label>
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
                      <TableHead className="w-[80px]">HSN</TableHead>
                      <TableHead className="w-[70px]">Qty</TableHead>
                      <TableHead className="w-[90px]">Rate</TableHead>
                      <TableHead className="w-[70px]">Disc%</TableHead>
                      <TableHead className="w-[80px]">Tax%</TableHead>
                      <TableHead className="w-[100px] text-right">Amount</TableHead>
                      <TableHead className="w-[70px]">Stock</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lineItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                          {searchMode === "barcode" 
                            ? "Scan barcode to add items" 
                            : "Click 'Add Item' to start adding items"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      lineItems.map((item) => (
                        <TableRow key={item.tempId}>
                          <TableCell>
                            {item.isFromBarcode || item.barcode ? (
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
                                      {i.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{item.hsnCode}</span>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="1"
                              max={item.isFromBarcode ? (item.stockQty || 1) : undefined}
                              step="1"
                              value={item.quantity}
                              onChange={(e) => {
                                const newQty = parseFloat(e.target.value) || 0;
                                // Stock checking for barcode items
                                if (item.isFromBarcode && item.stockQty !== null && newQty > item.stockQty) {
                                  toast({
                                    title: "Stock Limit Exceeded",
                                    description: `Only ${item.stockQty} units available in stock`,
                                    variant: "destructive",
                                  });
                                  return;
                                }
                                updateLineItem(item.tempId, "quantity", newQty);
                              }}
                              className="w-16"
                              data-testid={`input-qty-${item.tempId}`}
                            />
                          </TableCell>
                          <TableCell>
                            {item.isFromBarcode ? (
                              <span className="font-mono text-sm" data-testid={`text-rate-${item.tempId}`}>
                                ₹{item.rate.toFixed(2)}
                              </span>
                            ) : (
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.rate}
                                onChange={(e) => updateLineItem(item.tempId, "rate", parseFloat(e.target.value) || 0)}
                                className="w-20"
                                data-testid={`input-rate-${item.tempId}`}
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              value={item.discountPercent}
                              onChange={(e) => updateLineItem(item.tempId, "discountPercent", parseFloat(e.target.value) || 0)}
                              className="w-16"
                              data-testid={`input-discount-${item.tempId}`}
                            />
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{item.taxRate}%</span>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ₹{(item.saleValue + item.taxValue).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            {item.stockQty !== null && (
                              <Badge variant={item.stockQty < item.quantity ? "destructive" : "secondary"}>
                                {item.stockQty}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => removeLineItem(item.tempId)}
                              data-testid={`button-remove-${item.tempId}`}
                            >
                              <Trash2 className="h-4 w-4" />
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
              <CardTitle>Bill Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Total Qty:</span>
                <span className="font-medium">{totals.totalQty.toFixed(3)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Sale Value:</span>
                <span>₹{totals.saleValue.toFixed(2)}</span>
              </div>
              {totals.discountTotal > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount:</span>
                  <span>-₹{totals.discountTotal.toFixed(2)}</span>
                </div>
              )}
              {gstType === 0 ? (
                <>
                  <div className="flex justify-between text-sm">
                    <span>CGST:</span>
                    <span>₹{totals.cgstTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>SGST:</span>
                    <span>₹{totals.sgstTotal.toFixed(2)}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between text-sm">
                  <span>IGST:</span>
                  <span>₹{totals.taxValue.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span>Round Off:</span>
                <span>₹{totals.roundOff.toFixed(2)}</span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between text-lg font-bold">
                  <span>Grand Total:</span>
                  <span>₹{totals.grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {selectedParty && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Customer Details</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                <p className="font-medium">{selectedParty.name}</p>
                {selectedParty.address && <p>{selectedParty.address}</p>}
                <p>{selectedParty.city}, {selectedParty.state}</p>
                {selectedParty.gstNo && (
                  <p className="text-muted-foreground">GSTIN: {selectedParty.gstNo}</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
