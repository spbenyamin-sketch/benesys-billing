import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ItemSearchModal } from "@/components/item-search-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Barcode, Search, Edit2, Check, X, Filter, RefreshCw, Settings, ExternalLink, Printer } from "lucide-react";
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
  const [showItemSearch, setShowItemSearch] = useState(false);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [selectedItemsForPrint, setSelectedItemsForPrint] = useState<Set<number>>(new Set());

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
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPrintDialog(true)}
              disabled={!filteredItems.length}
              data-testid="button-print-barcodes"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print Barcodes
            </Button>
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

      <PrintBarcodeDialog
        open={showPrintDialog}
        onOpenChange={setShowPrintDialog}
        items={filteredItems}
        selectedItems={selectedItemsForPrint}
        onSelectionChange={setSelectedItemsForPrint}
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
  
  // Basic fields
  const [showBarcode, setShowBarcode] = useState(true);
  const [showItemName, setShowItemName] = useState(true);
  const [showSize, setShowSize] = useState(true);
  const [showRate, setShowRate] = useState(true);
  const [showMrp, setShowMrp] = useState(true);
  const [showBrand, setShowBrand] = useState(false);
  
  // Attribute fields
  const [showQuality, setShowQuality] = useState(false);
  const [showPattern, setShowPattern] = useState(false);
  const [showSleeve, setShowSleeve] = useState(false);
  const [showDno1, setShowDno1] = useState(false);
  
  // Cost fields
  const [showCost, setShowCost] = useState(false);
  const [showNcost, setShowNcost] = useState(false);
  const [showLcost, setShowLcost] = useState(false);
  
  // Additional fields
  const [showTax, setShowTax] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [showPurchaseNo, setShowPurchaseNo] = useState(false);
  const [showSerial, setShowSerial] = useState(false);
  
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
        { type: "serial", visible: showSerial, x: 5, y: 2, fontSize: 6 },
        { type: "purchaseNo", visible: showPurchaseNo, x: 35, y: 2, fontSize: 6 },
        { type: "barcode", visible: showBarcode, x: 5, y: 5, width: 40, height: 10 },
        { type: "itemName", visible: showItemName, x: 5, y: 16, fontSize: 8 },
        { type: "brand", visible: showBrand, x: 5, y: 12, fontSize: 6 },
        { type: "quality", visible: showQuality, x: 5, y: 14, fontSize: 6 },
        { type: "pattern", visible: showPattern, x: 15, y: 14, fontSize: 6 },
        { type: "sleeve", visible: showSleeve, x: 25, y: 14, fontSize: 6 },
        { type: "dno1", visible: showDno1, x: 35, y: 14, fontSize: 6 },
        { type: "size", visible: showSize, x: 35, y: 16, fontSize: 8 },
        { type: "cost", visible: showCost, x: 5, y: 18, fontSize: 7 },
        { type: "ncost", visible: showNcost, x: 15, y: 18, fontSize: 7 },
        { type: "lcost", visible: showLcost, x: 25, y: 18, fontSize: 7 },
        { type: "tax", visible: showTax, x: 35, y: 18, fontSize: 7 },
        { type: "rate", visible: showRate, x: 5, y: 20, fontSize: 10 },
        { type: "mrp", visible: showMrp, x: 30, y: 20, fontSize: 10 },
        { type: "status", visible: showStatus, x: 5, y: 22, fontSize: 6 },
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
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                <div className="font-semibold text-sm mb-3">Reference Fields</div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="showSerial"
                    checked={showSerial}
                    onCheckedChange={(checked) => setShowSerial(checked as boolean)}
                  />
                  <Label htmlFor="showSerial">Show Serial Number</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="showPurchaseNo"
                    checked={showPurchaseNo}
                    onCheckedChange={(checked) => setShowPurchaseNo(checked as boolean)}
                  />
                  <Label htmlFor="showPurchaseNo">Show Purchase Number</Label>
                </div>

                <div className="font-semibold text-sm mb-3 mt-4">Basic Info</div>
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

                <div className="font-semibold text-sm mb-3 mt-4">Attributes</div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="showQuality"
                    checked={showQuality}
                    onCheckedChange={(checked) => setShowQuality(checked as boolean)}
                  />
                  <Label htmlFor="showQuality">Show Quality</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="showPattern"
                    checked={showPattern}
                    onCheckedChange={(checked) => setShowPattern(checked as boolean)}
                  />
                  <Label htmlFor="showPattern">Show Pattern</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="showSleeve"
                    checked={showSleeve}
                    onCheckedChange={(checked) => setShowSleeve(checked as boolean)}
                  />
                  <Label htmlFor="showSleeve">Show Sleeve</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="showDno1"
                    checked={showDno1}
                    onCheckedChange={(checked) => setShowDno1(checked as boolean)}
                  />
                  <Label htmlFor="showDno1">Show Design Number</Label>
                </div>

                <div className="font-semibold text-sm mb-3 mt-4">Pricing</div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="showCost"
                    checked={showCost}
                    onCheckedChange={(checked) => setShowCost(checked as boolean)}
                  />
                  <Label htmlFor="showCost">Show Cost Price</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="showNcost"
                    checked={showNcost}
                    onCheckedChange={(checked) => setShowNcost(checked as boolean)}
                  />
                  <Label htmlFor="showNcost">Show Net Cost</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="showLcost"
                    checked={showLcost}
                    onCheckedChange={(checked) => setShowLcost(checked as boolean)}
                  />
                  <Label htmlFor="showLcost">Show Last Cost</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="showTax"
                    checked={showTax}
                    onCheckedChange={(checked) => setShowTax(checked as boolean)}
                  />
                  <Label htmlFor="showTax">Show Tax %</Label>
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

                <div className="font-semibold text-sm mb-3 mt-4">Status</div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="showStatus"
                    checked={showStatus}
                    onCheckedChange={(checked) => setShowStatus(checked as boolean)}
                  />
                  <Label htmlFor="showStatus">Show Item Status</Label>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="preview">
            <div className="border rounded-lg p-4 bg-white">
              <div
                className="border-2 border-dashed border-gray-300 relative mx-auto overflow-hidden"
                style={{
                  width: `${parseFloat(labelWidth) * 3}px`,
                  height: `${parseFloat(labelHeight) * 3}px`,
                  fontSize: "11px",
                }}
              >
                {showSerial && (
                  <div className="absolute top-0.5 left-0.5 text-[6px] text-gray-600">
                    S: 1001
                  </div>
                )}
                {showPurchaseNo && (
                  <div className="absolute top-0.5 right-0.5 text-[6px] text-gray-600">
                    P: 1
                  </div>
                )}
                {showBarcode && (
                  <div className="absolute top-2 left-1 right-1 h-7 bg-gray-200 flex items-center justify-center text-xs">
                    |||||||||||
                  </div>
                )}
                {showItemName && (
                  <div className="absolute top-9 left-1 text-[7px] font-medium truncate w-4/5">
                    Sample Item
                  </div>
                )}
                {showBrand && (
                  <div className="absolute top-11 left-1 text-[6px] text-gray-500">
                    Brand
                  </div>
                )}
                {(showQuality || showPattern || showSleeve || showDno1) && (
                  <div className="absolute top-12 left-1 text-[5px] text-gray-600 flex gap-1">
                    {showQuality && <span>Qlt: A</span>}
                    {showPattern && <span>Pat: Std</span>}
                    {showSleeve && <span>Slv: S</span>}
                    {showDno1 && <span>D#: 101</span>}
                  </div>
                )}
                {showSize && (
                  <div className="absolute top-9 right-1 text-[8px] font-bold">
                    M
                  </div>
                )}
                {(showCost || showNcost || showLcost || showTax) && (
                  <div className="absolute top-13 left-1 text-[6px] text-gray-600 flex gap-1">
                    {showCost && <span>C: 300</span>}
                    {showNcost && <span>N: 310</span>}
                    {showLcost && <span>L: 320</span>}
                    {showTax && <span>T: 5%</span>}
                  </div>
                )}
                <div className="absolute bottom-2 left-1 right-1 flex justify-between items-center">
                  {showRate && (
                    <span className="text-[9px] font-bold">Rs. 499</span>
                  )}
                  {showMrp && (
                    <span className="text-[7px] text-gray-500 line-through">MRP: 599</span>
                  )}
                </div>
                {showStatus && (
                  <div className="absolute bottom-0.5 right-0.5 text-[6px] px-1 bg-green-100 text-green-800">
                    Available
                  </div>
                )}
              </div>
              <p className="text-center text-sm text-muted-foreground mt-2">
                Label Preview (3x scale) - Showing all selected fields
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

interface PrintBarcodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: StockInwardItem[];
  selectedItems: Set<number>;
  onSelectionChange: (selected: Set<number>) => void;
}

function PrintBarcodeDialog({ open, onOpenChange, items, selectedItems, onSelectionChange }: PrintBarcodeDialogProps) {
  const { toast } = useToast();

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(new Set(items.map(item => item.id)));
    } else {
      onSelectionChange(new Set());
    }
  };

  const handleSelectItem = (itemId: number, checked: boolean) => {
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(itemId);
    } else {
      newSelected.delete(itemId);
    }
    onSelectionChange(newSelected);
  };

  const handlePrint = () => {
    if (selectedItems.size === 0) {
      toast({ title: "No items selected", description: "Please select at least one barcode to print", variant: "destructive" });
      return;
    }

    const selectedItemsList = items.filter(item => selectedItems.has(item.id));
    let printHtml = `
      <html>
        <head>
          <title>Barcode Labels</title>
          <style>
            @page { margin: 10mm; size: A4; }
            body { margin: 0; font-family: Arial, sans-serif; }
            .label { 
              display: inline-block; 
              width: 50mm; 
              height: 25mm; 
              border: 1px solid #ccc; 
              padding: 2mm; 
              margin: 2mm; 
              page-break-inside: avoid;
              position: relative;
              overflow: hidden;
              font-size: 10px;
            }
            .barcode { font-size: 12px; font-weight: bold; letter-spacing: 2px; }
            .item-name { font-size: 8px; font-weight: bold; }
            .size { font-size: 9px; font-weight: bold; }
            .rate { font-size: 11px; font-weight: bold; color: #d32f2f; }
            .details { font-size: 7px; }
          </style>
        </head>
        <body>
    `;

    selectedItemsList.forEach(item => {
      const qty = item.qty ? parseInt(item.qty.toString()) : 1;
      for (let i = 0; i < qty; i++) {
        printHtml += `
          <div class="label">
            <div class="barcode">${item.barcode}</div>
            <div class="item-name">${item.itname}</div>
            <div style="display: flex; justify-content: space-between;">
              <span class="size">${item.size || '-'}</span>
              ${item.brandname ? `<span style="font-size: 7px;">${item.brandname}</span>` : ''}
            </div>
            <div class="details" style="margin-top: 2mm;">
              <div>₹ <span class="rate">${parseFloat(item.rate).toFixed(2)}</span></div>
              <div style="font-size: 6px; color: #666;">MRP: ₹${parseFloat(item.mrp).toFixed(2)}</div>
            </div>
          </div>
        `;
      }
    });

    printHtml += `
        </body>
      </html>
    `;

    const printWindow = window.open('', '', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.write(printHtml);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
        onOpenChange(false);
      }, 250);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Print Barcodes</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center space-x-2 border-b pb-3">
            <Checkbox
              id="selectAll"
              checked={selectedItems.size === items.length && items.length > 0}
              onCheckedChange={handleSelectAll}
            />
            <Label htmlFor="selectAll" className="font-semibold">
              Select All ({selectedItems.size}/{items.length} selected)
            </Label>
          </div>

          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-2">
              {items.map(item => (
                <div key={item.id} className="flex items-center space-x-3 p-2 border rounded">
                  <Checkbox
                    checked={selectedItems.has(item.id)}
                    onCheckedChange={(checked) => handleSelectItem(item.id, checked as boolean)}
                  />
                  <div className="flex-1">
                    <div className="font-mono font-bold text-sm">{item.barcode}</div>
                    <div className="text-sm">{item.itname}</div>
                    <div className="text-xs text-muted-foreground flex gap-2">
                      {item.brandname && <span>{item.brandname}</span>}
                      {item.size && <span>Size: {item.size}</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">₹{parseFloat(item.rate).toFixed(2)}</div>
                    <div className="text-xs text-muted-foreground">
                      Qty: {item.qty || 1} stickers
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handlePrint} disabled={selectedItems.size === 0} data-testid="button-print-selected">
            <Printer className="h-4 w-4 mr-2" />
            Print {selectedItems.size > 0 ? `(${selectedItems.size})` : ""} Labels
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
