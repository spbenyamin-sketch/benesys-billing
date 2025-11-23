import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

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
  const params = useParams();
  const partyId = params.id;

  const { data: ledger, isLoading } = useQuery<LedgerData>({
    queryKey: ["/api/reports/ledger", partyId],
    enabled: !!partyId,
  });

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
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Party Ledger: {ledger.partyName}
          </h1>
          <p className="text-muted-foreground mt-2">
            Complete transaction history for {ledger.partyCode}
          </p>
        </div>
      </div>

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

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
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
  );
}
