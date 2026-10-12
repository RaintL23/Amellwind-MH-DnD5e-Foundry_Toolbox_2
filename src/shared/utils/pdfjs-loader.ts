/**
 * Lazy pdf.js loader. Uses the legacy build (transpiled + polyfilled) so the
 * viewer also works on older mobile Safari, and keeps pdf.js out of every
 * chunk until a PDF is actually rendered.
 */
type PdfJsModule = typeof import("pdfjs-dist/legacy/build/pdf.mjs");

let pdfjsPromise: Promise<PdfJsModule> | null = null;

export function loadPdfJs(): Promise<PdfJsModule> {
  if (!pdfjsPromise) {
    pdfjsPromise = Promise.all([
      import("pdfjs-dist/legacy/build/pdf.mjs"),
      import("pdfjs-dist/legacy/build/pdf.worker.min.mjs?url"),
    ])
      .then(([pdfjs, worker]) => {
        pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
        return pdfjs;
      })
      .catch((error: unknown) => {
        pdfjsPromise = null; // allow a retry after a failed chunk load
        throw error;
      });
  }
  return pdfjsPromise;
}
