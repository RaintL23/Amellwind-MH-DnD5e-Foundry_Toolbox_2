import { useEffect, useMemo, useState } from "react";
import type { OptionalFeature, Weapon } from "@/shared/types";
import {
  DMG_TYPE_LABELS,
  PROPERTY_LABELS,
  RARITY_STYLES,
  isWeaponFeatureColumn,
} from "@/shared/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatWeaponValue } from "@/features/weapons/services/weapon.service";
import { getOptionalFeaturesMap } from "@/features/weapons/services/optionalfeature.service";
import { ExpandableFeatureRow } from "@/features/weapons/components/ExpandableFeatureRow";
import { cn } from "@/shared/utils/cn";
import { ChevronDown, ChevronRight, X } from "lucide-react";
import type { CustomWeapon } from "../types/weapon-forge.types";
import {
  descriptionToParagraphs,
  findFeatureDef,
} from "../utils/weapon-forge-features.utils";

type CompareWeapon = CustomWeapon | Weapon;

function isCustomWeapon(weapon: CompareWeapon): weapon is CustomWeapon {
  return "isCustom" in weapon && typeof weapon.isCustom === "boolean";
}

function weaponKey(weapon: CompareWeapon): string {
  if (isCustomWeapon(weapon) && weapon.id) return weapon.id;
  return `aw:${weapon.name}`;
}

interface WeaponComparePanelProps {
  weapons: CompareWeapon[];
  onClose: () => void;
}

function cellDisplay(value: string | string[] | undefined): string {
  if (value == null || value === "") return "—";
  return Array.isArray(value) ? (value.length ? value.join(", ") : "—") : value;
}

function featureNamesFromValue(value: string | string[] | undefined): string[] {
  if (value == null || value === "") return [];
  if (Array.isArray(value)) {
    return value
      .map(String)
      .map((s) => s.trim())
      .filter((s) => s && s !== "--" && s !== "-");
  }
  const trimmed = String(value).trim();
  if (!trimmed || trimmed === "--" || trimmed === "-") return [];
  return [trimmed];
}

function resolveFeatureParagraphs(
  weapon: CompareWeapon,
  featureName: string,
  optionalMap: Map<string, OptionalFeature>,
): string[] {
  if (isCustomWeapon(weapon) && weapon.customFeatures?.length) {
    const def = findFeatureDef(weapon.customFeatures, featureName);
    if (def?.description.trim()) {
      return descriptionToParagraphs(def.description);
    }
  }

  const fromOptional = optionalMap.get(featureName.toLowerCase());
  return fromOptional?.paragraphs ?? [];
}

export function WeaponComparePanel({
  weapons,
  onClose,
}: WeaponComparePanelProps) {
  const [optionalMap, setOptionalMap] = useState<Map<string, OptionalFeature>>(
    new Map(),
  );
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [rarityExpanded, setRarityExpanded] = useState<Set<string>>(
    () => new Set(),
  );

  useEffect(() => {
    void getOptionalFeaturesMap().then(setOptionalMap);
  }, []);

  useEffect(() => {
    // Expand all rarity rows by default when comparing
    const next = new Set<string>();
    for (const weapon of weapons) {
      for (const row of weapon.rarityRows) {
        next.add(row.rarity);
      }
    }
    setRarityExpanded(next);
    setExpanded(new Set());
  }, [weapons]);

  const { featureColumnLabels, otherColumnLabels, rarityUnion } = useMemo(() => {
    const featureCols = new Set<string>();
    const otherCols = new Set<string>();
    const rarities: string[] = [];
    const raritySeen = new Set<string>();

    for (const weapon of weapons) {
      for (const row of weapon.rarityRows) {
        if (!raritySeen.has(row.rarity)) {
          raritySeen.add(row.rarity);
          rarities.push(row.rarity);
        }
        for (const key of Object.keys(row.columns)) {
          if (isWeaponFeatureColumn(key)) featureCols.add(key);
          else otherCols.add(key);
        }
      }
    }

    // Prefer Bonus first among non-feature columns
    const others = [...otherCols];
    others.sort((a, b) => {
      if (a.toLowerCase() === "bonus") return -1;
      if (b.toLowerCase() === "bonus") return 1;
      return a.localeCompare(b);
    });

    const features = [...featureCols];
    features.sort((a, b) => {
      if (a.toLowerCase() === "features") return -1;
      if (b.toLowerCase() === "features") return 1;
      return a.localeCompare(b);
    });

    return {
      featureColumnLabels: features,
      otherColumnLabels: others,
      rarityUnion: rarities,
    };
  }, [weapons]);

  if (weapons.length < 2) return null;

  function toggleFeature(key: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleRarity(rarity: string) {
    setRarityExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(rarity)) next.delete(rarity);
      else next.add(rarity);
      return next;
    });
  }

  function expandableKeysForRarity(rarity: string): string[] {
    const keys: string[] = [];
    for (const weapon of weapons) {
      const row = weapon.rarityRows.find((r) => r.rarity === rarity);
      if (!row) continue;
      for (const label of featureColumnLabels) {
        for (const name of featureNamesFromValue(row.columns[label])) {
          const paragraphs = resolveFeatureParagraphs(
            weapon,
            name,
            optionalMap,
          );
          if (paragraphs.length > 0) {
            keys.push(
              `${weaponKey(weapon)}::${rarity}::${name.toLowerCase()}`,
            );
          }
        }
      }
    }
    return keys;
  }

  function areDescriptionsExpanded(rarity: string): boolean {
    const keys = expandableKeysForRarity(rarity);
    return keys.length > 0 && keys.every((key) => expanded.has(key));
  }

  function toggleDescriptionsInRarity(rarity: string) {
    if (areDescriptionsExpanded(rarity)) {
      const marker = `::${rarity}::`;
      setExpanded((prev) => {
        const next = new Set(prev);
        for (const key of prev) {
          if (key.includes(marker)) next.delete(key);
        }
        return next;
      });
      return;
    }

    const next = new Set(expanded);
    for (const key of expandableKeysForRarity(rarity)) {
      next.add(key);
    }
    setExpanded(next);
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Compare weapons
          </h2>
          <p className="text-xs text-muted-foreground">
            Side-by-side stats and rarity features — expand a feature to read
            its description
          </p>
        </div>
        <Button type="button" variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="px-2 py-2 text-left text-muted-foreground font-medium w-36">
                Stat
              </th>
              {weapons.map((weapon) => (
                <th
                  key={weaponKey(weapon)}
                  className="px-2 py-2 text-left font-semibold text-foreground"
                >
                  <div className="truncate max-w-[220px]">{weapon.name}</div>
                  {isCustomWeapon(weapon) && (
                    <Badge
                      variant="outline"
                      className={cn(
                        "mt-1 text-[9px]",
                        weapon.isCustom
                          ? "border-amber-700/50 text-amber-200"
                          : "border-teal-700/50 text-teal-200",
                      )}
                    >
                      {weapon.isCustom ? "Custom" : "Curated"}
                    </Badge>
                  )}
                  {!isCustomWeapon(weapon) && (
                    <Badge variant="outline" className="mt-1 text-[9px]">
                      Amellwind
                    </Badge>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <CompareRow
              label="Damage"
              values={weapons.map((w) =>
                w.dmg2 ? `${w.dmg1} / ${w.dmg2}` : w.dmg1,
              )}
            />
            <CompareRow
              label="Damage type"
              values={weapons.map(
                (w) => DMG_TYPE_LABELS[w.dmgType] ?? w.dmgType,
              )}
            />
            <CompareRow
              label="Properties"
              values={weapons.map((w) =>
                w.properties.length
                  ? w.properties.map((p) => PROPERTY_LABELS[p] ?? p).join(", ")
                  : "—",
              )}
            />
            <CompareRow
              label="Weight"
              values={weapons.map((w) => `${w.weight} lb`)}
            />
            <CompareRow
              label="Value"
              values={weapons.map((w) => formatWeaponValue(w.valueCp))}
            />
            <CompareRow
              label="AC / Shield"
              values={weapons.map((w) =>
                w.acBonus != null ? `+${w.acBonus} AC` : "—",
              )}
            />
            <CompareRow
              label="Range"
              values={weapons.map((w) => w.range ?? "—")}
            />
            <CompareRow
              label="Focus"
              values={weapons.map((w) => (w.isFocus ? "Yes" : "No"))}
            />
          </tbody>
        </table>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-2">Rarity progression</h3>
        <div className="space-y-2">
          {rarityUnion.map((rarity) => {
            const style = RARITY_STYLES[rarity];
            const isOpen = rarityExpanded.has(rarity);

            return (
              <div
                key={rarity}
                className="rounded-md border border-border overflow-hidden"
              >
                <div className="flex flex-wrap items-center gap-2 bg-muted/30 px-3 py-2">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 text-left"
                    onClick={() => toggleRarity(rarity)}
                  >
                    {isOpen ? (
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    <Badge
                      variant="outline"
                      className={cn("text-[10px]", style?.badge)}
                    >
                      {rarity}
                    </Badge>
                  </button>
                  {isOpen && (
                    <div className="ml-auto">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-[11px]"
                        onClick={() => toggleDescriptionsInRarity(rarity)}
                      >
                        {areDescriptionsExpanded(rarity)
                          ? "Collapse"
                          : "Expand descriptions"}
                      </Button>
                    </div>
                  )}
                </div>

                {isOpen && (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] text-sm">
                      <thead>
                        <tr className="border-b border-border/60">
                          {weapons.map((weapon) => (
                            <th
                              key={weaponKey(weapon)}
                              className="px-3 py-2 text-left text-xs font-medium text-muted-foreground"
                            >
                              {weapon.name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="align-top">
                          {weapons.map((weapon) => {
                            const row = weapon.rarityRows.find(
                              (r) => r.rarity === rarity,
                            );
                            return (
                              <td
                                key={weaponKey(weapon)}
                                className="px-3 py-3 text-xs border-t border-border/40 w-1/2"
                              >
                                {!row ? (
                                  <span className="opacity-40">—</span>
                                ) : (
                                  <div className="space-y-3">
                                    <div className="text-muted-foreground">
                                      <span className="text-foreground font-medium">
                                        Slots:
                                      </span>{" "}
                                      {row.slots}
                                    </div>

                                    {otherColumnLabels.map((label) => {
                                      const val = cellDisplay(
                                        row.columns[label],
                                      );
                                      if (val === "—") return null;
                                      return (
                                        <div
                                          key={label}
                                          className="text-muted-foreground"
                                        >
                                          <span className="text-foreground font-medium">
                                            {label}:
                                          </span>{" "}
                                          {val}
                                        </div>
                                      );
                                    })}

                                    {featureColumnLabels.map((label) => {
                                      const names = featureNamesFromValue(
                                        row.columns[label],
                                      );
                                      if (names.length === 0) return null;
                                      return (
                                        <div key={label} className="space-y-1.5">
                                          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                            {label}
                                          </p>
                                          <div className="space-y-1">
                                            {names.map((name) => {
                                              const paragraphs =
                                                resolveFeatureParagraphs(
                                                  weapon,
                                                  name,
                                                  optionalMap,
                                                );
                                              const expandKey = `${weaponKey(weapon)}::${rarity}::${name.toLowerCase()}`;
                                              return (
                                                <ExpandableFeatureRow
                                                  key={name}
                                                  name={name}
                                                  paragraphs={paragraphs}
                                                  isExpanded={expanded.has(
                                                    expandKey,
                                                  )}
                                                  onToggle={() =>
                                                    toggleFeature(expandKey)
                                                  }
                                                  className="text-foreground rounded-md border border-border/50 bg-muted/15 px-2 py-1.5"
                                                  nameClassName="text-xs font-medium"
                                                />
                                              );
                                            })}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function CompareRow({
  label,
  values,
}: {
  label: string;
  values: string[];
}) {
  return (
    <tr className="border-b border-border/40">
      <td className="px-2 py-2 text-muted-foreground">{label}</td>
      {values.map((value, i) => (
        <td key={i} className="px-2 py-2 text-foreground">
          {value}
        </td>
      ))}
    </tr>
  );
}
