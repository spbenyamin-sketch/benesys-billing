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
  items: InvoiceItem[];
  subtotal: number;
  totalDiscount: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  roundOff: number;
  grandTotal: number;
  cashGiven?: number;
  cashReturn?: number;
  previousBalance?: number;
  currentBalance?: number;
  isInterState?: boolean;
  totalTax?: number;
  gstType?: number;
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

interface InvoicePrintProps {
  invoice: InvoiceData;
  template: BillTemplate;
  companyName?: string;
  companyAddress?: string;
  companyGst?: string;
  companyPhone?: string;
  companyState?: string;
  companyPincode?: string;
}

export const InvoiceA4Print = forwardRef<HTMLDivElement, InvoicePrintProps>(
  ({ invoice, template, companyName, companyAddress, companyGst, companyPhone }, ref) => {
    const { t } = useTranslation();
    const isB4 = template.formatType === "B4";
    const pageWidth = isB4 ? "250mm" : "210mm";
    const pageHeight = isB4 ? "353mm" : "297mm";
    
    return (
      <div
        ref={ref}
        className="bg-white text-black"
        style={{
          width: pageWidth,
          minHeight: pageHeight,
          padding: isB4 ? "15mm" : "10mm",
          fontSize: `${template.fontSize}px`,
          fontFamily: "Arial, sans-serif",
          boxSizing: "border-box",
        }}
      >
        <style>
          {`
            @media print {
              @page {
                size: ${isB4 ? "B4 portrait" : "A4 portrait"};
                margin: ${isB4 ? "10mm" : "8mm"};
              }
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          `}
        </style>

        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            {template.logoUrl && (
              <img
                src={template.logoUrl}
                alt={t("common.companyLogo")}
                style={{ maxHeight: "60px", marginBottom: "8px", objectFit: "contain" }}
              />
            )}
            {template.headerText ? (
              <div style={{ whiteSpace: "pre-line", fontWeight: 600, fontSize: "14px" }}>
                {template.headerText}
              </div>
            ) : (
              <>
                <div style={{ fontSize: "18px", fontWeight: 700 }}>{companyName}</div>
                {companyAddress && <div style={{ fontSize: "11px" }}>{companyAddress}</div>}
                {companyGst && <div style={{ fontSize: "11px" }}>{t("invoice.gstin")}: {companyGst}</div>}
                {companyPhone && <div style={{ fontSize: "11px" }}>{t("invoice.phone")}: {companyPhone}</div>}
              </>
            )}
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "20px", fontWeight: 700, marginBottom: "8px" }}>{t("invoice.taxInvoice")}</div>
            <div style={{ fontSize: "11px" }}>
              <div><span style={{ fontWeight: 500 }}>{t("invoice.invoiceNo")}:</span> {invoice.invoiceNo}</div>
              <div><span style={{ fontWeight: 500 }}>{t("invoice.date")}:</span> {format(new Date(invoice.date), "dd/MM/yyyy")}</div>
            </div>
          </div>
        </div>

        <div style={{ border: "1px solid black", padding: "10px", marginBottom: "10px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
            <div>
              <div style={{ fontWeight: 700, marginBottom: "4px", fontSize: "11px" }}>{t("invoice.billTo")}:</div>
              <div style={{ fontWeight: 600, fontSize: "12px" }}>{invoice.partyName || t("invoice.cashCustomer")}</div>
              {invoice.partyAddress && <div style={{ fontSize: "10px" }}>{invoice.partyAddress}</div>}
              {invoice.partyCity && <div style={{ fontSize: "10px" }}>{invoice.partyCity}{invoice.partyState ? `, ${invoice.partyState}` : ""}</div>}
              {invoice.partyGstNo && <div style={{ fontSize: "10px" }}>{t("invoice.gstin")}: {invoice.partyGstNo}</div>}
              {invoice.partyPhone && <div style={{ fontSize: "10px" }}>{t("invoice.phone")}: {invoice.partyPhone}</div>}
            </div>
            <div style={{ textAlign: "right", fontSize: "10px" }}>
              {invoice.isInterState ? (
                <div>{t("invoice.interState")}</div>
              ) : (
                <div>{t("invoice.intraState")}</div>
              )}
            </div>
          </div>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "10px", fontSize: `${Math.max(template.fontSize - 1, 8)}px` }}>
          <thead>
            <tr style={{ backgroundColor: "#f0f0f0" }}>
              <th style={{ border: "1px solid black", padding: "4px 6px", textAlign: "left", width: "30px" }}>#</th>
              <th style={{ border: "1px solid black", padding: "4px 6px", textAlign: "left" }}>{t("invoice.itemDescription")}</th>
              {template.showHsnCode && <th style={{ border: "1px solid black", padding: "4px 6px", textAlign: "left", width: "70px" }}>{t("invoice.hsn")}</th>}
              <th style={{ border: "1px solid black", padding: "4px 6px", textAlign: "right", width: "50px" }}>{t("invoice.qty")}</th>
              <th style={{ border: "1px solid black", padding: "4px 6px", textAlign: "right", width: "70px" }}>{t("invoice.rate")}</th>
              {template.showTaxBreakup && (
                <>
                  <th style={{ border: "1px solid black", padding: "4px 6px", textAlign: "right", width: "50px" }}>{t("invoice.discount")}</th>
                  <th style={{ border: "1px solid black", padding: "4px 6px", textAlign: "right", width: "50px" }}>{t("invoice.taxPercent")}</th>
                </>
              )}
              <th style={{ border: "1px solid black", padding: "4px 6px", textAlign: "right", width: "85px" }}>{t("invoice.amount")}</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, index) => (
              <tr key={item.id || index}>
                <td style={{ border: "1px solid black", padding: "3px 6px" }}>{index + 1}</td>
                <td style={{ border: "1px solid black", padding: "3px 6px" }}>
                  <div style={{ fontWeight: 500 }}>{item.itemName}</div>
                  {template.showItemCode && item.itemCode && (
                    <div style={{ fontSize: "9px", color: "#666" }}>{t("invoice.code")}: {item.itemCode}</div>
                  )}
                  {item.barcode && (
                    <div style={{ fontSize: "9px", color: "#666" }}>{t("invoice.barcode")}: {item.barcode}</div>
                  )}
                </td>
                {template.showHsnCode && (
                  <td style={{ border: "1px solid black", padding: "3px 6px" }}>{item.hsnCode}</td>
                )}
                <td style={{ border: "1px solid black", padding: "3px 6px", textAlign: "right" }}>{item.quantity}</td>
                <td style={{ border: "1px solid black", padding: "3px 6px", textAlign: "right" }}>₹{item.rate.toFixed(2)}</td>
                {template.showTaxBreakup && (
                  <>
                    <td style={{ border: "1px solid black", padding: "3px 6px", textAlign: "right" }}>{item.discountPercent || 0}%</td>
                    <td style={{ border: "1px solid black", padding: "3px 6px", textAlign: "right" }}>{item.taxPercent || 0}%</td>
                  </>
                )}
                <td style={{ border: "1px solid black", padding: "3px 6px", textAlign: "right", fontWeight: 500 }}>₹{item.amount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div style={{ flex: 1, paddingRight: "15px" }}>
            {template.showBankDetails && template.bankDetails && (
              <div style={{ marginBottom: "10px" }}>
                <div style={{ fontWeight: 700, marginBottom: "4px", fontSize: "10px" }}>{t("invoice.bankDetails")}:</div>
                <div style={{ whiteSpace: "pre-line", fontSize: "9px" }}>{template.bankDetails}</div>
              </div>
            )}
            {template.termsAndConditions && (
              <div style={{ fontSize: "8px" }}>
                <div style={{ fontWeight: 700, marginBottom: "2px" }}>{t("invoice.terms")}:</div>
                <div style={{ whiteSpace: "pre-line" }}>{template.termsAndConditions}</div>
              </div>
            )}
          </div>
          <div style={{ width: "220px", border: "1px solid black", fontSize: "11px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 8px", borderBottom: "1px solid black" }}>
              <span>{t("invoice.subtotal")}:</span>
              <span>₹{invoice.subtotal.toFixed(2)}</span>
            </div>
            {invoice.totalDiscount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 8px", borderBottom: "1px solid black" }}>
                <span>{t("invoice.discountAmt")}:</span>
                <span>- ₹{invoice.totalDiscount.toFixed(2)}</span>
              </div>
            )}
            {template.showTaxBreakup && (
              invoice.isInterState ? (
                <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 8px", borderBottom: "1px solid black" }}>
                  <span>{t("invoice.igst")}:</span>
                  <span>₹{invoice.totalIgst.toFixed(2)}</span>
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 8px", borderBottom: "1px solid black" }}>
                    <span>{t("invoice.cgst")}:</span>
                    <span>₹{invoice.totalCgst.toFixed(2)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 8px", borderBottom: "1px solid black" }}>
                    <span>{t("invoice.sgst")}:</span>
                    <span>₹{invoice.totalSgst.toFixed(2)}</span>
                  </div>
                </>
              )
            )}
            {invoice.roundOff !== 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 8px", borderBottom: "1px solid black" }}>
                <span>{t("invoice.roundOff")}:</span>
                <span>{invoice.roundOff >= 0 ? "+" : ""}₹{invoice.roundOff.toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 8px", fontWeight: 700, fontSize: "14px", backgroundColor: "#f0f0f0" }}>
              <span>{t("invoice.grandTotal")}:</span>
              <span>₹{invoice.grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {template.showPartyBalance && invoice.currentBalance !== undefined && (
          <div style={{ marginTop: "12px", border: "1px solid black", padding: "8px" }}>
            <div style={{ fontWeight: 700, marginBottom: "4px", fontSize: "10px" }}>{t("invoice.paymentDetails")}:</div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px" }}>
              <span>{t("invoice.previousBalance")}:</span>
              <span>₹{(invoice.previousBalance || 0).toFixed(2)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px" }}>
              <span>{t("invoice.grandTotal")}:</span>
              <span>₹{invoice.grandTotal.toFixed(2)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, borderTop: "1px solid black", paddingTop: "4px", marginTop: "4px", fontSize: "11px" }}>
              <span>{t("invoice.currentBalance")}:</span>
              <span>₹{invoice.currentBalance.toFixed(2)}</span>
            </div>
          </div>
        )}

        {template.footerText && (
          <div style={{ marginTop: "15px", textAlign: "center", borderTop: "1px solid black", paddingTop: "10px" }}>
            <div style={{ whiteSpace: "pre-line", fontSize: "10px" }}>{template.footerText}</div>
          </div>
        )}

        <div style={{ marginTop: "25px", display: "flex", justifyContent: "space-between" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ borderTop: "1px solid black", width: "120px", paddingTop: "4px", fontSize: "9px" }}>{t("invoice.signature")}</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ borderTop: "1px solid black", width: "120px", paddingTop: "4px", fontSize: "9px" }}>{t("invoice.authSignatory")}</div>
          </div>
        </div>
      </div>
    );
  }
);

InvoiceA4Print.displayName = "InvoiceA4Print";

export const InvoiceB4CenteredPrint = forwardRef<HTMLDivElement, InvoicePrintProps>(
  ({ invoice, template, companyName, companyAddress, companyGst, companyPhone }, ref) => {
    const { t } = useTranslation();
    return (
      <div
        ref={ref}
        className="bg-white text-black"
        style={{
          width: "210mm",
          minHeight: "297mm",
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          paddingTop: "10mm",
          boxSizing: "border-box",
        }}
      >
        <style>
          {`
            @media print {
              @page { size: A4 portrait; margin: 5mm; }
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          `}
        </style>
        <div style={{ 
          width: "190mm", 
          padding: "8mm",
          fontSize: `${template.fontSize}px`,
          fontFamily: "Arial, sans-serif",
          border: "1px solid #ccc"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
            <div>
              {template.logoUrl && (
                <img src={template.logoUrl} alt={t("common.companyLogo")} style={{ maxHeight: "50px", marginBottom: "6px" }} />
              )}
              {template.headerText ? (
                <div style={{ whiteSpace: "pre-line", fontWeight: 600, fontSize: "13px" }}>{template.headerText}</div>
              ) : (
                <>
                  <div style={{ fontSize: "16px", fontWeight: 700 }}>{companyName}</div>
                  {companyAddress && <div style={{ fontSize: "10px" }}>{companyAddress}</div>}
                  {companyGst && <div style={{ fontSize: "10px" }}>{t("invoice.gstin")}: {companyGst}</div>}
                </>
              )}
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "18px", fontWeight: 700, marginBottom: "6px" }}>{t("invoice.taxInvoice")}</div>
              <div style={{ fontSize: "10px" }}>
                <div>{t("invoice.invoiceNo")}: {invoice.invoiceNo}</div>
                <div>{t("invoice.date")}: {format(new Date(invoice.date), "dd/MM/yyyy")}</div>
              </div>
            </div>
          </div>

          <div style={{ border: "1px solid black", padding: "8px", marginBottom: "8px" }}>
            <div style={{ fontWeight: 700, fontSize: "10px", marginBottom: "3px" }}>{t("invoice.billTo")}:</div>
            <div style={{ fontSize: "11px", fontWeight: 600 }}>{invoice.partyName || t("invoice.cashCustomer")}</div>
            {invoice.partyAddress && <div style={{ fontSize: "9px" }}>{invoice.partyAddress}</div>}
            {invoice.partyGstNo && <div style={{ fontSize: "9px" }}>{t("invoice.gstin")}: {invoice.partyGstNo}</div>}
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "8px", fontSize: "9px" }}>
            <thead>
              <tr style={{ backgroundColor: "#f0f0f0" }}>
                <th style={{ border: "1px solid black", padding: "3px", textAlign: "left", width: "25px" }}>#</th>
                <th style={{ border: "1px solid black", padding: "3px", textAlign: "left" }}>{t("invoice.itemDescription")}</th>
                {template.showHsnCode && <th style={{ border: "1px solid black", padding: "3px", width: "55px" }}>{t("invoice.hsn")}</th>}
                <th style={{ border: "1px solid black", padding: "3px", textAlign: "right", width: "40px" }}>{t("invoice.qty")}</th>
                <th style={{ border: "1px solid black", padding: "3px", textAlign: "right", width: "55px" }}>{t("invoice.rate")}</th>
                <th style={{ border: "1px solid black", padding: "3px", textAlign: "right", width: "70px" }}>{t("invoice.amount")}</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, index) => (
                <tr key={item.id || index}>
                  <td style={{ border: "1px solid black", padding: "2px 3px" }}>{index + 1}</td>
                  <td style={{ border: "1px solid black", padding: "2px 3px" }}>{item.itemName}</td>
                  {template.showHsnCode && <td style={{ border: "1px solid black", padding: "2px 3px" }}>{item.hsnCode}</td>}
                  <td style={{ border: "1px solid black", padding: "2px 3px", textAlign: "right" }}>{item.quantity}</td>
                  <td style={{ border: "1px solid black", padding: "2px 3px", textAlign: "right" }}>₹{item.rate.toFixed(2)}</td>
                  <td style={{ border: "1px solid black", padding: "2px 3px", textAlign: "right", fontWeight: 500 }}>₹{item.amount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <div style={{ width: "180px", border: "1px solid black", fontSize: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 6px", borderBottom: "1px solid black" }}>
                <span>{t("invoice.subtotal")}:</span><span>₹{invoice.subtotal.toFixed(2)}</span>
              </div>
              {invoice.totalDiscount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 6px", borderBottom: "1px solid black" }}>
                  <span>{t("invoice.discountAmt")}:</span><span>- ₹{invoice.totalDiscount.toFixed(2)}</span>
                </div>
              )}
              {template.showTaxBreakup && !invoice.isInterState && (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 6px", borderBottom: "1px solid black" }}>
                    <span>{t("invoice.cgst")}:</span><span>₹{invoice.totalCgst.toFixed(2)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 6px", borderBottom: "1px solid black" }}>
                    <span>{t("invoice.sgst")}:</span><span>₹{invoice.totalSgst.toFixed(2)}</span>
                  </div>
                </>
              )}
              {invoice.roundOff !== 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 6px", borderBottom: "1px solid black" }}>
                  <span>{t("invoice.roundOff")}:</span><span>{invoice.roundOff >= 0 ? "+" : ""}₹{invoice.roundOff.toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 6px", fontWeight: 700, fontSize: "12px", backgroundColor: "#f0f0f0" }}>
                <span>{t("invoice.grandTotal")}:</span><span>₹{invoice.grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {template.footerText && (
            <div style={{ marginTop: "12px", textAlign: "center", fontSize: "9px" }}>{template.footerText}</div>
          )}

          <div style={{ marginTop: "20px", display: "flex", justifyContent: "space-between" }}>
            <div style={{ borderTop: "1px solid black", width: "100px", paddingTop: "3px", textAlign: "center", fontSize: "8px" }}>{t("invoice.signature")}</div>
            <div style={{ borderTop: "1px solid black", width: "100px", paddingTop: "3px", textAlign: "center", fontSize: "8px" }}>{t("invoice.authSignatory")}</div>
          </div>
        </div>
      </div>
    );
  }
);

InvoiceB4CenteredPrint.displayName = "InvoiceB4CenteredPrint";

export const InvoiceThermalPrint = forwardRef<HTMLDivElement, InvoicePrintProps>(
  ({ invoice, template, companyName }, ref) => {
    const { t } = useTranslation();
    const is3Inch = template.formatType === "thermal_3inch" || template.formatType === "3inch";
    const width = is3Inch ? "80mm" : "112mm";

    return (
      <div
        ref={ref}
        className="bg-white text-black p-2"
        style={{
          width,
          fontSize: `${template.fontSize}px`,
          fontFamily: "monospace",
        }}
      >
        <style>
          {`
            @media print {
              @page { size: ${width} auto; margin: 2mm; }
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          `}
        </style>
        
        {template.logoUrl && (
          <div className="text-center mb-2">
            <img
              src={template.logoUrl}
              alt={t("common.companyLogo")}
              className="mx-auto max-h-12 object-contain"
            />
          </div>
        )}

        <div className="text-center mb-2">
          {template.headerText ? (
            template.headerText.split("\n").map((line, i) => (
              <div key={i} className={i === 0 ? "font-bold text-lg" : ""}>{line}</div>
            ))
          ) : (
            <div className="font-bold">{companyName}</div>
          )}
        </div>

        <div className="border-t border-dashed border-black my-2" />

        <div className="text-xs space-y-0.5">
          <div className="flex justify-between">
            <span>{t("invoice.invoiceNo")}:</span>
            <span className="font-bold">{invoice.invoiceNo}</span>
          </div>
          <div className="flex justify-between">
            <span>{t("invoice.date")}:</span>
            <span>{format(new Date(invoice.date), "dd/MM/yyyy HH:mm")}</span>
          </div>
          {invoice.partyName && (
            <div className="flex justify-between">
              <span>{t("invoice.billTo")}:</span>
              <span className="text-right max-w-[60%] truncate">{invoice.partyName}</span>
            </div>
          )}
        </div>

        <div className="border-t border-dashed border-black my-2" />

        <div className="text-xs">
          <div className="flex justify-between font-bold mb-1">
            <span>{t("invoice.particulars")}</span>
            <span>{t("invoice.amount")}</span>
          </div>
          {invoice.items.map((item, index) => (
            <div key={item.id || index} className="mb-1">
              <div className="flex justify-between">
                <span className="max-w-[65%] truncate">{item.itemName}</span>
                <span className="font-medium">₹{item.amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs opacity-75">
                <span>{item.quantity} x ₹{item.rate.toFixed(2)}</span>
                {item.discountPercent && item.discountPercent > 0 && (
                  <span>{t("invoice.discount")}: {item.discountPercent}%</span>
                )}
              </div>
              {template.showHsnCode && item.hsnCode && (
                <div className="text-xs opacity-60">{t("invoice.hsn")}: {item.hsnCode}</div>
              )}
            </div>
          ))}
        </div>

        <div className="border-t border-dashed border-black my-2" />

        <div className="text-xs space-y-0.5">
          <div className="flex justify-between">
            <span>{t("invoice.qty")}: {invoice.items.reduce((sum, i) => sum + i.quantity, 0)}</span>
          </div>
          <div className="flex justify-between">
            <span>{t("invoice.subtotal")}:</span>
            <span>₹{invoice.subtotal.toFixed(2)}</span>
          </div>
          {invoice.totalDiscount > 0 && (
            <div className="flex justify-between">
              <span>{t("invoice.discountAmt")}:</span>
              <span>- ₹{invoice.totalDiscount.toFixed(2)}</span>
            </div>
          )}
          {template.showTaxBreakup && (
            invoice.isInterState ? (
              <div className="flex justify-between">
                <span>{t("invoice.igst")}:</span>
                <span>₹{invoice.totalIgst.toFixed(2)}</span>
              </div>
            ) : (
              <>
                <div className="flex justify-between">
                  <span>{t("invoice.cgst")}:</span>
                  <span>₹{invoice.totalCgst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t("invoice.sgst")}:</span>
                  <span>₹{invoice.totalSgst.toFixed(2)}</span>
                </div>
              </>
            )
          )}
          {invoice.roundOff !== 0 && (
            <div className="flex justify-between">
              <span>{t("invoice.roundOff")}:</span>
              <span>{invoice.roundOff >= 0 ? "+" : ""}₹{invoice.roundOff.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-base border-t border-black pt-1">
            <span>{t("invoice.grandTotal")}:</span>
            <span>₹{invoice.grandTotal.toFixed(2)}</span>
          </div>
        </div>

        {template.showCashReturn && invoice.cashGiven !== undefined && invoice.cashGiven > 0 && (
          <>
            <div className="border-t border-dashed border-black my-2" />
            <div className="text-xs space-y-0.5">
              <div className="flex justify-between">
                <span>{t("invoice.cashGiven")}:</span>
                <span>₹{invoice.cashGiven.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>{t("invoice.cashReturn")}:</span>
                <span>₹{(invoice.cashReturn || 0).toFixed(2)}</span>
              </div>
            </div>
          </>
        )}

        <div className="border-t border-dashed border-black my-2" />

        <div className="text-center text-xs">
          {template.footerText ? (
            template.footerText.split("\n").map((line, i) => (
              <div key={i}>{line}</div>
            ))
          ) : (
            <>
              <div>{t("invoice.thankYou")}</div>
            </>
          )}
        </div>
      </div>
    );
  }
);

InvoiceThermalPrint.displayName = "InvoiceThermalPrint";
