import { useMemo } from "react";
import { Star } from "lucide-react";
import { RARITY_ORDER } from "@/shared/types";
import { cn } from "@/shared/utils/cn";
import { useCharacterBuilder } from "../context/CharacterBuilderContext";
import { BuilderPanel } from "./BuilderPanel";

const RARITY_DOT: Record<string, string> = {
  Common: "bg-zinc-400",
  Uncommon: "bg-emerald-400",
  Rare: "bg-sky-400",
  "Very Rare": "bg-violet-400",
  Legendary: "bg-amber-400",
};

const RARITY_SHORT: Record<string, string> = {
  Common: "Común",
  Uncommon: "Poco",
  Rare: "Raro",
  "Very Rare": "M.Raro",
  Legendary: "Leg",
};

export function BuilderRaritySummaryPanel() {
  const { mainHand, offHand, armor } = useCharacterBuilder();

  const counts = useMemo(() => {
    const result: Record<string, number> = Object.fromEntries(
      RARITY_ORDER.map((r) => [r, 0]),
    );
    for (const item of [mainHand, offHand, armor]) {
      if (!item) continue;
      const rarity = item.rarity;
      if (rarity in result) result[rarity] += 1;
    }
    return result;
  }, [mainHand, offHand, armor]);

  return (
    <BuilderPanel title={<><Star className="h-3.5 w-3.5" aria-hidden /> Rareza activa</>}>
      <div className="flex flex-wrap gap-x-3 gap-y-1.5">
        {RARITY_ORDER.map((rarity) => (
          <span
            key={rarity}
            className="flex items-center gap-1 text-[11px] text-muted-foreground"
          >
            <span
              className={cn("inline-block h-1.5 w-1.5 rounded-full", RARITY_DOT[rarity])}
            />
            {RARITY_SHORT[rarity]}:{" "}
            <b className="text-foreground">{counts[rarity]}</b>
          </span>
        ))}
      </div>
    </BuilderPanel>
  );
}
