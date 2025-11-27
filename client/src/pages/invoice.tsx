import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Printer, ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { format } from "date-fns";

interface SaleItem {
  id: number;
  itemCode: string;
  itemName: string;
  hsnCode: string | null;
  quantity: string;
  rate: string;
  discount: string | null;
  discountPercent: string | null;
  amount: string;
  tax: string | null;
  cgst: string | null;
  sgst: string | null;
}

interface Sale {
  id: number;
  invoiceNo: number;
  billType: string;
  saleType: string | null;
  paymentMode: string | null;
  date: string;
  partyName: string | null;
  partyCity: string | null;
  partyAddress: string | null;
  partyGstNo: string | null;
  mobile: string | null;
  gstType: number;
  saleValue: string;
  discountTotal: string | null;
  taxValue: string | null;
  cgstTotal: string | null;
  sgstTotal: string | null;
  roundOff: string | null;
  grandTotal: string;
  totalQty: string;
  amountGiven: string | null;
  amountReturn: string | null;
  byCash: string | null;
  byCard: string | null;
  printOutstanding: boolean | null;
  partyOutstanding: string | null;
}

export default function Invoice() {
  const params = useParams();
  const saleId = params.id;
  const [hasPrinted, setHasPrinted] = useState(false);

  const { data: sale, isLoading: saleLoading } = useQuery<Sale>({
    queryKey: ["/api/sales", saleId],
  });

  const { data: items, isLoading: itemsLoading } = useQuery<SaleItem[]>({
    queryKey: ["/api/sales", saleId, "items"],
  });

  const handlePrint = () => {
    window.print();
  };

  const isLoading = saleLoading || itemsLoading;

  useEffect(() => {
    if (sale && items && !hasPrinted && !isLoading) {
      setHasPrinted(true);
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [sale, items, hasPrinted, isLoading]);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Invoice not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getBillTypeLabel = () => {
    if (sale.billType === "EST") return "ESTIMATE / QUOTATION";
    if (sale.saleType === "B2B") return "TAX INVOICE (B2B)";
    if (sale.saleType === "B2C") return "RETAIL INVOICE (B2C)";
    return sale.billType === "GST" ? "TAX INVOICE" : "INVOICE";
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6 print:hidden">
        <Button variant="outline" asChild>
          <Link href="/sales">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Sales
          </Link>
        </Button>
        <Button onClick={handlePrint} data-testid="button-print">
          <Printer className="mr-2 h-4 w-4" />
          Print Invoice
        </Button>
      </div>

      <Card className="max-w-4xl mx-auto print:shadow-none print:border-none">
        <CardHeader className="border-b pb-4">
          <div className="text-center">
            <h1 className="text-xl font-bold">{getBillTypeLabel()}</h1>
            <div className="mt-2 font-mono text-lg">
              {sale.billType}-{sale.invoiceNo}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Bill To:</p>
              <p className="font-medium">{sale.partyName || "Cash Customer"}</p>
              {sale.partyCity && <p className="text-sm">{sale.partyCity}</p>}
              {sale.partyAddress && <p className="text-sm">{sale.partyAddress}</p>}
              {sale.partyGstNo && (
                <p className="text-sm font-mono">GST: {sale.partyGstNo}</p>
              )}
              {sale.mobile && <p className="text-sm">Mobile: {sale.mobile}</p>}
            </div>
            <div className="text-right space-y-1">
              <p className="text-sm text-muted-foreground">Date:</p>
              <p className="font-medium">{format(new Date(sale.date), "dd MMM yyyy")}</p>
              {sale.paymentMode && (
                <>
                  <p className="text-sm text-muted-foreground mt-2">Payment:</p>
                  <p className="font-medium">{sale.paymentMode}</p>
                </>
              )}
            </div>
          </div>

          <div className="border rounded-md overflow-hidden mb-6">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[50px]">#</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead className="w-[80px]">HSN</TableHead>
                  <TableHead className="text-right w-[80px]">Qty</TableHead>
                  <TableHead className="text-right w-[100px]">Rate</TableHead>
                  {sale.billType !== "EST" && (
                    <TableHead className="text-right w-[80px]">Tax%</TableHead>
                  )}
                  <TableHead className="text-right w-[100px]">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items?.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      <div className="font-medium">{item.itemName}</div>
                      <div className="text-xs text-muted-foreground">{item.itemCode}</div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{item.hsnCode}</TableCell>
                    <TableCell className="text-right">{parseFloat(item.quantity).toFixed(3)}</TableCell>
                    <TableCell className="text-right">₹{parseFloat(item.rate).toFixed(2)}</TableCell>
                    {sale.billType !== "EST" && (
                      <TableCell className="text-right">{item.tax || 0}%</TableCell>
                    )}
                    <TableCell className="text-right font-medium">₹{parseFloat(item.amount).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-end">
            <div className="w-72 space-y-2">
              <div className="flex justify-between">
                <span>Total Qty:</span>
                <span>{parseFloat(sale.totalQty).toFixed(3)}</span>
              </div>
              <div className="flex justify-between">
                <span>Sub Total:</span>
                <span>₹{parseFloat(sale.saleValue).toFixed(2)}</span>
              </div>
              {sale.discountTotal && parseFloat(sale.discountTotal) > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount:</span>
                  <span>-₹{parseFloat(sale.discountTotal).toFixed(2)}</span>
                </div>
              )}
              {sale.billType === "GST" && sale.cgstTotal && parseFloat(sale.cgstTotal) > 0 && (
                <>
                  <div className="flex justify-between">
                    <span>CGST:</span>
                    <span>₹{parseFloat(sale.cgstTotal).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SGST:</span>
                    <span>₹{parseFloat(sale.sgstTotal || "0").toFixed(2)}</span>
                  </div>
                </>
              )}
              {sale.roundOff && parseFloat(sale.roundOff) !== 0 && (
                <div className="flex justify-between">
                  <span>Round Off:</span>
                  <span>₹{parseFloat(sale.roundOff).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Grand Total:</span>
                <span>₹{parseFloat(sale.grandTotal).toFixed(0)}</span>
              </div>
            </div>
          </div>

          {(sale.saleType === "B2C" || sale.billType === "EST") && (
            <div className="mt-6 pt-4 border-t">
              <div className="flex justify-end">
                <div className="w-72 space-y-2">
                  {sale.byCash && parseFloat(sale.byCash) > 0 && (
                    <div className="flex justify-between">
                      <span>Cash:</span>
                      <span>₹{parseFloat(sale.byCash).toFixed(0)}</span>
                    </div>
                  )}
                  {sale.byCard && parseFloat(sale.byCard) > 0 && (
                    <div className="flex justify-between">
                      <span>Card:</span>
                      <span>₹{parseFloat(sale.byCard).toFixed(0)}</span>
                    </div>
                  )}
                  {sale.amountGiven && parseFloat(sale.amountGiven) > 0 && (
                    <div className="flex justify-between">
                      <span>Received:</span>
                      <span>₹{parseFloat(sale.amountGiven).toFixed(0)}</span>
                    </div>
                  )}
                  {sale.amountReturn && parseFloat(sale.amountReturn) > 0 && (
                    <div className="flex justify-between text-lg font-bold bg-green-50 dark:bg-green-900/20 p-2 rounded">
                      <span>Return:</span>
                      <span>₹{parseFloat(sale.amountReturn).toFixed(0)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {sale.printOutstanding && sale.partyOutstanding && parseFloat(sale.partyOutstanding) > 0 && (
            <div className="mt-6 pt-4 border-t">
              <div className="flex justify-end">
                <div className="w-72 p-3 bg-amber-50 dark:bg-amber-900/20 rounded border border-amber-200 dark:border-amber-800">
                  <div className="flex justify-between text-amber-700 dark:text-amber-300 font-medium">
                    <span>Outstanding Balance:</span>
                    <span>₹{parseFloat(sale.partyOutstanding).toFixed(0)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:hidden {
            display: none !important;
          }
          .max-w-4xl,
          .max-w-4xl * {
            visibility: visible;
          }
          .max-w-4xl {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
