import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search } from "lucide-react";
import { format } from "date-fns";

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

export default function PartyLedger() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPartyId, setSelectedPartyId] = useState<number | null>(null);

  const { data: parties } = useQuery<Party[]>({
    queryKey: ["/api/parties"],
  });

  const { data: purchases } = useQuery<any[]>({
    queryKey: ["/api/purchases"],
  });

  const { data: payments } = useQuery<any[]>({
    queryKey: ["/api/payments"],
  });

  const filteredParties = parties?.filter((party) =>
    party.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    party.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const generateLedger = (partyId: number): Ledger[] => {
    const ledger: Ledger[] = [];
    let balance = 0;

    // Opening balance
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

    // Purchase transactions (Credit - we owe money)
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

    // Payment transactions
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

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Party Ledger</h1>
        <p className="text-muted-foreground mt-2">
          View complete transaction history with parties including purchases, payments, and outstanding balance
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Select Party</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="search">Search Party</Label>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Party name or code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-party"
                />
              </div>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredParties?.map((party) => (
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
                  <p className="font-medium">{party.name}</p>
                  <p className="text-xs text-muted-foreground">Code: {party.code}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
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
    </div>
  );
}
