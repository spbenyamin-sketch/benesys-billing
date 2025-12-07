import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
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
import { ArrowLeft, FileText, Printer, FileSpreadsheet, FileDown } from "lucide-react";
import { exportToExcel, exportToPDF, formatCurrency, formatDate } from "@/lib/export-utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { useState, useRef } from "react";
import { useReactToPrint } from "react-to-print";

interface LedgerEntry {
  id: number;
  date: string;
  type: "sale" | "purchase" | "payment";
  reference: string;
  details: string | null;
  debit: number;
  credit: number;
  balance: number;
}

interface LedgerData {
  partyId: number;
  partyCode: string;
  partyName: string;
  openingBalance: number;
  entries: LedgerEntry[];
  closingBalance: number;
}

export default function Ledger() {
  const { t } = useTranslation();
  const params = useParams();
  const partyId = params.id;
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const printRef = useRef<HTMLDivElement>(null);

  const queryParams = new URLSearchParams();
  if (startDate) queryParams.set("startDate", startDate);
  if (endDate) queryParams.set("endDate", endDate);
  const queryString = queryParams.toString();
  const apiUrl = `/api/reports/ledger/${partyId}${queryString ? `?${queryString}` : ""}`;

  const { data: ledger, isLoading } = useQuery<LedgerData>({
    queryKey: ["/api/reports/ledger", partyId, startDate, endDate],
    queryFn: async () => {
      const res = await fetch(apiUrl, { credentials: "include", headers: { "X-Company-Id": localStorage.getItem("currentCompanyId") || "" } });
      if (!res.ok) throw new Error("Failed to fetch ledger");
      return res.json();
    },
    enabled: !!partyId,
  });

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Ledger-${ledger?.partyName || partyId}-${format(new Date(), "yyyy-MM-dd")}`,
  });

  const handleExcelExport = () => {
    if (!ledger?.entries?.length) return;
    
    exportToExcel({
      title: `Party Ledger: ${ledger.partyName}`,
      filename: `Ledger-${ledger.partyName}-${format(new Date(), "yyyy-MM-dd")}`,
      dateRange: { start: startDate, end: endDate },
      columns: [
        { header: "Date", key: "date", width: 12 },
        { header: "Type", key: "type", width: 10 },
        { header: "Reference", key: "reference", width: 15 },
        { header: "Details", key: "details", width: 30 },
        { header: "Debit", key: "debit", width: 12, format: formatCurrency },
        { header: "Credit", key: "credit", width: 12, format: formatCurrency },
        { header: "Balance", key: "balance", width: 12, format: formatCurrency },
      ],
      data: ledger.entries.map(entry => ({
        date: formatDate(entry.date),
        type: entry.type.charAt(0).toUpperCase() + entry.type.slice(1),
        reference: entry.reference,
        details: entry.details || "",
        debit: entry.debit > 0 ? entry.debit.toFixed(2) : "",
        credit: entry.credit > 0 ? entry.credit.toFixed(2) : "",
        balance: entry.balance.toFixed(2),
      })),
      summary: {
        label: `Closing Balance: ${ledger.closingBalance.toFixed(2)}`,
        values: [],
      },
    });
  };

  const handlePDFExport = () => {
    if (!ledger?.entries?.length) return;
    
    exportToPDF({
      title: `Party Ledger: ${ledger.partyName}`,
      filename: `Ledger-${ledger.partyName}-${format(new Date(), "yyyy-MM-dd")}`,
      dateRange: { start: startDate, end: endDate },
      columns: [
        { header: "Date", key: "date", width: 12 },
        { header: "Type", key: "type", width: 10 },
        { header: "Reference", key: "reference", width: 15 },
        { header: "Details", key: "details", width: 30 },
        { header: "Debit", key: "debit", width: 12, format: formatCurrency },
        { header: "Credit", key: "credit", width: 12, format: formatCurrency },
        { header: "Balance", key: "balance", width: 12, format: formatCurrency },
      ],
      data: ledger.entries.map(entry => ({
        date: formatDate(entry.date),
        type: entry.type.charAt(0).toUpperCase() + entry.type.slice(1),
        reference: entry.reference,
        details: entry.details || "",
        debit: entry.debit > 0 ? entry.debit.toFixed(2) : "",
        credit: entry.credit > 0 ? entry.credit.toFixed(2) : "",
        balance: entry.balance.toFixed(2),
      })),
      summary: {
        label: `Closing Balance: ${ledger.closingBalance.toFixed(2)}`,
        values: [],
      },
    });
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Card>
          <CardContent className="p-6">
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!ledger) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-sm text-muted-foreground">Party ledger not found</p>
            <Button asChild className="mt-4" variant="outline">
              <Link href="/reports/outstanding">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Outstanding
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="outline" size="icon">
          <Link href="/reports/outstanding" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-semibold tracking-tight">
            Party Ledger: {ledger.partyName}
          </h1>
          <p className="text-muted-foreground mt-2">
            Complete transaction history for {ledger.partyCode}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" onClick={handleExcelExport} disabled={!ledger?.entries?.length} data-testid="button-export-excel">
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Excel
          </Button>
          <Button variant="outline" onClick={handlePDFExport} disabled={!ledger?.entries?.length} data-testid="button-export-pdf">
            <FileDown className="mr-2 h-4 w-4" />
            PDF
          </Button>
          <Button variant="outline" onClick={() => handlePrint()} data-testid="button-print-ledger">
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Date Range Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                data-testid="input-ledger-start-date"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                data-testid="input-ledger-end-date"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Opening Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold font-mono" data-testid="text-opening-balance">
              ₹{ledger.openingBalance.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold font-mono" data-testid="text-transaction-count">
              {ledger.entries.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Closing Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-semibold font-mono ${
              ledger.closingBalance > 0 ? "text-green-600" : 
              ledger.closingBalance < 0 ? "text-red-600" : ""
            }`} data-testid="text-closing-balance">
              ₹{ledger.closingBalance.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div ref={printRef}>
        <Card>
          <CardHeader className="print:hidden">
            <CardTitle>Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="hidden print:block mb-4">
              <h2 className="text-xl font-bold">Party Ledger - {ledger.partyName}</h2>
              <p className="text-sm text-muted-foreground">
                {startDate && endDate ? `${startDate} to ${endDate}` : "All transactions"} | Code: {ledger.partyCode}
              </p>
              <div className="flex gap-8 mt-2 text-sm">
                <span>Opening Balance: <strong>₹{ledger.openingBalance.toFixed(2)}</strong></span>
                <span>Closing Balance: <strong className={ledger.closingBalance >= 0 ? "text-green-600" : "text-red-600"}>₹{ledger.closingBalance.toFixed(2)}</strong></span>
              </div>
            </div>
            {ledger.entries.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Credit</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="bg-muted/50">
                    <TableCell colSpan={4} className="font-medium">Opening Balance</TableCell>
                    <TableCell className="text-right">—</TableCell>
                    <TableCell className="text-right">—</TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      ₹{ledger.openingBalance.toFixed(2)}
                    </TableCell>
                  </TableRow>
                  {ledger.entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{format(new Date(entry.date), "dd MMM yyyy")}</TableCell>
                      <TableCell>
                        <Badge variant={
                          entry.type === "sale" ? "default" :
                          entry.type === "purchase" ? "secondary" : "outline"
                        }>
                          {entry.type.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono">{entry.reference}</TableCell>
                      <TableCell className="text-muted-foreground max-w-xs truncate">
                        {entry.details || "—"}
                      </TableCell>
                      <TableCell className="text-right font-mono text-red-600">
                        {entry.debit > 0 ? `₹${entry.debit.toFixed(2)}` : "—"}
                      </TableCell>
                      <TableCell className="text-right font-mono text-green-600">
                        {entry.credit > 0 ? `₹${entry.credit.toFixed(2)}` : "—"}
                      </TableCell>
                      <TableCell className={`text-right font-mono font-medium ${
                        entry.balance > 0 ? "text-green-600" : 
                        entry.balance < 0 ? "text-red-600" : ""
                      }`}>
                        ₹{entry.balance.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50 font-medium">
                    <TableCell colSpan={4}>Closing Balance</TableCell>
                    <TableCell className="text-right">—</TableCell>
                    <TableCell className="text-right">—</TableCell>
                    <TableCell className={`text-right font-mono font-semibold ${
                      ledger.closingBalance > 0 ? "text-green-600" : 
                      ledger.closingBalance < 0 ? "text-red-600" : ""
                    }`}>
                      ₹{ledger.closingBalance.toFixed(2)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-sm text-muted-foreground">No transactions yet for this party</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
