/**
 * Renders a PDF (from bytes) as stacked canvases with pdf.js, including form
 * field appearances. Works on mobile browsers that cannot show PDFs inline.
 */
import { useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist/legacy/build/pdf.mjs";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/shared/utils/cn";
import { loadPdfJs } from "@/shared/utils/pdfjs-loader";

/** iOS Safari refuses canvases above ~16.7M pixels. */
const MAX_CANVAS_PIXELS = 16_000_000;
const MAX_OUTPUT_SCALE = 2;
const CONTAINER_PADDING = 12;
/** US Letter-ish placeholder ratio until the real page size is known. */
const DEFAULT_ASPECT = 774 / 603;

interface PdfCanvasViewerProps {
  data: Uint8Array;
  /** 1 = fit the container width. */
  zoom: number;
  onPageCountChange?: (count: number) => void;
  onCurrentPageChange?: (page: number) => void;
  onError?: (error: Error) => void;
  className?: string;
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

function PdfPage({
  doc,
  pageNumber,
  cssWidth,
}: Readonly<{ doc: PDFDocumentProxy; pageNumber: number; cssWidth: number }>) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [aspect, setAspect] = useState(DEFAULT_ASPECT);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let renderTask: RenderTask | null = null;

    void Promise.all([loadPdfJs(), doc.getPage(pageNumber)])
      .then(([pdfjs, page]) => {
        if (cancelled) return;
        const base = page.getViewport({ scale: 1 });
        setAspect(base.height / base.width);
        const viewport = page.getViewport({ scale: cssWidth / base.width });

        let outputScale = Math.min(window.devicePixelRatio || 1, MAX_OUTPUT_SCALE);
        const cssArea = viewport.width * viewport.height;
        if (cssArea * outputScale * outputScale > MAX_CANVAS_PIXELS) {
          outputScale = Math.sqrt(MAX_CANVAS_PIXELS / cssArea);
        }

        // Render off-screen and swap, so zooming never flashes a blank page.
        const offscreen = document.createElement("canvas");
        offscreen.width = Math.floor(viewport.width * outputScale);
        offscreen.height = Math.floor(viewport.height * outputScale);
        const context = offscreen.getContext("2d");
        if (!context) return;

        renderTask = page.render({
          canvasContext: context,
          viewport,
          transform: outputScale === 1 ? undefined : [outputScale, 0, 0, outputScale, 0, 0],
          // Paint form-field appearances into the canvas (no HTML form layer).
          annotationMode: pdfjs.AnnotationMode.ENABLE,
        });
        return renderTask.promise.then(() => {
          const canvas = canvasRef.current;
          if (cancelled || !canvas) return;
          canvas.width = offscreen.width;
          canvas.height = offscreen.height;
          canvas.getContext("2d")?.drawImage(offscreen, 0, 0);
          offscreen.width = 0; // release the bitmap early on memory-tight phones
          setRendered(true);
        });
      })
      .catch((error: unknown) => {
        if (toError(error).name !== "RenderingCancelledException") {
          console.warn(`PDF page ${pageNumber} failed to render`, error);
        }
      });

    return () => {
      cancelled = true;
      renderTask?.cancel();
    };
  }, [doc, pageNumber, cssWidth]);

  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-sm bg-white shadow-md ring-1 ring-black/10"
      style={{ width: cssWidth, height: Math.round(cssWidth * aspect) }}
    >
      <canvas
        ref={canvasRef}
        className="block h-full w-full"
        aria-label={`Page ${pageNumber}`}
        role="img"
      />
      {!rendered && <Skeleton className="absolute inset-0 rounded-none" />}
    </div>
  );
}

export function PdfCanvasViewer({
  data,
  zoom,
  onPageCountChange,
  onCurrentPageChange,
  onError,
  className,
}: Readonly<PdfCanvasViewerProps>) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // Load the document whenever the bytes change.
  useEffect(() => {
    let cancelled = false;
    let destroy: (() => Promise<void>) | null = null;
    setDoc(null);

    loadPdfJs()
      .then((pdfjs) => {
        if (cancelled) return;
        // pdf.js transfers the buffer to its worker: pass a copy so the caller
        // can still download the same bytes.
        const task = pdfjs.getDocument({ data: data.slice(), isEvalSupported: false });
        destroy = () => task.destroy();
        return task.promise.then((pdf) => {
          if (cancelled) return;
          setDoc(pdf);
          onPageCountChange?.(pdf.numPages);
        });
      })
      .catch((error: unknown) => {
        if (!cancelled) onError?.(toError(error));
      });

    return () => {
      cancelled = true;
      void destroy?.();
    };
  }, [data]);

  // Track the available width (debounced) to fit pages to the container.
  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    let timer: number | undefined;
    const measure = () => setContainerWidth(element.clientWidth - CONTAINER_PADDING * 2);
    measure();
    const observer = new ResizeObserver(() => {
      window.clearTimeout(timer);
      timer = window.setTimeout(measure, 120);
    });
    observer.observe(element);
    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  const pageWidth = Math.max(0, Math.floor(containerWidth * zoom));
  const pagesMounted = doc !== null && pageWidth > 0;

  // Report the page that is most visible in the scroll area.
  useEffect(() => {
    const root = scrollRef.current;
    if (!root || !pagesMounted) return;
    const ratios = new Map<number, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const index = Number((entry.target as HTMLElement).dataset.pageIndex);
          ratios.set(index, entry.intersectionRatio);
        }
        let best = 0;
        let bestRatio = -1;
        ratios.forEach((ratio, index) => {
          if (ratio > bestRatio) {
            best = index;
            bestRatio = ratio;
          }
        });
        onCurrentPageChange?.(best + 1);
      },
      { root, threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    pageRefs.current.forEach((element) => element && observer.observe(element));
    return () => observer.disconnect();
  }, [doc, pagesMounted]);

  return (
    <div
      ref={scrollRef}
      className={cn("min-h-0 flex-1 overflow-auto overscroll-contain bg-muted/40", className)}
      style={{ touchAction: "pan-x pan-y pinch-zoom", padding: CONTAINER_PADDING }}
    >
      {!doc || !pagesMounted ? (
        <div className="mx-auto flex w-full max-w-full flex-col items-center">
          <Skeleton
            className="w-full rounded-sm"
            style={{ aspectRatio: `${1 / DEFAULT_ASPECT}` }}
          />
        </div>
      ) : (
        <div className="mx-auto flex w-max min-w-full flex-col items-center gap-3">
          {Array.from({ length: doc.numPages }, (_, index) => (
            <div
              key={index}
              ref={(element) => {
                pageRefs.current[index] = element;
              }}
              data-page-index={index}
            >
              <PdfPage doc={doc} pageNumber={index + 1} cssWidth={pageWidth} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
