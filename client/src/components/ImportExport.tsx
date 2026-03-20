import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Download, Upload, FileSpreadsheet, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ImportExportProps {
  type: "items" | "parties";
  queryKey: string;
}

export function ImportExport({ type, queryKey }: ImportExportProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [resultDialog, setResultDialog] = useState<{
    open: boolean;
    created: number;
    updated: number;
    errors: string[];
  }>({ open: false, created: 0, updated: 0, errors: [] });

  // ── EXPORT ──────────────────────────────────────────────────────────────
  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch(`/api/${type}/export`, { credentials: "include" });
      if (!res.ok) throw new Error("Export failed");
      const data = await res.json();
      if (!data.length) {
        toast({ title: "No data", description: `No ${type} found to export.`, variant: "destructive" });
        return;
      }

      const ws = XLSX.utils.json_to_sheet(data);

      // Style header row
      const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
      for (let c = range.s.c; c <= range.e.c; c++) {
        const cell = XLSX.utils.encode_cell({ r: 0, c });
        if (ws[cell]) {
          ws[cell].s = {
            font: { bold: true, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "1D4ED8" } },
            alignment: { horizontal: "center" },
          };
        }
      }

      // Auto column widths
      const colWidths = Object.keys(data[0] || {}).map(key => ({
        wch: Math.max(key.length, ...data.map((r: any) => String(r[key] || "").length)) + 2,
      }));
      ws["!cols"] = colWidths;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, type === "items" ? "Items" : "Parties");

      // Add sample/template sheet
      const templateData = type === "items"
        ? [{ Code: "SAMPLE001", Name: "Sample Item", HSN: "6103", Category: "Saree", Floor: "Floor 1", PackType: "PCS", Type: "product", Cost: 100, MRP: 150, SellingPrice: 140, Tax: 5, Active: "Yes" }]
        : [{ Code: "P001", Name: "Sample Party", City: "Mumbai", State: "Maharashtra", StateCode: "27", Address: "123 Main St", GSTNo: "27AAPFU0939F1ZV", Phone: "9876543210", OpeningDebit: 0, OpeningCredit: 0 }];
      const ws2 = XLSX.utils.json_to_sheet(templateData);
      XLSX.utils.book_append_sheet(wb, ws2, "Template");

      XLSX.writeFile(wb, `benesys_${type}_${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast({ title: "Export Successful", description: `${data.length} ${type} exported to Excel.` });
    } catch (err: any) {
      toast({ title: "Export Failed", description: err.message, variant: "destructive" });
    } finally {
      setExporting(false);
    }
  }

  // ── IMPORT ──────────────────────────────────────────────────────────────
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (fileInputRef.current) fileInputRef.current.value = "";

    setImporting(true);
    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });

      if (!rows.length) {
        toast({ title: "Empty File", description: "No data rows found in the Excel file.", variant: "destructive" });
        return;
      }

      const res = await apiRequest("POST", `/api/${type}/import`, { rows });
      const result = await res.json();

      setResultDialog({
        open: true,
        created: result.created || 0,
        updated: result.updated || 0,
        errors: result.errors || [],
      });

      queryClient.invalidateQueries({ queryKey: [queryKey] });
    } catch (err: any) {
      toast({ title: "Import Failed", description: err.message, variant: "destructive" });
    } finally {
      setImporting(false);
    }
  }

  // ── DOWNLOAD TEMPLATE ───────────────────────────────────────────────────
  function handleDownloadTemplate() {
    const templateData = type === "items"
      ? [
          { Code: "", Name: "Item Name *", HSN: "6103", Category: "Saree", Floor: "Floor 1", PackType: "PCS", Type: "product", Cost: 100, MRP: 150, SellingPrice: 140, Tax: 5, Active: "Yes" },
          { Code: "", Name: "Another Item", HSN: "5208", Category: "Fabric", Floor: "Floor 2", PackType: "MTR", Type: "product", Cost: 200, MRP: 280, SellingPrice: 260, Tax: 5, Active: "Yes" },
        ]
      : [
          { Code: "", Name: "Party Name *", City: "Mumbai *", State: "Maharashtra", StateCode: "27", Address: "123 Main St", GSTNo: "27AAPFU0939F1ZV", Phone: "9876543210", OpeningDebit: 0, OpeningCredit: 0 },
          { Code: "", Name: "Another Party", City: "Delhi", State: "Delhi", StateCode: "07", Address: "", GSTNo: "", Phone: "", OpeningDebit: 5000, OpeningCredit: 0 },
        ];

    const ws = XLSX.utils.json_to_sheet(templateData);

    // Bold header
    const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cell = XLSX.utils.encode_cell({ r: 0, c });
      if (ws[cell]) ws[cell].s = { font: { bold: true }, fill: { fgColor: { rgb: "FEF3C7" } } };
    }
    const colWidths = Object.keys(templateData[0]).map(k => ({ wch: Math.max(k.length, 15) }));
    ws["!cols"] = colWidths;

    const wbOut = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wbOut, ws, "Template");
    XLSX.writeFile(wbOut, `benesys_${type}_template.xlsx`);
    toast({ title: "Template Downloaded", description: "Fill in the template and import it back." });
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Export */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={exporting}
          tabIndex={-1}
          className="gap-1.5"
        >
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          <span className="hidden sm:inline">Export Excel</span>
          <span className="sm:hidden">Export</span>
        </Button>

        {/* Import */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={importing}
          tabIndex={-1}
          className="gap-1.5"
        >
          {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          <span className="hidden sm:inline">Import Excel</span>
          <span className="sm:hidden">Import</span>
        </Button>

        {/* Template download */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDownloadTemplate}
          tabIndex={-1}
          className="gap-1.5 text-muted-foreground"
          title="Download blank template"
        >
          <FileSpreadsheet className="h-4 w-4" />
          <span className="hidden sm:inline">Template</span>
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Import Result Dialog */}
      <Dialog open={resultDialog.open} onOpenChange={(o) => setResultDialog(r => ({ ...r, open: o }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Complete</DialogTitle>
            <DialogDescription>
              Results for {type} import
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-green-50 dark:bg-green-950 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-600">{resultDialog.created}</div>
                <div className="text-sm text-muted-foreground">New Records Created</div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-600">{resultDialog.updated}</div>
                <div className="text-sm text-muted-foreground">Existing Records Updated</div>
              </div>
            </div>
            {resultDialog.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertDescription>
                  <div className="font-medium mb-1">{resultDialog.errors.length} rows had errors:</div>
                  <ul className="text-xs space-y-0.5">
                    {resultDialog.errors.map((e, i) => <li key={i}>• {e}</li>)}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
