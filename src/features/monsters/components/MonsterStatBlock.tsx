import { Monster } from "@/shared/types";
import type { SkillKey } from "@/shared/types";
import {
  ABILITY_KEYS,
  ABILITY_ABBREVIATIONS,
  SKILL_LABELS,
} from "@/shared/constants/dnd";
import { StatBlockContentView } from "@/components/statblock/StatBlockContentView";
import { SpellcastingBlockView } from "@/components/statblock/SpellcastingBlockView";
import { getEntryContent } from "@/shared/utils/entry-text.utils";
import { getAbilityModifier, formatModifier } from "@/shared/utils/cr.utils";
import { Separator } from "@/components/ui/separator";
import { StatBlockSection } from "@/shared/components/StatBlockSection";
import type { SpellcastingBlock } from "@/shared/types/bestiary-creature.types";

const ABILITY_LABELS = ABILITY_KEYS.map(
  (key) => [key, ABILITY_ABBREVIATIONS[key]] as const,
);

function formatSpeed(speed: Monster["speed"]): string {
  const parts: string[] = [];
  if (speed.walk) parts.push(`${speed.walk} ft.`);
  if (speed.fly) parts.push(`fly ${speed.fly} ft.${speed.hover ? " (hover)" : ""}`);
  if (speed.swim) parts.push(`swim ${speed.swim} ft.`);
  if (speed.burrow) parts.push(`burrow ${speed.burrow} ft.`);
  if (speed.climb) parts.push(`climb ${speed.climb} ft.`);
  return parts.join(", ") || "—";
}

function formatAlignment(alignment: string[]): string {
  const map: Record<string, string> = {
    U: "Unaligned",
    N: "Neutral",
    L: "Lawful",
    G: "Good",
    E: "Evil",
    C: "Chaotic",
    CE: "Chaotic Evil",
    NE: "Neutral Evil",
    LE: "Lawful Evil",
    CG: "Chaotic Good",
    NG: "Neutral Good",
    LG: "Lawful Good",
    LN: "Lawful Neutral",
    CN: "Chaotic Neutral",
    A: "Any alignment",
  };
  return alignment.map((a) => map[a] ?? a).join(" ");
}

function formatSenses(senses: Monster["senses"]): string {
  const parts: string[] = [];
  if (senses.darkvision) parts.push(`Darkvision ${senses.darkvision} ft.`);
  if (senses.blindsight) parts.push(`Blindsight ${senses.blindsight} ft.`);
  if (senses.tremorsense) parts.push(`Tremorsense ${senses.tremorsense} ft.`);
  if (senses.truesight) parts.push(`Truesight ${senses.truesight} ft.`);
  if (senses.special) parts.push(senses.special);
  return parts.join(", ") || "—";
}

function formatDamage(items: Monster["damageImmunities"]): string {
  return items
    .map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object" && "resist" in item) {
        const note = item.note ? ` (${item.note})` : "";
        return (item.resist ?? []).join(", ") + note;
      }
      return "";
    })
    .filter(Boolean)
    .join("; ") || "—";
}

function partitionSpellcasting(spellcasting: SpellcastingBlock[] = []) {
  return {
    trait: spellcasting.filter((s) => s.displayAs === "trait"),
    action: spellcasting.filter((s) => s.displayAs === "action"),
  };
}

interface EntryBlockProps {
  entries: Monster["traits"];
  spellcasting?: SpellcastingBlock[];
}

function EntryBlock({ entries, spellcasting = [] }: EntryBlockProps) {
  if (!entries || entries.length === 0) return null;
  return (
    <div className="space-y-3">
      {entries.map((entry, i) => {
        const embeddedSpell = spellcasting.find(
          (s) => s.name === entry.name || s.displayAs === entry.name.toLowerCase(),
        );
        return (
          <div key={i}>
            <p className="text-sm">
              <strong className="text-foreground">{entry.name}.</strong>{" "}
            </p>
            <div className="mt-1 pl-0">
              {embeddedSpell ? (
                <SpellcastingBlockView block={embeddedSpell} />
              ) : (
                <StatBlockContentView content={getEntryContent(entry)} />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface MonsterStatBlockProps {
  monster: Monster;
}

export function MonsterStatBlock({ monster }: MonsterStatBlockProps) {
  const spellcastingParts = partitionSpellcasting(monster.spellcasting);

  return (
    <div className="font-sans text-sm">
      {/* Tipo y tamaño */}
      <p className="text-muted-foreground italic mb-3">
        {monster.size} {monster.type.type}
        {monster.type.tags && monster.type.tags.length > 0
          ? ` (${monster.type.tags.join(", ")})`
          : ""}
        {", "}
        {formatAlignment(monster.alignment)}
      </p>

      <Separator className="bg-amber-800/30" />

      {/* Stats principales */}
      <div className="mt-3 space-y-1">
        <p>
          <strong className="text-amber-400">Armor Class</strong>{" "}
          <span className="text-foreground">
            {monster.armorClass.map((ac, i) => (
              <span key={i}>
                {ac.ac}
                {ac.from ? ` (${ac.from.join(", ")})` : ""}
                {i < monster.armorClass.length - 1 ? ", " : ""}
              </span>
            ))}
          </span>
        </p>
        <p>
          <strong className="text-amber-400">Hit Points</strong>{" "}
          <span className="text-foreground">
            {monster.hp.average ?? "—"}
            {monster.hp.formula ? ` (${monster.hp.formula})` : ""}
          </span>
        </p>
        <p>
          <strong className="text-amber-400">Speed</strong>{" "}
          <span className="text-foreground">{formatSpeed(monster.speed)}</span>
        </p>
      </div>

      <Separator className="bg-amber-800/30 mt-3" />

      {/* Ability Scores */}
      <div className="grid grid-cols-6 gap-2 mt-3 text-center">
        {ABILITY_LABELS.map(([key, label]) => {
          const value = monster.abilities[key];
          const mod = getAbilityModifier(value);
          return (
            <div key={key} className="flex flex-col items-center">
              <span className="text-xs font-bold text-amber-400">{label}</span>
              <span className="text-base font-semibold text-foreground">{value}</span>
              <span className="text-xs text-muted-foreground">{formatModifier(mod)}</span>
            </div>
          );
        })}
      </div>

      <Separator className="bg-amber-800/30 mt-3" />

      {/* Secondary stats */}
      <div className="mt-3 space-y-1">
        {Object.keys(monster.savingThrows).length > 0 && (
          <p>
            <strong className="text-amber-400">Saving Throws</strong>{" "}
            <span className="text-foreground">
              {Object.entries(monster.savingThrows)
                .map(([k, v]) => `${k.toUpperCase()} ${v}`)
                .join(", ")}
            </span>
          </p>
        )}
        {Object.keys(monster.skills).length > 0 && (
          <p>
            <strong className="text-amber-400">Skills</strong>{" "}
            <span className="text-foreground">
              {Object.entries(monster.skills)
                .map(([k, v]) => `${SKILL_LABELS[k as SkillKey] ?? k} ${v ? formatModifier(Number(v)) : ""}`)
                .join(", ")}
            </span>
          </p>
        )}
        {monster.damageVulnerabilities.length > 0 && (
          <p>
            <strong className="text-amber-400">Damage Vulnerabilities</strong>{" "}
            <span className="text-foreground">{formatDamage(monster.damageVulnerabilities)}</span>
          </p>
        )}
        {monster.damageResistances.length > 0 && (
          <p>
            <strong className="text-amber-400">Damage Resistances</strong>{" "}
            <span className="text-foreground">{formatDamage(monster.damageResistances)}</span>
          </p>
        )}
        {monster.damageImmunities.length > 0 && (
          <p>
            <strong className="text-amber-400">Damage Immunities</strong>{" "}
            <span className="text-foreground">{formatDamage(monster.damageImmunities)}</span>
          </p>
        )}
        {monster.conditionImmunities.length > 0 && (
          <p>
            <strong className="text-amber-400">Condition Immunities</strong>{" "}
            <span className="text-foreground">{monster.conditionImmunities.join(", ")}</span>
          </p>
        )}
        <p>
          <strong className="text-amber-400">Senses</strong>{" "}
          <span className="text-foreground">
            {formatSenses(monster.senses)}, passive Perception {monster.passivePerception}
          </span>
        </p>
        <p>
          <strong className="text-amber-400">Languages</strong>{" "}
          <span className="text-foreground">
            {monster.languages.length > 0 ? monster.languages.join(", ") : "—"}
          </span>
        </p>
        <p>
          <strong className="text-amber-400">Challenge</strong>{" "}
          <span className="text-foreground">
            {monster.cr} (Proficiency Bonus +{monster.proficiencyBonus})
          </span>
        </p>
        {monster.group && monster.group.length > 0 && (
          <p>
            <strong className="text-amber-400">Group</strong>{" "}
            <span className="text-foreground">{monster.group.join(", ")}</span>
          </p>
        )}
        {monster.environment && monster.environment.length > 0 && (
          <p>
            <strong className="text-amber-400">Environment</strong>{" "}
            <span className="text-foreground capitalize">{monster.environment.join(", ")}</span>
          </p>
        )}
      </div>

      {/* Traits */}
      {(monster.traits.length > 0 || spellcastingParts.trait.length > 0) && (
        <StatBlockSection title="Traits">
          <EntryBlock entries={monster.traits} spellcasting={spellcastingParts.trait} />
          {spellcastingParts.trait.map((block, i) => (
            <SpellcastingBlockView key={i} block={block} />
          ))}
        </StatBlockSection>
      )}

      {/* Actions */}
      {(monster.actions.length > 0 || spellcastingParts.action.length > 0) && (
        <StatBlockSection title="Actions">
          <EntryBlock entries={monster.actions} spellcasting={spellcastingParts.action} />
          {spellcastingParts.action.map((block, i) => (
            <SpellcastingBlockView key={i} block={block} />
          ))}
        </StatBlockSection>
      )}

      {/* Reactions */}
      {monster.reactions.length > 0 && (
        <StatBlockSection title="Reactions">
          <EntryBlock entries={monster.reactions} />
        </StatBlockSection>
      )}

      {/* Legendary Actions */}
      {monster.legendaryActions && monster.legendaryActions.length > 0 && (
        <StatBlockSection title="Legendary Actions">
          <EntryBlock entries={monster.legendaryActions} />
        </StatBlockSection>
      )}

      {/* Loot */}
      {monster.loot && monster.loot.rolls > 0 && (
        <StatBlockSection title="Loot">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Carves / Capture:</strong> {monster.loot.rolls} rolls on the material table.
          </p>
        </StatBlockSection>
      )}
    </div>
  );
}
