import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConfirmActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  /** Optional bullet list of what will be lost. */
  lossItems?: string[];
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  destructive?: boolean;
}

export function ConfirmActionDialog({
  open,
  onOpenChange,
  title,
  description,
  lossItems,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  destructive = true,
}: Readonly<ConfirmActionDialogProps>) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 p-0">
        <DialogHeader className="p-5 pb-3">
          <DialogTitle className="text-base">{title}</DialogTitle>
          <DialogDescription className="text-sm">{description}</DialogDescription>
        </DialogHeader>
        {lossItems && lossItems.length > 0 && (
          <ul className="mx-5 mb-3 list-disc space-y-1 rounded-md border border-border/60 bg-muted/30 px-5 py-2.5 text-xs text-muted-foreground">
            {lossItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        )}
        <div className="flex justify-end gap-2 border-t border-border/60 px-5 py-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={() => onOpenChange(false)}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={destructive ? "outline" : "default"}
            size="sm"
            className={
              destructive
                ? "h-8 border-destructive/50 text-xs text-destructive hover:bg-destructive/10"
                : "h-8 text-xs"
            }
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
