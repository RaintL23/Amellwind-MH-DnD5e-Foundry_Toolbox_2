import type { RaintdmItem } from "../types/item-forge.types";
import { ItemForgeRow } from "./ItemForgeRow";

const HEADERS = [
  "Name",
  "Rarity",
  "Cost",
  "Weight",
  "Ingredient 1",
  "Ingredient 2",
  "DC",
  "Qty",
] as const;

export function ItemForgeTable({
  items,
  selected,
  onSelect,
  itemDescMap,
}: {
  items: RaintdmItem[];
  selected: RaintdmItem | null;
  onSelect: (item: RaintdmItem | null) => void;
  itemDescMap: Record<string, string>;
}) {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              {HEADERS.map((label) => (
                <th
                  key={label}
                  className={
                    label === "DC" || label === "Qty"
                      ? "px-3 py-3 text-center font-semibold text-muted-foreground w-14"
                      : "px-4 py-3 text-left font-semibold text-muted-foreground"
                  }
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td
                  colSpan={HEADERS.length}
                  className="px-4 py-10 text-center text-muted-foreground text-sm"
                >
                  No items found.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <ItemForgeRow
                  key={`${item.source}-${item.name}`}
                  item={item}
                  selected={selected?.name === item.name}
                  onSelect={() =>
                    onSelect(selected?.name === item.name ? null : item)
                  }
                  itemDescMap={itemDescMap}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
