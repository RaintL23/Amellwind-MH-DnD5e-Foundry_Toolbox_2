import {
  type DndKeywordCategory,
  DND_KEYWORD_CLASS,
  splitDndKeywords,
} from "./dnd-keywords.utils";
import {
  type ToolboxEntityKind,
  buildToolboxFilterHref,
  extractNextFiveToolsTag,
  resolveToolboxEntityRef,
} from "./toolbox-entity-links";

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
  | { kind: "keyword"; content: string; category: DndKeywordCategory }
  | { kind: "phraseLink"; content: string; phraseId: string; href?: string }
  | {
      kind: "entityLink";
      content: string;
      href: string;
      refKind: ToolboxEntityKind;
    };

/** Phrase that should render as a clickable link inside rich text. */
export interface RichTextPhraseLink {
  /** Stable id passed to onPhraseClick (e.g. progression id). */
  id: string;
  /** Case-insensitive phrase to match in plain text. */
  phrase: string;
  /** When set, the phrase renders as an in-app `<Link>` instead of a button. */
  href?: string;
}

export interface ParseRichTextOptions {
  /** Apply D&D keyword highlighting to plain-text segments. Default: true. */
  highlightKeywords?: boolean;
  /** Optional phrases to turn into clickable links (matched before keywords). */
  phraseLinks?: RichTextPhraseLink[];
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

const ENTITY_LINK_KIND_CLASS: Record<ToolboxEntityKind, string> = {
  spell: RICH_TEXT_MARKUP_CLASS.spell,
  condition: RICH_TEXT_MARKUP_CLASS.condition,
  disease: "text-purple-400 font-medium",
  item: "text-amber-300 font-medium",
  weapon: "text-orange-400 font-medium",
  class: "text-sky-300 font-medium",
  race: "text-emerald-300 font-medium",
  species: "text-emerald-300 font-medium",
  creature: "text-rose-300 font-medium",
  feat: "text-violet-300 font-medium",
  background: "text-teal-300 font-medium",
};

export { DND_KEYWORD_CLASS };

// ─── Markdown bold tokenizer ────────────────────────────────────────────────
// renderFiveToolsEntries emits `**name**` after stripping {@b}/{@bold} tags.

const MD_BOLD_RE = /\*\*(.+?)\*\*/g;

function tokenizeMarkdownBold(text: string): RichTextSegment[] {
  const segments: RichTextSegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  MD_BOLD_RE.lastIndex = 0;
  while ((match = MD_BOLD_RE.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ kind: "text", content: text.slice(lastIndex, match.index) });
    }
    segments.push({ kind: "bold", content: match[1] ?? "" });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    segments.push({ kind: "text", content: text.slice(lastIndex) });
  }

  return segments.length > 0 ? segments : [{ kind: "text", content: text }];
}

// ─── 5etools markup tokenizer ───────────────────────────────────────────────

function withItalicKind(segment: RichTextSegment): RichTextSegment {
  if (segment.kind === "text") return { kind: "italic", content: segment.content };
  return segment;
}

function withBoldKind(segment: RichTextSegment): RichTextSegment {
  if (segment.kind === "text") return { kind: "bold", content: segment.content };
  return segment;
}

function segmentsFromFiveToolsTag(tag: string, body: string): RichTextSegment[] {
  const lower = tag.toLowerCase();
  const content = body.trim();

  if (lower === "i" || lower === "italic") {
    return tokenizeFiveToolsMarkup(body).map(withItalicKind);
  }
  if (lower === "b" || lower === "bold") {
    return tokenizeFiveToolsMarkup(body).map(withBoldKind);
  }

  const entity = resolveToolboxEntityRef(lower, body);
  if (entity) {
    return [
      {
        kind: "entityLink",
        content: entity.label,
        href: entity.href,
        refKind: entity.kind,
      },
    ];
  }

  switch (lower) {
    case "condition":
      return [{ kind: "condition", content }];
    case "spell":
      return [{ kind: "spell", content }];
    case "damage":
      return [{ kind: "damage", content }];
    case "dice":
      return [{ kind: "text", content }];
    case "skill":
      return [{ kind: "skill", content }];
    case "dc":
      return [{ kind: "dc", content: `DC ${content}` }];
    case "hit":
      return [{ kind: "hit", content: `+${content} to hit` }];
    case "h":
      return [{ kind: "text", content: "Hit: " }];
    case "atk":
      return [
        {
          kind: "text",
          content: `${content.replace("mw,rw", "mw or rw").toUpperCase()} Attack: `,
        },
      ];
    case "action":
      return [{ kind: "action", content }];
    case "recharge":
      return [{ kind: "text", content: `(Recharge ${content}–6)` }];
    case "chance":
      return [];
    case "filter": {
      const parts = body.split("|");
      const display = (parts[0] ?? "").trim();
      const page = (parts[1] ?? "items").trim();
      const spec = (parts[2] ?? "").trim();
      const href = buildToolboxFilterHref(display, page, spec);
      if (href && display) {
        return [
          {
            kind: "entityLink",
            content: display,
            href,
            refKind: "item",
          },
        ];
      }
      return display ? [{ kind: "text", content: display }] : [];
    }
    default:
      return content ? [{ kind: "text", content }] : [];
  }
}

function tokenizeFiveToolsMarkup(text: string): RichTextSegment[] {
  const segments: RichTextSegment[] = [];
  let cursor = 0;

  while (cursor < text.length) {
    const extracted = extractNextFiveToolsTag(text, cursor);
    if (!extracted) {
      segments.push({ kind: "text", content: text.slice(cursor) });
      break;
    }
    if (extracted.start > cursor) {
      segments.push({ kind: "text", content: text.slice(cursor, extracted.start) });
    }
    segments.push(...segmentsFromFiveToolsTag(extracted.tag, extracted.body));
    cursor = extracted.end;
  }

  return segments;
}

// ─── Public API ───────────────────────────────────────────────────────────────

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Split plain text into text / phraseLink segments (longest phrase wins). */
export function splitPhraseLinks(
  text: string,
  phraseLinks: RichTextPhraseLink[],
): RichTextSegment[] {
  const usable = phraseLinks
    .map((link) => ({
      id: link.id,
      phrase: link.phrase.trim(),
      href: link.href,
    }))
    .filter((link) => link.phrase.length > 0);

  if (usable.length === 0 || !text) {
    return text ? [{ kind: "text", content: text }] : [];
  }

  const byLower = new Map<string, { id: string; href?: string }>();
  for (const link of usable) {
    const key = link.phrase.toLowerCase();
    if (!byLower.has(key)) byLower.set(key, { id: link.id, href: link.href });
  }

  const uniquePhrases = [...byLower.keys()].sort((a, b) => b.length - a.length);
  const pattern = uniquePhrases.map(escapeRegExp).join("|");
  const re = new RegExp(`(${pattern})`, "gi");

  const segments: RichTextSegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  re.lastIndex = 0;
  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ kind: "text", content: text.slice(lastIndex, match.index) });
    }
    const matched = match[1] ?? "";
    const meta = byLower.get(matched.toLowerCase());
    if (meta) {
      segments.push({
        kind: "phraseLink",
        content: matched,
        phraseId: meta.id,
        href: meta.href,
      });
    } else {
      segments.push({ kind: "text", content: matched });
    }
    lastIndex = match.index + matched.length;
  }

  if (lastIndex < text.length) {
    segments.push({ kind: "text", content: text.slice(lastIndex) });
  }

  return segments.length > 0 ? segments : [{ kind: "text", content: text }];
}

/**
 * Parses text that may contain 5etools markup ({@spell …}, {@i …}, etc.),
 * markdown `**bold**`, optional phrase links, and optionally highlights
 * common D&D terms in plain-text segments.
 */
export function parseRichText(
  text: string,
  options: ParseRichTextOptions = {},
): RichTextSegment[] {
  const { highlightKeywords = true, phraseLinks } = options;

  // 5etools tags first (paths that preserve {@…}), then markdown bold on
  // remaining plain text (renderFiveToolsEntries emits `**…**`).
  const markupSegments: RichTextSegment[] = [];
  for (const seg of tokenizeFiveToolsMarkup(text)) {
    if (seg.kind === "text") {
      markupSegments.push(...tokenizeMarkdownBold(seg.content));
    } else {
      markupSegments.push(seg);
    }
  }

  const withLinks: RichTextSegment[] = [];
  for (const seg of markupSegments) {
    if (seg.kind === "text" && phraseLinks?.length) {
      withLinks.push(...splitPhraseLinks(seg.content, phraseLinks));
    } else {
      withLinks.push(seg);
    }
  }

  if (!highlightKeywords) return withLinks;

  const result: RichTextSegment[] = [];
  for (const seg of withLinks) {
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
  if (segment.kind === "phraseLink") {
    return "text-sky-400 font-medium underline-offset-2 hover:underline cursor-pointer";
  }
  if (segment.kind === "entityLink") {
    return `${ENTITY_LINK_KIND_CLASS[segment.refKind]} underline-offset-2 hover:underline`;
  }
  if (segment.kind === "text") return null;
  return RICH_TEXT_MARKUP_CLASS[segment.kind];
}
