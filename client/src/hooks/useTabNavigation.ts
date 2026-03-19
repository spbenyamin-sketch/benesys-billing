/**
 * Global Keyboard Navigation for BeneSys
 * Tab / Enter → next field | Shift+Tab → previous field
 * Stays within the main content area — never jumps to sidebar nav
 */

const SKIP_TESTIDS = [
  'button-remove-',
  'button-clear-party',
  'button-toggle-password',
  'button-toggle-confirm-password',
  'button-barcode-search',
];

function isInSidebar(el: HTMLElement): boolean {
  return !!el.closest('[data-slot="sidebar"]') ||
         !!el.closest('[data-sidebar="sidebar"]') ||
         !!el.closest('nav') ||
         !!el.closest('aside');
}

function isVisible(el: HTMLElement): boolean {
  if (!el.offsetParent && el.tagName !== 'BODY') return false;
  const s = window.getComputedStyle(el);
  return s.display !== 'none' && s.visibility !== 'hidden' && s.opacity !== '0';
}

function shouldSkip(el: HTMLElement): boolean {
  if (isInSidebar(el)) return true;
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
    setTimeout(() => { try { (target as HTMLInputElement).select(); } catch(_) {} }, 10);
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
      el.type !== 'color' &&
      !isInSidebar(el)
    ) {
      setTimeout(() => { try { el.select(); } catch(_) {} }, 10);
    }
  });

  document.addEventListener('keydown', (e) => {
    const active = document.activeElement as HTMLElement;
    if (!active) return;

    // Never intercept keys when focus is in sidebar
    if (isInSidebar(active)) return;

    const tag = active.tagName;
    const type = (active as HTMLInputElement).type || '';
    const testId = active.getAttribute('data-testid') || '';
    const isTab = e.key === 'Tab';
    const isEnter = e.key === 'Enter';

    if (!isTab && !isEnter) return;

    // Textarea: Enter = newline, Tab = next field
    if (tag === 'TEXTAREA') {
      if (isEnter) return;
      e.preventDefault();
      moveFocus(active, e.shiftKey);
      return;
    }

    // Barcode input: Enter fires search
    if (testId === 'input-barcode') return;

    // Date: Tab native, Enter = next field
    if (type === 'date') {
      if (isEnter) { e.preventDefault(); moveFocus(active); }
      return;
    }

    // Checkbox / radio: Enter toggles, Tab moves
    if (type === 'checkbox' || type === 'radio') {
      if (isEnter) return;
      if (isTab) { e.preventDefault(); moveFocus(active, e.shiftKey); }
      return;
    }

    // Regular INPUT / SELECT
    if (tag === 'INPUT' || tag === 'SELECT') {
      e.preventDefault();
      moveFocus(active, isTab && e.shiftKey);
      return;
    }

    // BUTTON
    if (tag === 'BUTTON') {
      if (isTab) {
        e.preventDefault();
        moveFocus(active, e.shiftKey);
        return;
      }
      if (isEnter) {
        setTimeout(() => {
          const cur = document.activeElement as HTMLElement;
          if (cur && cur.tagName === 'BUTTON' && cur === active) {
            moveFocus(cur);
          }
        }, 200);
      }
    }
  });
}
