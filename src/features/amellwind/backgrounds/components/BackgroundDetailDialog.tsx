import {
  Background,
  BACKGROUND_FACTION_LABELS,
} from "@/shared/types";
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
import { DndRichText } from "@/shared/components/DndRichText";
import { DndMarkupTable } from "@/shared/components/DndMarkupTable";

interface BackgroundDetailDialogProps {
  background: Background | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function SectionBlock({
  sections,
  heading,
  accentClass,
}: {
  sections: Background["features"];
  heading: string;
  accentClass: string;
}) {
  if (!sections.length) return null;

  return (
    <>
      <h3
        className={`text-xs font-bold uppercase tracking-wider mb-3 ${accentClass}`}
      >
        {heading}
      </h3>
      <div className="space-y-4">
        {sections.map((section) => (
          <div key={section.name}>
            <h4 className="text-sm font-semibold text-foreground mb-1">
              {section.name}
            </h4>
            {section.entries.map((paragraph, i) => (
              <p
                key={i}
                className="text-sm text-muted-foreground leading-relaxed mb-1"
              >
                <DndRichText text={paragraph} />
              </p>
            ))}
            {section.tables?.map((table, i) => (
              <DndMarkupTable key={i} {...table} />
            ))}
          </div>
        ))}
      </div>
    </>
  );
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
              <Badge variant="secondary">
                {BACKGROUND_FACTION_LABELS[background.faction]}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {background.source}
                {background.page !== undefined ? ` p.${background.page}` : ""}
              </span>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          {background.fluff && (
            <p className="text-sm text-muted-foreground italic mb-4 leading-relaxed border-l-2 border-sky-800/40 pl-3 whitespace-pre-line">
              {background.fluff}
            </p>
          )}

          <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider mb-3">
            Competencies
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 text-sm">
            <div className="rounded-md border border-border bg-muted/20 px-3 py-2 sm:col-span-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
                Skills
              </p>
              <p className="font-medium text-foreground">
                {background.proficiencies.skills}
              </p>
            </div>
            <div className="rounded-md border border-border bg-muted/20 px-3 py-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
                Tools
              </p>
              <p className="font-medium text-foreground">
                {background.proficiencies.tools}
              </p>
            </div>
            <div className="rounded-md border border-border bg-muted/20 px-3 py-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
                Languages
              </p>
              <p className="font-medium text-foreground">
                {background.proficiencies.languages}
              </p>
            </div>
            <div className="rounded-md border border-border bg-muted/20 px-3 py-2 sm:col-span-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
                Initial Equipment
              </p>
              <p className="font-medium text-foreground text-sm leading-relaxed">
                {background.proficiencies.equipment}
              </p>
            </div>
          </div>

          <Separator className="my-4" />

          <SectionBlock
            sections={background.features}
            heading="Background Features"
            accentClass="text-sky-400"
          />

          {background.suggestedCharacteristics.length > 0 && (
            <>
              <Separator className="my-4" />
              <SectionBlock
                sections={background.suggestedCharacteristics}
                heading="Suggested Characteristics"
                accentClass="text-violet-400"
              />
            </>
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
