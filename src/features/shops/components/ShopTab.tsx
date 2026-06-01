import { AlertCircle, Store } from "lucide-react";
import { Shop } from "@/shared/types";
import { ShopSectionTable } from "./ShopSectionTable";

export function ShopTab({
  shop,
  itemDescMap,
}: {
  shop: Shop;
  itemDescMap: Record<string, string>;
}) {
  const totalItems = shop.sections.reduce(
    (sum, section) => sum + section.entries.length,
    0,
  );

  return (
    <div>
      <div className="rounded-lg border border-border bg-card p-4 mb-5 flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 border border-primary/20 shrink-0 mt-0.5">
          <Store className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-lg text-foreground">{shop.name}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {shop.description} · {totalItems} item{totalItems !== 1 ? "s" : ""}
          </p>
          {shop.requirement && (
            <div className="flex items-start gap-1.5 mt-2 text-amber-300/80 text-xs">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>{shop.requirement}</span>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-border overflow-hidden divide-y divide-border/50">
        {shop.sections.map((section, i) => (
          <ShopSectionTable
            key={i}
            section={section}
            shopName={shop.name}
            itemDescMap={itemDescMap}
          />
        ))}
      </div>
    </div>
  );
}
