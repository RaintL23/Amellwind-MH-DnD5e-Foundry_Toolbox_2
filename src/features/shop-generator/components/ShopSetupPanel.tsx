import { useEffect, useMemo, useState } from "react";
import { BookMarked, Dices, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  ListFilterPill,
  ListFiltersDialog,
  type ListFilterValues,
} from "@/shared/components/list-filters";
import { useBookSourceNames } from "@/shared/hooks/useBookSourceNames";
import { useSourceCatalog } from "@/shared/hooks/useSourceCatalog";
import { getSourceDisplayName } from "@/shared/services/source-catalog.service";
import {
  buildSourcesFilterSectionFrom2024,
  expandSourceFilterSelection,
} from "@/shared/utils/compendium-source-filter.utils";
import { CLASS_AFFINITIES } from "../data/class-affinity.data";
import { SHOP_TIERS } from "../data/shop-tier.data";
import { SHOP_THEMES } from "../data/shop-themes.data";
import type { ShopThemeId, ShopTierId } from "../data/shop-generator.types";
import { useShopGenerator } from "../context/ShopGeneratorContext";
import { MultiSelectFilter } from "./MultiSelectFilter";

export function ShopSetupPanel() {
  const {
    config,
    patchConfig,
    availableSources,
    typeOptions,
    rarityOptions,
    generating,
    loading,
    shop,
    generate,
    ensureSourcesLoaded,
  } = useShopGenerator();
  const bookNames = useBookSourceNames();
  const catalog = useSourceCatalog();
  const [sourcesDialogOpen, setSourcesDialogOpen] = useState(false);
  const [sourcesSeeded, setSourcesSeeded] = useState(false);

  const sourceSection = useMemo(
    () =>
      buildSourcesFilterSectionFrom2024(
        availableSources,
        catalog,
        bookNames,
      ),
    [availableSources, catalog, bookNames],
  );

  const sourceDefaults = useMemo(
    () => sourceSection.defaultValues ?? [],
    [sourceSection],
  );

  // Pre-select official D&D 2024+ sources once the catalog is ready.
  useEffect(() => {
    if (sourcesSeeded) return;
    if (availableSources.length === 0 || catalog.size === 0) return;
    if (sourceDefaults.length === 0) return;

    if (config.sources.length === 0) {
      patchConfig({
        sources: expandSourceFilterSelection(
          sourceDefaults,
          sourceSection.options,
        ),
      });
    }
    setSourcesSeeded(true);
  }, [
    sourcesSeeded,
    availableSources.length,
    catalog.size,
    sourceDefaults,
    sourceSection.options,
    config.sources.length,
    patchConfig,
  ]);

  useEffect(() => {
    if (config.sources.length === 0) return;
    void ensureSourcesLoaded(config.sources);
  }, [config.sources, ensureSourcesLoaded]);

  const selectedSourceOptions = useMemo(() => {
    const selected = new Set(config.sources);
    return sourceSection.options.filter(
      (opt) =>
        selected.has(opt.value) ||
        (opt.aliases ?? []).some((alias) => selected.has(alias)),
    );
  }, [config.sources, sourceSection.options]);

  const theme = SHOP_THEMES.find((t) => t.id === config.themeId);

  function handleSourcesApply(values: ListFilterValues) {
    const raw = values.src;
    const selected = Array.isArray(raw) ? raw : [];
    patchConfig({
      sources: expandSourceFilterSelection(selected, sourceSection.options),
    });
  }

  function toggleSelectedSource(value: string) {
    const option = sourceSection.options.find((o) => o.value === value);
    if (!option) {
      patchConfig({
        sources: config.sources.filter((code) => code !== value),
      });
      return;
    }
    const group = [option.value, ...(option.aliases ?? [])];
    const selectedSet = new Set(config.sources);
    const isOn = group.some((code) => selectedSet.has(code));
    if (isOn) {
      for (const code of group) selectedSet.delete(code);
    } else {
      for (const code of group) selectedSet.add(code);
    }
    patchConfig({ sources: [...selectedSet] });
  }

  return (
    <section className="space-y-4 rounded-lg border border-border bg-card/40 p-4">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Shop setup
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure stock size, theme, tier, and filters, then generate a shop
          from the D&amp;D item catalog.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="shop-item-count">Item count</Label>
          <Input
            id="shop-item-count"
            type="number"
            min={1}
            max={40}
            value={config.itemCount}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (!Number.isFinite(n)) return;
              patchConfig({
                itemCount: Math.min(40, Math.max(1, Math.round(n))),
              });
            }}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="shop-tier">Shop tier</Label>
          <Select
            id="shop-tier"
            value={String(config.shopTier)}
            onChange={(e) =>
              patchConfig({
                shopTier: Number(e.target.value) as ShopTierId,
              })
            }
          >
            {SHOP_TIERS.map((tier) => (
              <option key={tier.id} value={tier.id}>
                {tier.label} ({tier.levelRange})
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="shop-theme">Theme</Label>
          <Select
            id="shop-theme"
            value={config.themeId}
            onChange={(e) =>
              patchConfig({ themeId: e.target.value as ShopThemeId })
            }
          >
            {SHOP_THEMES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="shop-magic">Magic / mundane</Label>
          <Select
            id="shop-magic"
            value={config.magicFilter}
            onChange={(e) =>
              patchConfig({
                magicFilter: e.target.value as "" | "mundane" | "magic",
              })
            }
          >
            <option value="">Any</option>
            <option value="mundane">Mundane only</option>
            <option value="magic">Magic only</option>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="shop-attune">Attunement</Label>
          <Select
            id="shop-attune"
            value={config.attunementFilter}
            onChange={(e) =>
              patchConfig({
                attunementFilter: e.target.value as "" | "yes" | "no",
              })
            }
          >
            <option value="">Any</option>
            <option value="yes">Requires attunement</option>
            <option value="no">No attunement</option>
          </Select>
        </div>
      </div>

      {theme ? (
        <p className="text-xs text-muted-foreground">{theme.description}</p>
      ) : null}

      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Label>Sources</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setSourcesDialogOpen(true)}
            disabled={availableSources.length === 0}
          >
            <BookMarked className="mr-1.5 h-3.5 w-3.5" />
            {selectedSourceOptions.length > 0
              ? `${selectedSourceOptions.length} selected`
              : "Choose sources"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Official D&amp;D 2024+ sources are pre-selected. Open the dialog to
          browse by Official / Partnered / UA and year.
        </p>
        {selectedSourceOptions.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {selectedSourceOptions.map((option) => (
              <ListFilterPill
                key={option.value}
                label={
                  option.label ||
                  getSourceDisplayName(option.value, catalog, bookNames)
                }
                active
                onClick={() => toggleSelectedSource(option.value)}
              />
            ))}
          </div>
        ) : (
          <p className="text-xs text-amber-500/90">
            No sources selected — generation will fall back to core defaults.
          </p>
        )}
      </div>

      <ListFiltersDialog
        open={sourcesDialogOpen}
        onOpenChange={setSourcesDialogOpen}
        title="Shop sources"
        description="Grouped by Official, Partnered, Unearthed Arcana, and D&D Beyond, then by publication year. Selected sources are highlighted."
        sections={[sourceSection]}
        applied={{ src: config.sources }}
        defaults={{ src: sourceDefaults }}
        onApply={handleSourcesApply}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MultiSelectFilter
          label="Item types"
          selected={config.types}
          onChange={(types) => patchConfig({ types })}
          options={typeOptions.map((t) => ({ value: t, label: t }))}
        />
        <MultiSelectFilter
          label="Rarities"
          selected={config.rarities}
          onChange={(rarities) => patchConfig({ rarities })}
          options={rarityOptions.map((r) => ({
            value: r,
            label: r.charAt(0).toUpperCase() + r.slice(1),
          }))}
        />
        <MultiSelectFilter
          label="Class affinities"
          selected={config.classAffinities}
          onChange={(classAffinities) => patchConfig({ classAffinities })}
          options={CLASS_AFFINITIES.map((c) => ({
            value: c.id,
            label: c.label,
          }))}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          onClick={() => void generate()}
          disabled={loading || generating}
        >
          {generating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Dices className="mr-2 h-4 w-4" />
          )}
          {generating
            ? "Generating…"
            : shop
              ? "Regenerate shop"
              : "Generate shop"}
        </Button>
        {loading ? (
          <span className="text-xs text-muted-foreground">
            Loading item catalog…
          </span>
        ) : null}
      </div>
    </section>
  );
}
