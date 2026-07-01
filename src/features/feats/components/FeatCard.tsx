import { Feat } from "@/shared/types";
import { Card } from "@/components/ui/card";
import { Award } from "lucide-react";

interface FeatCardProps {
  feat: Feat;
  onClick: () => void;
}

export function FeatCard({ feat, onClick }: FeatCardProps) {
  const preview =
    feat.paragraphs[0] ??
    feat.sections[0]?.paragraphs[0] ??
    feat.summary;

  return (
    <Card
      asChild
      className="w-full text-left p-4 transition-all duration-200 hover:bg-card/80 hover:shadow-lg hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring hover:border-amber-500/40"
    >
      <button type="button" onClick={onClick}>
      <div className="flex items-start gap-3 mb-3">
        <div className="rounded-md p-2 shrink-0 bg-amber-950/60">
          <Award className="h-5 w-5 text-amber-400" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-foreground leading-tight truncate">
            {feat.name}
          </h3>
          <div className="flex flex-wrap gap-1 mt-1">
            {feat.prerequisites.map((p) => (
              <span
                key={p}
                className="inline-block rounded border border-border/50 px-1.5 py-0.5 text-[10px] font-medium text-amber-400/90"
              >
                {p}
              </span>
            ))}
            {feat.abilityIncreases.map((a) => (
              <span
                key={a.label}
                className="inline-block rounded border border-emerald-800/50 bg-emerald-950/40 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400"
              >
                {a.label}
              </span>
            ))}
            {feat.repeatable && (
              <span className="inline-block rounded border border-violet-800/50 bg-violet-950/40 px-1.5 py-0.5 text-[10px] font-medium text-violet-400">
                Repetible
              </span>
            )}
          </div>
        </div>
      </div>

      {preview && (
        <p className="text-sm text-muted-foreground line-clamp-3 mb-3 leading-relaxed">
          {preview}
        </p>
      )}

      <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border/50 pt-2.5">
        <span>{feat.source}</span>
        {feat.page !== undefined && <span>p. {feat.page}</span>}
      </div>
      </button>
    </Card>
  );
}
