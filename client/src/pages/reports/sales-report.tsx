import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
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
import { FileText, Printer, FileSpreadsheet, FileDown } from "lucide-react";
import { exportToExcel, exportToPDF, formatCurrency, formatDate } from "@/lib/export-utils";
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
  const { t } = useTranslation();
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{t("reports.salesReport")}</h1>
          <p className="text-muted-foreground mt-2">
            {t("reports.dateRange")}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" onClick={handleExcelExport} disabled={!filteredSales?.length} data-testid="button-export-excel">
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            {t("common.export")}
          </Button>
          <Button variant="outline" onClick={handlePDFExport} disabled={!filteredSales?.length} data-testid="button-export-pdf">
            <FileDown className="mr-2 h-4 w-4" />
            {t("common.pdf")}
          </Button>
          <Button variant="outline" onClick={() => handlePrint()} data-testid="button-print-report">
            <Printer className="mr-2 h-4 w-4" />
            {t("common.print")}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("common.filter")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">{t("reports.fromDate")}</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                data-testid="input-start-date"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">{t("reports.toDate")}</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                data-testid="input-end-date"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="saleType">{t("sales.saleType")}</Label>
              <Select value={saleTypeFilter} onValueChange={setSaleTypeFilter}>
                <SelectTrigger id="saleType" data-testid="select-sale-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("sales.allTypes")}</SelectItem>
                  <SelectItem value="B2B">{t("sales.b2bCredit")}</SelectItem>
                  <SelectItem value="B2C">{t("sales.b2cCash")}</SelectItem>
                  <SelectItem value="ESTIMATE">{t("sales.estimate")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="itemId">{t("items.title")}</Label>
              <Select value={selectedItemId} onValueChange={setSelectedItemId} data-testid="select-item-master">
                <SelectTrigger id="itemId">
                  <SelectValue placeholder={t("stock.allItems")} />
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
            <CardTitle className="text-sm font-medium">{t("reports.totalInvoices")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold font-mono" data-testid="text-total-invoices">
              {filteredSales?.length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("common.quantity")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold font-mono" data-testid="text-total-qty">
              {totals.qty.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("common.tax")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold font-mono" data-testid="text-total-tax">
              ₹{totals.taxValue.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("common.grandTotal")}</CardTitle>
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
            <CardTitle>{t("sales.salesList")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="hidden print:block mb-4">
              <h2 className="text-xl font-bold">{t("reports.salesReport")}</h2>
              <p className="text-sm text-muted-foreground">
                {startDate && endDate ? `${startDate} to ${endDate}` : t("common.all")} | 
                {saleTypeFilter === "all" ? ` ${t("sales.allTypes")}` : ` ${saleTypeFilter}`}
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
                      <TableHead>{t("sales.invoiceNo")}</TableHead>
                      <TableHead>{t("common.date")}</TableHead>
                      <TableHead>{t("sales.saleType")}</TableHead>
                      <TableHead>{t("sales.customer")}</TableHead>
                      <TableHead className="text-right">{t("sales.amount")}</TableHead>
                      <TableHead className="text-right">{t("invoice.cgst")}</TableHead>
                      <TableHead className="text-right">{t("invoice.sgst")}</TableHead>
                      <TableHead className="text-right">{t("common.tax")}</TableHead>
                      <TableHead className="text-right">{t("common.total")}</TableHead>
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
                      <TableCell colSpan={4}>{t("common.total")}</TableCell>
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
