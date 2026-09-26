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

interface ConfirmState {
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  resolve: (ok: boolean) => void;
}

export type ConfirmDialogFn = (opts: {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
}) => Promise<boolean>;

/**
 * Promise-based confirm dialog (replaces window.confirm for sheet UX).
 * Opening a new confirm resolves any prior pending promise with false.
 */
export function useConfirmDialog(): {
  confirm: ConfirmDialogFn;
  confirmDialog: ReactNode;
} {
  const [state, setState] = useState<ConfirmState | null>(null);
  const stateRef = useRef<ConfirmState | null>(null);

  const close = useCallback((ok: boolean) => {
    const current = stateRef.current;
    if (!current) return;
    stateRef.current = null;
    setState(null);
    current.resolve(ok);
  }, []);

  const confirm = useCallback<ConfirmDialogFn>((opts) => {
    return new Promise<boolean>((resolve) => {
      const prev = stateRef.current;
      if (prev) {
        stateRef.current = null;
        prev.resolve(false);
      }
      const next: ConfirmState = {
        title: opts.title,
        description: opts.description,
        confirmLabel: opts.confirmLabel ?? "Continue",
        cancelLabel: opts.cancelLabel ?? "Cancel",
        resolve,
      };
      stateRef.current = next;
      setState(next);
    });
  }, []);

  const confirmDialog = (
    <Dialog
      open={state != null}
      onOpenChange={(open) => {
        if (!open) close(false);
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{state?.title ?? "Confirm"}</DialogTitle>
          <DialogDescription>{state?.description}</DialogDescription>
        </DialogHeader>
        <DialogBody className="flex gap-2 pb-6">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => close(false)}
          >
            {state?.cancelLabel ?? "Cancel"}
          </Button>
          <Button
            type="button"
            className="flex-1"
            onClick={() => close(true)}
          >
            {state?.confirmLabel ?? "Continue"}
          </Button>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );

  return { confirm, confirmDialog };
}
