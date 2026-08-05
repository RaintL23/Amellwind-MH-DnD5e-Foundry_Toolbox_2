import { Badge } from "@/components/ui/badge";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ACTIVATION_LABELS,
  DURATION_LABELS,
} from "@/features/weapons/components/foundry-preview/foundry-preview.labels";
import {
  asRecord,
  dash,
  formatDamageParts,
} from "@/features/weapons/components/foundry-preview/foundry-preview.formatters";
import { FieldRow } from "@/features/weapons/components/foundry-preview/FoundryPreviewFieldRow";

export function ActivityCard({
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
