import {
  asRecord,
  dash,
} from "@/features/weapons/components/foundry-preview/foundry-preview.formatters";
import {
  FieldRow,
  SectionTitle,
} from "@/features/weapons/components/foundry-preview/FoundryPreviewFieldRow";

/** DETAILS fields for Foundry `feat` items (weapon resources: Melodies, …). */
export function FeatDetailsSection({
  system,
}: {
  system: Record<string, unknown>;
}) {
  const type = asRecord(system.type);
  const typeValue = typeof type?.value === "string" ? type.value : "";
  const subtype = typeof type?.subtype === "string" ? type.subtype : "";
  const typeDisplay = typeValue
    ? subtype
      ? `${typeValue} (${subtype})`
      : typeValue
    : "—";

  const identifier =
    typeof system.identifier === "string" ? system.identifier : "";
  const requirements =
    typeof system.requirements === "string" ? system.requirements : "";
  const properties = Array.isArray(system.properties)
    ? (system.properties as string[])
    : [];
  const uses = asRecord(system.uses);
  const itemUsesMax =
    typeof uses?.max === "string" && uses.max.trim() ? uses.max : null;

  return (
    <section className="space-y-2">
      <SectionTitle>Details (Foundry v12 sheet)</SectionTitle>
      <div className="rounded-md border border-border/50 px-2.5 py-2 space-y-1.5">
        <FieldRow label="Item Type" value="feat" />
        <FieldRow label="Feature Type" value={dash(typeDisplay)} />
        <FieldRow label="Identifier" value={dash(identifier)} />
        <FieldRow label="Requirements" value={dash(requirements)} />
        <FieldRow
          label="Properties"
          value={properties.length > 0 ? properties.join(", ") : "—"}
        />
        {itemUsesMax && <FieldRow label="Item Uses" value={itemUsesMax} />}
      </div>
    </section>
  );
}
