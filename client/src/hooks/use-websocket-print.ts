import { useState, useCallback } from "react";
import { apiRequest } from "@/lib/queryClient";
import { usePrintSettings } from "./use-print-settings";

interface PrintResult {
  success: boolean;
  message: string;
}

export function useWebSocketPrint() {
  const [isSending, setIsSending] = useState(false);
  const { settings } = usePrintSettings();

  const sendPrint = useCallback(async (content: string, format: string = "html"): Promise<PrintResult> => {
    if (!settings.enableWebSocketPrint) {
      return { 
        success: false, 
        message: "WebSocket printing is not enabled. Enable it in Bill Settings." 
      };
    }

    setIsSending(true);
    try {
      const response = await apiRequest("POST", "/api/print/send", {
        content,
        format,
        printerName: settings.webSocketPrinterName || null,
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { 
          success: false, 
          message: errorData.message || "Failed to send print command" 
        };
      }

      const data = await response.json();
      return { success: true, message: data.message || "Print sent successfully" };
    } catch (error) {
      console.error("WebSocket print error:", error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : "Failed to send print command" 
      };
    } finally {
      setIsSending(false);
    }
  }, [settings.enableWebSocketPrint, settings.webSocketPrinterName]);

  const checkConnection = useCallback(async (): Promise<{ connected: boolean; clientCount: number }> => {
    try {
      const response = await apiRequest("GET", "/api/print/status");
      if (!response.ok) {
        return { connected: false, clientCount: 0 };
      }
      return await response.json();
    } catch {
      return { connected: false, clientCount: 0 };
    }
  }, []);

  return {
    sendPrint,
    checkConnection,
    isSending,
    isEnabled: settings.enableWebSocketPrint,
  };
}
