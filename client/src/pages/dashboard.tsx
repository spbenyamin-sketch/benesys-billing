import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { DollarSign, Users, Package, AlertCircle, FileText, TrendingUp, ShoppingCart, Calendar, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface DashboardMetrics {
  todaysSales: number;
  totalOutstanding: number;
  lowStockCount: number;
  totalCustomers: number;
  monthSales: number;
  monthPurchases: number;
  recentSales: Array<{
    id: number;
    invoiceNo: number;
    billType: string;
    date: string;
    partyName: string;
    grandTotal: string;
  }>;
  salesTrend: Array<{
    date: string;
    day: string;
    amount: number;
  }>;
  salesByType: Array<{
    type: string;
    total: number;
    count: number;
  }>;
  topSellingItems: Array<{
    itemId: number;
    itemName: string;
    totalQty: number;
    totalAmount: number;
  }>;
  expiringStock: Array<{
    id: number;
    barcode: string;
    itemName: string;
    expiryDate: string;
    rate: string;
    daysUntilExpiry: number;
  }>;
}

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function Dashboard() {
  const { data: metrics, isLoading } = useQuery<DashboardMetrics>({
    queryKey: ["/api/dashboard/metrics"],
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
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
        
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    if (value >= 100000) {
      return `₹${(value / 100000).toFixed(1)}L`;
    } else if (value >= 1000) {
      return `₹${(value / 1000).toFixed(1)}K`;
    }
    return `₹${value.toFixed(0)}`;
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">
          Overview of your store's performance and key metrics
        </p>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold font-mono" data-testid="text-todays-sales">
              ₹{(parseFloat(metrics?.todaysSales?.toString() || "0")).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              From all sales today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold font-mono text-green-600" data-testid="text-month-sales">
              ₹{(metrics?.monthSales || 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Purchases: ₹{(metrics?.monthPurchases || 0).toFixed(2)}
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
              ₹{(parseFloat(metrics?.totalOutstanding?.toString() || "0")).toFixed(2)}
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
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Sales Trend (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {metrics?.salesTrend && metrics.salesTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={metrics.salesTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="day" 
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={formatCurrency}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`₹${value.toFixed(2)}`, 'Sales']}
                    labelFormatter={(label) => `Day: ${label}`}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar 
                    dataKey="amount" 
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <TrendingUp className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-sm text-muted-foreground">No sales data yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Sales by Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            {metrics?.salesByType && metrics.salesByType.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={metrics.salesByType}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ type, percent }) => `${type} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="total"
                    nameKey="type"
                  >
                    {metrics.salesByType.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`₹${value.toFixed(2)}`, 'Amount']}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <ShoppingCart className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-sm text-muted-foreground">No sales data yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Top Selling Items
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Best performers by quantity
              </p>
            </div>
          </CardHeader>
          <CardContent>
            {metrics?.topSellingItems && metrics.topSellingItems.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8">#</TableHead>
                    <TableHead>Item Name</TableHead>
                    <TableHead className="text-right">Qty Sold</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metrics.topSellingItems.map((item, index) => (
                    <TableRow key={item.itemId}>
                      <TableCell>
                        <Badge variant={index < 3 ? "default" : "secondary"} className="w-6 h-6 rounded-full flex items-center justify-center p-0">
                          {index + 1}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{item.itemName}</TableCell>
                      <TableCell className="text-right font-mono">{item.totalQty.toFixed(0)}</TableCell>
                      <TableCell className="text-right font-mono">₹{item.totalAmount.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Package className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-sm text-muted-foreground">No sales data yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Expiring Soon
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Items expiring in 30 days
            </p>
          </CardHeader>
          <CardContent>
            {metrics?.expiringStock && metrics.expiringStock.length > 0 ? (
              <div className="space-y-3">
                {metrics.expiringStock.slice(0, 5).map((item) => {
                  const days = typeof item.daysUntilExpiry === 'number' && !isNaN(item.daysUntilExpiry) 
                    ? item.daysUntilExpiry 
                    : 0;
                  return (
                    <div key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.itemName}</p>
                        <p className="text-xs text-muted-foreground font-mono">{item.barcode}</p>
                      </div>
                      <Badge 
                        variant={days <= 7 ? "destructive" : days <= 14 ? "secondary" : "outline"}
                        className="ml-2 shrink-0"
                      >
                        {days <= 0 ? 'Expired' : `${days}d`}
                      </Badge>
                    </div>
                  );
                })}
                {metrics.expiringStock.length > 5 && (
                  <Button asChild variant="outline" size="sm" className="w-full mt-2">
                    <Link href="/stock-view" data-testid="link-view-all-expiring">
                      View All ({metrics.expiringStock.length})
                    </Link>
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Calendar className="h-10 w-10 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">No items expiring soon</p>
              </div>
            )}
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
              <Link href="/sales/b2b" data-testid="button-new-b2b-sale">
                <FileText className="mr-2 h-4 w-4" />
                New B2B Sale (Credit)
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/sales/b2c" data-testid="button-new-b2c-sale">
                <ShoppingCart className="mr-2 h-4 w-4" />
                New B2C Sale (Retail)
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
              <Link href="/stock-view" data-testid="button-check-stock">
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
