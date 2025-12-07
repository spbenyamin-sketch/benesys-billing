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
import { FileText, Printer, FileSpreadsheet, FileDown, Upload } from "lucide-react";
import { exportToExcel, exportToPDF, formatCurrency, formatDate } from "@/lib/export-utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useReactToPrint } from "react-to-print";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";

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
  const [isExporting, setIsExporting] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

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

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Sales-Report-${format(new Date(), "yyyy-MM-dd")}`,
  });

  const handleExcelExport = () => {
    if (!filteredSales?.length) return;
    
    exportToExcel({
      title: "Sales Report",
      filename: `Sales-Report-${format(new Date(), "yyyy-MM-dd")}`,
      dateRange: { start: startDate, end: endDate },
      filters: saleTypeFilter === "all" ? "All Types" : saleTypeFilter,
      columns: [
        { header: "Invoice", key: "invoice", width: 15 },
        { header: "Date", key: "date", width: 12 },
        { header: "Type", key: "saleType", width: 10 },
        { header: "Customer", key: "partyName", width: 25 },
        { header: "Sale Value", key: "saleValue", width: 12, format: formatCurrency },
        { header: "CGST", key: "cgstTotal", width: 10, format: formatCurrency },
        { header: "SGST", key: "sgstTotal", width: 10, format: formatCurrency },
        { header: "Tax", key: "taxValue", width: 10, format: formatCurrency },
        { header: "Total", key: "grandTotal", width: 12, format: formatCurrency },
      ],
      data: filteredSales.map(sale => ({
        invoice: `${sale.saleType}-${sale.invoiceNo}`,
        date: formatDate(sale.date),
        saleType: sale.saleType,
        partyName: sale.partyName || "Cash Sale",
        saleValue: sale.saleValue,
        cgstTotal: sale.cgstTotal,
        sgstTotal: sale.sgstTotal,
        taxValue: sale.taxValue,
        grandTotal: sale.grandTotal,
      })),
      summary: {
        label: "Total",
        values: ["", "", "", totals.saleValue.toFixed(2), totals.cgst.toFixed(2), totals.sgst.toFixed(2), totals.taxValue.toFixed(2), totals.grandTotal.toFixed(2)],
      },
    });
  };

  const handlePDFExport = () => {
    if (!filteredSales?.length) return;
    
    exportToPDF({
      title: "Sales Report",
      filename: `Sales-Report-${format(new Date(), "yyyy-MM-dd")}`,
      dateRange: { start: startDate, end: endDate },
      filters: saleTypeFilter === "all" ? "All Types" : saleTypeFilter,
      columns: [
        { header: "Invoice", key: "invoice", width: 15 },
        { header: "Date", key: "date", width: 12 },
        { header: "Type", key: "saleType", width: 10 },
        { header: "Customer", key: "partyName", width: 25 },
        { header: "Sale Value", key: "saleValue", width: 12, format: formatCurrency },
        { header: "CGST", key: "cgstTotal", width: 10, format: formatCurrency },
        { header: "SGST", key: "sgstTotal", width: 10, format: formatCurrency },
        { header: "Tax", key: "taxValue", width: 10, format: formatCurrency },
        { header: "Total", key: "grandTotal", width: 12, format: formatCurrency },
      ],
      data: filteredSales.map(sale => ({
        invoice: `${sale.saleType}-${sale.invoiceNo}`,
        date: formatDate(sale.date),
        saleType: sale.saleType,
        partyName: sale.partyName || "Cash Sale",
        saleValue: sale.saleValue,
        cgstTotal: sale.cgstTotal,
        sgstTotal: sale.sgstTotal,
        taxValue: sale.taxValue,
        grandTotal: sale.grandTotal,
      })),
      summary: {
        label: "Total",
        values: ["", "", "", totals.saleValue.toFixed(2), totals.cgst.toFixed(2), totals.sgst.toFixed(2), totals.taxValue.toFixed(2), totals.grandTotal.toFixed(2)],
      },
    });
  };

  const handleGSTExport = async () => {
    if (!startDate || !endDate) {
      toast({
        title: "Date Range Required",
        description: "Please select both start and end dates to generate GST files",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    try {
      const companyId = localStorage.getItem("currentCompanyId") || "";
      const saleType = saleTypeFilter !== "all" ? saleTypeFilter : undefined;

      const params = new URLSearchParams();
      params.set("startDate", startDate);
      params.set("endDate", endDate);
      if (saleType) params.set("saleType", saleType);
      params.set("_t", Date.now().toString());

      console.log("[GST Export] Starting export with params:", Object.fromEntries(params), "companyId:", companyId);

      const gstr1Response = await fetch(`/api/reports/gstr1?${params}`, {
        credentials: "include",
        headers: { 
          "X-Company-Id": companyId,
          "Cache-Control": "no-cache",
        },
      });
      console.log("[GST Export] GSTR1 response status:", gstr1Response.status);

      if (!gstr1Response.ok) {
        const errorData = await gstr1Response.json().catch(() => ({}));
        console.error("[GST Export] GSTR1 error:", errorData);
        throw new Error(errorData.message || `GSTR1 fetch failed: ${gstr1Response.status}`);
      }
      const gstr1Data = await gstr1Response.json();
      console.log("[GST Export] GSTR1 data count:", gstr1Data?.length);

      const hsnResponse = await fetch(`/api/reports/hsn-summary?${params}`, {
        credentials: "include",
        headers: { 
          "X-Company-Id": companyId,
          "Cache-Control": "no-cache",
        },
      });
      console.log("[GST Export] HSN response status:", hsnResponse.status);

      if (!hsnResponse.ok) {
        const errorData = await hsnResponse.json().catch(() => ({}));
        console.error("[GST Export] HSN error:", errorData);
        throw new Error(errorData.message || `HSN fetch failed: ${hsnResponse.status}`);
      }
      const hsnData = await hsnResponse.json();
      console.log("[GST Export] HSN data:", { b2b: hsnData.b2b?.length, b2c: hsnData.b2c?.length });

      const gstr1Sheet = XLSX.utils.json_to_sheet(gstr1Data.map((row: any) => ({
        "GSTIN": row.gstin || '',
        "Party Name": row.partyName || 'Cash Sale',
        "Invoice No": row.invoiceNo || '',
        "Date": row.date || '',
        "Invoice Value": Number(row.totalValue) || 0,
        "Place of Supply": row.placeOfSupply || 'Tamil Nadu',
        "Reverse Charge": row.reverseCharge || 'N',
        "Invoice Type": row.invoiceType || 'Regular',
        "Taxable Value": Number(row.taxableValue) || 0,
        "Tax Rate": Number(row.taxRate) || 0,
        "CGST": Number(row.cgst) || 0,
        "SGST": Number(row.sgst) || 0,
        "IGST": Number(row.igst) || 0,
        "Cess": Number(row.cess) || 0,
      })));

      const formatHSNRow = (row: any) => ({
        "HSN Code": row.hsnCode || '',
        "Description": row.description || '',
        "UQC": row.uqc || 'NOS-NUMBERS',
        "Total Qty": Number(row.totalQty) || 0,
        "Total Value": Number(row.totalValue) || 0,
        "Tax Rate": Number(row.taxRate) || 0,
        "Taxable Value": Number(row.taxableValue) || 0,
        "IGST": Number(row.igst) || 0,
        "CGST": Number(row.cgst) || 0,
        "SGST": Number(row.sgst) || 0,
        "Cess": Number(row.cess) || 0,
      });

      const hsnB2BSheet = XLSX.utils.json_to_sheet((hsnData.b2b || []).map(formatHSNRow));
      const hsnB2CSheet = XLSX.utils.json_to_sheet((hsnData.b2c || []).map(formatHSNRow));

      const wb1 = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb1, gstr1Sheet, "GSTR1");
      XLSX.writeFile(wb1, `GSTR1-${startDate}-to-${endDate}.xlsx`);

      const wb2 = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb2, hsnB2BSheet, "HSN-B2B");
      XLSX.writeFile(wb2, `HSN-B2B-${startDate}-to-${endDate}.xlsx`);

      const wb3 = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb3, hsnB2CSheet, "HSN-B2C");
      XLSX.writeFile(wb3, `HSN-B2C-${startDate}-to-${endDate}.xlsx`);

      toast({
        title: "GST Files Generated",
        description: "GSTR1, HSN B2B, and HSN B2C files have been downloaded",
      });
    } catch (error: any) {
      console.error("Error exporting GST files:", error);
      toast({
        title: "Export Failed",
        description: error.message || "Failed to generate GST files. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Sales Report</h1>
          <p className="text-muted-foreground mt-2">
            Detailed sales analysis with filters and summaries
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button 
            variant="default" 
            onClick={handleGSTExport} 
            disabled={isExporting || !startDate || !endDate} 
            data-testid="button-export-gst"
          >
            <Upload className="mr-2 h-4 w-4" />
            {isExporting ? "Generating..." : "Generate GST Files"}
          </Button>
          <Button variant="outline" onClick={handleExcelExport} disabled={!filteredSales?.length} data-testid="button-export-excel">
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Excel
          </Button>
          <Button variant="outline" onClick={handlePDFExport} disabled={!filteredSales?.length} data-testid="button-export-pdf">
            <FileDown className="mr-2 h-4 w-4" />
            PDF
          </Button>
          <Button variant="outline" onClick={() => handlePrint()} data-testid="button-print-report">
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
        </div>
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
