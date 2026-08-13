import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ENVIRONMENT_COLORS, type Environment } from "@/shared/types";
import { cn } from "@/shared/utils/cn";
import { MapPin } from "lucide-react";
import { EnvironmentDetailContent } from "./EnvironmentDetailContent";

interface EnvironmentDetailDialogProps {
  environment: Environment | null;
  open: boolean;
  onClose: () => void;
}

export function EnvironmentDetailDialog({
  environment,
  open,
  onClose,
}: EnvironmentDetailDialogProps) {
  if (!environment) return null;

  const colors =
    ENVIRONMENT_COLORS[environment.name] ?? ENVIRONMENT_COLORS["Verdant Hills"];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <MapPin className={cn("h-5 w-5", colors.accent)} />
            {environment.name}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <EnvironmentDetailContent environment={environment} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
