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
import { Plus, Trash2, Save } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

export default function PurchaseEntry() {
  const { toast } = useToast();
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);
  const [selectedParty, setSelectedParty] = useState<number | null>(null);
  const [invoiceNo, setInvoiceNo] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const { data: parties } = useQuery({
    queryKey: ["/api/parties"],
  });

  const { data: items } = useQuery({
    queryKey: ["/api/items"],
  });

  const { data: nextSerialData } = useQuery({
    queryKey: ["/api/next-serial"],
  });

  const form = useForm<PurchaseItemForm>({
    resolver: zodResolver(purchaseItemSchema),
    defaultValues: {
      serial: (nextSerialData as any)?.serial || 1,
      qty: 1,
      cost: 0,
      tax: 0,
      dqty: 0,
      itemId: null,
    },
  });

  useEffect(() => {
    if ((nextSerialData as any)?.serial && purchaseItems.length === 0) {
      form.setValue("serial", (nextSerialData as any).serial);
    }
  }, [nextSerialData, purchaseItems.length, form]);

  const createPurchaseMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("/api/purchases", "POST", data);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Purchase entry created successfully" });
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
    const arate = cost + taxAmount; // Cost + Tax
    const profit = (arate * profitPercent) / 100;
    const rrate = arate + profit; // MRP/Sale Rate
    const brate = rrate - taxAmount; // Rate without tax
    
    return { arate, rrate, brate, profit, prper: profitPercent };
  };

  const handleAddItem = (data: PurchaseItemForm) => {
    const cost = Number(data.cost);
    const tax = Number(data.tax || 0);
    const qty = Number(data.qty);
    const dqty = Number(data.dqty || 0);
    
    const rates = calculateRates(cost, tax);
    
    const newItem: PurchaseItem = {
      ...data,
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

    form.reset({
      serial: ((nextSerialData as any)?.serial || 1) + purchaseItems.length + 1,
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
        barcode: item.barcode || "",
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

  const resetForm = () => {
    setPurchaseItems([]);
    setSelectedParty(null);
    setInvoiceNo("");
    setPurchaseDate(new Date().toISOString().split('T')[0]);
    setEditingIndex(null);
    form.reset({
      serial: (nextSerialData as any)?.serial || 1,
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
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Purchase Entry</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Purchase Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
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
                <Label htmlFor="party">Party</Label>
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
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add Item</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(handleAddItem)} className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="serial">Serial/Barcode</Label>
                  <Input
                    id="serial"
                    type="number"
                    {...form.register("serial", { valueAsNumber: true })}
                    data-testid="input-serial"
                  />
                </div>
                <div>
                  <Label htmlFor="barcode">Barcode</Label>
                  <Input
                    id="barcode"
                    {...form.register("barcode")}
                    placeholder="Barcode"
                    data-testid="input-barcode"
                  />
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Serial</TableHead>
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
                      <TableCell>{item.itname}</TableCell>
                      <TableCell>{item.brandname}</TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell className="text-right">{item.qty}</TableCell>
                      <TableCell className="text-right">₹{parseFloat(item.cost).toFixed(2)}</TableCell>
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

              <div className="mt-4 flex justify-end gap-8 text-lg font-semibold">
                <div>Total Quantity: <span className="text-primary" data-testid="text-total-qty">{totalQty.toFixed(2)}</span></div>
                <div>Total Amount: <span className="text-primary" data-testid="text-total-amount">₹{totalAmount.toFixed(2)}</span></div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
