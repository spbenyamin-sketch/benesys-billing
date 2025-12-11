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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Settings, Save, Eye, FileText, Trash2, Edit2, Zap } from "lucide-react";
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

export default function BillSettings() {
  const { toast } = useToast();
  const [showPreview, setShowPreview] = useState(false);
  const [formData, setFormData] = useState(defaultFormData);
  const [selectedFormat, setSelectedFormat] = useState<string>("A4");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<number | null>(null);
  const { settings: hookSettings } = usePrintSettingsHook();
  const [settings, setSettings] = useState<PrintSettings>(hookSettings);

  useEffect(() => {
    setSettings(hookSettings);
  }, [hookSettings]);

  const { data: templates, isLoading } = useQuery<BillTemplate[]>({
    queryKey: ["/api/bill-templates"],
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const method = formData.id ? "PATCH" : "POST";
      const endpoint = formData.id ? `/api/bill-templates/${formData.id}` : "/api/bill-templates";
      const response = await apiRequest(method, endpoint, formData);
      if (!response.ok) throw new Error("Failed to save template");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bill-templates"] });
      resetForm();
      toast({ title: "Success", description: formData.id ? "Template updated" : "Template created" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save template", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/bill-templates/${id}`);
      if (!response.ok) throw new Error("Failed to delete");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bill-templates"] });
      toast({ title: "Deleted", description: "Template removed" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData(defaultFormData);
    setSelectedFormat("A4");
  };

  const handleEdit = (template: BillTemplate) => {
    setFormData({
      ...template,
      assignedTo: template.assignedTo || "none"
    });
    setSelectedFormat(template.formatType);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleQuickPrintSave = () => {
    savePrintSettings(settings);
    toast({ title: "Saved", description: "Quick print settings saved" });
  };

  const standardTemplates = templates?.filter(t => !t.formatType?.startsWith("thermal")) || [];
  const thermalTemplates = templates?.filter(t => t.formatType?.startsWith("thermal")) || [];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Bill Settings</h1>
        <p className="text-muted-foreground mt-2">Configure printing, templates, and bill formats</p>
      </div>

      {/* QUICK PRINT SECTION - SIMPLE & CLEAN */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Quick Print Configuration
          </CardTitle>
          <CardDescription>Simple one-step printing setup</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Auto Print Toggle */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <Label className="font-medium text-sm">Auto Print After Save</Label>
                <p className="text-xs text-muted-foreground">Print automatically when bill is saved</p>
              </div>
              <Switch
                checked={settings.autoPrintB2C}
                onCheckedChange={(checked) => {
                  const newSettings = {
                    ...settings,
                    autoPrintB2B: checked,
                    autoPrintB2C: checked,
                    autoPrintEstimate: checked,
                    autoPrintCreditNote: checked,
                    autoPrintDebitNote: checked,
                  };
                  setSettings(newSettings);
                }}
              />
            </div>

            {/* Direct Print Toggle */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <Label className="font-medium text-sm">Direct Print Mode</Label>
                <p className="text-xs text-muted-foreground">Skip preview, send directly to printer</p>
              </div>
              <Switch
                checked={settings.directPrintB2C}
                onCheckedChange={(checked) => {
                  const newSettings = {
                    ...settings,
                    directPrintB2B: checked,
                    directPrintB2C: checked,
                    directPrintEstimate: checked,
                    directPrintCreditNote: checked,
                    directPrintDebitNote: checked,
                  };
                  setSettings(newSettings);
                }}
              />
            </div>

            {/* Print Copies Selector */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Print Copies</Label>
              <Select
                value={settings.printCopiesB2C.toString()}
                onValueChange={(value) => {
                  const copies = parseInt(value);
                  const newSettings = {
                    ...settings,
                    printCopiesB2B: copies,
                    printCopiesB2C: copies,
                    printCopiesEstimate: copies,
                    printCopiesCreditNote: copies,
                    printCopiesDebitNote: copies,
                  };
                  setSettings(newSettings);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map(n => (
                    <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={handleQuickPrintSave} className="w-full">
            <Save className="mr-2 h-4 w-4" />
            Save Quick Print Settings
          </Button>
        </CardContent>
      </Card>

      {/* TEMPLATES SECTION */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Create/Edit Template */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              {formData.id ? "Edit Template" : "Create Bill Template"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 max-h-[600px] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Template Name</Label>
                <Input
                  placeholder="e.g., GST Invoice A4"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Paper Format</Label>
                <Select
                  value={formData.formatType}
                  onValueChange={(value) => {
                    setFormData({ ...formData, formatType: value });
                    setSelectedFormat(value);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FORMAT_TYPES.map((fmt) => (
                      <SelectItem key={fmt.value} value={fmt.value}>{fmt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Assign to Bill Type</Label>
              <Select value={formData.assignedTo} onValueChange={(value) => setFormData({ ...formData, assignedTo: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ASSIGNMENT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <LogoUploader
              currentLogoUrl={formData.logoUrl}
              onLogoChange={(logoUrl) => setFormData({ ...formData, logoUrl })}
            />

            <div className="space-y-2">
              <Label>Header Text</Label>
              <Textarea
                placeholder="Company Name&#10;Address, City"
                value={formData.headerText}
                onChange={(e) => setFormData({ ...formData, headerText: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Footer Text</Label>
              <Textarea
                placeholder="Thank you for your business!"
                value={formData.footerText}
                onChange={(e) => setFormData({ ...formData, footerText: e.target.value })}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Font Size</Label>
              <Select value={formData.fontSize.toString()} onValueChange={(value) => setFormData({ ...formData, fontSize: parseInt(value) })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="8">Small (8pt)</SelectItem>
                  <SelectItem value="10">Medium (10pt)</SelectItem>
                  <SelectItem value="12">Large (12pt)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Display Options</Label>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="font-normal text-sm">Tax Breakup</Label>
                  <Switch checked={formData.showTaxBreakup} onCheckedChange={(checked) => setFormData({ ...formData, showTaxBreakup: checked })} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="font-normal text-sm">HSN Code</Label>
                  <Switch checked={formData.showHsnCode} onCheckedChange={(checked) => setFormData({ ...formData, showHsnCode: checked })} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="font-normal text-sm">Item Code</Label>
                  <Switch checked={formData.showItemCode} onCheckedChange={(checked) => setFormData({ ...formData, showItemCode: checked })} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="font-normal text-sm">Party Balance</Label>
                  <Switch checked={formData.showPartyBalance} onCheckedChange={(checked) => setFormData({ ...formData, showPartyBalance: checked })} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="font-normal text-sm">Bank Details</Label>
                  <Switch checked={formData.showBankDetails} onCheckedChange={(checked) => setFormData({ ...formData, showBankDetails: checked })} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="font-normal text-sm">Tamil Print</Label>
                  <Switch checked={formData.enableTamilPrint} onCheckedChange={(checked) => setFormData({ ...formData, enableTamilPrint: checked })} />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !formData.name} size="sm">
                <Save className="mr-2 h-4 w-4" />
                {formData.id ? "Update" : "Create"}
              </Button>
              <Button variant="outline" onClick={() => setShowPreview(true)} size="sm">
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </Button>
              {formData.id && <Button variant="ghost" onClick={resetForm} size="sm">Cancel</Button>}
            </div>
          </CardContent>
        </Card>

        {/* Saved Templates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Saved Templates ({templates?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
            {isLoading ? (
              <p className="text-muted-foreground">Loading templates...</p>
            ) : !templates || templates.length === 0 ? (
              <p className="text-muted-foreground text-sm">No templates yet. Create one to get started!</p>
            ) : (
              <>
                {/* Standard Format Templates */}
                {standardTemplates.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">STANDARD FORMATS</p>
                    <div className="space-y-2">
                      {standardTemplates.map((t) => (
                        <div key={t.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{t.name}</p>
                            <p className="text-xs text-muted-foreground">{FORMAT_TYPES.find(f => f.value === t.formatType)?.label}</p>
                            {t.assignedTo && <Badge variant="secondary" className="text-xs mt-1">{ASSIGNMENT_OPTIONS.find(o => o.value === t.assignedTo)?.label}</Badge>}
                          </div>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" onClick={() => handleEdit(t)}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => { setTemplateToDelete(t.id); setShowDeleteConfirm(true); }}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Thermal Templates */}
                {thermalTemplates.length > 0 && (
                  <div className="pt-4">
                    <p className="text-xs font-medium text-muted-foreground mb-2">THERMAL FORMATS</p>
                    <div className="space-y-2">
                      {thermalTemplates.map((t) => (
                        <div key={t.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{t.name}</p>
                            <p className="text-xs text-muted-foreground">{FORMAT_TYPES.find(f => f.value === t.formatType)?.label}</p>
                            {t.assignedTo && <Badge variant="secondary" className="text-xs mt-1">{ASSIGNMENT_OPTIONS.find(o => o.value === t.assignedTo)?.label}</Badge>}
                          </div>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" onClick={() => handleEdit(t)}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => { setTemplateToDelete(t.id); setShowDeleteConfirm(true); }}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (templateToDelete) {
                deleteMutation.mutate(templateToDelete);
                setShowDeleteConfirm(false);
              }
            }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
