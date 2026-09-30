import { useMemo, useState, type ReactNode } from "react";
import type { BestiaryCreature, SpellcastingBlock } from "@/shared/types/bestiary-creature.types";
import type { Entry, SkillKey } from "@/shared/types";
import { SpellcastingBlockView } from "@/components/statblock/SpellcastingBlockView";
import { StatBlockContentView } from "@/components/statblock/StatBlockContentView";
import { getEntryContent } from "@/shared/utils/entry-text.utils";
import { getAbilityModifier, formatModifier } from "@/shared/utils/cr.utils";
import { Separator } from "@/components/ui/separator";
import { StatBlockSection } from "@/shared/components/StatBlockSection";
import {
  ABILITY_KEYS,
  ABILITY_ABBREVIATIONS,
  SKILL_LABELS,
} from "@/shared/constants/dnd";
import { CompanionScalingPanel } from "./CompanionScalingPanel";
import {
  applyCompanionScaling,
  detectCompanionScaling,
  DEFAULT_COMPANION_ABILITY_SCORE,
  type CompanionScaleInputs,
} from "../utils/companion-scaling.utils";

const ABILITY_LABELS = ABILITY_KEYS.map(
  (key) => [key, ABILITY_ABBREVIATIONS[key]] as const,
);

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
        if (item && typeof item === "object") {
          if ("special" in item && typeof item.special === "string") {
            return item.special;
          }
          if ("resist" in item) {
            const note = item.note ? ` (${item.note})` : "";
            return (item.resist ?? []).join(", ") + note;
          }
        }
        return "";
      })
      .filter(Boolean)
      .join("; ") || "—"
  );
}

function formatArmorClass(creature: BestiaryCreature): string {
  if (creature.armorClass.length === 0) return "—";
  return creature.armorClass
    .map((ac) => {
      if (ac.special) return ac.special;
      const from = ac.from?.length ? ` (${ac.from.join(", ")})` : "";
      return `${ac.ac}${from}`;
    })
    .join(", ");
}

function formatHitPoints(creature: BestiaryCreature): string {
  if (creature.hp.special) return creature.hp.special;
  if (creature.hp.average != null) {
    return creature.hp.formula
      ? `${creature.hp.average} (${creature.hp.formula})`
      : String(creature.hp.average);
  }
  if (creature.hp.formula) return creature.hp.formula;
  return "—";
}

function StatLine({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <p className="text-sm">
      <strong className="text-amber-400">{label}</strong>{" "}
      <span className="break-words text-foreground">{children}</span>
    </p>
  );
}

function StatTile({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-md border border-amber-800/30 bg-amber-950/10 px-2 py-2 text-center">
      <p className="text-[10px] font-bold uppercase tracking-wide text-amber-400">
        {label}
      </p>
      <p className="mt-0.5 break-words text-sm font-medium text-foreground">
        {children}
      </p>
    </div>
  );
}

function EntryBlock({
  entries,
  spellcasting = [],
}: {
  entries: Entry[];
  spellcasting?: SpellcastingBlock[];
}) {
  if (!entries || entries.length === 0) return null;
  return (
    <div className="space-y-3">
      {entries.map((entry, i) => {
        const embeddedSpell = spellcasting.find(
          (s) => s.name === entry.name || s.displayAs === entry.name.toLowerCase(),
        );
        return (
          <div key={i} className="break-words">
            <div className="text-sm">
              <strong className="text-foreground">{entry.name}.</strong>{" "}
              {embeddedSpell ? (
                <div className="mt-1">
                  <SpellcastingBlockView block={embeddedSpell} />
                </div>
              ) : (
                <span className="inline">
                  <StatBlockContentView content={getEntryContent(entry)} />
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function partitionSpellcasting(spellcasting: SpellcastingBlock[] = []) {
  return {
    trait: spellcasting.filter((s) => s.displayAs === "trait"),
    action: spellcasting.filter((s) => s.displayAs === "action"),
    standalone: spellcasting.filter(
      (s) => s.displayAs !== "trait" && s.displayAs !== "action",
    ),
  };
}

interface BestiaryStatBlockProps {
  creature: BestiaryCreature;
}

export function BestiaryStatBlock({ creature: rawCreature }: BestiaryStatBlockProps) {
  const detection = useMemo(
    () => detectCompanionScaling(rawCreature),
    [rawCreature],
  );
  const [scaleInputs, setScaleInputs] = useState<CompanionScaleInputs>({
    ownerLevel: 3,
    abilityScore: DEFAULT_COMPANION_ABILITY_SCORE,
  });

  const creature = useMemo(
    () =>
      detection.isScaled
        ? applyCompanionScaling(rawCreature, scaleInputs)
        : rawCreature,
    [detection.isScaled, rawCreature, scaleInputs],
  );

  const spellcastingParts = partitionSpellcasting(creature.spellcasting);

  return (
    <div className="space-y-3 font-sans text-sm">
      {detection.isScaled && (
        <CompanionScalingPanel
          detection={detection}
          value={scaleInputs}
          onChange={setScaleInputs}
        />
      )}

      <p className="mb-3 break-words italic text-muted-foreground">
        {creature.size} {creature.type.type}
        {creature.type.tags && creature.type.tags.length > 0
          ? ` (${creature.type.tags.join(", ")})`
          : ""}
        {", "}
        {formatAlignment(creature.alignment)}
      </p>

      <Separator className="bg-amber-800/30" />

      <div className="mt-3 grid grid-cols-3 gap-2">
        <StatTile label="AC">{formatArmorClass(creature)}</StatTile>
        <StatTile label="HP">{formatHitPoints(creature)}</StatTile>
        <StatTile label="Speed">
          <span className="whitespace-normal leading-snug">
            {formatSpeed(creature.speed)}
          </span>
        </StatTile>
      </div>

      <Separator className="mt-3 bg-amber-800/30" />

      <div className="mt-3 grid grid-cols-3 gap-2 text-center min-[420px]:grid-cols-6">
        {ABILITY_LABELS.map(([key, label]) => {
          const value = creature.abilities[key];
          const mod = getAbilityModifier(value);
          return (
            <div
              key={key}
              className="flex flex-col items-center rounded-md border border-border/60 bg-muted/20 px-1 py-1.5"
            >
              <span className="text-xs font-bold text-amber-400">{label}</span>
              <span className="text-base font-semibold text-foreground">{value}</span>
              <span className="text-xs text-muted-foreground">{formatModifier(mod)}</span>
            </div>
          );
        })}
      </div>

      <Separator className="mt-3 bg-amber-800/30" />

      <div className="mt-3 space-y-1.5">
        {Object.keys(creature.savingThrows).length > 0 && (
          <StatLine label="Saving Throws">
            {Object.entries(creature.savingThrows)
              .map(([k, v]) => `${k.toUpperCase()} ${v}`)
              .join(", ")}
          </StatLine>
        )}
        {Object.keys(creature.skills).length > 0 && (
          <StatLine label="Skills">
            {Object.entries(creature.skills)
              .map(([k, v]) =>
                `${SKILL_LABELS[k as SkillKey] ?? k} ${v ? formatModifier(Number(v)) : ""}`,
              )
              .join(", ")}
          </StatLine>
        )}
        {creature.damageVulnerabilities.length > 0 && (
          <StatLine label="Damage Vulnerabilities">
            {formatDamage(creature.damageVulnerabilities)}
          </StatLine>
        )}
        {creature.damageResistances.length > 0 && (
          <StatLine label="Damage Resistances">
            {formatDamage(creature.damageResistances)}
          </StatLine>
        )}
        {creature.damageImmunities.length > 0 && (
          <StatLine label="Damage Immunities">
            {formatDamage(creature.damageImmunities)}
          </StatLine>
        )}
        {creature.conditionImmunities.length > 0 && (
          <StatLine label="Condition Immunities">
            {creature.conditionImmunities.join(", ")}
          </StatLine>
        )}
        <StatLine label="Senses">
          {formatSenses(creature.senses)}, passive Perception{" "}
          {creature.passivePerception}
        </StatLine>
        <StatLine label="Languages">
          {creature.languages.length > 0 ? creature.languages.join(", ") : "—"}
        </StatLine>
        <StatLine label="Challenge">
          {creature.crDisplay} (Proficiency Bonus +{creature.proficiencyBonus}
          {creature.pbNote ? `; ${creature.pbNote}` : ""})
        </StatLine>
        {creature.group && creature.group.length > 0 && (
          <StatLine label="Group">{creature.group.join(", ")}</StatLine>
        )}
        {creature.environment && creature.environment.length > 0 && (
          <StatLine label="Environment">
            <span className="capitalize">{creature.environment.join(", ")}</span>
          </StatLine>
        )}
      </div>

      {spellcastingParts.standalone.length > 0 && (
        <StatBlockSection title="Spellcasting">
          {spellcastingParts.standalone.map((block, i) => (
            <SpellcastingBlockView key={i} block={block} />
          ))}
        </StatBlockSection>
      )}

      {creature.traits.length > 0 || spellcastingParts.trait.length > 0 ? (
        <StatBlockSection title="Traits">
          <EntryBlock
            entries={creature.traits}
            spellcasting={spellcastingParts.trait}
          />
        </StatBlockSection>
      ) : null}

      {creature.actions.length > 0 || spellcastingParts.action.length > 0 ? (
        <StatBlockSection title="Actions">
          <EntryBlock
            entries={creature.actions}
            spellcasting={spellcastingParts.action}
          />
          {spellcastingParts.action
            .filter(
              (block) =>
                !creature.actions.some(
                  (a) => a.name === block.name || a.name === block.displayAs,
                ),
            )
            .map((block, i) => (
              <div key={i} className="mt-3 break-words">
                <p className="text-sm font-semibold text-foreground">{block.name}.</p>
                <SpellcastingBlockView block={block} />
              </div>
            ))}
        </StatBlockSection>
      ) : null}

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
