import type { Background } from "@/shared/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { BackgroundContent } from "@/shared/components/background/BackgroundContent";
import { getBackgroundMetaLabels } from "@/shared/utils/background-display.utils";

interface BackgroundDetailDialogProps {
  background: Background | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BackgroundDetailDialog({
  background,
  open,
  onOpenChange,
}: BackgroundDetailDialogProps) {
  if (!background) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-sky-400 text-2xl">
            {background.name}
          </DialogTitle>
          <DialogDescription asChild>
            <div className="flex items-center gap-2 flex-wrap">
              {getBackgroundMetaLabels(background).map((label, i) => (
                <Badge key={label} variant={i === 0 ? "secondary" : "outline"}>
                  {label}
                </Badge>
              ))}
              <span className="text-xs text-muted-foreground">
                {background.source}
                {background.page !== undefined ? ` p.${background.page}` : ""}
              </span>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <BackgroundContent
            background={background}
            density="comfortable"
            accent="sky"
          />
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
