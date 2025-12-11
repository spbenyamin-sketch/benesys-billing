import { useState, useEffect, useCallback } from "react";
import { apiRequest } from "@/lib/queryClient";

export interface PrintSettings {
  autoPrintB2B: boolean;
  autoPrintB2C: boolean;
  autoPrintEstimate: boolean;
  autoPrintCreditNote: boolean;
  autoPrintDebitNote: boolean;
  printCopiesB2B: number;
  printCopiesB2C: number;
  printCopiesEstimate: number;
  printCopiesCreditNote: number;
  printCopiesDebitNote: number;
  showPrintConfirmation: boolean;
  defaultPrinterName: string;
  enableTamilPrint: boolean;
  directPrintB2B: boolean;
  directPrintB2C: boolean;
  directPrintEstimate: boolean;
  directPrintCreditNote: boolean;
  directPrintDebitNote: boolean;
  enableWebSocketPrint: boolean;
  webSocketPrinterName: string;
}

const DEFAULT_PRINT_SETTINGS: PrintSettings = {
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
  enableTamilPrint: false,
  directPrintB2B: false,
  directPrintB2C: false,
  directPrintEstimate: false,
  directPrintCreditNote: false,
  directPrintDebitNote: false,
  enableWebSocketPrint: false,
  webSocketPrinterName: "",
};

export function usePrintSettings() {
  const [settings, setSettings] = useState<PrintSettings>(DEFAULT_PRINT_SETTINGS);
  const [loading, setLoading] = useState(true);

  // Load settings from server on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await apiRequest("GET", "/api/print-settings");
        const data = await response.json();
        setSettings({ ...DEFAULT_PRINT_SETTINGS, ...data });
      } catch (error) {
        console.error("Failed to load print settings:", error);
        setSettings(DEFAULT_PRINT_SETTINGS);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const shouldAutoPrint = useCallback((billType: string): boolean => {
    switch (billType) {
      case "B2B":
        return settings.autoPrintB2B;
      case "B2C":
        return settings.autoPrintB2C;
      case "EST":
        return settings.autoPrintEstimate;
      case "CN":
        return settings.autoPrintCreditNote;
      case "DN":
        return settings.autoPrintDebitNote;
      default:
        return false;
    }
  }, [settings]);

  const getPrintCopies = useCallback((billType: string): number => {
    switch (billType) {
      case "B2B":
        return settings.printCopiesB2B;
      case "B2C":
        return settings.printCopiesB2C;
      case "EST":
        return settings.printCopiesEstimate;
      case "CN":
        return settings.printCopiesCreditNote;
      case "DN":
        return settings.printCopiesDebitNote;
      default:
        return 1;
    }
  }, [settings]);

  const shouldDirectPrint = useCallback((billType: string): boolean => {
    switch (billType) {
      case "B2B":
        return settings.directPrintB2B;
      case "B2C":
        return settings.directPrintB2C;
      case "EST":
        return settings.directPrintEstimate;
      case "CN":
        return settings.directPrintCreditNote;
      case "DN":
        return settings.directPrintDebitNote;
      default:
        return false;
    }
  }, [settings]);

  const sendDirectPrint = useCallback(async (saleId: number): Promise<boolean> => {
    if (!settings.enableWebSocketPrint) {
      return false;
    }

    try {
      const response = await apiRequest("GET", "/api/print-token");
      const { token } = await response.json();
      const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${wsProtocol}//${window.location.host}/ws/print?token=${token}`;
      const ws = new WebSocket(wsUrl);

      return new Promise((resolve) => {
        ws.onopen = () => {
          ws.send(JSON.stringify({ type: "print", saleId }));
          setTimeout(() => ws.close(), 1000);
          resolve(true);
        };
        ws.onerror = () => resolve(false);
        setTimeout(() => {
          if (ws.readyState === WebSocket.OPEN) ws.close();
        }, 5000);
      });
    } catch {
      return false;
    }
  }, [settings.enableWebSocketPrint]);

  return {
    settings,
    setSettings,
    loading,
    shouldAutoPrint,
    getPrintCopies,
    shouldDirectPrint,
    sendDirectPrint,
    showConfirmation: settings.showPrintConfirmation,
    enableTamilPrint: settings.enableTamilPrint,
  };
}

export async function savePrintSettings(settings: PrintSettings): Promise<void> {
  try {
    await apiRequest("POST", "/api/print-settings", settings);
  } catch (error) {
    console.error("Failed to save print settings:", error);
    throw error;
  }
}
