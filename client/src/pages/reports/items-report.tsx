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
import { Package, Search, Printer, FileSpreadsheet, FileDown } from "lucide-react";
import { exportToExcel, exportToPDF, formatCurrency } from "@/lib/export-utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useReactToPrint } from "react-to-print";
import { useCompany } from "@/contexts/CompanyContext";
import { format } from "date-fns";

interface ItemReport {
  itemId: number;
  itemCode: string;
  itemName: string;
  hsnCode: string | null;
  category: string | null;
  packType: string | null;
  tax: string | null;
  totalQty: string;
  totalAmount: string;
  totalSaleValue: string;
  totalTaxValue: string;
  invoiceCount: number;
}

function ItemsReportPrint({ 
  items, 
  totals, 
  companyName, 
  dateRange,
  saleType 
}: { 
  items: ItemReport[]; 
  totals: { qty: number; saleValue: number; taxValue: number; amount: number };
  companyName: string;
  dateRange: string;
  saleType: string;
}) {
  return (
    <div className="p-8 bg-white text-black">
      <div className="text-center mb-6">
        <h1 className="text-xl font-bold">{companyName}</h1>
        <h2 className="text-lg font-semibold">Item Sales Report</h2>
        <p className="text-sm text-gray-600">{dateRange}</p>
        {saleType && <p className="text-sm text-gray-600">Sale Type: {saleType}</p>}
      </div>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-black">
            <th className="text-left py-1 px-1">Code</th>
            <th className="text-left py-1 px-1">Item Name</th>
            <th className="text-left py-1 px-1">Category</th>
            <th className="text-left py-1 px-1">HSN</th>
            <th className="text-right py-1 px-1">Tax%</th>
            <th className="text-right py-1 px-1">Bills</th>
            <th className="text-right py-1 px-1">Qty</th>
            <th className="text-right py-1 px-1">Sale Value</th>
            <th className="text-right py-1 px-1">Tax</th>
            <th className="text-right py-1 px-1">Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={idx} className="border-b border-gray-200">
              <td className="py-1 px-1 font-mono text-xs">{item.itemCode}</td>
              <td className="py-1 px-1">{item.itemName}</td>
              <td className="py-1 px-1">{item.category || "—"}</td>
              <td className="py-1 px-1 font-mono text-xs">{item.hsnCode || "—"}</td>
              <td className="text-right py-1 px-1">{item.tax ? `${parseFloat(item.tax).toFixed(1)}%` : "—"}</td>
              <td className="text-right py-1 px-1">{item.invoiceCount}</td>
              <td className="text-right py-1 px-1">{parseFloat(item.totalQty).toFixed(3)}</td>
              <td className="text-right py-1 px-1">{parseFloat(item.totalSaleValue).toFixed(2)}</td>
              <td className="text-right py-1 px-1">{parseFloat(item.totalTaxValue).toFixed(2)}</td>
              <td className="text-right py-1 px-1 font-medium">{parseFloat(item.totalAmount).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-black font-bold">
            <td colSpan={5} className="py-2 px-1">Total ({items.length} items)</td>
            <td className="text-right py-2 px-1">{items.reduce((s, i) => s + i.invoiceCount, 0)}</td>
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

export default function ItemsReport() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [saleType, setSaleType] = useState("all");
  const [selectedItemId, setSelectedItemId] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const printRef = useRef<HTMLDivElement>(null);
  const { currentCompany } = useCompany();

  const { data: masterItems } = useQuery({
    queryKey: ["/api/items"],
  });

  // Get unique categories from items
  const categories = masterItems ? [...new Set(masterItems.map(item => item.category).filter(Boolean))] : [];

  // Build query params as URL search params
  const queryParams = new URLSearchParams();
  if (startDate) queryParams.set("startDate", startDate);
  if (endDate) queryParams.set("endDate", endDate);
  if (saleType !== "all") queryParams.set("saleType", saleType);
  if (selectedItemId) queryParams.set("itemId", selectedItemId);
  if (selectedCategory) queryParams.set("category", selectedCategory);

  const queryString = queryParams.toString();
  const apiUrl = queryString ? `/api/reports/items?${queryString}` : "/api/reports/items";

  const { data: items, isLoading } = useQuery<ItemReport[]>({
    queryKey: ["/api/reports/items", startDate, endDate, saleType, selectedItemId, selectedCategory],
    queryFn: async () => {
      const res = await fetch(apiUrl, { credentials: "include", headers: { "X-Company-Id": localStorage.getItem("currentCompanyId") || "" } });
      if (!res.ok) throw new Error("Failed to fetch items report");
      return res.json();
    },
  });

  const filteredItems = items?.filter((item) =>
    item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.itemCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.category?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totals = filteredItems?.reduce(
    (acc, item) => ({
      qty: acc.qty + parseFloat(item.totalQty),
      saleValue: acc.saleValue + parseFloat(item.totalSaleValue),
      taxValue: acc.taxValue + parseFloat(item.totalTaxValue),
      amount: acc.amount + parseFloat(item.totalAmount),
    }),
    { qty: 0, saleValue: 0, taxValue: 0, amount: 0 }
  ) || { qty: 0, saleValue: 0, taxValue: 0, amount: 0 };

  const dateRange = startDate && endDate 
    ? `${format(new Date(startDate), "dd/MM/yyyy")} to ${format(new Date(endDate), "dd/MM/yyyy")}`
    : "All Time";

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Items-Report-${format(new Date(), "yyyy-MM-dd")}`,
  });

  const handleExcelExport = () => {
    if (!filteredItems?.length) return;
    
    exportToExcel({
      title: "Item Wise Sales Report",
      filename: `Items-Report-${format(new Date(), "yyyy-MM-dd")}`,
      dateRange: { start: startDate, end: endDate },
      filters: saleType === "all" ? "All Types" : saleType,
      columns: [
        { header: "Code", key: "itemCode", width: 12 },
        { header: "Item Name", key: "itemName", width: 25 },
        { header: "Category", key: "category", width: 15 },
        { header: "HSN", key: "hsnCode", width: 12 },
        { header: "Tax%", key: "tax", width: 8 },
        { header: "Bills", key: "invoiceCount", width: 8 },
        { header: "Qty", key: "totalQty", width: 10 },
        { header: "Sale Value", key: "totalSaleValue", width: 12, format: formatCurrency },
        { header: "Tax", key: "totalTaxValue", width: 12, format: formatCurrency },
        { header: "Amount", key: "totalAmount", width: 12, format: formatCurrency },
      ],
      data: filteredItems.map(item => ({
        itemCode: item.itemCode,
        itemName: item.itemName,
        category: item.category || "",
        hsnCode: item.hsnCode || "",
        tax: item.tax ? `${parseFloat(item.tax).toFixed(1)}%` : "",
        invoiceCount: item.invoiceCount,
        totalQty: parseFloat(item.totalQty).toFixed(3),
        totalSaleValue: item.totalSaleValue,
        totalTaxValue: item.totalTaxValue,
        totalAmount: item.totalAmount,
      })),
      summary: {
        label: "Total",
        values: ["", "", "", "", filteredItems.reduce((s, i) => s + i.invoiceCount, 0).toString(), totals.qty.toFixed(3), totals.saleValue.toFixed(2), totals.taxValue.toFixed(2), totals.amount.toFixed(2)],
      },
    });
  };

  const handlePDFExport = () => {
    if (!filteredItems?.length) return;
    
    exportToPDF({
      title: "Item Wise Sales Report",
      filename: `Items-Report-${format(new Date(), "yyyy-MM-dd")}`,
      dateRange: { start: startDate, end: endDate },
      filters: saleType === "all" ? "All Types" : saleType,
      columns: [
        { header: "Code", key: "itemCode", width: 12 },
        { header: "Item Name", key: "itemName", width: 25 },
        { header: "Category", key: "category", width: 15 },
        { header: "HSN", key: "hsnCode", width: 12 },
        { header: "Tax%", key: "tax", width: 8 },
        { header: "Bills", key: "invoiceCount", width: 8 },
        { header: "Qty", key: "totalQty", width: 10 },
        { header: "Sale Value", key: "totalSaleValue", width: 12, format: formatCurrency },
        { header: "Tax", key: "totalTaxValue", width: 12, format: formatCurrency },
        { header: "Amount", key: "totalAmount", width: 12, format: formatCurrency },
      ],
      data: filteredItems.map(item => ({
        itemCode: item.itemCode,
        itemName: item.itemName,
        category: item.category || "",
        hsnCode: item.hsnCode || "",
        tax: item.tax ? `${parseFloat(item.tax).toFixed(1)}%` : "",
        invoiceCount: item.invoiceCount,
        totalQty: parseFloat(item.totalQty).toFixed(3),
        totalSaleValue: item.totalSaleValue,
        totalTaxValue: item.totalTaxValue,
        totalAmount: item.totalAmount,
      })),
      summary: {
        label: "Total",
        values: ["", "", "", "", filteredItems.reduce((s, i) => s + i.invoiceCount, 0).toString(), totals.qty.toFixed(3), totals.saleValue.toFixed(2), totals.taxValue.toFixed(2), totals.amount.toFixed(2)],
      },
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Item Wise Sales</h1>
          <p className="text-muted-foreground mt-2">
            Item-wise sales analysis for all bill types
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" onClick={handleExcelExport} disabled={!filteredItems?.length} data-testid="button-export-excel">
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Excel
          </Button>
          <Button variant="outline" onClick={handlePDFExport} disabled={!filteredItems?.length} data-testid="button-export-pdf">
            <FileDown className="mr-2 h-4 w-4" />
            PDF
          </Button>
          <Button variant="outline" onClick={() => handlePrint()} disabled={!filteredItems?.length} data-testid="button-print-items-report">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-6">
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
              <Label htmlFor="category">Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory} data-testid="select-category">
                <SelectTrigger id="category">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat || ""}>
                      {cat || "Uncategorized"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="itemId">Item Master</Label>
              <Select value={selectedItemId} onValueChange={setSelectedItemId} data-testid="select-item-master">
                <SelectTrigger id="itemId">
                  <SelectValue placeholder="All Items" />
                </SelectTrigger>
                <SelectContent>
                  {masterItems?.map((item) => (
                    <SelectItem key={item.id} value={item.id.toString()}>
                      {item.code} - {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="search">Search Items</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Name or code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-items"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 sm:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold font-mono" data-testid="text-total-items">
              {filteredItems?.length || 0}
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
          <CardTitle>Item Sales Details</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredItems && filteredItems.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>HSN</TableHead>
                  <TableHead className="text-right">Tax%</TableHead>
                  <TableHead className="text-right">Bills</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Sale Value</TableHead>
                  <TableHead className="text-right">Tax</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.itemId} data-testid={`row-item-${item.itemId}`}>
                    <TableCell className="font-medium font-mono">{item.itemCode}</TableCell>
                    <TableCell>{item.itemName}</TableCell>
                    <TableCell className="text-muted-foreground">{item.category || "—"}</TableCell>
                    <TableCell className="text-muted-foreground font-mono">
                      {item.hsnCode || "—"}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {item.tax ? `${parseFloat(item.tax).toFixed(1)}%` : "—"}
                    </TableCell>
                    <TableCell className="text-right font-mono">{item.invoiceCount}</TableCell>
                    <TableCell className="text-right font-mono">
                      {parseFloat(item.totalQty).toFixed(3)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      ₹{parseFloat(item.totalSaleValue).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      ₹{parseFloat(item.totalTaxValue).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      ₹{parseFloat(item.totalAmount).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-sm text-muted-foreground">
                {searchQuery ? "No items found" : "No sales data for selected period"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hidden print container */}
      <div style={{ position: 'absolute', left: '-9999px', top: '0' }}>
        <div ref={printRef}>
          <ItemsReportPrint
            items={filteredItems || []}
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
