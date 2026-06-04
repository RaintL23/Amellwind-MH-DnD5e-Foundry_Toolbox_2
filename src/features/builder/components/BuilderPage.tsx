import { CharacterBuilderProvider } from "../context/CharacterBuilderContext";
import { StatsPanel } from "./StatsPanel";
import { PaperDoll } from "./PaperDoll";
import { BuilderDerivedPanel } from "./BuilderDerivedPanel";
import { BuilderDamagePanel } from "./BuilderDamagePanel";
import { BuilderSimulatorPanel } from "./BuilderSimulatorPanel";
import { BuilderRaritySummaryPanel } from "./BuilderRaritySummaryPanel";
import { CharacterCreationTipsPanel } from "./CharacterCreationTipsPanel";

export function BuilderPage() {
  return (
    <CharacterBuilderProvider>
      <div className="flex h-full flex-col">
        <div className="shrink-0 border-b border-border bg-card/50 px-4 py-3 lg:px-6 lg:py-4">
          <h1 className="text-lg font-bold text-foreground lg:text-xl">
            Character Builder
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground lg:text-sm">
            Equipa armas, armaduras y runas para probar tu daño por turno.
          </p>
        </div>

        <div className="flex-1 overflow-auto p-3 lg:p-4">
          <div className="mx-auto mb-3">
            <CharacterCreationTipsPanel />
          </div>

          <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-2.5 rounded-lg bg-muted/20 p-3 lg:gap-3 lg:p-4 xl:grid-cols-[260px_minmax(0,1fr)_240px]">
            {/* Columna izquierda: stats + derivados + daño */}
            <div className="flex flex-col gap-2.5">
              <StatsPanel />
              <BuilderDerivedPanel />
              <BuilderDamagePanel />
            </div>

            {/* Columna central: equipamiento + biblioteca */}
            <PaperDoll />

            {/* Columna derecha: simulador + notas + rareza */}
            <div className="flex flex-col gap-2.5">
              <BuilderSimulatorPanel />
              {/* <BuilderNotesPanel /> */}
              <BuilderRaritySummaryPanel />
            </div>
          </div>
        </div>
      </div>
    </CharacterBuilderProvider>
  );
}
