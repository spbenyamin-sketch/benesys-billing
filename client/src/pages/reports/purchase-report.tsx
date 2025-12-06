import { useState, useRef } from "react";
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
import { FileText, Download, Printer } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useReactToPrint } from "react-to-print";
import { format } from "date-fns";

interface PurchaseItem {
  id: number;
  purchaseId: number;
  itemId: number;
  qty: string;
  cost: string;
  tax: string;
  itemName?: string;
}

interface PurchaseReport {
  id: number;
  purchaseNo: number;
  date: string;
  partyId: number | null;
  partyName: string | null;
  city: string | null;
  amount: string;
  details: string | null;
  items: PurchaseItem[];
}

export default function PurchaseReport() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const printRef = useRef<HTMLDivElement>(null);

  const queryParams = new URLSearchParams();
  if (startDate) queryParams.set("startDate", startDate);
  if (endDate) queryParams.set("endDate", endDate);
  const queryString = queryParams.toString();
  const apiUrl = queryString ? `/api/reports/purchases?${queryString}` : "/api/reports/purchases";

  const { data: purchases, isLoading } = useQuery<PurchaseReport[]>({
    queryKey: ["/api/reports/purchases", startDate, endDate],
    queryFn: async () => {
      const res = await fetch(apiUrl, { credentials: "include", headers: { "X-Company-Id": localStorage.getItem("currentCompanyId") || "" } });
      if (!res.ok) throw new Error("Failed to fetch purchases report");
      return res.json();
    },
  });

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Purchase-Report-${format(new Date(), "yyyy-MM-dd")}`,
  });

  const totals = (purchases || []).reduce((acc, purchase) => {
    const items = purchase.items || [];
    items.forEach((item) => {
      const qty = Number(item.qty || 0);
      const cost = Number(item.cost || 0);
      const tax = Number(item.tax || 0);
      const taxAmount = (cost * qty * tax) / 100;
      const totalAmount = cost * qty + taxAmount;

      acc.totalQty += qty;
      acc.totalCost += cost * qty;
      acc.totalTax += taxAmount;
      acc.totalAmount += totalAmount;

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
    const headers = ["Date", "Invoice No", "Party", "City", "Items", "Total Qty", "Cost", "Tax", "Bill Amount"];
    const rows = (purchases || []).map(purchase => {
      const items = purchase.items || [];
      const totalQty = items.reduce((sum, item) => sum + Number(item.qty || 0), 0);
      const totalCost = items.reduce((sum, item) => sum + (Number(item.cost || 0) * Number(item.qty || 0)), 0);
      const totalTax = items.reduce((sum, item) => {
        const cost = Number(item.cost || 0);
        const qty = Number(item.qty || 0);
        const tax = Number(item.tax || 0);
        return sum + ((cost * qty * tax) / 100);
      }, 0);
      const totalAmount = totalCost + totalTax;

      return [
        new Date(purchase.date).toLocaleDateString(),
        purchase.purchaseNo,
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
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold">Purchase Report</h1>
            <p className="text-muted-foreground">Detailed purchase analysis with tax breakdown</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => handlePrint()} variant="outline" data-testid="button-print">
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            <Button onClick={handleExport} variant="outline" data-testid="button-export">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
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
              <p className="text-2xl font-bold" data-testid="text-total-purchases">{purchases?.length || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Quantity</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold font-mono" data-testid="text-total-qty">{totals.totalQty.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Tax</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold font-mono" data-testid="text-total-tax">₹{totals.totalTax.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold font-mono" data-testid="text-total-amount">₹{totals.totalAmount.toFixed(2)}</p>
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
                  {Object.values(totals.taxBreakdown).map((item, index) => (
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

        <div ref={printRef}>
          <Card>
            <CardHeader className="print:hidden">
              <CardTitle>Purchase Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="hidden print:block mb-4">
                <h2 className="text-xl font-bold">Purchase Report</h2>
                <p className="text-sm text-muted-foreground">
                  {startDate && endDate ? `${startDate} to ${endDate}` : "All dates"}
                </p>
                <div className="flex gap-8 mt-2 text-sm">
                  <span>Total Purchases: <strong>{purchases?.length || 0}</strong></span>
                  <span>Total Amount: <strong>₹{totals.totalAmount.toFixed(2)}</strong></span>
                </div>
              </div>
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : !purchases || purchases.length === 0 ? (
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
                      {purchases.map((purchase) => {
                        const items = purchase.items || [];
                        const totalQty = items.reduce((sum, item) => sum + Number(item.qty || 0), 0);
                        const totalCost = items.reduce((sum, item) => 
                          sum + (Number(item.cost || 0) * Number(item.qty || 0)), 0);
                        const totalTax = items.reduce((sum, item) => {
                          const cost = Number(item.cost || 0);
                          const qty = Number(item.qty || 0);
                          const tax = Number(item.tax || 0);
                          return sum + ((cost * qty * tax) / 100);
                        }, 0);
                        const totalAmount = totalCost + totalTax;

                        return (
                          <TableRow key={purchase.id} data-testid={`row-purchase-${purchase.id}`}>
                            <TableCell>{format(new Date(purchase.date), "dd MMM yyyy")}</TableCell>
                            <TableCell className="font-medium font-mono">P-{purchase.purchaseNo}</TableCell>
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
                      <TableRow className="font-bold bg-muted/50">
                        <TableCell colSpan={5}>Total</TableCell>
                        <TableCell className="text-right font-mono">{totals.totalQty.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-mono">₹{totals.totalCost.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-mono">₹{totals.totalTax.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-mono">₹{totals.totalAmount.toFixed(2)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
