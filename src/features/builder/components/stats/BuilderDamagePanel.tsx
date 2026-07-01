import { Swords } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useCharacterBuilder } from "../../context/CharacterBuilderContext";
import { formatDamagePerTurnTooltip } from "../../utils/combat.calculator";
import { getActiveWeaponDamageLabel } from "@/features/weapons/utils/weapon-mode.utils";
import { isMonkClass } from "../../utils/unarmed-strike.utils";
import { NumberStepper } from "../shared/NumberStepper";
import { HintTooltip } from "@/shared/components/HintTooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export function BuilderDamagePanel() {
  const {
    combat,
    character,
    effectiveAttacksPerTurn,
    attacksPerTurnOverride,
    setAttacksPerTurnOverride,
    useUnarmedStrike,
    setUseUnarmedStrike,
    class: classRef,
    mainHand,
    offHand,
  } = useCharacterBuilder();
  const hasEquippedWeapons = Boolean(mainHand || offHand);
  const showDamage = useUnarmedStrike || hasEquippedWeapons;
  const critRange = combat.mainHand?.critRange ?? 20;
  const critPct = Math.round(((21 - critRange) / 20) * 100);
  const attacksPerTurn =
    attacksPerTurnOverride ?? character.getAttacksPerTurn();

  const adjustAttacksPerTurn = (next: number) => {
    if (next < 1 || next > 10) return;
    setAttacksPerTurnOverride(next);
  };

  const damagePerTurnTooltip = formatDamagePerTurnTooltip(combat);

  const unarmedStrikeTooltip = [
    "Use punches, kicks, or similar blows instead of equipped weapons.",
    "Base damage: 1 + Strength modifier (XPHB 2024).",
    isMonkClass(classRef?.name)
      ? "Monk Martial Arts applies: martial arts die + Dexterity."
      : "Useful for Monks, species like Nergigante, or unarmed builds.",
  ].join(" ");

  return (
    <div className="rounded-lg border border-border/60 bg-card">
      <Accordion type="single" collapsible>
        <AccordionItem value="damage" className="border-0">
          <AccordionTrigger className="gap-1.5 px-3.5 py-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground hover:no-underline">
            <span className="flex items-center gap-1.5">
              <Swords className="h-3.5 w-3.5" aria-hidden />
              Damage Calculation
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-3.5 pb-3.5">
            <div className="mb-3 flex items-start gap-2">
              <Checkbox
                id="unarmed-strike"
                checked={useUnarmedStrike}
                onCheckedChange={(c) => setUseUnarmedStrike(c === true)}
                className="mt-0.5"
              />
              <Label
                htmlFor="unarmed-strike"
                className="text-[10px] font-normal leading-snug text-muted-foreground"
              >
                <HintTooltip
                  content={unarmedStrikeTooltip}
                  align="start"
                  className="text-left font-normal"
                >
                  <span className="cursor-help font-medium text-foreground">
                    Unarmed Strike
                  </span>
                </HintTooltip>
              </Label>
            </div>

            {!showDamage ? (
              <p className="py-4 text-center text-xs text-muted-foreground">
                Equip a weapon or enable Unarmed Strike to see estimated damage.
              </p>
            ) : (
              <>
                <div className="rounded-md bg-emerald-950/40 px-3 py-3 text-center">
                  <div className="text-[32px] font-medium leading-none text-emerald-400 tabular-nums">
                    {combat.totalDPT.toFixed(1)}
                  </div>
                  <div className="mt-1 inline-block text-[11px] text-emerald-300/80">
                    <HintTooltip
                      content={damagePerTurnTooltip}
                      className="max-w-[18rem] text-left font-normal"
                    >
                      <span className="cursor-help">average damage per turn</span>
                    </HintTooltip>
                  </div>
                  <div className="mt-1 text-[10px] text-muted-foreground">
                    Level {character.level}
                    {useUnarmedStrike ? " · Unarmed Strike" : ""}
                  </div>
                </div>

                <p className="mb-1.5 mt-3 text-[11px] uppercase tracking-wide text-muted-foreground">
                  Breakdown
                </p>
                <div className="flex flex-col gap-1 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">Attacks per turn</span>
                    <NumberStepper
                      value={attacksPerTurn}
                      min={1}
                      max={10}
                      onChange={adjustAttacksPerTurn}
                      ariaLabel="Attacks per turn"
                      title={`Default: ${character.getAttacksPerTurn()} (level). Override to customize.`}
                    />
                  </div>
                  {useUnarmedStrike && combat.mainHand && (
                    <BreakdownLine
                      name={
                        combat.mainHand.sources.find((s) => s.type === "weapon")
                          ?.source ?? "Unarmed Strike"
                      }
                      detail={`${combat.mainHand.diceExpression} (${combat.mainHand.totalPerHit.toFixed(1)} avg)`}
                    />
                  )}
                  {!useUnarmedStrike && combat.mainHand && mainHand && (
                    <BreakdownLine
                      name={(() => {
                        const modeLabel = getActiveWeaponDamageLabel(mainHand);
                        return modeLabel === "Damage"
                          ? mainHand.weapon.name
                          : `${mainHand.weapon.name} (${modeLabel})`;
                      })()}
                      detail={`${combat.mainHand.diceExpression} (${combat.mainHand.totalPerHit.toFixed(1)} avg)`}
                    />
                  )}
                  {!useUnarmedStrike && combat.offHand && offHand && (
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
                  {combat.mainHand && (
                    <BreakdownLine
                      name="Critical Range"
                      detail={critRange === 20 ? "20" : `${critRange}–20`}
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
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
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
