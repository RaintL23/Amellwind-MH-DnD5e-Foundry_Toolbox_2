import type { MhCondition } from "@/shared/types";
import { StatBlockContentView } from "@/components/statblock/StatBlockContentView";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface ConditionDetailDialogProps {
  condition: MhCondition | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConditionDetailDialog({
  condition,
  open,
  onOpenChange,
}: ConditionDetailDialogProps) {
  if (!condition) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-rose-400 text-xl">
            {condition.name}
          </DialogTitle>
          <DialogDescription asChild>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <Badge
                variant="outline"
                className="text-xs bg-rose-950/40 text-rose-300 border-rose-800/50"
              >
                {condition.source}
              </Badge>
              {condition.page !== undefined && (
                <Badge variant="outline" className="text-xs">
                  p. {condition.page}
                </Badge>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <StatBlockContentView content={condition.content} />
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
