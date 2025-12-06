import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ExportColumn {
  header: string;
  key: string;
  width?: number;
  format?: (value: any) => string;
}

interface ExportOptions {
  title: string;
  filename: string;
  columns: ExportColumn[];
  data: Record<string, any>[];
  summary?: { label: string; values: (string | number)[] };
  dateRange?: { start?: string; end?: string };
  filters?: string;
}

export function exportToExcel(options: ExportOptions): void {
  const { filename, columns, data, summary, title, dateRange, filters } = options;

  const headerInfo: (string | number)[][] = [
    [title],
    [],
  ];

  if (dateRange?.start || dateRange?.end) {
    headerInfo.push([`Date Range: ${dateRange.start || 'Start'} to ${dateRange.end || 'End'}`]);
  }
  if (filters) {
    headerInfo.push([`Filters: ${filters}`]);
  }
  headerInfo.push([]);

  const headers = columns.map(col => col.header);
  
  const rows = data.map(item =>
    columns.map(col => {
      const value = item[col.key];
      return col.format ? col.format(value) : value;
    })
  );

  const worksheetData: (string | number)[][] = [
    ...headerInfo,
    headers,
    ...rows,
  ];

  if (summary && summary.values.length > 0) {
    worksheetData.push([]);
    worksheetData.push([summary.label, ...summary.values]);
  }

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  const columnWidths = columns.map(col => ({ wch: col.width || 15 }));
  worksheet['!cols'] = columnWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');

  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

export function exportToPDF(options: ExportOptions): void {
  const { filename, columns, data, summary, title, dateRange, filters } = options;

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  doc.setFontSize(16);
  doc.text(title, 14, 15);

  let yPosition = 22;
  doc.setFontSize(10);

  if (dateRange?.start || dateRange?.end) {
    doc.text(`Date Range: ${dateRange.start || 'Start'} to ${dateRange.end || 'End'}`, 14, yPosition);
    yPosition += 5;
  }
  if (filters) {
    doc.text(`Filters: ${filters}`, 14, yPosition);
    yPosition += 5;
  }

  const headers = columns.map(col => col.header);
  const rows = data.map(item =>
    columns.map(col => {
      const value = item[col.key];
      return col.format ? col.format(value) : String(value ?? '');
    })
  );

  const footerRows: string[][] = [];
  if (summary && summary.values.length > 0) {
    footerRows.push([summary.label, ...summary.values.map(v => String(v))]);
  }

  autoTable(doc, {
    head: [headers],
    body: rows,
    foot: footerRows.length > 0 ? footerRows : undefined,
    startY: yPosition + 5,
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [66, 66, 66],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    footStyles: {
      fillColor: [240, 240, 240],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [248, 248, 248],
    },
  });

  doc.save(`${filename}.pdf`);
}

export function formatCurrency(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return isNaN(num) ? '0.00' : num.toFixed(2);
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric' 
  });
}
