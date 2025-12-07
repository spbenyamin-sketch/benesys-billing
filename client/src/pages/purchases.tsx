import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  const { data: purchases, isLoading } = useQuery<any[]>({
    queryKey: ["/api/purchases"],
  });

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t('purchases.title')}</h1>
            <p className="text-muted-foreground">{t('purchases.subtitle')}</p>
          </div>
          <Link href="/purchases/new">
            <Button data-testid="button-new-purchase">
              <Plus className="mr-2 h-4 w-4" />
              {t('purchases.newPurchase')}
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('purchases.purchaseHistory')}</CardTitle>
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
                <p className="text-muted-foreground mb-4">{t('purchases.noPurchasesFound')}</p>
                <Link href="/purchases/new">
                  <Button data-testid="button-create-first-purchase">
                    <Plus className="mr-2 h-4 w-4" />
                    {t('purchases.createFirstPurchase')}
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('common.date')}</TableHead>
                      <TableHead>{t('purchases.invoiceNo')}</TableHead>
                      <TableHead>{t('purchases.party')}</TableHead>
                      <TableHead>{t('common.city')}</TableHead>
                      <TableHead className="text-right">{t('common.quantity')}</TableHead>
                      <TableHead className="text-right">{t('purchases.billAmount')}</TableHead>
                      <TableHead className="text-right">{t('common.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchases.map((purchase) => (
                      <TableRow key={purchase.id} data-testid={`row-purchase-${purchase.id}`}>
                        <TableCell>{new Date(purchase.date).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium">{purchase.invoiceNo}</TableCell>
                        <TableCell>{purchase.partyName || t('payments.cash')}</TableCell>
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
