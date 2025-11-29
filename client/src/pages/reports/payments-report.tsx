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
import { Wallet, Search, Printer, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useReactToPrint } from "react-to-print";
import { useCompany } from "@/contexts/CompanyContext";
import { format } from "date-fns";

interface PaymentReport {
  id: number;
  date: string;
  type: string;
  partyId: number | null;
  partyName: string | null;
  amount: string;
  details: string | null;
}

function PaymentsReportPrint({ 
  payments, 
  totals, 
  companyName, 
  dateRange,
  paymentType 
}: { 
  payments: PaymentReport[]; 
  totals: { received: number; paid: number; net: number };
  companyName: string;
  dateRange: string;
  paymentType: string;
}) {
  return (
    <div className="p-8 bg-white text-black">
      <div className="text-center mb-6">
        <h1 className="text-xl font-bold">{companyName}</h1>
        <h2 className="text-lg font-semibold">Payment Report</h2>
        <p className="text-sm text-gray-600">{dateRange}</p>
        {paymentType && <p className="text-sm text-gray-600">Type: {paymentType}</p>}
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6 text-center">
        <div className="border p-2">
          <p className="text-sm text-gray-600">Total Received</p>
          <p className="text-lg font-bold text-green-600">₹{totals.received.toFixed(2)}</p>
        </div>
        <div className="border p-2">
          <p className="text-sm text-gray-600">Total Paid</p>
          <p className="text-lg font-bold text-red-600">₹{totals.paid.toFixed(2)}</p>
        </div>
        <div className="border p-2">
          <p className="text-sm text-gray-600">Net Balance</p>
          <p className={`text-lg font-bold ${totals.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ₹{totals.net.toFixed(2)}
          </p>
        </div>
      </div>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-black">
            <th className="text-left py-1 px-1">Date</th>
            <th className="text-left py-1 px-1">Type</th>
            <th className="text-left py-1 px-1">Party</th>
            <th className="text-left py-1 px-1">Details</th>
            <th className="text-right py-1 px-1">Amount</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((payment, idx) => (
            <tr key={idx} className="border-b border-gray-200">
              <td className="py-1 px-1">{format(new Date(payment.date), "dd/MM/yyyy")}</td>
              <td className="py-1 px-1">
                <span className={payment.type === "RECEIVED" ? "text-green-600" : "text-red-600"}>
                  {payment.type}
                </span>
              </td>
              <td className="py-1 px-1">{payment.partyName || "Cash"}</td>
              <td className="py-1 px-1">{payment.details || "—"}</td>
              <td className="text-right py-1 px-1 font-mono">
                {parseFloat(payment.amount).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-black font-bold">
            <td colSpan={4} className="py-2 px-1">Total ({payments.length} transactions)</td>
            <td className="text-right py-2 px-1">
              ₹{payments.reduce((sum, p) => sum + parseFloat(p.amount), 0).toFixed(2)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

export default function PaymentsReport() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentType, setPaymentType] = useState("all");
  const printRef = useRef<HTMLDivElement>(null);
  const { currentCompany } = useCompany();

  const { data: payments, isLoading } = useQuery<PaymentReport[]>({
    queryKey: ["/api/reports/payments", { startDate, endDate, type: paymentType === "all" ? "" : paymentType }],
  });

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Payments-Report-${format(new Date(), "yyyy-MM-dd")}`,
  });

  const filteredPayments = payments?.filter((payment) =>
    (payment.partyName?.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (payment.details?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totals = filteredPayments?.reduce(
    (acc, payment) => {
      const amount = parseFloat(payment.amount);
      if (payment.type === "RECEIVED") {
        acc.received += amount;
      } else {
        acc.paid += amount;
      }
      acc.net = acc.received - acc.paid;
      return acc;
    },
    { received: 0, paid: 0, net: 0 }
  ) || { received: 0, paid: 0, net: 0 };

  const dateRange = startDate && endDate 
    ? `${format(new Date(startDate), "dd/MM/yyyy")} to ${format(new Date(endDate), "dd/MM/yyyy")}`
    : "All Time";

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Payment Report</h1>
          <p className="text-muted-foreground mt-2">
            Date-wise payment transactions
          </p>
        </div>
        <Button onClick={() => handlePrint()} disabled={!filteredPayments?.length} data-testid="button-print-payments-report">
          <Printer className="h-4 w-4 mr-2" />
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
              <Label htmlFor="paymentType">Payment Type</Label>
              <Select value={paymentType} onValueChange={setPaymentType} data-testid="select-payment-type">
                <SelectTrigger id="paymentType">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="RECEIVED">Received</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Party or details..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-payments"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Received</CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold font-mono text-green-600" data-testid="text-total-received">
              ₹{totals.received.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold font-mono text-red-600" data-testid="text-total-paid">
              ₹{totals.paid.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-semibold font-mono ${totals.net >= 0 ? 'text-green-600' : 'text-red-600'}`} data-testid="text-net-balance">
              ₹{totals.net.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredPayments && filteredPayments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Party</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => (
                  <TableRow key={payment.id} data-testid={`row-payment-${payment.id}`}>
                    <TableCell>{format(new Date(payment.date), "dd/MM/yyyy")}</TableCell>
                    <TableCell>
                      {payment.type === "RECEIVED" ? (
                        <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          <ArrowDownCircle className="h-3 w-3 mr-1" />
                          Received
                        </Badge>
                      ) : (
                        <Badge variant="default" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                          <ArrowUpCircle className="h-3 w-3 mr-1" />
                          Paid
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{payment.partyName || "Cash"}</TableCell>
                    <TableCell className="text-muted-foreground">{payment.details || "—"}</TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      ₹{parseFloat(payment.amount).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Wallet className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-sm text-muted-foreground">
                {searchQuery ? "No payments found" : "No payment data for selected period"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hidden print container */}
      <div style={{ position: 'absolute', left: '-9999px', top: '0' }}>
        <div ref={printRef}>
          <PaymentsReportPrint
            payments={filteredPayments || []}
            totals={totals}
            companyName={currentCompany?.name || "Company"}
            dateRange={dateRange}
            paymentType={paymentType === "all" ? "" : paymentType}
          />
        </div>
      </div>
    </div>
  );
}
