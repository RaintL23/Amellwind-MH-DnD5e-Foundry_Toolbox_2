import {
  type DndKeywordCategory,
  DND_KEYWORD_CLASS,
  splitDndKeywords,
} from "./dnd-keywords.utils";

// ─── Segment types ────────────────────────────────────────────────────────────

export type RichTextMarkupKind =
  | "text"
  | "italic"
  | "bold"
  | "condition"
  | "spell"
  | "damage"
  | "skill"
  | "dc"
  | "hit"
  | "action";

export type RichTextSegment =
  | { kind: RichTextMarkupKind; content: string }
  | { kind: "keyword"; content: string; category: DndKeywordCategory };

export interface ParseRichTextOptions {
  /** Apply D&D keyword highlighting to plain-text segments. Default: true. */
  highlightKeywords?: boolean;
}

// ─── Markup styling (5etools {@tag …} segments) ──────────────────────────────

export const RICH_TEXT_MARKUP_CLASS: Record<Exclude<RichTextMarkupKind, "text">, string> = {
  italic: "italic",
  bold: "font-semibold text-foreground/90",
  condition: "text-amber-400 font-medium",
  spell: "text-sky-400 italic",
  damage: "font-mono text-orange-400",
  skill: "text-emerald-400",
  dc: "font-semibold text-foreground/80",
  hit: "font-semibold text-foreground/80",
  action: "font-semibold text-yellow-300/90",
};

export { DND_KEYWORD_CLASS };

// ─── 5etools markup tokenizer ───────────────────────────────────────────────

const TAG_RE = /\{@(\w+)\s+([^}|]+)(?:\|[^}]*)?\}|\{@(\w+)\}/g;

function tokenizeFiveToolsMarkup(text: string): RichTextSegment[] {
  const segments: RichTextSegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  TAG_RE.lastIndex = 0;
  while ((match = TAG_RE.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ kind: "text", content: text.slice(lastIndex, match.index) });
    }

    const tag = (match[1] ?? match[3] ?? "").toLowerCase();
    const content = (match[2] ?? "").trim();

    switch (tag) {
      case "i":
      case "italic":
        segments.push({ kind: "italic", content });
        break;
      case "b":
      case "bold":
        segments.push({ kind: "bold", content });
        break;
      case "condition":
        segments.push({ kind: "condition", content });
        break;
      case "spell":
        segments.push({ kind: "spell", content });
        break;
      case "damage":
        segments.push({ kind: "damage", content });
        break;
      case "skill":
        segments.push({ kind: "skill", content });
        break;
      case "dc":
        segments.push({ kind: "dc", content: `DC ${content}` });
        break;
      case "hit":
        segments.push({ kind: "hit", content: `+${content} to hit` });
        break;
      case "h":
        segments.push({ kind: "text", content: "Hit: " });
        break;
      case "atk":
        segments.push({
          kind: "text",
          content: `${content.replace("mw,rw", "mw or rw").toUpperCase()} Attack: `,
        });
        break;
      case "action":
        segments.push({ kind: "action", content });
        break;
      case "recharge":
        segments.push({ kind: "text", content: `(Recharge ${content}–6)` });
        break;
      case "chance":
        break;
      default:
        if (content) segments.push({ kind: "text", content });
        break;
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    segments.push({ kind: "text", content: text.slice(lastIndex) });
  }

  return segments;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Parses text that may contain 5etools markup ({@spell …}, {@i …}, etc.) and
 * optionally highlights common D&D terms in plain-text segments.
 */
export function parseRichText(
  text: string,
  options: ParseRichTextOptions = {},
): RichTextSegment[] {
  const { highlightKeywords = true } = options;
  const markupSegments = tokenizeFiveToolsMarkup(text);

  if (!highlightKeywords) return markupSegments;

  const result: RichTextSegment[] = [];
  for (const seg of markupSegments) {
    if (seg.kind !== "text") {
      result.push(seg);
      continue;
    }
    for (const part of splitDndKeywords(seg.content)) {
      if (part.category) {
        result.push({ kind: "keyword", content: part.text, category: part.category });
      } else if (part.text) {
        result.push({ kind: "text", content: part.text });
      }
    }
  }
  return result;
}

export function getRichTextSegmentClass(segment: RichTextSegment): string | null {
  if (segment.kind === "keyword") return DND_KEYWORD_CLASS[segment.category];
  if (segment.kind === "text") return null;
  return RICH_TEXT_MARKUP_CLASS[segment.kind];
}
