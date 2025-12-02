import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Keyboard, ArrowRight, Search, CheckCircle2 } from "lucide-react";

export function KeyboardShortcutsGuide() {
  const shortcuts = [
    {
      key: "Enter",
      description: "Move to the next field",
      context: "All forms",
      example: "Date field → Party field"
    },
    {
      key: "Tab",
      description: "Move forward through fields",
      context: "All forms",
      example: "Navigate form fields sequentially"
    },
    {
      key: "Shift + Tab",
      description: "Move backward through fields",
      context: "All forms",
      example: "Go to previous field"
    },
    {
      key: "Type to Search",
      description: "Search party or item by code/name",
      context: "Party & Item fields",
      example: "Type 'P001' or 'Coke' to filter options"
    },
    {
      key: "Auto-Select",
      description: "Text automatically selected when entering field",
      context: "All text input fields",
      example: "Quick replacement of field value"
    }
  ];

  const formFlow = [
    { field: "Invoice Date", action: "Auto-focus on page load", key: "Auto" },
    { field: "Party/Customer", action: "Search by code or name", key: "Type" },
    { field: "Item Selection", action: "Search items", key: "Type" },
    { field: "Quantity", action: "Enter quantity", key: "Enter" },
    { field: "Rate", action: "Enter rate", key: "Enter" },
    { field: "Next Item", action: "Add another item", key: "Tab" }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Visual FoxPro-Style Keyboard Navigation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Keyboard Shortcuts */}
          <div>
            <h3 className="font-semibold mb-4 text-sm">Available Keyboard Shortcuts</h3>
            <div className="space-y-3">
              {shortcuts.map((shortcut, idx) => (
                <div key={idx} className="flex gap-4 p-3 bg-muted rounded-md">
                  <div className="flex-shrink-0">
                    <Badge variant="outline" className="font-mono whitespace-nowrap">
                      {shortcut.key}
                    </Badge>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{shortcut.description}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      <strong>Context:</strong> {shortcut.context}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <strong>Example:</strong> {shortcut.example}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form Flow */}
          <div className="pt-4 border-t">
            <h3 className="font-semibold mb-4 text-sm">Typical Data Entry Flow</h3>
            <div className="space-y-2">
              {formFlow.map((step, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="flex items-center gap-2 flex-1 p-2 bg-background rounded-md">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-sm flex-1">{step.field}</span>
                    <span className="text-xs text-muted-foreground">{step.action}</span>
                  </div>
                  <Badge variant="secondary" className="font-mono text-xs">
                    {step.key}
                  </Badge>
                  {idx < formFlow.length - 1 && (
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div className="pt-4 border-t bg-blue-50 dark:bg-blue-950 rounded-md p-4">
            <h3 className="font-semibold mb-2 text-sm flex items-center gap-2">
              <Search className="h-4 w-4" />
              Pro Tips
            </h3>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Never use mouse - everything is keyboard accessible</li>
              <li>• Searchable fields work with partial code or name matches</li>
              <li>• Auto-selected text means paste-over is fast</li>
              <li>• Press Enter/Tab to move seamlessly between fields</li>
              <li>• Works the same on all forms (B2B, B2C, Estimates, Credit/Debit Notes)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
