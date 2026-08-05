import { Badge } from "@/components/ui/badge";
import {
  WEAPON_TYPE_LABELS,
  propertyLabel,
} from "@/features/weapons/components/foundry-preview/foundry-preview.labels";
import {
  asRecord,
  dash,
  formatDamageField,
} from "@/features/weapons/components/foundry-preview/foundry-preview.formatters";
import {
  FieldRow,
  SectionTitle,
} from "@/features/weapons/components/foundry-preview/FoundryPreviewFieldRow";

export function DetailsSection({ system }: { system: Record<string, unknown> }) {
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
