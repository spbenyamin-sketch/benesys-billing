import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
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
import { Archive, Search, Printer } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useReactToPrint } from "react-to-print";
import { useCompany } from "@/contexts/CompanyContext";
import { format } from "date-fns";

interface CategoryReport {
  category: string | null;
  totalQty: string;
  totalAmount: string;
  totalSaleValue: string;
  totalTaxValue: string;
  invoiceCount: number;
  itemCount: number;
}

function CategoriesReportPrint({
  categories,
  totals,
  companyName,
  dateRange,
  saleType,
}: {
  categories: CategoryReport[];
  totals: { qty: number; saleValue: number; taxValue: number; amount: number };
  companyName: string;
  dateRange: string;
  saleType: string;
}) {
  return (
    <div className="p-8 bg-white text-black">
      <div className="text-center mb-6">
        <h1 className="text-xl font-bold">{companyName}</h1>
        <h2 className="text-lg font-semibold">Category Wise Sales Report</h2>
        <p className="text-sm text-gray-600">{dateRange}</p>
        {saleType && <p className="text-sm text-gray-600">Sale Type: {saleType}</p>}
      </div>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-black">
            <th className="text-left py-1 px-1">Category</th>
            <th className="text-right py-1 px-1">Items</th>
            <th className="text-right py-1 px-1">Bills</th>
            <th className="text-right py-1 px-1">Qty</th>
            <th className="text-right py-1 px-1">Sale Value</th>
            <th className="text-right py-1 px-1">Tax</th>
            <th className="text-right py-1 px-1">Amount</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((cat, idx) => (
            <tr key={idx} className="border-b border-gray-200">
              <td className="py-1 px-1">{cat.category || "Uncategorized"}</td>
              <td className="text-right py-1 px-1">{cat.itemCount}</td>
              <td className="text-right py-1 px-1">{cat.invoiceCount}</td>
              <td className="text-right py-1 px-1">{parseFloat(cat.totalQty).toFixed(3)}</td>
              <td className="text-right py-1 px-1">{parseFloat(cat.totalSaleValue).toFixed(2)}</td>
              <td className="text-right py-1 px-1">{parseFloat(cat.totalTaxValue).toFixed(2)}</td>
              <td className="text-right py-1 px-1 font-medium">{parseFloat(cat.totalAmount).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-black font-bold">
            <td colSpan={2} className="py-2 px-1">Total ({categories.length} categories)</td>
            <td className="text-right py-2 px-1">{categories.reduce((s, c) => s + c.invoiceCount, 0)}</td>
            <td className="text-right py-2 px-1">{totals.qty.toFixed(3)}</td>
            <td className="text-right py-2 px-1">{totals.saleValue.toFixed(2)}</td>
            <td className="text-right py-2 px-1">{totals.taxValue.toFixed(2)}</td>
            <td className="text-right py-2 px-1">{totals.amount.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

export default function CategoriesReport() {
  const { t } = useTranslation();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [saleType, setSaleType] = useState("all");
  const printRef = useRef<HTMLDivElement>(null);
  const { currentCompany } = useCompany();

  // Build query params as URL search params
  const queryParams = new URLSearchParams();
  if (startDate) queryParams.set("startDate", startDate);
  if (endDate) queryParams.set("endDate", endDate);
  if (saleType !== "all") queryParams.set("saleType", saleType);

  const queryString = queryParams.toString();
  const apiUrl = queryString ? `/api/reports/categories?${queryString}` : "/api/reports/categories";

  const { data: categories, isLoading } = useQuery<CategoryReport[]>({
    queryKey: ["/api/reports/categories", startDate, endDate, saleType],
    queryFn: async () => {
      const res = await fetch(apiUrl, { credentials: "include", headers: { "X-Company-Id": localStorage.getItem("currentCompanyId") || "" } });
      if (!res.ok) throw new Error("Failed to fetch categories report");
      return res.json();
    },
  });

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Categories-Report-${format(new Date(), "yyyy-MM-dd")}`,
  });

  const filteredCategories = categories?.filter((cat) =>
    (cat.category?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totals = filteredCategories?.reduce(
    (acc, cat) => ({
      qty: acc.qty + parseFloat(cat.totalQty),
      saleValue: acc.saleValue + parseFloat(cat.totalSaleValue),
      taxValue: acc.taxValue + parseFloat(cat.totalTaxValue),
      amount: acc.amount + parseFloat(cat.totalAmount),
    }),
    { qty: 0, saleValue: 0, taxValue: 0, amount: 0 }
  ) || { qty: 0, saleValue: 0, taxValue: 0, amount: 0 };

  const dateRange = startDate && endDate
    ? `${format(new Date(startDate), "dd/MM/yyyy")} to ${format(new Date(endDate), "dd/MM/yyyy")}`
    : "All Time";

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Category Wise Sales</h1>
          <p className="text-muted-foreground mt-2">
            Category-wise sales analysis for all bill types
          </p>
        </div>
        <Button onClick={() => handlePrint()} disabled={!filteredCategories?.length} data-testid="button-print-categories-report">
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
              <Label htmlFor="saleType">Sale Type</Label>
              <Select value={saleType} onValueChange={setSaleType} data-testid="select-sale-type">
                <SelectTrigger id="saleType">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="B2B">B2B (Credit)</SelectItem>
                  <SelectItem value="B2C">B2C (Retail)</SelectItem>
                  <SelectItem value="ESTIMATE">Estimate</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="search">Search Category</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-categories"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 sm:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold font-mono" data-testid="text-total-categories">
              {filteredCategories?.length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Quantity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold font-mono" data-testid="text-total-qty">
              {totals.qty.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tax</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold font-mono" data-testid="text-total-tax">
              ₹{totals.taxValue.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold font-mono" data-testid="text-total-amount">
              ₹{totals.amount.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Category Sales Details</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredCategories && filteredCategories.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Items</TableHead>
                  <TableHead className="text-right">Bills</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Sale Value</TableHead>
                  <TableHead className="text-right">Tax</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories.map((cat, idx) => (
                  <TableRow key={idx} data-testid={`row-category-${idx}`}>
                    <TableCell className="font-medium">{cat.category || "Uncategorized"}</TableCell>
                    <TableCell className="text-right font-mono">{cat.itemCount}</TableCell>
                    <TableCell className="text-right font-mono">{cat.invoiceCount}</TableCell>
                    <TableCell className="text-right font-mono">
                      {parseFloat(cat.totalQty).toFixed(3)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      ₹{parseFloat(cat.totalSaleValue).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      ₹{parseFloat(cat.totalTaxValue).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      ₹{parseFloat(cat.totalAmount).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Archive className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-sm text-muted-foreground">
                {searchQuery ? "No categories found" : "No sales data for selected period"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hidden print container */}
      <div style={{ position: 'absolute', left: '-9999px', top: '0' }}>
        <div ref={printRef}>
          <CategoriesReportPrint
            categories={filteredCategories || []}
            totals={totals}
            companyName={currentCompany?.name || "Company"}
            dateRange={dateRange}
            saleType={saleType === "all" ? "" : saleType}
          />
        </div>
      </div>
    </div>
  );
}
