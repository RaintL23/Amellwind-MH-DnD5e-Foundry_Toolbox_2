import { useMemo, useState } from "react";
import { Dice6 } from "lucide-react";
import { useCharacterBuilder } from "../context/CharacterBuilderContext";
import { BuilderPanel } from "./BuilderPanel";

export function BuilderSimulatorPanel() {
  const { combat, effectiveAttacksPerTurn } = useCharacterBuilder();
  const [targetAC, setTargetAC] = useState(14);
  const [rounds, setRounds] = useState(3);

  const { hitChance, totalExpected } = useMemo(() => {
    const breakdown = combat.mainHand;
    if (!breakdown) {
      return { hitChance: 0, totalExpected: 0 };
    }

    const attackBonus = breakdown.attackBonus;
    const hitChancePct = Math.max(
      5,
      Math.min(95, Math.round(((21 - (targetAC - attackBonus)) / 20) * 100)),
    );
    const offHandDpt = combat.offHand?.totalPerTurn ?? 0;
    const mainDpt = breakdown.totalPerTurn;
    const totalDpt = mainDpt + offHandDpt;
    const expected = totalDpt * rounds * (hitChancePct / 100);

    return { hitChance: hitChancePct, totalExpected: expected };
  }, [combat, targetAC, rounds, effectiveAttacksPerTurn]);

  return (
    <BuilderPanel title={<><Dice6 className="h-3.5 w-3.5" aria-hidden /> Simulador</>}>
      <p className="mb-2 text-xs text-muted-foreground">
        Simula rondas de combate contra un objetivo.
      </p>

      <label className="text-[11px] text-muted-foreground">CA del objetivo</label>
      <input
        type="range"
        min={5}
        max={25}
        step={1}
        value={targetAC}
        onChange={(e) => setTargetAC(parseInt(e.target.value, 10))}
        className="mb-1 w-full accent-primary"
      />
      <div className="mb-3 flex justify-between text-[11px] text-muted-foreground">
        <span>5</span>
        <span className="font-medium text-foreground">{targetAC}</span>
        <span>25</span>
      </div>

      <label className="text-[11px] text-muted-foreground">Rondas</label>
      <input
        type="range"
        min={1}
        max={10}
        step={1}
        value={rounds}
        onChange={(e) => setRounds(parseInt(e.target.value, 10))}
        className="mb-1 w-full accent-primary"
      />
      <div className="mb-3 flex justify-between text-[11px] text-muted-foreground">
        <span>1</span>
        <span className="font-medium text-foreground">{rounds}</span>
        <span>10</span>
      </div>

      <div className="rounded-md bg-muted/50 px-3 py-2.5 text-center">
        <div className="text-[11px] text-muted-foreground">Daño esperado total</div>
        <div className="text-[22px] font-medium tabular-nums text-emerald-400">
          {combat.mainHand ? totalExpected.toFixed(1) : "—"}
        </div>
        <div className="text-[11px] text-muted-foreground">
          Chance de impactar:{" "}
          <span className="font-medium text-foreground">
            {combat.mainHand ? `${hitChance}%` : "—"}
          </span>
        </div>
      </div>
    </BuilderPanel>
  );
}
