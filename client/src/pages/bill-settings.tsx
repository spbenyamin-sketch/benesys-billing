import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Settings, Save, Printer, Eye, FileText, Trash2, Edit2, Zap, CheckCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { LogoUploader } from "@/components/LogoUploader";
import { usePrintSettings as usePrintSettingsHook, savePrintSettings, PrintSettings } from "@/hooks/use-print-settings";

interface BillTemplate {
  id: number;
  name: string;
  formatType: string;
  assignedTo: string | null;
  logoUrl: string | null;
  headerText: string | null;
  footerText: string | null;
  showTaxBreakup: boolean;
  showHsnCode: boolean;
  showItemCode: boolean;
  showOutstandingDefault: boolean;
  showCashReturn: boolean;
  showPartyBalance: boolean;
  showBankDetails: boolean;
  enableTamilPrint: boolean;
  bankDetails: string | null;
  termsAndConditions: string | null;
  paperSize: string;
  fontSize: number;
  isDefault: boolean;
}

const FORMAT_TYPES = [
  { value: "A4", label: "A4 (210 × 297 mm)", description: "Standard paper - Like Tally" },
  { value: "B4", label: "B4 (250 × 353 mm)", description: "Large paper - Like Tally" },
  { value: "thermal_3inch", label: "Thermal 3 inch (80mm)", description: "POS thermal printer" },
  { value: "thermal_4inch", label: "Thermal 4 inch (112mm)", description: "Wide thermal printer" },
];

const ASSIGNMENT_OPTIONS = [
  { value: "none", label: "Not Assigned" },
  { value: "b2b", label: "B2B Credit Sale" },
  { value: "b2c", label: "B2C Retail Sale" },
  { value: "estimate", label: "Estimate/Quotation" },
  { value: "credit_note", label: "Credit Note" },
  { value: "debit_note", label: "Debit Note" },
];

const defaultFormData = {
  id: null as number | null,
  name: "",
  formatType: "A4",
  assignedTo: "none",
  logoUrl: "",
  headerText: "",
  footerText: "Thank you for your business!",
  showTaxBreakup: true,
  showHsnCode: true,
  showItemCode: false,
  showOutstandingDefault: true,
  showCashReturn: true,
  showPartyBalance: false,
  showBankDetails: false,
  enableTamilPrint: false,
  bankDetails: "",
  termsAndConditions: "",
  paperSize: "A4",
  fontSize: 10,
  isDefault: false,
};

function PrintSettingsTab({ templates }: { templates: BillTemplate[] }) {
  const { toast } = useToast();
  const { settings: hookSettings } = usePrintSettingsHook();
  const [settings, setSettings] = useState<PrintSettings>(hookSettings);

  useEffect(() => {
    setSettings(hookSettings);
  }, [hookSettings]);

  const handleSave = () => {
    savePrintSettings(settings);
    toast({
      title: "Settings Saved",
      description: "Your print preferences have been saved.",
    });
  };

  const handleReset = () => {
    const defaultSettings: PrintSettings = {
      autoPrintB2B: false,
      autoPrintB2C: true,
      autoPrintEstimate: false,
      autoPrintCreditNote: false,
      autoPrintDebitNote: false,
      printCopiesB2B: 2,
      printCopiesB2C: 1,
      printCopiesEstimate: 1,
      printCopiesCreditNote: 2,
      printCopiesDebitNote: 2,
      showPrintConfirmation: true,
      defaultPrinterName: "",
      directPrintB2B: false,
      directPrintB2C: false,
      directPrintEstimate: false,
      directPrintCreditNote: false,
      directPrintDebitNote: false,
    };
    setSettings(defaultSettings);
    savePrintSettings(defaultSettings);
    toast({
      title: "Settings Reset",
      description: "Print settings have been reset to defaults.",
    });
  };

  const getAssignedTemplate = (type: string) => {
    return templates.find(t => t.assignedTo === type);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Quick Print Settings
          </CardTitle>
          <CardDescription>
            Configure automatic printing after saving sales. Print dialog will still appear (browser security).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <Label className="text-base font-medium">Auto-Print After Save</Label>
            <p className="text-sm text-muted-foreground">
              Enable to automatically open print dialog when a sale is saved.
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="autoPrintB2B" className="font-normal">B2B Credit Sale</Label>
                  <p className="text-xs text-muted-foreground">
                    Template: {getAssignedTemplate("b2b")?.name || "Not assigned"}
                  </p>
                </div>
                <Switch
                  id="autoPrintB2B"
                  checked={settings.autoPrintB2B}
                  onCheckedChange={(checked) => setSettings({ ...settings, autoPrintB2B: checked })}
                  data-testid="switch-auto-print-b2b"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="autoPrintB2C" className="font-normal">B2C Retail Sale</Label>
                  <p className="text-xs text-muted-foreground">
                    Template: {getAssignedTemplate("b2c")?.name || "Not assigned"}
                  </p>
                </div>
                <Switch
                  id="autoPrintB2C"
                  checked={settings.autoPrintB2C}
                  onCheckedChange={(checked) => setSettings({ ...settings, autoPrintB2C: checked })}
                  data-testid="switch-auto-print-b2c"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="autoPrintEstimate" className="font-normal">Estimate/Quotation</Label>
                  <p className="text-xs text-muted-foreground">
                    Template: {getAssignedTemplate("estimate")?.name || "Not assigned"}
                  </p>
                </div>
                <Switch
                  id="autoPrintEstimate"
                  checked={settings.autoPrintEstimate}
                  onCheckedChange={(checked) => setSettings({ ...settings, autoPrintEstimate: checked })}
                  data-testid="switch-auto-print-estimate"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="autoPrintCreditNote" className="font-normal">Credit Note</Label>
                  <p className="text-xs text-muted-foreground">
                    Template: {getAssignedTemplate("credit_note")?.name || "Not assigned"}
                  </p>
                </div>
                <Switch
                  id="autoPrintCreditNote"
                  checked={settings.autoPrintCreditNote}
                  onCheckedChange={(checked) => setSettings({ ...settings, autoPrintCreditNote: checked })}
                  data-testid="switch-auto-print-credit-note"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="autoPrintDebitNote" className="font-normal">Debit Note</Label>
                  <p className="text-xs text-muted-foreground">
                    Template: {getAssignedTemplate("debit_note")?.name || "Not assigned"}
                  </p>
                </div>
                <Switch
                  id="autoPrintDebitNote"
                  checked={settings.autoPrintDebitNote}
                  onCheckedChange={(checked) => setSettings({ ...settings, autoPrintDebitNote: checked })}
                  data-testid="switch-auto-print-debit-note"
                />
              </div>
            </div>
          </div>

          <div className="border-t pt-4 space-y-4">
            <Label className="text-base font-medium">Print Confirmation</Label>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="showPrintConfirmation" className="font-normal">Show Print Prompt</Label>
                <p className="text-xs text-muted-foreground">
                  Ask before printing when auto-print is enabled
                </p>
              </div>
              <Switch
                id="showPrintConfirmation"
                checked={settings.showPrintConfirmation}
                onCheckedChange={(checked) => setSettings({ ...settings, showPrintConfirmation: checked })}
                data-testid="switch-print-confirmation"
              />
            </div>
          </div>

          <div className="border-t pt-4 space-y-4">
            <Label className="text-base font-medium">Direct Print Mode</Label>
            <p className="text-sm text-muted-foreground">
              Skip preview and send bills directly to printer with no preview modal
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="directPrintB2B" className="font-normal">B2B Credit Sale</Label>
                <Switch
                  id="directPrintB2B"
                  checked={settings.directPrintB2B}
                  onCheckedChange={(checked) => setSettings({ ...settings, directPrintB2B: checked })}
                  data-testid="switch-direct-print-b2b"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="directPrintB2C" className="font-normal">B2C Retail Sale</Label>
                <Switch
                  id="directPrintB2C"
                  checked={settings.directPrintB2C}
                  onCheckedChange={(checked) => setSettings({ ...settings, directPrintB2C: checked })}
                  data-testid="switch-direct-print-b2c"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="directPrintEstimate" className="font-normal">Estimate/Quotation</Label>
                <Switch
                  id="directPrintEstimate"
                  checked={settings.directPrintEstimate}
                  onCheckedChange={(checked) => setSettings({ ...settings, directPrintEstimate: checked })}
                  data-testid="switch-direct-print-estimate"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="directPrintCreditNote" className="font-normal">Credit Note</Label>
                <Switch
                  id="directPrintCreditNote"
                  checked={settings.directPrintCreditNote}
                  onCheckedChange={(checked) => setSettings({ ...settings, directPrintCreditNote: checked })}
                  data-testid="switch-direct-print-credit-note"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="directPrintDebitNote" className="font-normal">Debit Note</Label>
                <Switch
                  id="directPrintDebitNote"
                  checked={settings.directPrintDebitNote}
                  onCheckedChange={(checked) => setSettings({ ...settings, directPrintDebitNote: checked })}
                  data-testid="switch-direct-print-debit-note"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave} data-testid="button-save-print-settings">
              <Save className="mr-2 h-4 w-4" />
              Save Settings
            </Button>
            <Button variant="outline" onClick={handleReset}>
              Reset to Defaults
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Print Copies
          </CardTitle>
          <CardDescription>
            Set default number of copies for each sale type
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="copiesB2B">B2B Credit Sale</Label>
              <Select
                value={settings.printCopiesB2B.toString()}
                onValueChange={(value) => setSettings({ ...settings, printCopiesB2B: parseInt(value) })}
              >
                <SelectTrigger id="copiesB2B" data-testid="select-copies-b2b">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map(n => (
                    <SelectItem key={n} value={n.toString()}>{n} {n === 1 ? "Copy" : "Copies"}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="copiesB2C">B2C Retail Sale</Label>
              <Select
                value={settings.printCopiesB2C.toString()}
                onValueChange={(value) => setSettings({ ...settings, printCopiesB2C: parseInt(value) })}
              >
                <SelectTrigger id="copiesB2C" data-testid="select-copies-b2c">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map(n => (
                    <SelectItem key={n} value={n.toString()}>{n} {n === 1 ? "Copy" : "Copies"}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="copiesEstimate">Estimate</Label>
              <Select
                value={settings.printCopiesEstimate.toString()}
                onValueChange={(value) => setSettings({ ...settings, printCopiesEstimate: parseInt(value) })}
              >
                <SelectTrigger id="copiesEstimate" data-testid="select-copies-estimate">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map(n => (
                    <SelectItem key={n} value={n.toString()}>{n} {n === 1 ? "Copy" : "Copies"}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="copiesCreditNote">Credit Note</Label>
              <Select
                value={settings.printCopiesCreditNote.toString()}
                onValueChange={(value) => setSettings({ ...settings, printCopiesCreditNote: parseInt(value) })}
              >
                <SelectTrigger id="copiesCreditNote" data-testid="select-copies-credit-note">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map(n => (
                    <SelectItem key={n} value={n.toString()}>{n} {n === 1 ? "Copy" : "Copies"}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="copiesDebitNote">Debit Note</Label>
              <Select
                value={settings.printCopiesDebitNote.toString()}
                onValueChange={(value) => setSettings({ ...settings, printCopiesDebitNote: parseInt(value) })}
              >
                <SelectTrigger id="copiesDebitNote" data-testid="select-copies-debit-note">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map(n => (
                    <SelectItem key={n} value={n.toString()}>{n} {n === 1 ? "Copy" : "Copies"}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">How Quick Print Works</span>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>After saving a sale, print dialog opens automatically</li>
              <li>Browser print dialog appears for printer selection</li>
              <li>Use your browser's "Save as PDF" for digital copies</li>
              <li>Set "Remember my choice" in browser for faster printing</li>
            </ul>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg p-4">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Note:</strong> For truly silent printing without dialogs, consider using dedicated POS software with direct printer integration. Web browsers require print dialog for security.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function BillSettings() {
  const { toast } = useToast();
  const [showPreview, setShowPreview] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [formData, setFormData] = useState(defaultFormData);
  const [activeTab, setActiveTab] = useState("standard");

  const { data: templates, isLoading } = useQuery<BillTemplate[]>({
    queryKey: ["/api/bill-templates"],
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...formData,
        assignedTo: formData.assignedTo === "none" ? null : formData.assignedTo,
        paperSize: formData.formatType.startsWith("thermal") 
          ? (formData.formatType === "thermal_3inch" ? "3inch" : "4inch")
          : formData.formatType,
      };
      
      if (formData.id) {
        return apiRequest("PUT", `/api/bill-templates/${formData.id}`, payload);
      }
      return apiRequest("POST", "/api/bill-templates", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bill-templates"] });
      toast({
        title: "Success",
        description: formData.id ? "Template updated successfully" : "Template saved successfully",
      });
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/bill-templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bill-templates"] });
      toast({
        title: "Success",
        description: "Template deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData(defaultFormData);
  };

  const loadTemplate = (template: BillTemplate) => {
    setFormData({
      id: template.id,
      name: template.name,
      formatType: template.formatType || "A4",
      assignedTo: template.assignedTo || "none",
      logoUrl: template.logoUrl || "",
      headerText: template.headerText || "",
      footerText: template.footerText || "",
      showTaxBreakup: template.showTaxBreakup,
      showHsnCode: template.showHsnCode,
      showItemCode: template.showItemCode,
      showOutstandingDefault: template.showOutstandingDefault,
      showCashReturn: template.showCashReturn,
      showPartyBalance: template.showPartyBalance || false,
      showBankDetails: template.showBankDetails || false,
      enableTamilPrint: template.enableTamilPrint || false,
      bankDetails: template.bankDetails || "",
      termsAndConditions: template.termsAndConditions || "",
      paperSize: template.paperSize,
      fontSize: template.fontSize,
      isDefault: template.isDefault,
    });
    
    if (template.formatType?.startsWith("thermal")) {
      setActiveTab("thermal");
    } else {
      setActiveTab("standard");
    }
  };

  const getAssignmentBadge = (assignedTo: string | null) => {
    if (!assignedTo) return null;
    const option = ASSIGNMENT_OPTIONS.find(o => o.value === assignedTo);
    return option ? (
      <Badge variant="secondary" className="ml-2">
        {option.label}
      </Badge>
    ) : null;
  };

  const getFormatBadge = (formatType: string) => {
    const format = FORMAT_TYPES.find(f => f.value === formatType);
    return format ? format.label : formatType;
  };

  const [selectedFormat, setSelectedFormat] = useState<string>("A4");
  
  const standardTemplates = templates?.filter(t => !t.formatType?.startsWith("thermal")) || [];
  const thermalTemplates = templates?.filter(t => t.formatType?.startsWith("thermal")) || [];
  const filteredTemplates = selectedFormat.startsWith("thermal") 
    ? thermalTemplates 
    : standardTemplates;

  const isThermal = formData.formatType.startsWith("thermal");

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Bill Settings</h1>
        <p className="text-muted-foreground mt-2">
          All printer formats, templates, and quick print settings in one place
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-1">
          <TabsTrigger value="standard" data-testid="tab-standard">
            <FileText className="mr-2 h-4 w-4" />
            Bill Settings - Templates & Quick Print
          </TabsTrigger>
        </TabsList>

        <TabsContent value="standard" className="mt-6">
          <div className="space-y-6">
            {/* Format Selector */}
            <Card>
              <CardHeader>
                <CardTitle>Select Printer Format</CardTitle>
                <CardDescription>Choose format to create or manage templates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {FORMAT_TYPES.map((fmt) => (
                    <button
                      key={fmt.value}
                      onClick={() => {
                        setSelectedFormat(fmt.value);
                        setFormData({ ...formData, formatType: fmt.value });
                      }}
                      className={`p-3 rounded-lg border-2 transition ${
                        selectedFormat === fmt.value
                          ? "border-primary bg-primary/5"
                          : "border-muted hover:border-primary/50"
                      }`}
                      data-testid={`button-format-${fmt.value}`}
                    >
                      <div className="font-medium text-sm">{fmt.label}</div>
                      <div className="text-xs text-muted-foreground">{fmt.description}</div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Template Creation & Management */}
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  {formData.id ? "Edit Template" : `Create ${selectedFormat} Template`}
                </CardTitle>
                <CardDescription>
                  Configure layout and display options
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Template Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g., GST Invoice A4"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      data-testid="input-template-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="formatType">Paper Format</Label>
                    <Select
                      value={formData.formatType}
                      onValueChange={(value) => {
                        setFormData({ ...formData, formatType: value });
                        setSelectedFormat(value);
                      }}
                    >
                      <SelectTrigger id="formatType" data-testid="select-format-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FORMAT_TYPES.map((fmt) => (
                          <SelectItem key={fmt.value} value={fmt.value}>
                            {fmt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assignedTo">Assign to Transaction Type</Label>
                  <Select
                    value={formData.assignedTo}
                    onValueChange={(value) => setFormData({ ...formData, assignedTo: value })}
                  >
                    <SelectTrigger id="assignedTo" data-testid="select-assigned-to">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ASSIGNMENT_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <LogoUploader
                  currentLogoUrl={formData.logoUrl}
                  onLogoChange={(logoUrl) => setFormData({ ...formData, logoUrl })}
                />

                <div className="space-y-2">
                  <Label htmlFor="headerText">Header Text (Company Info)</Label>
                  <Textarea
                    id="headerText"
                    placeholder="Company Name&#10;Address, City&#10;GSTIN: XXXXXXXXXXXX&#10;Phone: XXXXXXXXXX"
                    value={formData.headerText}
                    onChange={(e) => setFormData({ ...formData, headerText: e.target.value })}
                    rows={4}
                    data-testid="input-header-text"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bankDetails">Bank Details (Optional)</Label>
                    <Textarea
                      id="bankDetails"
                      placeholder="Bank: XXX&#10;A/C: XXXXX&#10;IFSC: XXXXX"
                      value={formData.bankDetails}
                      onChange={(e) => setFormData({ ...formData, bankDetails: e.target.value })}
                      rows={3}
                      data-testid="input-bank-details"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="termsAndConditions">Terms & Conditions</Label>
                    <Textarea
                      id="termsAndConditions"
                      placeholder="1. Goods once sold...&#10;2. Subject to jurisdiction..."
                      value={formData.termsAndConditions}
                      onChange={(e) => setFormData({ ...formData, termsAndConditions: e.target.value })}
                      rows={3}
                      data-testid="input-terms"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="footerText">Footer Text</Label>
                  <Textarea
                    id="footerText"
                    placeholder="Thank you for your business!"
                    value={formData.footerText}
                    onChange={(e) => setFormData({ ...formData, footerText: e.target.value })}
                    rows={2}
                    data-testid="input-footer-text"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fontSize">Font Size</Label>
                  <Select
                    value={formData.fontSize.toString()}
                    onValueChange={(value) => setFormData({ ...formData, fontSize: parseInt(value) })}
                  >
                    <SelectTrigger id="fontSize" data-testid="select-font-size">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="8">Small (8pt)</SelectItem>
                      <SelectItem value="9">Medium-Small (9pt)</SelectItem>
                      <SelectItem value="10">Medium (10pt)</SelectItem>
                      <SelectItem value="11">Medium-Large (11pt)</SelectItem>
                      <SelectItem value="12">Large (12pt)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3 pt-2">
                  <Label>Display Options</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="showTaxBreakup" className="font-normal">Tax Breakup (CGST/SGST)</Label>
                      <Switch
                        id="showTaxBreakup"
                        checked={formData.showTaxBreakup}
                        onCheckedChange={(checked) => setFormData({ ...formData, showTaxBreakup: checked })}
                        data-testid="switch-tax-breakup"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="showHsnCode" className="font-normal">HSN Code</Label>
                      <Switch
                        id="showHsnCode"
                        checked={formData.showHsnCode}
                        onCheckedChange={(checked) => setFormData({ ...formData, showHsnCode: checked })}
                        data-testid="switch-hsn-code"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="showItemCode" className="font-normal">Item Code</Label>
                      <Switch
                        id="showItemCode"
                        checked={formData.showItemCode}
                        onCheckedChange={(checked) => setFormData({ ...formData, showItemCode: checked })}
                        data-testid="switch-item-code"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="showPartyBalance" className="font-normal">Party Balance</Label>
                      <Switch
                        id="showPartyBalance"
                        checked={formData.showPartyBalance}
                        onCheckedChange={(checked) => setFormData({ ...formData, showPartyBalance: checked })}
                        data-testid="switch-party-balance"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="showBankDetails" className="font-normal">Bank Details</Label>
                      <Switch
                        id="showBankDetails"
                        checked={formData.showBankDetails}
                        onCheckedChange={(checked) => setFormData({ ...formData, showBankDetails: checked })}
                        data-testid="switch-bank-details"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="showOutstandingDefault" className="font-normal">Outstanding (B2B)</Label>
                      <Switch
                        id="showOutstandingDefault"
                        checked={formData.showOutstandingDefault}
                        onCheckedChange={(checked) => setFormData({ ...formData, showOutstandingDefault: checked })}
                        data-testid="switch-outstanding"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="enableTamilPrint" className="font-normal">தமிழ் Tamil Print</Label>
                      <Switch
                        id="enableTamilPrint"
                        checked={formData.enableTamilPrint}
                        onCheckedChange={(checked) => setFormData({ ...formData, enableTamilPrint: checked })}
                        data-testid="switch-tamil-print"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={() => saveMutation.mutate()}
                    disabled={saveMutation.isPending || !formData.name}
                    data-testid="button-save-template"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {saveMutation.isPending ? "Saving..." : formData.id ? "Update Template" : "Save Template"}
                  </Button>
                  <Button variant="outline" onClick={() => setShowPreview(true)} data-testid="button-preview">
                    <Eye className="mr-2 h-4 w-4" />
                    Preview
                  </Button>
                  {formData.id && (
                    <Button variant="ghost" onClick={resetForm}>
                      Cancel Edit
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Saved A4/B4 Templates
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading...</div>
                ) : standardTemplates.length > 0 ? (
                  <div className="space-y-2">
                    {standardTemplates.map((template) => (
                      <div
                        key={template.id}
                        className="flex items-center justify-between p-3 border rounded-md hover-elevate"
                      >
                        <div>
                          <div className="font-medium flex items-center flex-wrap gap-1">
                            {template.name}
                            {getAssignmentBadge(template.assignedTo)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {getFormatBadge(template.formatType)} • Font: {template.fontSize}pt
                            {template.isDefault && " • Default"}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => loadTemplate(template)}
                            data-testid={`button-edit-${template.id}`}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setDeleteConfirm(template.id)}
                            data-testid={`button-delete-${template.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No templates saved yet. Create one to get started.
                  </p>
                )}
              </CardContent>
            </Card>
            </div>

            {/* Quick Print Settings - MERGED INTO SAME SCREEN */}
            <PrintSettingsTab templates={templates || []} />
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className={isThermal ? "max-w-sm" : "max-w-2xl"}>
          <DialogHeader>
            <DialogTitle>Bill Preview - {formData.formatType}</DialogTitle>
          </DialogHeader>
          {isThermal ? (
            <div
              className="border rounded-lg p-4 bg-white text-black mx-auto"
              style={{
                width: formData.formatType === "thermal_3inch" ? "80mm" : "112mm",
                fontSize: `${formData.fontSize}px`,
                fontFamily: "monospace",
              }}
            >
              {formData.logoUrl && (
                <div className="text-center mb-2">
                  <img
                    src={formData.logoUrl}
                    alt="Company Logo"
                    className="mx-auto max-h-12 object-contain"
                  />
                </div>
              )}
              <div className="text-center space-y-0.5">
                {formData.headerText?.split("\n").map((line, i) => (
                  <div key={i} className={i === 0 ? "font-bold" : ""}>{line}</div>
                ))}
              </div>
              <div className="border-t border-dashed border-black my-2" />
              <div className="text-xs">
                <div className="flex justify-between"><span>Date:</span><span>29/11/2025</span></div>
                <div className="flex justify-between"><span>Bill No:</span><span>1001</span></div>
              </div>
              <div className="border-t border-dashed border-black my-2" />
              <div className="text-xs space-y-1">
                <div className="flex justify-between"><span>1x Sample Item</span><span>₹100.00</span></div>
                {formData.showHsnCode && <div className="opacity-70">HSN: 1234</div>}
              </div>
              <div className="border-t border-dashed border-black my-2" />
              <div className="text-xs space-y-0.5">
                <div className="flex justify-between"><span>Subtotal:</span><span>₹100.00</span></div>
                {formData.showTaxBreakup && (
                  <>
                    <div className="flex justify-between"><span>CGST 9%:</span><span>₹9.00</span></div>
                    <div className="flex justify-between"><span>SGST 9%:</span><span>₹9.00</span></div>
                  </>
                )}
                <div className="flex justify-between font-bold"><span>Total:</span><span>₹118.00</span></div>
                {formData.showCashReturn && (
                  <>
                    <div className="flex justify-between"><span>Cash:</span><span>₹120.00</span></div>
                    <div className="flex justify-between"><span>Return:</span><span>₹2.00</span></div>
                  </>
                )}
              </div>
              <div className="border-t border-dashed border-black my-2" />
              <div className="text-center text-xs">
                {formData.footerText?.split("\n").map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
              </div>
            </div>
          ) : (
            <div
              className="border rounded-lg p-6 bg-white text-black"
              style={{ fontSize: `${formData.fontSize}px` }}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  {formData.logoUrl && (
                    <img src={formData.logoUrl} alt="Logo" className="max-h-16 mb-2" />
                  )}
                  <div className="whitespace-pre-line font-semibold">{formData.headerText}</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">TAX INVOICE</div>
                  <div>Invoice No: INV-1001</div>
                  <div>Date: 29/11/2025</div>
                </div>
              </div>
              
              <div className="border-t border-b py-2 mb-4">
                <div className="font-semibold">Bill To:</div>
                <div>Customer Name</div>
                <div>Address, City - 400001</div>
                <div>GSTIN: 27XXXXXXXXXXXXX</div>
              </div>

              <table className="w-full text-sm mb-4">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-1">#</th>
                    <th className="text-left py-1">Item</th>
                    {formData.showHsnCode && <th className="text-left py-1">HSN</th>}
                    <th className="text-right py-1">Qty</th>
                    <th className="text-right py-1">Rate</th>
                    <th className="text-right py-1">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-1">1</td>
                    <td className="py-1">Sample Item</td>
                    {formData.showHsnCode && <td className="py-1">1234</td>}
                    <td className="text-right py-1">1</td>
                    <td className="text-right py-1">₹100.00</td>
                    <td className="text-right py-1">₹100.00</td>
                  </tr>
                </tbody>
              </table>

              <div className="flex justify-end">
                <div className="w-64 text-sm">
                  <div className="flex justify-between py-1"><span>Subtotal:</span><span>₹100.00</span></div>
                  {formData.showTaxBreakup && (
                    <>
                      <div className="flex justify-between py-1"><span>CGST 9%:</span><span>₹9.00</span></div>
                      <div className="flex justify-between py-1"><span>SGST 9%:</span><span>₹9.00</span></div>
                    </>
                  )}
                  <div className="flex justify-between py-1 font-bold border-t"><span>Grand Total:</span><span>₹118.00</span></div>
                </div>
              </div>

              {formData.showBankDetails && formData.bankDetails && (
                <div className="mt-4 text-sm">
                  <div className="font-semibold">Bank Details:</div>
                  <div className="whitespace-pre-line">{formData.bankDetails}</div>
                </div>
              )}

              {formData.termsAndConditions && (
                <div className="mt-4 text-xs text-muted-foreground">
                  <div className="font-semibold">Terms & Conditions:</div>
                  <div className="whitespace-pre-line">{formData.termsAndConditions}</div>
                </div>
              )}

              {formData.footerText && (
                <div className="mt-4 text-center text-sm border-t pt-2">
                  {formData.footerText}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteConfirm !== null} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the template.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteConfirm) {
                  deleteMutation.mutate(deleteConfirm);
                  setDeleteConfirm(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
