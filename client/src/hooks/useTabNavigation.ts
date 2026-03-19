/**
 * Global Keyboard Navigation for BeneSys
 * 
 * Behaviour:
 * - Tab / Enter  → move to NEXT focusable field
 * - Shift+Tab    → move to PREVIOUS field
 * - Click / Tab into number field → auto-select all text
 * - Works on every page automatically (initialized once in main.tsx)
 * 
 * Flow in sales forms:
 * Date → Customer → [Tax Type buttons] → Item Search → Qty → Rate → Disc% → next row ...
 */

// Buttons that should be SKIPPED during Tab/Enter navigation
const SKIP_TESTIDS = [
  'button-remove-',
  'button-clear-party',
  'button-save-',
  'button-print',
  'button-barcode-search',
  'button-toggle-password',
  'button-toggle-confirm-password',
  'button-setup',
];

function shouldSkip(el: HTMLElement): boolean {
  const testId = el.getAttribute('data-testid') || '';
  return SKIP_TESTIDS.some(skip => testId.startsWith(skip));
}

function getFocusable(): HTMLElement[] {
  return Array.from(
    document.querySelectorAll<HTMLElement>(
      'input:not([disabled]):not([type="hidden"]):not([tabindex="-1"]), ' +
      'textarea:not([disabled]):not([tabindex="-1"]), ' +
      'select:not([disabled]):not([tabindex="-1"]), ' +
      'button:not([disabled]):not([tabindex="-1"])'
    )
  ).filter(el => {
    if (window.getComputedStyle(el).display === 'none') return false;
    if (window.getComputedStyle(el).visibility === 'hidden') return false;
    if ((el as HTMLElement).offsetParent === null) return false;
    if (shouldSkip(el)) return false;
    return true;
  });
}

function focusNext(current: HTMLElement, reverse = false) {
  const all = getFocusable();
  const idx = all.indexOf(current);
  if (idx === -1) return;
  const next = reverse ? all[idx - 1] : all[idx + 1];
  if (!next) return;
  next.focus();
  if (next.tagName === 'INPUT') {
    setTimeout(() => (next as HTMLInputElement).select(), 10);
  }
}

export function initGlobalTabNavigation() {

  // ── Auto-select text on focus for text + number inputs ──────────────────
  document.addEventListener('focusin', (e) => {
    const el = e.target as HTMLInputElement;
    if (
      el.tagName === 'INPUT' &&
      el.type !== 'checkbox' &&
      el.type !== 'radio' &&
      el.type !== 'date' &&
      el.type !== 'file'
    ) {
      setTimeout(() => el.select(), 10);
    }
  });

  // ── Tab / Enter navigation ───────────────────────────────────────────────
  document.addEventListener('keydown', (e) => {
    const active = document.activeElement as HTMLElement;
    if (!active) return;

    const tag = active.tagName;
    const type = (active as HTMLInputElement).type || '';
    const isTab = e.key === 'Tab';
    const isEnter = e.key === 'Enter';

    if (!isTab && !isEnter) return;

    // Textarea: allow Enter for newlines, Tab moves field
    if (tag === 'TEXTAREA') {
      if (isEnter) return;
      if (isTab) {
        e.preventDefault();
        focusNext(active, e.shiftKey);
      }
      return;
    }

    // Date input: Enter moves to next field
    if (tag === 'INPUT' && type === 'date') {
      if (isEnter) {
        e.preventDefault();
        focusNext(active);
      }
      return; // let Tab work natively for date
    }

    // Barcode input: Enter should search, not navigate
    if ((active.getAttribute('data-testid') || '').includes('input-barcode')) {
      return;
    }

    // Regular input / select: both Tab and Enter move forward; Shift+Tab goes back
    if (tag === 'INPUT' || tag === 'SELECT') {
      e.preventDefault();
      focusNext(active, isTab && e.shiftKey);
      return;
    }

    // Button: Enter clicks it naturally — just move focus AFTER the click
    if (tag === 'BUTTON' && isEnter) {
      // Let the button's own onClick fire, then move to next field
      setTimeout(() => {
        const stillActive = document.activeElement as HTMLElement;
        if (stillActive && stillActive.tagName === 'BUTTON') {
          focusNext(stillActive);
        }
      }, 150);
      return;
    }

    // Tab on button: move to next/prev
    if (tag === 'BUTTON' && isTab) {
      e.preventDefault();
      focusNext(active, e.shiftKey);
    }
  });
}
