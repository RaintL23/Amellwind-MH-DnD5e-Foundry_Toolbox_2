import {
  Background,
  BACKGROUND_FACTION_LABELS,
  BackgroundTable,
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
import { parseFiveToolsMarkup } from "@/shared/utils/fivetools-parser";

interface BackgroundDetailDialogProps {
  background: Background | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function RollTable({ caption, colLabels, rows }: BackgroundTable) {
  return (
    <div className="my-3 overflow-x-auto rounded-md border border-border">
      {caption && (
        <p className="px-3 py-2 text-xs font-semibold text-amber-400/90 border-b border-border bg-muted/30">
          {caption}
        </p>
      )}
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border bg-muted/20">
            {colLabels.map((label) => (
              <th
                key={label}
                className="px-3 py-2 text-left font-semibold text-muted-foreground"
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-border/50 last:border-0">
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2 text-foreground/90">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
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
                {parseFiveToolsMarkup(paragraph)}
              </p>
            ))}
            {section.tables?.map((table, i) => (
              <RollTable key={i} {...table} />
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
