import { forwardRef } from "react";
import { format } from "date-fns";

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
}

export const InvoiceA4Print = forwardRef<HTMLDivElement, InvoicePrintProps>(
  ({ invoice, template, companyName, companyAddress, companyGst, companyPhone }, ref) => {
    const isB4 = template.formatType === "B4";
    const pageWidth = isB4 ? "250mm" : "210mm";
    
    return (
      <div
        ref={ref}
        className="bg-white text-black p-8"
        style={{
          width: pageWidth,
          minHeight: isB4 ? "353mm" : "297mm",
          fontSize: `${template.fontSize}px`,
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1">
            {template.logoUrl && (
              <img
                src={template.logoUrl}
                alt="Company Logo"
                className="max-h-20 mb-3 object-contain"
              />
            )}
            {template.headerText ? (
              <div className="whitespace-pre-line font-semibold text-lg">
                {template.headerText}
              </div>
            ) : (
              <>
                <div className="text-xl font-bold">{companyName}</div>
                {companyAddress && <div>{companyAddress}</div>}
                {companyGst && <div>GSTIN: {companyGst}</div>}
                {companyPhone && <div>Phone: {companyPhone}</div>}
              </>
            )}
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold mb-2">TAX INVOICE</div>
            <div className="space-y-1">
              <div><span className="font-medium">Invoice No:</span> {invoice.invoiceNo}</div>
              <div><span className="font-medium">Date:</span> {format(new Date(invoice.date), "dd/MM/yyyy")}</div>
            </div>
          </div>
        </div>

        <div className="border border-black p-4 mb-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="font-bold mb-1">Bill To:</div>
              <div className="font-medium">{invoice.partyName || "Cash Customer"}</div>
              {invoice.partyAddress && <div>{invoice.partyAddress}</div>}
              {invoice.partyCity && <div>{invoice.partyCity}{invoice.partyState ? `, ${invoice.partyState}` : ""}</div>}
              {invoice.partyGstNo && <div>GSTIN: {invoice.partyGstNo}</div>}
              {invoice.partyPhone && <div>Phone: {invoice.partyPhone}</div>}
            </div>
            <div className="text-right">
              {invoice.isInterState ? (
                <div className="text-sm">Inter-State Supply (IGST)</div>
              ) : (
                <div className="text-sm">Intra-State Supply (CGST + SGST)</div>
              )}
            </div>
          </div>
        </div>

        <table className="w-full border-collapse mb-4">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-black p-2 text-left w-10">#</th>
              <th className="border border-black p-2 text-left">Item Description</th>
              {template.showHsnCode && <th className="border border-black p-2 text-left w-20">HSN</th>}
              <th className="border border-black p-2 text-right w-16">Qty</th>
              <th className="border border-black p-2 text-right w-20">Rate</th>
              {template.showTaxBreakup && (
                <>
                  <th className="border border-black p-2 text-right w-16">Disc%</th>
                  <th className="border border-black p-2 text-right w-16">Tax%</th>
                </>
              )}
              <th className="border border-black p-2 text-right w-24">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, index) => (
              <tr key={item.id || index}>
                <td className="border border-black p-2">{index + 1}</td>
                <td className="border border-black p-2">
                  <div className="font-medium">{item.itemName}</div>
                  {template.showItemCode && item.itemCode && (
                    <div className="text-xs text-gray-600">Code: {item.itemCode}</div>
                  )}
                  {item.barcode && (
                    <div className="text-xs text-gray-600">BC: {item.barcode}</div>
                  )}
                </td>
                {template.showHsnCode && (
                  <td className="border border-black p-2">{item.hsnCode}</td>
                )}
                <td className="border border-black p-2 text-right">{item.quantity}</td>
                <td className="border border-black p-2 text-right">₹{item.rate.toFixed(2)}</td>
                {template.showTaxBreakup && (
                  <>
                    <td className="border border-black p-2 text-right">{item.discountPercent || 0}%</td>
                    <td className="border border-black p-2 text-right">{item.taxPercent || 0}%</td>
                  </>
                )}
                <td className="border border-black p-2 text-right font-medium">₹{item.amount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-between">
          <div className="flex-1">
            {template.showBankDetails && template.bankDetails && (
              <div className="mb-4">
                <div className="font-bold mb-1">Bank Details:</div>
                <div className="whitespace-pre-line text-sm">{template.bankDetails}</div>
              </div>
            )}
            {template.termsAndConditions && (
              <div className="text-xs">
                <div className="font-bold mb-1">Terms & Conditions:</div>
                <div className="whitespace-pre-line">{template.termsAndConditions}</div>
              </div>
            )}
          </div>
          <div className="w-72 border border-black">
            <div className="flex justify-between p-2 border-b border-black">
              <span>Subtotal:</span>
              <span>₹{invoice.subtotal.toFixed(2)}</span>
            </div>
            {invoice.totalDiscount > 0 && (
              <div className="flex justify-between p-2 border-b border-black">
                <span>Discount:</span>
                <span>- ₹{invoice.totalDiscount.toFixed(2)}</span>
              </div>
            )}
            {template.showTaxBreakup && (
              invoice.isInterState ? (
                <div className="flex justify-between p-2 border-b border-black">
                  <span>IGST:</span>
                  <span>₹{invoice.totalIgst.toFixed(2)}</span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between p-2 border-b border-black">
                    <span>CGST:</span>
                    <span>₹{invoice.totalCgst.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between p-2 border-b border-black">
                    <span>SGST:</span>
                    <span>₹{invoice.totalSgst.toFixed(2)}</span>
                  </div>
                </>
              )
            )}
            {invoice.roundOff !== 0 && (
              <div className="flex justify-between p-2 border-b border-black">
                <span>Round Off:</span>
                <span>{invoice.roundOff >= 0 ? "+" : ""}₹{invoice.roundOff.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between p-2 font-bold text-lg bg-gray-100">
              <span>Grand Total:</span>
              <span>₹{invoice.grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {template.showPartyBalance && invoice.currentBalance !== undefined && (
          <div className="mt-4 border border-black p-3">
            <div className="font-bold mb-1">Account Summary:</div>
            <div className="flex justify-between">
              <span>Previous Balance:</span>
              <span>₹{(invoice.previousBalance || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Current Bill:</span>
              <span>₹{invoice.grandTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold border-t border-black pt-1 mt-1">
              <span>Outstanding Balance:</span>
              <span>₹{invoice.currentBalance.toFixed(2)}</span>
            </div>
          </div>
        )}

        {template.footerText && (
          <div className="mt-6 text-center border-t border-black pt-4">
            <div className="whitespace-pre-line">{template.footerText}</div>
          </div>
        )}

        <div className="mt-8 flex justify-between">
          <div className="text-center">
            <div className="border-t border-black w-40 pt-1">Customer Signature</div>
          </div>
          <div className="text-center">
            <div className="border-t border-black w-40 pt-1">Authorized Signatory</div>
          </div>
        </div>
      </div>
    );
  }
);

InvoiceA4Print.displayName = "InvoiceA4Print";

export const InvoiceThermalPrint = forwardRef<HTMLDivElement, InvoicePrintProps>(
  ({ invoice, template, companyName }, ref) => {
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
