import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{t('sales.title')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('sales.subtitle')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handlePrintList()} data-testid="button-print-list">
            <Printer className="mr-2 h-4 w-4" />
            {t('common.print')}
          </Button>
          <Button asChild data-testid="button-new-sale">
            <Link href="/sales/new">
              <Plus className="mr-2 h-4 w-4" />
              {t('sales.newSale')}
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>{t('sales.invoiceList')}</CardTitle>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Select value={saleTypeFilter} onValueChange={setSaleTypeFilter}>
                <SelectTrigger className="w-full sm:w-40" data-testid="select-sale-type-filter">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder={t('sales.allTypes')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('sales.allTypes')}</SelectItem>
                  <SelectItem value="B2B">{t('sales.b2bCredit')}</SelectItem>
                  <SelectItem value="B2C">{t('sales.b2cCash')}</SelectItem>
                  <SelectItem value="ESTIMATE">{t('sales.estimate')}</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t('sales.searchInvoices')}
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
                      <TableHead>{t('sales.invoiceNo')}</TableHead>
                      <TableHead>{t('common.date')}</TableHead>
                      <TableHead>{t('sales.saleType')}</TableHead>
                      <TableHead>{t('sales.customer')}</TableHead>
                      <TableHead>{t('sales.city')}</TableHead>
                      <TableHead className="text-right">{t('sales.qty')}</TableHead>
                      <TableHead className="text-right">{t('common.amount')}</TableHead>
                      <TableHead className="print:hidden">{t('common.actions')}</TableHead>
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
                        <TableCell>{sale.partyName || t('sales.cashSale')}</TableCell>
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
                    {t('sales.showing', { count: filteredSales.length })}
                  </p>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">{t('sales.totalQty')}: <span className="font-mono font-medium">{totalQty.toFixed(2)}</span></span>
                    <span className="text-sm text-muted-foreground">{t('common.total')}:</span>
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
                {searchQuery || dateFilter ? t('sales.noInvoicesFound') : t('sales.noSalesYet')}
              </p>
              {!searchQuery && !dateFilter && (
                <Button asChild className="mt-4" size="sm">
                  <Link href="/sales/new" data-testid="button-create-first-invoice">{t('sales.createFirstInvoice')}</Link>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
