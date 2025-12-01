export function numberToWords(num: number): string {
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  
  const numToWord = (n: number): string => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
    if (n < 1000) return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + numToWord(n % 100) : "");
    if (n < 100000) return numToWord(Math.floor(n / 1000)) + " Thousand" + (n % 1000 ? " " + numToWord(n % 1000) : "");
    if (n < 10000000) return numToWord(Math.floor(n / 100000)) + " Lakh" + (n % 100000 ? " " + numToWord(n % 100000) : "");
    return numToWord(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 ? " " + numToWord(n % 10000000) : "");
  };
  
  const intPart = Math.floor(num);
  return intPart === 0 ? "Zero" : numToWord(intPart);
}
