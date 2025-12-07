import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ItemSearchModal } from "@/components/item-search-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, Package, AlertCircle, Printer, Eye, BarChart2, Grid, List, ArrowUpRight, ArrowDownLeft, History } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useReactToPrint } from "react-to-print";
import { useCompany } from "@/contexts/CompanyContext";
import { format } from "date-fns";

interface StockItem {
  id: number;
  stockInwardId: number;
  itemId: number;
  itemCode: string;
  itemName: string;
  category: string | null;
  packType: string;
  brandName: string | null;
  quality: string | null;
  size: string | null;
  partyId: number | null;
  partyName: string | null;
  quantity: string;
  cost: string;
  ncost: string | null;
  rate: string | null;
  status: string;
}

interface Party {
  id: number;
  code: string;
  name: string;
}

interface Item {
  id: number;
  code: string;
  name: string;
  hsnCode?: string;
  cost?: string;
  tax?: string;
  cgst?: string;
  sgst?: string;
}

interface ItemHistory {
  item: {
    id: number;
    code: string;
    name: string;
    hsnCode: string | null;
    category: string | null;
    packType: string;
    cost: string;
    cgstRate: string | null;
    sgstRate: string | null;
  };
  stock: { currentQty: number; avgCost: number; valuation: number };
  purchases: Array<{
    purchaseId: number;
    purchaseNo: string;
    date: string;
    partyName: string | null;
    quantity: string;
    rate: string;
    mrp: string | null;
    amount: string;
    barcode: string | null;
  }>;
  sales: Array<{
    saleId: number;
    invoiceNo: number;
    billType: string;
    date: string;
    partyName: string | null;
    quantity: string;
    rate: string;
    amount: string;
    barcode: string | null;
  }>;
  movement: { totalPurchasedQty: number; totalSoldQty: number; balanceQty: number };
}

function ItemHistoryDialog({ 
  itemId, 
  isOpen, 
  onClose 
}: { 
  itemId: number | null; 
  isOpen: boolean; 
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { data: history, isLoading } = useQuery<ItemHistory>({
    queryKey: [`/api/items/${itemId}/history`],
    enabled: !!itemId && isOpen,
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            {t('stock.itemMovementHistory')}
          </DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : history ? (
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('stock.code')}</p>
                    <p className="font-mono font-medium">{history.item.code}</p>
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <p className="text-sm text-muted-foreground">{t('common.name')}</p>
                    <p className="font-medium">{history.item.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('items.hsnCode')}</p>
                    <p className="font-mono">{history.item.hsnCode || "—"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('stock.category')}</p>
                    <p>{history.item.category || "—"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('stock.packType')}</p>
                    <p>{history.item.packType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('stock.rate')}</p>
                    <p className="font-mono">₹{parseFloat(history.item.cost).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('common.tax')}</p>
                    <p className="font-mono text-sm">
                      {history.item.cgstRate && history.item.sgstRate 
                        ? `${parseFloat(history.item.cgstRate) + parseFloat(history.item.sgstRate)}%`
                        : "—"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-green-200 dark:border-green-900">
                <CardContent className="pt-4 text-center">
                  <ArrowDownLeft className="h-5 w-5 mx-auto mb-1 text-green-600" />
                  <p className="text-sm text-muted-foreground">{t('stock.purchased')}</p>
                  <p className="text-xl font-mono font-bold text-green-600">
                    {history.movement.totalPurchasedQty.toFixed(2)}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-red-200 dark:border-red-900">
                <CardContent className="pt-4 text-center">
                  <ArrowUpRight className="h-5 w-5 mx-auto mb-1 text-red-600" />
                  <p className="text-sm text-muted-foreground">{t('stock.sold')}</p>
                  <p className="text-xl font-mono font-bold text-red-600">
                    {history.movement.totalSoldQty.toFixed(2)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <Package className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">{t('stock.currentStock')}</p>
                  <p className="text-xl font-mono font-bold">{history.stock.currentQty.toFixed(2)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <BarChart2 className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">{t('stock.valuation')}</p>
                  <p className="text-xl font-mono font-bold">₹{history.stock.valuation.toFixed(2)}</p>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="purchases" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="purchases" data-testid="tab-purchases">
                  {t('stock.purchases')} ({history.purchases.length})
                </TabsTrigger>
                <TabsTrigger value="sales" data-testid="tab-sales">
                  {t('stock.sales')} ({history.sales.length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="purchases" className="mt-4">
                {history.purchases.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('common.date')}</TableHead>
                        <TableHead>{t('stock.purchaseNo')}</TableHead>
                        <TableHead>{t('stock.party')}</TableHead>
                        <TableHead className="text-right">{t('stock.qty')}</TableHead>
                        <TableHead className="text-right">{t('stock.rate')}</TableHead>
                        <TableHead className="text-right">{t('stock.amount')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {history.purchases.map((purchase, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-mono text-sm">
                            {format(new Date(purchase.date), "dd/MM/yyyy")}
                          </TableCell>
                          <TableCell className="font-mono">{purchase.purchaseNo}</TableCell>
                          <TableCell>{purchase.partyName || "—"}</TableCell>
                          <TableCell className="text-right font-mono">
                            {parseFloat(purchase.quantity).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            ₹{parseFloat(purchase.rate || "0").toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            ₹{parseFloat(purchase.amount || "0").toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    {t('stock.noPurchaseHistory')}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="sales" className="mt-4">
                {history.sales.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('common.date')}</TableHead>
                        <TableHead>{t('stock.invoice')}</TableHead>
                        <TableHead>{t('stock.type')}</TableHead>
                        <TableHead>{t('stock.party')}</TableHead>
                        <TableHead className="text-right">{t('stock.qty')}</TableHead>
                        <TableHead className="text-right">{t('stock.rate')}</TableHead>
                        <TableHead className="text-right">{t('stock.amount')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {history.sales.map((sale, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-mono text-sm">
                            {format(new Date(sale.date), "dd/MM/yyyy")}
                          </TableCell>
                          <TableCell className="font-mono">{sale.billType}-{sale.invoiceNo}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {sale.billType}
                            </Badge>
                          </TableCell>
                          <TableCell>{sale.partyName || t('stock.cash')}</TableCell>
                          <TableCell className="text-right font-mono">
                            {parseFloat(sale.quantity).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            ₹{parseFloat(sale.rate || "0").toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            ₹{parseFloat(sale.amount || "0").toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    {t('stock.noSalesHistory')}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            {t('stock.failedToLoad')}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function StockReportPrint({ 
  items, 
  totals, 
  companyName,
  filters,
  t
}: { 
  items: StockItem[]; 
  totals: { totalItems: number; totalQty: number; totalValue: number };
  companyName: string;
  filters: string;
  t: any;
}) {
  return (
    <div className="p-8 bg-white text-black">
      <div className="text-center mb-6">
        <h1 className="text-xl font-bold">{companyName}</h1>
        <h2 className="text-lg font-semibold">{t('stock.inventoryReport')}</h2>
        <p className="text-sm text-gray-600">{t('stock.generated')}: {format(new Date(), "dd/MM/yyyy HH:mm")}</p>
        {filters && <p className="text-sm text-gray-600">{filters}</p>}
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6 text-center">
        <div className="border p-2">
          <p className="text-sm text-gray-600">{t('stock.totalItems')}</p>
          <p className="text-lg font-bold">{totals.totalItems}</p>
        </div>
        <div className="border p-2">
          <p className="text-sm text-gray-600">{t('stock.totalQuantity')}</p>
          <p className="text-lg font-bold">{totals.totalQty.toFixed(3)}</p>
        </div>
        <div className="border p-2">
          <p className="text-sm text-gray-600">{t('stock.totalValue')}</p>
          <p className="text-lg font-bold">₹{totals.totalValue.toFixed(2)}</p>
        </div>
      </div>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-black">
            <th className="text-left py-1 px-1">{t('stock.code')}</th>
            <th className="text-left py-1 px-1">{t('stock.itemName')}</th>
            <th className="text-left py-1 px-1">{t('stock.category')}</th>
            <th className="text-left py-1 px-1">{t('stock.pack')}</th>
            <th className="text-right py-1 px-1">{t('stock.rate')}</th>
            <th className="text-right py-1 px-1">{t('stock.qty')}</th>
            <th className="text-right py-1 px-1">{t('stock.value')}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={idx} className="border-b border-gray-200">
              <td className="py-1 px-1 font-mono text-xs">{item.itemCode}</td>
              <td className="py-1 px-1">{item.itemName}</td>
              <td className="py-1 px-1">{item.category || "—"}</td>
              <td className="py-1 px-1">{item.packType}</td>
              <td className="text-right py-1 px-1">{parseFloat(item.cost).toFixed(2)}</td>
              <td className="text-right py-1 px-1">{parseFloat(item.quantity).toFixed(3)}</td>
              <td className="text-right py-1 px-1">
                {(parseFloat(item.quantity) * parseFloat(item.cost)).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-black font-bold">
            <td colSpan={5} className="py-2 px-1">{t('common.total')}</td>
            <td className="text-right py-2 px-1">{totals.totalQty.toFixed(3)}</td>
            <td className="text-right py-2 px-1">₹{totals.totalValue.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

export default function Stock() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [packTypeFilter, setPackTypeFilter] = useState("all");
  const [stockStatusFilter, setStockStatusFilter] = useState("all");
  const [partyFilter, setPartyFilter] = useState("all");
  const [itemFilter, setItemFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [showItemSearch, setShowItemSearch] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const { currentCompany } = useCompany();

  // Fetch parties list
  const { data: parties } = useQuery<Party[]>({
    queryKey: ["/api/parties"],
  });

  // Build query params
  const queryParams = new URLSearchParams();
  if (partyFilter !== "all") queryParams.set("partyId", partyFilter);
  if (itemFilter !== "all") queryParams.set("itemId", itemFilter);
  
  const queryString = queryParams.toString();
  const apiUrl = queryString ? `/api/stock?${queryString}` : "/api/stock";

  const { data: stock, isLoading } = useQuery<StockItem[]>({
    queryKey: ["/api/stock", partyFilter, itemFilter],
    queryFn: async () => {
      const res = await fetch(apiUrl, { credentials: "include", headers: { "X-Company-Id": localStorage.getItem("currentCompanyId") || "" } });
      if (!res.ok) throw new Error("Failed to fetch stock");
      return res.json();
    },
  });

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Stock-Report-${format(new Date(), "yyyy-MM-dd")}`,
  });

  // Get unique values for filters from fetched data
  const categories = Array.from(new Set(stock?.map(item => item.category).filter(Boolean))).sort();
  const packTypes = Array.from(new Set(stock?.map(item => item.packType))).sort();
  const items = Array.from(new Set(stock?.map(item => item.itemId))).map(itemId => {
    const item = stock?.find(s => s.itemId === itemId);
    return item ? { id: item.itemId, code: item.itemCode, name: item.itemName } : null;
  }).filter(Boolean).sort((a, b) => (a?.code || "").localeCompare(b?.code || ""));

  const filteredStock = stock?.filter((item) => {
    // Text search
    const matchesSearch = 
      item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.itemCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.partyName?.toLowerCase().includes(searchQuery.toLowerCase());

    // Category filter
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;

    // Pack type filter
    const matchesPackType = packTypeFilter === "all" || item.packType === packTypeFilter;

    // Stock status filter
    const qty = parseFloat(item.quantity);
    let matchesStatus = true;
    if (stockStatusFilter === "instock") matchesStatus = qty > 10;
    else if (stockStatusFilter === "low") matchesStatus = qty > 0 && qty <= 10;
    else if (stockStatusFilter === "out") matchesStatus = qty === 0;

    return matchesSearch && matchesCategory && matchesPackType && matchesStatus;
  });

  const lowStockItems = filteredStock?.filter(item => parseFloat(item.quantity) < 10 && parseFloat(item.quantity) > 0) || [];
  const outOfStockItems = filteredStock?.filter(item => parseFloat(item.quantity) === 0) || [];

  const totals = {
    totalItems: filteredStock?.length || 0,
    totalQty: filteredStock?.reduce((sum, item) => sum + parseFloat(item.quantity), 0) || 0,
    totalValue: filteredStock?.reduce((sum, item) => sum + (parseFloat(item.quantity) * parseFloat(item.cost)), 0) || 0,
  };

  const activeFilters = [
    partyFilter !== "all" ? `Party: ${parties?.find(p => p.id.toString() === partyFilter)?.name}` : null,
    itemFilter !== "all" ? `Item: ${items.find(i => i?.id.toString() === itemFilter)?.name}` : null,
    categoryFilter !== "all" ? `Category: ${categoryFilter}` : null,
    packTypeFilter !== "all" ? `Pack: ${packTypeFilter}` : null,
    stockStatusFilter !== "all" ? `Status: ${stockStatusFilter}` : null,
  ].filter(Boolean).join(", ");

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{t('stock.title')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('stock.subtitle')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => setViewMode(viewMode === "list" ? "grid" : "list")}>
            {viewMode === "list" ? <Grid className="h-4 w-4" /> : <List className="h-4 w-4" />}
          </Button>
          <Button onClick={() => handlePrint()} disabled={!filteredStock?.length} data-testid="button-print-stock">
            <Printer className="h-4 w-4 mr-2" />
            {t('common.print')}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 sm:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('stock.totalItems')}</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold font-mono" data-testid="text-total-items">
              {totals.totalItems}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('stock.totalQuantity')}</CardTitle>
            <BarChart2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold font-mono" data-testid="text-total-qty">
              {totals.totalQty.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('stock.stockValue')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold font-mono" data-testid="text-stock-value">
              ₹{totals.totalValue.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card className={lowStockItems.length + outOfStockItems.length > 0 ? "border-orange-200 dark:border-orange-900" : ""}>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('stock.alerts')}</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              <span className="text-orange-600 font-medium">{lowStockItems.length}</span> {t('stock.lowStock')}
              <span className="mx-2">|</span>
              <span className="text-red-600 font-medium">{outOfStockItems.length}</span> {t('stock.outOfStock')}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>{t('stock.filters')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-6">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="search">{t('common.search')}</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder={t('stock.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-stock"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="party">{t('stock.supplier')}</Label>
              <Select value={partyFilter} onValueChange={setPartyFilter}>
                <SelectTrigger id="party" data-testid="select-party">
                  <SelectValue placeholder={t('stock.allSuppliers')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('stock.allSuppliers')}</SelectItem>
                  {parties?.map((party) => (
                    <SelectItem key={party.id} value={party.id.toString()}>
                      {party.code} - {party.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="item">{t('stock.item')}</Label>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start text-left h-9"
                onClick={() => setShowItemSearch(true)}
                data-testid="button-search-stock-item"
              >
                {itemFilter && itemFilter !== "all" 
                  ? items.find(i => i?.id.toString() === itemFilter)?.name 
                  : t('stock.allItems')}
              </Button>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">{t('stock.category')}</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger id="category" data-testid="select-category">
                  <SelectValue placeholder={t('stock.allCategories')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('stock.allCategories')}</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat!}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="packType">{t('stock.packType')}</Label>
              <Select value={packTypeFilter} onValueChange={setPackTypeFilter}>
                <SelectTrigger id="packType" data-testid="select-pack-type">
                  <SelectValue placeholder={t('stock.allPackTypes')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('stock.allPackTypes')}</SelectItem>
                  {packTypes.map((pt) => (
                    <SelectItem key={pt} value={pt}>{pt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">{t('stock.stockStatus')}</Label>
              <Select value={stockStatusFilter} onValueChange={setStockStatusFilter}>
                <SelectTrigger id="status" data-testid="select-status">
                  <SelectValue placeholder={t('common.all')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('common.all')}</SelectItem>
                  <SelectItem value="instock">{t('stock.inStockAbove10')}</SelectItem>
                  <SelectItem value="low">{t('stock.lowStock1to10')}</SelectItem>
                  <SelectItem value="out">{t('stock.outOfStock')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stock List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle>{t('stock.stockList')}</CardTitle>
            {activeFilters && (
              <Badge variant="outline" className="text-xs">
                {activeFilters}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : viewMode === "list" ? (
            filteredStock && filteredStock.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('stock.code')}</TableHead>
                    <TableHead>{t('stock.itemName')}</TableHead>
                    <TableHead>{t('stock.supplier')}</TableHead>
                    <TableHead>{t('stock.category')}</TableHead>
                    <TableHead>{t('stock.packType')}</TableHead>
                    <TableHead className="text-right">{t('stock.rate')}</TableHead>
                    <TableHead className="text-right">{t('stock.quantity')}</TableHead>
                    <TableHead className="text-right">{t('stock.value')}</TableHead>
                    <TableHead className="text-center">{t('common.status')}</TableHead>
                    <TableHead className="text-center">{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStock.map((item) => {
                    const qty = parseFloat(item.quantity);
                    const isLow = qty < 10 && qty > 0;
                    const isOut = qty === 0;
                    const value = qty * parseFloat(item.cost);

                    return (
                      <TableRow key={item.stockInwardId} data-testid={`row-stock-${item.stockInwardId}`}>
                        <TableCell className="font-medium font-mono">{item.itemCode}</TableCell>
                        <TableCell>{item.itemName}</TableCell>
                        <TableCell className="text-muted-foreground">{item.partyName || "—"}</TableCell>
                        <TableCell className="text-muted-foreground">{item.category || "—"}</TableCell>
                        <TableCell className="font-mono">{item.packType}</TableCell>
                        <TableCell className="text-right font-mono">
                          ₹{parseFloat(item.cost).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-mono font-medium">
                          {qty.toFixed(3)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          ₹{value.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center">
                          {isOut ? (
                            <Badge variant="destructive" className="text-xs">{t('stock.outOfStock')}</Badge>
                          ) : isLow ? (
                            <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200">{t('stock.lowStock')}</Badge>
                          ) : (
                            <Badge variant="default" className="text-xs">{t('stock.inStock')}</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedItemId(item.itemId);
                              setHistoryDialogOpen(true);
                            }}
                            data-testid={`button-view-history-${item.stockInwardId}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Package className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-sm text-muted-foreground mb-1">
                  {searchQuery || categoryFilter !== "all" || packTypeFilter !== "all" || stockStatusFilter !== "all" 
                    ? t('stock.noItemsMatchingFilters') 
                    : t('stock.noStockData')}
                </p>
              </div>
            )
          ) : (
            // Grid view
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredStock?.map((item) => {
                const qty = parseFloat(item.quantity);
                const isLow = qty < 10 && qty > 0;
                const isOut = qty === 0;
                const value = qty * parseFloat(item.cost);

                return (
                  <Card key={item.stockInwardId} className={`${isOut ? 'border-red-200' : isLow ? 'border-orange-200' : ''}`}>
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-mono text-xs text-muted-foreground">{item.itemCode}</p>
                          <h3 className="font-medium">{item.itemName}</h3>
                          <p className="text-xs text-muted-foreground">{item.partyName || "—"}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {isOut ? (
                            <Badge variant="destructive" className="text-xs">{t('stock.out')}</Badge>
                          ) : isLow ? (
                            <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">{t('stock.low')}</Badge>
                          ) : (
                            <Badge variant="default" className="text-xs">{t('stock.ok')}</Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedItemId(item.itemId);
                              setHistoryDialogOpen(true);
                            }}
                            data-testid={`button-view-history-grid-${item.stockInwardId}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs">{t('stock.category')}</p>
                          <p>{item.category || "—"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">{t('stock.pack')}</p>
                          <p>{item.packType}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">{t('stock.quantity')}</p>
                          <p className="font-mono font-medium">{qty.toFixed(3)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">{t('stock.value')}</p>
                          <p className="font-mono">₹{value.toFixed(2)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hidden print container */}
      <div style={{ position: 'absolute', left: '-9999px', top: '0' }}>
        <div ref={printRef}>
          <StockReportPrint
            items={filteredStock || []}
            totals={totals}
            companyName={currentCompany?.name || "Company"}
            filters={activeFilters}
            t={t}
          />
        </div>
      </div>

      {/* Item History Dialog */}
      <ItemHistoryDialog
        itemId={selectedItemId}
        isOpen={historyDialogOpen}
        onClose={() => {
          setHistoryDialogOpen(false);
          setSelectedItemId(null);
        }}
      />

      <ItemSearchModal
        open={showItemSearch}
        items={items.filter((i): i is Item => i !== null)}
        isLoading={false}
        onSelect={(item) => {
          setItemFilter(item.id.toString());
          setShowItemSearch(false);
        }}
        onClose={() => setShowItemSearch(false)}
        title={t('stock.searchSelectItem')}
      />
    </div>
  );
}
