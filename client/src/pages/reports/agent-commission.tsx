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
import { Search, Users, Printer, FileDown } from "lucide-react";
import { exportToExcel, formatCurrency } from "@/lib/export-utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useReactToPrint } from "react-to-print";
import { format } from "date-fns";

interface AgentCommission {
  agentId: number;
  agentCode: number;
  agentName: string;
  commissionPercentage: number;
  totalSalesAmount: string;
  totalPaymentReceived: string;
  commissionAmount: number;
}

export default function AgentCommissionReport() {
  const [searchQuery, setSearchQuery] = useState("");
  const printRef = useRef<HTMLDivElement>(null);

  const { data: commissions, isLoading } = useQuery<AgentCommission[]>({
    queryKey: ["/api/reports/agent-commission"],
  });

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Agent Commission Report - ${format(new Date(), "dd-MM-yyyy")}`,
  });

  const handleExportExcel = () => {
    if (!filtered) return;
    const data = filtered.map((row) => ({
      "Agent Code": row.agentCode,
      "Agent Name": row.agentName,
      "Commission %": row.commissionPercentage,
      "Total Sales": parseFloat(row.totalSalesAmount),
      "Payment Received": parseFloat(row.totalPaymentReceived),
      "Commission Amount": row.commissionAmount.toFixed(2),
    }));
    exportToExcel(data, `Agent Commission Report - ${format(new Date(), "dd-MM-yyyy")}`);
  };

  const filtered = commissions?.filter(
    (agent) =>
      agent.agentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.agentCode.toString().includes(searchQuery)
  );

  const totalSales = filtered?.reduce((sum, agent) => sum + parseFloat(agent.totalSalesAmount), 0) || 0;
  const totalPayments = filtered?.reduce((sum, agent) => sum + parseFloat(agent.totalPaymentReceived), 0) || 0;
  const totalCommission = filtered?.reduce((sum, agent) => sum + agent.commissionAmount, 0) || 0;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Agent Commission Report</h1>
        <div className="flex gap-2">
          <Button
            onClick={handlePrint}
            variant="outline"
            size="sm"
            data-testid="button-print"
          >
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button
            onClick={handleExportExcel}
            variant="outline"
            size="sm"
            data-testid="button-export"
          >
            <FileDown className="w-4 h-4 mr-2" />
            Excel
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Search Agents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="search">Agent Name or Code</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search by agent name or code..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div ref={printRef} className="space-y-4">
        <Card>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agent Code</TableHead>
                      <TableHead>Agent Name</TableHead>
                      <TableHead className="text-right">Commission %</TableHead>
                      <TableHead className="text-right">Total Sales</TableHead>
                      <TableHead className="text-right">Payments Received</TableHead>
                      <TableHead className="text-right">Commission Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered && filtered.length > 0 ? (
                      filtered.map((agent) => (
                        <TableRow key={agent.agentId} data-testid={`row-agent-${agent.agentId}`}>
                          <TableCell className="font-mono text-sm">{agent.agentCode}</TableCell>
                          <TableCell className="font-medium">{agent.agentName}</TableCell>
                          <TableCell className="text-right">{agent.commissionPercentage.toFixed(2)}%</TableCell>
                          <TableCell className="text-right">{formatCurrency(parseFloat(agent.totalSalesAmount))}</TableCell>
                          <TableCell className="text-right">{formatCurrency(parseFloat(agent.totalPaymentReceived))}</TableCell>
                          <TableCell className="text-right font-semibold text-green-600">
                            {formatCurrency(agent.commissionAmount)}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          {isLoading ? "Loading..." : "No agents found"}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {!isLoading && filtered && filtered.length > 0 && (
          <Card className="bg-muted">
            <CardContent className="pt-6">
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Sales</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalSales)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Payments</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalPayments)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Commission</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(totalCommission)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Number of Agents</p>
                  <p className="text-2xl font-bold">{filtered.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
