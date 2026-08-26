import { Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { BookSourceNameMap } from "@/features/dnd/spells/services/book-source.service";
import { SourceVariantSwitcher } from "@/features/raintdm/builder/components/shared/SourceVariantSwitcher";
import type { SourceVariant } from "@/features/raintdm/builder/utils/library-variant.utils";
import {
  FeatParagraphList,
  FeatSectionBlock,
} from "@/features/dnd/feats/components/DndFeatContent";
import type { DndFeat, Feat } from "@/shared/types";
import { DND_FEAT_CATEGORY_LABELS } from "@/shared/types";
import { SKILL_LABELS } from "@/shared/constants/dnd";
import {
  LibraryProficiencySummary,
  ProficiencyGrantBadge,
  ProficiencyHighlightFrame,
} from "./shared/LibraryProficiencyHighlight";
import {
  buildSkillGrantSummaryRows,
  textMentionsProficiencyGrant,
} from "@/features/raintdm/builder/utils/library-proficiency-highlight.utils";

interface FeatLibraryDetailProps {
  feat: Feat | DndFeat;
  sourceVariants?: SourceVariant[];
  activeSourceId?: string;
  onSourceSelect?: (id: string) => void;
  bookNames?: BookSourceNameMap;
}

export function FeatLibraryDetail({
  feat,
  sourceVariants,
  activeSourceId,
  onSourceSelect,
  bookNames = {},
}: FeatLibraryDetailProps) {
  const categoryLabel =
    "category" in feat && feat.category
      ? (DND_FEAT_CATEGORY_LABELS[feat.category] ?? feat.category)
      : undefined;

  const proficiencyRows = buildSkillGrantSummaryRows(feat.skillGrants);
  const expertiseRows =
    feat.expertiseGrants?.length
      ? [
          {
            label: "Expertise",
            value: feat.expertiseGrants
              .map((grant) => {
                if (grant.kind === "fixed") {
                  return grant.skills
                    .map((s) => SKILL_LABELS[s] ?? s)
                    .join(", ");
                }
                return `Choose ${grant.count} proficient skill${grant.count > 1 ? "s" : ""}`;
              })
              .join("; "),
          },
        ]
      : [];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Award className="h-4 w-4 text-rose-400" />
        <h3 className="text-sm font-semibold text-foreground">{feat.name}</h3>
        {categoryLabel && (
          <Badge variant="secondary" className="text-[10px]">
            {categoryLabel}
          </Badge>
        )}
        <span className="text-[10px] text-muted-foreground">
          {feat.source}
          {feat.page !== undefined ? ` p.${feat.page}` : ""}
        </span>
      </div>

      {sourceVariants && onSourceSelect && (
        <SourceVariantSwitcher
          variants={sourceVariants}
          activeId={activeSourceId}
          onSelect={onSourceSelect}
          bookNames={bookNames}
          accent="rose"
        />
      )}

      {feat.summary && (
        <p className="text-xs italic leading-relaxed text-muted-foreground">
          {feat.summary}
        </p>
      )}

      {feat.prerequisites.length > 0 && (
        <p className="text-[11px] text-muted-foreground">
          <span className="font-semibold text-foreground/80">
            Prerequisites:
          </span>{" "}
          {feat.prerequisites.join("; ")}
        </p>
      )}

      <LibraryProficiencySummary
        rows={[...proficiencyRows, ...expertiseRows]}
      />

      <Separator />

      <div className="space-y-2">
        {feat.paragraphs.map((line, i) => {
          const grantsProficiency = textMentionsProficiencyGrant(line);
          return (
            <ProficiencyHighlightFrame key={i} active={grantsProficiency}>
              <div>
                {grantsProficiency && (
                  <div className="mb-1">
                    <ProficiencyGrantBadge />
                  </div>
                )}
                <FeatParagraphList lines={[line]} />
              </div>
            </ProficiencyHighlightFrame>
          );
        })}
      </div>

      {feat.sections.map((section, i) => {
        const grantsProficiency = section.paragraphs.some((p) =>
          textMentionsProficiencyGrant(p),
        );
        return (
          <ProficiencyHighlightFrame
            key={section.name ?? i}
            active={grantsProficiency}
          >
            <div>
              {grantsProficiency && section.name && (
                <div className="mb-1 flex items-center gap-1.5">
                  <ProficiencyGrantBadge />
                </div>
              )}
              <FeatSectionBlock section={section} />
            </div>
          </ProficiencyHighlightFrame>
        );
      })}
    </div>
  );
}
