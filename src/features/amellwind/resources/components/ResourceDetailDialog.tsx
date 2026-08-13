import { Hammer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  RESOURCE_CATEGORY_ICONS,
  RESOURCE_CATEGORY_LABELS,
  RESOURCE_RARITY_STYLES,
  type Resource,
} from "@/shared/types";
import { cn } from "@/shared/utils/cn";

interface ResourceDetailDialogProps {
  resource: Resource | null;
  open: boolean;
  onClose: () => void;
}

export function ResourceDetailDialog({
  resource,
  open,
  onClose,
}: ResourceDetailDialogProps) {
  if (!resource) return null;
  const style = RESOURCE_RARITY_STYLES[resource.rarity];
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>{RESOURCE_CATEGORY_ICONS[resource.category]}</span>
            <span>{resource.name}</span>
          </DialogTitle>
        </DialogHeader>
        <div className="px-6 pb-6 space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge
              variant="outline"
              className={cn("text-xs font-semibold", style.badge)}
            >
              {resource.rarity}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {RESOURCE_CATEGORY_LABELS[resource.category]}
            </Badge>
            {resource.isCraftingMaterial && (
              <Badge
                variant="outline"
                className="text-xs bg-yellow-900/40 text-yellow-300 border-yellow-700"
              >
                <Hammer className="h-3 w-3 mr-1" />
                Crafting Material
              </Badge>
            )}
          </div>

          <div
            className={cn(
              "rounded-lg border p-4 bg-gradient-to-br",
              style.bg,
              style.border,
            )}
          >
            <p className="text-sm text-muted-foreground leading-relaxed">
              {resource.details}
            </p>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Sell Value:</span>
            <span className="font-semibold text-amber-300">
              {resource.sellValue}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
