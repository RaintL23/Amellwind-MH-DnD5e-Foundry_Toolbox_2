import { Species, SPECIES_CATEGORY_LABELS } from "@/shared/types";
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

interface SpeciesDetailDialogProps {
  species: Species | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function TraitTable({
  caption,
  colLabels,
  rows,
}: {
  caption?: string;
  colLabels: string[];
  rows: string[][];
}) {
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

export function SpeciesDetailDialog({
  species,
  open,
  onOpenChange,
}: SpeciesDetailDialogProps) {
  if (!species) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-emerald-400 text-2xl">
            {species.name}
          </DialogTitle>
          <DialogDescription asChild>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary">
                {SPECIES_CATEGORY_LABELS[species.category]}
              </Badge>
              {species.isSubrace && species.parentSpecies && (
                <Badge variant="outline">
                  {species.parentSpecies}
                  {species.parentSource ? ` (${species.parentSource})` : ""}
                </Badge>
              )}
              <Badge variant="outline">{species.sizes.join(", ")}</Badge>
              <Badge variant="outline">{species.speed}</Badge>
              <span className="text-xs text-muted-foreground">
                {species.source}
                {species.page !== undefined ? ` p.${species.page}` : ""}
              </span>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          {species.fluff && (
            <p className="text-sm text-muted-foreground italic mb-4 leading-relaxed border-l-2 border-emerald-800/40 pl-3 whitespace-pre-line">
              {species.fluff}
            </p>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4 text-sm">
            <div className="rounded-md border border-border bg-muted/20 px-3 py-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
                Bonificadores
              </p>
              <p className="font-medium text-foreground">{species.abilitySummary}</p>
            </div>
            {species.darkvision !== undefined && (
              <div className="rounded-md border border-border bg-muted/20 px-3 py-2">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
                  Visión en la oscuridad
                </p>
                <p className="font-medium text-foreground">{species.darkvision} ft.</p>
              </div>
            )}
            {(species.resistances.length > 0 || species.resistanceSummary) && (
              <div className="rounded-md border border-border bg-muted/20 px-3 py-2">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
                  Resistencias
                </p>
                <p className="font-medium text-foreground capitalize">
                  {[
                    ...species.resistances,
                    species.resistanceSummary,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
            )}
          </div>

          {species.traitTags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {species.traitTags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          <Separator className="my-4" />

          <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3">
            Rasgos de especie
          </h3>
          <div className="space-y-4">
            {species.traits.map((trait) => (
              <div key={trait.name}>
                <h4 className="text-sm font-semibold text-foreground mb-1">
                  {trait.name}
                </h4>
                {trait.entries.map((paragraph, i) => (
                  <p
                    key={i}
                    className="text-sm text-muted-foreground leading-relaxed mb-1"
                  >
                    {parseFiveToolsMarkup(paragraph)}
                  </p>
                ))}
                {trait.tables?.map((table, i) => (
                  <TraitTable
                    key={i}
                    caption={table.caption}
                    colLabels={table.colLabels}
                    rows={table.rows}
                  />
                ))}
              </div>
            ))}
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
