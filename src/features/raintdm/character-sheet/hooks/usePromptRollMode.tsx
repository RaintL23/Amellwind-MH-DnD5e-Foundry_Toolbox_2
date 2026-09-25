import { useCallback, useRef, useState, type ReactNode } from "react";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { RollMode } from "../utils/play-character.types";

export type PromptRollModeFn = (label?: string) => Promise<RollMode | null>;

interface PromptState {
  label: string;
  resolve: (mode: RollMode | null) => void;
}

const MODE_OPTIONS: { mode: RollMode; label: string; hint: string }[] = [
  { mode: "disadvantage", label: "Disadvantage", hint: "2d20, keep lower" },
  { mode: "normal", label: "Normal", hint: "1d20" },
  { mode: "advantage", label: "Advantage", hint: "2d20, keep higher" },
];

/**
 * Promise-based roll-mode chooser for d20 tests (attack / check / save / init).
 * Cancel (overlay / Esc / X) resolves to null — caller should abort the roll.
 */
export function usePromptRollMode(): {
  promptRollMode: PromptRollModeFn;
  rollModeDialog: ReactNode;
} {
  const [prompt, setPrompt] = useState<PromptState | null>(null);
  const promptRef = useRef<PromptState | null>(null);

  const close = useCallback((mode: RollMode | null) => {
    const current = promptRef.current;
    if (!current) return;
    promptRef.current = null;
    setPrompt(null);
    current.resolve(mode);
  }, []);

  const promptRollMode = useCallback<PromptRollModeFn>((label) => {
    return new Promise<RollMode | null>((resolve) => {
      const next = { label: label?.trim() || "Roll", resolve };
      promptRef.current = next;
      setPrompt(next);
    });
  }, []);

  const rollModeDialog = (
    <Dialog
      open={prompt != null}
      onOpenChange={(open) => {
        if (!open) close(null);
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>How do you roll?</DialogTitle>
          <DialogDescription>{prompt?.label ?? "Roll"}</DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-2 pb-6">
          {MODE_OPTIONS.map(({ mode, label, hint }) => (
            <Button
              key={mode}
              type="button"
              variant={mode === "normal" ? "default" : "outline"}
              className="h-auto w-full justify-between px-4 py-3"
              onClick={() => close(mode)}
            >
              <span className="font-medium">{label}</span>
              <span className="text-xs text-muted-foreground">{hint}</span>
            </Button>
          ))}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );

  return { promptRollMode, rollModeDialog };
}
