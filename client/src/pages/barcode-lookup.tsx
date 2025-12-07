import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Barcode, AlertCircle, CheckCircle2, Clock, TrendingUp, Package, Truck } from "lucide-react";
import { format } from "date-fns";

export default function BarcodeLookup() {
  const { t } = useTranslation();
  const [searchBarcode, setSearchBarcode] = useState("");
  const [lookupBarcode, setLookupBarcode] = useState("");

  const { data: barcodeData, isLoading, error } = useQuery({
    queryKey: [`/api/inventory/barcode/${lookupBarcode}`],
    queryFn: async () => {
      if (!lookupBarcode) return null;
      const res = await fetch(`/api/inventory/barcode/${lookupBarcode}`, {
        credentials: "include",
        headers: { "X-Company-Id": localStorage.getItem("currentCompanyId") || "" },
      });
      if (!res.ok) throw new Error("Barcode not found");
      return res.json();
    },
    enabled: !!lookupBarcode,
  });

  const handleSearch = () => {
    if (searchBarcode.trim()) {
      setLookupBarcode(searchBarcode);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available":
      case "in_stock":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200">In Stock</Badge>;
      case "sold":
        return <Badge variant="secondary">Sold</Badge>;
      case "returned":
        return <Badge variant="outline">Returned</Badge>;
      case "damaged":
        return <Badge variant="destructive">Damaged</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Barcode Lookup</h1>
          <p className="text-muted-foreground">Search for a barcode to view complete product history, details, and all related information</p>
        </div>

        {/* Search Section */}
        <Card>
          <CardHeader>
            <CardTitle>Search Barcode</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Barcode className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Enter barcode (e.g., SKR0000001)..."
                  value={searchBarcode}
                  onChange={(e) => setSearchBarcode(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-9"
                  data-testid="input-barcode-lookup"
                />
              </div>
              <Button onClick={handleSearch} data-testid="button-search-barcode-lookup">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        {lookupBarcode && (
          <>
            {isLoading && (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">Loading barcode information...</p>
                </CardContent>
              </Card>
            )}

            {error && (
              <Card className="border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20">
                <CardContent className="py-6 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-red-900 dark:text-red-100">Barcode Not Found</p>
                    <p className="text-sm text-red-800 dark:text-red-200">
                      No product found with barcode: <span className="font-mono font-bold">{lookupBarcode}</span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {barcodeData && (
              <>
                {/* Barcode & Status Overview */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
                    <CardTitle className="text-xl">Barcode Overview</CardTitle>
                    <div className="flex gap-2">
                      {getStatusBadge(barcodeData.status)}
                      {barcodeData.status === "sold" && <Badge variant="default">Sold</Badge>}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div>
                        <p className="text-sm text-muted-foreground">Barcode</p>
                        <p className="font-mono font-bold text-lg">{barcodeData.barcode}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Serial Number</p>
                        <p className="font-mono font-bold text-lg">{barcodeData.serial}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Entry Date</p>
                        <p className="font-medium">{barcodeData.createdAt ? format(new Date(barcodeData.createdAt), "dd MMM yyyy HH:mm") : "—"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <p className="font-medium capitalize">{barcodeData.status}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Item Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Product Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div>
                        <p className="text-sm text-muted-foreground">Item Name</p>
                        <p className="font-medium text-lg">{barcodeData.itemName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Brand</p>
                        <p className="font-medium">{barcodeData.brandName || "—"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Quality/Tag</p>
                        <p className="font-medium">{barcodeData.quality || "—"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Size</p>
                        <p className="font-medium">{barcodeData.size || "—"} {barcodeData.sizeCode ? `(${barcodeData.sizeCode})` : ""}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Design No</p>
                        <p className="font-medium">{barcodeData.dno1 || "—"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Pattern</p>
                        <p className="font-medium">{barcodeData.pattern || "—"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Sleeve/Color</p>
                        <p className="font-medium">{barcodeData.sleeve || "—"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Quantity</p>
                        <p className="font-bold text-lg">{Number(barcodeData.qty || 1).toFixed(0)} units</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">HSN Code</p>
                        <p className="font-mono">{barcodeData.hsnCode || "—"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Pack Type</p>
                        <p className="font-medium">{barcodeData.packType || "—"}</p>
                      </div>
                      {barcodeData.expDate && (
                        <div>
                          <p className="text-sm text-muted-foreground">Expiry Date</p>
                          <p className="font-medium">{format(new Date(barcodeData.expDate), "dd MMM yyyy")}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Pricing Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Pricing Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div>
                        <p className="text-sm text-muted-foreground">Cost Price</p>
                        <p className="font-mono font-bold text-lg">₹{Number(barcodeData.cost || 0).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Net Cost</p>
                        <p className="font-mono font-bold text-lg">₹{Number(barcodeData.ncost || 0).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Landing Cost</p>
                        <p className="font-mono font-bold text-lg">₹{Number(barcodeData.lcost || 0).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Selling Rate</p>
                        <p className="font-mono font-bold text-lg text-green-600">₹{Number(barcodeData.rate || 0).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">MRP</p>
                        <p className="font-mono font-bold text-lg">₹{Number(barcodeData.mrp || 0).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Tax %</p>
                        <p className="font-bold">{Number(barcodeData.tax || 0).toFixed(2)}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">CGST</p>
                        <p className="font-bold">{Number(barcodeData.cgst || 0).toFixed(2)}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">SGST</p>
                        <p className="font-bold">{Number(barcodeData.sgst || 0).toFixed(2)}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Stock Inward (Supplier) Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="h-5 w-5" />
                      Stock Inward Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm text-muted-foreground">Purchase No</p>
                        <p className="font-mono font-bold text-lg">{barcodeData.purchaseNo}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Purchase Invoice</p>
                        <p className="font-mono font-bold">{barcodeData.purchaseInvoice || "—"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Entry Date</p>
                        <p className="font-medium">{barcodeData.purchaseDate ? format(new Date(barcodeData.purchaseDate), "dd MMM yyyy") : "—"}</p>
                      </div>
                      <Separator className="md:col-span-2" />
                      <div className="md:col-span-2">
                        <p className="text-sm text-muted-foreground">Supplier/Party Details</p>
                        <div className="mt-2 space-y-2">
                          <p className="font-medium text-lg">{barcodeData.supplierName || "—"}</p>
                          <p className="text-sm">Code: <span className="font-mono">{barcodeData.supplierCode || "—"}</span></p>
                          <p className="text-sm">City: <span className="font-medium">{barcodeData.supplierCity || "—"}</span></p>
                          <p className="text-sm">Phone: <span className="font-medium">{barcodeData.supplierPhone || "—"}</span></p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Sale Bill Details (if sold) */}
                {barcodeData.sale && (
                  <Card className="border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        Sale Bill Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <p className="text-sm text-muted-foreground">Invoice No</p>
                          <p className="font-mono font-bold text-lg">{barcodeData.sale.invoiceNo}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Sale Type</p>
                          <p className="font-bold text-lg">{barcodeData.sale.saleType}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Sale Date</p>
                          <p className="font-medium">{barcodeData.sale.date ? format(new Date(barcodeData.sale.date), "dd MMM yyyy") : "—"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Bill Type</p>
                          <p className="font-bold">{barcodeData.sale.billType || "—"}</p>
                        </div>
                        <Separator className="md:col-span-2" />
                        <div className="md:col-span-2">
                          <p className="text-sm text-muted-foreground">Customer/Party Details</p>
                          <div className="mt-2 space-y-2">
                            <p className="font-medium text-lg">{barcodeData.sale.customerName || "Cash Sale"}</p>
                            <p className="text-sm">Code: <span className="font-mono">{barcodeData.sale.customerCode || "—"}</span></p>
                            <p className="text-sm">City: <span className="font-medium">{barcodeData.sale.customerCity || "—"}</span></p>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Sale Value</p>
                          <p className="font-mono font-bold text-lg">₹{Number(barcodeData.sale.saleValue || 0).toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Tax Value</p>
                          <p className="font-mono font-bold text-lg">₹{Number(barcodeData.sale.taxValue || 0).toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Grand Total</p>
                          <p className="font-mono font-bold text-lg text-green-600">₹{Number(barcodeData.sale.grandTotal || 0).toFixed(2)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Status Timeline */}
                <Card>
                  <CardHeader>
                    <CardTitle>Status Timeline</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center mb-2">
                            <span className="text-sm font-bold text-blue-700 dark:text-blue-300">1</span>
                          </div>
                          <div className={`h-12 w-1 ${barcodeData.status === "sold" ? "bg-green-300" : "bg-gray-200 dark:bg-gray-700"}`}></div>
                        </div>
                        <div>
                          <p className="font-bold">Stock Inward Entry</p>
                          <p className="text-sm text-muted-foreground">
                            {barcodeData.createdAt ? format(new Date(barcodeData.createdAt), "dd MMM yyyy HH:mm") : "—"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">Purchase No: {barcodeData.purchaseNo}</p>
                          <p className="text-xs text-muted-foreground">From: {barcodeData.supplierName || "—"}</p>
                        </div>
                      </div>

                      {barcodeData.status === "sold" && barcodeData.sale && (
                        <div className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
                              <span className="text-sm font-bold text-green-700 dark:text-green-300">2</span>
                            </div>
                          </div>
                          <div>
                            <p className="font-bold">Sold</p>
                            <p className="text-sm text-muted-foreground">
                              {barcodeData.soldAt ? format(new Date(barcodeData.soldAt), "dd MMM yyyy HH:mm") : "—"}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">Invoice No: {barcodeData.sale.invoiceNo}</p>
                            <p className="text-xs text-muted-foreground">To: {barcodeData.sale.customerName || "Cash Customer"}</p>
                          </div>
                        </div>
                      )}

                      {(barcodeData.status === "available" || barcodeData.status === "in_stock") && (
                        <div className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className="h-10 w-10 rounded-full bg-yellow-100 dark:bg-yellow-950 flex items-center justify-center">
                              <span className="text-sm font-bold text-yellow-700 dark:text-yellow-300">2</span>
                            </div>
                          </div>
                          <div>
                            <p className="font-bold">Currently in Stock</p>
                            <p className="text-sm text-muted-foreground">Available for sale</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
