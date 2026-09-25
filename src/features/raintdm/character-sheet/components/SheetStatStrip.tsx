import type { ActionLocks } from "../utils/condition-effects.data";
import type { PlayCharacterCompiled } from "../utils/play-character.types";

function effectiveSpeedFt(
  compiled: PlayCharacterCompiled,
  locks: ActionLocks,
): number {
  if (locks.speedZero) return 0;
  let ft = compiled.speedFt;
  if (locks.speedHalf) ft = Math.floor(ft / 2);
  if (locks.speedReductionFt > 0) ft = Math.max(0, ft - locks.speedReductionFt);
  return ft;
}

interface SheetStatStripProps {
  compiled: PlayCharacterCompiled;
  locks: ActionLocks;
  effectiveAc: number;
  onRollInit: () => void;
}

export function SheetStatStrip({
  compiled,
  locks,
  effectiveAc,
  onRollInit,
}: SheetStatStripProps) {
  const speedFt = effectiveSpeedFt(compiled, locks);
  const speedLabel =
    speedFt === compiled.speedFt && !locks.speedHalf && !locks.speedZero
      ? compiled.speedDisplay
      : `${speedFt} ft.`;

  const initLabel = `${compiled.initiativeMod >= 0 ? "+" : ""}${compiled.initiativeMod}`;

  const boxes: {
    key: string;
    label: string;
    value: string;
    onClick?: () => void;
  }[] = [
    { key: "ac", label: "AC", value: String(effectiveAc) },
    {
      key: "init",
      label: "Init",
      value: initLabel,
      onClick: onRollInit,
    },
    { key: "speed", label: "Speed", value: speedLabel },
    {
      key: "pb",
      label: "Prof. Bonus",
      value: `+${compiled.proficiencyBonus}`,
    },
    {
      key: "pp",
      label: "Passive Perception",
      value: String(compiled.passivePerception),
    },
  ];

  return (
    <div className="-mx-3 flex gap-2 overflow-x-auto px-3 pb-1">
      {boxes.map((b) =>
        b.onClick ? (
          <button
            key={b.key}
            type="button"
            onClick={b.onClick}
            className="flex min-w-[4.25rem] shrink-0 flex-col items-center rounded-lg border border-border bg-card px-2.5 py-1.5 text-center hover:bg-muted/60 active:scale-[0.98]"
          >
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {b.label}
            </span>
            <span className="text-sm font-bold tabular-nums leading-tight">
              {b.value}
            </span>
          </button>
        ) : (
          <div
            key={b.key}
            className="flex min-w-[4.25rem] shrink-0 flex-col items-center rounded-lg border border-border bg-card px-2.5 py-1.5 text-center"
          >
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {b.label}
            </span>
            <span className="text-sm font-bold tabular-nums leading-tight">
              {b.value}
            </span>
          </div>
        ),
      )}
    </div>
  );
}
