import type { ProficiencySource, ProficiencySourceType } from "@/shared/types/proficiency.types";

/** Priority order: lower index = higher priority when filling choice slots. */
export const PROFICIENCY_SOURCE_PRIORITY: ProficiencySourceType[] = [
  "species",
  "background",
  "class",
  "subclass",
  "feat",
  "feature",
];

export function sourcePriority(type: ProficiencySourceType): number {
  const idx = PROFICIENCY_SOURCE_PRIORITY.indexOf(type);
  return idx === -1 ? PROFICIENCY_SOURCE_PRIORITY.length : idx;
}

/** Highest-priority source type among a list (for badge coloring). */
export function dominantSourceType(
  sources: ProficiencySource[],
): ProficiencySourceType {
  if (!sources.length) return "class";
  return sources.reduce((best, s) =>
    sourcePriority(s.type) < sourcePriority(best) ? s.type : best,
  sources[0].type);
}

const BADGE_STYLES: Record<ProficiencySourceType, string> = {
  species:
    "border-emerald-500/70 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  background:
    "border-sky-500/70 bg-sky-500/15 text-sky-700 dark:text-sky-400",
  class:
    "border-violet-500/70 bg-violet-500/15 text-violet-700 dark:text-violet-400",
  subclass:
    "border-violet-500/70 bg-violet-500/15 text-violet-700 dark:text-violet-400",
  feat:
    "border-rose-500/70 bg-rose-500/15 text-rose-700 dark:text-rose-400",
  feature:
    "border-amber-500/70 bg-amber-500/15 text-amber-700 dark:text-amber-400",
};

export function badgeStyleForSource(type: ProficiencySourceType): string {
  return BADGE_STYLES[type] ?? BADGE_STYLES.class;
}

export const SOURCE_LABELS: Record<ProficiencySourceType, string> = {
  species: "Species",
  background: "Background",
  class: "Class",
  subclass: "Subclass",
  feat: "Feat",
  feature: "Feature",
};

/** Text color for the proficiency dot (●) in stat rows. */
export const DOT_STYLES: Record<ProficiencySourceType, string> = {
  species: "text-emerald-600 dark:text-emerald-400",
  background: "text-sky-600 dark:text-sky-400",
  class: "text-violet-600 dark:text-violet-400",
  subclass: "text-violet-600 dark:text-violet-400",
  feat: "text-rose-600 dark:text-rose-400",
  feature: "text-amber-600 dark:text-amber-400",
};

export function dotStyleForSource(type: ProficiencySourceType): string {
  return DOT_STYLES[type] ?? DOT_STYLES.class;
}

export function formatProficiencyTooltip(sources: ProficiencySource[]): string {
  if (!sources.length) return "Proficient";
  const parts = sources.map(
    (s) => `${SOURCE_LABELS[s.type]}: ${s.name}`,
  );
  return `Proficient — ${parts.join(", ")}`;
}
