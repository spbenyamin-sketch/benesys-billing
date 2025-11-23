import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileText, Download } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function PurchaseReport() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data: purchases, isLoading } = useQuery<any[]>({
    queryKey: ["/api/purchases"],
  });

  // Filter purchases by date range
  const filteredPurchases = purchases?.filter(purchase => {
    if (!startDate && !endDate) return true;
    const purchaseDate = new Date(purchase.date);
    if (startDate && purchaseDate < new Date(startDate)) return false;
    if (endDate && purchaseDate > new Date(endDate)) return false;
    return true;
  }) || [];

  // Calculate totals
  const totals = filteredPurchases.reduce((acc, purchase) => {
    const items = purchase.items || [];
    items.forEach((item: any) => {
      const qty = Number(item.qty || 0);
      const cost = Number(item.cost || 0);
      const tax = Number(item.tax || 0);
      const taxAmount = (cost * qty * tax) / 100;
      const totalAmount = cost * qty + taxAmount;

      acc.totalQty += qty;
      acc.totalCost += cost * qty;
      acc.totalTax += taxAmount;
      acc.totalAmount += totalAmount;

      // Group by tax rate
      const taxKey = `tax${tax}`;
      if (!acc.taxBreakdown[taxKey]) {
        acc.taxBreakdown[taxKey] = { rate: tax, amount: 0, taxAmount: 0 };
      }
      acc.taxBreakdown[taxKey].amount += cost * qty;
      acc.taxBreakdown[taxKey].taxAmount += taxAmount;
    });
    return acc;
  }, {
    totalQty: 0,
    totalCost: 0,
    totalTax: 0,
    totalAmount: 0,
    taxBreakdown: {} as Record<string, { rate: number; amount: number; taxAmount: number }>,
  });

  const handleExport = () => {
    // Create CSV content
    const headers = ["Date", "Invoice No", "Party", "City", "Items", "Total Qty", "Cost", "Tax", "Bill Amount"];
    const rows = filteredPurchases.map(purchase => {
      const items = purchase.items || [];
      const totalQty = items.reduce((sum: number, item: any) => sum + Number(item.qty || 0), 0);
      const totalCost = items.reduce((sum: number, item: any) => sum + (Number(item.cost || 0) * Number(item.qty || 0)), 0);
      const totalTax = items.reduce((sum: number, item: any) => {
        const cost = Number(item.cost || 0);
        const qty = Number(item.qty || 0);
        const tax = Number(item.tax || 0);
        return sum + ((cost * qty * tax) / 100);
      }, 0);
      const totalAmount = totalCost + totalTax;

      return [
        new Date(purchase.date).toLocaleDateString(),
        purchase.invoiceNo,
        purchase.partyName || "Cash",
        purchase.city || "",
        items.length,
        totalQty.toFixed(2),
        totalCost.toFixed(2),
        totalTax.toFixed(2),
        totalAmount.toFixed(2),
      ];
    });

    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `purchase-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Purchase Report</h1>
            <p className="text-muted-foreground">Detailed purchase analysis with tax breakdown</p>
          </div>
          <Button onClick={handleExport} variant="outline" data-testid="button-export">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Date Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  data-testid="input-start-date"
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  data-testid="input-end-date"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Purchases</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{filteredPurchases.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Quantity</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold font-mono">{totals.totalQty.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Tax</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold font-mono">₹{totals.totalTax.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold font-mono">₹{totals.totalAmount.toFixed(2)}</p>
            </CardContent>
          </Card>
        </div>

        {Object.keys(totals.taxBreakdown).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Tax Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tax Rate</TableHead>
                    <TableHead className="text-right">Base Amount</TableHead>
                    <TableHead className="text-right">Tax Amount</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.values(totals.taxBreakdown).map((item: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.rate}%</TableCell>
                      <TableCell className="text-right font-mono">₹{item.amount.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-mono">₹{item.taxAmount.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-mono font-medium">
                        ₹{(item.amount + item.taxAmount).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Purchase Details</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : filteredPurchases.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No purchases found for the selected date range</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Invoice No</TableHead>
                      <TableHead>Party</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead className="text-right">Items</TableHead>
                      <TableHead className="text-right">Total Qty</TableHead>
                      <TableHead className="text-right">Cost</TableHead>
                      <TableHead className="text-right">Tax</TableHead>
                      <TableHead className="text-right">Bill Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPurchases.map((purchase) => {
                      const items = purchase.items || [];
                      const totalQty = items.reduce((sum: number, item: any) => sum + Number(item.qty || 0), 0);
                      const totalCost = items.reduce((sum: number, item: any) => 
                        sum + (Number(item.cost || 0) * Number(item.qty || 0)), 0);
                      const totalTax = items.reduce((sum: number, item: any) => {
                        const cost = Number(item.cost || 0);
                        const qty = Number(item.qty || 0);
                        const tax = Number(item.tax || 0);
                        return sum + ((cost * qty * tax) / 100);
                      }, 0);
                      const totalAmount = totalCost + totalTax;

                      return (
                        <TableRow key={purchase.id} data-testid={`row-purchase-${purchase.id}`}>
                          <TableCell>{new Date(purchase.date).toLocaleDateString()}</TableCell>
                          <TableCell className="font-medium">{purchase.invoiceNo}</TableCell>
                          <TableCell>{purchase.partyName || "Cash"}</TableCell>
                          <TableCell className="text-muted-foreground">{purchase.city || "—"}</TableCell>
                          <TableCell className="text-right font-mono">{items.length}</TableCell>
                          <TableCell className="text-right font-mono">{totalQty.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-mono">₹{totalCost.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-mono">₹{totalTax.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-mono font-medium">₹{totalAmount.toFixed(2)}</TableCell>
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
