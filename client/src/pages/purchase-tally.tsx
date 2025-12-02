import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertTriangle, Package } from "lucide-react";
import { format } from "date-fns";

interface PurchaseItem {
  id: number;
  purchaseId: number;
  itname: string;
  qty: number;
  cost: number;
  tax: number;
}

interface StockInwardItem {
  id: number;
  purchaseItemId: number;
  barcode: string;
  status: string;
}

interface TallyStatus {
  purchaseId: number;
  purchaseNo: number;
  date: string;
  invoiceNo: string;
  partyName: string;
  totalItems: number;
  matchedItems: number;
  unmatchedItems: number;
  totalQty: number;
  receivedQty: number;
  items: Array<{
    id: number;
    itemName: string;
    billQty: number;
    receivedQty: number;
    matched: boolean;
    cost: number;
    tax: number;
  }>;
}

export default function PurchaseTally() {
  const { data: tallyStatus, isLoading } = useQuery<TallyStatus[]>({
    queryKey: ["/api/purchase-tally"],
  });

  if (isLoading) {
    return (
      <div className="h-full overflow-auto p-6">
        <div className="text-center py-8 text-muted-foreground">Loading tally data...</div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Purchase Tally Status</h1>
          <p className="text-muted-foreground mt-1">Reconcile bill entries with actual stock inward - qty tallying and unmatched items</p>
        </div>

        {!tallyStatus || tallyStatus.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                No purchase entries with stock inward found.
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {tallyStatus.map((purchase) => {
              const matchPercentage = purchase.totalItems > 0 ? (purchase.matchedItems / purchase.totalItems) * 100 : 0;
              const qtyMatchPercentage = purchase.totalQty > 0 ? (purchase.receivedQty / purchase.totalQty) * 100 : 0;

              return (
                <Card key={purchase.purchaseId}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Badge variant="outline">#{purchase.purchaseNo}</Badge>
                          {purchase.invoiceNo}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {purchase.partyName} • {format(new Date(purchase.date), "dd/MM/yyyy")}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold">
                          {purchase.matchedItems}/{purchase.totalItems} Items Matched
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {purchase.receivedQty}/{purchase.totalQty} Qty Received
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                        <div className="text-xs text-muted-foreground">Matched Items</div>
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {purchase.matchedItems}
                        </div>
                      </div>
                      <div className="p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                        <div className="text-xs text-muted-foreground">Unmatched Items</div>
                        <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                          {purchase.unmatchedItems}
                        </div>
                      </div>
                      <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                        <div className="text-xs text-muted-foreground">Qty Variance</div>
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {Math.round(qtyMatchPercentage)}%
                        </div>
                      </div>
                    </div>

                    {purchase.unmatchedItems > 0 && (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          {purchase.unmatchedItems} item(s) not yet received or qty mismatch detected
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="border rounded-lg overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Item Name</TableHead>
                            <TableHead className="text-right">Bill Qty</TableHead>
                            <TableHead className="text-right">Received Qty</TableHead>
                            <TableHead className="text-right">Cost</TableHead>
                            <TableHead>Tax %</TableHead>
                            <TableHead className="text-center">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {purchase.items.map((item) => (
                            <TableRow key={item.id} data-testid={`row-tally-${item.id}`}>
                              <TableCell className="font-medium">{item.itemName}</TableCell>
                              <TableCell className="text-right">{item.billQty}</TableCell>
                              <TableCell className="text-right">
                                {item.receivedQty > 0 ? item.receivedQty : "-"}
                              </TableCell>
                              <TableCell className="text-right">₹{item.cost.toFixed(2)}</TableCell>
                              <TableCell>{item.tax.toFixed(2)}%</TableCell>
                              <TableCell className="text-center">
                                {item.matched ? (
                                  <Badge variant="default" className="bg-green-600">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Matched
                                  </Badge>
                                ) : (
                                  <Badge variant="destructive">
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    Not Tallied
                                  </Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
