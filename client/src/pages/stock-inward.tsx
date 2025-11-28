import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Save, Barcode, RefreshCw, Package, ArrowLeft, Check, Calculator } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Link, useLocation, useSearch } from "wouter";
import { Separator } from "@/components/ui/separator";

const SIZE_CODES: { [key: string]: number } = {
  "F": 45, "S": 47, "M": 49, "L": 51, "XL": 53, "2L": 55, "3L": 57,
  "4L": 59, "5L": 61, "6L": 63, "7L": 65, "8L": 67, "OS": 69,
  "32": 32, "34": 34, "36": 36, "38": 38, "40": 40, "42": 42, "44": 44
};

const TAX_RATES = [0, 5, 12, 18, 28];

const purchaseItemSchema = z.object({
  itemId: z.number().nullable().optional(),
  itname: z.string().min(1, "Item name required"),
  brandname: z.string().optional(),
  sizeName: z.string().optional(),
  hsn: z.string().optional(),
  quality: z.string().optional(),
  dno1: z.string().optional(),
  pattern: z.string().optional(),
  sleeve: z.string().optional(),
  qty: z.number().min(1, "Quantity required"),
  cost: z.number().min(0, "Cost required"),
  tax: z.number().min(0).max(100),
  discountPercent: z.number().min(0).max(100).optional(),
  discountAmount: z.number().min(0).optional(),
  expensePercent: z.number().min(0).optional(),
  expenseAmount: z.number().min(0).optional(),
  profitPercent: z.number().min(0).optional(),
  mrp: z.number().min(0).optional(),
});

type PurchaseItemForm = z.infer<typeof purchaseItemSchema>;

interface Purchase {
  id: number;
  purchaseNo: number;
  date: string;
  invoiceNo: string | null;
  partyName: string | null;
  city: string | null;
  amount: string;
  totalQty: string;
  stockInwardCompleted: boolean;
}

interface PurchaseItem {
  id: number;
  purchaseId: number;
  serial: number;
  barcode: string | null;
  itemId: number | null;
  itname: string;
  brandname: string | null;
  name: string | null;
  hsn: string | null;
  quality: string | null;
  dno1: string | null;
  pattern: string | null;
  sleeve: string | null;
  qty: string;
  cost: string;
  tax: string;
  discountPercent: string | null;
  discountAmount: string | null;
  netCost: string | null;
  expensePercent: string | null;
  expenseAmount: string | null;
  landingCost: string | null;
  profitPercent: string | null;
  profitAmount: string | null;
  rate: string | null;
  mrp: string | null;
  barcodeGenerated: boolean;
}

export default function StockInward() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const purchaseIdFromUrl = params.get('purchaseId');

  const [selectedPurchaseId, setSelectedPurchaseId] = useState<number | null>(
    purchaseIdFromUrl ? parseInt(purchaseIdFromUrl) : null
  );
  const [barcodePrefix, setBarcodePrefix] = useState("SKR");
  const [editingItemId, setEditingItemId] = useState<number | null>(null);

  const { data: pendingPurchases } = useQuery<Purchase[]>({
    queryKey: ["/api/pending-purchases"],
  });

  const getCompanyHeader = (): Record<string, string> => {
    const companyId = localStorage.getItem("currentCompanyId");
    return companyId ? { "X-Company-Id": companyId } : {};
  };

  const { data: selectedPurchase, isLoading: purchaseLoading } = useQuery<Purchase>({
    queryKey: ["/api/purchases", selectedPurchaseId],
    queryFn: async () => {
      const res = await fetch(`/api/purchases/${selectedPurchaseId}`, {
        credentials: "include",
        headers: getCompanyHeader(),
      });
      if (!res.ok) throw new Error("Failed to fetch purchase");
      return res.json();
    },
    enabled: !!selectedPurchaseId,
  });

  const { data: purchaseItems, isLoading: itemsLoading, refetch: refetchItems } = useQuery<PurchaseItem[]>({
    queryKey: ["/api/purchases", selectedPurchaseId, "items"],
    queryFn: async () => {
      const res = await fetch(`/api/purchases/${selectedPurchaseId}/items`, {
        credentials: "include",
        headers: getCompanyHeader(),
      });
      if (!res.ok) throw new Error("Failed to fetch purchase items");
      return res.json();
    },
    enabled: !!selectedPurchaseId,
  });

  const { data: nextSerialData, refetch: refetchSerial } = useQuery({
    queryKey: ["/api/next-global-serial"],
    enabled: !!selectedPurchaseId,
  });

  const { data: masterItems } = useQuery({
    queryKey: ["/api/items"],
  });

  const form = useForm<PurchaseItemForm>({
    resolver: zodResolver(purchaseItemSchema),
    defaultValues: {
      itemId: null,
      itname: "",
      brandname: "",
      sizeName: "",
      hsn: "",
      quality: "",
      dno1: "",
      pattern: "",
      sleeve: "",
      qty: 1,
      cost: 0,
      tax: 0,
      discountPercent: 0,
      discountAmount: 0,
      expensePercent: 0,
      expenseAmount: 0,
      profitPercent: 10,
      mrp: 0,
    },
  });

  const handleItemSelect = (itemId: string) => {
    const item = (masterItems as any)?.find((i: any) => i.id.toString() === itemId);
    if (item) {
      form.setValue("itemId", item.id);
      form.setValue("itname", item.name || "");
      form.setValue("brandname", item.brand || "");
      form.setValue("hsn", item.hsn || "");
      if (item.mrp) {
        form.setValue("mrp", parseFloat(item.mrp));
      }
      if (item.tax) {
        form.setValue("tax", parseFloat(item.tax));
      }
    }
  };

  const watchCost = form.watch("cost");
  const watchQty = form.watch("qty");
  const watchTax = form.watch("tax");
  const watchDiscountPercent = form.watch("discountPercent");
  const watchExpensePercent = form.watch("expensePercent");
  const watchProfitPercent = form.watch("profitPercent");

  const calculateRates = (cost: number, tax: number, discountPercent: number = 0, expensePercent: number = 0, profitPercent: number = 10) => {
    const discountAmount = (cost * discountPercent) / 100;
    const netCost = cost - discountAmount;
    
    const expenseAmount = (netCost * expensePercent) / 100;
    const landingCost = netCost + expenseAmount;
    
    const taxAmount = (landingCost * tax) / 100;
    const costWithTax = landingCost + taxAmount;
    
    const profitAmount = (costWithTax * profitPercent) / 100;
    const rate = costWithTax + profitAmount;
    
    return {
      discountAmount: discountAmount.toFixed(2),
      netCost: netCost.toFixed(2),
      expenseAmount: expenseAmount.toFixed(2),
      landingCost: landingCost.toFixed(2),
      taxAmount: taxAmount.toFixed(2),
      profitAmount: profitAmount.toFixed(2),
      rate: rate.toFixed(2),
    };
  };

  const calculatedRates = calculateRates(
    watchCost || 0,
    watchTax || 0,
    watchDiscountPercent || 0,
    watchExpensePercent || 0,
    watchProfitPercent || 10
  );

  const generateBarcode = (serial: number, prefix: string = barcodePrefix): string => {
    const paddedSerial = serial.toString().padStart(7, '0');
    return `${prefix}${paddedSerial}`;
  };

  const addItemMutation = useMutation({
    mutationFn: async (data: any) => {
      return (await apiRequest("POST", "/api/purchase-items", data)).json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Item added successfully" });
      refetchItems();
      refetchSerial();
      form.reset({
        itemId: null,
        itname: "",
        brandname: "",
        sizeName: "",
        hsn: "",
        quality: "",
        dno1: "",
        pattern: "",
        sleeve: "",
        qty: 1,
        cost: 0,
        tax: 0,
        discountPercent: 0,
        discountAmount: 0,
        expensePercent: 0,
        expenseAmount: 0,
        profitPercent: 10,
        mrp: 0,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add item",
        variant: "destructive",
      });
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return (await apiRequest("PUT", `/api/purchase-items/${id}`, data)).json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Item updated successfully" });
      refetchItems();
      setEditingItemId(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update item",
        variant: "destructive",
      });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/purchase-items/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Item deleted successfully" });
      refetchItems();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete item",
        variant: "destructive",
      });
    },
  });

  const generateBarcodesMutation = useMutation({
    mutationFn: async ({ purchaseItemId, qty }: { purchaseItemId: number; qty: number }) => {
      const startSerial = (nextSerialData as any)?.serial || 1;
      const items = [];
      
      for (let i = 0; i < qty; i++) {
        const serial = startSerial + i;
        items.push({
          serial,
          barcode: generateBarcode(serial, barcodePrefix),
          status: "in_stock",
        });
      }
      
      return (await apiRequest("POST", `/api/purchase-items/${purchaseItemId}/generate-barcodes`, { items })).json();
    },
    onSuccess: (_, variables) => {
      toast({ title: "Success", description: `Generated ${variables.qty} unique barcodes` });
      refetchItems();
      refetchSerial();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate barcodes",
        variant: "destructive",
      });
    },
  });

  const completePurchaseMutation = useMutation({
    mutationFn: async (purchaseId: number) => {
      return (await apiRequest("POST", `/api/purchases/${purchaseId}/complete`)).json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Purchase completed and stock updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/purchases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pending-purchases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stock"] });
      setLocation("/purchase-entry");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to complete purchase",
        variant: "destructive",
      });
    },
  });

  const handleAddItem = (data: PurchaseItemForm) => {
    if (!selectedPurchaseId) return;

    const rates = calculateRates(
      data.cost,
      data.tax,
      data.discountPercent || 0,
      data.expensePercent || 0,
      data.profitPercent || 10
    );

    const sizeCode = SIZE_CODES[data.sizeName?.toUpperCase() || ""] || 0;
    const nextSerial = (purchaseItems?.length || 0) + 1;

    const itemData = {
      purchaseId: selectedPurchaseId,
      serial: nextSerial,
      itemId: data.itemId || null,
      itname: data.itname,
      brandname: data.brandname || "",
      name: data.sizeName || "",
      hsn: data.hsn || "",
      quality: data.quality || "",
      dno1: data.dno1 || "",
      pattern: data.pattern || "",
      sleeve: data.sleeve || "",
      qty: data.qty.toString(),
      cost: data.cost.toString(),
      tax: data.tax.toString(),
      sizeCode,
      discountPercent: (data.discountPercent || 0).toString(),
      discountAmount: rates.discountAmount,
      netCost: rates.netCost,
      expensePercent: (data.expensePercent || 0).toString(),
      expenseAmount: rates.expenseAmount,
      landingCost: rates.landingCost,
      profitPercent: (data.profitPercent || 10).toString(),
      profitAmount: rates.profitAmount,
      rate: rates.rate,
      mrp: data.mrp?.toString() || rates.rate,
    };

    if (editingItemId) {
      updateItemMutation.mutate({ id: editingItemId, data: itemData });
    } else {
      addItemMutation.mutate(itemData);
    }
  };

  const handleEditItem = (item: PurchaseItem) => {
    setEditingItemId(item.id);
    form.reset({
      itemId: item.itemId || null,
      itname: item.itname,
      brandname: item.brandname || "",
      sizeName: item.name || "",
      hsn: item.hsn || "",
      quality: item.quality || "",
      dno1: item.dno1 || "",
      pattern: item.pattern || "",
      sleeve: item.sleeve || "",
      qty: parseFloat(item.qty),
      cost: parseFloat(item.cost),
      tax: parseFloat(item.tax),
      discountPercent: parseFloat(item.discountPercent || "0"),
      expensePercent: parseFloat(item.expensePercent || "0"),
      profitPercent: parseFloat(item.profitPercent || "10"),
      mrp: parseFloat(item.mrp || "0"),
    });
  };

  const handleDeleteItem = (id: number) => {
    deleteItemMutation.mutate(id);
  };

  const handleGenerateBarcodes = (item: PurchaseItem) => {
    const qty = parseInt(item.qty);
    generateBarcodesMutation.mutate({ purchaseItemId: item.id, qty });
  };

  const handleCompletePurchase = () => {
    if (!selectedPurchaseId) return;
    
    const allGenerated = purchaseItems?.every(item => item.barcodeGenerated);
    if (!allGenerated) {
      toast({
        title: "Warning",
        description: "Please generate barcodes for all items before completing",
        variant: "destructive",
      });
      return;
    }
    
    completePurchaseMutation.mutate(selectedPurchaseId);
  };

  const totalQty = purchaseItems?.reduce((sum, item) => sum + parseFloat(item.qty || "0"), 0) || 0;
  const totalAmount = purchaseItems?.reduce((sum, item) => {
    const qty = parseFloat(item.qty || "0");
    const cost = parseFloat(item.cost || "0");
    return sum + (qty * cost);
  }, 0) || 0;
  const allBarcodesGenerated = purchaseItems?.every(item => item.barcodeGenerated) || false;

  if (!selectedPurchaseId) {
    return (
      <div className="h-full overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild data-testid="button-back">
              <Link href="/purchase-entry">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold" data-testid="text-page-title">Stock Inward</h1>
              <p className="text-muted-foreground mt-1">Phase 2: Add items and generate barcodes</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Select Purchase Entry</CardTitle>
            </CardHeader>
            <CardContent>
              {!pendingPurchases || pendingPurchases.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">No pending purchase entries found.</p>
                  <Button asChild data-testid="button-new-entry">
                    <Link href="/purchase-entry">Create New Purchase Entry</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Select a pending purchase entry to add items and generate barcodes:
                  </p>
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Entry No</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Invoice</TableHead>
                          <TableHead>Supplier</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead className="text-center">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingPurchases.map((purchase) => (
                          <TableRow key={purchase.id} data-testid={`row-select-${purchase.id}`}>
                            <TableCell>
                              <Badge variant="outline">{purchase.purchaseNo}</Badge>
                            </TableCell>
                            <TableCell>
                              {purchase.date ? format(new Date(purchase.date), "dd/MM/yyyy") : "-"}
                            </TableCell>
                            <TableCell>{purchase.invoiceNo || "-"}</TableCell>
                            <TableCell>{purchase.partyName || "-"}</TableCell>
                            <TableCell className="text-right">
                              ₹{parseFloat(purchase.amount || "0").toFixed(2)}
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                size="sm"
                                onClick={() => setSelectedPurchaseId(purchase.id)}
                                data-testid={`button-select-${purchase.id}`}
                              >
                                <Package className="mr-1 h-4 w-4" />
                                Select
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setSelectedPurchaseId(null)} data-testid="button-back">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold" data-testid="text-page-title">Stock Inward</h1>
              <p className="text-muted-foreground mt-1">
                Entry #{selectedPurchase?.purchaseNo} - {selectedPurchase?.partyName}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-sm px-3 py-1">
              Invoice: {selectedPurchase?.invoiceNo || "-"}
            </Badge>
            <Badge variant="outline" className="text-sm px-3 py-1">
              {selectedPurchase?.date ? format(new Date(selectedPurchase.date), "dd/MM/yyyy") : "-"}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                {editingItemId ? "Edit Item" : "Add Item"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(handleAddItem)} className="space-y-4">
                <div className="grid grid-cols-4 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="itemSelect">Select Item from Master *</Label>
                    <Select onValueChange={handleItemSelect}>
                      <SelectTrigger data-testid="select-item-master">
                        <SelectValue placeholder="Select from item master" />
                      </SelectTrigger>
                      <SelectContent>
                        {(masterItems as any)?.map((item: any) => (
                          <SelectItem key={item.id} value={item.id.toString()}>
                            {item.name} {item.brand ? `- ${item.brand}` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      id="itname"
                      {...form.register("itname")}
                      placeholder="Or enter item name manually"
                      className="mt-2"
                      data-testid="input-item-name"
                    />
                    {form.formState.errors.itname && (
                      <p className="text-sm text-destructive mt-1">{form.formState.errors.itname.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="brandname">Brand</Label>
                    <Input
                      id="brandname"
                      {...form.register("brandname")}
                      placeholder="Brand name"
                      data-testid="input-brand"
                    />
                  </div>
                  <div>
                    <Label htmlFor="sizeName">Size</Label>
                    <Input
                      id="sizeName"
                      {...form.register("sizeName")}
                      placeholder="Enter size (e.g. M, L, 32)"
                      data-testid="input-size"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="quality">Quality</Label>
                    <Input
                      id="quality"
                      {...form.register("quality")}
                      placeholder="Quality"
                      data-testid="input-quality"
                    />
                  </div>
                  <div>
                    <Label htmlFor="dno1">Design Number</Label>
                    <Input
                      id="dno1"
                      {...form.register("dno1")}
                      placeholder="Design No."
                      data-testid="input-dno1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="pattern">Pattern</Label>
                    <Input
                      id="pattern"
                      {...form.register("pattern")}
                      placeholder="Pattern"
                      data-testid="input-pattern"
                    />
                  </div>
                  <div>
                    <Label htmlFor="sleeve">Color</Label>
                    <Input
                      id="sleeve"
                      {...form.register("sleeve")}
                      placeholder="Color"
                      data-testid="input-color"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-4">
                  <div>
                    <Label htmlFor="qty">Quantity *</Label>
                    <Input
                      id="qty"
                      type="number"
                      min="1"
                      {...form.register("qty", { valueAsNumber: true })}
                      placeholder="0"
                      data-testid="input-qty"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cost">Cost / Unit *</Label>
                    <Input
                      id="cost"
                      type="number"
                      step="0.01"
                      {...form.register("cost", { valueAsNumber: true })}
                      placeholder="0.00"
                      data-testid="input-cost"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tax">Tax %</Label>
                    <Select onValueChange={(v) => form.setValue("tax", parseFloat(v))}>
                      <SelectTrigger data-testid="select-tax">
                        <SelectValue placeholder="0%" />
                      </SelectTrigger>
                      <SelectContent>
                        {TAX_RATES.map(rate => (
                          <SelectItem key={rate} value={rate.toString()}>{rate}%</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="discountPercent">Discount %</Label>
                    <Input
                      id="discountPercent"
                      type="number"
                      step="0.01"
                      {...form.register("discountPercent", { valueAsNumber: true })}
                      placeholder="0"
                      data-testid="input-discount"
                    />
                  </div>
                  <div>
                    <Label htmlFor="expensePercent">Expense %</Label>
                    <Input
                      id="expensePercent"
                      type="number"
                      step="0.01"
                      {...form.register("expensePercent", { valueAsNumber: true })}
                      placeholder="0"
                      data-testid="input-expense"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="profitPercent">Profit %</Label>
                    <Input
                      id="profitPercent"
                      type="number"
                      step="0.01"
                      {...form.register("profitPercent", { valueAsNumber: true })}
                      placeholder="10"
                      data-testid="input-profit"
                    />
                  </div>
                  <div>
                    <Label htmlFor="mrp">MRP (Override)</Label>
                    <Input
                      id="mrp"
                      type="number"
                      step="0.01"
                      {...form.register("mrp", { valueAsNumber: true })}
                      placeholder="Auto calculated"
                      data-testid="input-mrp"
                    />
                  </div>
                  <div>
                    <Label htmlFor="hsn">HSN Code</Label>
                    <Input
                      id="hsn"
                      {...form.register("hsn")}
                      placeholder="HSN"
                      data-testid="input-hsn"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-4">
                  {editingItemId && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setEditingItemId(null);
                        form.reset();
                      }}
                      data-testid="button-cancel-edit"
                    >
                      Cancel
                    </Button>
                  )}
                  <Button
                    type="submit"
                    disabled={addItemMutation.isPending || updateItemMutation.isPending}
                    data-testid="button-add-item"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {editingItemId ? "Update Item" : "Add Item"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Live Calculation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Cost:</span>
                <span className="font-mono">₹{(watchCost || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">- Discount ({watchDiscountPercent || 0}%):</span>
                <span className="font-mono text-red-500">-₹{calculatedRates.discountAmount}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Net Cost:</span>
                <span className="font-mono">₹{calculatedRates.netCost}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">+ Expense ({watchExpensePercent || 0}%):</span>
                <span className="font-mono text-orange-500">+₹{calculatedRates.expenseAmount}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm font-medium">
                <span>Landing Cost:</span>
                <span className="font-mono">₹{calculatedRates.landingCost}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">+ Tax ({watchTax || 0}%):</span>
                <span className="font-mono">+₹{calculatedRates.taxAmount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">+ Profit ({watchProfitPercent || 10}%):</span>
                <span className="font-mono text-green-500">+₹{calculatedRates.profitAmount}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Selling Rate:</span>
                <span className="font-mono text-primary">₹{calculatedRates.rate}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>MRP:</span>
                <span className="font-mono text-green-600">
                  ₹{(form.watch("mrp") && (form.watch("mrp") || 0) > 0) ? (form.watch("mrp") || 0).toFixed(2) : calculatedRates.rate}
                </span>
              </div>
              <div className="text-center text-xs text-muted-foreground mt-4">
                Total Value: ₹{(parseFloat((form.watch("mrp") && (form.watch("mrp") || 0) > 0) ? (form.watch("mrp") || 0).toString() : calculatedRates.rate) * (watchQty || 1)).toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle>Items ({purchaseItems?.length || 0})</CardTitle>
            <div className="flex items-center gap-4">
              <div>
                <Label htmlFor="prefix" className="text-xs">Barcode Prefix</Label>
                <Input
                  id="prefix"
                  value={barcodePrefix}
                  onChange={(e) => setBarcodePrefix(e.target.value.toUpperCase().slice(0, 4))}
                  className="w-24 text-sm"
                  maxLength={4}
                  data-testid="input-barcode-prefix"
                />
              </div>
              <Badge variant="secondary" className="text-sm">
                Next Serial: {(nextSerialData as any)?.serial || 1}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {itemsLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading items...</div>
            ) : purchaseItems && purchaseItems.length > 0 ? (
              <div className="border rounded-md overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Item Name</TableHead>
                      <TableHead>Brand/Size</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Cost</TableHead>
                      <TableHead className="text-right">Landing</TableHead>
                      <TableHead className="text-right">Rate</TableHead>
                      <TableHead className="text-right">MRP</TableHead>
                      <TableHead className="text-center">Barcodes</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchaseItems.map((item, index) => (
                      <TableRow key={item.id} data-testid={`row-item-${item.id}`}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-medium">{item.itname}</TableCell>
                        <TableCell>
                          {item.brandname && <span>{item.brandname}</span>}
                          {item.name && <Badge variant="outline" className="ml-1">{item.name}</Badge>}
                        </TableCell>
                        <TableCell className="text-xs">
                          <div className="flex flex-wrap gap-1">
                            {item.quality && <Badge variant="secondary" className="text-xs">{item.quality}</Badge>}
                            {item.dno1 && <Badge variant="secondary" className="text-xs">D:{item.dno1}</Badge>}
                            {item.pattern && <Badge variant="secondary" className="text-xs">{item.pattern}</Badge>}
                            {item.sleeve && <Badge variant="secondary" className="text-xs">{item.sleeve}</Badge>}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono">{parseFloat(item.qty).toFixed(0)}</TableCell>
                        <TableCell className="text-right font-mono">₹{parseFloat(item.cost).toFixed(2)}</TableCell>
                        <TableCell className="text-right font-mono">₹{parseFloat(item.landingCost || "0").toFixed(2)}</TableCell>
                        <TableCell className="text-right font-mono font-semibold">₹{parseFloat(item.rate || "0").toFixed(2)}</TableCell>
                        <TableCell className="text-right font-mono text-primary font-semibold">₹{parseFloat(item.mrp || item.rate || "0").toFixed(2)}</TableCell>
                        <TableCell className="text-center">
                          {item.barcodeGenerated ? (
                            <Badge variant="default">
                              <Check className="mr-1 h-3 w-3" />
                              Generated
                            </Badge>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleGenerateBarcodes(item)}
                              disabled={generateBarcodesMutation.isPending}
                              data-testid={`button-generate-${item.id}`}
                            >
                              <Barcode className="mr-1 h-3 w-3" />
                              Generate ({parseInt(item.qty)})
                            </Button>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditItem(item)}
                              disabled={item.barcodeGenerated}
                              data-testid={`button-edit-${item.id}`}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteItem(item.id)}
                              disabled={item.barcodeGenerated}
                              data-testid={`button-delete-${item.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No items added yet. Use the form above to add items.
              </div>
            )}
          </CardContent>
          {purchaseItems && purchaseItems.length > 0 && (
            <CardFooter className="flex justify-between border-t pt-6">
              <div className="flex gap-8 text-lg">
                <div>
                  Total Qty: <span className="font-bold" data-testid="text-total-qty">{totalQty}</span>
                </div>
                <div>
                  Total Amount: <span className="font-bold text-primary" data-testid="text-total-amount">₹{totalAmount.toFixed(2)}</span>
                </div>
              </div>
              <Button
                onClick={handleCompletePurchase}
                disabled={!allBarcodesGenerated || completePurchaseMutation.isPending}
                className="min-w-[200px]"
                data-testid="button-complete"
              >
                {completePurchaseMutation.isPending ? (
                  <>Completing...</>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Complete Stock Inward
                  </>
                )}
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
}
