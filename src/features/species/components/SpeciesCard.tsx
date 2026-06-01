import {
  Species,
  SPECIES_CATEGORY_LABELS,
} from "@/shared/types";
import { cn } from "@/shared/utils/cn";
import { Users, Eye, Shield } from "lucide-react";

const CATEGORY_ACCENT: Record<string, string> = {
  ancestry: "text-emerald-400",
  folk: "text-cyan-400",
  "elder-dragon": "text-amber-400",
  subrace: "text-violet-400",
  lineage: "text-rose-400",
};

const CATEGORY_BG: Record<string, string> = {
  ancestry: "bg-emerald-950/60",
  folk: "bg-cyan-950/60",
  "elder-dragon": "bg-amber-950/60",
  subrace: "bg-violet-950/60",
  lineage: "bg-rose-950/60",
};

interface SpeciesCardProps {
  species: Species;
  onClick: () => void;
}

export function SpeciesCard({ species, onClick }: SpeciesCardProps) {
  const accent = CATEGORY_ACCENT[species.category] ?? "text-primary";
  const iconBg = CATEGORY_BG[species.category] ?? "bg-primary/10";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-lg border border-border bg-card p-4 transition-all duration-200",
        "hover:bg-card/80 hover:shadow-lg hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "hover:border-primary/40",
      )}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className={cn("rounded-md p-2 shrink-0", iconBg)}>
          <Users className={cn("h-5 w-5", accent)} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-foreground leading-tight truncate">
            {species.name}
          </h3>
          {species.isSubrace && species.parentSpecies && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {species.parentSpecies}
              {species.parentSource ? ` (${species.parentSource})` : ""}
            </p>
          )}
          <span
            className={cn(
              "inline-block mt-1 rounded border border-border/50 px-1.5 py-0.5 text-[10px] font-medium",
              accent,
            )}
          >
            {SPECIES_CATEGORY_LABELS[species.category]}
          </span>
        </div>
      </div>

      <div className="space-y-1.5 mb-3 text-sm">
        <p className="text-muted-foreground">
          <span className="text-foreground/80 font-medium">Atributos:</span>{" "}
          {species.abilitySummary}
        </p>
        <p className="text-xs text-muted-foreground">
          {species.sizes.join(", ")} · {species.speed}
        </p>
      </div>

      <div className="flex flex-wrap gap-1 mb-2">
        {species.darkvision !== undefined && (
          <span className="inline-flex items-center gap-0.5 rounded border border-border/50 bg-muted/40 px-1.5 py-0.5 text-[10px] text-muted-foreground">
            <Eye className="h-2.5 w-2.5" />
            DV {species.darkvision} ft.
          </span>
        )}
        {species.resistances.map((r) => (
          <span
            key={r}
            className="inline-flex items-center gap-0.5 rounded border border-border/50 bg-muted/40 px-1.5 py-0.5 text-[10px] text-muted-foreground capitalize"
          >
            <Shield className="h-2.5 w-2.5" />
            {r}
          </span>
        ))}
        {species.resistanceSummary && (
          <span
            className="inline-flex items-center gap-0.5 rounded border border-amber-800/40 bg-amber-950/30 px-1.5 py-0.5 text-[10px] text-amber-300/90 capitalize"
            title={species.resistanceSummary}
          >
            <Shield className="h-2.5 w-2.5" />
            {species.resistanceSummary}
          </span>
        )}
        {species.traitTags.slice(0, 2).map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center rounded border border-border/50 bg-muted/40 px-1.5 py-0.5 text-[10px] text-muted-foreground"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border/50 pt-2.5">
        <span>{species.source}</span>
        {species.page !== undefined && <span>p. {species.page}</span>}
      </div>
    </button>
  );
}
