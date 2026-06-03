import type { BestiaryCreature } from "@/shared/types/bestiary-creature.types";
import type { Entry } from "@/shared/types";
import { getAbilityModifier, formatModifier } from "@/shared/utils/cr.utils";
import { Separator } from "@/components/ui/separator";

const ABILITY_LABELS: Array<[keyof BestiaryCreature["abilities"], string]> = [
  ["str", "STR"],
  ["dex", "DEX"],
  ["con", "CON"],
  ["int", "INT"],
  ["wis", "WIS"],
  ["cha", "CHA"],
];

const SKILL_LABELS: Record<string, string> = {
  acr: "Acrobatics",
  ani: "Animal Handling",
  arc: "Arcana",
  ath: "Athletics",
  dec: "Deception",
  his: "History",
  ins: "Insight",
  itm: "Intimidation",
  inv: "Investigation",
  med: "Medicine",
  nat: "Nature",
  prc: "Perception",
  prf: "Performance",
  per: "Persuasion",
  rel: "Religion",
  slt: "Sleight of Hand",
  ste: "Stealth",
  sur: "Survival",
};

function formatSpeed(speed: BestiaryCreature["speed"]): string {
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

function formatSenses(senses: BestiaryCreature["senses"]): string {
  const parts: string[] = [];
  if (senses.darkvision) parts.push(`Darkvision ${senses.darkvision} ft.`);
  if (senses.blindsight) parts.push(`Blindsight ${senses.blindsight} ft.`);
  if (senses.tremorsense) parts.push(`Tremorsense ${senses.tremorsense} ft.`);
  if (senses.truesight) parts.push(`Truesight ${senses.truesight} ft.`);
  if (senses.special) parts.push(senses.special);
  return parts.join(", ") || "—";
}

function formatDamage(items: BestiaryCreature["damageImmunities"]): string {
  return (
    items
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object" && "resist" in item) {
          const note = item.note ? ` (${item.note})` : "";
          return (item.resist ?? []).join(", ") + note;
        }
        return "";
      })
      .filter(Boolean)
      .join("; ") || "—"
  );
}

function StatBlockSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-4">
      <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider border-b border-amber-800/50 pb-1 mb-2">
        {title}
      </h3>
      {children}
    </div>
  );
}

function EntryBlock({ entries }: { entries: Entry[] }) {
  if (!entries || entries.length === 0) return null;
  return (
    <div className="space-y-3">
      {entries.map((entry, i) => (
        <div key={i}>
          <p className="text-sm">
            <strong className="text-foreground">{entry.name}.</strong>{" "}
            <span className="text-muted-foreground">{entry.entries.join(" ")}</span>
          </p>
        </div>
      ))}
    </div>
  );
}

interface BestiaryStatBlockProps {
  creature: BestiaryCreature;
}

export function BestiaryStatBlock({ creature }: BestiaryStatBlockProps) {
  return (
    <div className="font-sans text-sm">
      <p className="text-muted-foreground italic mb-3">
        {creature.size} {creature.type.type}
        {creature.type.tags && creature.type.tags.length > 0
          ? ` (${creature.type.tags.join(", ")})`
          : ""}
        {", "}
        {formatAlignment(creature.alignment)}
      </p>

      <Separator className="bg-amber-800/30" />

      <div className="mt-3 space-y-1">
        <p>
          <strong className="text-amber-400">Armor Class</strong>{" "}
          <span className="text-foreground">
            {creature.armorClass.map((ac, i) => (
              <span key={i}>
                {ac.ac}
                {ac.from ? ` (${ac.from.join(", ")})` : ""}
                {i < creature.armorClass.length - 1 ? ", " : ""}
              </span>
            ))}
          </span>
        </p>
        <p>
          <strong className="text-amber-400">Hit Points</strong>{" "}
          <span className="text-foreground">
            {creature.hp.average ?? "—"}
            {creature.hp.formula ? ` (${creature.hp.formula})` : ""}
          </span>
        </p>
        <p>
          <strong className="text-amber-400">Speed</strong>{" "}
          <span className="text-foreground">{formatSpeed(creature.speed)}</span>
        </p>
      </div>

      <Separator className="bg-amber-800/30 mt-3" />

      <div className="grid grid-cols-6 gap-2 mt-3 text-center">
        {ABILITY_LABELS.map(([key, label]) => {
          const value = creature.abilities[key];
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

      <div className="mt-3 space-y-1">
        {Object.keys(creature.savingThrows).length > 0 && (
          <p>
            <strong className="text-amber-400">Saving Throws</strong>{" "}
            <span className="text-foreground">
              {Object.entries(creature.savingThrows)
                .map(([k, v]) => `${k.toUpperCase()} ${v}`)
                .join(", ")}
            </span>
          </p>
        )}
        {Object.keys(creature.skills).length > 0 && (
          <p>
            <strong className="text-amber-400">Skills</strong>{" "}
            <span className="text-foreground">
              {Object.entries(creature.skills)
                .map(([k, v]) =>
                  `${SKILL_LABELS[k] ?? k} ${v ? formatModifier(Number(v)) : ""}`,
                )
                .join(", ")}
            </span>
          </p>
        )}
        {creature.damageVulnerabilities.length > 0 && (
          <p>
            <strong className="text-amber-400">Damage Vulnerabilities</strong>{" "}
            <span className="text-foreground">
              {formatDamage(creature.damageVulnerabilities)}
            </span>
          </p>
        )}
        {creature.damageResistances.length > 0 && (
          <p>
            <strong className="text-amber-400">Damage Resistances</strong>{" "}
            <span className="text-foreground">
              {formatDamage(creature.damageResistances)}
            </span>
          </p>
        )}
        {creature.damageImmunities.length > 0 && (
          <p>
            <strong className="text-amber-400">Damage Immunities</strong>{" "}
            <span className="text-foreground">
              {formatDamage(creature.damageImmunities)}
            </span>
          </p>
        )}
        {creature.conditionImmunities.length > 0 && (
          <p>
            <strong className="text-amber-400">Condition Immunities</strong>{" "}
            <span className="text-foreground">
              {creature.conditionImmunities.join(", ")}
            </span>
          </p>
        )}
        <p>
          <strong className="text-amber-400">Senses</strong>{" "}
          <span className="text-foreground">
            {formatSenses(creature.senses)}, passive Perception {creature.passivePerception}
          </span>
        </p>
        <p>
          <strong className="text-amber-400">Languages</strong>{" "}
          <span className="text-foreground">
            {creature.languages.length > 0 ? creature.languages.join(", ") : "—"}
          </span>
        </p>
        <p>
          <strong className="text-amber-400">Challenge</strong>{" "}
          <span className="text-foreground">
            {creature.crDisplay} (Proficiency Bonus +{creature.proficiencyBonus})
          </span>
        </p>
        {creature.group && creature.group.length > 0 && (
          <p>
            <strong className="text-amber-400">Group</strong>{" "}
            <span className="text-foreground">{creature.group.join(", ")}</span>
          </p>
        )}
        {creature.environment && creature.environment.length > 0 && (
          <p>
            <strong className="text-amber-400">Environment</strong>{" "}
            <span className="text-foreground capitalize">
              {creature.environment.join(", ")}
            </span>
          </p>
        )}
      </div>

      {creature.spellcasting && creature.spellcasting.length > 0 && (
        <StatBlockSection title="Spellcasting">
          {creature.spellcasting.map((block, i) => (
            <div key={i} className="space-y-2 mb-3">
              {block.header.map((line, j) => (
                <p key={j} className="text-sm text-muted-foreground">
                  {line}
                </p>
              ))}
              {block.footer.map((line, j) => (
                <p key={`f-${j}`} className="text-sm text-muted-foreground pl-3">
                  {line}
                </p>
              ))}
            </div>
          ))}
        </StatBlockSection>
      )}

      {creature.traits.length > 0 && (
        <StatBlockSection title="Traits">
          <EntryBlock entries={creature.traits} />
        </StatBlockSection>
      )}

      {creature.actions.length > 0 && (
        <StatBlockSection title="Actions">
          <EntryBlock entries={creature.actions} />
        </StatBlockSection>
      )}

      {creature.bonusActions && creature.bonusActions.length > 0 && (
        <StatBlockSection title="Bonus Actions">
          <EntryBlock entries={creature.bonusActions} />
        </StatBlockSection>
      )}

      {creature.reactions.length > 0 && (
        <StatBlockSection title="Reactions">
          <EntryBlock entries={creature.reactions} />
        </StatBlockSection>
      )}

      {creature.legendaryActions && creature.legendaryActions.length > 0 && (
        <StatBlockSection title="Legendary Actions">
          <EntryBlock entries={creature.legendaryActions} />
        </StatBlockSection>
      )}

      {creature.mythicActions && creature.mythicActions.length > 0 && (
        <StatBlockSection title="Mythic Actions">
          <EntryBlock entries={creature.mythicActions} />
        </StatBlockSection>
      )}
    </div>
  );
}
