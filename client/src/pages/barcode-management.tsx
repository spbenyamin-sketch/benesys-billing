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
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLabelDesigner(true)}
                data-testid="button-label-designer"
              >
                <Settings className="h-4 w-4 mr-2" />
                Design Template
              </Button>
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

interface TemplateElement {
  id: string;
  type: string;
  label: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily?: string;
  barcodeType?: string;
  decimals?: number;
  visible: boolean;
  width?: number;
  height?: number;
}

function LabelDesignerDialog({ open, onOpenChange }: LabelDesignerDialogProps) {
  const { toast } = useToast();
  const [templateName, setTemplateName] = useState("Default Template");
  const [labelWidth, setLabelWidth] = useState(50);
  const [labelHeight, setLabelHeight] = useState(25);
  const [isDefault, setIsDefault] = useState(false);
  const scale = 6; // Larger scale for display
  
  const elementTemplates: TemplateElement[] = [
    { id: "barcode", type: "barcode", label: "Barcode", x: 2, y: 2, fontSize: 12, fontFamily: "Arial", barcodeType: "CODE128", visible: true, width: 46, height: 8 },
    { id: "itemName", type: "text", label: "Item Name", x: 2, y: 11, fontSize: 8, fontFamily: "Arial", visible: true },
    { id: "size", type: "text", label: "Size", x: 2, y: 14, fontSize: 8, fontFamily: "Arial", visible: true },
    { id: "rate", type: "text", label: "Selling Rate", x: 2, y: 17, fontSize: 10, fontFamily: "Arial", decimals: 0, visible: true },
    { id: "mrp", type: "text", label: "MRP", x: 25, y: 17, fontSize: 8, fontFamily: "Arial", decimals: 0, visible: true },
    { id: "brand", type: "text", label: "Brand", x: 2, y: 20, fontSize: 6, fontFamily: "Arial", visible: false },
    { id: "quality", type: "text", label: "Quality", x: 2, y: 22, fontSize: 6, fontFamily: "Arial", visible: false },
    { id: "cost", type: "text", label: "Cost", x: 15, y: 20, fontSize: 7, fontFamily: "Arial", visible: false },
  ];

  const [elements, setElements] = useState<TemplateElement[]>(elementTemplates);
  const [selectedElement, setSelectedElement] = useState<string | null>("barcode");
  const [dragging, setDragging] = useState<{ id: string; offsetX: number; offsetY: number; canvasRect: DOMRect } | null>(null);

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

  const handleMouseDown = (e: React.MouseEvent, elementId: string) => {
    e.preventDefault();
    setSelectedElement(elementId);
    const canvasRect = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
    const elementRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragging({
      id: elementId,
      offsetX: e.clientX - elementRect.left,
      offsetY: e.clientY - elementRect.top,
      canvasRect: canvasRect,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    const canvasRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const newXPixels = e.clientX - dragging.canvasRect.left - dragging.offsetX;
    const newYPixels = e.clientY - dragging.canvasRect.top - dragging.offsetY;
    const newX = Math.max(0, Math.min(newXPixels / scale, labelWidth - 2));
    const newY = Math.max(0, Math.min(newYPixels / scale, labelHeight - 2));

    setElements(
      elements.map((el) =>
        el.id === dragging.id ? { ...el, x: Math.round(newX * 10) / 10, y: Math.round(newY * 10) / 10 } : el
      )
    );
  };

  const handleMouseUp = () => {
    setDragging(null);
  };

  const updateElement = (id: string, updates: Partial<TemplateElement>) => {
    setElements(elements.map((el) => (el.id === id ? { ...el, ...updates } : el)));
  };

  const handleSaveTemplate = () => {
    const config = JSON.stringify({ elements });
    saveMutation.mutate({
      name: templateName,
      labelWidth,
      labelHeight,
      labelsPerRow: 4,
      labelsPerColumn: 10,
      marginTop: 10,
      marginLeft: 5,
      gapHorizontal: 2,
      gapVertical: 2,
      config,
      isDefault,
    });
  };

  const selectedElConfig = elements.find((el) => el.id === selectedElement);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Label Designer - Visual Template Editor</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-4 gap-4">
          {/* Canvas - Main Area */}
          <div className="col-span-3 border rounded-lg p-4 bg-gray-50">
            <div className="flex flex-col gap-2 mb-4">
              <Label>Template Name</Label>
              <Input value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="My Label Template" />
            </div>

            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <Label className="text-xs">Width (mm)</Label>
                <Input type="number" value={labelWidth} onChange={(e) => setLabelWidth(Math.max(1, parseInt(e.target.value) || 50))} />
              </div>
              <div className="flex-1">
                <Label className="text-xs">Height (mm)</Label>
                <Input type="number" value={labelHeight} onChange={(e) => setLabelHeight(Math.max(1, parseInt(e.target.value) || 25))} />
              </div>
            </div>

            <p className="text-xs text-muted-foreground mb-2">Drag elements to position them on your label</p>

            {/* Canvas */}
            <div
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className="border-2 border-dashed border-gray-400 relative bg-white cursor-move overflow-auto flex items-center justify-center"
              style={{
                minWidth: `${labelWidth * scale + 20}px`,
                minHeight: `${labelHeight * scale + 20}px`,
                maxHeight: "550px",
              }}
            >
              <div
                style={{
                  width: `${labelWidth * scale}px`,
                  height: `${labelHeight * scale}px`,
                  position: "relative",
                }}
              >
                {/* Grid background */}
                <div
                  className="absolute inset-0 opacity-10 pointer-events-none"
                  style={{
                    backgroundImage: `
                      linear-gradient(0deg, transparent 24%, rgba(0,0,0,.1) 25%, rgba(0,0,0,.1) 26%, transparent 27%, transparent 74%, rgba(0,0,0,.1) 75%, rgba(0,0,0,.1) 76%, transparent 77%, transparent),
                      linear-gradient(90deg, transparent 24%, rgba(0,0,0,.1) 25%, rgba(0,0,0,.1) 26%, transparent 27%, transparent 74%, rgba(0,0,0,.1) 75%, rgba(0,0,0,.1) 76%, transparent 77%, transparent)
                    `,
                    backgroundSize: `${5 * scale}px ${5 * scale}px`,
                  }}
                />

                {elements
                  .filter((el) => el.visible)
                  .map((el) => (
                    <div
                      key={el.id}
                      onMouseDown={(e) => handleMouseDown(e, el.id)}
                      className={`absolute cursor-grab active:cursor-grabbing border transition-all ${
                        selectedElement === el.id ? "border-2 border-blue-500 bg-blue-50 shadow-lg" : "border border-gray-300 bg-white hover:bg-gray-100"
                      }`}
                      style={{
                        left: `${el.x * scale}px`,
                        top: `${el.y * scale}px`,
                        width: el.width ? `${el.width * scale}px` : "auto",
                        height: el.height ? `${el.height * scale}px` : "auto",
                        padding: "4px 6px",
                        fontSize: `${el.fontSize * 1.2}px`,
                        fontFamily: el.fontFamily || "Arial",
                        minWidth: "50px",
                        minHeight: "20px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <span className="text-xs font-semibold text-gray-600 truncate">{el.label}</span>
                    </div>
                  ))}
              </div>
            </div>

            <div className="flex items-center space-x-2 mt-4">
              <Checkbox id="isDefault" checked={isDefault} onCheckedChange={(checked) => setIsDefault(checked as boolean)} />
              <Label htmlFor="isDefault" className="text-sm">
                Set as default template
              </Label>
            </div>
          </div>

          {/* Properties Panel - Right Side */}
          <div className="border rounded-lg p-4 bg-gray-50 max-h-[550px] flex flex-col">
            <div className="font-semibold text-sm mb-4">Elements</div>
            <ScrollArea className="flex-1 pr-4 mb-4">
              <div className="space-y-2">
                {elements.map((el) => (
                  <div
                    key={el.id}
                    onClick={() => setSelectedElement(el.id)}
                    className={`p-2 rounded cursor-pointer border transition-all ${
                      selectedElement === el.id ? "border-blue-500 bg-blue-100" : "border-gray-200 bg-white hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Checkbox
                        checked={el.visible}
                        onCheckedChange={(checked) => updateElement(el.id, { visible: checked as boolean })}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span className="text-xs font-medium flex-1">{el.label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {selectedElConfig && (
              <div className="space-y-3 border-t pt-3">
                <div className="font-semibold text-sm">Properties</div>
                <div>
                  <Label className="text-xs">Position X (mm)</Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={selectedElConfig.x}
                    onChange={(e) => updateElement(selectedElConfig.id, { x: parseFloat(e.target.value) || 0 })}
                    className="text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">Position Y (mm)</Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={selectedElConfig.y}
                    onChange={(e) => updateElement(selectedElConfig.id, { y: parseFloat(e.target.value) || 0 })}
                    className="text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">Font Size</Label>
                  <Input
                    type="number"
                    value={selectedElConfig.fontSize}
                    onChange={(e) => updateElement(selectedElConfig.id, { fontSize: parseInt(e.target.value) || 8 })}
                    className="text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">Font Family</Label>
                  <select
                    value={selectedElConfig.fontFamily || "Arial"}
                    onChange={(e) => updateElement(selectedElConfig.id, { fontFamily: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                    data-testid="select-font-family"
                  >
                    <option value="Arial">Arial</option>
                    <option value="Helvetica">Helvetica</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Courier New">Courier New</option>
                    <option value="Verdana">Verdana</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Trebuchet MS">Trebuchet MS</option>
                    <option value="Monospace">Monospace</option>
                  </select>
                </div>
                {selectedElConfig.type === "barcode" && (
                  <div>
                    <Label className="text-xs">Barcode Type</Label>
                    <select
                      value={selectedElConfig.barcodeType || "CODE128"}
                      onChange={(e) => updateElement(selectedElConfig.id, { barcodeType: e.target.value })}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                      data-testid="select-barcode-type"
                    >
                      <option value="CODE128">CODE 128</option>
                      <option value="CODE39">CODE 39</option>
                      <option value="EAN13">EAN-13</option>
                      <option value="EAN8">EAN-8</option>
                      <option value="UPC">UPC-A</option>
                      <option value="QR">QR Code</option>
                      <option value="PDF417">PDF417</option>
                      <option value="DATAMATRIX">Data Matrix</option>
                    </select>
                  </div>
                )}
                {(selectedElConfig.id === "rate" || selectedElConfig.id === "mrp" || selectedElConfig.id === "cost") && (
                  <div>
                    <Label className="text-xs">Decimal Places</Label>
                    <Input
                      type="number"
                      min="0"
                      max="4"
                      value={selectedElConfig.decimals ?? 2}
                      onChange={(e) => updateElement(selectedElConfig.id, { decimals: parseInt(e.target.value) || 0 })}
                      className="text-xs"
                      data-testid="input-decimals"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveTemplate} disabled={saveMutation.isPending} data-testid="button-save-template">
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

interface TemplateData {
  id: number;
  name: string;
  labelWidth: number | string;
  labelHeight: number | string;
  config: string;
}

function PrintBarcodeDialog({ open, onOpenChange, items, selectedItems, onSelectionChange }: PrintBarcodeDialogProps) {
  const { toast } = useToast();
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);

  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ["/api/barcode-label-templates"],
    enabled: open,
  });

  // Set default template on first load
  React.useEffect(() => {
    if (templates && templates.length > 0 && !selectedTemplateId) {
      const defaultTemplate = templates.find((t: any) => t.isDefault) || templates[0];
      setSelectedTemplateId(defaultTemplate.id);
    }
  }, [templates, selectedTemplateId]);

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
    const selectedTemplate = templates?.find((t: any) => t.id === selectedTemplateId);
    
    if (!selectedTemplate) {
      toast({ title: "No template selected", description: "Please select a template to use", variant: "destructive" });
      return;
    }

    let printHtml = `
      <html>
        <head>
          <title>Barcode Labels</title>
          <style>
            @page { margin: 10mm; size: A4; }
            body { margin: 0; font-family: Arial, sans-serif; }
            .label { 
              display: inline-block; 
              width: ${selectedTemplate.labelWidth}mm; 
              height: ${selectedTemplate.labelHeight}mm; 
              border: 1px solid #ccc; 
              margin: 2mm; 
              page-break-inside: avoid;
              position: relative;
              overflow: hidden;
              font-size: 10px;
            }
            .element { position: absolute; }
          </style>
        </head>
        <body>
    `;

    const templateConfig = JSON.parse(selectedTemplate.config);

    selectedItemsList.forEach(item => {
      const qty = item.qty ? parseInt(item.qty.toString()) : 1;
      for (let i = 0; i < qty; i++) {
        printHtml += `<div class="label" style="position: relative; width: ${selectedTemplate.labelWidth}mm; height: ${selectedTemplate.labelHeight}mm;">`;
        
        templateConfig.elements.forEach((el: any) => {
          if (!el.visible) return;
          
          let value = "";
          if (el.id === "barcode") value = item.barcode;
          else if (el.id === "itemName") value = item.itname;
          else if (el.id === "size") value = item.size || "-";
          else if (el.id === "rate") {
            const decimals = el.decimals !== undefined ? el.decimals : 2;
            value = "₹ " + parseFloat(item.rate).toFixed(decimals);
          }
          else if (el.id === "mrp") {
            const decimals = el.decimals !== undefined ? el.decimals : 2;
            value = "₹ " + parseFloat(item.mrp).toFixed(decimals);
          }
          else if (el.id === "brand") value = item.brandname || "";
          else if (el.id === "quality") value = item.quality || "";
          else if (el.id === "cost") value = parseFloat(item.cost).toFixed(2);

          if (value) {
            const fontFamily = el.fontFamily || "Arial";
            printHtml += `
              <div class="element" style="
                position: absolute;
                left: ${el.x}mm;
                top: ${el.y}mm;
                font-size: ${el.fontSize}px;
                font-family: ${fontFamily};
                width: ${el.width || 20}mm;
                height: ${el.height || 5}mm;
                overflow: hidden;
                white-space: nowrap;
                word-wrap: break-word;
              ">${value}</div>
            `;
          }
        });
        
        printHtml += `</div>`;
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
          <div className="space-y-2">
            <Label className="font-semibold">Select Label Template</Label>
            <Select value={selectedTemplateId?.toString() || ""} onValueChange={(val) => setSelectedTemplateId(parseInt(val))}>
              <SelectTrigger data-testid="select-template">
                <SelectValue placeholder="Choose a template..." />
              </SelectTrigger>
              <SelectContent>
                {templates?.map((template: any) => (
                  <SelectItem key={template.id} value={template.id.toString()}>
                    {template.name} {template.isDefault ? "(Default)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
