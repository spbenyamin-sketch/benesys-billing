import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ArrowLeft, Package, User, Barcode as BarcodeIcon } from "lucide-react";
import { format } from "date-fns";

interface Purchase {
  id: number;
  purchaseNo: number;
  date: string;
  invoiceNo: string | null;
  partyId: number | null;
  partyName: string | null;
  partyCity: string | null;
  amount: number;
  notes: string | null;
}

interface StockItem {
  id: number;
  serial: number;
  barcode: string;
  itname: string;
  brandname: string | null;
  quality: string | null;
  dno1: string | null;
  pattern: string | null;
  sleeve: string | null;
  size: string | null;
  sizeCode: number | null;
  qty: number;
  cost: string;
  ncost: string;
  lcost: string;
  rate: string;
  mrp: string;
  tax: string;
  expdate: string | null;
  status: string;
  createdAt: string;
}

interface PartyDetails {
  id: number;
  name: string;
  code: string;
  city: string;
  phone: string | null;
  gstin: string | null;
  address: string | null;
  openingDebit: number;
  openingCredit: number;
}

const getCompanyHeader = (): Record<string, string> => {
  const companyId = localStorage.getItem("currentCompanyId");
  return companyId ? { "X-Company-Id": companyId } : {};
};

export default function PurchaseDetails() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const purchaseId = parseInt(id || "0");

  const { data: purchase, isLoading: purchaseLoading } = useQuery<Purchase>({
    queryKey: [`/api/purchases/${purchaseId}`],
    queryFn: async () => {
      const res = await fetch(`/api/purchases/${purchaseId}`, {
        credentials: "include",
        headers: getCompanyHeader(),
      });
      if (!res.ok) throw new Error("Failed to fetch purchase");
      return res.json();
    },
    enabled: !!purchaseId,
  });

  const { data: partyDetails } = useQuery<PartyDetails>({
    queryKey: [`/api/parties/${purchase?.partyId}`],
    queryFn: async () => {
      const res = await fetch(`/api/parties/${purchase?.partyId}`, {
        credentials: "include",
        headers: getCompanyHeader(),
      });
      if (!res.ok) throw new Error("Failed to fetch party");
      return res.json();
    },
    enabled: !!purchase?.partyId,
  });

  const { data: stockItems } = useQuery<StockItem[]>({
    queryKey: [`/api/purchases/${purchaseId}/items`],
    queryFn: async () => {
      const res = await fetch(`/api/purchases/${purchaseId}/items`, {
        credentials: "include",
        headers: getCompanyHeader(),
      });
      if (!res.ok) throw new Error("Failed to fetch stock items");
      return res.json();
    },
    enabled: !!purchaseId,
  });

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

  if (purchaseLoading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!purchase) {
    return <div className="p-6">Purchase not found</div>;
  }

  const totalQty = (stockItems || []).reduce((sum, item) => sum + (item.qty || 1), 0);
  const totalValue = (stockItems || []).reduce((sum, item) => sum + Number(item.cost) * (item.qty || 1), 0);

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/barcode-management")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Purchase Details</h1>
            <p className="text-muted-foreground">Invoice: {purchase.invoiceNo || "—"}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Purchase Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Purchase Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Purchase Number</p>
                <p className="font-mono font-bold text-lg">{purchase.purchaseNo}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">Purchase Date</p>
                <p className="font-medium">{format(new Date(purchase.date), "dd MMM yyyy")}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Invoice Number</p>
                <p className="font-mono">{purchase.invoiceNo || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="font-mono font-bold text-lg">₹{Number(purchase.amount).toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Party Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Supplier Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Supplier Name</p>
                <p className="font-bold text-lg">{partyDetails?.name || purchase.partyName || "—"}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">Code</p>
                <p className="font-mono">{partyDetails?.code || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">City</p>
                <p className="font-medium">{partyDetails?.city || purchase.partyCity || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{partyDetails?.phone || "—"}</p>
              </div>
              {partyDetails?.gstin && (
                <div>
                  <p className="text-sm text-muted-foreground">GSTIN</p>
                  <p className="font-mono text-sm">{partyDetails.gstin}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Items</p>
                <p className="font-bold text-lg">{stockItems?.length || 0}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">Total Quantity</p>
                <p className="font-bold text-lg">{totalQty}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Cost Value</p>
                <p className="font-mono font-bold text-lg">₹{totalValue.toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stock Items Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarcodeIcon className="h-5 w-5" />
              Stock Inward Items ({stockItems?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!stockItems || stockItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No stock items found</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60px]">Serial</TableHead>
                      <TableHead className="w-[100px]">Barcode</TableHead>
                      <TableHead>Item Name</TableHead>
                      <TableHead>Brand</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Net Cost</TableHead>
                      <TableHead>Landing Cost</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead>MRP</TableHead>
                      <TableHead>Tax %</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stockItems.map((item) => (
                      <TableRow key={item.id} data-testid={`row-stock-item-${item.id}`}>
                        <TableCell className="font-bold">{item.serial}</TableCell>
                        <TableCell className="font-mono font-bold">{item.barcode}</TableCell>
                        <TableCell>{item.itname}</TableCell>
                        <TableCell>{item.brandname || "—"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.size || "—"}</Badge>
                        </TableCell>
                        <TableCell className="text-center font-bold">{item.qty || 1}</TableCell>
                        <TableCell className="font-mono">₹{Number(item.cost).toFixed(2)}</TableCell>
                        <TableCell className="font-mono">₹{Number(item.ncost).toFixed(2)}</TableCell>
                        <TableCell className="font-mono">₹{Number(item.lcost).toFixed(2)}</TableCell>
                        <TableCell className="font-mono">₹{Number(item.rate).toFixed(2)}</TableCell>
                        <TableCell className="font-mono">₹{Number(item.mrp).toFixed(2)}</TableCell>
                        <TableCell className="text-center font-bold">{Number(item.tax).toFixed(2)}%</TableCell>
                        <TableCell>{getStatusBadge(item.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* All Stock Inward Fields Details */}
        {stockItems && stockItems.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>All Stock Inward Fields</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {stockItems.map((item) => (
                  <div key={item.id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-lg">
                        Serial #{item.serial} - {item.barcode}
                      </h3>
                      <div className="flex gap-2">
                        {getStatusBadge(item.status)}
                        <Badge variant="outline">{item.itname}</Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Basic Info */}
                      <div>
                        <p className="text-sm text-muted-foreground">Item Name</p>
                        <p className="font-medium">{item.itname}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Brand</p>
                        <p className="font-medium">{item.brandname || "—"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Quality/Tag</p>
                        <p className="font-medium">{item.quality || "—"}</p>
                      </div>

                      {/* Size & Attributes */}
                      <div>
                        <p className="text-sm text-muted-foreground">Size</p>
                        <p className="font-medium">{item.size || "—"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Size Code</p>
                        <p className="font-mono">{item.sizeCode || "—"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Design No</p>
                        <p className="font-medium">{item.dno1 || "—"}</p>
                      </div>

                      {/* More Attributes */}
                      <div>
                        <p className="text-sm text-muted-foreground">Pattern</p>
                        <p className="font-medium">{item.pattern || "—"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Sleeve/Color</p>
                        <p className="font-medium">{item.sleeve || "—"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Quantity</p>
                        <p className="font-bold text-lg">{item.qty || 1}</p>
                      </div>

                      {/* Pricing */}
                      <div>
                        <p className="text-sm text-muted-foreground">Cost Price</p>
                        <p className="font-mono font-bold">₹{Number(item.cost).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Net Cost</p>
                        <p className="font-mono font-bold">₹{Number(item.ncost).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Landing Cost</p>
                        <p className="font-mono font-bold">₹{Number(item.lcost).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Selling Rate</p>
                        <p className="font-mono font-bold text-green-600">₹{Number(item.rate).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">MRP</p>
                        <p className="font-mono font-bold">₹{Number(item.mrp).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Tax %</p>
                        <p className="font-bold">{Number(item.tax).toFixed(2)}%</p>
                      </div>

                      {/* Dates */}
                      {item.expdate && (
                        <div>
                          <p className="text-sm text-muted-foreground">Expiry Date</p>
                          <p className="font-medium">{format(new Date(item.expdate), "dd MMM yyyy")}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-muted-foreground">Entry Date</p>
                        <p className="font-medium">{format(new Date(item.createdAt), "dd MMM yyyy HH:mm")}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
