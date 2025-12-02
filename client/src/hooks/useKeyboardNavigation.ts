import { useEffect, useRef } from "react";

/**
 * Hook to enable keyboard navigation (Enter key moves to next field)
 * Attach to form container or individual inputs
 */
export function useKeyboardNavigation(ref: React.RefObject<HTMLElement>) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || e.shiftKey || e.ctrlKey || e.altKey) return;

      const target = e.target as HTMLElement;
      
      // Skip if target is a textarea or button
      if (
        target.tagName === "TEXTAREA" ||
        target.tagName === "BUTTON" ||
        target.getAttribute("type") === "submit"
      ) {
        return;
      }

      if (!ref.current) return;

      const focusableElements = Array.from(
        ref.current.querySelectorAll(
          'input:not([type="hidden"]), select, textarea, button, [role="combobox"], [role="button"]'
        )
      ) as HTMLElement[];

      const currentIndex = focusableElements.indexOf(target);
      if (currentIndex === -1) return;

      e.preventDefault();
      const nextIndex = (currentIndex + 1) % focusableElements.length;
      const nextElement = focusableElements[nextIndex];

      if (nextElement) {
        nextElement.focus();
        // Select text in input fields for better UX
        if (nextElement.tagName === "INPUT") {
          (nextElement as HTMLInputElement).select();
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
