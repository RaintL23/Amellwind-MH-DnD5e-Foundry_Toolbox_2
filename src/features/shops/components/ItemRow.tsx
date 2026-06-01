import { MHItem } from "@/shared/types";
import { cn } from "@/shared/utils/cn";
import { formatValueGp } from "../services/item.service";
import { useCart } from "../context/CartContext";
import { AddToCartIconButton } from "./AddToCartIconButton";
import { RarityBadge } from "./RarityBadge";

export function ItemRow({
  item,
  selected,
  onSelect,
}: {
  item: MHItem;
  selected: boolean;
  onSelect: () => void;
}) {
  const { addItem, items: cartItems } = useCart();
  const inCart = cartItems.some((c) => c.name === item.name);

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
            {formatValueGp(item.valueCp)}
          </span>
        ) : (
          <span className="text-amber-400/70 italic">Craft only</span>
        )}
      </td>
      <td className="px-4 py-3 text-muted-foreground text-xs">
        {item.weight !== null ? `${item.weight} lb.` : "—"}
      </td>
      <td className="px-4 py-3">
        <AddToCartIconButton
          inCart={inCart}
          title={inCart ? "Already in list" : "Add to list"}
          onClick={() =>
            addItem({
              name: item.name,
              cost: formatValueGp(item.valueCp),
              weight: item.weight !== null ? `${item.weight} lb.` : "—",
              source: "Items",
            })
          }
        />
      </td>
    </tr>
  );
}
