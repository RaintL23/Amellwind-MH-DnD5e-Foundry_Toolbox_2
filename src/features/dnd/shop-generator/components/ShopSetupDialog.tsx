import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  ListFilterSection,
  type ListFilterSectionConfig,
  type ListFilterValues,
} from "@/shared/components/list-filters";
import {
  getSectionSelected,
  setSectionSelected,
} from "@/shared/components/list-filters/list-filter.utils";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { expandSourceFilterSelection } from "@/shared/utils/compendium-source-filter.utils";
import { SHOP_TIERS } from "../data/shop-tier.data";
import { SHOP_THEMES } from "../data/shop-themes.data";
import {
  DEFAULT_SHOP_CONFIG,
  type ShopConfig,
  type ShopThemeId,
  type ShopTierId,
} from "../data/shop-generator.types";

export interface ShopSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: ShopConfig;
  sourceSection: ListFilterSectionConfig;
  sourceDefaults: string[];
  catalogSections: ListFilterSectionConfig[];
  onApply: (next: ShopConfig) => void;
}

function asMulti(values: ListFilterValues, key: string): string[] {
  const raw = values[key];
  return Array.isArray(raw) ? raw : [];
}

function configToFilterValues(config: ShopConfig): ListFilterValues {
  return {
    src: config.sources,
    types: config.types,
    rarities: config.rarities,
    classAffinities: config.classAffinities,
    intendedUses: config.intendedUses,
    abilityAffinities: config.abilityAffinities,
  };
}

export function ShopSetupDialog({
  open,
  onOpenChange,
  config,
  sourceSection,
  sourceDefaults,
  catalogSections,
  onApply,
}: ShopSetupDialogProps) {
  const [draftConfig, setDraftConfig] = useState<ShopConfig>(config);
  const [filterDraft, setFilterDraft] = useState<ListFilterValues>(() =>
    configToFilterValues(config),
  );
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebouncedValue(searchQuery, 150);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      setDraftConfig(config);
      setFilterDraft(configToFilterValues(config));
      setSearchQuery("");
    }
    wasOpenRef.current = open;
  }, [open, config]);

  const sections = useMemo(
    () => [sourceSection, ...catalogSections],
    [sourceSection, catalogSections],
  );

  const visibleSections = useMemo(
    () => sections.filter((section) => section.options.length > 0),
    [sections],
  );

  const theme = SHOP_THEMES.find((t) => t.id === draftConfig.themeId);

  const handleSectionChange = useCallback(
    (sectionId: string, selected: string[]) => {
      const section = sections.find((s) => s.id === sectionId);
      if (!section) return;
      setFilterDraft((prev) => setSectionSelected(section, prev, selected));
    },
    [sections],
  );

  const handleSave = useCallback(() => {
    const rawSources = asMulti(filterDraft, "src");
    const sources = expandSourceFilterSelection(
      rawSources,
      sourceSection.options,
    );
    onApply({
      ...draftConfig,
      sources,
      types: asMulti(filterDraft, "types"),
      rarities: asMulti(filterDraft, "rarities"),
      classAffinities: asMulti(filterDraft, "classAffinities"),
      intendedUses: asMulti(filterDraft, "intendedUses"),
      abilityAffinities: asMulti(filterDraft, "abilityAffinities"),
    });
    onOpenChange(false);
  }, [
    draftConfig,
    filterDraft,
    onApply,
    onOpenChange,
    sourceSection.options,
  ]);

  const handleCancel = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const handleReset = useCallback(() => {
    const resetSources = expandSourceFilterSelection(
      sourceDefaults,
      sourceSection.options,
    );
    const reset: ShopConfig = {
      ...DEFAULT_SHOP_CONFIG,
      sources: resetSources,
    };
    setDraftConfig(reset);
    setFilterDraft(configToFilterValues(reset));
  }, [sourceDefaults, sourceSection.options]);

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        overlayClassName="backdrop-blur-none bg-black/60"
        className="max-w-4xl flex max-h-[90vh] flex-col duration-150"
      >
        <DialogHeader className="shrink-0 pb-2">
          <DialogTitle>Shop setup</DialogTitle>
          <DialogDescription>
            These options define how the next shop is generated — they are not
            filters applied after stock is rolled. Sources, types, and rarities
            shape the pool; class, intended use, and ability focus softly bias
            the draw.
          </DialogDescription>
          <div className="relative pt-2">
            <Search className="pointer-events-none absolute left-2.5 top-4 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search filter options..."
              className="pl-8"
            />
          </div>
        </DialogHeader>

        <DialogBody className="min-h-0 flex-1 space-y-5 overscroll-contain pt-2">
          <div className="space-y-3 rounded-lg border border-border/70 bg-muted/20 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Generation guidelines
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="setup-item-count">Item count</Label>
                <Input
                  id="setup-item-count"
                  type="number"
                  min={1}
                  max={40}
                  value={draftConfig.itemCount}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    if (!Number.isFinite(n)) return;
                    setDraftConfig((prev) => ({
                      ...prev,
                      itemCount: Math.min(40, Math.max(1, Math.round(n))),
                    }));
                  }}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="setup-tier">Shop tier</Label>
                <Select
                  id="setup-tier"
                  value={String(draftConfig.shopTier)}
                  onChange={(e) =>
                    setDraftConfig((prev) => ({
                      ...prev,
                      shopTier: Number(e.target.value) as ShopTierId,
                    }))
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
                <Label htmlFor="setup-theme">Theme</Label>
                <Select
                  id="setup-theme"
                  value={draftConfig.themeId}
                  onChange={(e) =>
                    setDraftConfig((prev) => ({
                      ...prev,
                      themeId: e.target.value as ShopThemeId,
                    }))
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
                <Label htmlFor="setup-magic">Magic / mundane</Label>
                <Select
                  id="setup-magic"
                  value={draftConfig.magicFilter}
                  onChange={(e) =>
                    setDraftConfig((prev) => ({
                      ...prev,
                      magicFilter: e.target.value as ShopConfig["magicFilter"],
                    }))
                  }
                >
                  <option value="">Any</option>
                  <option value="mundane">Mundane only</option>
                  <option value="magic">Magic only</option>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="setup-attune">Attunement</Label>
                <Select
                  id="setup-attune"
                  value={draftConfig.attunementFilter}
                  onChange={(e) =>
                    setDraftConfig((prev) => ({
                      ...prev,
                      attunementFilter: e.target
                        .value as ShopConfig["attunementFilter"],
                    }))
                  }
                >
                  <option value="">Any</option>
                  <option value="yes">Requires attunement</option>
                  <option value="no">No attunement</option>
                </Select>
              </div>
            </div>
            {theme ? (
              <p className="text-xs text-muted-foreground">
                {theme.description}
              </p>
            ) : null}
          </div>

          {visibleSections.map((section) => (
            <ListFilterSection
              key={section.id}
              title={section.title}
              mode={section.mode}
              options={section.options}
              groups={section.groups}
              defaultExpanded={section.defaultExpanded}
              selected={getSectionSelected(section, filterDraft)}
              onChange={(selected) =>
                handleSectionChange(section.id, selected)
              }
              searchQuery={debouncedSearch}
            />
          ))}
        </DialogBody>

        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-border px-6 py-4">
          <Button type="button" variant="ghost" size="sm" onClick={handleReset}>
            Reset
          </Button>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSave}>
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
