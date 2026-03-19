/**
 * Global Keyboard Navigation for BeneSys
 * Tab / Enter → next FORM field only (never sidebar/nav)
 * Shift+Tab → previous field
 * Number/text inputs auto-select on focus
 */

const SKIP_TESTIDS = [
  'button-remove-',
  'button-clear-party', 
  'button-toggle-password',
  'button-toggle-confirm-password',
  'button-barcode-search',
  'button-logout',
  'link-',
];

function isInSidebar(el: HTMLElement): boolean {
  return !!(
    el.closest('aside') ||
    el.closest('nav') ||
    el.closest('[data-slot="sidebar"]') ||
    el.closest('[data-sidebar]')
  );
}

function isVisible(el: HTMLElement): boolean {
  if (!el.offsetParent && el.tagName !== 'BODY') return false;
  const s = window.getComputedStyle(el);
  return s.display !== 'none' && s.visibility !== 'hidden';
}

function shouldSkip(el: HTMLElement): boolean {
  if (isInSidebar(el)) return true;
  if (el.getAttribute('tabindex') === '-1') return true;
  const testId = el.getAttribute('data-testid') || '';
  return SKIP_TESTIDS.some(s => testId.startsWith(s));
}

function getFocusable(): HTMLElement[] {
  return Array.from(
    document.querySelectorAll<HTMLElement>(
      'input:not([disabled]):not([type="hidden"]), ' +
      'textarea:not([disabled]), ' +
      'select:not([disabled]), ' +
      'button:not([disabled]), ' +
      'a[href]'
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
  // Auto-select text on focus for inputs
  document.addEventListener('focusin', (e) => {
    const el = e.target as HTMLInputElement;
    if (
      el.tagName === 'INPUT' &&
      el.type !== 'checkbox' &&
      el.type !== 'radio' &&
      el.type !== 'date' &&
      el.type !== 'file' &&
      !isInSidebar(el)
    ) {
      setTimeout(() => { try { el.select(); } catch(_) {} }, 10);
    }
  });

  document.addEventListener('keydown', (e) => {
    const active = document.activeElement as HTMLElement;
    if (!active) return;
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

    // Date input: Tab = native, Enter = next field
    if (type === 'date') {
      if (isEnter) { e.preventDefault(); moveFocus(active); }
      return;
    }

    // Checkbox / radio: Enter = toggle, Tab = move
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
          if (cur && cur === active) moveFocus(cur);
        }, 200);
      }
    }
  });
}
