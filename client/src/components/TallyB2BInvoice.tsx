import { forwardRef } from "react";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { numberToWords } from "@/lib/number-to-words";

interface InvoiceItem {
  id?: number;
  itemName: string;
  itemCode?: string;
  hsnCode?: string;
  barcode?: string;
  quantity: number;
  rate: number;
  discount?: number;
  discountPercent?: number;
  taxPercent?: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  amount: number;
}

interface InvoiceData {
  invoiceNo: string;
  date: string;
  partyName?: string;
  partyAddress?: string;
  partyCity?: string;
  partyState?: string;
  partyGstNo?: string;
  partyPhone?: string;
  shipName?: string;
  shipAddress?: string;
  shipCity?: string;
  shipState?: string;
  shipPincode?: string;
  items: InvoiceItem[];
  subtotal: number;
  totalDiscount: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  roundOff: number;
  grandTotal: number;
  isInterState?: boolean;
}

interface BillTemplate {
  formatType: string;
  logoUrl?: string | null;
  headerText?: string | null;
  footerText?: string | null;
  showTaxBreakup: boolean;
  showHsnCode: boolean;
  showItemCode: boolean;
  showPartyBalance?: boolean;
  showBankDetails?: boolean;
  showCashReturn?: boolean;
  bankDetails?: string | null;
  termsAndConditions?: string | null;
  fontSize: number;
}

interface TallyB2BInvoiceProps {
  invoice: InvoiceData;
  template: BillTemplate;
  companyName?: string;
  companyAddress?: string;
  companyGst?: string;
  companyPhone?: string;
  companyState?: string;
  companyPincode?: string;
}

export const TallyB2BInvoice = forwardRef<HTMLDivElement, TallyB2BInvoiceProps>(
  ({ invoice, template, companyName, companyAddress, companyGst, companyPhone, companyState, companyPincode }, ref) => {
    const { t } = useTranslation();
    const totalTax = invoice.totalCgst + invoice.totalSgst;
    const taxableAmount = invoice.subtotal - invoice.totalDiscount;

    // Group items by HSN for tax summary table (use empty string as key for items without HSN)
    const hsnGrouped: { [key: string]: { qty: number; amount: number; rate: number; cgst: number; sgst: number; igst: number } } = {};
    invoice.items.forEach(item => {
      const hsn = item.hsnCode || "";
      if (!hsnGrouped[hsn]) {
        hsnGrouped[hsn] = { qty: 0, amount: 0, rate: item.taxPercent || 0, cgst: 0, sgst: 0, igst: 0 };
      }
      hsnGrouped[hsn].qty += item.quantity;
      hsnGrouped[hsn].amount += item.amount;
      if (!invoice.isInterState) {
        hsnGrouped[hsn].cgst += item.cgst || 0;
        hsnGrouped[hsn].sgst += item.sgst || 0;
      } else {
        hsnGrouped[hsn].igst += item.igst || 0;
      }
    });

    return (
      <div
        ref={ref}
        className="bg-white text-black"
        style={{
          width: "210mm",
          minHeight: "297mm",
          padding: "8mm",
          fontSize: `${template.fontSize}px`,
          fontFamily: "Arial, sans-serif",
          boxSizing: "border-box",
        }}
      >
        <style>
          {`
            @media print {
              @page { size: A4 portrait; margin: 8mm; }
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              table { page-break-inside: avoid; }
            }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid black; padding: 4px; }
            th { background-color: #f0f0f0; font-weight: bold; }
          `}
        </style>

        {/* ========== HEADER ========== */}
        <div style={{ marginBottom: "8px" }}>
          <table style={{ borderCollapse: "collapse", width: "100%", border: "none" }}>
            <tr style={{ border: "none" }}>
              <td style={{ border: "none", width: "20%" }}>
                {template.logoUrl && (
                  <img
                    src={template.logoUrl}
                    alt={t("common.companyLogo")}
                    style={{ maxHeight: "50px", maxWidth: "50px", objectFit: "contain" }}
                  />
                )}
              </td>
              <td style={{ border: "none", width: "60%", textAlign: "center" }}>
                <div style={{ fontSize: "16px", fontWeight: "bold" }}>{companyName}</div>
                <div style={{ fontSize: "10px" }}>{companyAddress}</div>
              </td>
              <td style={{ border: "none", width: "20%", textAlign: "right" }}>
                <div style={{ fontSize: "14px", fontWeight: "bold" }}>{t("invoice.taxInvoice")}</div>
                <div style={{ fontSize: "10px" }}>{t("invoice.invoiceNo")}: {invoice.invoiceNo}</div>
                <div style={{ fontSize: "10px" }}>{t("invoice.date")}: {format(new Date(invoice.date), "dd-MMM-yyyy")}</div>
              </td>
            </tr>
          </table>
        </div>

        {/* ========== COMPANY & INVOICE DETAILS ========== */}
        <table style={{ marginBottom: "8px", fontSize: "9px" }}>
          <tbody>
            <tr>
              <td style={{ width: "25%" }}>
                <strong>{t("invoice.gstin")}:</strong> {companyGst || t("common.notAvailable")}
              </td>
              <td style={{ width: "25%" }}>
                <strong>{t("invoice.state")}:</strong> {companyState || t("common.notAvailable")}
              </td>
              <td style={{ width: "25%" }}>
                <strong>{t("invoice.pincode")}:</strong> {companyPincode || t("common.notAvailable")}
              </td>
              <td style={{ width: "25%" }}>
                <strong>{t("invoice.phone")}:</strong> {companyPhone || t("common.notAvailable")}
              </td>
            </tr>
          </tbody>
        </table>

        {/* ========== CONSIGNEE & BUYER DETAILS ========== */}
        <table style={{ marginBottom: "8px", fontSize: "9px" }}>
          <tbody>
            <tr>
              <td style={{ width: "50%", verticalAlign: "top" }}>
                <div style={{ marginBottom: "4px" }}>
                  <strong>{t("invoice.consignee")}:</strong>
                </div>
                <div style={{ fontWeight: "600", marginBottom: "2px" }}>
                  {invoice.shipName || invoice.partyName || t("common.notAvailable")}
                </div>
                <div style={{ fontSize: "8px" }}>
                  {invoice.shipAddress || invoice.partyAddress || t("common.notAvailable")}
                </div>
                <div style={{ fontSize: "8px" }}>
                  {invoice.shipCity || invoice.partyCity || t("common.notAvailable")}
                  {invoice.shipState && ` - ${invoice.shipState}`}
                </div>
                {invoice.shipPincode && (
                  <div style={{ fontSize: "8px" }}>
                    {t("invoice.pincode")}: {invoice.shipPincode}
                  </div>
                )}
              </td>
              <td style={{ width: "50%", verticalAlign: "top" }}>
                <div style={{ marginBottom: "4px" }}>
                  <strong>{t("invoice.buyer")}:</strong>
                </div>
                <div style={{ fontWeight: "600", marginBottom: "2px" }}>{invoice.partyName || t("common.notAvailable")}</div>
                <div style={{ fontSize: "8px" }}>{invoice.partyAddress || t("common.notAvailable")}</div>
                <div style={{ fontSize: "8px" }}>
                  {invoice.partyCity || t("common.notAvailable")}
                  {invoice.partyState && ` - ${invoice.partyState}`}
                </div>
                <div style={{ fontSize: "8px" }}>
                  <strong>{t("invoice.gstin")}:</strong> {invoice.partyGstNo || t("common.notAvailable")}
                </div>
                <div style={{ fontSize: "8px" }}>
                  <strong>{t("invoice.phone")}:</strong> {invoice.partyPhone || t("common.notAvailable")}
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* ========== ITEMS TABLE ========== */}
        <table style={{ marginBottom: "8px", fontSize: "8px" }}>
          <thead>
            <tr>
              <th style={{ width: "5%", textAlign: "center" }}>#</th>
              <th style={{ width: "25%", textAlign: "left" }}>{t("invoice.itemDescription")}</th>
              {template.showHsnCode && <th style={{ width: "8%", textAlign: "center" }}>{t("invoice.hsnSac")}</th>}
              <th style={{ width: "8%", textAlign: "right" }}>{t("invoice.qty")}</th>
              <th style={{ width: "12%", textAlign: "right" }}>{t("invoice.rate")}</th>
              <th style={{ width: "12%", textAlign: "right" }}>{t("invoice.amount")}</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, index) => (
              <tr key={item.id || index}>
                <td style={{ textAlign: "center" }}>{index + 1}</td>
                <td style={{ textAlign: "left" }}>
                  <div style={{ fontWeight: "500" }}>{item.itemName}</div>
                  {template.showItemCode && item.itemCode && (
                    <div style={{ fontSize: "7px", color: "#666" }}>{t("invoice.code")}: {item.itemCode}</div>
                  )}
                  {item.barcode && (
                    <div style={{ fontSize: "7px", color: "#666" }}>{t("invoice.barcode")}: {item.barcode}</div>
                  )}
                </td>
                {template.showHsnCode && <td style={{ textAlign: "center" }}>{item.hsnCode || t("common.notAvailable")}</td>}
                <td style={{ textAlign: "right" }}>{item.quantity}</td>
                <td style={{ textAlign: "right" }}>₹{item.rate.toFixed(2)}</td>
                <td style={{ textAlign: "right", fontWeight: "500" }}>₹{item.amount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ========== TAX SUMMARY BY HSN ========== */}
        {template.showTaxBreakup && (
          <table style={{ marginBottom: "8px", fontSize: "8px" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "center" }}>{t("invoice.hsnSac")}</th>
                <th style={{ textAlign: "right" }}>{t("invoice.taxableValue")}</th>
                <th style={{ textAlign: "center" }}>{t("invoice.taxPercent")}</th>
                {!invoice.isInterState ? (
                  <>
                    <th style={{ textAlign: "right" }}>{t("invoice.cgst")}</th>
                    <th style={{ textAlign: "right" }}>{t("invoice.sgst")}</th>
                  </>
                ) : (
                  <th style={{ textAlign: "right" }}>{t("invoice.igst")}</th>
                )}
                <th style={{ textAlign: "right" }}>{t("invoice.taxAmount")}</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(hsnGrouped).map(([hsn, data]) => (
                <tr key={hsn || "no-hsn"}>
                  <td style={{ textAlign: "center" }}>{hsn || t("common.notAvailable")}</td>
                  <td style={{ textAlign: "right" }}>₹{data.amount.toFixed(2)}</td>
                  <td style={{ textAlign: "center" }}>{data.rate}%</td>
                  {!invoice.isInterState ? (
                    <>
                      <td style={{ textAlign: "right" }}>₹{(data.cgst / 2).toFixed(2)}</td>
                      <td style={{ textAlign: "right" }}>₹{(data.sgst / 2).toFixed(2)}</td>
                    </>
                  ) : (
                    <td style={{ textAlign: "right" }}>₹{data.igst.toFixed(2)}</td>
                  )}
                  <td style={{ textAlign: "right", fontWeight: "500" }}>
                    ₹{(!invoice.isInterState ? data.cgst + data.sgst : data.igst).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* ========== TOTALS SECTION ========== */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "8px" }}>
          <div style={{ fontSize: "8px" }}>
            <div style={{ marginBottom: "2px" }}>
              <strong>{t("invoice.totalInWords")}:</strong>
            </div>
            <div style={{ fontStyle: "italic", paddingTop: "2px" }}>
              {numberToWords(invoice.grandTotal)} {t("invoice.rupeesOnly")}
            </div>
          </div>
          <table style={{ fontSize: "8px" }}>
            <tbody>
              <tr>
                <td style={{ width: "70%", textAlign: "right", fontWeight: "500" }}>{t("invoice.subtotal")}:</td>
                <td style={{ width: "30%", textAlign: "right" }}>₹{invoice.subtotal.toFixed(2)}</td>
              </tr>
              {invoice.totalDiscount > 0 && (
                <tr>
                  <td style={{ width: "70%", textAlign: "right", fontWeight: "500" }}>{t("invoice.discountAmt")}:</td>
                  <td style={{ width: "30%", textAlign: "right" }}>- ₹{invoice.totalDiscount.toFixed(2)}</td>
                </tr>
              )}
              {template.showTaxBreakup && !invoice.isInterState && (
                <>
                  <tr>
                    <td style={{ width: "70%", textAlign: "right", fontWeight: "500" }}>{t("invoice.cgst")}:</td>
                    <td style={{ width: "30%", textAlign: "right" }}>₹{invoice.totalCgst.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td style={{ width: "70%", textAlign: "right", fontWeight: "500" }}>{t("invoice.sgst")}:</td>
                    <td style={{ width: "30%", textAlign: "right" }}>₹{invoice.totalSgst.toFixed(2)}</td>
                  </tr>
                </>
              )}
              {template.showTaxBreakup && invoice.isInterState && (
                <tr>
                  <td style={{ width: "70%", textAlign: "right", fontWeight: "500" }}>{t("invoice.igst")}:</td>
                  <td style={{ width: "30%", textAlign: "right" }}>₹{invoice.totalIgst.toFixed(2)}</td>
                </tr>
              )}
              {invoice.roundOff !== 0 && (
                <tr>
                  <td style={{ width: "70%", textAlign: "right", fontWeight: "500" }}>{t("invoice.roundOff")}:</td>
                  <td style={{ width: "30%", textAlign: "right" }}>{invoice.roundOff >= 0 ? "+" : ""}₹{invoice.roundOff.toFixed(2)}</td>
                </tr>
              )}
              <tr style={{ borderTop: "2px solid black" }}>
                <td style={{ width: "70%", textAlign: "right", fontWeight: "bold", fontSize: "10px" }}>{t("invoice.grandTotal")}:</td>
                <td style={{ width: "30%", textAlign: "right", fontWeight: "bold", fontSize: "10px" }}>₹{invoice.grandTotal.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ========== DECLARATION ========== */}
        <div style={{ border: "1px solid black", padding: "6px", marginBottom: "8px", fontSize: "8px" }}>
          <div style={{ fontWeight: "bold", marginBottom: "2px" }}>{t("invoice.declaration")}:</div>
          <div>
            {t("invoice.declarationText")}
          </div>
        </div>

        {/* ========== BANK DETAILS ========== */}
        {template.showBankDetails && template.bankDetails && (
          <div style={{ border: "1px solid black", padding: "6px", marginBottom: "8px", fontSize: "8px" }}>
            <div style={{ fontWeight: "bold", marginBottom: "2px" }}>{t("invoice.bankDetails")}:</div>
            <div style={{ whiteSpace: "pre-line" }}>{template.bankDetails}</div>
          </div>
        )}

        {/* ========== TERMS & CONDITIONS ========== */}
        {template.termsAndConditions && (
          <div style={{ border: "1px solid black", padding: "6px", marginBottom: "8px", fontSize: "7px" }}>
            <div style={{ fontWeight: "bold", marginBottom: "2px" }}>{t("invoice.termsConditions")}:</div>
            <div style={{ whiteSpace: "pre-line" }}>{template.termsAndConditions}</div>
          </div>
        )}

        {/* ========== SIGNATURE SECTION ========== */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "12px", fontSize: "9px" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ borderTop: "1px solid black", paddingTop: "4px", marginTop: "30px" }}>
              <strong>{t("invoice.customerSign")}</strong>
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ borderTop: "1px solid black", paddingTop: "4px", marginTop: "30px" }}>
              <strong>{t("invoice.authorizedSign")}</strong>
            </div>
          </div>
        </div>

        {/* ========== FOOTER ========== */}
        {template.footerText && (
          <div style={{ marginTop: "12px", textAlign: "center", borderTop: "1px solid black", paddingTop: "8px", fontSize: "8px" }}>
            <div style={{ whiteSpace: "pre-line" }}>{template.footerText}</div>
          </div>
        )}
      </div>
    );
  }
);

TallyB2BInvoice.displayName = "TallyB2BInvoice";
