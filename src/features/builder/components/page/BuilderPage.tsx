import { StatsPanel } from "../stats/StatsPanel";
import { PaperDoll } from "../equipment/PaperDoll";
import { BuilderDerivedPanel } from "../stats/BuilderDerivedPanel";
import { BuilderSavingThrowsPanel } from "../stats/BuilderSavingThrowsPanel";
import { BuilderSkillChecksPanel } from "../stats/BuilderSkillChecksPanel";
import { BuilderDamagePanel } from "../stats/BuilderDamagePanel";
import { BuilderInventoryPanel } from "../stats/BuilderInventoryPanel";
import { CharacterCreationTipsPanel } from "./CharacterCreationTipsPanel";

export function BuilderPage() {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-border bg-card/50 px-4 py-3 lg:px-6 lg:py-4">
        <h1 className="text-lg font-bold text-foreground lg:text-xl">
          Character Builder
        </h1>
        <p className="mt-0.5 text-xs text-muted-foreground lg:text-sm">
          Equipa armas, armaduras y runas para probar tu daño por turno.
        </p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-3 lg:p-4">
        <div className="mx-auto mb-3 w-full max-w-[1400px] shrink-0">
          <CharacterCreationTipsPanel />
        </div>

        <div className="mx-auto grid min-h-0 w-full max-w-[1400px] flex-1 grid-cols-1 gap-2.5 overflow-y-auto rounded-lg bg-muted/20 p-3 lg:gap-3 lg:p-4 xl:grid-cols-[260px_minmax(0,1fr)_240px]">
          {/* Columna izquierda: stats + derivados + daño */}
          <div className="flex flex-col gap-2.5">
            <StatsPanel />
            <BuilderDerivedPanel />
            <BuilderSavingThrowsPanel />
            <BuilderSkillChecksPanel />
          </div>

          {/* Columna central: equipamiento + biblioteca */}
          <PaperDoll />

          {/* Columna derecha: simulador + notas + rareza */}
          <div className="flex flex-col gap-2.5">
            <BuilderDamagePanel />
            <BuilderInventoryPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
