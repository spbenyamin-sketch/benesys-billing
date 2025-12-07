import { useRef, useState } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Printer, Download } from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { useCompany } from "@/contexts/CompanyContext";

interface SalesTotalData {
  date: string;
  cashTotal: number;
  cardTotal: number;
  netTotal: number;
}

interface SalesTotalResponse {
  data: SalesTotalData[];
  totals: {
    cashTotal: number;
    cardTotal: number;
    netTotal: number;
  };
}

export default function SalesTotalReport() {
  const { currentCompany } = useCompany();
  const printRef = useRef<HTMLDivElement>(null);
  
  const [fromDate, setFromDate] = useState(
    format(startOfMonth(new Date()), "yyyy-MM-dd")
  );
  const [toDate, setToDate] = useState(
    format(endOfMonth(new Date()), "yyyy-MM-dd")
  );
  const [billType, setBillType] = useState("ALL");

  // Build query params as URL search params
  const queryParams = new URLSearchParams();
  if (fromDate) queryParams.set("fromDate", fromDate);
  if (toDate) queryParams.set("toDate", toDate);
  if (billType) queryParams.set("billType", billType);

  const queryString = queryParams.toString();
  const apiUrl = queryString ? `/api/reports/sales-total?${queryString}` : "/api/reports/sales-total";

  const { data: reportData, isLoading } = useQuery({
    queryKey: ["/api/reports/sales-total", fromDate, toDate, billType],
    queryFn: async () => {
      const res = await fetch(apiUrl, { 
        credentials: "include", 
        headers: { "X-Company-Id": localStorage.getItem("currentCompanyId") || "" } 
      });
      if (!res.ok) throw new Error("Failed to fetch sales total report");
      return res.json();
    },
    enabled: !!currentCompany?.id,
  });

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "Sales Total Report",
  });

  const downloadAsCSV = () => {
    if (!reportData) return;

    const rows = [
      ["SALES TOTAL REPORT"],
      [
        `From: ${format(new Date(fromDate), "dd-MMM-yyyy")} To: ${format(
          new Date(toDate),
          "dd-MMM-yyyy"
        )}`,
      ],
      [`Bill Type: ${billType}`],
      [],
      ["Date", "Cash", "Card", "Net Amount"],
      ...reportData.data.map((row) => [
        format(new Date(row.date), "dd-MMM-yyyy"),
        row.cashTotal.toFixed(2),
        row.cardTotal.toFixed(2),
        row.netTotal.toFixed(2),
      ]),
      [],
      [
        "TOTAL",
        reportData.totals.cashTotal.toFixed(2),
        reportData.totals.cardTotal.toFixed(2),
        reportData.totals.netTotal.toFixed(2),
      ],
    ];

    const csv = rows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sales-total-report-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div>
        <h1 className="text-3xl font-bold">Sales Total Report</h1>
        <p className="text-muted-foreground">Daily sales summary by payment method</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">From Date</label>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                data-testid="input-from-date"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">To Date</label>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                data-testid="input-to-date"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Bill Type</label>
              <Select value={billType} onValueChange={setBillType}>
                <SelectTrigger data-testid="select-bill-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Bills</SelectItem>
                  <SelectItem value="B2B">B2B Credit Sale</SelectItem>
                  <SelectItem value="B2C">B2C Retail Sale</SelectItem>
                  <SelectItem value="ESTIMATE">Estimate</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={downloadAsCSV}
              disabled={isLoading || !reportData}
              data-testid="button-download-csv"
            >
              <Download className="h-4 w-4 mr-2" />
              Download CSV
            </Button>
            <Button
              onClick={() => handlePrint()}
              disabled={isLoading || !reportData}
              data-testid="button-print-report"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Loading report...</p>
          </CardContent>
        </Card>
      ) : reportData && reportData.data.length > 0 ? (
        <>
          <div ref={printRef} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Sales Summary</CardTitle>
                <CardDescription>
                  {format(new Date(fromDate), "dd MMM yyyy")} to{" "}
                  {format(new Date(toDate), "dd MMM yyyy")} • {billType}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Cash</TableHead>
                        <TableHead className="text-right">Card</TableHead>
                        <TableHead className="text-right">Net Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.data.map((row, idx) => (
                        <TableRow key={idx} data-testid={`row-sales-total-${idx}`}>
                          <TableCell>
                            {format(new Date(row.date), "dd MMM yyyy")}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ₹{row.cashTotal.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ₹{row.cardTotal.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ₹{row.netTotal.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="font-bold bg-muted">
                        <TableCell>TOTAL</TableCell>
                        <TableCell className="text-right">
                          ₹{reportData.totals.cashTotal.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          ₹{reportData.totals.cardTotal.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          ₹{reportData.totals.netTotal.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No sales data found for the selected date range and bill type.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
