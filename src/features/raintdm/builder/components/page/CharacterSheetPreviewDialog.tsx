/**
 * Full preview of the exported D&D 2024 Character Sheet PDF before download.
 * Full-screen on phones, large dialog on desktop; pages render with pdf.js so
 * what you see is exactly the file that gets downloaded.
 */
import { useState } from "react";
import { AlertTriangle, FileDown, Loader2, X, ZoomIn, ZoomOut } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PdfCanvasViewer } from "@/shared/components/pdf/PdfCanvasViewer";
import type { CharacterSheetPdfFile } from "../../hooks/useCharacterSheetExport";

const ZOOM_STEPS = [1, 1.5, 2, 3] as const;

interface CharacterSheetPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Null while the PDF is being generated. */
  file: CharacterSheetPdfFile | null;
  /** Pending build choices; downloading stays gated until they are done. */
  pendingCount: number;
  onDownload: () => void;
}

export function CharacterSheetPreviewDialog({
  open,
  onOpenChange,
  file,
  pendingCount,
  onDownload,
}: Readonly<CharacterSheetPreviewDialogProps>) {
  const [zoomIndex, setZoomIndex] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [renderError, setRenderError] = useState<string | null>(null);
  const zoom = ZOOM_STEPS[zoomIndex];

  const status = !file
    ? "Generating your sheet…"
    : pageCount > 0
      ? `Page ${currentPage} of ${pageCount}`
      : "Loading pages…";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="h-[100dvh] max-h-[100dvh] w-screen max-w-none rounded-none border-0 pb-[env(safe-area-inset-bottom)] sm:h-[92dvh] sm:max-h-[92dvh] sm:w-[calc(100vw-2rem)] sm:max-w-4xl sm:rounded-lg sm:border sm:pb-0 [&>button:last-child]:hidden"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <header className="flex shrink-0 items-center gap-1.5 border-b border-border/60 px-2 py-2 pt-[max(0.5rem,env(safe-area-inset-top))] sm:gap-2 sm:px-4">
          <div className="min-w-0 flex-1 pl-1">
            <DialogTitle className="truncate text-sm font-semibold sm:text-base">
              <span className="sm:hidden">Sheet preview</span>
              <span className="hidden sm:inline">Character Sheet preview</span>
            </DialogTitle>
            <DialogDescription className="truncate text-[11px]" aria-live="polite">
              {status}
            </DialogDescription>
          </div>

          <div className="flex items-center rounded-md border border-border/60">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-r-none sm:h-8 sm:w-8"
              disabled={zoomIndex === 0}
              onClick={() => setZoomIndex((index) => Math.max(0, index - 1))}
              aria-label="Zoom out"
            >
              <ZoomOut className="h-4 w-4" aria-hidden />
            </Button>
            <button
              type="button"
              className="h-10 min-w-[3rem] px-1 text-xs tabular-nums text-muted-foreground hover:text-foreground sm:h-8"
              onClick={() => setZoomIndex(0)}
              aria-label="Fit page to width"
            >
              {zoom === 1 ? "Fit" : `${zoom * 100}%`}
            </button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-l-none sm:h-8 sm:w-8"
              disabled={zoomIndex === ZOOM_STEPS.length - 1}
              onClick={() =>
                setZoomIndex((index) => Math.min(ZOOM_STEPS.length - 1, index + 1))
              }
              aria-label="Zoom in"
            >
              <ZoomIn className="h-4 w-4" aria-hidden />
            </Button>
          </div>

          <Button
            type="button"
            size="sm"
            className="h-10 gap-1.5 px-3 text-xs sm:h-8"
            disabled={!file}
            onClick={onDownload}
          >
            <FileDown className="h-4 w-4" aria-hidden />
            <span className="hidden min-[400px]:inline">Download</span>
            <span className="sr-only min-[400px]:hidden">Download PDF</span>
          </Button>

          <DialogClose asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-10 w-10 shrink-0 sm:h-8 sm:w-8"
              aria-label="Close preview"
            >
              <X className="h-4 w-4" aria-hidden />
            </Button>
          </DialogClose>
        </header>

        {pendingCount > 0 && (
          <p className="flex shrink-0 items-start gap-1.5 border-b border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-[11px] leading-snug text-amber-700 dark:text-amber-300 sm:px-4">
            <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />
            {pendingCount === 1 ? "1 choice is" : `${pendingCount} choices are`} still
            pending: this preview shows the build so far. Finish them to download.
          </p>
        )}

        {renderError ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center text-sm text-muted-foreground">
            <AlertTriangle className="h-6 w-6 text-amber-500" aria-hidden />
            <p>The preview could not be displayed on this device.</p>
            <p className="text-xs">You can still download the PDF.</p>
          </div>
        ) : file ? (
          <PdfCanvasViewer
            data={file.bytes}
            zoom={zoom}
            onPageCountChange={setPageCount}
            onCurrentPageChange={setCurrentPage}
            onError={(error) => setRenderError(error.message)}
          />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-muted/40 p-6 text-sm text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
            Filling in the D&amp;D 2024 sheet…
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
