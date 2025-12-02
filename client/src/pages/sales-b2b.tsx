import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useKeyboardNavigation } from "@/hooks/useKeyboardNavigation";
import { SelectOption } from "@/components/select-option";
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
import { Plus, Trash2, Save, Barcode, AlertCircle } from "lucide-react";
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
  const { shouldAutoPrint } = usePrintSettings();
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const formContainerRef = useRef<HTMLDivElement>(null);
  useKeyboardNavigation(formContainerRef);

  useEffect(() => {
    dateInputRef.current?.focus();
  }, []);
  
  const [selectedPartyId, setSelectedPartyId] = useState<number | null>(null);
  const [gstType, setGstType] = useState<0 | 1>(0);
  const [inclusiveTax, setInclusiveTax] = useState(false);
  const [lineItems, setLineItems] = useState<SaleLineItem[]>([]);
  const [invoiceDate, setInvoiceDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [barcodeInput, setBarcodeInput] = useState("");
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
      const response = await apiRequest("GET", `/api/inventory/barcode/${encodeURIComponent(barcodeInput.trim())}`);
      const data: any = await response.json();
      
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
      } else {
        const totalQtyInBill = lineItems
          .filter(item => item.barcode === data.barcode || (item.itemId === data.itemId && item.stockInwardId === data.stockInwardId))
          .reduce((sum, item) => sum + parseFloat(item.quantity.toString()), 0);
        
        const availableStock = parseFloat(data.stockQty) || 1;
        if (totalQtyInBill >= availableStock) {
          toast({
            title: "Insufficient Stock",
            description: `Only ${availableStock} units available. Already added: ${totalQtyInBill}`,
            variant: "destructive",
          });
          setBarcodeInput("");
          return;
        }
      }
      
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

    let amount = qty * rate;
    const discountAmount = amount * (discountPercent / 100);
    amount = amount - discountAmount;
    item.discount = discountAmount;

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
            const itemId = parseInt(value);
            const stock = stockInfo[itemId];
            
            if (stock && stock.isBarcoded && updated.quantity === 1) {
              const alreadyAdded = lineItems.some(item => item.itemId === itemId && item.tempId !== tempId);
              if (alreadyAdded) {
                toast({
                  title: "Barcode Already Used",
                  description: `${selectedItem.name} has already been added once`,
                  variant: "destructive",
                });
                return item;
              }
            }
            
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
          stockInwardId: item.stockInwardId,
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

      const response = await apiRequest("POST", "/api/sales", saleData);
      return response.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stock"] });
      
      toast({
        title: "Success",
        description: "B2B Credit Invoice saved successfully",
      });

      const printParam = shouldAutoPrint("B2B") ? "?print=auto" : "";
      window.open(`/invoice/${data.id}${printParam}`, '_blank');
      
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
    <div ref={formContainerRef} className="p-4 space-y-4 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">B2B SALES (CREDIT)</h1>
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending || lineItems.length === 0 || !selectedPartyId}
          size="lg"
          data-testid="button-save-b2b-sale"
        >
          <Save className="mr-2 h-4 w-4" />
          {saveMutation.isPending ? "Saving..." : "Save & Print"}
        </Button>
      </div>

      {/* Form Section */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          {/* Top Row - Invoice Details */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Invoice Date</Label>
              <Input
                ref={dateInputRef}
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="text-sm"
                data-testid="input-invoice-date"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Tax Type</Label>
              <Select value={gstType.toString()} onValueChange={(v) => setGstType(parseInt(v) as 0 | 1)}>
                <SelectTrigger className="text-sm" data-testid="select-gst-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Local (CGST+SGST)</SelectItem>
                  <SelectItem value="1">Inter-State (IGST)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 flex items-end gap-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="inclusive-tax"
                  checked={inclusiveTax}
                  onCheckedChange={(v) => setInclusiveTax(v as boolean)}
                  data-testid="switch-inclusive-tax"
                />
                <Label htmlFor="inclusive-tax" className="text-xs">Tax Incl.</Label>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Customer *</Label>
              <SelectOption
                items={parties || []}
                selectedId={selectedPartyId}
                onSelect={setSelectedPartyId}
                placeholder="Select customer"
                getLabel={(p) => `${p.name} - ${p.city || ''}`}
                testId="input-party-search"
              />
            </div>
          </div>

          {/* Outstanding Alert */}
          {selectedParty && partyOutstanding !== 0 && (
            <Alert variant={partyOutstanding > 0 ? "destructive" : "default"} className="py-2">
              <AlertCircle className="h-3 w-3" />
              <AlertDescription className="text-xs flex items-center justify-between gap-4">
                <span>
                  Outstanding: <strong>₹{partyOutstanding.toFixed(2)}</strong>
                  {partyOutstanding > 0 ? " (Receivable)" : " (Payable)"}
                </span>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="print-outstanding"
                    checked={printOutstanding}
                    onCheckedChange={(v) => setPrintOutstanding(v as boolean)}
                    data-testid="checkbox-print-outstanding"
                  />
                  <Label htmlFor="print-outstanding" className="text-xs">Print on Invoice</Label>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Barcode Scan */}
          <div className="flex gap-2">
            <Input
              ref={barcodeInputRef}
              placeholder="Scan or enter barcode..."
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleBarcodeSearch()}
              className="text-sm"
              data-testid="input-barcode"
            />
            <Button size="sm" onClick={handleBarcodeSearch} data-testid="button-barcode-search">
              <Barcode className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={addLineItem} variant="outline" data-testid="button-add-line-item">
              <Plus className="h-4 w-4" />
              Add Item
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Items Table */}
      <div className="border rounded-lg overflow-x-auto">
        <Table className="text-sm">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">Item</TableHead>
              <TableHead className="w-[60px]">HSN</TableHead>
              <TableHead className="w-[50px]">Qty</TableHead>
              <TableHead className="w-[70px]">Rate</TableHead>
              <TableHead className="w-[50px]">Disc%</TableHead>
              <TableHead className="w-[50px]">Tax%</TableHead>
              <TableHead className="w-[80px] text-right">Amount</TableHead>
              <TableHead className="w-[50px]">Stock</TableHead>
              <TableHead className="w-[40px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lineItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground py-6">
                  Scan barcode or click "Add Item" to start
                </TableCell>
              </TableRow>
            ) : (
              lineItems.map((item) => (
                <TableRow key={item.tempId} className="text-xs">
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
                        <SelectTrigger className="text-xs" data-testid={`select-item-${item.tempId}`}>
                          <SelectValue placeholder="Select" />
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
                  <TableCell className="text-xs">{item.hsnCode}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="1"
                      step="1"
                      value={item.quantity}
                      onChange={(e) => updateLineItem(item.tempId, "quantity", parseFloat(e.target.value) || 0)}
                      className="w-14 text-xs"
                      data-testid={`input-qty-${item.tempId}`}
                    />
                  </TableCell>
                  <TableCell>
                    {item.isFromBarcode ? (
                      <span className="font-mono text-xs">₹{item.rate.toFixed(2)}</span>
                    ) : (
                      <Input
                        type="number"
                        step="0.01"
                        value={item.rate}
                        onChange={(e) => updateLineItem(item.tempId, "rate", parseFloat(e.target.value) || 0)}
                        className="w-16 text-xs"
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
                      className="w-12 text-xs"
                      data-testid={`input-discount-${item.tempId}`}
                    />
                  </TableCell>
                  <TableCell className="text-xs">{item.taxRate}%</TableCell>
                  <TableCell className="text-right font-medium">
                    ₹{(item.saleValue + item.taxValue).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    {item.stockQty !== null && (
                      <Badge variant={item.stockQty < item.quantity ? "destructive" : "secondary"} className="text-xs">
                        {item.stockQty}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeLineItem(item.tempId)}
                      className="h-6 w-6"
                      data-testid={`button-remove-${item.tempId}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Summary Footer */}
      <Card className="bg-muted">
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-4 text-sm">
            <div>
              <span className="text-xs text-muted-foreground">Total Qty</span>
              <p className="font-bold text-lg">{totals.totalQty.toFixed(3)}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Sale Value</span>
              <p className="font-bold">₹{totals.saleValue.toFixed(2)}</p>
            </div>
            {totals.discountTotal > 0 && (
              <div>
                <span className="text-xs text-muted-foreground">Discount</span>
                <p className="font-bold text-green-600">-₹{totals.discountTotal.toFixed(2)}</p>
              </div>
            )}
            <div>
              <span className="text-xs text-muted-foreground">{gstType === 0 ? "CGST+SGST" : "IGST"}</span>
              <p className="font-bold">₹{totals.taxValue.toFixed(2)}</p>
            </div>
            {totals.roundOff !== 0 && (
              <div>
                <span className="text-xs text-muted-foreground">Round Off</span>
                <p className="font-bold">₹{totals.roundOff.toFixed(2)}</p>
              </div>
            )}
            <div className="border-l-2 border-background">
              <span className="text-xs text-muted-foreground">Grand Total</span>
              <p className="font-bold text-lg">₹{totals.grandTotal.toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
