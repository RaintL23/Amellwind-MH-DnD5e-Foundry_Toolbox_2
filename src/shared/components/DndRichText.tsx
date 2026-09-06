import { useMemo } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/shared/utils/cn";
import { useConditionDiseasePreview } from "@/shared/context/ConditionDiseasePreviewContext";
import { useConditionPhraseLinksForText } from "@/shared/hooks/useConditionPhraseLinks";
import { useSpellPhraseLinksForText } from "@/shared/hooks/useSpellPhraseLinks";
import {
  type ParseRichTextOptions,
  type RichTextPhraseLink,
  parseRichText,
  getRichTextSegmentClass,
} from "@/shared/utils/dnd-rich-text.utils";

interface DndRichTextProps extends ParseRichTextOptions {
  text: string;
  className?: string;
  /** Fired when a phraseLink segment is activated. */
  onPhraseClick?: (phraseId: string) => void;
  /**
   * When true (default), auto-link catalog spell names in plain prose
   * (e.g. "haste spell" → /spells?spell=Haste). Tagged `{@spell}` still wins.
   */
  autoLinkSpells?: boolean;
  /**
   * When true (default), auto-link catalog condition/disease names in plain
   * prose and open an in-place detail dialog (no route change). Tagged
   * `{@condition}` / `{@disease}` still win and also open the dialog.
   */
  autoLinkConditions?: boolean;
}

function catalogNameFromConditionsHref(href: string): {
  kind: "condition" | "disease";
  name: string;
} | null {
  const queryIndex = href.indexOf("?");
  if (queryIndex < 0) return null;
  const params = new URLSearchParams(href.slice(queryIndex + 1));
  const condition = params.get("condition");
  if (condition) return { kind: "condition", name: condition };
  const disease = params.get("disease");
  if (disease) return { kind: "disease", name: disease };
  return null;
}

function parseConditionPhraseId(
  phraseId: string,
): { kind: "condition" | "disease"; name: string } | null {
  if (phraseId.startsWith("condition:")) {
    return { kind: "condition", name: phraseId.slice("condition:".length) };
  }
  if (phraseId.startsWith("disease:")) {
    return { kind: "disease", name: phraseId.slice("disease:".length) };
  }
  return null;
}

/**
 * Renders D&D text with 5etools markup formatting and optional keyword highlighting.
 * Central replacement for ad-hoc parsers — use this anywhere game text is shown in the UI.
 */
export function DndRichText({
  text,
  className,
  highlightKeywords = true,
  phraseLinks,
  onPhraseClick,
  autoLinkSpells = true,
  autoLinkConditions = true,
}: DndRichTextProps) {
  const preview = useConditionDiseasePreview();
  const spellLinks = useSpellPhraseLinksForText(autoLinkSpells ? text : "");
  const conditionLinks = useConditionPhraseLinksForText(
    autoLinkConditions ? text : "",
  );
  const mergedPhraseLinks = useMemo(() => {
    const auto: RichTextPhraseLink[] = [];
    if (autoLinkSpells && spellLinks.length) auto.push(...spellLinks);
    if (autoLinkConditions && conditionLinks.length) {
      auto.push(...conditionLinks);
    }
    if (auto.length === 0) return phraseLinks;
    if (!phraseLinks?.length) return auto;
    return [...auto, ...phraseLinks];
  }, [
    autoLinkSpells,
    autoLinkConditions,
    spellLinks,
    conditionLinks,
    phraseLinks,
  ]);

  const segments = useMemo(
    () =>
      parseRichText(text, {
        highlightKeywords,
        phraseLinks: mergedPhraseLinks,
      }),
    [text, highlightKeywords, mergedPhraseLinks],
  );

  return (
    <span className={className}>
      {segments.map((seg, i) => {
        const styleClass = getRichTextSegmentClass(seg);

        if (seg.kind === "italic") {
          return (
            <em key={i} className={cn(styleClass)}>
              {seg.content}
            </em>
          );
        }
        if (seg.kind === "bold") {
          return (
            <strong key={i} className={cn(styleClass)}>
              {seg.content}
            </strong>
          );
        }
        if (seg.kind === "entityLink") {
          const previewRef =
            seg.refKind === "condition" || seg.refKind === "disease"
              ? catalogNameFromConditionsHref(seg.href)
              : null;
          if (previewRef && preview) {
            return (
              <button
                key={i}
                type="button"
                className={cn(
                  "inline p-0 m-0 border-0 bg-transparent align-baseline text-inherit cursor-pointer",
                  styleClass,
                )}
                onClick={(event) => {
                  event.stopPropagation();
                  if (previewRef.kind === "disease") {
                    preview.openDisease(previewRef.name);
                  } else {
                    preview.openCondition(previewRef.name);
                  }
                }}
              >
                {seg.content}
              </button>
            );
          }
          return (
            <Link
              key={i}
              to={seg.href}
              onClick={(event) => event.stopPropagation()}
              className={cn(styleClass)}
            >
              {seg.content}
            </Link>
          );
        }
        if (seg.kind === "phraseLink") {
          const previewRef = parseConditionPhraseId(seg.phraseId);
          if (previewRef && preview) {
            return (
              <button
                key={i}
                type="button"
                className={cn(
                  "inline p-0 m-0 border-0 bg-transparent align-baseline text-inherit",
                  styleClass,
                )}
                onClick={(event) => {
                  event.stopPropagation();
                  if (previewRef.kind === "disease") {
                    preview.openDisease(previewRef.name);
                  } else {
                    preview.openCondition(previewRef.name);
                  }
                }}
              >
                {seg.content}
              </button>
            );
          }
          if (seg.href) {
            return (
              <Link
                key={i}
                to={seg.href}
                onClick={(event) => event.stopPropagation()}
                className={cn(styleClass)}
              >
                {seg.content}
              </Link>
            );
          }
          return (
            <button
              key={i}
              type="button"
              className={cn(
                "inline p-0 m-0 border-0 bg-transparent align-baseline text-inherit",
                styleClass,
              )}
              onClick={() => onPhraseClick?.(seg.phraseId)}
            >
              {seg.content}
            </button>
          );
        }
        if (styleClass) {
          return (
            <span key={i} className={cn(styleClass)}>
              {seg.content}
            </span>
          );
        }
        return <span key={i}>{seg.content}</span>;
      })}
    </span>
  );
}

export type { RichTextPhraseLink };
