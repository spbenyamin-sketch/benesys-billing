/**
 * Global Tab Navigation Hook
 * - Auto-selects text on focus for all number inputs
 * - Tab moves to next focusable field in order
 * - Works across all forms automatically
 */

export function initGlobalTabNavigation() {
  // Auto-select on focus for number inputs
  document.addEventListener('focusin', (e) => {
    const target = e.target as HTMLInputElement;
    if (target.tagName === 'INPUT' && target.type === 'number') {
      setTimeout(() => target.select(), 0);
    }
  });

  // Smart Tab key handler
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;

    const active = document.activeElement as HTMLInputElement;
    if (!active || !['INPUT', 'TEXTAREA', 'SELECT'].includes(active.tagName)) return;

    // Get all focusable inputs in the page, in DOM order
    const allFocusable = Array.from(
      document.querySelectorAll<HTMLElement>(
        'input:not([disabled]):not([type="hidden"]):not([tabindex="-1"]), ' +
        'textarea:not([disabled]):not([tabindex="-1"]), ' +
        'select:not([disabled]):not([tabindex="-1"]), ' +
        'button:not([disabled]):not([tabindex="-1"])'
      )
    ).filter(el => {
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden' && (el as HTMLElement).offsetParent !== null;
    });

    const currentIdx = allFocusable.indexOf(active);
    if (currentIdx === -1) return;

    if (!e.shiftKey) {
      // Forward Tab
      const next = allFocusable[currentIdx + 1];
      if (next) {
        e.preventDefault();
        next.focus();
        if ((next as HTMLInputElement).select) {
          setTimeout(() => (next as HTMLInputElement).select(), 0);
        }
      }
    } else {
      // Shift+Tab - go backwards
      const prev = allFocusable[currentIdx - 1];
      if (prev) {
        e.preventDefault();
        prev.focus();
        if ((prev as HTMLInputElement).select) {
          setTimeout(() => (prev as HTMLInputElement).select(), 0);
        }
      }
    }
  });
}
