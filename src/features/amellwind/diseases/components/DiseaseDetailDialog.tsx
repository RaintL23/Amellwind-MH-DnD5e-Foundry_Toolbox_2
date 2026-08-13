import type { MhDisease } from "@/shared/types";
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

interface DiseaseDetailDialogProps {
  disease: MhDisease | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DiseaseDetailDialog({
  disease,
  open,
  onOpenChange,
}: DiseaseDetailDialogProps) {
  if (!disease) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-purple-400 text-xl">
            {disease.name}
          </DialogTitle>
          <DialogDescription asChild>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <Badge
                variant="outline"
                className="text-xs bg-purple-950/40 text-purple-300 border-purple-800/50"
              >
                {disease.source}
              </Badge>
              {disease.page !== undefined && (
                <Badge variant="outline" className="text-xs">
                  p. {disease.page}
                </Badge>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <StatBlockContentView content={disease.content} />
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
