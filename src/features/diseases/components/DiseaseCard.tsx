import type { MhDisease } from "@/shared/types";
import { cn } from "@/shared/utils/cn";
import { Biohazard } from "lucide-react";

interface DiseaseCardProps {
  disease: MhDisease;
  onClick: () => void;
}

export function DiseaseCard({ disease, onClick }: DiseaseCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-lg border border-border bg-card p-4 transition-all duration-200",
        "hover:bg-card/80 hover:shadow-lg hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "hover:border-purple-500/40",
      )}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="rounded-md p-2 shrink-0 bg-purple-950/60">
          <Biohazard className="h-5 w-5 text-purple-400" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-foreground leading-tight truncate">
            {disease.name}
          </h3>
          <span className="inline-block mt-1 rounded border border-purple-800/40 bg-purple-950/30 px-1.5 py-0.5 text-[10px] font-medium text-purple-300">
            Disease
          </span>
        </div>
      </div>

      {disease.summary && (
        <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
          {disease.summary}
        </p>
      )}

      <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border/50 pt-2.5">
        <span>{disease.source}</span>
        {disease.page !== undefined && <span>p. {disease.page}</span>}
      </div>
    </button>
  );
}
