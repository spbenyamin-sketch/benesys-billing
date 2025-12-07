// Tamil Translation for Invoice Labels
export const tamilLabels: { [key: string]: string } = {
  "INVOICE": "இன்வாய்ஸ்",
  "TAX INVOICE": "வரி இன்வாய்ஸ்",
  "ESTIMATE / QUOTATION": "மதிப்பீடு / மேற்கோள்",
  "Bill To": "பரிமாணம்:",
  "Date": "தேதி:",
  "GST": "GST",
  "Mobile": "மொபைல்",
  "S.No": "வ.எண்",
  "Item Name": "பொருளின் பெயர்",
  "HSN": "HSN",
  "Qty": "அ.க",
  "Rate": "விகிதம்",
  "Amount": "தொகை",
  "Subtotal": "கூட்டுத்தொகை",
  "Discount": "ছாड",
  "CGST": "CGST",
  "SGST": "SGST",
  "IGST": "IGST",
  "Tax": "வரி",
  "Total Tax": "மொத்த வரி",
  "Round Off": "சுற்றுப்புறம்",
  "Grand Total": "பொதுத் தொகை",
  "Payment Mode": "கொடுப்பனவு முறை",
  "Cash": "பணம்",
  "Card": "கார்டு",
  "Terms": "நிபந்தனைகள்",
  "Bank Details": "வங்கி விவரங்கள்",
  "Balance": "சமநிலை",
  "Previous": "முந்தைய",
  "Current": "நடப்பு",
  "Thank you": "நன்றி",
  "Buyer (Bill to)": "கொள்முதல்தாரர் (பரிமாணம்)",
  "GSTIN/UIN": "GSTIN/UIN",
  "Phone": "தொலைபேசி",
  "Description of Goods": "பொருட்களின் விளக்கம்",
  "HSN/SAC": "HSN/SAC",
  "Quantity": "அளவு",
  "Taxable Value": "வரிக்கு உட்பட்ட மதிப்பு",
  "Tax Rate": "வரி விகிதம்",
  "Tax Amount": "வரி தொகை",
  "Amount Chargeable (in words)": "வசூல் செய்ய வேண்டிய தொகை (சொற்களில்)",
  "Subtotal": "கூட்டுத்தொகை",
  "Round Off": "சுற்றுப்புறம்",
  "TOTAL": "மொத்தம்",
  "Declaration": "நிரூபணம்",
  "Terms & Conditions": "விதிமுறைகள் மற்றும் நிபந்தனைகள்",
  "State": "மாநிலம்",
  "Pin Code": "பின் குறியீடு",
  "Code": "குறியீடு",
  "Barcode": "பார்குறியீடு",
};

export function translateToTamil(text: string, enableTamil: boolean): string {
  if (!enableTamil) return text;
  
  // Check for exact matches first
  if (tamilLabels[text]) {
    return tamilLabels[text];
  }
  
  // Check for partial matches
  for (const [english, tamil] of Object.entries(tamilLabels)) {
    if (text.includes(english)) {
      return text.replace(english, tamil);
    }
  }
  
  return text;
}
