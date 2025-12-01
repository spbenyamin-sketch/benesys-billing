import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { Search, Package, Barcode, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function StockView() {
  const [barcode, setBarcode] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: purchases } = useQuery<any[]>({
    queryKey: ["/api/purchases"],
  });

  // Flatten all stock inward items with their details
  const allStockItems = purchases?.flatMap(purchase => 
    (purchase.stockInwardItems || []).map((item: any) => ({
      ...item,
      purchaseDate: purchase.date,
      purchaseInvoice: purchase.invoiceNo,
      partyName: purchase.partyName,
    }))
  ) || [];

  // Filter by barcode or search query
  const filteredItems = allStockItems.filter(item => {
    if (barcode && item.barcode) {
      return item.barcode.toLowerCase().includes(barcode.toLowerCase());
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        item.itname?.toLowerCase().includes(query) ||
        item.quality?.toLowerCase().includes(query) ||
        item.barcode?.toLowerCase().includes(query) ||
        item.serial?.toString().includes(query)
      );
    }
    return true;
  });

  // Group by barcode to show stock summary
  const stockSummary = filteredItems.reduce((acc: any[], item: any) => {
    const existingItem = acc.find(i => i.barcode === item.barcode);
    if (existingItem) {
      existingItem.totalQty += Number(item.qty || 0);
      existingItem.stockQty += Number(item.stockqty || 0);
      existingItem.saleQty += Number(item.saleqty || 0);
      existingItem.damagedQty += Number(item.dqty || 0);
    } else {
      acc.push({
        ...item,
        totalQty: Number(item.qty || 0),
        stockQty: Number(item.stockqty || 0),
        saleQty: Number(item.saleqty || 0),
        damagedQty: Number(item.dqty || 0),
      });
    }
    return acc;
  }, []);

  // Check for expiring items (within 30 days)
  const expiringItems = stockSummary.filter(item => {
    if (!item.expdate) return false;
    const expDate = new Date(item.expdate);
    const today = new Date();
    const daysUntilExpiry = Math.floor((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry >= 0 && daysUntilExpiry <= 30;
  });

  // Check for expired items
  const expiredItems = stockSummary.filter(item => {
    if (!item.expdate) return false;
    const expDate = new Date(item.expdate);
    return expDate < new Date();
  });

  const handleBarcodeSearch = () => {
    // Barcode filtering handled by filteredItems
  };

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Stock View</h1>
          <p className="text-muted-foreground">Search and view detailed stock information</p>
        </div>

        {(expiringItems.length > 0 || expiredItems.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {expiredItems.length > 0 && (
              <Card className="border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20">
                <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  <CardTitle className="text-base text-red-900 dark:text-red-100">
                    Expired Items
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-red-800 dark:text-red-200">
                    {expiredItems.length} item{expiredItems.length !== 1 ? "s have" : " has"} expired
                  </p>
                </CardContent>
              </Card>
            )}
            {expiringItems.length > 0 && (
              <Card className="border-orange-200 bg-orange-50/50 dark:border-orange-900 dark:bg-orange-950/20">
                <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-3">
                  <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  <CardTitle className="text-base text-orange-900 dark:text-orange-100">
                    Expiring Soon
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-orange-800 dark:text-orange-200">
                    {expiringItems.length} item{expiringItems.length !== 1 ? "s expire" : " expires"} within 30 days
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Search Stock</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="barcode">Barcode Search</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Barcode className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="barcode"
                      placeholder="Enter barcode..."
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleBarcodeSearch()}
                      className="pl-9"
                      data-testid="input-barcode"
                    />
                  </div>
                  <Button onClick={handleBarcodeSearch} data-testid="button-search-barcode">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="search">Item Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search by name, brand, serial..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                    data-testid="input-search"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stock Details</CardTitle>
          </CardHeader>
          <CardContent>
            {stockSummary.length === 0 ? (
              <div className="text-center py-12">
                <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {barcode || searchQuery ? "No matching items found" : "No stock data available"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Serial</TableHead>
                      <TableHead>Barcode</TableHead>
                      <TableHead>Item Name</TableHead>
                      <TableHead>Brand</TableHead>
                      <TableHead>Quality</TableHead>
                      <TableHead>Purchase Date</TableHead>
                      <TableHead>Expiry Date</TableHead>
                      <TableHead className="text-right">Purchased</TableHead>
                      <TableHead className="text-right">Sold</TableHead>
                      <TableHead className="text-right">Damaged</TableHead>
                      <TableHead className="text-right">In Stock</TableHead>
                      <TableHead className="text-right">Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stockSummary.map((item, index) => {
                      const isExpired = item.expdate && new Date(item.expdate) < new Date();
                      const isExpiring = !isExpired && item.expdate && (() => {
                        const expDate = new Date(item.expdate);
                        const daysUntilExpiry = Math.floor((expDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                        return daysUntilExpiry <= 30;
                      })();

                      return (
                        <TableRow key={index} data-testid={`row-stock-${index}`}>
                          <TableCell className="font-mono">{item.serial}</TableCell>
                          <TableCell className="font-mono">{item.barcode || "—"}</TableCell>
                          <TableCell className="font-medium">{item.itname}</TableCell>
                          <TableCell className="text-muted-foreground">{item.brandname || "—"}</TableCell>
                          <TableCell className="text-muted-foreground">{item.name || "—"}</TableCell>
                          <TableCell>{item.purchaseDate ? new Date(item.purchaseDate).toLocaleDateString() : "—"}</TableCell>
                          <TableCell>
                            {item.expdate ? (
                              <div className="flex items-center gap-2">
                                <span>{new Date(item.expdate).toLocaleDateString()}</span>
                                {isExpired && (
                                  <Badge variant="destructive" className="text-xs">Expired</Badge>
                                )}
                                {isExpiring && (
                                  <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200">
                                    Expiring
                                  </Badge>
                                )}
                              </div>
                            ) : "—"}
                          </TableCell>
                          <TableCell className="text-right font-mono">{item.totalQty.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-mono">{item.saleQty.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-mono">{item.damagedQty.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-mono font-medium">{item.stockQty.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-mono">₹{Number(item.arate || 0).toFixed(2)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
