import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Barcode, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { format } from "date-fns";

export default function BarcodeLookup() {
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
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Barcode Lookup</h1>
          <p className="text-muted-foreground">Search for a barcode to view complete product history and details</p>
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
                {/* Barcode Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Barcode Details</span>
                      {getStatusBadge(barcodeData.status)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div>
                        <p className="text-sm text-muted-foreground">Barcode</p>
                        <p className="font-mono font-bold text-lg">{barcodeData.barcode}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Serial Number</p>
                        <p className="font-mono font-bold text-lg">{barcodeData.serial}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Item Name</p>
                        <p className="font-medium">{barcodeData.itemName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Brand</p>
                        <p className="font-medium">{barcodeData.brandName || "—"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Quality/Size</p>
                        <p className="font-medium">{barcodeData.quality || "—"} {barcodeData.size ? `/ ${barcodeData.size}` : ""}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Quantity</p>
                        <p className="font-bold text-lg">{Number(barcodeData.qty || 1).toFixed(0)} units</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Cost Price</p>
                        <p className="font-mono font-bold">₹{Number(barcodeData.cost || 0).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Selling Rate</p>
                        <p className="font-mono font-bold">₹{Number(barcodeData.rate || 0).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">MRP</p>
                        <p className="font-mono font-bold">₹{Number(barcodeData.mrp || 0).toFixed(2)}</p>
                      </div>
                      {barcodeData.taxPercent && (
                        <div>
                          <p className="text-sm text-muted-foreground">Tax</p>
                          <p className="font-bold">{Number(barcodeData.taxPercent).toFixed(1)}%</p>
                        </div>
                      )}
                      {barcodeData.expdate && (
                        <div>
                          <p className="text-sm text-muted-foreground">Expiry Date</p>
                          <p className="font-medium">{format(new Date(barcodeData.expdate), "dd MMM yyyy")}</p>
                        </div>
                      )}
                      {barcodeData.createdAt && (
                        <div>
                          <p className="text-sm text-muted-foreground">Added to Stock</p>
                          <p className="font-medium">{format(new Date(barcodeData.createdAt), "dd MMM yyyy HH:mm")}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Stock Inward Details */}
                {barcodeData.purchaseInvoice && (
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Stock Inward
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <p className="text-sm text-muted-foreground">Purchase Invoice</p>
                          <p className="font-mono font-bold">{barcodeData.purchaseInvoice}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Purchase Date</p>
                          <p className="font-medium">{barcodeData.purchaseDate ? format(new Date(barcodeData.purchaseDate), "dd MMM yyyy") : "—"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Supplier</p>
                          <p className="font-medium">{barcodeData.partyName || "—"}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Sales Details */}
                {barcodeData.saleInvoice && (
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        Sale Details
                      </CardTitle>
                      <Badge variant="default">Sold</Badge>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <p className="text-sm text-muted-foreground">Sale Invoice</p>
                          <p className="font-mono font-bold">{barcodeData.saleInvoice}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Sale Date</p>
                          <p className="font-medium">{barcodeData.saleDate ? format(new Date(barcodeData.saleDate), "dd MMM yyyy") : "—"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Sale Type</p>
                          <p className="font-medium">{barcodeData.saleType || "—"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Customer</p>
                          <p className="font-medium">{barcodeData.salePartyName || "Cash Sale"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Sale Rate</p>
                          <p className="font-mono font-bold">₹{Number(barcodeData.saleRate || 0).toFixed(2)}</p>
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
                            <span className="text-sm font-bold">1</span>
                          </div>
                          <div className="h-12 w-1 bg-gray-200 dark:bg-gray-700"></div>
                        </div>
                        <div>
                          <p className="font-medium">Stock Inward</p>
                          <p className="text-sm text-muted-foreground">
                            {barcodeData.createdAt ? format(new Date(barcodeData.createdAt), "dd MMM yyyy HH:mm") : "—"}
                          </p>
                        </div>
                      </div>

                      {barcodeData.status === "sold" && barcodeData.saleDate && (
                        <div className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
                              <span className="text-sm font-bold">2</span>
                            </div>
                          </div>
                          <div>
                            <p className="font-medium">Sold</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(barcodeData.saleDate), "dd MMM yyyy HH:mm")}
                            </p>
                          </div>
                        </div>
                      )}

                      {(barcodeData.status === "available" || barcodeData.status === "in_stock") && (
                        <div className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className="h-10 w-10 rounded-full bg-yellow-100 dark:bg-yellow-950 flex items-center justify-center">
                              <span className="text-sm font-bold">2</span>
                            </div>
                          </div>
                          <div>
                            <p className="font-medium">Currently in Stock</p>
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
