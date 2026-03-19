import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initGlobalTabNavigation } from "./hooks/useTabNavigation";

// Initialize global Tab key navigation + auto-select for all inputs
initGlobalTabNavigation();

// Register Service Worker for PWA support
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch((error) => {
    console.log("Service Worker registration failed:", error);
  });
}

createRoot(document.getElementById("root")!).render(<App />);
