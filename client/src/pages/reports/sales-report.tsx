import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface SaleReport {
  id: number;
  invoiceNo: number;
  billType: string;
  date: string;
  partyName: string | null;
  partyCity: string | null;
  saleValue: string;
  taxValue: string;
  cgstTotal: string;
  sgstTotal: string;
  grandTotal: string;
  totalQty: string;
}

export default function SalesReport() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [billTypeFilter, setBillTypeFilter] = useState<string>("all");

  const { data: sales, isLoading } = useQuery<SaleReport[]>({
    queryKey: ["/api/reports/sales", { startDate, endDate, billType: billTypeFilter }],
  });

  const filteredSales = sales?.filter((sale) => {
    if (billTypeFilter !== "all" && sale.billType !== billTypeFilter) return false;
    return true;
  });

  const totals = filteredSales?.reduce(
    (acc, sale) => ({
      qty: acc.qty + parseFloat(sale.totalQty),
      saleValue: acc.saleValue + parseFloat(sale.saleValue),
      taxValue: acc.taxValue + parseFloat(sale.taxValue),
      cgst: acc.cgst + parseFloat(sale.cgstTotal),
      sgst: acc.sgst + parseFloat(sale.sgstTotal),
      grandTotal: acc.grandTotal + parseFloat(sale.grandTotal),
    }),
    { qty: 0, saleValue: 0, taxValue: 0, cgst: 0, sgst: 0, grandTotal: 0 }
  ) || { qty: 0, saleValue: 0, taxValue: 0, cgst: 0, sgst: 0, grandTotal: 0 };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Sales Report</h1>
        <p className="text-muted-foreground mt-2">
          Detailed sales analysis with filters and summaries
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                data-testid="input-start-date"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                data-testid="input-end-date"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="billType">Bill Type</Label>
              <Select value={billTypeFilter} onValueChange={setBillTypeFilter}>
                <SelectTrigger id="billType" data-testid="select-bill-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="GST">GST Bills</SelectItem>
                  <SelectItem value="EST">Estimates</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 sm:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold font-mono" data-testid="text-total-invoices">
              {filteredSales?.length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Quantity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold font-mono" data-testid="text-total-qty">
              {totals.qty.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tax</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold font-mono" data-testid="text-total-tax">
              ₹{totals.taxValue.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Grand Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold font-mono" data-testid="text-grand-total">
              ₹{totals.grandTotal.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sales Details</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredSales && filteredSales.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Sale Value</TableHead>
                  <TableHead className="text-right">CGST</TableHead>
                  <TableHead className="text-right">SGST</TableHead>
                  <TableHead className="text-right">Tax</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium font-mono">
                      {sale.billType}-{sale.invoiceNo}
                    </TableCell>
                    <TableCell>{format(new Date(sale.date), "dd MMM yyyy")}</TableCell>
                    <TableCell>
                      <Badge variant={sale.billType === "GST" ? "default" : "secondary"}>
                        {sale.billType}
                      </Badge>
                    </TableCell>
                    <TableCell>{sale.partyName || "Cash Sale"}</TableCell>
                    <TableCell className="text-right font-mono">
                      ₹{parseFloat(sale.saleValue).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      ₹{parseFloat(sale.cgstTotal).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      ₹{parseFloat(sale.sgstTotal).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      ₹{parseFloat(sale.taxValue).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      ₹{parseFloat(sale.grandTotal).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-sm text-muted-foreground">No sales data for selected period</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
