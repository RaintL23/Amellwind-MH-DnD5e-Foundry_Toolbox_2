import { Dices, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MonsterStatBlock } from "@/features/monsters/components/MonsterStatBlock";
import { estimateXpFromCr } from "../utils/npc-stats";
import { useNpcCreator } from "../context/NpcCreatorContext";
import { NpcFormFields } from "./NpcFormFields";

export function NpcCreatorPanel() {
  const { loading, builtNpc, randomizeAll, resetDraft } = useNpcCreator();

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground py-8">
        Loading species, backgrounds, and templates…
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
      <div className="xl:sticky xl:top-4 xl:self-start order-1 xl:order-none">
        <div className="rounded-lg border-2 border-amber-800/40 bg-gradient-to-b from-amber-950/20 to-card p-4">
          <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-1">
            Stat Block
          </h3>
          {builtNpc ? (
            <>
              <h2 className="text-xl font-bold text-foreground mb-0.5">
                {builtNpc.name}
              </h2>
              <p className="text-sm text-muted-foreground italic mb-3">
                {builtNpc.descriptor}
              </p>
              <MonsterStatBlock monster={builtNpc} />
              {estimateXpFromCr(builtNpc.cr) > 0 && (
                <p className="text-xs text-muted-foreground mt-3">
                  Estimated XP: {estimateXpFromCr(builtNpc.cr).toLocaleString()}
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Select a template and species to generate an NPC stat block.
            </p>
          )}
        </div>
      </div>

      <div className="space-y-5 order-2 xl:order-none">
        <div className="flex flex-wrap gap-2">
          <Button type="button" className="flex-1 sm:flex-none" onClick={randomizeAll}>
            <Dices className="h-4 w-4 mr-1.5" />
            Randomize NPC
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={resetDraft}
          >
            <RotateCcw className="h-4 w-4 mr-1.5" />
            Reset
          </Button>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <NpcFormFields />
        </div>
      </div>
    </div>
  );
}
