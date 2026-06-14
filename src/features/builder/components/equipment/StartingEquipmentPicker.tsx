import { useEffect, useMemo, useState } from "react";
import { Check, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/shared/utils/cn";
import type {
  StartingEquipmentGroup,
  StartingEquipmentItem,
  StartingEquipmentOffers,
  StartingEquipmentSource,
} from "@/shared/types";
import { hasStartingEquipmentOffers } from "@/shared/utils/starting-equipment.parser";
import { useSectionCompletenessHighlight } from "../../context/BuildCompletenessContext";
import { CompletenessHighlightBanner } from "../shared/CompletenessHighlightBanner";
import { useBuilderInventory } from "../../context/BuilderInventoryContext";
import { badgeStyleForSource } from "../../utils/proficiency-source-styles";

interface StartingEquipmentPickerProps {
  offers: StartingEquipmentOffers;
  source: StartingEquipmentSource;
}

function scopedItemId(source: StartingEquipmentSource, itemId: string): string {
  return `${source.type}:${source.id}:${itemId}`;
}

function itemToCartEntry(
  item: StartingEquipmentItem,
  source: StartingEquipmentSource,
) {
  return {
    name: item.name,
    cost: item.cost ?? "—",
    weight: item.weight ?? "—",
    source: item.source,
    shopName: `Starting equipment (${source.name})`,
    quantity: item.quantity,
    startingEquipmentId: scopedItemId(source, item.id),
  };
}

function getActiveOptionKey(
  group: StartingEquipmentGroup,
  selectedIds: Set<string>,
  source: StartingEquipmentSource,
): string | null {
  if (!group.options?.length) return null;

  for (const option of group.options) {
    const hasSelection = option.items.some((item) =>
      selectedIds.has(scopedItemId(source, item.id)),
    );
    if (hasSelection) return option.key;
  }

  return null;
}

function isItemDisabled(
  group: StartingEquipmentGroup,
  optionKey: string,
  selectedIds: Set<string>,
  source: StartingEquipmentSource,
): boolean {
  const activeOption = getActiveOptionKey(group, selectedIds, source);
  return activeOption !== null && activeOption !== optionKey;
}

export function StartingEquipmentPicker({
  offers,
  source,
}: StartingEquipmentPickerProps) {
  const { items, addToInventory, removeStartingEquipmentItem } =
    useBuilderInventory();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  const inventoryIds = useMemo(() => {
    const prefix = `${source.type}:${source.id}:`;
    return new Set(
      items
        .map((entry) => entry.startingEquipmentId)
        .filter((id): id is string => !!id && id.startsWith(prefix)),
    );
  }, [items, source.id, source.type]);

  useEffect(() => {
    setSelectedIds(inventoryIds);
  }, [inventoryIds, source.id]);

  const { highlighted, issues: startingEquipmentIssues } =
    useSectionCompletenessHighlight("starting-equipment", source.type);

  if (!hasStartingEquipmentOffers(offers)) return null;

  const badgeStyle = badgeStyleForSource(source.type);

  function toggleItem(
    group: StartingEquipmentGroup,
    optionKey: string | null,
    item: StartingEquipmentItem,
  ) {
    const scopedId = scopedItemId(source, item.id);
    const isSelected = selectedIds.has(scopedId);

    if (isSelected) {
      removeStartingEquipmentItem(scopedId);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(scopedId);
        return next;
      });
      return;
    }

    if (
      optionKey &&
      isItemDisabled(group, optionKey, selectedIds, source)
    ) {
      return;
    }

    addToInventory(itemToCartEntry(item, source));
    setSelectedIds((prev) => new Set(prev).add(scopedId));
  }

  function renderBadge(
    group: StartingEquipmentGroup,
    optionKey: string | null,
    item: StartingEquipmentItem,
  ) {
    const scopedId = scopedItemId(source, item.id);
    const isSelected = selectedIds.has(scopedId);
    const disabled =
      !isSelected &&
      optionKey !== null &&
      isItemDisabled(group, optionKey, selectedIds, source);

    const label = optionKey
      ? `(${optionKey}) ${item.name}`
      : item.name;

    return (
      <button
        key={scopedId}
        type="button"
        disabled={disabled}
        onClick={() => toggleItem(group, optionKey, item)}
        className={cn(
          "inline-flex max-w-full items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors",
          badgeStyle,
          isSelected && "ring-1 ring-primary/60",
          disabled && "cursor-not-allowed opacity-40",
          !disabled && !isSelected && "hover:opacity-90",
        )}
        aria-pressed={isSelected}
        title={
          disabled
            ? "Desmarca los objetos de la otra opción para elegir esta"
            : isSelected
              ? "Quitar del inventario"
              : "Agregar al inventario"
        }
      >
        {isSelected && <Check className="h-3 w-3 shrink-0" aria-hidden />}
        <span className="truncate">{label}</span>
      </button>
    );
  }

  return (
    <div
      className={cn(
        "rounded-md border border-border/50 bg-muted/30 p-2",
        highlighted &&
          "border-amber-500/60 bg-amber-500/10 ring-1 ring-amber-500/30",
      )}
    >
      {highlighted && (
        <CompletenessHighlightBanner issues={startingEquipmentIssues} />
      )}
      <div className="mb-2 flex items-center gap-1.5">
        <Package className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          Starting Equipment — {source.name}
        </p>
      </div>

      <p className="mb-2 text-[10px] text-muted-foreground/80">
        Haz clic en cada objeto para agregarlo al inventario. Las opciones
        marcadas con letras son excluyentes entre sí.
      </p>

      <div className="space-y-3">
        {offers.groups.map((group) => (
          <div key={group.id} className="space-y-1.5">
            {group.label && (
              <p className="text-[10px] font-medium text-foreground/80">
                {group.label}
              </p>
            )}

            {group.guaranteed && group.guaranteed.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {group.guaranteed.map((item) =>
                  renderBadge(group, null, item),
                )}
              </div>
            )}

            {group.options?.map((option) => (
              <div key={`${group.id}-${option.key}`} className="space-y-1">
                {group.options!.length > 1 && !group.label && (
                  <Badge variant="outline" className="text-[9px] font-normal">
                    Opción {option.key.toUpperCase()}
                  </Badge>
                )}
                <div className="flex flex-wrap gap-1.5">
                  {option.items.map((item) =>
                    renderBadge(group, option.key, item),
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {offers.goldAlternative && (
        <p className="mt-2 text-[10px] text-muted-foreground/70">
          Alternativa de oro: {offers.goldAlternative}
        </p>
      )}

      {offers.additionalFromBackground && (
        <p className="mt-1 text-[10px] text-muted-foreground/70">
          Más el equipo del background.
        </p>
      )}
    </div>
  );
}
