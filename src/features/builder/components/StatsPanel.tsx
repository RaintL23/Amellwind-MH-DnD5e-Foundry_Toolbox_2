import { useCharacterBuilder } from "../context/CharacterBuilderContext";
import { AbilityKey } from "@/shared/types";

const ABILITIES: { key: AbilityKey; label: string }[] = [
  { key: "str", label: "STR" },
  { key: "dex", label: "DEX" },
  { key: "con", label: "CON" },
  { key: "int", label: "INT" },
  { key: "wis", label: "WIS" },
  { key: "cha", label: "CHA" },
];

function formatModifier(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

export function StatsPanel() {
  const {
    character, setLevel, setAbilityScore, totalAC,
    attacksPerTurnOverride, setAttacksPerTurnOverride, effectiveAttacksPerTurn,
  } = useCharacterBuilder();

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-4 h-fit">
      <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
        Character Stats
      </h2>

      {/* Level */}
      <div className="flex items-center gap-2">
        <label className="text-xs text-muted-foreground font-medium">Level</label>
        <input
          type="number"
          min={1}
          max={20}
          value={character.level}
          onChange={(e) => setLevel(parseInt(e.target.value) || 1)}
          className="w-14 rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground text-center focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Ability Scores */}
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground font-medium">Ability Scores</label>
        <div className="grid grid-cols-2 gap-2">
          {ABILITIES.map(({ key, label }) => (
            <div key={key} className="flex items-center gap-2">
              <span className="text-xs font-bold text-foreground w-8">{label}</span>
              <input
                type="number"
                min={1}
                max={30}
                value={character.abilities[key]}
                onChange={(e) => setAbilityScore(key, parseInt(e.target.value) || 10)}
                className="w-14 rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground text-center focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <span className="text-xs font-medium text-primary min-w-[28px]">
                {formatModifier(character.getModifier(key))}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Derived Stats */}
      <div className="border-t border-border pt-3 space-y-2">
        <h3 className="text-xs text-muted-foreground font-medium">Derived</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Proficiency</span>
            <span className="font-semibold text-foreground">
              +{character.getProficiencyBonus()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">AC</span>
            <span className="font-semibold text-foreground">{totalAC}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Initiative</span>
            <span className="font-semibold text-foreground">
              {formatModifier(character.getModifier("dex"))}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Attacks/Turn</span>
            <input
              type="number"
              min={1}
              max={10}
              value={attacksPerTurnOverride ?? ""}
              placeholder={String(character.getAttacksPerTurn())}
              onChange={(e) => {
                const v = e.target.value;
                setAttacksPerTurnOverride(v === "" ? null : Math.max(1, parseInt(v) || 1));
              }}
              className="w-12 rounded border border-border bg-background px-1 py-0.5 text-xs text-foreground text-center font-semibold focus:outline-none focus:ring-2 focus:ring-ring"
              title={`Default: ${character.getAttacksPerTurn()} (from level). Override to customize.`}
            />
          </div>
          {attacksPerTurnOverride !== null && (
            <div className="col-span-2 text-[10px] text-muted-foreground">
              Effective: {effectiveAttacksPerTurn} attacks/turn (overridden)
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
