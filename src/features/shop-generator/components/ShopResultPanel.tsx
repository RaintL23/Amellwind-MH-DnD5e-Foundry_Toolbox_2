import { useMemo, useState } from "react";
import {
  Download,
  FileJson,
  RefreshCw,
  Replace,
  Trash2,
  UserRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { DndItemDetailDialog } from "@/features/dnd-items/components/DndItemDetailDialog";
import { HintTooltip } from "@/shared/components/HintTooltip";
import type { DndItem } from "@/shared/types";
import { getShopTheme } from "../data/shop-themes.data";
import { getShopTier } from "../data/shop-tier.data";
import type {
  PriceSourceKind,
  ShopPriceTier,
} from "../data/shop-generator.types";
import { MAGIC_ITEM_PRICING_ATTRIBUTION } from "../data/magic-item-pricing-attribution";
import { useShopGenerator } from "../context/ShopGeneratorContext";
import {
  formatPriceBreakdownTooltip,
  formatShopPriceGp,
  resolveItemPriceGp,
} from "../utils/price-resolve.utils";

const PRICE_SOURCE_LABEL: Record<PriceSourceKind, string> = {
  csv: "CSV",
  catalog: "Catalog",
  estimated: "Estimated",
  generic: "Generic",
};

export function ShopResultPanel() {
  const {
    shop,
    priceTier,
    items,
    setPriceTier,
    setShopName,
    rerollShopkeeper,
    editStockPrice,
    removeStockEntry,
    replaceEntry,
    getDisplayPriceGp,
    getStockTotalGp,
    exportJson,
    exportText,
  } = useShopGenerator();

  const [selectedItem, setSelectedItem] = useState<DndItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const itemById = useMemo(() => {
    const map = new Map<string, DndItem>();
    for (const item of items) map.set(item.id, item);
    return map;
  }, [items]);

  if (!shop) {
    return (
      <section className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        Generate a shop to see inventory, shopkeeper, and editable prices here.
      </section>
    );
  }

  const theme = getShopTheme(shop.themeId);
  const tier = getShopTier(shop.shopTier);

  function openItem(itemId: string) {
    const item = itemById.get(itemId);
    if (!item) return;
    setSelectedItem(item);
    setDialogOpen(true);
  }

  return (
    <section className="space-y-4 rounded-lg border border-border bg-card/40 p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="shop-name">Shop name</Label>
            <Input
              id="shop-name"
              value={shop.name}
              onChange={(e) => setShopName(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{theme.label}</Badge>
            <Badge variant="outline">
              {tier.label} · {tier.levelRange}
            </Badge>
            <Badge variant="outline">{shop.stock.length} items</Badge>
          </div>
          <div className="rounded-md border border-border/70 bg-background/50 p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <UserRound className="h-4 w-4 shrink-0 text-primary" />
                  <span className="truncate">
                    {shop.shopkeeper.name}
                    <span className="font-normal text-muted-foreground">
                      , {shop.shopkeeper.title}
                    </span>
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {shop.shopkeeper.flavor}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void rerollShopkeeper()}
              >
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                Reroll
              </Button>
            </div>
          </div>
        </div>

        <div className="flex w-full flex-col gap-3 sm:w-56">
          <div className="space-y-1.5">
            <Label htmlFor="price-tier">Price markup</Label>
            <Select
              id="price-tier"
              value={priceTier}
              onChange={(e) =>
                setPriceTier(e.target.value as ShopPriceTier)
              }
            >
              <option value="cheap">Cheap (×0.75)</option>
              <option value="normal">Normal (×1.0)</option>
              <option value="expensive">Expensive (×1.5)</option>
            </Select>
            <p className="text-xs text-muted-foreground">
              Manual price edits stay fixed when markup changes.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={exportText}>
              <Download className="mr-1.5 h-3.5 w-3.5" />
              Text
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={exportJson}>
              <FileJson className="mr-1.5 h-3.5 w-3.5" />
              JSON
            </Button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Item</th>
              <th className="px-3 py-2 font-medium">Type</th>
              <th className="px-3 py-2 font-medium">Rarity</th>
              <th className="px-3 py-2 font-medium">Source</th>
              <th className="px-3 py-2 font-medium">Price</th>
              <th className="px-3 py-2 font-medium">Basis</th>
              <th className="px-3 py-2 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {shop.stock.map((entry) => {
              const display = getDisplayPriceGp(entry.rowId);
              const catalogItem = itemById.get(entry.itemId);
              const priceDetail = catalogItem
                ? resolveItemPriceGp(catalogItem)
                : null;
              const basisTooltip = priceDetail
                ? formatPriceBreakdownTooltip({
                    ...priceDetail,
                    breakdown: [
                      ...priceDetail.breakdown,
                      "",
                      MAGIC_ITEM_PRICING_ATTRIBUTION.shortCredit,
                      MAGIC_ITEM_PRICING_ATTRIBUTION.url,
                    ],
                  })
                : undefined;
              return (
                <tr
                  key={entry.rowId}
                  className="border-b border-border/60 last:border-0"
                >
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      className="text-left font-medium text-primary hover:underline"
                      onClick={() => openItem(entry.itemId)}
                    >
                      {entry.name}
                    </button>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {entry.typeLabel}
                  </td>
                  <td className="px-3 py-2">{entry.rarityLabel}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {entry.source}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min={0}
                        className="h-8 w-28"
                        value={display}
                        onChange={(e) => {
                          const n = Number(e.target.value);
                          if (!Number.isFinite(n) || n < 0) return;
                          editStockPrice(entry.rowId, Math.round(n));
                        }}
                      />
                      <span className="text-xs text-muted-foreground">gp</span>
                      {entry.priceOverrideGp != null ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 px-1.5 text-xs"
                          onClick={() => editStockPrice(entry.rowId, null)}
                          title="Clear override"
                        >
                          Reset
                        </Button>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    {basisTooltip ? (
                      <HintTooltip
                        content={basisTooltip}
                        side="top"
                        align="start"
                        className="max-w-sm"
                      >
                        <Badge
                          variant="outline"
                          className="cursor-help font-normal"
                        >
                          {PRICE_SOURCE_LABEL[entry.priceSource]}
                        </Badge>
                      </HintTooltip>
                    ) : (
                      <Badge variant="outline" className="font-normal">
                        {PRICE_SOURCE_LABEL[entry.priceSource]}
                      </Badge>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="Replace item"
                        onClick={() => replaceEntry(entry.rowId)}
                      >
                        <Replace className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        title="Remove item"
                        onClick={() => removeStockEntry(entry.rowId)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="text-muted-foreground">
          Base prices use{" "}
          <a
            href={MAGIC_ITEM_PRICING_ATTRIBUTION.url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground"
          >
            {MAGIC_ITEM_PRICING_ATTRIBUTION.title}
          </a>{" "}
          by {MAGIC_ITEM_PRICING_ATTRIBUTION.author} when available, then
          catalog value, then rarity estimates. Hover a Basis badge for the
          calculation.
        </span>
        <span className="font-semibold">
          Total: {formatShopPriceGp(getStockTotalGp())}
        </span>
      </div>

      <DndItemDetailDialog
        item={selectedItem}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </section>
  );
}
