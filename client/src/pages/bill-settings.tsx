import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Settings, Save, Printer, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LogoUploader } from "@/components/LogoUploader";

interface BillTemplate {
  id: number;
  name: string;
  logoUrl: string | null;
  headerText: string | null;
  footerText: string | null;
  showTaxBreakup: boolean;
  showHsnCode: boolean;
  showItemCode: boolean;
  paperSize: string;
  fontSize: number;
  isDefault: boolean;
}

export default function BillSettings() {
  const { toast } = useToast();
  const [showPreview, setShowPreview] = useState(false);
  const [formData, setFormData] = useState({
    name: "Thermal Printer 3 inch",
    logoUrl: "",
    headerText: "",
    footerText: "Thank you for your business!\nVisit Again",
    showTaxBreakup: true,
    showHsnCode: true,
    showItemCode: false,
    paperSize: "3inch",
    fontSize: 10,
    isDefault: true,
  });

  const { data: templates } = useQuery<BillTemplate[]>({
    queryKey: ["/api/bill-templates"],
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/bill-templates", formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bill-templates"] });
      toast({
        title: "Success",
        description: "Bill template saved successfully",
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

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Bill Settings</h1>
        <p className="text-muted-foreground mt-2">
          Customize invoice printing for thermal printers (3 inch / 4 inch)
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Template Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                data-testid="input-template-name"
              />
            </div>

            <LogoUploader
              currentLogoUrl={formData.logoUrl}
              onLogoChange={(logoUrl) =>
                setFormData({ ...formData, logoUrl })
              }
            />

            <div className="space-y-2">
              <Label htmlFor="paperSize">Paper Size</Label>
              <Select
                value={formData.paperSize}
                onValueChange={(value) =>
                  setFormData({ ...formData, paperSize: value })
                }
              >
                <SelectTrigger id="paperSize" data-testid="select-paper-size">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3inch">3 Inch (80mm)</SelectItem>
                  <SelectItem value="4inch">4 Inch (112mm)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fontSize">Font Size</Label>
              <Select
                value={formData.fontSize.toString()}
                onValueChange={(value) =>
                  setFormData({ ...formData, fontSize: parseInt(value) })
                }
              >
                <SelectTrigger id="fontSize" data-testid="select-font-size">
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
              <Label htmlFor="headerText">Header Text (Company Info)</Label>
              <Textarea
                id="headerText"
                placeholder="Store Name&#10;Address&#10;Phone, GST No"
                value={formData.headerText}
                onChange={(e) =>
                  setFormData({ ...formData, headerText: e.target.value })
                }
                rows={4}
                data-testid="input-header-text"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="footerText">Footer Text</Label>
              <Textarea
                id="footerText"
                placeholder="Thank you for your business!"
                value={formData.footerText}
                onChange={(e) =>
                  setFormData({ ...formData, footerText: e.target.value })
                }
                rows={3}
                data-testid="input-footer-text"
              />
            </div>

            <div className="space-y-3">
              <Label>Display Options</Label>
              <div className="flex items-center justify-between">
                <Label htmlFor="showTaxBreakup" className="font-normal">
                  Show Tax Breakup (CGST/SGST)
                </Label>
                <Switch
                  id="showTaxBreakup"
                  checked={formData.showTaxBreakup}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, showTaxBreakup: checked })
                  }
                  data-testid="switch-tax-breakup"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="showHsnCode" className="font-normal">
                  Show HSN Code
                </Label>
                <Switch
                  id="showHsnCode"
                  checked={formData.showHsnCode}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, showHsnCode: checked })
                  }
                  data-testid="switch-hsn-code"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="showItemCode" className="font-normal">
                  Show Item Code
                </Label>
                <Switch
                  id="showItemCode"
                  checked={formData.showItemCode}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, showItemCode: checked })
                  }
                  data-testid="switch-item-code"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="isDefault" className="font-normal">
                  Set as Default Template
                </Label>
                <Switch
                  id="isDefault"
                  checked={formData.isDefault}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isDefault: checked })
                  }
                  data-testid="switch-default"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
                data-testid="button-save-template"
              >
                <Save className="mr-2 h-4 w-4" />
                {saveMutation.isPending ? "Saving..." : "Save Template"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowPreview(true)}
                data-testid="button-preview"
              >
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5" />
              Saved Templates
            </CardTitle>
          </CardHeader>
          <CardContent>
            {templates && templates.length > 0 ? (
              <div className="space-y-2">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="flex items-center justify-between p-3 border rounded-md"
                  >
                    <div>
                      <div className="font-medium">{template.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {template.paperSize} • Font: {template.fontSize}pt
                        {template.isDefault && " • Default"}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setFormData({
                          name: template.name,
                          logoUrl: template.logoUrl || "",
                          headerText: template.headerText || "",
                          footerText: template.footerText || "",
                          showTaxBreakup: template.showTaxBreakup,
                          showHsnCode: template.showHsnCode,
                          showItemCode: template.showItemCode,
                          paperSize: template.paperSize,
                          fontSize: template.fontSize,
                          isDefault: template.isDefault,
                        });
                      }}
                      data-testid={`button-load-${template.id}`}
                    >
                      Load
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No templates saved yet
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Bill Preview - {formData.paperSize}</DialogTitle>
          </DialogHeader>
          <div
            className="border rounded-lg p-4 bg-white text-black"
            style={{
              width: formData.paperSize === "3inch" ? "80mm" : "112mm",
              fontSize: `${formData.fontSize}px`,
              fontFamily: "monospace",
            }}
          >
            {formData.logoUrl && (
              <div className="text-center mb-2">
                <img
                  src={formData.logoUrl}
                  alt="Company Logo"
                  className="mx-auto max-h-16 object-contain"
                  data-testid="img-preview-logo"
                />
              </div>
            )}
            <div className="text-center space-y-1">
              {formData.headerText?.split("\n").map((line, i) => (
                <div key={i} className="font-semibold">
                  {line}
                </div>
              ))}
            </div>
            <div className="border-t border-dashed border-black my-2" />
            <div className="text-xs">
              <div className="flex justify-between">
                <span>Date:</span>
                <span>23/11/2025</span>
              </div>
              <div className="flex justify-between">
                <span>Bill No:</span>
                <span>1001</span>
              </div>
            </div>
            <div className="border-t border-dashed border-black my-2" />
            <div className="text-xs space-y-1">
              <div className="font-semibold">Item Name</div>
              <div className="flex justify-between">
                <span>1x Sample Item</span>
                <span>₹100.00</span>
              </div>
              {formData.showHsnCode && (
                <div className="text-xs opacity-70">HSN: 1234</div>
              )}
            </div>
            <div className="border-t border-dashed border-black my-2" />
            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₹100.00</span>
              </div>
              {formData.showTaxBreakup && (
                <>
                  <div className="flex justify-between">
                    <span>CGST 9%:</span>
                    <span>₹9.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SGST 9%:</span>
                    <span>₹9.00</span>
                  </div>
                </>
              )}
              <div className="flex justify-between font-semibold">
                <span>Total:</span>
                <span>₹118.00</span>
              </div>
            </div>
            <div className="border-t border-dashed border-black my-2" />
            <div className="text-center text-xs space-y-1">
              {formData.footerText?.split("\n").map((line, i) => (
                <div key={i}>{line}</div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
