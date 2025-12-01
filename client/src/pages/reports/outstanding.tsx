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

interface Party {
  id: number;
  code: string;
  name: string;
  openingDebit: string;
  openingCredit: string;
}

interface Ledger {
  type: "opening" | "purchase" | "payment";
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

export default function Outstanding() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPartyId, setSelectedPartyId] = useState<number | null>(null);
  const [ledgerSearchQuery, setLedgerSearchQuery] = useState("");
  const printRef = useRef<HTMLDivElement>(null);

  const { data: outstanding, isLoading: outstandingLoading } = useQuery<OutstandingParty[]>({
    queryKey: ["/api/reports/outstanding"],
  });

  const { data: parties } = useQuery<Party[]>({
    queryKey: ["/api/parties"],
  });

  const { data: purchases } = useQuery<any[]>({
    queryKey: ["/api/purchases"],
  });

  const { data: payments } = useQuery<any[]>({
    queryKey: ["/api/payments"],
  });

  const filteredParties = outstanding?.filter((party) =>
    party.partyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    party.partyCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    party.partyCity?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredLedgerParties = parties?.filter((party) =>
    party.name.toLowerCase().includes(ledgerSearchQuery.toLowerCase()) ||
    party.code.toLowerCase().includes(ledgerSearchQuery.toLowerCase())
  );

  const totalOutstanding = filteredParties?.reduce((sum, party) => sum + party.balance, 0) || 0;
  const receivableParties = filteredParties?.filter(p => p.balance > 0) || [];
  const payableParties = filteredParties?.filter(p => p.balance < 0) || [];

  const generateLedger = (partyId: number): Ledger[] => {
    const ledger: Ledger[] = [];
    let balance = 0;

    const party = parties?.find((p) => p.id === partyId);
    if (party) {
      const openingDebit = parseFloat(party.openingDebit || "0");
      const openingCredit = parseFloat(party.openingCredit || "0");

      if (openingDebit > 0) {
        balance = openingDebit;
        ledger.push({
          type: "opening",
          date: "Opening",
          description: "Opening Balance (Debit)",
          debit: openingDebit,
          credit: 0,
          balance,
        });
      } else if (openingCredit > 0) {
        balance = -openingCredit;
        ledger.push({
          type: "opening",
          date: "Opening",
          description: "Opening Balance (Credit)",
          debit: 0,
          credit: openingCredit,
          balance: 0,
        });
      }
    }

    purchases
      ?.filter((p) => p.partyId === partyId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .forEach((purchase) => {
        const amount = parseFloat(purchase.amount || purchase.invoiceAmount || "0");
        balance += amount;
        ledger.push({
          type: "purchase",
          date: purchase.date,
          description: `Purchase Invoice #${purchase.purchaseNo}`,
          debit: 0,
          credit: amount,
          balance,
        });
      });

    payments
      ?.filter((p) => p.partyId === partyId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .forEach((payment) => {
        const credit = parseFloat(payment.credit || "0");
        const debit = parseFloat(payment.debit || "0");

        if (credit > 0) {
          balance -= credit;
          ledger.push({
            type: "payment",
            date: payment.date,
            description: "Payment Received",
            debit: credit,
            credit: 0,
            balance,
          });
        } else if (debit > 0) {
          balance += debit;
          ledger.push({
            type: "payment",
            date: payment.date,
            description: "Payment Made",
            debit: 0,
            credit: debit,
            balance,
          });
        }
      });

    return ledger.sort((a, b) => {
      if (a.date === "Opening") return -1;
      if (b.date === "Opening") return 1;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  };

  const selectedParty = selectedPartyId ? parties?.find((p) => p.id === selectedPartyId) : null;
  const ledger = selectedPartyId ? generateLedger(selectedPartyId) : [];

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Outstanding-Report-${format(new Date(), "yyyy-MM-dd")}`,
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Outstanding & Party Ledger</h1>
          <p className="text-muted-foreground mt-2">
            Party-wise balance, outstanding amounts, and complete transaction history
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

      <div className="grid gap-6 lg:grid-cols-4">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Party Ledger</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="ledger-search">Search Party</Label>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="ledger-search"
                  placeholder="Party name or code..."
                  value={ledgerSearchQuery}
                  onChange={(e) => setLedgerSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-ledger-search-party"
                />
              </div>
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredLedgerParties?.map((party) => (
                <div
                  key={party.id}
                  onClick={() => setSelectedPartyId(party.id)}
                  className={`p-3 rounded-lg cursor-pointer border transition ${
                    selectedPartyId === party.id
                      ? "bg-accent border-accent"
                      : "bg-muted/50 border-transparent hover:bg-muted"
                  }`}
                  data-testid={`button-select-party-${party.id}`}
                >
                  <p className="font-medium text-sm">{party.name}</p>
                  <p className="text-xs text-muted-foreground">Code: {party.code}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          {selectedParty ? (
            <>
              <CardHeader>
                <div className="space-y-1">
                  <CardTitle>{selectedParty.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">Code: {selectedParty.code}</p>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Debit</TableHead>
                        <TableHead className="text-right">Credit</TableHead>
                        <TableHead className="text-right font-semibold">Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow className="bg-muted/50">
                        <TableCell className="font-mono text-sm font-semibold">Opening Balance</TableCell>
                        <TableCell></TableCell>
                        <TableCell className="text-right font-mono">—</TableCell>
                        <TableCell className="text-right font-mono">—</TableCell>
                        <TableCell className="text-right font-mono font-semibold">
                          <span className={(() => {
                            const opening = ledger.length > 0 && ledger[0].type === "opening" ? ledger[0].balance : 0;
                            return opening >= 0 ? "text-green-600" : "text-red-600";
                          })()}>
                            ₹{Math.abs(ledger.length > 0 && ledger[0].type === "opening" ? ledger[0].balance : 0).toFixed(2)}
                          </span>
                        </TableCell>
                      </TableRow>
                      {ledger.map((entry, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-mono text-sm">
                            {entry.date === "Opening"
                              ? "Opening"
                              : format(new Date(entry.date), "dd MMM yyyy")}
                          </TableCell>
                          <TableCell className="text-sm">{entry.description}</TableCell>
                          <TableCell className="text-right font-mono">
                            {entry.debit > 0 ? `₹${entry.debit.toFixed(2)}` : "—"}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {entry.credit > 0 ? `₹${entry.credit.toFixed(2)}` : "—"}
                          </TableCell>
                          <TableCell className="text-right font-mono font-semibold">
                            <span className={entry.balance >= 0 ? "text-green-600" : "text-red-600"}>
                              ₹{Math.abs(entry.balance).toFixed(2)}
                              {entry.balance < 0 ? " Cr" : " Dr"}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="pt-12">
              <div className="text-center py-8">
                <p className="text-muted-foreground">Select a party to view ledger details</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader className="print:hidden">
          <div className="flex items-center justify-between gap-4">
            <CardTitle>All Parties Outstanding</CardTitle>
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
            {outstandingLoading ? (
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
