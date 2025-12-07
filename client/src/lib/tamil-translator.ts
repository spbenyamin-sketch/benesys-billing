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
  "Discount": "ছাড়",
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
