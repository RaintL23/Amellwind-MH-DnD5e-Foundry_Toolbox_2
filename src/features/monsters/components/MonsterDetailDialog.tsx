import { Monster } from "@/shared/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
} from "@/components/ui/dialog";
import { MonsterStatBlock } from "./MonsterStatBlock";
import { getTier } from "@/shared/utils/cr.utils";
import { Badge } from "@/components/ui/badge";

interface MonsterDetailDialogProps {
  monster: Monster | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MonsterDetailDialog({
  monster,
  open,
  onOpenChange,
}: MonsterDetailDialogProps) {
  if (!monster) return null;

  const tier = getTier(monster.cr);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-amber-400 text-2xl">
            {monster.name}
          </DialogTitle>
          <DialogDescription asChild>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline">CR {monster.cr}</Badge>
              <Badge variant="secondary">Tier {tier}</Badge>
              <Badge variant="outline" className="capitalize">
                {monster.type.type}
              </Badge>
              {monster.group?.map((g) => (
                <Badge key={g} variant="outline">
                  {g}
                </Badge>
              ))}
              <span className="text-xs text-muted-foreground">
                {monster.source} p.{monster.page}
              </span>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          {monster.fluff && (
            <p className="text-sm text-muted-foreground italic mb-4 leading-relaxed border-l-2 border-amber-800/40 pl-3">
              {monster.fluff}
            </p>
          )}
          <MonsterStatBlock monster={monster} />
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
