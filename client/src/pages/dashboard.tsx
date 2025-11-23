import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { DollarSign, Users, Package, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

interface DashboardMetrics {
  todaysSales: number;
  totalOutstanding: number;
  lowStockCount: number;
  totalCustomers: number;
  recentSales: Array<{
    id: number;
    invoiceNo: number;
    billType: string;
    date: string;
    partyName: string;
    grandTotal: string;
  }>;
}

export default function Dashboard() {
  const { data: metrics, isLoading } = useQuery<DashboardMetrics>({
    queryKey: ["/api/dashboard/metrics"],
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-3 w-40" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Overview of your store's performance and key metrics
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold font-mono" data-testid="text-todays-sales">
              ₹{metrics?.todaysSales.toFixed(2) || "0.00"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              From all sales today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold font-mono" data-testid="text-outstanding">
              ₹{metrics?.totalOutstanding.toFixed(2) || "0.00"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total receivables
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold font-mono" data-testid="text-low-stock">
              {metrics?.lowStockCount || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Items below threshold
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold font-mono" data-testid="text-customers">
              {metrics?.totalCustomers || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Active parties
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Sales</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Latest 5 invoices
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/sales" data-testid="link-view-all-sales">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {metrics?.recentSales && metrics.recentSales.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metrics.recentSales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-medium font-mono">
                        {sale.billType}-{sale.invoiceNo}
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(sale.date), "dd MMM yyyy")}
                      </TableCell>
                      <TableCell className="text-sm">{sale.partyName || "Cash Sale"}</TableCell>
                      <TableCell className="text-right font-mono">
                        ₹{parseFloat(sale.grandTotal).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Package className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-sm text-muted-foreground">No sales yet</p>
                <Button asChild className="mt-4" size="sm">
                  <Link href="/sales/new" data-testid="button-create-first-sale">Create First Sale</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Common tasks and shortcuts
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/sales/new" data-testid="button-new-sale">
                <FileText className="mr-2 h-4 w-4" />
                New Sale Invoice
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/parties" data-testid="button-manage-customers">
                <Users className="mr-2 h-4 w-4" />
                Manage Customers
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/reports/outstanding" data-testid="button-view-outstanding">
                <AlertCircle className="mr-2 h-4 w-4" />
                View Outstanding
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/stock" data-testid="button-check-stock">
                <Package className="mr-2 h-4 w-4" />
                Check Stock
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
