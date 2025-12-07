import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useSearch } from "wouter";
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
import { Printer, ArrowLeft, Edit, Globe } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { format } from "date-fns";
import { useReactToPrint } from "react-to-print";
import { InvoiceA4Print, InvoiceThermalPrint } from "@/components/InvoicePrint";
import { TallyB2BInvoice } from "@/components/TallyB2BInvoice";
import { usePrintSettings } from "@/hooks/use-print-settings";
import { useCompany } from "@/contexts/CompanyContext";
import { Checkbox } from "@/components/ui/checkbox";

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
  barcode?: string | null;
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

interface BillTemplate {
  id: number;
  name: string;
  formatType: string;
  assignedTo: string | null;
  headerText: string | null;
  footerText: string | null;
  showTaxBreakup: boolean;
  showHsnCode: boolean;
  showItemCode: boolean;
  showPartyBalance: boolean;
  showBankDetails: boolean;
  showCashReturn: boolean;
  enableTamilPrint: boolean;
  bankDetails: string | null;
  termsAndConditions: string | null;
  fontSize: number;
  logoUrl: string | null;
  isDefault: boolean;
}

export default function Invoice() {
  const params = useParams();
  const searchString = useSearch();
  const saleId = params.id;
  const [hasPrinted, setHasPrinted] = useState(false);
  const [templateReady, setTemplateReady] = useState(false);
  const [enableTamilPrint, setEnableTamilPrint] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const { shouldAutoPrint } = usePrintSettings();
  const { currentCompany } = useCompany();
  
  const searchParams = new URLSearchParams(searchString);
  const autoPrintRequested = searchParams.get("print") === "auto";

  const { data: sale, isLoading: saleLoading } = useQuery<Sale>({
    queryKey: ["/api/sales", saleId],
  });

  const { data: items, isLoading: itemsLoading } = useQuery<SaleItem[]>({
    queryKey: ["/api/sales", saleId, "items"],
  });

  const { data: party, isLoading: partyLoading } = useQuery<any>({
    queryKey: ["/api/parties", sale?.partyId],
    enabled: !!sale?.partyId,
  });

  const getAssignmentType = useCallback((saleData: Sale | undefined): string => {
    if (!saleData) return "b2c";
    if (saleData.billType === "EST") return "estimate";
    if (saleData.billType === "CN" || saleData.saleType === "CREDIT_NOTE") return "credit_note";
    if (saleData.saleType === "B2B") return "b2b";
    return "b2c";
  }, []);

  const assignmentType = getAssignmentType(sale);

  const { data: template, isLoading: templateLoading } = useQuery<BillTemplate | null>({
    queryKey: ["/api/bill-templates/assigned", assignmentType],
    enabled: !!sale,
  });

  useEffect(() => {
    if (sale && !templateLoading && template !== undefined) {
      setTemplateReady(true);
    }
  }, [sale, template, templateLoading]);

  const getPageStyle = useCallback((format: string) => {
    if (format === "B4") {
      return `
        @page { size: B4 portrait; margin: 10mm; }
        @media print {
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `;
    } else if (format.includes("thermal") || format.includes("inch")) {
      const width = format === "thermal_3inch" || format === "3inch" ? "80mm" : "112mm";
      return `
        @page { size: ${width} auto; margin: 2mm; }
        @media print {
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `;
    }
    
    return `
      @page { size: A4 portrait; margin: 8mm; }
      @media print {
        body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      }
    `;
  }, []);

  const currentFormat = template?.formatType || "A4";

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Invoice-${sale?.billType}-${sale?.invoiceNo}`,
    onAfterPrint: () => {
      console.log("Print completed");
    },
    pageStyle: getPageStyle(currentFormat),
  });

  const isLoading = saleLoading || itemsLoading || !templateReady;

  useEffect(() => {
    if (sale && items && templateReady && !hasPrinted && !saleLoading && !itemsLoading) {
      const billType = sale.billType === "EST" ? "EST" : 
                       sale.billType === "CN" ? "CN" : 
                       sale.saleType || "B2C";
      
      const shouldPrint = autoPrintRequested || shouldAutoPrint(billType);
      
      if (shouldPrint) {
        setHasPrinted(true);
        setTimeout(() => {
          handlePrint();
        }, 800);
      }
    }
  }, [sale, items, templateReady, hasPrinted, saleLoading, itemsLoading, handlePrint, autoPrintRequested, shouldAutoPrint]);

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

  const prepareInvoiceData = () => {
    const invoiceItems = items?.map(item => ({
      id: item.id,
      itemName: item.itemName,
      itemCode: item.itemCode,
      hsnCode: item.hsnCode || undefined,
      barcode: item.barcode || undefined,
      quantity: parseFloat(item.quantity),
      rate: parseFloat(item.rate),
      discount: item.discount ? parseFloat(item.discount) : 0,
      discountPercent: item.discountPercent ? parseFloat(item.discountPercent) : 0,
      taxPercent: item.tax ? parseFloat(item.tax) : 0,
      cgst: item.cgst ? parseFloat(item.cgst) : 0,
      sgst: item.sgst ? parseFloat(item.sgst) : 0,
      amount: parseFloat(item.amount),
    })) || [];

    return {
      invoiceNo: `${sale.billType}-${sale.invoiceNo}`,
      date: sale.date,
      partyName: sale.partyName || undefined,
      partyAddress: sale.partyAddress || undefined,
      partyCity: sale.partyCity || undefined,
      partyGstNo: sale.partyGstNo || undefined,
      partyPhone: sale.mobile || undefined,
      shipName: party?.shipName || sale.partyName || undefined,
      shipAddress: party?.shipAddress || sale.partyAddress || undefined,
      shipCity: party?.shipCity || sale.partyCity || undefined,
      shipState: party?.shipState || undefined,
      shipPincode: party?.shipPincode || undefined,
      items: invoiceItems,
      subtotal: parseFloat(sale.saleValue),
      totalDiscount: sale.discountTotal ? parseFloat(sale.discountTotal) : 0,
      totalCgst: sale.cgstTotal ? parseFloat(sale.cgstTotal) : 0,
      totalSgst: sale.sgstTotal ? parseFloat(sale.sgstTotal) : 0,
      totalIgst: sale.taxValue ? parseFloat(sale.taxValue) : 0,
      roundOff: sale.roundOff ? parseFloat(sale.roundOff) : 0,
      grandTotal: parseFloat(sale.grandTotal),
      cashGiven: sale.amountGiven ? parseFloat(sale.amountGiven) : 0,
      cashReturn: sale.amountReturn ? parseFloat(sale.amountReturn) : 0,
      previousBalance: sale.partyOutstanding ? parseFloat(sale.partyOutstanding) : undefined,
      currentBalance: sale.partyOutstanding ? parseFloat(sale.partyOutstanding) + parseFloat(sale.grandTotal) : undefined,
      isInterState: sale.gstType === 1,
    };
  };

  const defaultTemplate: BillTemplate = {
    id: 0,
    name: "Default",
    formatType: "A4",
    assignedTo: null,
    headerText: null,
    footerText: "Thank you for your business!",
    showTaxBreakup: true,
    showHsnCode: true,
    showItemCode: true,
    showPartyBalance: false,
    showBankDetails: false,
    showCashReturn: true,
    bankDetails: null,
    termsAndConditions: null,
    fontSize: 12,
    logoUrl: null,
    isDefault: true,
  };

  const activeTemplate = template || defaultTemplate;
  const isThermal = activeTemplate.formatType.includes("thermal") || activeTemplate.formatType.includes("inch");
  const isB2B = sale?.saleType === "B2B";
  const isTallyTemplate = activeTemplate.assignedTo === "b2b" && isB2B;
  
  // Use template's Tamil setting or local override
  const isTamilEnabled = enableTamilPrint || activeTemplate.enableTamilPrint;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6 print:hidden gap-4">
        <Button variant="outline" asChild>
          <Link href="/sales">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Sales
          </Link>
        </Button>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 border rounded-md px-3 py-2">
            <Checkbox 
              id="tamil-print" 
              checked={enableTamilPrint}
              onCheckedChange={(checked) => setEnableTamilPrint(checked as boolean)}
              data-testid="checkbox-tamil-print"
            />
            <label htmlFor="tamil-print" className="flex items-center gap-2 cursor-pointer text-sm font-medium">
              <Globe className="h-4 w-4" />
              தமிழ் (Tamil)
            </label>
          </div>
          <Button onClick={() => handlePrint()} data-testid="button-print">
            <Printer className="mr-2 h-4 w-4" />
            Print Invoice
          </Button>
        </div>
      </div>

      <div style={{ position: 'absolute', left: '-9999px', top: '0' }}>
        {isTallyTemplate ? (
          <TallyB2BInvoice
            ref={printRef}
            invoice={prepareInvoiceData()}
            template={activeTemplate}
            companyName={currentCompany?.name}
            companyAddress={currentCompany?.address}
            companyGst={currentCompany?.gstNo}
            companyPhone={currentCompany?.phone}
            companyState={currentCompany?.state}
            companyPincode={currentCompany?.city}
            enableTamilPrint={isTamilEnabled}
          />
        ) : isThermal ? (
          <InvoiceThermalPrint
            ref={printRef}
            invoice={prepareInvoiceData()}
            template={activeTemplate}
            companyName={currentCompany?.name || "Your Company Name"}
            enableTamilPrint={isTamilEnabled}
          />
        ) : (
          <InvoiceA4Print
            ref={printRef}
            invoice={prepareInvoiceData()}
            template={activeTemplate}
            companyName={currentCompany?.name || "Your Company Name"}
            companyAddress={currentCompany?.address}
            companyGst={currentCompany?.gstNo}
            companyPhone={currentCompany?.phone}
            enableTamilPrint={isTamilEnabled}
          />
        )}
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
                  {items?.some(i => i.barcode) && <TableHead className="w-[120px]">Barcode</TableHead>}
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
                    {items?.some(i => i.barcode) && (
                      <TableCell className="font-mono text-sm text-blue-600" data-testid={`text-barcode-${item.id}`}>
                        {item.barcode || "-"}
                      </TableCell>
                    )}
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

    </div>
  );
}
