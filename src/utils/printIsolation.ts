/**
 * Print isolation — deliberately free of jsPDF and html-to-image.
 *
 * This lives apart from pdfGenerator.ts because main.tsx installs it on every
 * page load. While it shared that module, importing it dragged the whole PDF
 * rasterisation stack into the entry chunk, so a visitor reading the landing
 * page downloaded jsPDF before first paint. Keep this file dependency-free.
 */

const PRINT_ROOT_ID = 'invoix-print-root';

declare global {
  interface Window {
    __invoixPreparePrint?: () => void;
    __invoixTeardownPrint?: () => void;
  }
}

/**
 * Builds an isolated copy of the document at the top of <body>.
 *
 * The preview lives inside an .overflow-y-auto.relative pane (which clips it and
 * is also its containing block) beneath two inline scale() transforms. No
 * @media print rule can free an element from a chain like that, so the only
 * robust approach is to lift a copy out of it.
 *
 * A CLONE, not the live node: relocating React-managed DOM risks a
 * reconciliation error if a render lands mid-print.
 */
export function buildPrintRoot(): void {
  teardownPrintRoot();

  const source =
    document.getElementById('quotation-invoice-canvas') ||
    document.getElementById('quotation-preview-container') ||
    document.querySelector<HTMLElement>('.print-page');

  // Nothing to isolate. The body:has(#invoix-print-root) guard in index.css
  // means print simply falls back to normal browser behaviour.
  if (!source) return;

  const printRoot = document.createElement('div');
  printRoot.id = PRINT_ROOT_ID;

  const clone = source.cloneNode(true) as HTMLElement;
  clone.removeAttribute('id');
  clone.style.transform = 'none';
  clone.style.width = 'auto';
  printRoot.appendChild(clone);

  document.body.appendChild(printRoot);
}

export function teardownPrintRoot(): void {
  document.getElementById(PRINT_ROOT_ID)?.remove();
}

/**
 * Wires document isolation into the browser's own print lifecycle. Call once at
 * startup.
 *
 * Doing this on `beforeprint` rather than inside a click handler is what makes
 * it reliable: Ctrl+P, the browser menu, and reprinting from an open preview all
 * bypass application code entirely. Isolating only inside our own button worked
 * the first time and then printed the whole editor on every other route into
 * print.
 *
 * Returns a disposer.
 */
export function installPrintIsolation(): () => void {
  // Expose global prepare/teardown hooks for headless Chromium server rendering
  window.__invoixPreparePrint = buildPrintRoot;
  window.__invoixTeardownPrint = teardownPrintRoot;

  window.addEventListener('beforeprint', buildPrintRoot);
  window.addEventListener('afterprint', teardownPrintRoot);

  // Safari does not fire beforeprint/afterprint reliably, but does toggle this
  // media query. buildPrintRoot tears down first, so a double-fire is harmless.
  const mql = typeof window.matchMedia === 'function' ? window.matchMedia('print') : null;
  const onMediaChange = (e: MediaQueryListEvent) => {
    if (e.matches) buildPrintRoot();
    else teardownPrintRoot();
  };
  mql?.addEventListener?.('change', onMediaChange);

  return () => {
    window.removeEventListener('beforeprint', buildPrintRoot);
    window.removeEventListener('afterprint', teardownPrintRoot);
    mql?.removeEventListener?.('change', onMediaChange);
    teardownPrintRoot();
  };
}

/**
 * Opens the browser print dialog.
 *
 * Isolation is handled by the `beforeprint` listener installed above, so this
 * behaves identically to the user pressing Ctrl+P.
 */
export function printDocument(): void {
  window.print();
}
