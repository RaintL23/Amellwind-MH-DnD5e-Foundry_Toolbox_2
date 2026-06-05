import { Swords } from "lucide-react";
import { useCharacterBuilder } from "../context/CharacterBuilderContext";
import { BuilderPanel } from "./BuilderPanel";

export function BuilderDamagePanel() {
  const {
    combat,
    character,
    effectiveAttacksPerTurn,
    attacksPerTurnOverride,
    setAttacksPerTurnOverride,
    mainHand,
    offHand,
  } = useCharacterBuilder();
  const hasEquipment = combat.mainHand || combat.offHand;
  const critRange = combat.mainHand?.critRange ?? 20;
  const critPct = Math.round(((21 - critRange) / 20) * 100);

  return (
    <BuilderPanel
      title={
        <>
          <Swords className="h-3.5 w-3.5" aria-hidden /> Damage Calculation
        </>
      }
    >
      {!hasEquipment ? (
        <p className="py-4 text-center text-xs text-muted-foreground">
          Equip a weapon to see the estimated damage.
        </p>
      ) : (
        <>
          <div className="rounded-md bg-emerald-950/40 px-3 py-3 text-center">
            <div className="text-[32px] font-medium leading-none text-emerald-400 tabular-nums">
              {combat.totalDPT.toFixed(1)}
            </div>
            <div className="mt-1 text-[11px] text-emerald-300/80">
              average damage per turn
            </div>
            <div className="mt-1 text-[10px] text-muted-foreground">
              Level {character.level}
            </div>
          </div>

          <p className="mb-1.5 mt-3 text-[11px] uppercase tracking-wide text-muted-foreground">
            Breakdown
          </p>
          <div className="flex flex-col gap-1 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Attacks per turn</span>
              <input
                type="number"
                min={1}
                max={10}
                value={attacksPerTurnOverride ?? 1}
                placeholder={String(character.getAttacksPerTurn())}
                onChange={(e) => {
                  const v = e.target.value;
                  setAttacksPerTurnOverride(
                    v === "" ? null : Math.max(1, parseInt(v) || 1),
                  );
                }}
                className="w-14 rounded border border-border bg-background px-1 py-0.5 text-left text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                title={`Default: ${character.getAttacksPerTurn()} (level). Override to customize.`}
              />
            </div>
            {combat.mainHand && mainHand && (
              <BreakdownLine
                name={mainHand.weapon.name}
                detail={`${combat.mainHand.diceExpression} (${combat.mainHand.totalPerHit.toFixed(1)} avg)`}
              />
            )}
            {combat.offHand && offHand && (
              <BreakdownLine
                name={`${offHand.weapon.name} (bonus)`}
                detail={`${combat.offHand.diceExpression} (${combat.offHand.totalPerHit.toFixed(1)} avg)`}
              />
            )}
            {combat.mainHand && (
              <BreakdownLine
                name="Attack Bonus"
                detail={`+${combat.mainHand.attackBonus}`}
              />
            )}
          </div>

          <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-violet-400 transition-all"
              style={{ width: `${critPct}%` }}
            />
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Critical Chance:{" "}
            <span className="font-medium text-foreground">{critPct}%</span>
          </p>
          {attacksPerTurnOverride !== null && (
            <p className="mt-1 text-[10px] text-muted-foreground">
              Effective: {effectiveAttacksPerTurn} attacks per turn (overridden)
            </p>
          )}
        </>
      )}
    </BuilderPanel>
  );
}

function BreakdownLine({ name, detail }: { name: string; detail: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="truncate text-muted-foreground">{name}</span>
      <span className="shrink-0 font-medium text-foreground">{detail}</span>
    </div>
  );
}
