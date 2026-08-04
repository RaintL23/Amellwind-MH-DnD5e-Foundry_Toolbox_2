import { useMemo, useState, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/shared/utils/cn";
import type {
  FoundryActiveEffect,
  FoundryItem,
} from "@/shared/foundry";
import { FOUNDRY_EXPORT_TARGET } from "@/shared/foundry";
import { FoundryModuleRequirementsNotice } from "@/shared/foundry";
import {
  resolveCombatChainsAtRarity,
  type ResolvedCombatChain,
} from "@/shared/foundry/weapons";
import { TEMPLATE_LABELS } from "@/shared/foundry/weapons";
import { effectModeLabel } from "@/shared/foundry/weapons";
import type { CustomWeapon } from "@/features/weapon-forge/types/weapon-forge.types";
import { foundryItemFilename } from "@/features/weapon-forge/mappers/weapon-forge-foundry.export";
import { downloadFoundryJson } from "@/shared/foundry";
import { Braces, Check, Copy, Download } from "lucide-react";

interface WeaponFoundryPreviewPanelProps {
  weapon: CustomWeapon;
  rarityIndex: number;
  /**
   * Exact Foundry Item payload Export downloads. Must be built with the same
   * function as export (`buildAmellwindWeaponFoundryItem` or `buildWeaponFoundryItem`).
   */
  item: FoundryItem | null;
  onRarityIndexChange?: (index: number) => void;
  /** When false, hide the rarity selector (parent already controls rarity). */
  showRaritySelect?: boolean;
  className?: string;
}

const WEAPON_TYPE_LABELS: Record<string, string> = {
  simpleM: "Simple Melee",
  simpleR: "Simple Ranged",
  martialM: "Martial Melee",
  martialR: "Martial Ranged",
};

const PROPERTY_LABELS: Record<string, string> = {
  amm: "Ammunition",
  fin: "Finesse",
  fir: "Firearm",
  foc: "Focus",
  hvy: "Heavy",
  lgt: "Light",
  lod: "Loading",
  mgc: "Magical",
  rch: "Reach",
  rel: "Reload",
  ret: "Returning",
  sil: "Silvered",
  spc: "Special",
  thr: "Thrown",
  two: "Two-Handed",
  ver: "Versatile",
  ada: "Adamantine",
};

const ACTIVATION_LABELS: Record<string, string> = {
  action: "Action",
  bonus: "Bonus Action",
  reaction: "Reaction",
  special: "Special",
  minute: "Minute",
  hour: "Hour",
  day: "Day",
  legendary: "Legendary Action",
  mythic: "Mythic Action",
  lair: "Lair Action",
  crew: "Crew Action",
};

const DURATION_LABELS: Record<string, string> = {
  inst: "Instantaneous",
  turn: "Turn",
  round: "Round",
  minute: "Minute",
  hour: "Hour",
  day: "Day",
  month: "Month",
  year: "Year",
  perm: "Permanent",
  spec: "Special",
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function dash(value: string | null | undefined): string {
  return value && value.trim() ? value : "—";
}

function formatDamageField(field: unknown): string {
  const p = asRecord(field);
  if (!p) return "—";
  const custom = asRecord(p.custom);
  if (custom?.enabled && typeof custom.formula === "string" && custom.formula) {
    return custom.formula;
  }
  const n = p.number;
  const d = p.denomination;
  const bonus =
    typeof p.bonus === "string" && p.bonus.trim() ? p.bonus.trim() : "";
  const types = Array.isArray(p.types)
    ? p.types.filter((t): t is string => typeof t === "string").join("/")
    : "";
  if (typeof n === "number" && typeof d === "number") {
    const formula = `${n}d${d}${bonus}`;
    return types ? `${formula} ${types}` : formula;
  }
  return types || "—";
}

function formatDamageParts(parts: unknown): string {
  if (!Array.isArray(parts) || parts.length === 0) return "—";
  return parts.map((part) => formatDamageField(part)).join(", ");
}

function propertyLabel(key: string): string {
  return PROPERTY_LABELS[key] ?? key;
}

function FieldRow({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] gap-x-2 gap-y-0.5 text-xs sm:grid-cols-[9rem_1fr]">
      <span className="text-muted-foreground">{label}</span>
      <div className="min-w-0">
        <div className="text-foreground/90 break-words">{value}</div>
        {hint ? (
          <p className="text-[10px] text-muted-foreground/80">{hint}</p>
        ) : null}
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </h4>
  );
}

function ChainStatusList({ chains }: { chains: ResolvedCombatChain[] }) {
  if (chains.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        No combat feature chains at this rarity (resources are excluded).
      </p>
    );
  }
  return (
    <ul className="space-y-1">
      {chains.map((resolved) => {
        const template = resolved.effective?.template ?? "unmapped";
        const params = resolved.effective?.params ?? {};
        const bits: string[] = [];
        if (params.damageFormula) bits.push(params.damageFormula);
        if (params.itemUsesMax) {
          bits.push(
            template === "counter_spend" || template === "charge_pool_attack"
              ? `counters ${params.itemUsesMax}`
              : `gauge ${params.itemUsesMax}`,
          );
        }
        if (
          (template === "counter_spend" ||
            template === "charge_pool_attack") &&
          (params.spendMin || params.spendMax)
        ) {
          bits.push(
            `spend ${params.spendMin ?? 1}–${params.spendMax ?? "?"}`,
          );
        }
        return (
          <li
            key={resolved.chain.chainKey}
            className="flex flex-wrap items-center gap-2 text-xs"
          >
            <span className="font-medium text-foreground">
              {resolved.displayName}
            </span>
            <Badge variant="outline" className="rounded px-1.5 py-0 text-[10px]">
              {resolved.status}
            </Badge>
            <span className="text-muted-foreground">
              {TEMPLATE_LABELS[template] ?? template}
            </span>
            {bits.length > 0 && (
              <span className="text-muted-foreground/80">
                ({bits.join(" · ")})
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function DetailsSection({ system }: { system: Record<string, unknown> }) {
  const type = asRecord(system.type);
  const typeValue = typeof type?.value === "string" ? type.value : "";
  const baseItem = typeof type?.baseItem === "string" ? type.baseItem : "";
  const properties = Array.isArray(system.properties)
    ? (system.properties as string[])
    : [];
  const range = asRecord(system.range);
  const damage = asRecord(system.damage);
  const weight = asRecord(system.weight);
  const price = asRecord(system.price);
  const uses = asRecord(system.uses);

  const reach = typeof range?.reach === "number" ? range.reach : null;
  const rangeValue = typeof range?.value === "number" ? range.value : null;
  const rangeLong = typeof range?.long === "number" ? range.long : null;
  const units =
    typeof range?.units === "string" && range.units.trim()
      ? range.units
      : "";

  const rangeText = [
    reach != null ? `Reach ${reach}${units ? ` ${units}` : ""}` : null,
    rangeValue != null
      ? `Range ${rangeValue}${rangeLong != null ? `/${rangeLong}` : ""}${units ? ` ${units}` : ""}`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const itemUsesMax =
    typeof uses?.max === "string" && uses.max.trim() ? uses.max : null;

  const magicalBonus =
    typeof system.magicalBonus === "number" ? system.magicalBonus : null;
  const attunementRaw =
    typeof system.attunement === "string" ? system.attunement : "";
  const attunement = attunementRaw.trim()
    ? attunementRaw
    : '"" (attunement not required)';
  const mastery =
    typeof system.mastery === "string" && system.mastery
      ? system.mastery
      : "—";
  const proficient =
    system.proficient === null || system.proficient === undefined
      ? "null (Automatic)"
      : String(system.proficient);

  const weightText =
    typeof weight?.value === "number"
      ? `${weight.value} ${typeof weight.units === "string" ? weight.units : "lb"}`
      : "—";
  const priceText =
    typeof price?.value === "number"
      ? `${price.value} ${typeof price.denomination === "string" ? price.denomination : "gp"}`
      : "—";

  const typeLabel = WEAPON_TYPE_LABELS[typeValue];
  const typeDisplay = typeValue
    ? typeLabel
      ? `${typeLabel} (${typeValue})`
      : typeValue
    : "—";

  return (
    <section className="space-y-2">
      <SectionTitle>Details (Foundry v12 sheet)</SectionTitle>
      <div className="rounded-md border border-border/50 px-2.5 py-2 space-y-1.5">
        <FieldRow label="Weapon Type" value={typeDisplay} />
        <FieldRow label="Base Weapon" value={dash(baseItem)} />
        <FieldRow label="Proficiency" value={proficient} />
        <FieldRow label="Mastery" value={mastery} />
        <FieldRow
          label="Properties"
          value={
            properties.length > 0 ? (
              <span className="flex flex-wrap gap-1">
                {properties.map((key) => (
                  <Badge
                    key={key}
                    variant="outline"
                    className="rounded px-1.5 py-0 text-[10px]"
                    title={key}
                  >
                    {propertyLabel(key)}
                    <span className="ml-1 text-muted-foreground/70">{key}</span>
                  </Badge>
                ))}
              </span>
            ) : (
              "—"
            )
          }
        />
        <FieldRow label="Attunement" value={attunement} />
        <FieldRow
          label="Magical Bonus"
          value={
            magicalBonus != null && magicalBonus > 0
              ? `+${magicalBonus}`
              : magicalBonus === 0
                ? "0"
                : "null"
          }
          hint="system.magicalBonus — Foundry DETAILS Bonus field."
        />
        <FieldRow label="Range / Reach" value={dash(rangeText)} />
        <FieldRow
          label="Damage"
          value={formatDamageField(damage?.base)}
          hint="system.damage.base (export field)."
        />
        {formatDamageField(damage?.versatile) !== "—" && (
          <FieldRow
            label="Versatile"
            value={formatDamageField(damage?.versatile)}
            hint="system.damage.versatile"
          />
        )}
        <FieldRow label="Weight" value={weightText} />
        <FieldRow label="Price" value={priceText} />
        {itemUsesMax && (
          <FieldRow label="Item Uses" value={itemUsesMax} />
        )}
      </div>
    </section>
  );
}

function ActivityCard({
  activity,
  baseDamageLabel,
}: {
  activity: Record<string, unknown>;
  baseDamageLabel: string;
}) {
  const name =
    typeof activity.name === "string" && activity.name.trim()
      ? activity.name
      : "(default attack)";
  const type = typeof activity.type === "string" ? activity.type : "?";

  const activation = asRecord(activity.activation);
  const activationType =
    typeof activation?.type === "string" ? activation.type : "";
  const activationLabel =
    ACTIVATION_LABELS[activationType] ?? dash(activationType);

  const duration = asRecord(activity.duration);
  const durationUnits =
    typeof duration?.units === "string" ? duration.units : "";
  const durationLabel =
    DURATION_LABELS[durationUnits] ?? dash(durationUnits);
  const concentration = duration?.concentration === true;

  const consumption = asRecord(activity.consumption);
  const consumeTargets = Array.isArray(consumption?.targets)
    ? consumption.targets
    : [];
  const scalingAllowed = asRecord(consumption?.scaling)?.allowed === true;

  const range = asRecord(activity.range);
  const rangeOverride = range?.override === true;
  const rangeUnits = typeof range?.units === "string" ? range.units : "";
  const rangeValue =
    typeof range?.value === "number" || typeof range?.value === "string"
      ? String(range.value)
      : "";

  const uses = asRecord(activity.uses);
  const usesMax =
    typeof uses?.max === "string" && uses.max.trim() ? uses.max : "—";

  const attack = asRecord(activity.attack);
  const attackType = asRecord(attack?.type);
  const attackAbility =
    typeof attack?.ability === "string" && attack.ability
      ? attack.ability
      : '"" (default: strength or dexterity)';
  const attackBonus =
    typeof attack?.bonus === "string" && attack.bonus.trim()
      ? attack.bonus
      : '""';
  const flatToHit = attack?.flat === true;
  const critThresholdRaw =
    typeof attack?.critical === "object" &&
    attack.critical !== null &&
    (attack.critical as Record<string, unknown>).threshold;
  const critThreshold =
    typeof critThresholdRaw === "number"
      ? String(critThresholdRaw)
      : "null";

  const damage = asRecord(activity.damage);
  const includeBase = damage?.includeBase === true;
  const extraParts = formatDamageParts(damage?.parts);
  const critBonus = asRecord(damage?.critical);
  const critBonusText =
    typeof critBonus?.bonus === "string" && critBonus.bonus.trim()
      ? critBonus.bonus
      : '""';

  // Same item payload: includeBase pulls system.damage.base (shown for clarity).
  const resolvedDamage = includeBase
    ? baseDamageLabel !== "—"
      ? `${baseDamageLabel} ← system.damage.base (includeBase)`
      : "includeBase true · system.damage.base empty"
    : extraParts;

  const midi = asRecord(activity.midiProperties);
  const midiIdentifier =
    typeof midi?.identifier === "string" && midi.identifier
      ? midi.identifier
      : "—";
  const midiBits: string[] = [];
  if (midi?.magicDamage === true) midiBits.push("Magic Damage");
  if (midi?.magicEffect === true) midiBits.push("Magic Effect");
  if (midi?.ignoreFullCover === true) midiBits.push("Ignore Full Cover");
  if (midi?.automationOnly === true) midiBits.push("Automation Only");
  if (midi?.toggleEffect === true) midiBits.push("Toggle Effect");
  if (midi?.displayActivityName === true) midiBits.push("Display Activity Name");
  if (midi?.triggeredActivityId && midi.triggeredActivityId !== "none") {
    midiBits.push(`Trigger → ${String(midi.triggeredActivityId)}`);
  }

  const activityRangeLabel = rangeOverride
    ? dash([rangeValue, rangeUnits].filter(Boolean).join(" "))
    : `${dash(rangeUnits)} (inherits item range/reach)`;

  return (
    <AccordionItem
      value={String(activity._id)}
      className="rounded-md border border-border/50 border-b-0 px-2.5"
    >
      <AccordionTrigger className="py-2 text-xs hover:no-underline">
        <span className="flex flex-wrap items-center gap-2 text-left">
          <span className="font-medium text-foreground">{name}</span>
          <Badge variant="outline" className="rounded px-1.5 py-0 text-[10px]">
            {type}
          </Badge>
          <Badge variant="outline" className="rounded px-1.5 py-0 text-[10px]">
            {activationLabel}
          </Badge>
          <span className="text-muted-foreground font-normal">
            Damage: {includeBase ? baseDamageLabel : extraParts}
          </span>
        </span>
      </AccordionTrigger>
      <AccordionContent className="pb-3 space-y-3">
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Identity
          </p>
          <FieldRow
            label="Attack Type"
            value={
              typeof attackType?.value === "string"
                ? attackType.value
                : "—"
            }
          />
          <FieldRow
            label="Classification"
            value={
              typeof attackType?.classification === "string"
                ? attackType.classification
                : "—"
            }
          />
        </div>

        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Activation
          </p>
          <FieldRow label="Cost" value={activationLabel} />
          <FieldRow
            label="Duration"
            value={
              concentration ? `${durationLabel} · concentration` : durationLabel
            }
          />
          <FieldRow
            label="Consumption"
            value={
              consumeTargets.length > 0
                ? `${consumeTargets.length} target(s)`
                : "None"
            }
          />
          <FieldRow
            label="Allow Scaling"
            value={scalingAllowed ? "Yes" : "No"}
          />
          <FieldRow label="Limited Uses" value={usesMax} />
        </div>

        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Targeting
          </p>
          <FieldRow label="Range" value={activityRangeLabel} />
        </div>

        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Effect
          </p>
          <FieldRow label="Attack Ability" value={attackAbility} />
          <FieldRow label="To Hit Bonus" value={attackBonus} />
          <FieldRow label="Flat To Hit" value={flatToHit ? "Yes" : "No"} />
          <FieldRow label="Critical Threshold" value={critThreshold} />
          <FieldRow
            label="Include Base"
            value={includeBase ? "true" : "false"}
            hint="damage.includeBase in the exported Activity JSON."
          />
          <FieldRow label="Damage" value={resolvedDamage} />
          <FieldRow
            label="Extra Parts"
            value={extraParts}
            hint="activity.damage.parts in the exported JSON."
          />
          <FieldRow label="Extra Crit Damage" value={critBonusText} />
        </div>

        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Midi-QOL
          </p>
          <FieldRow label="Identifier" value={midiIdentifier} />
          <FieldRow
            label="Flags"
            value={midiBits.length > 0 ? midiBits.join(", ") : "—"}
          />
          <FieldRow
            label="Confirm Targets"
            value={
              typeof midi?.confirmTargets === "string"
                ? midi.confirmTargets
                : "—"
            }
          />
          <FieldRow
            label="otherActivityCompatible"
            value={
              typeof midi?.otherActivityCompatible === "boolean"
                ? String(midi.otherActivityCompatible)
                : "—"
            }
          />
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

function EffectCard({ effect }: { effect: FoundryActiveEffect }) {
  const duration = asRecord(effect.duration) ?? {};
  const flags = asRecord(effect.flags) ?? {};
  const dae = asRecord(flags.dae) ?? {};
  const core = asRecord(flags.core) ?? {};
  const activeAuras = asRecord(flags.ActiveAuras) ?? {};

  const specialDuration = Array.isArray(dae.specialDuration)
    ? dae.specialDuration.filter((v): v is string => typeof v === "string")
    : [];
  const daeStatuses = Array.isArray(dae.statuses)
    ? dae.statuses.filter((v): v is string => typeof v === "string")
    : [];

  const seconds =
    typeof duration.seconds === "number" ? String(duration.seconds) : "—";
  const rounds =
    typeof duration.rounds === "number" ? String(duration.rounds) : "—";
  const turns =
    typeof duration.turns === "number" ? String(duration.turns) : "—";
  const startTime =
    typeof duration.startTime === "number" ? String(duration.startTime) : "—";
  const combat =
    typeof duration.combat === "string" && duration.combat
      ? duration.combat
      : "—";
  const startRound =
    typeof duration.startRound === "number"
      ? String(duration.startRound)
      : "—";
  const startTurn =
    typeof duration.startTurn === "number" ? String(duration.startTurn) : "—";

  const isAura = activeAuras.isAura === true;

  return (
    <AccordionItem
      value={effect._id}
      className="rounded-md border border-border/50 border-b-0 px-2.5"
    >
      <AccordionTrigger className="py-2 text-xs hover:no-underline">
        <span className="flex flex-wrap items-center gap-2 text-left">
          <span className="font-medium text-foreground">{effect.name}</span>
          <Badge variant="outline" className="rounded px-1.5 py-0 text-[10px]">
            {effect.transfer ? "transfer" : "on use"}
          </Badge>
          {effect.disabled && (
            <Badge variant="outline" className="rounded px-1.5 py-0 text-[10px]">
              suspended
            </Badge>
          )}
          {isAura && (
            <Badge variant="outline" className="rounded px-1.5 py-0 text-[10px]">
              aura
            </Badge>
          )}
          <span className="text-muted-foreground font-normal">
            {effect.changes.length} change
            {effect.changes.length === 1 ? "" : "s"}
          </span>
        </span>
      </AccordionTrigger>
      <AccordionContent className="pb-3 space-y-3">
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Details
          </p>
          <FieldRow label="Name" value={effect.name} />
          <FieldRow label="Icon" value={dash(effect.img)} />
          <FieldRow label="Tint" value={dash(effect.tint)} />
          <FieldRow
            label="Description"
            value={
              effect.description.trim()
                ? effect.description
                : "—"
            }
          />
          <FieldRow
            label="Suspended"
            value={effect.disabled ? "Yes" : "No"}
            hint="disabled"
          />
          <FieldRow
            label="Apply to Actor"
            value={effect.transfer ? "Yes" : "No"}
            hint="transfer — equipped item vs activity on-use"
          />
          <FieldRow
            label="Statuses"
            value={
              effect.statuses.length > 0 ? effect.statuses.join(", ") : "—"
            }
          />
          <FieldRow
            label="Disable condition (DAE)"
            value={
              typeof dae.disableCondition === "string" && dae.disableCondition
                ? dae.disableCondition
                : "—"
            }
          />
          <FieldRow
            label="Disable if incapacitated"
            value={dae.disableIncapacitated === true ? "Yes" : "No"}
          />
          <FieldRow
            label="Stackable (DAE)"
            value={
              typeof dae.stackable === "string" && dae.stackable
                ? dae.stackable
                : "—"
            }
          />
          <FieldRow
            label="Separate statuses (DAE)"
            value={daeStatuses.length > 0 ? daeStatuses.join(", ") : "—"}
          />
          <FieldRow
            label="Always show icon"
            value={dae.showIcon === true ? "Yes" : "No"}
          />
          <FieldRow
            label="Icon overlay"
            value={core.overlay === true ? "Yes" : "No"}
            hint="flags.core.overlay"
          />
          <FieldRow
            label="selfTargetAlways"
            value={dae.selfTargetAlways === true ? "Yes" : "No"}
          />
        </div>

        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Duration
          </p>
          <FieldRow label="Seconds" value={seconds} />
          <FieldRow
            label="Seconds formula (DAE)"
            value={
              typeof dae.durationExpression === "string" &&
              dae.durationExpression
                ? dae.durationExpression
                : "—"
            }
          />
          <FieldRow label="Start time" value={startTime} />
          <FieldRow label="Rounds" value={rounds} />
          <FieldRow label="Turns" value={turns} />
          <FieldRow label="Combat" value={combat} />
          <FieldRow label="Start round" value={startRound} />
          <FieldRow label="Start turn" value={startTurn} />
          <FieldRow
            label="Macro repeat"
            value={
              typeof dae.macroRepeat === "string" && dae.macroRepeat
                ? dae.macroRepeat
                : "—"
            }
          />
          <FieldRow
            label="Special duration"
            value={
              specialDuration.length > 0 ? specialDuration.join(", ") : "—"
            }
            hint="flags.dae.specialDuration (DAE + Times Up)"
          />
        </div>

        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Changes
          </p>
          {effect.changes.length === 0 ? (
            <p className="text-xs text-muted-foreground">No changes.</p>
          ) : (
            <ul className="space-y-1.5">
              {effect.changes.map((change, index) => (
                <li
                  key={`${change.key}-${index}`}
                  className="rounded border border-border/40 px-2 py-1.5 space-y-1"
                >
                  <FieldRow label="Key" value={change.key} />
                  <FieldRow
                    label="Mode"
                    value={effectModeLabel(change.mode)}
                  />
                  <FieldRow label="Value" value={change.value || '""'} />
                  <FieldRow label="Priority" value={String(change.priority)} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Auras (Active Auras)
          </p>
          <FieldRow
            label="Effect is Aura?"
            value={isAura ? "Yes" : "No"}
            hint="flags.ActiveAuras.isAura"
          />
          {isAura && (
            <>
              <FieldRow
                label="Radius"
                value={
                  typeof activeAuras.radius === "string" ||
                  typeof activeAuras.radius === "number"
                    ? String(activeAuras.radius)
                    : "—"
                }
              />
              <FieldRow
                label="Targets"
                value={
                  typeof activeAuras.aura === "string"
                    ? activeAuras.aura
                    : "—"
                }
              />
              <FieldRow
                label="Ignore self"
                value={activeAuras.ignoreSelf === true ? "Yes" : "No"}
              />
              <FieldRow
                label="Hostile"
                value={activeAuras.hostile === true ? "Yes" : "No"}
              />
              <FieldRow
                label="Only once"
                value={activeAuras.onlyOnce === true ? "Yes" : "No"}
              />
            </>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

function FoundryRawJsonDialog({
  open,
  onOpenChange,
  item,
  filename,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: FoundryItem;
  filename: string;
}) {
  const [copied, setCopied] = useState(false);
  const json = useMemo(() => JSON.stringify(item, null, 2), [item]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard may be blocked in some embedded contexts.
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="z-[60] flex max-h-[90vh] w-[min(96vw,56rem)] max-w-4xl flex-col gap-0 overflow-hidden"
        overlayClassName="z-[60]"
      >
        <DialogHeader className="shrink-0">
          <DialogTitle>Raw Foundry JSON</DialogTitle>
          <DialogDescription className="font-mono text-xs break-all">
            {filename}
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="min-h-0 flex-1 overflow-hidden px-6 pb-4">
          <pre className="h-[min(60vh,32rem)] overflow-auto rounded-md border border-border/50 bg-muted/40 p-3 text-[11px] leading-relaxed text-muted-foreground whitespace-pre">
            {json}
          </pre>
        </DialogBody>
        <div className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-border/60 px-6 py-4">
          <Button type="button" variant="outline" onClick={handleCopy}>
            {copied ? (
              <Check className="mr-1.5 h-4 w-4" />
            ) : (
              <Copy className="mr-1.5 h-4 w-4" />
            )}
            {copied ? "Copied" : "Copy"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => downloadFoundryJson(item, filename)}
          >
            <Download className="mr-1.5 h-4 w-4" />
            Download
          </Button>
          <Button type="button" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PreviewBody({
  item,
  chains,
  filename,
}: {
  item: FoundryItem;
  chains: ResolvedCombatChain[];
  filename: string;
}) {
  const [jsonOpen, setJsonOpen] = useState(false);
  const system = item.system as Record<string, unknown>;
  const activities = asRecord(system.activities) ?? {};
  const activityList = Object.values(activities)
    .map(asRecord)
    .filter((a): a is Record<string, unknown> => !!a)
    .sort(
      (a, b) =>
        (typeof a.sort === "number" ? a.sort : 0) -
        (typeof b.sort === "number" ? b.sort : 0),
    );

  const damage = asRecord(system.damage);
  const baseDamageLabel = formatDamageField(damage?.base);

  return (
    <div className="space-y-4 pb-2">
      <div className="rounded-md border border-border/60 bg-muted/20 px-3 py-2 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-foreground">
            {item.name}
          </span>
          <Badge variant="outline" className="text-[10px]">
            {item.type}
          </Badge>
          {typeof system.rarity === "string" && system.rarity && (
            <Badge variant="outline" className="text-[10px]">
              {system.rarity}
            </Badge>
          )}
          {typeof system.magicalBonus === "number" &&
            system.magicalBonus > 0 && (
              <Badge variant="outline" className="text-[10px]">
                +{system.magicalBonus}
              </Badge>
            )}
        </div>
        <p className="text-[11px] text-muted-foreground">
          Foundry VTT v{FOUNDRY_EXPORT_TARGET.coreVersion} / dnd5e{" "}
          {FOUNDRY_EXPORT_TARGET.systemVersion}. Fields below are read from the
          same Foundry Item object Export downloads (see Raw Foundry JSON).
        </p>
      </div>

      <DetailsSection system={system} />

      <section className="space-y-2">
        <SectionTitle>Activities ({activityList.length})</SectionTitle>
        {activityList.length === 0 ? (
          <p className="text-xs text-muted-foreground">No activities emitted.</p>
        ) : (
          <Accordion type="multiple" defaultValue={[]} className="space-y-2">
            {activityList.map((activity) => (
              <ActivityCard
                key={String(activity._id)}
                activity={activity}
                baseDamageLabel={baseDamageLabel}
              />
            ))}
          </Accordion>
        )}
      </section>

      <section className="space-y-2">
        <SectionTitle>Active Effects ({item.effects.length})</SectionTitle>
        {item.effects.length === 0 ? (
          <p className="text-xs text-muted-foreground">No active effects.</p>
        ) : (
          <Accordion type="multiple" defaultValue={[]} className="space-y-2">
            {item.effects.map((effect) => (
              <EffectCard key={effect._id} effect={effect} />
            ))}
          </Accordion>
        )}
      </section>

      <section className="space-y-2">
        <SectionTitle>Feature automation map</SectionTitle>
        <ChainStatusList chains={chains} />
      </section>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 px-2.5 text-xs"
        onClick={() => setJsonOpen(true)}
      >
        <Braces className="mr-1.5 h-3.5 w-3.5" />
        Raw Foundry JSON
      </Button>

      <FoundryRawJsonDialog
        open={jsonOpen}
        onOpenChange={setJsonOpen}
        item={item}
        filename={filename}
      />
    </div>
  );
}

/**
 * Read-only Foundry v12 / dnd5e 4.4.4 preview of an already-built weapon Item.
 * The parent must pass the exact object Export will download.
 */
export function WeaponFoundryPreviewPanel({
  weapon,
  rarityIndex,
  item,
  onRarityIndexChange,
  showRaritySelect = true,
  className,
}: WeaponFoundryPreviewPanelProps) {
  const clamped = Math.max(
    0,
    Math.min(rarityIndex, Math.max(0, weapon.rarityRows.length - 1)),
  );

  const chains = useMemo(() => {
    try {
      return resolveCombatChainsAtRarity(weapon, clamped);
    } catch {
      return [] as ResolvedCombatChain[];
    }
  }, [weapon, clamped]);

  return (
    <div className={cn("space-y-3", className)}>
      <FoundryModuleRequirementsNotice kind="weapon" collapsible />

      {showRaritySelect && weapon.rarityRows.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <Label htmlFor="foundry-preview-rarity" className="text-xs">
            Preview rarity
          </Label>
          <Select
            id="foundry-preview-rarity"
            value={String(clamped)}
            onChange={(e) =>
              onRarityIndexChange?.(Number.parseInt(e.target.value, 10))
            }
            disabled={!onRarityIndexChange}
            className="h-8 w-auto min-w-[9rem] text-xs"
          >
            {weapon.rarityRows.map((row, index) => (
              <option key={`${row.rarity}-${index}`} value={String(index)}>
                {row.rarity}
              </option>
            ))}
          </Select>
        </div>
      )}

      {!item ? (
        <p className="text-sm text-destructive">
          Could not build Foundry preview for this weapon.
        </p>
      ) : (
        <PreviewBody
          item={item}
          chains={chains}
          filename={foundryItemFilename(weapon, clamped)}
        />
      )}
    </div>
  );
}
