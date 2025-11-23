import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Package, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface StockItem {
  id: number;
  itemId: number;
  itemCode: string;
  itemName: string;
  category: string | null;
  packType: string;
  quantity: string;
  cost: string;
}

export default function Stock() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: stock, isLoading } = useQuery<StockItem[]>({
    queryKey: ["/api/stock"],
  });

  const filteredStock = stock?.filter((item) =>
    item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.itemCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const lowStockItems = filteredStock?.filter(item => parseFloat(item.quantity) < 10) || [];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Stock Inventory</h1>
        <p className="text-muted-foreground mt-2">
          View current stock levels and inventory status
        </p>
      </div>

      {lowStockItems.length > 0 && (
        <Card className="border-orange-200 bg-orange-50/50 dark:border-orange-900 dark:bg-orange-950/20">
          <CardHeader className="flex flex-row items-center gap-2 space-y-0">
            <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            <CardTitle className="text-base text-orange-900 dark:text-orange-100">
              Low Stock Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-orange-800 dark:text-orange-200">
              {lowStockItems.length} item{lowStockItems.length !== 1 ? "s" : ""} {lowStockItems.length !== 1 ? "are" : "is"} running low on stock (below 10 units)
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle>Stock List</CardTitle>
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by item name, code, or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-stock"
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
          ) : filteredStock && filteredStock.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Pack Type</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStock.map((item) => {
                  const qty = parseFloat(item.quantity);
                  const isLow = qty < 10;
                  const isOut = qty === 0;

                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium font-mono">{item.itemCode}</TableCell>
                      <TableCell>{item.itemName}</TableCell>
                      <TableCell className="text-muted-foreground">{item.category || "—"}</TableCell>
                      <TableCell className="font-mono">{item.packType}</TableCell>
                      <TableCell className="text-right font-mono">
                        ₹{parseFloat(item.cost).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium">
                        {qty.toFixed(3)}
                      </TableCell>
                      <TableCell className="text-center">
                        {isOut ? (
                          <Badge variant="destructive" className="text-xs">Out of Stock</Badge>
                        ) : isLow ? (
                          <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200">Low Stock</Badge>
                        ) : (
                          <Badge variant="default" className="text-xs">In Stock</Badge>
                        )}
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
                {searchQuery ? "No items found" : "No stock data available"}
              </p>
              {!searchQuery && (
                <p className="text-xs text-muted-foreground">
                  Stock levels will update as you make sales and purchases
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
