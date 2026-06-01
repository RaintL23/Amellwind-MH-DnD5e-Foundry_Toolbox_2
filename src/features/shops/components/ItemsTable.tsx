import { MHItem } from "@/shared/types";
import { ItemRow } from "./ItemRow";

export function ItemsTable({
  items,
  selected,
  onSelect,
  colSpan = 5,
}: {
  items: MHItem[];
  selected: MHItem | null;
  onSelect: (item: MHItem | null) => void;
  colSpan?: number;
}) {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                Name
              </th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                Rarity
              </th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                Cost
              </th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                Weight
              </th>
              <th className="px-4 py-3 w-12" />
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td
                  colSpan={colSpan}
                  className="px-4 py-10 text-center text-muted-foreground text-sm"
                >
                  No items found.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <ItemRow
                  key={`${item.source}-${item.name}`}
                  item={item}
                  selected={selected?.name === item.name}
                  onSelect={() =>
                    onSelect(selected?.name === item.name ? null : item)
                  }
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
