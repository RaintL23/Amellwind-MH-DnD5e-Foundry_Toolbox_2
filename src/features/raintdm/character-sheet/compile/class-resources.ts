/**
 * Class-table columns that are spendable pools (Rage, Ki, …), plus features
 * with limited uses (Action Surge, Bardic Inspiration, …).
 *
 * Progression stats (Cantrips, Prepared Spells, Bardic Die, Sneak Attack, …)
 * are never treated as Resources.
 */
import type { FeatureRecoveryPeriod } from "@/features/raintdm/builder/foundry-export/feature-usage.utils";
import type { Class } from "@/shared/types";
import type { PlayFeature, PlayResource } from "../utils/play-character.types";

/** Only these class-table labels become Resources (2014 + 2024 names). */
const SPENDABLE_LABELS = new Set([
  "rage",
  "rages",
  "ki points",
  "focus points",
  "sorcery points",
  "channel divinity",
  "bardic inspiration",
  "wild shape",
  "second wind",
  "favored enemy",
]);

const RECOVERY_BY_LABEL: Record<string, FeatureRecoveryPeriod> = {
  rage: "lr",
  rages: "lr",
  "ki points": "sr",
  "focus points": "sr",
  "sorcery points": "lr",
  "channel divinity": "sr",
  "bardic inspiration": "lr", // 2024 Bard recovers on SR at higher levels — default LR
  "wild shape": "sr",
  "second wind": "sr",
  "favored enemy": "lr",
};

function cellToNumber(val: string): number {
  if (!val || val === "—" || val === "-") return 0;
  // Die / bonus cells ("1d6", "+2") are progression stats, not use counts.
  if (/^\d*d\d/i.test(val) || /^[+-]\d/.test(val)) return 0;
  const n = parseInt(val, 10);
  return Number.isNaN(n) ? 0 : n;
}

function slug(label: string): string {
  return label.trim().toLowerCase().replace(/\s+/g, "-");
}

function normalizeLabel(label: string): string {
  return label.trim().toLowerCase();
}

export function extractClassResources(
  classData: Class | null | undefined,
  level: number,
): PlayResource[] {
  if (!classData?.spellProgression?.length) return [];
  const rowIndex = Math.max(0, level - 1);
  const resources: PlayResource[] = [];
  const seen = new Set<string>();

  for (const group of classData.spellProgression) {
    const labels = group.colLabels ?? [];
    const row = group.rows[rowIndex];
    if (!row) continue;
    labels.forEach((label, i) => {
      const key = normalizeLabel(label);
      if (!SPENDABLE_LABELS.has(key)) return;
      const max = cellToNumber(String(row[i] ?? ""));
      if (max <= 0) return;
      const id = `resource-${slug(label)}`;
      if (seen.has(id)) return;
      seen.add(id);
      const recovery = RECOVERY_BY_LABEL[key] ?? "lr";
      resources.push({ id, label, max, recovery });
    });
  }
  return resources;
}

/**
 * Class pool columns + features that declare limited uses.
 * When a feature matches a class-table label (e.g. Second Wind), keep the
 * feature so spend/recovery stay on `featureUsesSpent`.
 */
export function buildPlayResources(
  classData: Class | null | undefined,
  level: number,
  features: PlayFeature[],
): PlayResource[] {
  const fromFeatures: PlayResource[] = [];
  const featureLabels = new Set<string>();

  for (const f of features) {
    if (!f.uses || f.uses.max <= 0) continue;
    // Standard PHB actions are always available; not tracked as Resources.
    if (f.sourceKind === "standard") continue;
    const key = normalizeLabel(f.name);
    featureLabels.add(key);
    fromFeatures.push({
      id: f.id,
      label: f.name,
      max: f.uses.max,
      recovery: f.uses.recovery,
      featureId: f.id,
    });
  }

  const fromClass = extractClassResources(classData, level).filter(
    (r) => !featureLabels.has(normalizeLabel(r.label)),
  );

  return [...fromClass, ...fromFeatures];
}
