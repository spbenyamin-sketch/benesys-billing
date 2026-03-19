/**
 * Global Keyboard Navigation for BeneSys
 * 
 * ONLY handles:
 * 1. Auto-select text when clicking/tabbing into number inputs
 * 2. Blocks Tab from going to sidebar/nav elements
 * 
 * Field-to-field navigation inside sales forms is handled
 * per-page using data-tab-group and data-tab-order attributes.
 */

export function initGlobalTabNavigation() {
  // Auto-select text on focus for number/text inputs
  document.addEventListener('focusin', (e) => {
    const el = e.target as HTMLInputElement;
    if (
      el.tagName === 'INPUT' &&
      el.type !== 'checkbox' &&
      el.type !== 'radio' &&
      el.type !== 'date' &&
      el.type !== 'file'
    ) {
      setTimeout(() => { try { el.select(); } catch(_) {} }, 10);
    }
  });

  // Block Tab from going into sidebar links/buttons
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const active = document.activeElement as HTMLElement;
    if (!active) return;

    const inSidebar = !!(
      active.closest('aside') ||
      active.closest('nav') ||
      active.closest('[data-slot="sidebar"]') ||
      active.closest('[data-sidebar]')
    );
    if (inSidebar) {
      e.preventDefault();
    }
  }, true);
}
