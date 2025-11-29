import { useState, useRef } from "react";
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
import { usePrintSettings } from "@/hooks/use-print-settings";
import { Plus, Trash2, Save, Barcode, Search, FileText } from "lucide-react";
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
}

interface SaleLineItem {
  tempId: string;
  itemId: number | null;
  purchaseItemId: number | null;
  barcode: string;
  itemCode: string;
  itemName: string;
  hsnCode: string;
  quantity: number;
  rate: number;
  discount: number;
  discountPercent: number;
  amount: number;
}

export default function SalesEstimate() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { shouldAutoPrint } = usePrintSettings();
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedPartyId, setSelectedPartyId] = useState<number | null>(null);
  const [isWalkIn, setIsWalkIn] = useState(false);
  const [walkInName, setWalkInName] = useState("");
  const [lineItems, setLineItems] = useState<SaleLineItem[]>([]);
  const [invoiceDate, setInvoiceDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [barcodeInput, setBarcodeInput] = useState("");
  const [searchMode, setSearchMode] = useState<"item" | "barcode">("item");
  const [mobile, setMobile] = useState("");
  const [amountGiven, setAmountGiven] = useState(0);

  const { data: parties } = useQuery<Party[]>({
    queryKey: ["/api/parties"],
  });

  const { data: items } = useQuery<Item[]>({
    queryKey: ["/api/items"],
  });

  const selectedParty = parties?.find((p) => p.id === selectedPartyId);

  const handleBarcodeSearch = async () => {
    if (!barcodeInput.trim()) return;

    try {
      const data: any = await apiRequest("GET", `/api/inventory/barcode/${encodeURIComponent(barcodeInput.trim())}`);
      
      const newItem: SaleLineItem = {
        tempId: Date.now().toString(),
        itemId: data.itemId,
        purchaseItemId: data.purchaseItemId,
        barcode: data.barcode || "",
        itemCode: "",
        itemName: data.itemName || "",
        hsnCode: data.hsnCode || "",
        quantity: 1,
        rate: parseFloat(data.mrp) || parseFloat(data.rrate) || 0,
        discount: 0,
        discountPercent: 0,
        amount: 0,
      };

      recalculateItem(newItem);
      setLineItems([...lineItems, newItem]);
      setBarcodeInput("");
      barcodeInputRef.current?.focus();
      
      toast({
        title: "Item Added",
        description: `${data.itemName} added`,
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
    const discountPercent = parseFloat(item.discountPercent.toString()) || 0;

    let amount = qty * rate;
    const discountAmount = amount * (discountPercent / 100);
    amount = amount - discountAmount;
    item.discount = discountAmount;
    item.amount = amount;
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
        discount: 0,
        discountPercent: 0,
        amount: 0,
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
          }
        }

        recalculateItem(updated);
        return updated;
      })
    );
  };

  const calculateTotals = () => {
    const totalQty = lineItems.reduce((sum, item) => sum + (parseFloat(item.quantity.toString()) || 0), 0);
    const discountTotal = lineItems.reduce((sum, item) => sum + item.discount, 0);
    const subTotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
    const roundOff = Math.round(subTotal) - subTotal;
    const grandTotal = Math.round(subTotal);
    const amountReturn = amountGiven > 0 ? amountGiven - grandTotal : 0;

    return {
      totalQty,
      discountTotal,
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
        billType: "EST",
        saleType: "ESTIMATE",
        paymentMode: "CASH",
        inclusiveTax: false,
        date: invoiceDate,
        partyId: isWalkIn ? null : selectedPartyId,
        partyName: isWalkIn ? (walkInName || "Walk-in Customer") : (selectedParty?.name || ""),
        partyCity: isWalkIn ? "" : (selectedParty?.city || ""),
        partyAddress: "",
        partyGstNo: "",
        gstType: 0,
        saleValue: totals.subTotal,
        discountTotal: totals.discountTotal,
        taxValue: 0,
        cgstTotal: 0,
        sgstTotal: 0,
        roundOff: totals.roundOff,
        grandTotal: totals.grandTotal,
        totalQty: totals.totalQty,
        amountGiven,
        amountReturn: totals.amountReturn,
        byCash: totals.grandTotal,
        byCard: 0,
        printOutstanding: false,
        partyOutstanding: 0,
        mobile,
        items: lineItems.map((item) => ({
          itemId: item.itemId,
          purchaseItemId: item.purchaseItemId,
          barcode: item.barcode,
          itemCode: item.itemCode,
          itemName: item.itemName,
          hsnCode: item.hsnCode,
          quantity: item.quantity,
          rate: item.rate,
          mrp: 0,
          discount: item.discount,
          discountPercent: item.discountPercent,
          amount: item.amount,
          saleValue: item.amount,
          taxValue: 0,
          tax: 0,
          cgst: 0,
          sgst: 0,
          cgstRate: 0,
          sgstRate: 0,
        })),
      };

      return apiRequest("POST", "/api/sales", saleData);
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      
      toast({
        title: "Success",
        description: "Estimate saved successfully",
      });

      const printParam = shouldAutoPrint("EST") ? "?print=auto" : "";
      window.open(`/invoice/${data.id}${printParam}`, '_blank');
      
      setLineItems([]);
      setSelectedPartyId(null);
      setIsWalkIn(false);
      setWalkInName("");
      setAmountGiven(0);
      setMobile("");
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
          <h1 className="text-3xl font-semibold tracking-tight">Estimate / Quotation</h1>
          <p className="text-muted-foreground mt-2">
            Create estimate without GST (cash only)
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || lineItems.length === 0}
            data-testid="button-save-estimate"
          >
            <Save className="mr-2 h-4 w-4" />
            {saveMutation.isPending ? "Saving..." : "Save & Print"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Estimate Details</CardTitle>
              <Badge variant="outline">
                <FileText className="mr-1 h-3 w-3" />
                No Tax
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
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
                <Label htmlFor="party">Customer</Label>
                <Select
                  value={isWalkIn ? "walkin" : (selectedPartyId?.toString() || "")}
                  onValueChange={(v) => {
                    if (v === "walkin") {
                      setIsWalkIn(true);
                      setSelectedPartyId(null);
                    } else {
                      setIsWalkIn(false);
                      setWalkInName("");
                      setSelectedPartyId(v ? parseInt(v) : null);
                    }
                  }}
                >
                  <SelectTrigger id="party" data-testid="select-party">
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="walkin">Walk-in Customer</SelectItem>
                    {parties?.map((party) => (
                      <SelectItem key={party.id} value={party.id.toString()}>
                        {party.name} - {party.city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {isWalkIn && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="walkInName">Customer Name (Optional)</Label>
                  <Input
                    id="walkInName"
                    placeholder="Enter customer name"
                    value={walkInName}
                    onChange={(e) => setWalkInName(e.target.value)}
                    data-testid="input-walkin-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mobile">Mobile (Optional)</Label>
                  <Input
                    id="mobile"
                    type="tel"
                    placeholder="Enter mobile number"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    data-testid="input-mobile"
                  />
                </div>
              </div>
            )}

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
                    placeholder="Scan barcode..."
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleBarcodeSearch()}
                    className="flex-1"
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
                      <TableHead className="w-[250px]">Item</TableHead>
                      <TableHead className="w-[80px]">Qty</TableHead>
                      <TableHead className="w-[100px]">Rate</TableHead>
                      <TableHead className="w-[80px]">Disc%</TableHead>
                      <TableHead className="w-[100px] text-right">Amount</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lineItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          Add items to create estimate
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
                            <Input
                              type="number"
                              min="0"
                              step="0.001"
                              value={item.quantity}
                              onChange={(e) => updateLineItem(item.tempId, "quantity", parseFloat(e.target.value) || 0)}
                              className="w-16"
                              data-testid={`input-qty-${item.tempId}`}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.rate}
                              onChange={(e) => updateLineItem(item.tempId, "rate", parseFloat(e.target.value) || 0)}
                              className="w-20"
                              data-testid={`input-rate-${item.tempId}`}
                            />
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
                          <TableCell className="text-right font-medium">
                            ₹{item.amount.toFixed(2)}
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
              <CardTitle>Payment (Cash Only)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Total Qty:</span>
                  <span>{totals.totalQty.toFixed(3)}</span>
                </div>
                {totals.discountTotal > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount:</span>
                    <span>-₹{totals.discountTotal.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span>Round Off:</span>
                  <span>₹{totals.roundOff.toFixed(2)}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between text-xl font-bold">
                    <span>Total:</span>
                    <span>₹{totals.grandTotal}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 border-t pt-4">
                <div className="space-y-2">
                  <Label htmlFor="amount-given">Amount Received</Label>
                  <Input
                    id="amount-given"
                    type="number"
                    min="0"
                    step="1"
                    value={amountGiven || ""}
                    onChange={(e) => setAmountGiven(parseFloat(e.target.value) || 0)}
                    placeholder="Enter amount"
                    data-testid="input-amount-given"
                  />
                </div>
                {amountGiven >= totals.grandTotal && totals.grandTotal > 0 && (
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex justify-between items-center">
                      <span className="text-green-700 dark:text-green-300">Return:</span>
                      <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                        ₹{totals.amountReturn.toFixed(0)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

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

          {selectedParty && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Customer</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <p className="font-medium">{selectedParty.name}</p>
                <p className="text-muted-foreground">{selectedParty.city}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
