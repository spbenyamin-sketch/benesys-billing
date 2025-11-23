import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Package } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

export default function PurchaseDetail() {
  const [, params] = useRoute("/purchases/:id");
  const purchaseId = params?.id;

  const { data: purchase, isLoading } = useQuery<any>({
    queryKey: ["/api/purchases", purchaseId],
    enabled: !!purchaseId,
  });

  if (isLoading) {
    return (
      <div className="h-full overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!purchase) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Package className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-4">Purchase not found</p>
        <Link href="/purchases">
          <Button>Back to Purchases</Button>
        </Link>
      </div>
    );
  }

  const totalAmount = purchase.items?.reduce((sum: number, item: any) => {
    const cost = Number(item.cost || 0);
    const qty = Number(item.qty || 0);
    const tax = Number(item.tax || 0);
    return sum + (cost * qty * (1 + tax / 100));
  }, 0) || 0;

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/purchases">
            <Button variant="outline" size="sm" data-testid="button-back">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Purchase Details</h1>
            <p className="text-muted-foreground">Invoice: {purchase.invoiceNo}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Purchase Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-medium">{new Date(purchase.date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Invoice Number</p>
                <p className="font-medium">{purchase.invoiceNo}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Party Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Party Name</p>
                <p className="font-medium">{purchase.partyName || "Cash"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">City</p>
                <p className="font-medium">{purchase.city || "—"}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Total Quantity</p>
                <p className="font-medium font-mono">{purchase.totalQty || 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Bill Amount</p>
                <p className="text-lg font-bold font-mono">₹{totalAmount.toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Purchase Items</CardTitle>
          </CardHeader>
          <CardContent>
            {!purchase.items || purchase.items.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No items in this purchase</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Serial</TableHead>
                      <TableHead>Barcode</TableHead>
                      <TableHead>Item Name</TableHead>
                      <TableHead>Brand</TableHead>
                      <TableHead>Quality</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Cost</TableHead>
                      <TableHead className="text-right">Tax %</TableHead>
                      <TableHead className="text-right">Rate</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchase.items.map((item: any, index: number) => {
                      const cost = Number(item.cost || 0);
                      const qty = Number(item.qty || 0);
                      const tax = Number(item.tax || 0);
                      const rate = cost * (1 + tax / 100);
                      const amount = rate * qty;

                      return (
                        <TableRow key={index} data-testid={`row-item-${index}`}>
                          <TableCell className="font-mono">{item.serial}</TableCell>
                          <TableCell className="font-mono">{item.barcode || "—"}</TableCell>
                          <TableCell className="font-medium">{item.itname}</TableCell>
                          <TableCell className="text-muted-foreground">{item.brandname || "—"}</TableCell>
                          <TableCell className="text-muted-foreground">{item.name || "—"}</TableCell>
                          <TableCell className="text-right font-mono">{qty}</TableCell>
                          <TableCell className="text-right font-mono">₹{cost.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-mono">{tax}%</TableCell>
                          <TableCell className="text-right font-mono">₹{rate.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-mono font-medium">₹{amount.toFixed(2)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
