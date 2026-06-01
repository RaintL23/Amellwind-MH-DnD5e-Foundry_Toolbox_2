import { ItemRefText } from "@/shared/components/ItemRefText";
import type { DailySkillRollResult } from "@/shared/types";

export function DailySkillResultCard({
  result,
  itemDescMap,
  onClose,
}: {
  result: DailySkillRollResult;
  itemDescMap: Record<string, string>;
  onClose: () => void;
}) {
  return (
    <div className="rounded-lg border-2 border-primary/30 bg-primary/10 p-5 mb-5 relative">
      <button
        onClick={onClose}
        className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors text-lg leading-none"
        aria-label="Cerrar resultado"
      >
        ×
      </button>
      <div className="flex items-start gap-4">
        <div className="flex items-center justify-center w-14 h-14 rounded-full border-2 border-primary/30 bg-primary/20 shrink-0 flex-col">
          <span className="text-xs text-muted-foreground leading-none">
            Roll
          </span>
          <span className="font-bold text-2xl text-primary leading-tight">
            {result.total}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-xs text-muted-foreground">
              d20({result.d20}) + d6({result.d6}) − 1 ={" "}
              <strong className="text-foreground">{result.total}</strong>
            </span>
          </div>
          <h3 className="font-bold text-xl text-primary mb-2">
            {result.skill.name}
          </h3>
          <p className="text-sm text-foreground leading-relaxed">
            <ItemRefText
              text={result.skill.effect}
              itemDescMap={itemDescMap}
            />
          </p>
        </div>
      </div>
    </div>
  );
}
