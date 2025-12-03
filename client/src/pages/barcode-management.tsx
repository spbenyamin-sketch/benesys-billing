import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ItemSearchModal } from "@/components/item-search-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Barcode, Search, Edit2, Check, X, Filter, RefreshCw, Settings, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

interface StockInwardItem {
  id: number;
  purchaseItemId: number;
  purchaseId: number;
  companyId: number;
  itemId: number | null;
  serial: number;
  barcode: string;
  itname: string;
  brandname: string | null;
  quality: string | null;
  dno1: string | null;
  pattern: string | null;
  sleeve: string | null;
  size: string | null;
  sizeCode: number | null;
  cost: string;
  ncost: string;
  lcost: string;
  rate: string;
  mrp: string;
  tax: string;
  status: string;
  soldAt: string | null;
  saleId: number | null;
  createdAt: string;
  purchaseNo?: number;
}

interface Purchase {
  id: number;
  purchaseNo: number;
  date: string;
  invoiceNo: string | null;
  partyName: string | null;
}

const SIZE_CODES: { [key: string]: number } = {
  "F": 45, "S": 47, "M": 49, "L": 51, "XL": 53, "2L": 55, "3L": 57,
  "4L": 59, "5L": 61, "6L": 63, "7L": 65, "8L": 67, "OS": 69,
  "32": 32, "34": 34, "36": 36, "38": 38, "40": 40, "42": 42, "44": 44,
  "1": 1, "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9,
  "10": 10, "11": 11, "12": 12
};

const parseSizeInput = (input: string): Array<{ size: string; sizeCode: number; quantity: number }> => {
  const results: Array<{ size: string; sizeCode: number; quantity: number }> = [];
  
  const parts = input.split(',').map(s => s.trim()).filter(s => s);
  
  for (const part of parts) {
    if (part.includes('-')) {
      const [start, end] = part.split('-').map(s => s.trim());
      const startNum = parseInt(start);
      const endNum = parseInt(end);
      
      if (!isNaN(startNum) && !isNaN(endNum)) {
        for (let i = startNum; i <= endNum; i++) {
          const size = i.toString();
          results.push({
            size,
            sizeCode: SIZE_CODES[size] || i,
            quantity: 1
          });
        }
      } else {
        const sizes = Object.keys(SIZE_CODES);
        const startIdx = sizes.indexOf(start.toUpperCase());
        const endIdx = sizes.indexOf(end.toUpperCase());
        
        if (startIdx !== -1 && endIdx !== -1) {
          for (let i = startIdx; i <= endIdx; i++) {
            const size = sizes[i];
            results.push({
              size,
              sizeCode: SIZE_CODES[size],
              quantity: 1
            });
          }
        }
      }
    } else if (part.includes(':')) {
      const [size, qty] = part.split(':').map(s => s.trim());
      const quantity = parseInt(qty) || 1;
      results.push({
        size: size.toUpperCase(),
        sizeCode: SIZE_CODES[size.toUpperCase()] || parseInt(size) || 0,
        quantity
      });
    } else {
      results.push({
        size: part.toUpperCase(),
        sizeCode: SIZE_CODES[part.toUpperCase()] || parseInt(part) || 0,
        quantity: 1
      });
    }
  }
  
  return results;
};

const getCompanyHeader = (): Record<string, string> => {
  const companyId = localStorage.getItem("currentCompanyId");
  return companyId ? { "X-Company-Id": companyId } : {};
};

export default function BarcodeManagement() {
  const { toast } = useToast();
  const [filterPurchaseId, setFilterPurchaseId] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterSize, setFilterSize] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editRate, setEditRate] = useState<string>("");
  const [editMrp, setEditMrp] = useState<string>("");
  const [showLabelDesigner, setShowLabelDesigner] = useState(false);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [showItemSearch, setShowItemSearch] = useState(false);

  const { data: stockItems, isLoading, refetch } = useQuery<StockInwardItem[]>({
    queryKey: ["/api/stock-inward-items", filterPurchaseId, filterStatus !== "all" ? filterStatus : null, filterSize],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterPurchaseId) params.append("purchaseId", filterPurchaseId);
      if (filterStatus && filterStatus !== "all") params.append("status", filterStatus);
      if (filterSize) params.append("size", filterSize);
      
      const res = await fetch(`/api/stock-inward-items?${params}`, {
        credentials: "include",
        headers: getCompanyHeader(),
      });
      if (!res.ok) throw new Error("Failed to fetch stock items");
      return res.json();
    },
  });

  const { data: purchases } = useQuery<Purchase[]>({
    queryKey: ["/api/purchases"],
    queryFn: async () => {
      const res = await fetch("/api/purchases", {
        credentials: "include",
        headers: getCompanyHeader(),
      });
      if (!res.ok) throw new Error("Failed to fetch purchases");
      return res.json();
    },
  });

  const filteredItems = useMemo(() => {
    if (!stockItems) return [];
    if (!searchTerm) return stockItems;
    
    const term = searchTerm.toLowerCase();
    return stockItems.filter(item =>
      item.barcode.toLowerCase().includes(term) ||
      item.itname.toLowerCase().includes(term) ||
      (item.brandname && item.brandname.toLowerCase().includes(term)) ||
      (item.size && item.size.toLowerCase().includes(term))
    );
  }, [stockItems, searchTerm]);

  const updateItemMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { rate?: string; mrp?: string } }) => {
      return (await apiRequest("PATCH", `/api/stock-inward-items/${id}`, data)).json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Item updated successfully" });
      setEditingId(null);
      setEditRate("");
      setEditMrp("");
      queryClient.invalidateQueries({ queryKey: ["/api/stock-inward-items"] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error?.message || "Failed to update item", 
        variant: "destructive" 
      });
    },
  });


  const handleStartEdit = (item: StockInwardItem) => {
    setEditingId(item.id);
    setEditRate(parseFloat(item.rate).toFixed(2));
    setEditMrp(parseFloat(item.mrp).toFixed(2));
  };

  const handleSaveEdit = (id: number) => {
    const rateNum = parseFloat(editRate);
    const mrpNum = parseFloat(editMrp);
    
    if (isNaN(rateNum) || rateNum < 0) {
      toast({ title: "Invalid Rate", description: "Please enter a valid rate", variant: "destructive" });
      return;
    }
    if (isNaN(mrpNum) || mrpNum < 0) {
      toast({ title: "Invalid MRP", description: "Please enter a valid MRP", variant: "destructive" });
      return;
    }
    
    updateItemMutation.mutate({
      id,
      data: {
        rate: rateNum.toFixed(2),
        mrp: mrpNum.toFixed(2),
      },
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditRate("");
    setEditMrp("");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available":
        return <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">Available</Badge>;
      case "sold":
        return <Badge variant="default" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">Sold</Badge>;
      case "returned":
        return <Badge variant="default" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">Returned</Badge>;
      case "damaged":
        return <Badge variant="default" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">Damaged</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Barcode Management</h1>
          <p className="text-muted-foreground">View, edit, and print stock inward barcodes</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowLabelDesigner(true)}
            data-testid="button-label-designer"
          >
            <Settings className="h-4 w-4 mr-2" />
            Label Designer
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Barcode, item name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search"
                />
              </div>
            </div>
            <div>
              <Label>Purchase</Label>
              <Select value={filterPurchaseId} onValueChange={setFilterPurchaseId}>
                <SelectTrigger data-testid="select-purchase">
                  <SelectValue placeholder="All purchases" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All purchases</SelectItem>
                  {purchases?.map((p) => (
                    <SelectItem key={p.id} value={p.id.toString()}>
                      #{p.purchaseNo} - {p.partyName || "N/A"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger data-testid="select-status">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="sold">Sold</SelectItem>
                  <SelectItem value="returned">Returned</SelectItem>
                  <SelectItem value="damaged">Damaged</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Size</Label>
              <Input
                placeholder="e.g., M, L, XL"
                value={filterSize}
                onChange={(e) => setFilterSize(e.target.value)}
                data-testid="input-filter-size"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFilterPurchaseId("");
                setFilterStatus("all");
                setFilterSize("");
                setSearchTerm("");
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Barcode className="h-5 w-5" />
              Stock Inward Items
              {filteredItems.length > 0 && (
                <Badge variant="outline">{filteredItems.length} items</Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No stock items found. Generate barcodes from Stock Inward page.
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Purchase No</TableHead>
                    <TableHead>Barcode</TableHead>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead className="text-center">Qty</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>MRP</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => (
                    <TableRow key={item.id} data-testid={`row-barcode-${item.id}`}>
                      <TableCell>
                        <Link href={`/purchases/${item.purchaseId}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 text-blue-600 hover:text-blue-800 hover:bg-transparent font-mono font-bold flex items-center gap-1"
                            data-testid={`link-purchase-${item.purchaseId}`}
                          >
                            #{item.purchaseNo || item.purchaseId}
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </Link>
                      </TableCell>
                      <TableCell className="font-mono font-medium" data-testid={`text-barcode-${item.id}`}>
                        {item.barcode}
                      </TableCell>
                      <TableCell data-testid={`text-itname-${item.id}`}>{item.itname}</TableCell>
                      <TableCell>{item.brandname || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.size || "-"}</Badge>
                      </TableCell>
                      <TableCell className="text-center font-bold" data-testid={`text-qty-${item.id}`}>
                        {item.qty || 1}
                      </TableCell>
                      <TableCell className="font-mono">{parseFloat(item.cost).toFixed(2)}</TableCell>
                      <TableCell className="font-mono">
                        {editingId === item.id ? (
                          <Input
                            type="number"
                            value={editRate}
                            onChange={(e) => setEditRate(e.target.value)}
                            className="w-24 h-8"
                            data-testid={`input-rate-${item.id}`}
                          />
                        ) : (
                          parseFloat(item.rate).toFixed(2)
                        )}
                      </TableCell>
                      <TableCell className="font-mono">
                        {editingId === item.id ? (
                          <Input
                            type="number"
                            value={editMrp}
                            onChange={(e) => setEditMrp(e.target.value)}
                            className="w-24 h-8"
                            data-testid={`input-mrp-${item.id}`}
                          />
                        ) : (
                          parseFloat(item.mrp).toFixed(2)
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell>
                        {editingId === item.id ? (
                          <div className="flex gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleSaveEdit(item.id)}
                              disabled={updateItemMutation.isPending}
                              data-testid={`button-save-${item.id}`}
                            >
                              <Check className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={handleCancelEdit}
                              data-testid={`button-cancel-${item.id}`}
                            >
                              <X className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleStartEdit(item)}
                              disabled={item.status === "sold"}
                              data-testid={`button-edit-${item.id}`}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  disabled={item.status === "sold" || deleteItemMutation.isPending}
                                  data-testid={`button-delete-${item.id}`}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Barcode</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete barcode {item.barcode}? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteItem(item.id)}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <LabelDesignerDialog
        open={showLabelDesigner}
        onOpenChange={setShowLabelDesigner}
      />

      <PrintLabelsDialog
        open={showPrintDialog}
        onOpenChange={setShowPrintDialog}
        selectedItems={stockItems?.filter(item => selectedItems.has(item.id)) || []}
      />
    </div>
  );
}

interface LabelDesignerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function LabelDesignerDialog({ open, onOpenChange }: LabelDesignerDialogProps) {
  const { toast } = useToast();
  const [templateName, setTemplateName] = useState("Default Template");
  const [labelWidth, setLabelWidth] = useState("50");
  const [labelHeight, setLabelHeight] = useState("25");
  const [labelsPerRow, setLabelsPerRow] = useState("4");
  const [labelsPerColumn, setLabelsPerColumn] = useState("10");
  const [marginTop, setMarginTop] = useState("10");
  const [marginLeft, setMarginLeft] = useState("5");
  const [gapH, setGapH] = useState("2");
  const [gapV, setGapV] = useState("2");
  const [showBarcode, setShowBarcode] = useState(true);
  const [showItemName, setShowItemName] = useState(true);
  const [showSize, setShowSize] = useState(true);
  const [showRate, setShowRate] = useState(true);
  const [showMrp, setShowMrp] = useState(true);
  const [showBrand, setShowBrand] = useState(false);
  const [isDefault, setIsDefault] = useState(false);

  const { data: templates, refetch: refetchTemplates } = useQuery({
    queryKey: ["/api/barcode-label-templates"],
    enabled: open,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      return (await apiRequest("POST", "/api/barcode-label-templates", data)).json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Template saved successfully" });
      refetchTemplates();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save template", variant: "destructive" });
    },
  });

  const handleSaveTemplate = () => {
    const config = JSON.stringify({
      elements: [
        { type: "barcode", visible: showBarcode, x: 5, y: 5, width: 40, height: 10 },
        { type: "itemName", visible: showItemName, x: 5, y: 16, fontSize: 8 },
        { type: "size", visible: showSize, x: 35, y: 16, fontSize: 8 },
        { type: "rate", visible: showRate, x: 5, y: 20, fontSize: 10 },
        { type: "mrp", visible: showMrp, x: 30, y: 20, fontSize: 10 },
        { type: "brand", visible: showBrand, x: 5, y: 12, fontSize: 6 },
      ],
    });

    saveMutation.mutate({
      name: templateName,
      labelWidth,
      labelHeight,
      labelsPerRow: parseInt(labelsPerRow),
      labelsPerColumn: parseInt(labelsPerColumn),
      marginTop,
      marginLeft,
      gapHorizontal: gapH,
      gapVertical: gapV,
      config,
      isDefault,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Barcode Label Designer</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="layout">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="layout">Layout</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="layout" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Template Name</Label>
                <Input
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  data-testid="input-template-name"
                />
              </div>
              <div className="flex items-center space-x-2 pt-6">
                <Checkbox
                  id="isDefault"
                  checked={isDefault}
                  onCheckedChange={(checked) => setIsDefault(checked as boolean)}
                />
                <Label htmlFor="isDefault">Set as default template</Label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Label Width (mm)</Label>
                <Input
                  type="number"
                  value={labelWidth}
                  onChange={(e) => setLabelWidth(e.target.value)}
                  data-testid="input-label-width"
                />
              </div>
              <div>
                <Label>Label Height (mm)</Label>
                <Input
                  type="number"
                  value={labelHeight}
                  onChange={(e) => setLabelHeight(e.target.value)}
                  data-testid="input-label-height"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Labels per Row</Label>
                <Input
                  type="number"
                  value={labelsPerRow}
                  onChange={(e) => setLabelsPerRow(e.target.value)}
                  data-testid="input-labels-per-row"
                />
              </div>
              <div>
                <Label>Labels per Column</Label>
                <Input
                  type="number"
                  value={labelsPerColumn}
                  onChange={(e) => setLabelsPerColumn(e.target.value)}
                  data-testid="input-labels-per-column"
                />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label>Top Margin (mm)</Label>
                <Input
                  type="number"
                  value={marginTop}
                  onChange={(e) => setMarginTop(e.target.value)}
                />
              </div>
              <div>
                <Label>Left Margin (mm)</Label>
                <Input
                  type="number"
                  value={marginLeft}
                  onChange={(e) => setMarginLeft(e.target.value)}
                />
              </div>
              <div>
                <Label>Horizontal Gap (mm)</Label>
                <Input
                  type="number"
                  value={gapH}
                  onChange={(e) => setGapH(e.target.value)}
                />
              </div>
              <div>
                <Label>Vertical Gap (mm)</Label>
                <Input
                  type="number"
                  value={gapV}
                  onChange={(e) => setGapV(e.target.value)}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="content" className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="showBarcode"
                  checked={showBarcode}
                  onCheckedChange={(checked) => setShowBarcode(checked as boolean)}
                />
                <Label htmlFor="showBarcode">Show Barcode</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="showItemName"
                  checked={showItemName}
                  onCheckedChange={(checked) => setShowItemName(checked as boolean)}
                />
                <Label htmlFor="showItemName">Show Item Name</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="showBrand"
                  checked={showBrand}
                  onCheckedChange={(checked) => setShowBrand(checked as boolean)}
                />
                <Label htmlFor="showBrand">Show Brand</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="showSize"
                  checked={showSize}
                  onCheckedChange={(checked) => setShowSize(checked as boolean)}
                />
                <Label htmlFor="showSize">Show Size</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="showRate"
                  checked={showRate}
                  onCheckedChange={(checked) => setShowRate(checked as boolean)}
                />
                <Label htmlFor="showRate">Show Selling Rate</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="showMrp"
                  checked={showMrp}
                  onCheckedChange={(checked) => setShowMrp(checked as boolean)}
                />
                <Label htmlFor="showMrp">Show MRP</Label>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preview">
            <div className="border rounded-lg p-4 bg-white">
              <div
                className="border-2 border-dashed border-gray-300 relative mx-auto"
                style={{
                  width: `${parseFloat(labelWidth) * 3}px`,
                  height: `${parseFloat(labelHeight) * 3}px`,
                }}
              >
                {showBarcode && (
                  <div className="absolute top-1 left-1 right-1 h-8 bg-gray-200 flex items-center justify-center text-xs">
                    |||||||||||||||
                  </div>
                )}
                {showItemName && (
                  <div className="absolute top-10 left-1 text-[8px] font-medium truncate max-w-full">
                    Sample Item Name
                  </div>
                )}
                {showBrand && (
                  <div className="absolute top-7 left-1 text-[6px] text-gray-500">
                    Brand Name
                  </div>
                )}
                {showSize && (
                  <div className="absolute top-10 right-1 text-[8px] font-bold">
                    M
                  </div>
                )}
                <div className="absolute bottom-1 left-1 right-1 flex justify-between">
                  {showRate && (
                    <span className="text-[10px] font-bold">Rs. 499</span>
                  )}
                  {showMrp && (
                    <span className="text-[8px] text-gray-500 line-through">MRP: 599</span>
                  )}
                </div>
              </div>
              <p className="text-center text-sm text-muted-foreground mt-2">
                Label Preview (3x scale)
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveTemplate} disabled={saveMutation.isPending}>
            Save Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface PrintLabelsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedItems: StockInwardItem[];
}

function PrintLabelsDialog({ open, onOpenChange, selectedItems }: PrintLabelsDialogProps) {
  const [copies, setCopies] = useState("1");

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const labelsHtml = selectedItems.map(item => `
      <div class="label">
        <div class="barcode">${item.barcode}</div>
        <div class="item-name">${item.itname}</div>
        <div class="size">${item.size || ""}</div>
        <div class="prices">
          <span class="rate">Rs. ${parseFloat(item.rate).toFixed(0)}</span>
          <span class="mrp">MRP: ${parseFloat(item.mrp).toFixed(0)}</span>
        </div>
      </div>
    `).join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Print Labels</title>
        <style>
          @page { size: A4; margin: 10mm; }
          body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
          .labels-container { display: flex; flex-wrap: wrap; gap: 2mm; }
          .label {
            width: 50mm;
            height: 25mm;
            border: 1px solid #000;
            padding: 2mm;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          .barcode {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            text-align: center;
            letter-spacing: 2px;
          }
          .item-name {
            font-size: 8px;
            font-weight: bold;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .size {
            font-size: 10px;
            font-weight: bold;
            text-align: right;
          }
          .prices {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .rate { font-size: 12px; font-weight: bold; }
          .mrp { font-size: 8px; color: #666; text-decoration: line-through; }
          @media print {
            .label { break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="labels-container">
          ${labelsHtml.repeat(parseInt(copies))}
        </div>
        <script>
          window.onload = function() { window.print(); window.close(); }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Print Labels</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Selected Items</Label>
            <p className="text-sm text-muted-foreground">{selectedItems.length} items selected</p>
          </div>

          <div>
            <Label>Copies per Item</Label>
            <Input
              type="number"
              min="1"
              max="10"
              value={copies}
              onChange={(e) => setCopies(e.target.value)}
              data-testid="input-copies"
            />
          </div>

          <div className="text-sm text-muted-foreground">
            Total labels to print: {selectedItems.length * parseInt(copies || "1")}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface Item {
  id: number;
  code: string;
  name: string;
  hsnCode?: string;
  cgstRate?: string;
  sgstRate?: string;
  packType?: string;
}

interface BarcodeManagementPageProps {
  showItemSearch: boolean;
  setShowItemSearch: (show: boolean) => void;
  items: Item[];
}
