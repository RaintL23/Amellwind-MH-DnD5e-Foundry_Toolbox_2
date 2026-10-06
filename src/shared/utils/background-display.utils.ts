/**
 * Display-level view of a background (D&D or Amellwind). Shared by the
 * compendium dialogs and the Builder library so both show identical data.
 */
import {
  BACKGROUND_FACTION_LABELS,
  DND_BACKGROUND_EDITION_LABELS,
  type Background,
  type BackgroundFaction,
  type DndBackgroundEdition,
  type DndBackgroundFeatRef,
  type StartingEquipmentOffers,
} from "@/shared/types";
import {
  buildNamedGrantSummaryRows,
  buildSkillGrantSummaryRows,
  type LibraryProficiencySummaryRow,
} from "@/shared/utils/library-proficiency-highlight.utils";

/** Fields shared by `Background` and `DndBackground` that background views render. */
export type BackgroundContentData = Pick<
  Background,
  | "id"
  | "name"
  | "fluff"
  | "proficiencies"
  | "features"
  | "suggestedCharacteristics"
  | "skillGrants"
  | "toolGrants"
  | "languageGrants"
  | "originFeatGrant"
> & {
  /** D&D 2024 ability score increase summary. */
  abilitySummary?: string;
  /** D&D origin feat summary (falls back to `originFeatGrant.summary`). */
  featSummary?: string;
  /** D&D origin feat references, resolved to full feat content. */
  featRefs?: DndBackgroundFeatRef[];
};

/** Background + header metadata (Amellwind faction or D&D edition flags). */
export type BackgroundDetailData = BackgroundContentData & {
  source: string;
  page?: number;
  faction?: BackgroundFaction;
  edition?: DndBackgroundEdition;
  srd?: boolean;
  basicRules?: boolean;
  startingEquipmentOffers?: StartingEquipmentOffers;
};

/** Header badges: faction (Amellwind) or edition / SRD / Basic Rules (D&D). */
export function getBackgroundMetaLabels(background: BackgroundDetailData): string[] {
  const labels: string[] = [];
  if (background.faction) labels.push(BACKGROUND_FACTION_LABELS[background.faction]);
  if (background.edition) labels.push(DND_BACKGROUND_EDITION_LABELS[background.edition]);
  if (background.srd) labels.push("SRD");
  if (background.basicRules) labels.push("Basic Rules");
  return labels;
}

export interface BackgroundProficiencyField {
  label: string;
  value: string;
  wide: boolean;
}

export interface BackgroundDisplayData {
  abilitySummary: string | null;
  originFeatSummary: string | null;
  /** Text proficiency fields; "—" placeholders are omitted. */
  proficiencyFields: BackgroundProficiencyField[];
  proficiencyRows: LibraryProficiencySummaryRow[];
}

function meaningful(value: string | undefined | null): string | null {
  const trimmed = value?.trim();
  return trimmed && trimmed !== "—" ? trimmed : null;
}

export function resolveBackgroundDisplay(
  background: BackgroundContentData,
): BackgroundDisplayData {
  const { skills, tools, languages, equipment } = background.proficiencies;
  const fields: Array<[string, string | null, boolean]> = [
    ["Skills", meaningful(skills), true],
    ["Tools", meaningful(tools), false],
    ["Languages", meaningful(languages), false],
    ["Equipment", meaningful(equipment), true],
  ];

  return {
    abilitySummary: meaningful(background.abilitySummary),
    originFeatSummary:
      meaningful(background.featSummary) ??
      meaningful(background.originFeatGrant?.summary),
    proficiencyFields: fields
      .filter((field): field is [string, string, boolean] => field[1] !== null)
      .map(([label, value, wide]) => ({ label, value, wide })),
    proficiencyRows: [
      ...buildSkillGrantSummaryRows(background.skillGrants),
      ...buildNamedGrantSummaryRows("Tools", background.toolGrants),
      ...buildNamedGrantSummaryRows("Languages", background.languageGrants),
    ],
  };
}
