import { Shield } from "lucide-react";
import type { BackgroundFaction } from "@/shared/types";
import { BACKGROUND_FACTION_LABELS } from "@/shared/types";
import { useCharacterBuilder } from "@/features/builder/context/CharacterBuilderContext";
import { FACTION_OPTIONS } from "@/features/builder/data/faction-spells.data";
import { BuilderPanel } from "../../shared/BuilderPanel";
import { ScrollableWhenNeeded } from "../../shared/ScrollableWhenNeeded";
import { cn } from "@/shared/utils/cn";

export function FactionLibraryPanel() {
  const { faction, setFaction } = useCharacterBuilder();

  function handleSelect(id: BackgroundFaction) {
    setFaction(faction === id ? null : id);
  }

  return (
    <BuilderPanel
      title={
        <>
          <Shield className="h-3.5 w-3.5" aria-hidden />
          Faction — Amellwind
        </>
      }
    >
      <p className="mb-2 text-[11px] text-muted-foreground">
        Faction membership expands your spell list if you are a spellcaster.
        Usually inferred from your Amellwind background.
      </p>
      <ScrollableWhenNeeded>
        {FACTION_OPTIONS.map((option) => {
          const selected = faction === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => handleSelect(option.id)}
              className={cn(
                "mb-1.5 w-full rounded-md border px-2.5 py-2 text-left transition-colors",
                selected
                  ? "border-violet-400/50 bg-violet-400/10"
                  : "border-border/60 hover:bg-muted/50",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-foreground">
                  {BACKGROUND_FACTION_LABELS[option.id]}
                </span>
                {option.hasSpellGrants && (
                  <span className="shrink-0 rounded border border-sky-700/40 bg-sky-950/40 px-1 py-0 text-[9px] text-sky-300">
                    +Spells
                  </span>
                )}
              </div>
              <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
                {option.description}
              </p>
            </button>
          );
        })}
      </ScrollableWhenNeeded>
    </BuilderPanel>
  );
}
