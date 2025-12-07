import { useState, useRef } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, FileText, Filter, Printer, Eye, Edit } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useReactToPrint } from "react-to-print";

interface Sale {
  id: number;
  invoiceNo: number;
  billType: string;
  saleType: string;
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
  const [saleTypeFilter, setSaleTypeFilter] = useState<string>("all");
  const [, setLocation] = useLocation();
  const printRef = useRef<HTMLDivElement>(null);

  const { data: sales, isLoading } = useQuery<Sale[]>({
    queryKey: ["/api/sales"],
  });

  const filteredSales = sales?.filter((sale) => {
    const matchesSearch = 
      sale.invoiceNo.toString().includes(searchQuery) ||
      sale.partyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sale.saleType?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDate = !dateFilter || sale.date === dateFilter;
    
    const matchesSaleType = saleTypeFilter === "all" || sale.saleType === saleTypeFilter;
    
    return matchesSearch && matchesDate && matchesSaleType;
  });

  const totalAmount = filteredSales?.reduce((sum, sale) => sum + parseFloat(sale.grandTotal), 0) || 0;
  const totalQty = filteredSales?.reduce((sum, sale) => sum + parseFloat(sale.totalQty), 0) || 0;

  const getSaleTypeBadgeVariant = (saleType: string): "default" | "secondary" | "outline" => {
    if (saleType === "B2B") return "default";
    if (saleType === "B2C") return "secondary";
    return "outline";
  };

  const handlePrintList = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Sales-List-${format(new Date(), "yyyy-MM-dd")}`,
  });

  const openInvoice = (saleId: number) => {
    window.open(`/invoice/${saleId}`, '_blank');
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Sales Invoices</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">
            View and manage all sales transactions
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={() => handlePrintList()} data-testid="button-print-list" size="sm" className="flex-1 sm:flex-none">
            <Printer className="mr-1 sm:mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Print List</span>
            <span className="sm:hidden">Print</span>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Invoice List</CardTitle>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Select value={saleTypeFilter} onValueChange={setSaleTypeFilter}>
                <SelectTrigger className="w-full sm:w-40" data-testid="select-sale-type-filter">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="B2B">B2B (Credit)</SelectItem>
                  <SelectItem value="B2C">B2C (Cash/Retail)</SelectItem>
                  <SelectItem value="ESTIMATE">Estimate</SelectItem>
                </SelectContent>
              </Select>
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
              <div ref={printRef}>
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
                      <TableHead className="print:hidden">Actions</TableHead>
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
                          <Badge variant={getSaleTypeBadgeVariant(sale.saleType)}>
                            {sale.saleType}
                          </Badge>
                        </TableCell>
                        <TableCell>{sale.partyName || "Cash Sale"}</TableCell>
                        <TableCell className="text-muted-foreground">{sale.partyCity || "—"}</TableCell>
                        <TableCell className="text-right font-mono">{parseFloat(sale.totalQty).toFixed(2)}</TableCell>
                        <TableCell className="text-right font-mono font-medium">
                          ₹{parseFloat(sale.grandTotal).toFixed(2)}
                        </TableCell>
                        <TableCell className="print:hidden">
                          <div className="flex gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => openInvoice(sale.id)}
                              title="View & Print Invoice"
                              data-testid={`button-view-invoice-${sale.id}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setLocation(`/sales/edit/${sale.id}`)}
                              title="Edit Invoice"
                              data-testid={`button-edit-invoice-${sale.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => openInvoice(sale.id)}
                              title="Reprint Invoice"
                              data-testid={`button-reprint-invoice-${sale.id}`}
                            >
                              <Printer className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="mt-4 flex justify-between items-center border-t pt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {filteredSales.length} invoice{filteredSales.length !== 1 ? "s" : ""}
                  </p>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">Total Qty: <span className="font-mono font-medium">{totalQty.toFixed(2)}</span></span>
                    <span className="text-sm text-muted-foreground">Total:</span>
                    <span className="text-lg font-semibold font-mono" data-testid="text-total-amount">
                      ₹{totalAmount.toFixed(2)}
                    </span>
                  </div>
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
