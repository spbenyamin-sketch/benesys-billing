import { useState, useRef } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Printer } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useReactToPrint } from "react-to-print";

interface SaleReport {
  id: number;
  invoiceNo: number;
  billType: string;
  saleType: string;
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
  const [saleTypeFilter, setSaleTypeFilter] = useState<string>("all");
  const [selectedItemId, setSelectedItemId] = useState("");
  const printRef = useRef<HTMLDivElement>(null);

  // Fetch master items for the filter
  const { data: masterItems } = useQuery({
    queryKey: ["/api/items"],
  });

  // Build query params as URL search params
  const queryParams = new URLSearchParams();
  if (startDate) queryParams.set("startDate", startDate);
  if (endDate) queryParams.set("endDate", endDate);
  if (saleTypeFilter !== "all") queryParams.set("saleType", saleTypeFilter);
  if (selectedItemId) queryParams.set("itemId", selectedItemId);

  const queryString = queryParams.toString();
  const apiUrl = queryString ? `/api/reports/sales?${queryString}` : "/api/reports/sales";

  const { data: sales, isLoading } = useQuery<SaleReport[]>({
    queryKey: ["/api/reports/sales", startDate, endDate, saleTypeFilter, selectedItemId],
    queryFn: async () => {
      const res = await fetch(apiUrl, { credentials: "include", headers: { "X-Company-Id": localStorage.getItem("currentCompanyId") || "" } });
      if (!res.ok) throw new Error("Failed to fetch sales report");
      return res.json();
    },
  });

  const filteredSales = sales?.filter((sale) => {
    if (saleTypeFilter !== "all" && sale.saleType !== saleTypeFilter) return false;
    return true;
  });

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Sales-Report-${format(new Date(), "yyyy-MM-dd")}`,
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
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Sales Report</h1>
          <p className="text-muted-foreground mt-2">
            Detailed sales analysis with filters and summaries
          </p>
        </div>
        <Button variant="outline" onClick={() => handlePrint()} data-testid="button-print-report">
          <Printer className="mr-2 h-4 w-4" />
          Print Report
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-4">
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
              <Label htmlFor="saleType">Sale Type</Label>
              <Select value={saleTypeFilter} onValueChange={setSaleTypeFilter}>
                <SelectTrigger id="saleType" data-testid="select-sale-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="B2B">B2B (Credit)</SelectItem>
                  <SelectItem value="B2C">B2C (Cash/Retail)</SelectItem>
                  <SelectItem value="ESTIMATE">Estimate</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="itemId">Item Master</Label>
              <Select value={selectedItemId} onValueChange={setSelectedItemId} data-testid="select-item-master">
                <SelectTrigger id="itemId">
                  <SelectValue placeholder="All Items" />
                </SelectTrigger>
                <SelectContent>
                  {masterItems?.map((item) => (
                    <SelectItem key={item.id} value={item.id.toString()}>
                      {item.code} - {item.name}
                    </SelectItem>
                  ))}
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

      <div ref={printRef}>
        <Card>
          <CardHeader className="print:hidden">
            <CardTitle>Sales Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="hidden print:block mb-4">
              <h2 className="text-xl font-bold">Sales Report</h2>
              <p className="text-sm text-muted-foreground">
                {startDate && endDate ? `${startDate} to ${endDate}` : "All dates"} | 
                {saleTypeFilter === "all" ? " All Types" : ` ${saleTypeFilter}`}
              </p>
            </div>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : filteredSales && filteredSales.length > 0 ? (
              <>
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
                          {sale.saleType}-{sale.invoiceNo}
                        </TableCell>
                        <TableCell>{format(new Date(sale.date), "dd MMM yyyy")}</TableCell>
                        <TableCell>
                          <Badge variant={sale.saleType === "B2B" ? "default" : sale.saleType === "B2C" ? "secondary" : "outline"}>
                            {sale.saleType}
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
                    <TableRow className="font-bold bg-muted/50">
                      <TableCell colSpan={4}>Total</TableCell>
                      <TableCell className="text-right font-mono">₹{totals.saleValue.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-mono">₹{totals.cgst.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-mono">₹{totals.sgst.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-mono">₹{totals.taxValue.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-mono">₹{totals.grandTotal.toFixed(2)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-sm text-muted-foreground">No sales data for selected period</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
