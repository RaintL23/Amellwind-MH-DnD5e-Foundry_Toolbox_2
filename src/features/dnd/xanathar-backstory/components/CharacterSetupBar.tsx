import { ALL_RACES, ALL_BACKGROUNDS, ALL_CLASSES } from "../data/xanathar-tables.data";

interface CharacterSetupBarProps {
  selectedRace: string;
  selectedBackground: string;
  selectedClass: string;
  charismaModifier: number;
  onRaceChange: (race: string) => void;
  onBackgroundChange: (bg: string) => void;
  onClassChange: (cls: string) => void;
  onCharismaChange: (mod: number) => void;
}

export function CharacterSetupBar({
  selectedRace,
  selectedBackground,
  selectedClass,
  charismaModifier,
  onRaceChange,
  onBackgroundChange,
  onClassChange,
  onCharismaChange,
}: CharacterSetupBarProps) {
  return (
    <div className="flex flex-wrap gap-3 items-end p-4 bg-muted/40 border border-border rounded-lg">
      <div className="flex flex-col gap-1 min-w-[130px]">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Race
        </label>
        <select
          value={selectedRace}
          onChange={(e) => onRaceChange(e.target.value)}
          className="h-8 rounded-md border border-input bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          {ALL_RACES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1 min-w-[150px]">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Background
        </label>
        <select
          value={selectedBackground}
          onChange={(e) => onBackgroundChange(e.target.value)}
          className="h-8 rounded-md border border-input bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">— Select —</option>
          {ALL_BACKGROUNDS.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1 min-w-[140px]">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Class
        </label>
        <select
          value={selectedClass}
          onChange={(e) => onClassChange(e.target.value)}
          className="h-8 rounded-md border border-input bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">— Select —</option>
          {ALL_CLASSES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1 w-[110px]">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          CHA Modifier
        </label>
        <input
          type="number"
          min={-5}
          max={10}
          value={charismaModifier}
          onChange={(e) => onCharismaChange(Number(e.target.value))}
          className="h-8 rounded-md border border-input bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      <p className="text-xs text-muted-foreground self-end pb-1">
        Used for Childhood Memories &amp; filtering Background/Class tables.
      </p>
    </div>
  );
}
