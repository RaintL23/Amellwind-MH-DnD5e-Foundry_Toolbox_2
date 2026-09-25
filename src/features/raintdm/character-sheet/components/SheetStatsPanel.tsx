import {
  ABILITY_KEYS,
  SKILL_ABILITY,
  SKILL_LABELS,
  SKILL_ORDER,
} from "@/shared/constants/dnd";
import type { AbilityKey, SkillKey } from "@/shared/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ActionLocks } from "../utils/condition-effects.data";
import type { PlayCharacterCompiled } from "../utils/play-character.types";
import type { useSheetRoller } from "../hooks/useSheetRoller";
import { cn } from "@/shared/utils/cn";
import { HitDicePanel, ResourcesPanel } from "./ResourcesPanel";
import type { PlaySessionState } from "../utils/play-character.types";
import type { PlaySessionAction } from "../utils/play-session-reducer";

interface StatsPanelProps {
  compiled: PlayCharacterCompiled;
  session: PlaySessionState;
  locks: ActionLocks;
  dispatch: (a: PlaySessionAction) => void;
  rollD20Test: ReturnType<typeof useSheetRoller>["rollD20Test"];
  /** When true, show Resources + Hit Dice (mobile Stats tab / when no right rail) */
  showResources?: boolean;
  /** Compact aside: single-column skills */
  compact?: boolean;
}

const ABILITY_LABEL: Record<AbilityKey, string> = {
  str: "STR",
  dex: "DEX",
  con: "CON",
  int: "INT",
  wis: "WIS",
  cha: "CHA",
};

function effectiveSpeedLabel(
  compiled: PlayCharacterCompiled,
  locks: ActionLocks,
): string {
  if (locks.speedZero) return "0 ft.";
  let ft = compiled.speedFt;
  if (locks.speedHalf) ft = Math.floor(ft / 2);
  if (locks.speedReductionFt > 0) ft = Math.max(0, ft - locks.speedReductionFt);
  if (ft === compiled.speedFt && !locks.speedHalf) return compiled.speedDisplay;
  return `${ft} ft.`;
}

export function SheetStatsPanel({
  compiled,
  session,
  locks,
  dispatch,
  rollD20Test,
  showResources = false,
  compact = false,
}: StatsPanelProps) {
  const rollCheck = (
    label: string,
    mod: number,
    kind: "ability" | "save" | "skill",
    ability?: AbilityKey,
  ) => {
    void rollD20Test({
      label,
      modifier: mod,
      kind: kind === "save" ? "save" : "check",
      ability,
      locks,
    });
  };

  return (
    <div className="space-y-5">
      <section>
        <h3 className="mb-2 text-sm font-semibold">Abilities</h3>
        <div
          className={cn(
            "grid gap-2",
            compact ? "grid-cols-3" : "grid-cols-3 sm:grid-cols-6",
          )}
        >
          {ABILITY_KEYS.map((key) => {
            const a = compiled.abilities[key];
            return (
              <button
                key={key}
                type="button"
                className="rounded-lg border border-border bg-card p-2 text-center hover:bg-muted/50"
                onClick={() =>
                  rollCheck(
                    `${ABILITY_LABEL[key]} check`,
                    a.mod,
                    "ability",
                    key,
                  )
                }
              >
                <div className="text-[10px] font-semibold text-muted-foreground">
                  {ABILITY_LABEL[key]}
                </div>
                <div className="text-xl font-bold tabular-nums leading-tight">
                  {a.mod >= 0 ? "+" : ""}
                  {a.mod}
                </div>
                <div className="text-[11px] text-muted-foreground tabular-nums">
                  {a.score}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold">Saving Throws</h3>
        <div className={cn("grid gap-1.5", compact ? "grid-cols-1" : "grid-cols-2 sm:grid-cols-3")}>
          {ABILITY_KEYS.map((key) => {
            const mod = compiled.savingThrows[key];
            const prof = compiled.saveProficiencies.includes(key);
            return (
              <Button
                key={key}
                type="button"
                variant="outline"
                size="sm"
                className={cn(
                  "h-10 justify-between",
                  prof && "border-primary/50",
                )}
                onClick={() =>
                  rollCheck(`${ABILITY_LABEL[key]} save`, mod, "save", key)
                }
              >
                <span className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "inline-block h-2 w-2 rounded-full",
                      prof ? "bg-primary" : "bg-muted-foreground/30",
                    )}
                  />
                  {ABILITY_LABEL[key]}
                </span>
                <span className="tabular-nums">
                  {mod >= 0 ? "+" : ""}
                  {mod}
                </span>
              </Button>
            );
          })}
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold">Skills</h3>
        <div
          className={cn(
            "grid gap-1",
            compact ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2",
          )}
        >
          {SKILL_ORDER.map((skill: SkillKey) => {
            const mod = compiled.skills[skill];
            const prof = compiled.skillProficiencies[skill] ?? 0;
            return (
              <Button
                key={skill}
                type="button"
                variant="outline"
                size="sm"
                className={cn(
                  "h-9 justify-between gap-2 text-left",
                  prof > 0 && "border-primary/40",
                )}
                onClick={() =>
                  rollCheck(
                    SKILL_LABELS[skill],
                    mod,
                    "skill",
                    SKILL_ABILITY[skill],
                  )
                }
              >
                <span className="flex min-w-0 items-center gap-1.5">
                  <span
                    className={cn(
                      "inline-block h-2 w-2 shrink-0 rounded-full",
                      prof === 2
                        ? "bg-primary ring-1 ring-primary"
                        : prof === 1
                          ? "bg-primary"
                          : "bg-muted-foreground/30",
                    )}
                    title={
                      prof === 2
                        ? "Expertise"
                        : prof === 1
                          ? "Proficient"
                          : "Not proficient"
                    }
                  />
                  <span className="truncate">{SKILL_LABELS[skill]}</span>
                </span>
                <span className="shrink-0 tabular-nums">
                  {mod >= 0 ? "+" : ""}
                  {mod}
                </span>
              </Button>
            );
          })}
        </div>
      </section>

      <section className="space-y-2 text-sm">
        <h3 className="text-sm font-semibold">Senses</h3>
        <p className="text-xs text-muted-foreground">
          Passive Perception {compiled.passivePerception}
        </p>
        <div>
          <p className="text-xs text-muted-foreground">
            Speed {effectiveSpeedLabel(compiled, locks)}
          </p>
          {compiled.features.some((f) =>
            (f.statEffects ?? []).some((e) => e.kind === "speed"),
          ) ? (
            <ul className="mt-0.5 space-y-0.5 text-[11px] text-emerald-700 dark:text-emerald-400">
              {compiled.features
                .filter((f) =>
                  (f.statEffects ?? []).some((e) => e.kind === "speed"),
                )
                .map((f) => (
                  <li key={f.id}>
                    Active · {f.name}:{" "}
                    {(f.statEffects ?? [])
                      .filter((e) => e.kind === "speed")
                      .map((e) => e.label)
                      .join(", ")}
                  </li>
                ))}
            </ul>
          ) : null}
        </div>
        {compiled.features.some((f) =>
          (f.statEffects ?? []).some(
            (e) =>
              e.kind === "ac" ||
              e.kind === "darkvision" ||
              e.kind === "resistance",
          ),
        ) ? (
          <ul className="space-y-0.5 text-[11px] text-emerald-700 dark:text-emerald-400">
            {compiled.features.flatMap((f) =>
              (f.statEffects ?? [])
                .filter(
                  (e) =>
                    e.kind === "ac" ||
                    e.kind === "darkvision" ||
                    e.kind === "resistance",
                )
                .map((e) => (
                  <li key={`${f.id}-${e.kind}-${e.label}`}>
                    Active · {f.name}: {e.label}
                  </li>
                )),
            )}
          </ul>
        ) : null}
      </section>

      <ProficiencyBadges compiled={compiled} />

      {compiled.multiclassPartial ? (
        <p className="text-xs text-amber-600">
          Multiclass noted — only primary class compiled in this version.
        </p>
      ) : null}

      {showResources ? (
        <>
          <ResourcesPanel
            compiled={compiled}
            session={session}
            dispatch={dispatch}
          />
          <HitDicePanel
            compiled={compiled}
            session={session}
            dispatch={dispatch}
          />
        </>
      ) : null}
    </div>
  );
}

function ProficiencyBadges({
  compiled,
}: {
  compiled: PlayCharacterCompiled;
}) {
  const groups: { label: string; items: string[] }[] = [
    { label: "Languages", items: compiled.languages },
    { label: "Tools", items: compiled.toolProficiencies },
    { label: "Armor", items: compiled.armorProficiencies },
    { label: "Weapons", items: compiled.weaponProficiencies },
  ];
  return (
    <section className="space-y-3">
      {groups.map((g) => (
        <div key={g.label}>
          <h4 className="mb-1.5 text-xs font-semibold text-muted-foreground">
            {g.label}
          </h4>
          {g.items.length === 0 ? (
            <p className="text-xs text-muted-foreground">—</p>
          ) : (
            <div className="flex flex-wrap gap-1">
              {g.items.map((item) => (
                <Badge key={item} variant="secondary" className="font-normal">
                  {item}
                </Badge>
              ))}
            </div>
          )}
        </div>
      ))}
    </section>
  );
}
