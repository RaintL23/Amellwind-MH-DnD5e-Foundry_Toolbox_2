import { useEffect, useMemo, useState } from "react";
import { Dices, Loader2, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ListFilterPill,
  countActiveListFilters,
  type ListFilterSectionConfig,
} from "@/shared/components/list-filters";
import { useBookSourceNames } from "@/shared/hooks/useBookSourceNames";
import { useSourceCatalog } from "@/shared/hooks/useSourceCatalog";
import {
  buildSourcesFilterSectionFrom2024,
  expandSourceFilterSelection,
} from "@/shared/utils/compendium-source-filter.utils";
import {
  ABILITY_AFFINITIES,
  CLASS_AFFINITIES,
  INTENDED_USE_AFFINITIES,
} from "../data/class-affinity.data";
import {
  DEFAULT_SHOP_CONFIG,
  type ShopConfig,
} from "../data/shop-generator.types";
import { getShopTier } from "../data/shop-tier.data";
import { getShopTheme } from "../data/shop-themes.data";
import { useShopGenerator } from "../context/ShopGeneratorContext";
import { ShopSetupDialog } from "./ShopSetupDialog";

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
  const [setupOpen, setSetupOpen] = useState(false);
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

  const catalogSections = useMemo((): ListFilterSectionConfig[] => {
    return [
      {
        id: "types",
        title: "Item types",
        mode: "multi",
        defaultExpanded: true,
        options: typeOptions.map((t) => ({ value: t, label: t })),
      },
      {
        id: "rarities",
        title: "Rarities",
        mode: "multi",
        options: rarityOptions.map((r) => ({
          value: r,
          label: r.charAt(0).toUpperCase() + r.slice(1),
        })),
      },
      {
        id: "classAffinities",
        title: "Class affinity",
        mode: "multi",
        options: CLASS_AFFINITIES.map((c) => ({
          value: c.id,
          label: c.label,
        })),
      },
      {
        id: "intendedUses",
        title: "Intended use",
        mode: "multi",
        options: INTENDED_USE_AFFINITIES.map((c) => ({
          value: c.id,
          label: c.label,
        })),
      },
      {
        id: "abilityAffinities",
        title: "Ability focus",
        mode: "multi",
        options: ABILITY_AFFINITIES.map((c) => ({
          value: c.id,
          label: c.label,
        })),
      },
    ];
  }, [typeOptions, rarityOptions]);

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

  const theme = getShopTheme(config.themeId);
  const tier = getShopTier(config.shopTier);

  const filterCount = useMemo(() => {
    const filterValues = {
      src: config.sources,
      types: config.types,
      rarities: config.rarities,
      classAffinities: config.classAffinities,
      intendedUses: config.intendedUses,
      abilityAffinities: config.abilityAffinities,
    };
    const sectionCount = countActiveListFilters(filterValues, [
      { ...sourceSection, defaultValues: sourceDefaults },
      ...catalogSections,
    ]);
    let scalar = 0;
    if (config.itemCount !== DEFAULT_SHOP_CONFIG.itemCount) scalar += 1;
    if (config.shopTier !== DEFAULT_SHOP_CONFIG.shopTier) scalar += 1;
    if (config.themeId !== DEFAULT_SHOP_CONFIG.themeId) scalar += 1;
    if (config.magicFilter) scalar += 1;
    if (config.attunementFilter) scalar += 1;
    return sectionCount + scalar;
  }, [config, sourceSection, sourceDefaults, catalogSections]);

  const summaryPills = useMemo(() => {
    const pills: Array<{ key: string; label: string; clear?: () => void }> = [
      { key: "theme", label: theme.label },
      { key: "tier", label: `${tier.label} · ${tier.levelRange}` },
      { key: "count", label: `${config.itemCount} items` },
    ];

    if (config.magicFilter === "magic") {
      pills.push({
        key: "magic",
        label: "Magic only",
        clear: () => patchConfig({ magicFilter: "" }),
      });
    } else if (config.magicFilter === "mundane") {
      pills.push({
        key: "mundane",
        label: "Mundane only",
        clear: () => patchConfig({ magicFilter: "" }),
      });
    }

    if (config.attunementFilter === "yes") {
      pills.push({
        key: "attune-yes",
        label: "Attunement",
        clear: () => patchConfig({ attunementFilter: "" }),
      });
    } else if (config.attunementFilter === "no") {
      pills.push({
        key: "attune-no",
        label: "No attunement",
        clear: () => patchConfig({ attunementFilter: "" }),
      });
    }

    if (config.sources.length > 0) {
      pills.push({
        key: "sources",
        label: `${config.sources.length} sources`,
      });
    }

    for (const id of config.classAffinities) {
      const profile = CLASS_AFFINITIES.find((c) => c.id === id);
      pills.push({
        key: `class-${id}`,
        label: profile?.label ?? id,
        clear: () =>
          patchConfig({
            classAffinities: config.classAffinities.filter((x) => x !== id),
          }),
      });
    }
    for (const id of config.intendedUses) {
      const profile = INTENDED_USE_AFFINITIES.find((c) => c.id === id);
      pills.push({
        key: `use-${id}`,
        label: profile?.label ?? id,
        clear: () =>
          patchConfig({
            intendedUses: config.intendedUses.filter((x) => x !== id),
          }),
      });
    }
    for (const id of config.abilityAffinities) {
      const profile = ABILITY_AFFINITIES.find((c) => c.id === id);
      pills.push({
        key: `ability-${id}`,
        label: profile?.label ?? id,
        clear: () =>
          patchConfig({
            abilityAffinities: config.abilityAffinities.filter(
              (x) => x !== id,
            ),
          }),
      });
    }
    for (const type of config.types) {
      pills.push({
        key: `type-${type}`,
        label: type,
        clear: () =>
          patchConfig({ types: config.types.filter((x) => x !== type) }),
      });
    }
    for (const rarity of config.rarities) {
      pills.push({
        key: `rarity-${rarity}`,
        label: rarity.charAt(0).toUpperCase() + rarity.slice(1),
        clear: () =>
          patchConfig({
            rarities: config.rarities.filter((x) => x !== rarity),
          }),
      });
    }

    return pills;
  }, [config, theme.label, tier.label, tier.levelRange, patchConfig]);

  function handleSetupApply(next: ShopConfig) {
    patchConfig(next);
    if (next.sources.length > 0) {
      void ensureSourcesLoaded(next.sources);
    }
  }

  return (
    <section className="space-y-4 rounded-lg border border-border bg-card/40 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Shop setup
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Open setup to choose the guidelines used when generating shop stock,
            then generate or regenerate.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setSetupOpen(true)}
        >
          <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5" />
          {filterCount > 0 ? `Shop setup (${filterCount})` : "Shop setup"}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">{theme.description}</p>

      {summaryPills.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {summaryPills.map((pill) =>
            pill.clear ? (
              <ListFilterPill
                key={pill.key}
                label={pill.label}
                active
                onClick={pill.clear}
              />
            ) : (
              <span
                key={pill.key}
                className="rounded-md border border-border bg-muted/30 px-2.5 py-1 text-xs font-medium text-muted-foreground"
              >
                {pill.label}
              </span>
            ),
          )}
        </div>
      ) : null}

      <ShopSetupDialog
        open={setupOpen}
        onOpenChange={setSetupOpen}
        config={config}
        sourceSection={sourceSection}
        sourceDefaults={sourceDefaults}
        catalogSections={catalogSections}
        onApply={handleSetupApply}
      />

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
