/**
 * Character-level actions (export, import, send to sheet, reset, randomize)
 * shared by the progress-bar menu and the "character is ready" card, so both
 * run the same completeness gates and confirmations.
 */
import {
  createContext,
  lazy,
  Suspense,
  useContext,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { useCharacterSheetExport } from "../hooks/useCharacterSheetExport";
import { useBuilderCharacterExport } from "../hooks/useBuilderCharacterExport";
import { useBuilderCharacterImport } from "../hooks/useBuilderCharacterImport";
import { useCharacterRandomizer } from "../hooks/useCharacterRandomizer";
import { useSendToPlaySheet } from "@/features/raintdm/character-sheet/hooks/useSendToPlaySheet";
import { useConfirmDialog } from "@/features/raintdm/character-sheet/hooks/useConfirmDialog";
import { useBuildCompleteness } from "./BuildCompletenessContext";
import { useCharacterBuilder } from "./CharacterBuilderContext";
import { ConfirmActionDialog } from "../components/shared/ConfirmActionDialog";
import type { BuildCompletenessIssue } from "../utils/build-completeness.types";

// pdf.js is heavy: load the preview (and its viewer) only when first opened.
const CharacterSheetPreviewDialog = lazy(() =>
  import("../components/page/CharacterSheetPreviewDialog").then((module) => ({
    default: module.CharacterSheetPreviewDialog,
  })),
);

type PendingConfirm = { kind: "reset" } | { kind: "randomize" } | { kind: "import"; file: File };

interface BuilderCharacterActions {
  buildHasStarted: boolean;
  exporting: boolean;
  previewing: boolean;
  sendingToSheet: boolean;
  importing: boolean;
  isRandomizing: boolean;
  canRandomize: boolean;
  linkedId: string | null;
  exportPdf: () => void;
  previewPdf: () => void;
  exportJson: () => void;
  sendToSheet: () => void;
  updateLinkedSheet: () => void;
  loadJson: () => void;
  reset: () => void;
  randomize: () => void;
}

const BuilderCharacterActionsContext =
  createContext<BuilderCharacterActions | null>(null);

export function BuilderCharacterActionsProvider({
  children,
}: Readonly<{ children: ReactNode }>) {
  const { resetBuild } = useCharacterBuilder();
  const { randomize, isRandomizing, canRandomize } = useCharacterRandomizer();
  const {
    exportSheet,
    exporting,
    previewSheet,
    previewing,
    preview,
    downloadPreview,
    closePreview,
    error: pdfError,
  } = useCharacterSheetExport();
  const { exportCharacter, error: jsonError } = useBuilderCharacterExport();
  const { confirm, confirmDialog } = useConfirmDialog();
  const {
    busy: sendingToSheet,
    sendNew,
    updateExisting,
    linkedId,
  } = useSendToPlaySheet(confirm);
  const {
    importFromFile,
    importing,
    error: importError,
  } = useBuilderCharacterImport();
  const { evaluate, activateHighlight, clearHighlight, goToIssue, liveResult } =
    useBuildCompleteness();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const buildHasStarted = liveResult.hasStarted;

  useEffect(() => {
    if (pdfError) toast.error(pdfError);
  }, [pdfError]);
  useEffect(() => {
    if (jsonError) toast.error(jsonError);
  }, [jsonError]);
  useEffect(() => {
    if (importError) toast.error(importError);
  }, [importError]);

  /** Jump to the first pending choice and name it, instead of only counting. */
  function showBlockingIssues(issues: BuildCompletenessIssue[], action: string) {
    activateHighlight();
    const [first] = issues;
    if (!first) return;
    goToIssue(first);
    const left =
      issues.length === 1 ? "1 choice left" : `${issues.length} choices left`;
    toast.error(`Finish your character before ${action}`, {
      description: `${left}. Next: ${first.message}`,
    });
  }

  /** Gate shared by every export that needs a complete build. */
  function ensureReady(action: string): boolean {
    const result = evaluate();
    if (!result.hasStarted) {
      toast.error(`Build a character before ${action}`);
      return false;
    }
    if (result.shouldBlockExport) {
      showBlockingIssues(result.issues, action);
      return false;
    }
    clearHighlight();
    return true;
  }

  function handleFileSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (buildHasStarted) {
      setPending({ kind: "import", file });
      return;
    }
    clearHighlight();
    void importFromFile(file);
  }

  /** Preview works mid-build (the dialog flags pending choices). */
  function openPreview() {
    if (!liveResult.hasStarted) {
      toast.error("Build a character before previewing the sheet");
      return;
    }
    setPreviewOpen(true);
    void previewSheet().then((ok) => {
      if (!ok) setPreviewOpen(false);
    });
  }

  function closePreviewDialog() {
    setPreviewOpen(false);
    closePreview();
  }

  function downloadFromPreview() {
    if (!ensureReady("downloading the PDF")) {
      // The gate jumps to the pending choice: get the dialog out of the way.
      closePreviewDialog();
      return;
    }
    downloadPreview();
  }

  function runPending() {
    if (!pending) return;
    clearHighlight();
    switch (pending.kind) {
      case "reset":
        resetBuild();
        toast.message("Build reset");
        break;
      case "randomize":
        void randomize().then(() => toast.message("Character randomized"));
        break;
      case "import":
        void importFromFile(pending.file);
        break;
    }
  }

  const value: BuilderCharacterActions = {
    buildHasStarted,
    exporting,
    previewing,
    sendingToSheet,
    importing,
    isRandomizing,
    canRandomize,
    linkedId: linkedId ?? null,
    exportPdf: () => {
      if (ensureReady("downloading the PDF")) void exportSheet();
    },
    previewPdf: openPreview,
    exportJson: () => exportCharacter(),
    sendToSheet: () => {
      if (ensureReady("sending it to the Character Sheet")) void sendNew();
    },
    updateLinkedSheet: () => {
      if (ensureReady("sending it to the Character Sheet")) void updateExisting();
    },
    loadJson: () => fileInputRef.current?.click(),
    reset: () => {
      if (buildHasStarted) setPending({ kind: "reset" });
      else {
        clearHighlight();
        resetBuild();
      }
    },
    randomize: () => {
      if (buildHasStarted) setPending({ kind: "randomize" });
      else {
        clearHighlight();
        void randomize();
      }
    },
  };

  const confirmCopy =
    pending?.kind === "reset"
      ? {
          title: "Reset character?",
          description:
            "This clears the entire build and cannot be undone. Autosave will be wiped.",
          confirmLabel: "Reset build",
        }
      : pending?.kind === "randomize"
        ? {
            title: "Randomize character?",
            description:
              "This replaces your current choices with a randomized build at the same level.",
            confirmLabel: "Randomize",
          }
        : pending?.kind === "import"
          ? {
              title: "Replace current character?",
              description: `Loading "${pending.file.name}" replaces the entire current build. Download it as Builder JSON first if you want to keep it.`,
              confirmLabel: "Load character",
            }
          : null;

  return (
    <BuilderCharacterActionsContext.Provider value={value}>
      {children}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={handleFileSelected}
        aria-hidden
      />
      {confirmCopy && (
        <ConfirmActionDialog
          open={pending !== null}
          onOpenChange={(open) => {
            if (!open) setPending(null);
          }}
          title={confirmCopy.title}
          description={confirmCopy.description}
          confirmLabel={confirmCopy.confirmLabel}
          onConfirm={runPending}
        />
      )}
      {confirmDialog}
      {previewOpen && (
        <Suspense fallback={null}>
          <CharacterSheetPreviewDialog
            open={previewOpen}
            onOpenChange={(open) => {
              if (!open) closePreviewDialog();
            }}
            file={preview}
            pendingCount={liveResult.shouldBlockExport ? liveResult.issues.length : 0}
            onDownload={downloadFromPreview}
          />
        </Suspense>
      )}
    </BuilderCharacterActionsContext.Provider>
  );
}

export function useBuilderCharacterActions(): BuilderCharacterActions {
  const ctx = useContext(BuilderCharacterActionsContext);
  if (!ctx) {
    throw new Error(
      "useBuilderCharacterActions must be used within BuilderCharacterActionsProvider",
    );
  }
  return ctx;
}
