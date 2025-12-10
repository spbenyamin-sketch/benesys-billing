import { useState, useEffect, useCallback, useSyncExternalStore } from "react";

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

const PRINT_SETTINGS_KEY = "printSettings";
const PRINT_SETTINGS_EVENT = "printSettingsChanged";

function getPrintSettingsFromStorage(): PrintSettings {
  try {
    const saved = localStorage.getItem(PRINT_SETTINGS_KEY);
    if (!saved) return DEFAULT_PRINT_SETTINGS;
    const parsed = JSON.parse(saved);
    if (typeof parsed !== "object" || parsed === null) {
      return DEFAULT_PRINT_SETTINGS;
    }
    return { ...DEFAULT_PRINT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_PRINT_SETTINGS;
  }
}

export function savePrintSettings(settings: PrintSettings): void {
  localStorage.setItem(PRINT_SETTINGS_KEY, JSON.stringify(settings));
  window.dispatchEvent(new CustomEvent(PRINT_SETTINGS_EVENT));
}

export function usePrintSettings() {
  const [settings, setSettings] = useState<PrintSettings>(getPrintSettingsFromStorage);

  useEffect(() => {
    const handleChange = () => {
      setSettings(getPrintSettingsFromStorage());
    };

    window.addEventListener("storage", handleChange);
    window.addEventListener(PRINT_SETTINGS_EVENT, handleChange);
    
    return () => {
      window.removeEventListener("storage", handleChange);
      window.removeEventListener(PRINT_SETTINGS_EVENT, handleChange);
    };
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

  return {
    settings,
    shouldAutoPrint,
    getPrintCopies,
    shouldDirectPrint,
    showConfirmation: settings.showPrintConfirmation,
    enableTamilPrint: settings.enableTamilPrint,
  };
}
