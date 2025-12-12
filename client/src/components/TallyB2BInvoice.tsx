import { forwardRef } from "react";
import { format } from "date-fns";
import { numberToWords } from "@/lib/number-to-words";
import { translateToTamil } from "@/lib/tamil-translator";

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
  billType?: string;
  saleType?: string;
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
  enableTamilPrint?: boolean;
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
  enableTamilPrint?: boolean;
}

export const TallyB2BInvoice = forwardRef<HTMLDivElement, TallyB2BInvoiceProps>(
  ({ invoice, template, companyName, companyAddress, companyGst, companyPhone, companyState, companyPincode, enableTamilPrint }, ref) => {
    const totalTax = invoice.totalCgst + invoice.totalSgst;
    const taxableAmount = invoice.subtotal - invoice.totalDiscount;

    // Group items by HSN for tax summary table
    const hsnGrouped: { [key: string]: { qty: number; amount: number; rate: number; cgst: number; sgst: number; igst: number } } = {};
    invoice.items.forEach(item => {
      const hsn = item.hsnCode || "N/A";
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
                    alt="Company Logo"
                    style={{ maxHeight: "50px", maxWidth: "50px", objectFit: "contain" }}
                  />
                )}
              </td>
              <td style={{ border: "none", width: "60%", textAlign: "center" }}>
                <div style={{ fontSize: "16px", fontWeight: "bold" }}>{companyName}</div>
                <div style={{ fontSize: "10px" }}>{companyAddress}</div>
              </td>
              <td style={{ border: "none", width: "20%", textAlign: "right" }}>
                <div style={{ fontSize: "14px", fontWeight: "bold" }}>{translateToTamil("INVOICE", enableTamilPrint)}</div>
                <div style={{ fontSize: "10px" }}>No.: {invoice.invoiceNo}</div>
                <div style={{ fontSize: "10px" }}>{translateToTamil("Date", enableTamilPrint)}: {format(new Date(invoice.date), "dd-MMM-yyyy")}</div>
              </td>
            </tr>
          </table>
        </div>

        {/* ========== COMPANY & INVOICE DETAILS ========== */}
        <table style={{ marginBottom: "8px", fontSize: "9px" }}>
          <tbody>
            <tr>
              <td style={{ width: "25%" }}>
                <strong>{translateToTamil("GST", enableTamilPrint)}/UIN:</strong> {companyGst || "N/A"}
              </td>
              <td style={{ width: "25%" }}>
                <strong>State:</strong> {companyState || "N/A"}
              </td>
              <td style={{ width: "25%" }}>
                <strong>Pin Code:</strong> {companyPincode || "N/A"}
              </td>
              <td style={{ width: "25%" }}>
                <strong>Phone:</strong> {companyPhone || "N/A"}
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
                  <strong>{translateToTamil("Bill To", enableTamilPrint)} (Ship to):</strong>
                </div>
                <div style={{ fontWeight: "600", marginBottom: "2px" }}>
                  {invoice.shipName || invoice.partyName || "N/A"}
                </div>
                <div style={{ fontSize: "8px" }}>
                  {invoice.shipAddress || invoice.partyAddress || "N/A"}
                </div>
                <div style={{ fontSize: "8px" }}>
                  {invoice.shipCity || invoice.partyCity || "N/A"}
                  {invoice.shipState && ` - ${invoice.shipState}`}
                </div>
                {invoice.shipPincode && (
                  <div style={{ fontSize: "8px" }}>
                    Pin: {invoice.shipPincode}
                  </div>
                )}
              </td>
              <td style={{ width: "50%", verticalAlign: "top" }}>
                <div style={{ marginBottom: "4px" }}>
                  <strong>{translateToTamil("Buyer (Bill to)", enableTamilPrint)}:</strong>
                </div>
                <div style={{ fontWeight: "600", marginBottom: "2px" }}>{invoice.partyName || "N/A"}</div>
                <div style={{ fontSize: "8px" }}>{invoice.partyAddress || "N/A"}</div>
                <div style={{ fontSize: "8px" }}>
                  {invoice.partyCity || "N/A"}
                  {invoice.partyState && ` - ${invoice.partyState}`}
                </div>
                <div style={{ fontSize: "8px" }}>
                  <strong>{translateToTamil("GSTIN/UIN", enableTamilPrint)}:</strong> {invoice.partyGstNo || "N/A"}
                </div>
                <div style={{ fontSize: "8px" }}>
                  <strong>{translateToTamil("Phone", enableTamilPrint)}:</strong> {invoice.partyPhone || "N/A"}
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
              <th style={{ width: "25%", textAlign: "left" }}>{translateToTamil("Description of Goods", enableTamilPrint)}</th>
              {template.showHsnCode && <th style={{ width: "8%", textAlign: "center" }}>{translateToTamil("HSN/SAC", enableTamilPrint)}</th>}
              <th style={{ width: "8%", textAlign: "right" }}>{translateToTamil("Quantity", enableTamilPrint)}</th>
              <th style={{ width: "12%", textAlign: "right" }}>{translateToTamil("Rate", enableTamilPrint)}</th>
              <th style={{ width: "12%", textAlign: "right" }}>{translateToTamil("Amount", enableTamilPrint)}</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, index) => (
              <tr key={item.id || index}>
                <td style={{ textAlign: "center" }}>{index + 1}</td>
                <td style={{ textAlign: "left" }}>
                  <div style={{ fontWeight: "500" }}>{item.itemName}</div>
                  {template.showItemCode && item.itemCode && (
                    <div style={{ fontSize: "7px", color: "#666" }}>Code: {item.itemCode}</div>
                  )}
                  {item.barcode && (
                    <div style={{ fontSize: "7px", color: "#666" }}>Barcode: {item.barcode}</div>
                  )}
                </td>
                {template.showHsnCode && <td style={{ textAlign: "center" }}>{item.hsnCode || "N/A"}</td>}
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
                <th style={{ textAlign: "center" }}>{translateToTamil("HSN/SAC", enableTamilPrint)}</th>
                <th style={{ textAlign: "right" }}>{translateToTamil("Taxable Value", enableTamilPrint)}</th>
                <th style={{ textAlign: "center" }}>{translateToTamil("Tax Rate", enableTamilPrint)} %</th>
                {!invoice.isInterState ? (
                  <>
                    <th style={{ textAlign: "right" }}>CGST %</th>
                    <th style={{ textAlign: "right" }}>SGST %</th>
                  </>
                ) : (
                  <th style={{ textAlign: "right" }}>IGST %</th>
                )}
                <th style={{ textAlign: "right" }}>{translateToTamil("Tax Amount", enableTamilPrint)}</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(hsnGrouped).map(([hsn, data]) => (
                <tr key={hsn}>
                  <td style={{ textAlign: "center" }}>{hsn}</td>
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
              <strong>{translateToTamil("Amount Chargeable (in words)", enableTamilPrint)}:</strong>
            </div>
            <div style={{ fontStyle: "italic", paddingTop: "2px" }}>
              {numberToWords(invoice.grandTotal)} Rupees Only
            </div>
          </div>
          <table style={{ fontSize: "8px" }}>
            <tbody>
              <tr>
                <td style={{ width: "70%", textAlign: "right", fontWeight: "500" }}>{translateToTamil("Subtotal", enableTamilPrint)}:</td>
                <td style={{ width: "30%", textAlign: "right" }}>₹{invoice.subtotal.toFixed(2)}</td>
              </tr>
              {invoice.totalDiscount > 0 && (
                <tr>
                  <td style={{ width: "70%", textAlign: "right", fontWeight: "500" }}>{translateToTamil("Discount", enableTamilPrint)}:</td>
                  <td style={{ width: "30%", textAlign: "right" }}>- ₹{invoice.totalDiscount.toFixed(2)}</td>
                </tr>
              )}
              {template.showTaxBreakup && !invoice.isInterState && (
                <>
                  <tr>
                    <td style={{ width: "70%", textAlign: "right", fontWeight: "500" }}>CGST:</td>
                    <td style={{ width: "30%", textAlign: "right" }}>₹{invoice.totalCgst.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td style={{ width: "70%", textAlign: "right", fontWeight: "500" }}>SGST:</td>
                    <td style={{ width: "30%", textAlign: "right" }}>₹{invoice.totalSgst.toFixed(2)}</td>
                  </tr>
                </>
              )}
              {template.showTaxBreakup && invoice.isInterState && (
                <tr>
                  <td style={{ width: "70%", textAlign: "right", fontWeight: "500" }}>IGST:</td>
                  <td style={{ width: "30%", textAlign: "right" }}>₹{invoice.totalIgst.toFixed(2)}</td>
                </tr>
              )}
              {invoice.roundOff !== 0 && (
                <tr>
                  <td style={{ width: "70%", textAlign: "right", fontWeight: "500" }}>{translateToTamil("Round Off", enableTamilPrint)}:</td>
                  <td style={{ width: "30%", textAlign: "right" }}>{invoice.roundOff >= 0 ? "+" : ""}₹{invoice.roundOff.toFixed(2)}</td>
                </tr>
              )}
              <tr style={{ borderTop: "2px solid black" }}>
                <td style={{ width: "70%", textAlign: "right", fontWeight: "bold", fontSize: "10px" }}>{translateToTamil("TOTAL", enableTamilPrint)}:</td>
                <td style={{ width: "30%", textAlign: "right", fontWeight: "bold", fontSize: "10px" }}>₹{invoice.grandTotal.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ========== DECLARATION ========== */}
        <div style={{ border: "1px solid black", padding: "6px", marginBottom: "8px", fontSize: "8px" }}>
          <div style={{ fontWeight: "bold", marginBottom: "2px" }}>{translateToTamil("Declaration", enableTamilPrint)}:</div>
          <div>
            We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.
          </div>
        </div>

        {/* ========== BANK DETAILS ========== */}
        {template.showBankDetails && template.bankDetails && (
          <div style={{ border: "1px solid black", padding: "6px", marginBottom: "8px", fontSize: "8px" }}>
            <div style={{ fontWeight: "bold", marginBottom: "2px" }}>{translateToTamil("Bank Details", enableTamilPrint)}:</div>
            <div style={{ whiteSpace: "pre-line" }}>{template.bankDetails}</div>
          </div>
        )}

        {/* ========== TERMS & CONDITIONS ========== */}
        {template.termsAndConditions && (
          <div style={{ border: "1px solid black", padding: "6px", marginBottom: "8px", fontSize: "7px" }}>
            <div style={{ fontWeight: "bold", marginBottom: "2px" }}>{translateToTamil("Terms & Conditions", enableTamilPrint)}:</div>
            <div style={{ whiteSpace: "pre-line" }}>{template.termsAndConditions}</div>
          </div>
        )}

        {/* ========== SIGNATURE SECTION ========== */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "12px", fontSize: "9px" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ borderTop: "1px solid black", paddingTop: "4px", marginTop: "30px" }}>
              <strong>Customer's Seal and Signature</strong>
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ borderTop: "1px solid black", paddingTop: "4px", marginTop: "30px" }}>
              <strong>Authorised Signatory</strong>
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
