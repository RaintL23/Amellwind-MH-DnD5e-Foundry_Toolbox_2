import { Feat, FeatSection } from "@/shared/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DescriptionLines } from "@/shared/components/DescriptionLines";

interface FeatDetailDialogProps {
  feat: Feat | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function SectionBlock({ section }: { section: FeatSection }) {
  return (
    <div className="mt-3">
      {section.name && (
        <h4 className="text-sm font-semibold text-foreground mb-1.5">
          {section.name}
        </h4>
      )}
      <DescriptionLines lines={section.paragraphs} />
    </div>
  );
}

export function FeatDetailDialog({
  feat,
  open,
  onOpenChange,
}: FeatDetailDialogProps) {
  if (!feat) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-amber-400 text-2xl">
            {feat.name}
          </DialogTitle>
          <DialogDescription asChild>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary">Feat · {feat.source}</Badge>
              {feat.repeatable && (
                <Badge className="bg-violet-950/60 text-violet-300 border-violet-800/50">
                  Repetible
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">
                {feat.page !== undefined ? `p.${feat.page}` : ""}
              </span>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          {(feat.prerequisites.length > 0 || feat.abilityIncreases.length > 0) && (
            <>
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3">
                Requisitos y bonificaciones
              </h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {feat.prerequisites.map((p) => (
                  <span
                    key={p}
                    className="rounded-md border border-border bg-muted/30 px-2.5 py-1 text-xs font-medium text-foreground"
                  >
                    {p}
                  </span>
                ))}
                {feat.abilityIncreases.map((a) => (
                  <span
                    key={a.label}
                    className="rounded-md border border-emerald-800/40 bg-emerald-950/30 px-2.5 py-1 text-xs font-medium text-emerald-400"
                  >
                    {a.label}
                  </span>
                ))}
              </div>
              <Separator className="my-4" />
            </>
          )}

          <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3">
            Descripción
          </h3>
          <DescriptionLines lines={feat.paragraphs} />
          {feat.sections.map((section, i) => (
            <SectionBlock key={section.name ?? i} section={section} />
          ))}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
