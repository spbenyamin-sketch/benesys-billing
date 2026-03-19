/**
 * Global Keyboard Navigation for BeneSys
 * Tab / Enter → next field | Shift+Tab → previous field
 * Number/text inputs auto-select on focus
 */

const SKIP_TESTIDS = [
  'button-remove-',
  'button-clear-party',
  'button-toggle-password',
  'button-toggle-confirm-password',
  'button-barcode-search',
];

function isVisible(el: HTMLElement): boolean {
  if (!el.offsetParent && el.tagName !== 'BODY') return false;
  const s = window.getComputedStyle(el);
  return s.display !== 'none' && s.visibility !== 'hidden' && s.opacity !== '0';
}

function shouldSkip(el: HTMLElement): boolean {
  const testId = el.getAttribute('data-testid') || '';
  return SKIP_TESTIDS.some(s => testId.startsWith(s));
}

function getFocusable(): HTMLElement[] {
  return Array.from(
    document.querySelectorAll<HTMLElement>(
      'input:not([disabled]):not([type="hidden"]), ' +
      'textarea:not([disabled]), ' +
      'select:not([disabled]), ' +
      'button:not([disabled])'
    )
  ).filter(el => isVisible(el) && !shouldSkip(el));
}

function moveFocus(current: HTMLElement, reverse = false) {
  const all = getFocusable();
  const idx = all.indexOf(current);
  if (idx === -1) return;
  const target = all[reverse ? idx - 1 : idx + 1];
  if (!target) return;
  target.focus();
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
    setTimeout(() => (target as HTMLInputElement).select(), 10);
  }
}

export function initGlobalTabNavigation() {
  // Auto-select on focus
  document.addEventListener('focusin', (e) => {
    const el = e.target as HTMLInputElement;
    if (
      el.tagName === 'INPUT' &&
      el.type !== 'checkbox' &&
      el.type !== 'radio' &&
      el.type !== 'date' &&
      el.type !== 'file' &&
      el.type !== 'color'
    ) {
      setTimeout(() => { try { el.select(); } catch(_) {} }, 10);
    }
  });

  document.addEventListener('keydown', (e) => {
    const active = document.activeElement as HTMLElement;
    if (!active) return;

    const tag = active.tagName;
    const type = (active as HTMLInputElement).type || '';
    const testId = active.getAttribute('data-testid') || '';
    const isTab = e.key === 'Tab';
    const isEnter = e.key === 'Enter';

    if (!isTab && !isEnter) return;

    // ── Special cases ──────────────────────────────────────────────

    // Textarea: Enter = newline (don't intercept), Tab = next field
    if (tag === 'TEXTAREA') {
      if (isEnter) return;
      e.preventDefault();
      moveFocus(active, e.shiftKey);
      return;
    }

    // Barcode input: Enter fires search, not navigation
    if (testId === 'input-barcode') return;

    // Date: Tab works natively (browser date picker), Enter = next field
    if (type === 'date') {
      if (isEnter) { e.preventDefault(); moveFocus(active); }
      return;
    }

    // Checkbox / radio: Tab moves, Enter toggles (native)
    if (type === 'checkbox' || type === 'radio') {
      if (isEnter) return; // let it toggle
      if (isTab) { e.preventDefault(); moveFocus(active, e.shiftKey); }
      return;
    }

    // ── Regular INPUT / SELECT ─────────────────────────────────────
    if (tag === 'INPUT' || tag === 'SELECT') {
      e.preventDefault();
      moveFocus(active, isTab && e.shiftKey);
      return;
    }

    // ── BUTTON ────────────────────────────────────────────────────
    if (tag === 'BUTTON') {
      if (isTab) {
        e.preventDefault();
        moveFocus(active, e.shiftKey);
        return;
      }
      if (isEnter) {
        // Let button click happen, then move focus to next field
        setTimeout(() => {
          const cur = document.activeElement as HTMLElement;
          // If focus is still on a button after click, move forward
          if (cur && cur.tagName === 'BUTTON' && cur === active) {
            moveFocus(cur);
          }
        }, 200);
      }
    }
  });
}
