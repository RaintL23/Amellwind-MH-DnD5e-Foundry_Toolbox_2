/**
 * Single renderer for D&D item content (stats, group members, description,
 * base items). Used by the compendium dialog and the Builder library so both
 * show the same data; hosts own the header, source switcher and navigation.
 */
import { useEffect, useMemo, useState } from "react";
import { Separator } from "@/components/ui/separator";
import { StatBlockContentView } from "@/components/statblock/StatBlockContentView";
import { HintTooltip } from "@/shared/components/HintTooltip";
import type { DndItem } from "@/shared/types";
import { cn } from "@/shared/utils/cn";
import { MAGIC_ITEM_PRICING_ATTRIBUTION } from "@/features/dnd/shop-generator/data/magic-item-pricing-attribution";
import {
  formatPriceBreakdownTooltip,
  formatShopPriceGp,
  resolveItemPriceGp,
} from "@/features/dnd/shop-generator/utils/price-resolve.utils";
import {
  getDndItemById,
  getSpecificVariantsForGeneric,
} from "../services/dnd-item.service";
import {
  getFieldsThatVaryAcrossVariants,
  type DndItemVariantField,
} from "../utils/item-variant.utils";

export type DndItemContentDensity = "compact" | "comfortable";

interface DndItemContentProps {
  item: DndItem;
  /** All source variants, used to flag fields that vary by source. */
  variants?: DndItem[];
  /** Opens a related item (group member / specific variant); links hidden when omitted. */
  onOpenItem?: (item: DndItem) => void;
  density?: DndItemContentDensity;
}

function MetaRow({
  label,
  value,
  differs,
  tooltip,
  compact,
}: {
  label: string;
  value: string;
  differs?: boolean;
  tooltip?: string;
  compact: boolean;
}) {
  if (!value || value === "—") return null;
  const valueEl = (
    <span
      className={cn(
        compact ? "text-xs" : "text-sm",
        differs ? "text-amber-300 font-medium" : "text-foreground",
        tooltip &&
          "cursor-help underline decoration-dotted decoration-muted-foreground/60 underline-offset-2",
      )}
    >
      {value}
      {differs && (
        <span className="ml-1.5 text-[10px] font-normal text-amber-500/80">
          (varies)
        </span>
      )}
    </span>
  );
  return (
    <div className="flex gap-2">
      <span
        className={cn(
          "shrink-0 font-semibold uppercase tracking-wide text-muted-foreground",
          compact ? "w-20 text-[10px]" : "w-28 text-xs",
        )}
      >
        {label}
      </span>
      {tooltip ? (
        <HintTooltip content={tooltip} side="top" align="start" className="max-w-sm">
          {valueEl}
        </HintTooltip>
      ) : (
        valueEl
      )}
    </div>
  );
}

export function DndItemContent({
  item,
  variants,
  onOpenItem,
  density = "comfortable",
}: DndItemContentProps) {
  const compact = density === "compact";
  const [groupMembers, setGroupMembers] = useState<DndItem[]>([]);
  const [baseVariants, setBaseVariants] = useState<DndItem[]>([]);

  const varyingFields = useMemo(
    () => getFieldsThatVaryAcrossVariants(variants ?? [item]),
    [variants, item],
  );
  const differs = useMemo(() => {
    const set = new Set(varyingFields);
    return (field: DndItemVariantField) => set.has(field);
  }, [varyingFields]);

  const resolvedPrice = useMemo(() => resolveItemPriceGp(item), [item]);
  const priceTooltip = useMemo(() => {
    if (!resolvedPrice) return undefined;
    return formatPriceBreakdownTooltip({
      ...resolvedPrice,
      breakdown: [
        ...resolvedPrice.breakdown,
        "",
        MAGIC_ITEM_PRICING_ATTRIBUTION.shortCredit,
        MAGIC_ITEM_PRICING_ATTRIBUTION.url,
      ],
    });
  }, [resolvedPrice]);

  useEffect(() => {
    if (!item.isItemGroup || !item.groupItemRefs?.length) {
      setGroupMembers([]);
      return;
    }
    let cancelled = false;
    void Promise.all(
      item.groupItemRefs.map(async (ref) => {
        const pipe = ref.indexOf("|");
        if (pipe === -1) return undefined;
        return getDndItemById(`${ref.slice(pipe + 1)}::${ref.slice(0, pipe)}`);
      }),
    ).then((results) => {
      if (!cancelled) {
        setGroupMembers(results.filter((r): r is DndItem => r != null));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [item.id, item.isItemGroup, item.groupItemRefs]);

  useEffect(() => {
    if (!item.isGenericVariant) {
      setBaseVariants([]);
      return;
    }
    let cancelled = false;
    void getSpecificVariantsForGeneric(item.name).then((list) => {
      if (!cancelled) setBaseVariants(list);
    });
    return () => {
      cancelled = true;
    };
  }, [item.id, item.isGenericVariant, item.name]);

  const heading = cn(
    "font-bold uppercase tracking-wider text-amber-400",
    compact ? "mb-2 text-[10px]" : "mb-3 text-xs",
  );
  const listText = compact ? "text-xs" : "text-sm";

  return (
    <>
      <div
        className={cn(
          "mb-4 space-y-1.5 rounded-md border border-border bg-muted/20",
          compact ? "p-2" : "p-3",
        )}
      >
        <MetaRow compact={compact} label="Category" value={item.category} differs={differs("category")} />
        {resolvedPrice ? (
          <MetaRow
            compact={compact}
            label="Price"
            value={formatShopPriceGp(resolvedPrice.basePriceGp)}
            tooltip={priceTooltip}
          />
        ) : null}
        <MetaRow compact={compact} label="Value" value={item.valueGp ?? "—"} differs={differs("valueGp")} />
        <MetaRow compact={compact} label="Weight" value={item.weight ?? "—"} differs={differs("weight")} />
        {item.armorClass && (
          <MetaRow compact={compact} label="Armor Class" value={item.armorClass} differs={differs("armorClass")} />
        )}
        {item.strengthRequirement && (
          <MetaRow
            compact={compact}
            label="Strength"
            value={item.strengthRequirement}
            differs={differs("strengthRequirement")}
          />
        )}
        {item.stealth && (
          <MetaRow compact={compact} label="Stealth" value={item.stealth} differs={differs("stealth")} />
        )}
        {item.damage && (
          <MetaRow compact={compact} label="Damage" value={item.damage} differs={differs("damage")} />
        )}
        {item.range && (
          <MetaRow compact={compact} label="Range" value={item.range} differs={differs("range")} />
        )}
        {item.ammoType && (
          <MetaRow compact={compact} label="Ammunition" value={item.ammoType} differs={differs("ammoType")} />
        )}
        {item.weaponCategory && (
          <MetaRow
            compact={compact}
            label="Proficiency"
            value={item.weaponCategory === "martial" ? "Martial" : "Simple"}
            differs={differs("weaponCategory")}
          />
        )}
        {item.properties && (
          <MetaRow compact={compact} label="Properties" value={item.properties} differs={differs("properties")} />
        )}
        {item.mastery && (
          <MetaRow compact={compact} label="Mastery" value={item.mastery} differs={differs("mastery")} />
        )}
        {item.bonusWeapon && (
          <MetaRow
            compact={compact}
            label="Weapon Bonus"
            value={item.bonusWeapon}
            differs={differs("bonusWeapon")}
          />
        )}
        {item.bonusAc && (
          <MetaRow compact={compact} label="AC Bonus" value={item.bonusAc} differs={differs("bonusAc")} />
        )}
        {item.baseName && (
          <MetaRow
            compact={compact}
            label="Base item"
            value={`${item.baseName}${item.baseItemRef ? ` (${item.baseItemRef})` : ""}`}
          />
        )}
        {item.variantName && item.variantName !== item.name && (
          <MetaRow compact={compact} label="Variant" value={item.variantName} />
        )}
      </div>

      {item.isItemGroup && item.groupItemRefs && item.groupItemRefs.length > 0 && (
        <>
          <h3 className={heading}>Group variants ({item.groupItemRefs.length})</h3>
          <ul className={cn("mb-4 space-y-1 text-muted-foreground", listText)}>
            {groupMembers.length > 0
              ? groupMembers.map((member) => (
                  <li key={member.id}>
                    {onOpenItem ? (
                      <button
                        type="button"
                        className="text-left font-medium text-sky-300 underline-offset-2 hover:underline"
                        onClick={() => onOpenItem(member)}
                      >
                        {member.name}
                      </button>
                    ) : (
                      <span className="font-medium text-foreground">{member.name}</span>
                    )}
                    <span className="ml-2 text-xs">({member.source})</span>
                  </li>
                ))
              : item.groupItemRefs.map((ref) => <li key={ref}>{ref}</li>)}
          </ul>
          <Separator className="my-4" />
        </>
      )}

      {item.description.length > 0 && (
        <>
          <h3 className={heading}>
            Description
            {differs("description") && (
              <span className="ml-2 text-[10px] font-normal text-amber-500/80">
                (varies by source)
              </span>
            )}
          </h3>
          <StatBlockContentView content={item.description} />
        </>
      )}

      {item.isGenericVariant && baseVariants.length > 0 && (
        <>
          <Separator className="my-4" />
          <h3 className={heading}>Base items</h3>
          <p className={cn("mb-2 italic text-muted-foreground", listText)}>
            This item variant can be applied to the following base items:
          </p>
          <ul className="mb-2 space-y-1.5">
            {baseVariants.map((variant) => {
              const label = (
                <>
                  <span className="font-medium">{variant.baseName ?? variant.name}</span>
                  {variant.baseName ? (
                    <span className="text-muted-foreground"> ({variant.name})</span>
                  ) : null}
                </>
              );
              return (
                <li key={variant.id} className={listText}>
                  {onOpenItem ? (
                    <button
                      type="button"
                      className="text-left text-sky-300 underline-offset-2 hover:underline"
                      onClick={() => onOpenItem(variant)}
                    >
                      {label}
                    </button>
                  ) : (
                    label
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </>
  );
}
