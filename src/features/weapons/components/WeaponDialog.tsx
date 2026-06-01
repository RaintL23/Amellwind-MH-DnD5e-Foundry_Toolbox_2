import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
} from "@/components/ui/dialog";
import {
  Weapon,
  WeaponRarityRow,
  OptionalFeature,
  PROPERTY_LABELS,
  DMG_TYPE_LABELS,
  RARITY_STYLES,
  isUnlockListColumn,
  isWeaponFeatureColumn,
  UNLOCK_COLUMN_PREFIX,
} from "@/shared/types";
import { formatWeaponValue } from "../services/weapon.service";
import {
  getOptionalFeaturesMap,
  resolveWeaponBaseFeatures,
} from "../services/optionalfeature.service";
import {
  getWeaponShieldAcBonusAtIndex,
} from "../utils/shield.utils";
import { cn } from "@/shared/utils/cn";
import {
  Swords,
  Shield,
  Layers,
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

// ─── Feature chain types ───────────────────────────────────────────────────────

interface FeatureAtRarity {
  name: string;
  rarityIndex: number;
}

interface FeatureChain {
  /** Name of the base feature (or first upgrade if base wasn't listed) */
  baseName: string;
  /** Entries in order of rarityIndex */
  features: FeatureAtRarity[];
  /** Index of the earliest feature in this chain */
  introducedAtIndex: number;
}

interface ColumnChains {
  label: string;
  chains: FeatureChain[];
}

// ─── Chain logic ───────────────────────────────────────────────────────────────

/**
 * Strips " Upgrade [Roman/number]" suffixes to get the base feature name.
 * Examples:
 *   "Charged Slash Upgrade I"  → "Charged Slash"
 *   "Spirit Gauge Upgrade III" → "Spirit Gauge"
 *   "Demon Mode Upgrade"       → "Demon Mode"
 *   "Charged Slash"            → "Charged Slash" (unchanged)
 */
function getBaseName(name: string): string {
  return name.replace(/\s+Upgrade\b.*/i, "").trim();
}

/**
 * Builds feature chains per feature-type column across all rarity rows.
 * Preserves column separation so "Single Features" and "Splint Features"
 * don't merge (Splint Rapier), and "Notes" stays as its own group (Hunting Horn).
 */
function buildColumnChains(rarityRows: WeaponRarityRow[]): ColumnChains[] {
  // Collect all feature column labels, in first-appearance order
  const colLabelOrder: string[] = [];
  const colLabelSet = new Set<string>();

  for (const row of rarityRows) {
    for (const label of Object.keys(row.columns)) {
      if (isWeaponFeatureColumn(label) && !colLabelSet.has(label)) {
        colLabelOrder.push(label);
        colLabelSet.add(label);
      }
    }
  }

  return colLabelOrder.map((colLabel) => {
    const chainMap = new Map<string, FeatureChain>();

    for (let i = 0; i < rarityRows.length; i++) {
      const val = rarityRows[i].columns[colLabel];
      if (!val) continue;

      const items = Array.isArray(val) ? val : [val];

      for (const name of items) {
        if (!name) continue;
        const baseName = getBaseName(name);

        if (!chainMap.has(baseName)) {
          chainMap.set(baseName, {
            baseName,
            features: [{ name, rarityIndex: i }],
            introducedAtIndex: i,
          });
        } else {
          chainMap.get(baseName)!.features.push({ name, rarityIndex: i });
        }
      }
    }

    const chains = Array.from(chainMap.values()).sort(
      (a, b) => a.introducedAtIndex - b.introducedAtIndex,
    );

    return { label: colLabel, chains };
  });
}

function getUnlockColumnLabels(rarityRows: WeaponRarityRow[]): string[] {
  const labels = new Set<string>();
  for (const row of rarityRows) {
    for (const label of Object.keys(row.columns)) {
      if (isUnlockListColumn(label)) labels.add(label);
    }
  }
  return [...labels].sort();
}

function getAccumulatedUnlocks(
  rarityRows: WeaponRarityRow[],
  columnLabel: string,
  upToIndex: number,
): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (let i = 0; i <= upToIndex; i++) {
    const val = rarityRows[i]?.columns[columnLabel];
    if (!val) continue;
    const items = Array.isArray(val) ? val : [val];
    for (const item of items) {
      const key = item.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        result.push(item);
      }
    }
  }

  return result;
}

// ─── Rarity dot of a specific rarity tier ─────────────────────────────────────

function RarityDot({ rarity }: { rarity: string }) {
  const dotColors: Record<string, string> = {
    Common: "bg-gray-500",
    Uncommon: "bg-green-500",
    Rare: "bg-blue-500",
    "Very Rare": "bg-purple-500",
    Legendary: "bg-amber-500",
  };
  return (
    <span
      className={cn(
        "inline-block h-2 w-2 rounded-full shrink-0 mt-1.5",
        dotColors[rarity] ?? "bg-gray-500",
      )}
      title={rarity}
    />
  );
}

// ─── Rarity Slide ─────────────────────────────────────────────────────────────

interface RaritySlideProps {
  row: WeaponRarityRow;
  /** Index of this slide (0 = Common … 4 = Legendary) */
  rarityIndex: number;
  rarityRows: WeaponRarityRow[];
  columnChains: ColumnChains[];
  featuresMap: Map<string, OptionalFeature>;
  /** Features that apply at ALL rarities (e.g. Melody / Single Note Melody on HH) */
  baseFeatures: OptionalFeature[];
  /** Lowercase names already shown under Base Features (omit from rarity chains) */
  baseFeatureNameKeys: Set<string>;
}

function RaritySlide({
  row,
  rarityIndex,
  rarityRows,
  columnChains,
  featuresMap,
  baseFeatures,
  baseFeatureNameKeys,
}: RaritySlideProps) {
  const style = RARITY_STYLES[row.rarity] ?? RARITY_STYLES["Common"];
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggleFeature(name: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      const key = name.toLowerCase();
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const unlockColumnLabels = getUnlockColumnLabels(rarityRows);
  const unlockSections = unlockColumnLabels
    .map((label) => ({
      label,
      items: getAccumulatedUnlocks(rarityRows, label, rarityIndex),
    }))
    .filter((s) => s.items.length > 0);

  // Stat columns (non-feature, non-unlock): show current rarity's values
  const statEntries: [string, string][] = [];
  for (const [label, val] of Object.entries(row.columns)) {
    if (isWeaponFeatureColumn(label) || isUnlockListColumn(label)) continue;
    const display = Array.isArray(val) ? val.join(", ") : val;
    if (display) statEntries.push([label, display]);
  }

  const bonusEntry = statEntries.find(([k]) => k.toLowerCase() === "bonus");
  const otherStats = statEntries.filter(([k]) => k.toLowerCase() !== "bonus");

  // Chains visible at this rarity (introduced at or before this slide)
  const visibleCols = columnChains
    .map(({ label, chains }) => ({
      label,
      chains: chains
        .filter((c) => c.introducedAtIndex <= rarityIndex)
        .map((chain) => ({
          ...chain,
          features: chain.features.filter(
            (f) => !baseFeatureNameKeys.has(f.name.toLowerCase()),
          ),
        }))
        .filter((c) => c.features.length > 0),
    }))
    .filter(({ chains }) => chains.length > 0);

  const hasFeatures = visibleCols.some(({ chains }) => chains.length > 0);

  return (
    <div
      className={cn(
        "rounded-lg border bg-gradient-to-br p-5 flex flex-col gap-3",
        style.border,
        style.bg,
      )}
    >
      {/* Header: rarity badge + slots + attack bonus */}
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-3 py-1 text-sm font-bold capitalize",
            style.badge,
          )}
        >
          {row.rarity}
        </span>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          {bonusEntry && (
            <span className={cn("font-bold text-base", style.text)}>
              {bonusEntry[1]} to hit
            </span>
          )}
          <span className="flex items-center gap-1">
            <Layers className="h-3.5 w-3.5" />
            {row.slots} slot{row.slots !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Extra stats (AC Bonus, Spirit Gain, Chord Length, etc.) */}
      {otherStats.length > 0 && (
        <div className="flex flex-wrap gap-x-5 gap-y-1 border-t border-white/10 pt-2">
          {otherStats.map(([label, value]) => {
            const isAcBonus = label.toLowerCase() === "ac bonus";
            return (
              <div key={label} className="text-sm">
                <span className="text-muted-foreground">{label}:</span>{" "}
                <span className={cn("font-semibold", style.text)}>{value}</span>
                {isAcBonus && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    While the integrated shield is equipped
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Ammo / coatings / etc. unlocked at this rarity (includes lower tiers) */}
      {unlockSections.map(({ label, items }) => (
        <div key={label} className="border-t border-white/10 pt-2">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
            {label.replace(UNLOCK_COLUMN_PREFIX, "")}
          </p>
          <ul className="text-sm space-y-0.5">
            {items.map((item) => {
              const introducedAt = rarityRows.findIndex((r) => {
                const val = r.columns[label];
                if (!val) return false;
                const list = Array.isArray(val) ? val : [val];
                return list.some((v) => v.toLowerCase() === item.toLowerCase());
              });
              const isNew = introducedAt === rarityIndex;
              return (
                <li
                  key={item}
                  className={cn(
                    "flex items-center gap-2 leading-snug",
                    isNew ? "text-foreground" : "text-muted-foreground/70",
                  )}
                >
                  <span className="shrink-0">•</span>
                  <span className="flex-1">{item}</span>
                  {introducedAt >= 0 && (
                    <RarityDot rarity={rarityRows[introducedAt]?.rarity ?? ""} />
                  )}
                  {isNew && (
                    <span
                      className={cn(
                        "text-[10px] font-bold uppercase tracking-wide shrink-0",
                        style.text,
                      )}
                    >
                      new
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      {/* Base features (apply at all rarities, e.g. Melody / Single Note Melody on HH) */}
      {baseFeatures.length > 0 && (
        <div className="border-t border-white/10 pt-2 space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
            Base Features
          </p>
          {baseFeatures.map((feat) => {
            const isExpanded = expanded.has(feat.name.toLowerCase());
            return (
              <div key={feat.name}>
                <div
                  className="flex items-start gap-2 text-sm text-foreground cursor-pointer select-none"
                  onClick={() => toggleFeature(feat.name)}
                >
                  <span className="shrink-0 mt-0.5">★</span>
                  {isExpanded
                    ? <ChevronDown className="h-3.5 w-3.5 shrink-0 mt-0.5 opacity-60" />
                    : <ChevronRight className="h-3.5 w-3.5 shrink-0 mt-0.5 opacity-40" />
                  }
                  <span className="flex-1 leading-snug">{feat.name}</span>
                </div>
                {isExpanded && feat.paragraphs.length > 0 && (
                  <div className="mt-1 ml-6 mb-1 border-l-2 border-border/40 pl-3 space-y-1.5">
                    {feat.paragraphs.map((p, pi) => (
                      <p key={pi} className="text-xs text-muted-foreground leading-relaxed">
                        {p}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Accumulated feature chains */}
      <div className="flex-1">
        {hasFeatures ? (
          <div className="space-y-4">
            {visibleCols.map(({ label, chains }) => (
              <div key={label}>
                {/* Column label only when multiple feature columns (Splint Rapier) */}
                {visibleCols.length > 1 && (
                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                    {label}
                  </p>
                )}

                <div className="space-y-2.5">
                  {chains.map((chain) => {
                    // Only features up to and including this rarity
                    const visible = chain.features.filter(
                      (f) => f.rarityIndex <= rarityIndex,
                    );

                    return (
                      <div key={chain.baseName} className="space-y-1">
                        {visible.map((feat, fi) => {
                          const isNew = feat.rarityIndex === rarityIndex;
                          const isUpgrade = fi > 0;
                          const featRarity =
                            rarityRows[feat.rarityIndex]?.rarity ?? "";
                          const feature = featuresMap.get(
                            feat.name.toLowerCase(),
                          );
                          const isExpanded = expanded.has(
                            feat.name.toLowerCase(),
                          );
                          const hasDesc =
                            !!feature && feature.paragraphs.length > 0;

                          return (
                            <div
                              key={`${feat.name}-${feat.rarityIndex}`}
                              className={cn(isUpgrade && "ml-5")}
                            >
                              {/* Feature row */}
                              <div
                                className={cn(
                                  "flex items-start gap-2 text-sm",
                                  hasDesc && "cursor-pointer select-none",
                                  isNew
                                    ? "text-foreground"
                                    : "text-muted-foreground/60",
                                )}
                                onClick={() =>
                                  hasDesc && toggleFeature(feat.name)
                                }
                              >
                                {/* Connector */}
                                <span className="shrink-0 mt-0.5">
                                  {isUpgrade ? "└" : ""}
                                </span>

                                {/* Expand chevron */}
                                {hasDesc ? (
                                  isExpanded ? (
                                    <ChevronDown className="h-3.5 w-3.5 shrink-0 mt-0.5 opacity-60" />
                                  ) : (
                                    <ChevronRight className="h-3.5 w-3.5 shrink-0 mt-0.5 opacity-40" />
                                  )
                                ) : null}

                                {/* Feature name */}
                                <span className="flex-1 leading-snug">
                                  {feat.name}
                                </span>

                                {/* Rarity origin dot */}
                                <RarityDot rarity={featRarity} />

                                {/* NEW badge */}
                                {isNew && (
                                  <span
                                    className={cn(
                                      "text-[10px] font-bold uppercase tracking-wide shrink-0",
                                      style.text,
                                    )}
                                  >
                                    new
                                  </span>
                                )}
                              </div>

                              {/* Expanded description */}
                              {hasDesc && isExpanded && (
                                <div className="mt-1 ml-6 mb-1 border-l-2 border-border/40 pl-3 space-y-1.5">
                                  {feature.paragraphs.map((p, pi) => (
                                    <p
                                      key={pi}
                                      className="text-xs text-muted-foreground leading-relaxed"
                                    >
                                      {p}
                                    </p>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : baseFeatures.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            No features at this rarity tier.
          </p>
        ) : null}
      </div>
    </div>
  );
}

// ─── Dot navigation ───────────────────────────────────────────────────────────

function RarityDots({
  count,
  current,
  onSelect,
  rows,
}: {
  count: number;
  current: number;
  onSelect: (i: number) => void;
  rows: WeaponRarityRow[];
}) {
  return (
    <div className="flex items-center justify-center gap-2 mt-3">
      {Array.from({ length: count }).map((_, i) => {
        const rarity = rows[i]?.rarity ?? "";
        const s = RARITY_STYLES[rarity] ?? RARITY_STYLES["Common"];
        return (
          <button
            key={i}
            onClick={() => onSelect(i)}
            aria-label={`Go to ${rarity}`}
            className={cn(
              "rounded-full transition-all duration-200 border",
              i === current
                ? cn("w-5 h-2.5", s.border, s.badge)
                : "w-2.5 h-2.5 border-border bg-muted/50 hover:bg-muted",
            )}
          />
        );
      })}
    </div>
  );
}

// ─── Main Dialog ───────────────────────────────────────────────────────────────

interface WeaponDialogProps {
  weapon: Weapon | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WeaponDialog({
  weapon,
  open,
  onOpenChange,
}: WeaponDialogProps) {
  const [current, setCurrent] = useState(0);
  const [featuresMap, setFeaturesMap] = useState<Map<string, OptionalFeature>>(
    new Map(),
  );

  useEffect(() => {
    getOptionalFeaturesMap().then(setFeaturesMap);
  }, []);

  const total = weapon?.rarityRows.length ?? 0;

  function handlePrev() {
    setCurrent((c) => Math.max(0, c - 1));
  }
  function handleNext() {
    setCurrent((c) => Math.min(total - 1, c + 1));
  }

  // Reset slide when weapon changes
  const weaponKey = weapon?.name ?? "";
  useMemo(() => {
    setCurrent(0);
  }, [weaponKey, open]);

  // Build chains once per weapon
  const columnChains = useMemo(
    () => (weapon ? buildColumnChains(weapon.rarityRows) : []),
    [weapon],
  );

  const baseFeatures = useMemo(() => {
    if (!weapon || featuresMap.size === 0) return [];
    return resolveWeaponBaseFeatures(weapon, featuresMap);
  }, [weapon, featuresMap]);

  const baseFeatureNameKeys = useMemo(
    () => new Set(baseFeatures.map((f) => f.name.toLowerCase())),
    [baseFeatures],
  );

  if (!weapon) return null;

  const dmgLabel = DMG_TYPE_LABELS[weapon.dmgType] ?? weapon.dmgType;
  const damageDisplay = weapon.dmg2
    ? `${weapon.dmg1} / ${weapon.dmg2}`
    : weapon.dmg1;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        {/* Header */}
        <DialogHeader>
          <div className="flex items-center gap-3 pr-8">
            <div className="rounded-md border border-border/60 bg-card p-2 shrink-0">
              <Swords className="h-6 w-6 text-primary" />
            </div>
            <div className="min-w-0">
              <DialogTitle>{weapon.name}</DialogTitle>
              <DialogDescription className="mt-0.5">
                <span className="font-semibold text-foreground/80">
                  {damageDisplay}
                </span>{" "}
                <span>{dmgLabel}</span>
                {weapon.dmg2 && (
                  <span className="text-muted-foreground/70"> (versatile)</span>
                )}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <DialogBody>
          {(weapon.properties.length > 0 || weapon.isFocus) && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {weapon.properties.map((prop) => (
                <span
                  key={prop}
                  className="inline-flex items-center rounded border border-border/50 bg-muted/40 px-2 py-0.5 text-xs font-medium text-muted-foreground"
                >
                  {PROPERTY_LABELS[prop] ?? prop}
                </span>
              ))}
              {weapon.isFocus && (
                <span className="inline-flex items-center rounded border border-violet-700/50 bg-violet-950/40 px-2 py-0.5 text-xs font-medium text-violet-300">
                  Focus
                </span>
              )}
            </div>
          )}

          {/* Quick stats */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4 pb-4 border-b border-border">
            <span>
              <span className="text-foreground font-medium">
                {weapon.weight}
              </span>{" "}
              lb
            </span>
            <span>
              <span className="text-foreground font-medium">
                {formatWeaponValue(weapon.valueCp)}
              </span>
            </span>
            {weapon.range && (
              <span>
                Range:{" "}
                <span className="text-foreground font-medium">
                  {weapon.range}
                </span>
              </span>
            )}
            {weapon.includesShield && weapon.acBonus !== undefined && (
              <span className="flex items-center gap-1 text-teal-400">
                <Shield className="h-3.5 w-3.5" />
                <span className="font-semibold">
                  +{getWeaponShieldAcBonusAtIndex(weapon, current)} AC (integrated shield)
                </span>
              </span>
            )}
          </div>

          {/* Description */}
          {weapon.description && (
            <p className="text-sm text-muted-foreground italic mb-3 leading-relaxed">
              {weapon.description}
            </p>
          )}

          {weapon.includesShield && (
            <div className="flex items-start gap-2 rounded-md border border-teal-800/40 bg-teal-950/20 px-3 py-2.5 mb-4">
              <Shield className="h-4 w-4 text-teal-400 shrink-0 mt-0.5" />
              <div className="text-xs text-teal-100/90 leading-relaxed space-y-1">
                <p className="font-medium text-teal-200">
                  Includes an integrated shield (+{weapon.acBonus ?? 2} AC base).
                </p>
                <p>
                  The shield occupies your off-hand and cannot be swapped separately. Extra AC
                  from the rarity table applies while the shield is equipped.
                </p>
              </div>
            </div>
          )}

          {weapon.supplementaryNotes.length > 0 && (
            <div className="space-y-2 mb-5">
              {weapon.supplementaryNotes.map((note, i) => (
                <p key={i} className="text-sm text-muted-foreground leading-relaxed">
                  {note}
                </p>
              ))}
            </div>
          )}

          {/* Rarity progression */}
          {weapon.rarityRows.length > 0 && (
            <>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Rarity Progression
              </h4>
              <div className="relative px-10">
                {/* Prev button */}
                <button
                  onClick={handlePrev}
                  disabled={current === 0}
                  aria-label="Previous rarity"
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full border border-border bg-card/80 backdrop-blur-sm flex items-center justify-center transition-colors hover:bg-accent disabled:opacity-30 disabled:pointer-events-none z-10"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>

                {/* Active card */}
                <RaritySlide
                  key={current}
                  row={weapon.rarityRows[current]}
                  rarityIndex={current}
                  rarityRows={weapon.rarityRows}
                  columnChains={columnChains}
                  featuresMap={featuresMap}
                  baseFeatures={baseFeatures}
                  baseFeatureNameKeys={baseFeatureNameKeys}
                />

                {/* Next button */}
                <button
                  onClick={handleNext}
                  disabled={current === total - 1}
                  aria-label="Next rarity"
                  className="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full border border-border bg-card/80 backdrop-blur-sm flex items-center justify-center transition-colors hover:bg-accent disabled:opacity-30 disabled:pointer-events-none z-10"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
              <RarityDots
                count={weapon.rarityRows.length}
                current={current}
                onSelect={(i) => setCurrent(i)}
                rows={weapon.rarityRows}
              />
            </>
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
