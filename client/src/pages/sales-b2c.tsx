import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useKeyboardNavigation } from "@/hooks/useKeyboardNavigation";
import { SearchableSelect } from "@/components/searchable-select";
import { PartySearchModal } from "@/components/party-search-modal";
import { ItemSearchModal } from "@/components/item-search-modal";
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
import { useAuth } from "@/hooks/useAuth";
import { Plus, Trash2, Save, Barcode, Search, CreditCard, Banknote } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useLocation } from "wouter";

interface Party {
  id: number;
  code: string;
  name: string;
  city: string | null;
}

interface Item {
  id: number;
  code: string;
  name: string;
  hsnCode: string | null;
  cost: string;
  sellingPrice: string;
  tax: string;
  cgst: string;
  sgst: string;
  packType: string;
}

interface SaleLineItem {
  tempId: string;
  itemId: number | null;
  purchaseItemId: number | null;
  stockInwardId: number | null;
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
  isFromBarcode: boolean;
}

export default function SalesB2C() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { shouldAutoPrint, shouldDirectPrint } = usePrintSettings();
  const { user } = useAuth();
  const canDeleteBill = user?.role === "admin" || user?.role === "superadmin";
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const formContainerRef = useRef<HTMLDivElement>(null);
  useKeyboardNavigation(formContainerRef);

  useEffect(() => {
    dateInputRef.current?.focus();
  }, []);
  
  const [selectedPartyId, setSelectedPartyId] = useState<number | null>(null);
  const [paymentMode, setPaymentMode] = useState<"CASH" | "CARD">("CASH");
  const [gstType, setGstType] = useState<0 | 1>(0);
  const [inclusiveTax, setInclusiveTax] = useState(true);
  const [lineItems, setLineItems] = useState<SaleLineItem[]>([]);
  const [invoiceDate, setInvoiceDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [barcodeInput, setBarcodeInput] = useState("");
  const [searchMode, setSearchMode] = useState<"item" | "barcode">("barcode");
  const [mobile, setMobile] = useState("");
  const [amountGiven, setAmountGiven] = useState(0);
  const [showPartySearch, setShowPartySearch] = useState(false);
  const [showItemSearch, setShowItemSearch] = useState(false);
  const [selectedLineItemTempId, setSelectedLineItemTempId] = useState<string | null>(null);

  const { data: parties, isLoading: partiesLoading } = useQuery<Party[]>({
    queryKey: ["/api/parties"],
  });

  const { data: items, isLoading: itemsLoading } = useQuery<Item[]>({
    queryKey: ["/api/items"],
  });

  const { data: stock } = useQuery<any[]>({
    queryKey: ["/api/stock"],
  });

  const { data: stockInfo = {} } = useQuery<{ [key: number]: { itemId: number; availableQty: number; isBarcoded: boolean } }>({
    queryKey: ["/api/stock/info"],
  });

  const selectedParty = parties?.find((p) => p.id === selectedPartyId);

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
      
      // Check if item is already sold
      if (data.soldAt) {
        toast({
          title: "Item Already Sold",
          description: `${data.itemName} (${data.barcode}) has already been sold and cannot be scanned again`,
          variant: "destructive",
        });
        setBarcodeInput("");
        return;
      }
      
      // Unique barcode (qty=1): Can only scan once per bill
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
        // Bundle barcode (qty > 1): Validate total quantity doesn't exceed available stock
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
      
      // Get rate from barcode data - use mrp first, then rate (selling rate from stock inward)
      const saleRate = Math.round(parseFloat(data.rate) || parseFloat(data.mrp) || 0);
      
      const newItem: SaleLineItem = {
        tempId: Date.now().toString(),
        itemId: data.itemId,
        purchaseItemId: data.purchaseItemId,
        stockInwardId: data.stockInwardId,
        barcode: data.barcode || "",
        itemCode: "",
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
        stockQty: 1,
        isFromBarcode: true,
      };

      recalculateItem(newItem);
      setLineItems([...lineItems, newItem]);
      setBarcodeInput("");
      barcodeInputRef.current?.focus();
      
      toast({
        title: "Item Added",
        description: `${data.itemName} - ₹${saleRate.toFixed(2)}`,
      });
    } catch (error) {
      toast({
        title: "Barcode Not Found",
        description: "No item found with this barcode",
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
      // When tax inclusive: given amount INCLUDES tax
      // saleValue = amount / (1 + taxRate/100)
      // taxValue = amount - saleValue
      saleValue = amount / (1 + taxRate / 100);
      taxValue = amount - saleValue;
    } else {
      // When tax exclusive: given amount is BEFORE tax
      // saleValue = amount (no tax included)
      // taxValue = saleValue * (taxRate/100)
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
        stockInwardId: null,
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
        isFromBarcode: false,
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
            
            // Validate stock for barcode items (qty=1)
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
            updated.rate = Math.round(parseFloat(selectedItem.sellingPrice || selectedItem.cost));
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
    const amountReturn = amountGiven > 0 ? amountGiven - grandTotal : 0;

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
      amountReturn,
    };
  };

  const totals = calculateTotals();

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (lineItems.length === 0) {
        throw new Error("Please add at least one item");
      }
      if (totals.grandTotal <= 0) {
        throw new Error("Total amount must be greater than zero");
      }

      const saleData = {
        billType: "GST",
        saleType: "B2C",
        paymentMode,
        inclusiveTax,
        date: invoiceDate,
        partyId: selectedPartyId,
        partyName: selectedParty?.name || "",
        partyCity: selectedParty?.city || "",
        partyAddress: "",
        partyGstNo: "",
        gstType,
        saleValue: totals.saleValue,
        discountTotal: totals.discountTotal,
        taxValue: totals.taxValue,
        cgstTotal: totals.cgstTotal,
        sgstTotal: totals.sgstTotal,
        roundOff: totals.roundOff,
        grandTotal: totals.grandTotal,
        totalQty: totals.totalQty,
        amountGiven: paymentMode === "CASH" ? amountGiven : totals.grandTotal,
        amountReturn: paymentMode === "CASH" ? totals.amountReturn : 0,
        byCash: paymentMode === "CASH" ? totals.grandTotal : 0,
        byCard: paymentMode === "CARD" ? totals.grandTotal : 0,
        printOutstanding: false,
        partyOutstanding: 0,
        mobile,
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
        description: "Retail sale saved successfully",
      });

      // If direct print enabled, use silent print mode (tab closes after printing)
      // Otherwise use auto-print mode if enabled
      const printParam = shouldDirectPrint("B2C") ? "?silent-print=true" : shouldAutoPrint("B2C") ? "?print=auto" : "";
      window.open(`/invoice/${data.id}${printParam}`, '_blank');
      
      setLineItems([]);
      setSelectedPartyId(null);
      setAmountGiven(0);
      setMobile("");
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
    <div ref={formContainerRef} className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">B2C Retail Sales</h1>
          <p className="text-muted-foreground mt-2">
            Quick retail billing with cash/card payment
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || lineItems.length === 0 || totals.grandTotal <= 0}
            data-testid="button-save-b2c-sale"
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
              <CardTitle>Quick Bill</CardTitle>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label htmlFor="inclusive-tax" className="text-sm">Tax Inclusive</Label>
                  <Switch
                    id="inclusive-tax"
                    checked={inclusiveTax}
                    onCheckedChange={setInclusiveTax}
                    data-testid="switch-inclusive-tax"
                  tabIndex={-1}
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
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
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="party">Customer (Optional)</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 justify-start text-left h-9"
                    onClick={() => setShowPartySearch(true)}
                    data-testid="button-search-party"
                  tabIndex={-1}
                  >
                    {selectedParty ? (
                      <div className="flex flex-col items-start">
                        <span className="font-medium text-sm">{selectedParty.code}</span>
                        <span className="text-xs text-muted-foreground">{selectedParty.name}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Click to search customer...</span>
                    )}
                  </Button>
                  {selectedParty && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedPartyId(null)}
                      data-testid="button-clear-party"
                    tabIndex={-1}
                    >
                      Clear
                    </Button>
                  )}
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => setSelectedPartyId(null)}
                  data-testid="button-walkin-b2c"
                >
                  Walk-in Customer
                </Button>
              </div>
            </div>

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
                  tabIndex={-1}
                >
                  <Barcode className="mr-1 h-3 w-3" />
                  Barcode Scan
                </Button>
                <Button
                  size="sm"
                  variant={searchMode === "item" ? "default" : "outline"}
                  onClick={() => setSearchMode("item")}
                  data-testid="button-search-mode-item"
                  tabIndex={-1}
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
                <Label>Items ({lineItems.length})</Label>
                {searchMode === "item" && (
                  <Button 
                    size="sm" 
                    onClick={() => {
                      const newLineItem = {
                        tempId: Date.now().toString(),
                        itemId: null,
                        purchaseItemId: null,
                        stockInwardId: null,
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
                        isFromBarcode: false,
                      };
                      setLineItems([...lineItems, newLineItem]);
                      setSelectedLineItemTempId(newLineItem.tempId);
                      setShowItemSearch(true);
                    }}
                    data-testid="button-add-line-item"
                  >
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
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          Scan barcode to add items
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
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="w-full justify-start text-left h-8"
                                onClick={() => {
                                  setSelectedLineItemTempId(item.tempId);
                                  setShowItemSearch(true);
                                }}
                                data-testid={`button-select-item-${item.tempId}`}
                                tabIndex={-1}
                              >
                                {item.itemName ? (
                                  <span className="text-sm">{item.itemName}</span>
                                ) : (
                                  <span className="text-muted-foreground text-sm">Click to search item...</span>
                                )}
                              </Button>
                            )}
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="1"
                              max={item.isFromBarcode ? (item.stockQty || 1) : undefined}
                              step="1"
                              value={item.quantity}
                              onFocus={(e) => e.target.select()}
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
                              tabIndex={0}
                            />
                          </TableCell>
                          <TableCell>
                            {item.isFromBarcode ? (
                              <span className="font-mono text-sm font-medium" data-testid={`text-rate-${item.tempId}`}>
                                ₹{item.rate.toFixed(2)}
                              </span>
                            ) : (
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.rate}
                                onFocus={(e) => e.target.select()}
              onChange={(e) => updateLineItem(item.tempId, "rate", parseFloat(e.target.value) || 0)}
                                className="w-20"
                                data-testid={`input-rate-${item.tempId}`}
                                tabIndex={0}
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
                              onFocus={(e) => e.target.select()}
              onChange={(e) => updateLineItem(item.tempId, "discountPercent", parseFloat(e.target.value) || 0)}
                              className="w-16"
                              data-testid={`input-discount-${item.tempId}`}
                              tabIndex={0}
                            />
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ₹{(item.saleValue + item.taxValue).toFixed(2)}
                          </TableCell>
                          <TableCell>
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
              <CardTitle>Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  variant={paymentMode === "CASH" ? "default" : "outline"}
                  onClick={() => setPaymentMode("CASH")}
                  data-testid="button-payment-cash"
                >
                  <Banknote className="mr-2 h-4 w-4" />
                  Cash
                </Button>
                <Button
                  className="flex-1"
                  variant={paymentMode === "CARD" ? "default" : "outline"}
                  onClick={() => setPaymentMode("CARD")}
                  data-testid="button-payment-card"
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Card
                </Button>
              </div>

              <div className="border-t pt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Items:</span>
                  <span>{lineItems.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total Qty:</span>
                  <span>{totals.totalQty.toFixed(0)}</span>
                </div>
                {totals.discountTotal > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount:</span>
                    <span>-₹{totals.discountTotal.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span>Tax:</span>
                  <span>₹{totals.taxValue.toFixed(2)}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between text-xl font-bold">
                    <span>Total:</span>
                    <span>₹{totals.grandTotal}</span>
                  </div>
                </div>
              </div>

              {paymentMode === "CASH" && (
                <div className="space-y-3 border-t pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount-given">Amount Received</Label>
                    <Input
                      id="amount-given"
                      type="number"
                      min="0"
                      step="1"
                      value={amountGiven || ""}
                      onFocus={(e) => e.target.select()}
              onChange={(e) => setAmountGiven(parseFloat(e.target.value) || 0)}
                      placeholder="Enter amount received"
                      className="text-lg"
                      data-testid="input-amount-given"
                    />
                  </div>
                  {amountGiven >= totals.grandTotal && totals.grandTotal > 0 && (
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="flex justify-between items-center">
                        <span className="text-green-700 dark:text-green-300 font-medium">Return:</span>
                        <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                          ₹{totals.amountReturn.toFixed(0)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="mobile">Mobile (Optional)</Label>
                <Input
                  id="mobile"
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="Customer mobile"
                  data-testid="input-mobile"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <PartySearchModal
        open={showPartySearch}
        parties={parties}
        isLoading={partiesLoading}
        onSelect={(party) => {
          setSelectedPartyId(party.id);
        }}
        onClose={() => {
          setShowPartySearch(false);
        }}
      />

      <ItemSearchModal
        open={showItemSearch}
        items={items}
        isLoading={itemsLoading}
        onSelect={(item) => {
          if (selectedLineItemTempId) {
            updateLineItem(selectedLineItemTempId, "itemId", item.id);
            setSelectedLineItemTempId(null);
          }
        }}
        onClose={() => {
          setShowItemSearch(false);
          setSelectedLineItemTempId(null);
        }}
      />
    </div>
  );
}
