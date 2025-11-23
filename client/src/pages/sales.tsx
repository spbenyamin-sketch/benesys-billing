import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Search, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface Sale {
  id: number;
  invoiceNo: number;
  billType: string;
  date: string;
  partyName: string | null;
  partyCity: string | null;
  grandTotal: string;
  totalQty: string;
  gstType: number;
}

export default function Sales() {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const { data: sales, isLoading } = useQuery<Sale[]>({
    queryKey: ["/api/sales"],
  });

  const filteredSales = sales?.filter((sale) => {
    const matchesSearch = 
      sale.invoiceNo.toString().includes(searchQuery) ||
      sale.partyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sale.billType.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDate = !dateFilter || sale.date === dateFilter;
    
    return matchesSearch && matchesDate;
  });

  const totalAmount = filteredSales?.reduce((sum, sale) => sum + parseFloat(sale.grandTotal), 0) || 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Sales Invoices</h1>
          <p className="text-muted-foreground mt-2">
            View and manage all sales transactions
          </p>
        </div>
        <Button asChild data-testid="button-new-sale">
          <Link href="/sales/new">
            <Plus className="mr-2 h-4 w-4" />
            New Sale
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Invoice List</CardTitle>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search invoices..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-sales"
                />
              </div>
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full sm:w-48"
                data-testid="input-filter-date"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
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
                    <TableHead>Invoice No</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-medium font-mono">
                        {sale.billType}-{sale.invoiceNo}
                      </TableCell>
                      <TableCell>{format(new Date(sale.date), "dd MMM yyyy")}</TableCell>
                      <TableCell>
                        <Badge variant={sale.billType === "GST" ? "default" : "secondary"}>
                          {sale.billType}
                        </Badge>
                      </TableCell>
                      <TableCell>{sale.partyName || "Cash Sale"}</TableCell>
                      <TableCell className="text-muted-foreground">{sale.partyCity || "—"}</TableCell>
                      <TableCell className="text-right font-mono">{parseFloat(sale.totalQty).toFixed(2)}</TableCell>
                      <TableCell className="text-right font-mono font-medium">
                        ₹{parseFloat(sale.grandTotal).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4 flex justify-between items-center border-t pt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredSales.length} invoice{filteredSales.length !== 1 ? "s" : ""}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Total:</span>
                  <span className="text-lg font-semibold font-mono" data-testid="text-total-amount">
                    ₹{totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-sm text-muted-foreground mb-1">
                {searchQuery || dateFilter ? "No invoices found" : "No sales yet"}
              </p>
              {!searchQuery && !dateFilter && (
                <Button asChild className="mt-4" size="sm">
                  <Link href="/sales/new" data-testid="button-create-first-invoice">Create First Invoice</Link>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
