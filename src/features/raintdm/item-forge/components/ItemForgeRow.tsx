import { cn } from "@/shared/utils/cn";
import { formatGpFromCp } from "@/shared/utils/currency.utils";
import { Badge } from "@/components/ui/badge";
import { RarityBadge } from "@/features/amellwind/shops/components/RarityBadge";
import { ItemRefText } from "@/shared/components/ItemRefText";
import type { RaintdmItem } from "../types/item-forge.types";

export function ItemForgeRow({
  item,
  selected,
  onSelect,
  itemDescMap,
}: {
  item: RaintdmItem;
  selected: boolean;
  onSelect: () => void;
  itemDescMap: Record<string, string>;
}) {
  const crafting = item.crafting;

  return (
    <tr
      className={cn(
        "border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer",
        selected && "bg-primary/10",
      )}
      onClick={onSelect}
    >
      <td className="px-4 py-3 font-medium text-foreground">{item.name}</td>
      <td className="px-4 py-3">
        <RarityBadge rarity={item.rarity} />
      </td>
      <td className="px-4 py-3 font-mono text-xs">
        {item.valueCp !== null ? (
          <span className="text-primary font-semibold">
            {formatGpFromCp(item.valueCp)}
          </span>
        ) : (
          <span className="text-amber-400/70 italic">Craft only</span>
        )}
      </td>
      <td className="px-4 py-3 text-muted-foreground text-xs">
        {item.weight !== null ? `${item.weight} lb.` : "—"}
      </td>
      <td className="px-4 py-3 text-muted-foreground text-sm">
        {crafting ? (
          <ItemRefText text={crafting.item1} itemDescMap={itemDescMap} />
        ) : (
          <span className="text-muted-foreground/50">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-muted-foreground text-sm">
        {crafting ? (
          <ItemRefText text={crafting.item2} itemDescMap={itemDescMap} />
        ) : (
          <span className="text-muted-foreground/50">—</span>
        )}
      </td>
      <td className="px-3 py-3 text-center">
        {crafting ? (
          <Badge variant="default" className="font-mono text-xs">
            {crafting.dc}
          </Badge>
        ) : (
          <span className="text-muted-foreground/50 text-xs">—</span>
        )}
      </td>
      <td className="px-3 py-3 text-center font-mono text-xs text-foreground">
        {crafting?.quantity ?? "—"}
      </td>
    </tr>
  );
}
