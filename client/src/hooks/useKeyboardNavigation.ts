import { useEffect, useRef } from "react";

/**
 * Enhanced Visual FoxPro-style keyboard navigation hook
 * Supports: Enter, Tab, Shift+Tab for seamless form navigation
 * Features: Auto-select text, visual feedback, logical field ordering
 */
export function useKeyboardNavigation(ref: React.RefObject<HTMLElement>) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      
      // Check if key is Tab or Enter
      const isTabKey = e.key === "Tab";
      const isEnterKey = e.key === "Enter";
      
      if (!isTabKey && !isEnterKey) return;
      
      // Don't intercept if modifier keys are pressed (except Shift for Tab)
      if (e.ctrlKey || e.altKey) return;
      
      // Skip if target is a textarea (allow natural Enter/Tab behavior)
      if (target.tagName === "TEXTAREA") return;
      
      // Skip submit buttons and actual buttons on Enter
      if (isEnterKey && (
        target.tagName === "BUTTON" ||
        target.getAttribute("type") === "submit"
      )) {
        return;
      }

      if (!ref.current) return;

      // Get all focusable elements in reading order
      const focusableElements = Array.from(
        ref.current.querySelectorAll(
          'input:not([type="hidden"]):not([disabled]), ' +
          'select:not([disabled]), ' +
          'textarea:not([disabled]), ' +
          'button:not([disabled]):not([type="submit"]), ' +
          '[role="combobox"]:not([disabled]), ' +
          '[role="button"]:not([disabled])'
        )
      ) as HTMLElement[];

      const currentIndex = focusableElements.indexOf(target);
      if (currentIndex === -1) return;

      e.preventDefault();
      
      let nextIndex: number;
      
      if (isEnterKey || (isTabKey && !e.shiftKey)) {
        // Move forward: Enter or Tab
        nextIndex = (currentIndex + 1) % focusableElements.length;
      } else if (isTabKey && e.shiftKey) {
        // Move backward: Shift+Tab
        nextIndex = currentIndex === 0 ? focusableElements.length - 1 : currentIndex - 1;
      } else {
        return;
      }

      const nextElement = focusableElements[nextIndex];
      if (nextElement) {
        nextElement.focus();
        
        // Auto-select text in input/select fields for quick editing
        if (nextElement.tagName === "INPUT") {
          const input = nextElement as HTMLInputElement;
          // Don't select for checkbox/radio
          if (!["checkbox", "radio"].includes(input.type)) {
            input.select();
          }
        } else if (nextElement.tagName === "SELECT") {
          (nextElement as HTMLSelectElement).focus();
        }
      }
    };

    const container = ref.current;
    if (container) {
      container.addEventListener("keydown", handleKeyDown);
      return () => container.removeEventListener("keydown", handleKeyDown);
    }
  }, [ref]);
}
