import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Plus, Eye, FileText } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

export default function Purchases() {

  const { data: purchases, isLoading } = useQuery<any[]>({
    queryKey: ["/api/purchases"],
  });

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Purchases</h1>
            <p className="text-muted-foreground">View and manage all purchase records</p>
          </div>
          <Link href="/purchases/new">
            <Button data-testid="button-new-purchase">
              <Plus className="mr-2 h-4 w-4" />
              New Purchase
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Purchase History</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : !purchases || purchases.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No purchases found</p>
                <Link href="/purchases/new">
                  <Button data-testid="button-create-first-purchase">
                    <Plus className="mr-2 h-4 w-4" />
                    Create First Purchase
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Invoice No</TableHead>
                      <TableHead>Party</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead className="text-right">Total Qty</TableHead>
                      <TableHead className="text-right">Bill Amount</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchases.map((purchase) => (
                      <TableRow key={purchase.id} data-testid={`row-purchase-${purchase.id}`}>
                        <TableCell>{new Date(purchase.date).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium">{purchase.invoiceNo}</TableCell>
                        <TableCell>{purchase.partyName || "Cash"}</TableCell>
                        <TableCell className="text-muted-foreground">{purchase.city}</TableCell>
                        <TableCell className="text-right font-mono">{purchase.totalQty || 0}</TableCell>
                        <TableCell className="text-right font-mono">
                          ₹{Number(purchase.billAmt || 0).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/purchases/${purchase.id}`}>
                            <Button variant="ghost" size="sm" data-testid={`button-view-purchase-${purchase.id}`}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
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
