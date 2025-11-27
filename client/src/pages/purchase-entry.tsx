import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Save, FileText, Eye, Barcode, RefreshCw } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Link } from "wouter";

const purchaseItemSchema = z.object({
  serial: z.number(),
  barcode: z.string().optional(),
  itname: z.string().min(1, "Item name required"),
  brandname: z.string().optional(),
  name: z.string().optional(),
  qty: z.number().min(0.01, "Quantity required"),
  cost: z.number().min(0, "Cost required"),
  tax: z.number().min(0).max(100),
  expdate: z.string().optional(),
  dqty: z.number().min(0),
  itemId: z.number().nullable().optional(),
});

type PurchaseItemForm = z.infer<typeof purchaseItemSchema>;

interface PurchaseItem extends PurchaseItemForm {
  arate: number;
  rrate: number;
  brate: number;
  profit: number;
  prper: number;
  stockqty: number;
  saleqty: number;
}

interface Purchase {
  id: number;
  purchaseNo: number;
  date: string;
  invoiceNo: string | null;
  partyName: string | null;
  city: string | null;
  totalQty: string;
  amount: string;
}

export default function PurchaseEntry() {
  const { toast } = useToast();
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);
  const [selectedParty, setSelectedParty] = useState<number | null>(null);
  const [invoiceNo, setInvoiceNo] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("entry");
  const [barcodePrefix, setBarcodePrefix] = useState("SKR");

  const { data: parties } = useQuery({
    queryKey: ["/api/parties"],
  });

  const { data: items } = useQuery({
    queryKey: ["/api/items"],
  });

  const { data: nextSerialData, refetch: refetchSerial } = useQuery({
    queryKey: ["/api/next-serial"],
  });

  const { data: purchases, isLoading: purchasesLoading } = useQuery<Purchase[]>({
    queryKey: ["/api/purchases"],
  });

  const generateBarcode = (serial: number, prefix: string = barcodePrefix): string => {
    const paddedSerial = serial.toString().padStart(6, '0');
    return `${prefix}${paddedSerial}`;
  };

  const form = useForm<PurchaseItemForm>({
    resolver: zodResolver(purchaseItemSchema),
    defaultValues: {
      serial: (nextSerialData as any)?.serial || 1,
      barcode: "",
      qty: 1,
      cost: 0,
      tax: 0,
      dqty: 0,
      itemId: null,
    },
  });

  const currentSerial = form.watch("serial");

  useEffect(() => {
    if ((nextSerialData as any)?.serial && purchaseItems.length === 0) {
      const nextSerial = (nextSerialData as any).serial;
      form.setValue("serial", nextSerial);
      form.setValue("barcode", generateBarcode(nextSerial, barcodePrefix));
    }
  }, [nextSerialData, purchaseItems.length, barcodePrefix]);

  useEffect(() => {
    if (currentSerial) {
      form.setValue("barcode", generateBarcode(currentSerial, barcodePrefix));
    }
  }, [currentSerial, barcodePrefix]);

  const createPurchaseMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("/api/purchases", "POST", data);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Purchase entry created with auto-generated barcodes" });
      queryClient.invalidateQueries({ queryKey: ["/api/purchases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stock"] });
      queryClient.invalidateQueries({ queryKey: ["/api/next-serial"] });
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create purchase entry",
        variant: "destructive",
      });
    },
  });

  const calculateRates = (cost: number, tax: number, profitPercent: number = 10) => {
    const taxAmount = (cost * tax) / 100;
    const arate = cost + taxAmount;
    const profit = (arate * profitPercent) / 100;
    const rrate = arate + profit;
    const brate = rrate - taxAmount;
    
    return { arate, rrate, brate, profit, prper: profitPercent };
  };

  const handleAddItem = (data: PurchaseItemForm) => {
    const cost = Number(data.cost);
    const tax = Number(data.tax || 0);
    const qty = Number(data.qty);
    const dqty = Number(data.dqty || 0);
    
    const rates = calculateRates(cost, tax);
    const barcode = data.barcode || generateBarcode(data.serial, barcodePrefix);
    
    const newItem: PurchaseItem = {
      ...data,
      barcode,
      ...rates,
      stockqty: qty - dqty,
      saleqty: 0,
    };

    if (editingIndex !== null) {
      const updated = [...purchaseItems];
      updated[editingIndex] = newItem;
      setPurchaseItems(updated);
      setEditingIndex(null);
    } else {
      setPurchaseItems([...purchaseItems, newItem]);
    }

    const nextSerial = ((nextSerialData as any)?.serial || 1) + purchaseItems.length + 1;
    form.reset({
      serial: nextSerial,
      barcode: generateBarcode(nextSerial, barcodePrefix),
      qty: 1,
      cost: 0,
      tax: 0,
      dqty: 0,
      itemId: null,
    });
  };

  const handleEditItem = (index: number) => {
    const item = purchaseItems[index];
    form.reset(item);
    setEditingIndex(index);
  };

  const handleDeleteItem = (index: number) => {
    setPurchaseItems(purchaseItems.filter((_, i) => i !== index));
  };

  const handleSavePurchase = () => {
    if (!selectedParty) {
      toast({
        title: "Error",
        description: "Please select a party",
        variant: "destructive",
      });
      return;
    }

    if (purchaseItems.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one item",
        variant: "destructive",
      });
      return;
    }

    const party = (parties as any)?.find((p: any) => p.id === selectedParty);
    
    const purchaseData = {
      purchase: {
        date: purchaseDate,
        invoiceNo: invoiceNo,
        partyId: selectedParty,
        partyName: party?.name || "",
        city: party?.city || "",
      },
      items: purchaseItems.map(item => ({
        purchaseId: 0,
        serial: Number(item.serial),
        barcode: item.barcode || generateBarcode(item.serial, barcodePrefix),
        itname: item.itname,
        brandname: item.brandname || "",
        name: item.name || "",
        qty: Number(item.qty),
        cost: Number(item.cost),
        tax: Number(item.tax || 0),
        arate: Number(item.arate),
        rrate: Number(item.rrate),
        brate: Number(item.brate),
        profit: Number(item.profit),
        prper: Number(item.prper),
        expdate: item.expdate || null,
        dqty: Number(item.dqty || 0),
        saleqty: 0,
        stockqty: Number(item.stockqty),
        itemId: item.itemId || null,
      })),
    };

    createPurchaseMutation.mutate(purchaseData);
  };

  const resetForm = async () => {
    setPurchaseItems([]);
    setSelectedParty(null);
    setInvoiceNo("");
    setPurchaseDate(new Date().toISOString().split('T')[0]);
    setEditingIndex(null);
    
    const result = await refetchSerial();
    const newSerial = (result.data as any)?.serial || 1;
    
    form.reset({
      serial: newSerial,
      barcode: generateBarcode(newSerial, barcodePrefix),
      qty: 1,
      cost: 0,
      tax: 0,
      dqty: 0,
      itemId: null,
    });
  };

  const totalQty = purchaseItems.reduce((sum, item) => sum + Number(item.qty), 0);
  const totalAmount = purchaseItems.reduce((sum, item) => {
    const cost = Number(item.cost);
    const qty = Number(item.qty);
    const tax = Number(item.tax || 0);
    return sum + (cost * qty * (1 + tax / 100));
  }, 0);

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Stock Inward / Purchase Entry</h1>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="entry" data-testid="tab-entry">
              <Plus className="mr-2 h-4 w-4" />
              New Entry
            </TabsTrigger>
            <TabsTrigger value="list" data-testid="tab-list">
              <FileText className="mr-2 h-4 w-4" />
              Purchase List
            </TabsTrigger>
          </TabsList>

          <TabsContent value="entry" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Purchase Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={purchaseDate}
                      onChange={(e) => setPurchaseDate(e.target.value)}
                      data-testid="input-purchase-date"
                    />
                  </div>
                  <div>
                    <Label htmlFor="invoice">Invoice No</Label>
                    <Input
                      id="invoice"
                      value={invoiceNo}
                      onChange={(e) => setInvoiceNo(e.target.value)}
                      placeholder="Invoice number"
                      data-testid="input-invoice-no"
                    />
                  </div>
                  <div>
                    <Label htmlFor="party">Party/Supplier</Label>
                    <Select value={selectedParty?.toString() || ""} onValueChange={(v) => setSelectedParty(parseInt(v))}>
                      <SelectTrigger data-testid="select-party">
                        <SelectValue placeholder="Select party" />
                      </SelectTrigger>
                      <SelectContent>
                        {(parties as any)?.map((party: any) => (
                          <SelectItem key={party.id} value={party.id.toString()}>
                            {party.name} - {party.city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="prefix">Barcode Prefix</Label>
                    <Input
                      id="prefix"
                      value={barcodePrefix}
                      onChange={(e) => setBarcodePrefix(e.target.value.toUpperCase().slice(0, 4))}
                      placeholder="SKR"
                      maxLength={4}
                      data-testid="input-barcode-prefix"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Barcode className="h-5 w-5" />
                    Add Item (Auto Barcode Generation)
                  </CardTitle>
                  <Badge variant="outline" className="text-sm">
                    Next Serial: {(nextSerialData as any)?.serial || 1}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={form.handleSubmit(handleAddItem)} className="space-y-4">
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="serial">Serial No</Label>
                      <Input
                        id="serial"
                        type="number"
                        {...form.register("serial", { valueAsNumber: true })}
                        data-testid="input-serial"
                      />
                    </div>
                    <div>
                      <Label htmlFor="barcode">Auto Barcode</Label>
                      <div className="flex gap-2">
                        <Input
                          id="barcode"
                          {...form.register("barcode")}
                          placeholder="Auto generated"
                          className="font-mono bg-muted"
                          readOnly
                          data-testid="input-barcode"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            const serial = form.getValues("serial");
                            form.setValue("barcode", generateBarcode(serial));
                          }}
                          data-testid="button-regenerate-barcode"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="itname">Item Name *</Label>
                      <Input
                        id="itname"
                        {...form.register("itname")}
                        placeholder="Item name"
                        data-testid="input-item-name"
                      />
                      {form.formState.errors.itname && (
                        <p className="text-sm text-destructive mt-1">{form.formState.errors.itname.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="brandname">Brand Name</Label>
                      <Input
                        id="brandname"
                        {...form.register("brandname")}
                        placeholder="Brand"
                        data-testid="input-brand-name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="name">Quality/Size</Label>
                      <Input
                        id="name"
                        {...form.register("name")}
                        placeholder="Quality/Size"
                        data-testid="input-quality"
                      />
                    </div>
                    <div>
                      <Label htmlFor="expdate">Expiry Date</Label>
                      <Input
                        id="expdate"
                        type="date"
                        {...form.register("expdate")}
                        data-testid="input-expiry-date"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-5 gap-4">
                    <div>
                      <Label htmlFor="qty">Quantity *</Label>
                      <Input
                        id="qty"
                        type="number"
                        step="0.01"
                        {...form.register("qty", { valueAsNumber: true })}
                        placeholder="0"
                        data-testid="input-quantity"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cost">Cost *</Label>
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
                          <SelectItem value="0">0%</SelectItem>
                          <SelectItem value="5">5%</SelectItem>
                          <SelectItem value="12">12%</SelectItem>
                          <SelectItem value="18">18%</SelectItem>
                          <SelectItem value="28">28%</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="dqty">Damaged Qty</Label>
                      <Input
                        id="dqty"
                        type="number"
                        step="0.01"
                        {...form.register("dqty", { valueAsNumber: true })}
                        placeholder="0"
                        data-testid="input-damaged-qty"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button type="submit" className="w-full" data-testid="button-add-item">
                        <Plus className="mr-2 h-4 w-4" />
                        {editingIndex !== null ? "Update" : "Add"} Item
                      </Button>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>

            {purchaseItems.length > 0 && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Purchase Items ({purchaseItems.length})</CardTitle>
                  <div className="flex gap-2">
                    <Button onClick={handleSavePurchase} disabled={createPurchaseMutation.isPending} data-testid="button-save-purchase">
                      <Save className="mr-2 h-4 w-4" />
                      {createPurchaseMutation.isPending ? "Saving..." : "Save Purchase"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-md overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Serial</TableHead>
                          <TableHead>Barcode</TableHead>
                          <TableHead>Item Name</TableHead>
                          <TableHead>Brand</TableHead>
                          <TableHead>Quality</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                          <TableHead className="text-right">Cost</TableHead>
                          <TableHead className="text-right">Tax %</TableHead>
                          <TableHead className="text-right">Cost+Tax</TableHead>
                          <TableHead className="text-right">MRP</TableHead>
                          <TableHead>Expiry</TableHead>
                          <TableHead className="text-center">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {purchaseItems.map((item, index) => (
                          <TableRow key={index} data-testid={`row-item-${index}`}>
                            <TableCell>{item.serial}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="font-mono">
                                {item.barcode}
                              </Badge>
                            </TableCell>
                            <TableCell>{item.itname}</TableCell>
                            <TableCell>{item.brandname}</TableCell>
                            <TableCell>{item.name}</TableCell>
                            <TableCell className="text-right">{item.qty}</TableCell>
                            <TableCell className="text-right">₹{Number(item.cost).toFixed(2)}</TableCell>
                            <TableCell className="text-right">{item.tax}%</TableCell>
                            <TableCell className="text-right">₹{item.arate.toFixed(2)}</TableCell>
                            <TableCell className="text-right">₹{item.rrate.toFixed(2)}</TableCell>
                            <TableCell>{item.expdate || "-"}</TableCell>
                            <TableCell className="text-center">
                              <div className="flex justify-center gap-2">
                                <Button variant="ghost" size="sm" onClick={() => handleEditItem(index)} data-testid={`button-edit-${index}`}>
                                  Edit
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleDeleteItem(index)} data-testid={`button-delete-${index}`}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="mt-4 flex justify-end gap-8 text-lg font-semibold">
                    <div>Total Quantity: <span className="text-primary" data-testid="text-total-qty">{totalQty.toFixed(2)}</span></div>
                    <div>Total Amount: <span className="text-primary" data-testid="text-total-amount">₹{totalAmount.toFixed(2)}</span></div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="list" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Purchase List</CardTitle>
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
      </div>
    </div>
  );
}
