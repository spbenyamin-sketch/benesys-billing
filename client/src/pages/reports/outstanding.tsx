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
import { Search, Users, Printer } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useRef } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useReactToPrint } from "react-to-print";
import { format } from "date-fns";

interface OutstandingParty {
  partyId: number;
  partyCode: string;
  partyName: string;
  partyCity: string | null;
  totalSales: string;
  totalPurchases: string;
  totalPaymentsCredit: string;
  totalPaymentsDebit: string;
  openingDebit: string;
  openingCredit: string;
  balance: number;
}

export default function Outstanding() {
  const [searchQuery, setSearchQuery] = useState("");
  const printRef = useRef<HTMLDivElement>(null);

  const { data: outstanding, isLoading } = useQuery<OutstandingParty[]>({
    queryKey: ["/api/reports/outstanding"],
  });

  const filteredParties = outstanding?.filter((party) =>
    party.partyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    party.partyCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    party.partyCity?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalOutstanding = filteredParties?.reduce((sum, party) => sum + party.balance, 0) || 0;
  const receivableParties = filteredParties?.filter(p => p.balance > 0) || [];
  const payableParties = filteredParties?.filter(p => p.balance < 0) || [];

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Outstanding-Report-${format(new Date(), "yyyy-MM-dd")}`,
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Outstanding Report</h1>
          <p className="text-muted-foreground mt-2">
            Party-wise balance and outstanding amounts
          </p>
        </div>
        <Button variant="outline" onClick={() => handlePrint()} data-testid="button-print-outstanding">
          <Printer className="mr-2 h-4 w-4" />
          Print Report
        </Button>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">To Receive</CardTitle>
            <span className="text-xs text-muted-foreground">
              ({receivableParties.length} parties)
            </span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold font-mono text-green-600" data-testid="text-receivable">
              ₹{receivableParties.reduce((sum, p) => sum + p.balance, 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">To Pay</CardTitle>
            <span className="text-xs text-muted-foreground">
              ({payableParties.length} parties)
            </span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold font-mono text-red-600" data-testid="text-payable">
              ₹{Math.abs(payableParties.reduce((sum, p) => sum + p.balance, 0)).toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Outstanding</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold font-mono" data-testid="text-net-outstanding">
              ₹{totalOutstanding.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="print:hidden">
          <div className="flex items-center justify-between gap-4">
            <CardTitle>Party Outstanding</CardTitle>
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, code, or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-outstanding"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div ref={printRef}>
            <div className="hidden print:block mb-4">
              <h2 className="text-xl font-bold">Outstanding Report</h2>
              <p className="text-sm text-muted-foreground">
                As of {format(new Date(), "dd MMM yyyy")}
              </p>
              <div className="flex gap-8 mt-2 text-sm">
                <span>To Receive: <strong className="text-green-600">₹{receivableParties.reduce((sum, p) => sum + p.balance, 0).toFixed(2)}</strong></span>
                <span>To Pay: <strong className="text-red-600">₹{Math.abs(payableParties.reduce((sum, p) => sum + p.balance, 0)).toFixed(2)}</strong></span>
                <span>Net: <strong>₹{totalOutstanding.toFixed(2)}</strong></span>
              </div>
            </div>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : filteredParties && filteredParties.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Party Name</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead className="text-right">Sales</TableHead>
                    <TableHead className="text-right">Purchases</TableHead>
                    <TableHead className="text-right">Received</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="text-right print:hidden">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredParties.map((party) => (
                    <TableRow key={party.partyId}>
                      <TableCell className="font-medium font-mono">{party.partyCode}</TableCell>
                      <TableCell>{party.partyName}</TableCell>
                      <TableCell className="text-muted-foreground">{party.partyCity || "—"}</TableCell>
                      <TableCell className="text-right font-mono">
                        ₹{parseFloat(party.totalSales).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        ₹{parseFloat(party.totalPurchases).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        ₹{parseFloat(party.totalPaymentsCredit).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        ₹{parseFloat(party.totalPaymentsDebit).toFixed(2)}
                      </TableCell>
                      <TableCell className={`text-right font-mono font-medium ${
                        party.balance > 0 ? "text-green-600" : party.balance < 0 ? "text-red-600" : ""
                      }`}>
                        ₹{party.balance.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right print:hidden">
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          data-testid={`button-ledger-${party.partyId}`}
                        >
                          <Link href={`/reports/ledger/${party.partyId}`}>
                            View Ledger
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? "No parties found" : "No outstanding data available"}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
