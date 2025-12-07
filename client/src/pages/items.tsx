import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Edit, Package } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useTranslation } from "react-i18next";

// Universal pack types
const PACK_TYPES = [
  { value: "PCS", label: "Pieces (PCS)" },
  { value: "KG", label: "Kilograms (KG)" },
  { value: "GM", label: "Grams (GM)" },
  { value: "LTR", label: "Litres (LTR)" },
  { value: "ML", label: "Millilitres (ML)" },
  { value: "MTR", label: "Metres (MTR)" },
  { value: "CM", label: "Centimetres (CM)" },
  { value: "BOX", label: "Box (BOX)" },
  { value: "PKT", label: "Packet (PKT)" },
  { value: "SET", label: "Set (SET)" },
  { value: "DZ", label: "Dozen (DZ)" },
  { value: "PAIR", label: "Pair (PAIR)" },
  { value: "BTL", label: "Bottle (BTL)" },
  { value: "CAN", label: "Can (CAN)" },
  { value: "ROLL", label: "Roll (ROLL)" },
  { value: "UNIT", label: "Unit (UNIT)" },
];

const itemFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  hsnCode: z.string().min(1, "HSN Code is required"),
  tax: z.string().min(1, "Tax rate is required"),
  category: z.string().optional(),
  floor: z.string().optional(),
  packType: z.string().default("PCS"),
  type: z.enum(["P", "M"]).default("P"),
  cost: z.string().default("0"),
  mrp: z.string().default("0"),
  sellingPrice: z.string().default("0"),
  active: z.boolean().default(true),
  isShared: z.boolean().default(false),
});

type ItemFormValues = z.infer<typeof itemFormSchema>;

interface Item {
  id: number;
  code: string;
  name: string;
  hsnCode: string | null;
  category: string | null;
  floor: string | null;
  packType: string;
  type: string;
  cost: string;
  mrp: string;
  sellingPrice: string;
  tax: string;
  cgst: string;
  sgst: string;
  active: boolean;
  isShared: boolean;
  companyId: number;
}

export default function Items() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const { toast } = useToast();

  const { data: items, isLoading } = useQuery<Item[]>({
    queryKey: ["/api/items"],
  });

  const form = useForm<ItemFormValues>({
    resolver: zodResolver(itemFormSchema),
    defaultValues: {
      name: "",
      hsnCode: "",
      tax: "0",
      category: "",
      floor: "",
      packType: "PCS",
      type: "P",
      cost: "0",
      mrp: "0",
      sellingPrice: "0",
      active: true,
      isShared: false,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ItemFormValues) => {
      return apiRequest("POST", "/api/items", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      toast({
        title: t('common.success'),
        description: t('items.itemCreated'),
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ItemFormValues }) => {
      return apiRequest("PUT", `/api/items/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      toast({
        title: t('common.success'),
        description: t('items.itemUpdated'),
      });
      setIsDialogOpen(false);
      setEditingItem(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: ItemFormValues) => {
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (item: Item) => {
    setEditingItem(item);
    form.reset({
      name: item.name,
      hsnCode: item.hsnCode || "",
      tax: item.tax || "0",
      category: item.category || "",
      floor: item.floor || "",
      packType: item.packType || "PCS",
      type: item.type as "P" | "M",
      cost: item.cost || "0",
      mrp: item.mrp || "0",
      sellingPrice: item.sellingPrice || "0",
      active: item.active,
      isShared: item.isShared || false,
    });
    setIsDialogOpen(true);
  };

  const handleNewItem = () => {
    setEditingItem(null);
    form.reset();
    setIsDialogOpen(true);
  };

  const filteredItems = items?.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{t('items.title')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('items.subtitle')}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleNewItem} data-testid="button-add-item">
              <Plus className="mr-2 h-4 w-4" />
              {t('items.newItem')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingItem ? t('items.editItem') : t('items.addNewItem')}</DialogTitle>
              <DialogDescription>
                {editingItem ? t('items.updateItemDetails') : t('items.enterItemDetails')}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                {editingItem && (
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground">{t('items.itemCode')}: <span className="font-mono font-semibold text-foreground">{editingItem.code}</span></p>
                  </div>
                )}
                
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('items.name')} *</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-item-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="hsnCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('items.hsnCode')} *</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-item-hsn" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="tax"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('items.taxPercent')} *</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} data-testid="input-item-tax" />
                        </FormControl>
                        <FormMessage />
                        <p className="text-xs text-muted-foreground">
                          CGST = {(parseFloat(form.watch("tax") || "0") / 2).toFixed(2)}%, 
                          SGST = {(parseFloat(form.watch("tax") || "0") / 2).toFixed(2)}%
                        </p>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('items.category')}</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-item-category" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="floor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('items.floorLocation')}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={t('items.floorPlaceholder')} data-testid="input-item-floor" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="packType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('items.packType')}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-pack-type">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PACK_TYPES.map((packType) => (
                              <SelectItem key={packType.value} value={packType.value}>
                                {packType.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="cost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('items.cost')}</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} data-testid="input-item-cost" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="mrp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('items.mrp')}</FormLabel>
                        <FormControl>
                          <Input type="number" step="1" {...field} placeholder={t('items.mrpPlaceholder')} data-testid="input-item-mrp" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="sellingPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('items.sellingPrice')}</FormLabel>
                        <FormControl>
                          <Input type="number" step="1" {...field} placeholder={t('items.sellingPricePlaceholder')} data-testid="input-item-selling-price" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="isShared"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">{t('items.shareAcrossCompanies')}</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          {t('items.shareAcrossCompaniesDesc')}
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-item-shared"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      setEditingItem(null);
                      form.reset();
                    }}
                    data-testid="button-cancel"
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-save-item"
                  >
                    {createMutation.isPending || updateMutation.isPending ? t('common.saving') : t('common.save')}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle>{t('items.itemList')}</CardTitle>
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('items.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-items"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredItems && filteredItems.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('items.code')}</TableHead>
                  <TableHead>{t('items.name')}</TableHead>
                  <TableHead>{t('items.hsnCode')}</TableHead>
                  <TableHead>{t('items.category')}</TableHead>
                  <TableHead>{t('items.pack')}</TableHead>
                  <TableHead className="text-right">{t('items.cost')}</TableHead>
                  <TableHead className="text-right">{t('items.mrp')}</TableHead>
                  <TableHead className="text-right">{t('items.selling')}</TableHead>
                  <TableHead className="text-right">{t('items.taxPercent')}</TableHead>
                  <TableHead className="text-center">{t('common.status')}</TableHead>
                  <TableHead className="text-right">{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium font-mono">{item.code}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {item.name}
                        {item.isShared && (
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                            {t('items.shared')}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono">{item.hsnCode || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{item.category || "—"}</TableCell>
                    <TableCell className="font-mono">{item.packType}</TableCell>
                    <TableCell className="text-right font-mono">
                      ₹{parseFloat(item.cost).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      ₹{Math.round(parseFloat(item.mrp))}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      ₹{Math.round(parseFloat(item.sellingPrice))}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {parseFloat(item.tax).toFixed(2)}%
                    </TableCell>
                    <TableCell className="text-center">
                      {item.active ? (
                        <Badge variant="default" className="text-xs">{t('common.active')}</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">{t('common.inactive')}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(item)}
                        data-testid={`button-edit-item-${item.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-sm text-muted-foreground mb-1">
                {searchQuery ? t('items.noItemsFound') : t('items.noItemsYet')}
              </p>
              {!searchQuery && (
                <p className="text-xs text-muted-foreground mb-4">
                  {t('items.getStarted')}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
