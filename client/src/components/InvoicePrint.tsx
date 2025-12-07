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
  enableTamilPrint?: boolean;
}

export const InvoiceA4Print = forwardRef<HTMLDivElement, InvoicePrintProps>(
  ({ invoice, template, companyName, companyAddress, companyGst, companyPhone, enableTamilPrint }, ref) => {
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
                alt="Company Logo"
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
                {companyGst && <div style={{ fontSize: "11px" }}>GSTIN: {companyGst}</div>}
                {companyPhone && <div style={{ fontSize: "11px" }}>Phone: {companyPhone}</div>}
              </>
            )}
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "20px", fontWeight: 700, marginBottom: "8px" }}>TAX INVOICE</div>
            <div style={{ fontSize: "11px" }}>
              <div><span style={{ fontWeight: 500 }}>Invoice No:</span> {invoice.invoiceNo}</div>
              <div><span style={{ fontWeight: 500 }}>Date:</span> {format(new Date(invoice.date), "dd/MM/yyyy")}</div>
            </div>
          </div>
        </div>

        <div style={{ border: "1px solid black", padding: "10px", marginBottom: "10px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
            <div>
              <div style={{ fontWeight: 700, marginBottom: "4px", fontSize: "11px" }}>{translateToTamil("Bill To", enableTamilPrint)}:</div>
              <div style={{ fontWeight: 600, fontSize: "12px" }}>{invoice.partyName || "Cash Customer"}</div>
              {invoice.partyAddress && <div style={{ fontSize: "10px" }}>{invoice.partyAddress}</div>}
              {invoice.partyCity && <div style={{ fontSize: "10px" }}>{invoice.partyCity}{invoice.partyState ? `, ${invoice.partyState}` : ""}</div>}
              {invoice.partyGstNo && <div style={{ fontSize: "10px" }}>GSTIN: {invoice.partyGstNo}</div>}
              {invoice.partyPhone && <div style={{ fontSize: "10px" }}>Phone: {invoice.partyPhone}</div>}
            </div>
            <div style={{ textAlign: "right", fontSize: "10px" }}>
              {invoice.isInterState ? (
                <div>Inter-State Supply (IGST)</div>
              ) : (
                <div>Intra-State Supply (CGST + SGST)</div>
              )}
            </div>
          </div>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "10px", fontSize: `${Math.max(template.fontSize - 1, 8)}px` }}>
          <thead>
            <tr style={{ backgroundColor: "#f0f0f0" }}>
              <th style={{ border: "1px solid black", padding: "4px 6px", textAlign: "left", width: "30px" }}>#</th>
              <th style={{ border: "1px solid black", padding: "4px 6px", textAlign: "left" }}>Item Description</th>
              {template.showHsnCode && <th style={{ border: "1px solid black", padding: "4px 6px", textAlign: "left", width: "70px" }}>HSN</th>}
              <th style={{ border: "1px solid black", padding: "4px 6px", textAlign: "right", width: "50px" }}>Qty</th>
              <th style={{ border: "1px solid black", padding: "4px 6px", textAlign: "right", width: "70px" }}>Rate</th>
              {template.showTaxBreakup && (
                <>
                  <th style={{ border: "1px solid black", padding: "4px 6px", textAlign: "right", width: "50px" }}>Disc%</th>
                  <th style={{ border: "1px solid black", padding: "4px 6px", textAlign: "right", width: "50px" }}>Tax%</th>
                </>
              )}
              <th style={{ border: "1px solid black", padding: "4px 6px", textAlign: "right", width: "85px" }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, index) => (
              <tr key={item.id || index}>
                <td style={{ border: "1px solid black", padding: "3px 6px" }}>{index + 1}</td>
                <td style={{ border: "1px solid black", padding: "3px 6px" }}>
                  <div style={{ fontWeight: 500 }}>{item.itemName}</div>
                  {template.showItemCode && item.itemCode && (
                    <div style={{ fontSize: "9px", color: "#666" }}>Code: {item.itemCode}</div>
                  )}
                  {item.barcode && (
                    <div style={{ fontSize: "9px", color: "#666" }}>BC: {item.barcode}</div>
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
                <div style={{ fontWeight: 700, marginBottom: "4px", fontSize: "10px" }}>Bank Details:</div>
                <div style={{ whiteSpace: "pre-line", fontSize: "9px" }}>{template.bankDetails}</div>
              </div>
            )}
            {template.termsAndConditions && (
              <div style={{ fontSize: "8px" }}>
                <div style={{ fontWeight: 700, marginBottom: "2px" }}>Terms & Conditions:</div>
                <div style={{ whiteSpace: "pre-line" }}>{template.termsAndConditions}</div>
              </div>
            )}
          </div>
          <div style={{ width: "220px", border: "1px solid black", fontSize: "11px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 8px", borderBottom: "1px solid black" }}>
              <span>Subtotal:</span>
              <span>₹{invoice.subtotal.toFixed(2)}</span>
            </div>
            {invoice.totalDiscount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 8px", borderBottom: "1px solid black" }}>
                <span>Discount:</span>
                <span>- ₹{invoice.totalDiscount.toFixed(2)}</span>
              </div>
            )}
            {template.showTaxBreakup && (
              invoice.isInterState ? (
                <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 8px", borderBottom: "1px solid black" }}>
                  <span>IGST:</span>
                  <span>₹{invoice.totalIgst.toFixed(2)}</span>
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 8px", borderBottom: "1px solid black" }}>
                    <span>CGST:</span>
                    <span>₹{invoice.totalCgst.toFixed(2)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 8px", borderBottom: "1px solid black" }}>
                    <span>SGST:</span>
                    <span>₹{invoice.totalSgst.toFixed(2)}</span>
                  </div>
                </>
              )
            )}
            {invoice.roundOff !== 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 8px", borderBottom: "1px solid black" }}>
                <span>Round Off:</span>
                <span>{invoice.roundOff >= 0 ? "+" : ""}₹{invoice.roundOff.toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 8px", fontWeight: 700, fontSize: "14px", backgroundColor: "#f0f0f0" }}>
              <span>Grand Total:</span>
              <span>₹{invoice.grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {template.showPartyBalance && invoice.currentBalance !== undefined && (
          <div style={{ marginTop: "12px", border: "1px solid black", padding: "8px" }}>
            <div style={{ fontWeight: 700, marginBottom: "4px", fontSize: "10px" }}>Account Summary:</div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px" }}>
              <span>Previous Balance:</span>
              <span>₹{(invoice.previousBalance || 0).toFixed(2)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px" }}>
              <span>Current Bill:</span>
              <span>₹{invoice.grandTotal.toFixed(2)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, borderTop: "1px solid black", paddingTop: "4px", marginTop: "4px", fontSize: "11px" }}>
              <span>Outstanding Balance:</span>
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
            <div style={{ borderTop: "1px solid black", width: "120px", paddingTop: "4px", fontSize: "9px" }}>Customer Signature</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ borderTop: "1px solid black", width: "120px", paddingTop: "4px", fontSize: "9px" }}>Authorized Signatory</div>
          </div>
        </div>
      </div>
    );
  }
);

InvoiceA4Print.displayName = "InvoiceA4Print";

export const InvoiceB4CenteredPrint = forwardRef<HTMLDivElement, InvoicePrintProps>(
  ({ invoice, template, companyName, companyAddress, companyGst, companyPhone }, ref) => {
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
                <img src={template.logoUrl} alt="Logo" style={{ maxHeight: "50px", marginBottom: "6px" }} />
              )}
              {template.headerText ? (
                <div style={{ whiteSpace: "pre-line", fontWeight: 600, fontSize: "13px" }}>{template.headerText}</div>
              ) : (
                <>
                  <div style={{ fontSize: "16px", fontWeight: 700 }}>{companyName}</div>
                  {companyAddress && <div style={{ fontSize: "10px" }}>{companyAddress}</div>}
                  {companyGst && <div style={{ fontSize: "10px" }}>GSTIN: {companyGst}</div>}
                </>
              )}
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "18px", fontWeight: 700, marginBottom: "6px" }}>TAX INVOICE</div>
              <div style={{ fontSize: "10px" }}>
                <div>Invoice: {invoice.invoiceNo}</div>
                <div>Date: {format(new Date(invoice.date), "dd/MM/yyyy")}</div>
              </div>
            </div>
          </div>

          <div style={{ border: "1px solid black", padding: "8px", marginBottom: "8px" }}>
            <div style={{ fontWeight: 700, fontSize: "10px", marginBottom: "3px" }}>Bill To:</div>
            <div style={{ fontSize: "11px", fontWeight: 600 }}>{invoice.partyName || "Cash Customer"}</div>
            {invoice.partyAddress && <div style={{ fontSize: "9px" }}>{invoice.partyAddress}</div>}
            {invoice.partyGstNo && <div style={{ fontSize: "9px" }}>GSTIN: {invoice.partyGstNo}</div>}
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "8px", fontSize: "9px" }}>
            <thead>
              <tr style={{ backgroundColor: "#f0f0f0" }}>
                <th style={{ border: "1px solid black", padding: "3px", textAlign: "left", width: "25px" }}>#</th>
                <th style={{ border: "1px solid black", padding: "3px", textAlign: "left" }}>Description</th>
                {template.showHsnCode && <th style={{ border: "1px solid black", padding: "3px", width: "55px" }}>HSN</th>}
                <th style={{ border: "1px solid black", padding: "3px", textAlign: "right", width: "40px" }}>Qty</th>
                <th style={{ border: "1px solid black", padding: "3px", textAlign: "right", width: "55px" }}>Rate</th>
                <th style={{ border: "1px solid black", padding: "3px", textAlign: "right", width: "70px" }}>Amount</th>
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
                <span>Subtotal:</span><span>₹{invoice.subtotal.toFixed(2)}</span>
              </div>
              {invoice.totalDiscount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 6px", borderBottom: "1px solid black" }}>
                  <span>Discount:</span><span>- ₹{invoice.totalDiscount.toFixed(2)}</span>
                </div>
              )}
              {template.showTaxBreakup && !invoice.isInterState && (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 6px", borderBottom: "1px solid black" }}>
                    <span>CGST:</span><span>₹{invoice.totalCgst.toFixed(2)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 6px", borderBottom: "1px solid black" }}>
                    <span>SGST:</span><span>₹{invoice.totalSgst.toFixed(2)}</span>
                  </div>
                </>
              )}
              {invoice.roundOff !== 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 6px", borderBottom: "1px solid black" }}>
                  <span>Round Off:</span><span>{invoice.roundOff >= 0 ? "+" : ""}₹{invoice.roundOff.toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 6px", fontWeight: 700, fontSize: "12px", backgroundColor: "#f0f0f0" }}>
                <span>Total:</span><span>₹{invoice.grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {template.footerText && (
            <div style={{ marginTop: "12px", textAlign: "center", fontSize: "9px" }}>{template.footerText}</div>
          )}

          <div style={{ marginTop: "20px", display: "flex", justifyContent: "space-between" }}>
            <div style={{ borderTop: "1px solid black", width: "100px", paddingTop: "3px", textAlign: "center", fontSize: "8px" }}>Customer Sign</div>
            <div style={{ borderTop: "1px solid black", width: "100px", paddingTop: "3px", textAlign: "center", fontSize: "8px" }}>Auth. Signatory</div>
          </div>
        </div>
      </div>
    );
  }
);

InvoiceB4CenteredPrint.displayName = "InvoiceB4CenteredPrint";

export const InvoiceThermalPrint = forwardRef<HTMLDivElement, InvoicePrintProps>(
  ({ invoice, template, companyName, enableTamilPrint }, ref) => {
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
              alt="Logo"
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
            <span>Bill No:</span>
            <span className="font-bold">{invoice.invoiceNo}</span>
          </div>
          <div className="flex justify-between">
            <span>Date:</span>
            <span>{format(new Date(invoice.date), "dd/MM/yyyy HH:mm")}</span>
          </div>
          {invoice.partyName && invoice.partyName !== "Cash" && (
            <div className="flex justify-between">
              <span>Customer:</span>
              <span className="text-right max-w-[60%] truncate">{invoice.partyName}</span>
            </div>
          )}
        </div>

        <div className="border-t border-dashed border-black my-2" />

        <div className="text-xs">
          <div className="flex justify-between font-bold mb-1">
            <span>Item</span>
            <span>Amount</span>
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
                  <span>Disc: {item.discountPercent}%</span>
                )}
              </div>
              {template.showHsnCode && item.hsnCode && (
                <div className="text-xs opacity-60">HSN: {item.hsnCode}</div>
              )}
            </div>
          ))}
        </div>

        <div className="border-t border-dashed border-black my-2" />

        <div className="text-xs space-y-0.5">
          <div className="flex justify-between">
            <span>Items: {invoice.items.length}</span>
            <span>Qty: {invoice.items.reduce((sum, i) => sum + i.quantity, 0)}</span>
          </div>
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>₹{invoice.subtotal.toFixed(2)}</span>
          </div>
          {invoice.totalDiscount > 0 && (
            <div className="flex justify-between">
              <span>Discount:</span>
              <span>- ₹{invoice.totalDiscount.toFixed(2)}</span>
            </div>
          )}
          {template.showTaxBreakup && (
            invoice.isInterState ? (
              <div className="flex justify-between">
                <span>IGST:</span>
                <span>₹{invoice.totalIgst.toFixed(2)}</span>
              </div>
            ) : (
              <>
                <div className="flex justify-between">
                  <span>CGST:</span>
                  <span>₹{invoice.totalCgst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>SGST:</span>
                  <span>₹{invoice.totalSgst.toFixed(2)}</span>
                </div>
              </>
            )
          )}
          {invoice.roundOff !== 0 && (
            <div className="flex justify-between">
              <span>Round Off:</span>
              <span>{invoice.roundOff >= 0 ? "+" : ""}₹{invoice.roundOff.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-base border-t border-black pt-1">
            <span>TOTAL:</span>
            <span>₹{invoice.grandTotal.toFixed(2)}</span>
          </div>
        </div>

        {template.showCashReturn && invoice.cashGiven !== undefined && invoice.cashGiven > 0 && (
          <>
            <div className="border-t border-dashed border-black my-2" />
            <div className="text-xs space-y-0.5">
              <div className="flex justify-between">
                <span>Cash:</span>
                <span>₹{invoice.cashGiven.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Return:</span>
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
              <div>Thank you for your purchase!</div>
              <div>Visit Again</div>
            </>
          )}
        </div>
      </div>
    );
  }
);

InvoiceThermalPrint.displayName = "InvoiceThermalPrint";
