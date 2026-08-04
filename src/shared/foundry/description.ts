/**
 * Converts 5etools / Amellwind description text into Foundry-ready HTML with
 * Plutonium-style content links (`@item[Name|SRC]`), core roll enrichers
 * (`[[/r 2d4 + 2]]`), and optional 5e.tools deep links.
 *
 * Do NOT use `parseFiveToolsMarkup` here — that strips tags for the app UI.
 */

const ALREADY_CONTENT_LINK = /@[a-zA-Z]+\[/;
const ALREADY_ROLL = /\[\[\/[^\]]+\]\]/;

/** Escapes HTML in plain text segments (not enricher tokens). */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapParagraphs(html: string): string {
  const trimmed = html.trim();
  if (!trimmed) return "";
  if (/^</.test(trimmed)) return trimmed;
  return trimmed
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => `<p>${block.replace(/\n/g, "<br/>")}</p>`)
    .join("");
}

/** Builds a 5e.tools items hash URL for a simple name lookup when stable. */
export function buildFiveToolsItemUrl(itemName: string): string {
  const hash = encodeURIComponent(itemName.trim().toLowerCase());
  return `https://5e.tools/items.html#${hash}`;
}

/**
 * Parses `{@filter Label|page|key=value;…}` into a 5e.tools URL when possible.
 * Falls back to null so the caller can keep a content-link style label.
 */
export function buildFiveToolsFilterUrl(
  display: string,
  page: string,
  filterSpec: string,
): string | null {
  const pageSlug = page.trim().toLowerCase() || "items";
  const types: string[] = [];
  for (const part of filterSpec.split(";")) {
    const [key, rawVal] = part.split("=").map((s) => s.trim());
    if (!key || !rawVal) continue;
    if (key === "type" || key === "types") {
      types.push(rawVal.toLowerCase());
    }
  }
  if (types.length >= 2 && pageSlug === "items") {
    const [a, b] = types;
    const flst = `flsttype:${encodeURIComponent(a)}=1~${encodeURIComponent(b)}=1`;
    return `https://5e.tools/items.html#blankhash,${flst}`;
  }
  if (types.length === 1 && pageSlug === "items") {
    const flst = `flsttype:${encodeURIComponent(types[0])}=1`;
    return `https://5e.tools/items.html#blankhash,${flst}`;
  }
  if (display.trim()) {
    return `https://5e.tools/${pageSlug}.html#${encodeURIComponent(display.trim().toLowerCase())}`;
  }
  return null;
}

function convertFiveToolsTag(tag: string, body: string): string {
  const lower = tag.toLowerCase();

  if (lower === "b" || lower === "bold") {
    return `<strong>${escapeHtml(body)}</strong>`;
  }
  if (lower === "i" || lower === "italic") {
    return `<em>${escapeHtml(body)}</em>`;
  }
  if (lower === "u" || lower === "underline") {
    return `<u>${escapeHtml(body)}</u>`;
  }
  if (lower === "s" || lower === "strike") {
    return `<s>${escapeHtml(body)}</s>`;
  }
  if (lower === "h") {
    return `<strong>Hit:</strong>`;
  }
  if (lower === "atk") {
    const map: Record<string, string> = {
      mw: "Melee Weapon Attack:",
      rw: "Ranged Weapon Attack:",
      "mw,rw": "Melee or Ranged Weapon Attack:",
      ms: "Melee Spell Attack:",
      rs: "Ranged Spell Attack:",
    };
    return `<em>${map[body.trim()] ?? `${body} Attack:`}</em>`;
  }
  if (lower === "dc") {
    return `DC ${escapeHtml(body.trim())}`;
  }
  if (lower === "recharge") {
    return `(Recharge ${escapeHtml(body.trim())}–6)`;
  }
  if (lower === "hit") {
    const n = body.trim();
    return n.startsWith("+") || n.startsWith("-") ? n : `+${n}`;
  }
  if (lower === "damage" || lower === "dice" || lower === "scaledice" || lower === "scaledamage") {
    const parts = body.split("|");
    const formula = (parts[0] ?? "").trim();
    const display = (parts[1] ?? "").trim();
    const label = (parts[2] ?? "").trim();
    if (!formula) return escapeHtml(body);
    const roll = `[[/r ${formula}]]`;
    if (label) return `${escapeHtml(label)}: ${roll}`;
    if (display && display !== formula) return `${roll} (${escapeHtml(display)})`;
    return roll;
  }
  if (lower === "filter") {
    const parts = body.split("|");
    const display = (parts[0] ?? "").trim();
    const page = (parts[1] ?? "items").trim();
    const spec = (parts[2] ?? "").trim();
    const url = buildFiveToolsFilterUrl(display, page, spec);
    if (url) {
      return `<a href="${url}" target="_blank" rel="noopener">${escapeHtml(display || url)}</a>`;
    }
    return escapeHtml(display || body);
  }
  if (lower === "book" || lower === "adventure" || lower === "quickref") {
    const display = body.split("|")[0]?.trim() ?? body;
    return escapeHtml(display);
  }
  if (lower === "chance") {
    return "";
  }
  if (lower === "actsave") {
    return `${escapeHtml(body.trim().toUpperCase())} save`;
  }
  if (lower === "actsavefail") return "On a failed save";
  if (lower === "actsavesuccess") return "On a successful save";
  if (lower === "actsavesuccessorfail") {
    return "Whether the save succeeds or fails";
  }
  if (lower === "atkr") {
    return `<em>${escapeHtml(body.trim().toUpperCase())} Attack:</em>`;
  }

  // Content links: {@item Greataxe|XPHB|Greataxes} → @item[Greataxe|XPHB|Greataxes]
  return `@${lower}[${body}]`;
}

/**
 * Converts `{@tag …}` tokens. Leaves existing `@tag[…]` and `[[/…]]` alone.
 */
export function convertFiveToolsTagsToFoundry(text: string): string {
  return text.replace(/\{@([a-zA-Z]+)\s?([^}]*)\}/g, (_full, tag: string, body: string) =>
    convertFiveToolsTag(tag, body ?? ""),
  );
}

/**
 * Wraps standalone dice formulas (e.g. `2d6 + 3`, `1d4`) as `[[/r …]]`
 * when they are not already inside an enricher or HTML tag attribute.
 */
export function wrapBareDiceFormulas(text: string): string {
  // Skip if the whole string is already heavily enriched
  return text.replace(
    /(^|[^[\w/])(\d+d\d+(?:\s*[+-]\s*\d+)?(?:\s*[+-]\s*\d+d\d+)*)(?=$|[^\]\w])/gi,
    (full, prefix: string, formula: string, offset: number, source: string) => {
      const before = source.slice(Math.max(0, offset - 3), offset + String(prefix).length);
      if (before.includes("[[/") || before.includes("/r ")) return full;
      // Avoid matching inside @content[…] pipes oddly — check for open enricher
      const sliceStart = Math.max(0, offset - 20);
      const window = source.slice(sliceStart, offset);
      if (ALREADY_ROLL.test(window) || /\[\[[^\]]*$/.test(window)) return full;
      if (/@[a-zA-Z]+\[/.test(window) && !window.includes("]")) return full;
      return `${prefix}[[/r ${formula.trim()}]]`;
    },
  );
}

export interface FoundryDescriptionOptions {
  /** When true (default), wrap plain text in <p> blocks. */
  wrapHtml?: boolean;
  /** Optional 5e.tools deep-link label appended when `fiveToolsItemName` is set. */
  fiveToolsItemName?: string;
  fiveToolsLinkLabel?: string;
}

/**
 * Full pipeline: 5etools tags → Foundry enrichers → bare dice → HTML wrap.
 */
export function toFoundryDescriptionHtml(
  raw: string | undefined | null,
  options: FoundryDescriptionOptions = {},
): string {
  const text = (raw ?? "").trim();
  if (!text) return "";

  let result = text;
  // Convert 5etools tags unless the string looks like it's already Foundry-enriched only
  if (result.includes("{@")) {
    result = convertFiveToolsTagsToFoundry(result);
  }
  // Bare dice → [[/r]] (skip regions that already have rolls)
  if (!ALREADY_ROLL.test(result) || /\d+d\d+/i.test(result)) {
    result = wrapBareDiceFormulas(result);
  }

  const wrap = options.wrapHtml !== false;
  let html = wrap ? wrapParagraphs(result) : result;

  if (options.fiveToolsItemName?.trim()) {
    const url = buildFiveToolsItemUrl(options.fiveToolsItemName);
    const label = options.fiveToolsLinkLabel?.trim() || "View on 5e.tools";
    html += `<p><a href="${url}" target="_blank" rel="noopener">${escapeHtml(label)}</a></p>`;
  }

  // Guard: if somehow we double-escaped content links, leave as-is
  void ALREADY_CONTENT_LINK;

  return html;
}

/** `{ value, chat }` shape used by dnd5e item `system.description`. */
export function toFoundryDescription(
  raw: string | undefined | null,
  options?: FoundryDescriptionOptions & { chat?: string },
): { value: string; chat: string } {
  return {
    value: toFoundryDescriptionHtml(raw, options),
    chat: options?.chat ?? "",
  };
}

/**
 * Horizontal rule matching Foundry's ProseMirror "Divider" insert (`<hr>`).
 * Use between feature blocks in item description / chat HTML.
 */
export function foundryDividerHtml(): string {
  return "<hr>";
}

/** Classic Foundry / WoW rarity hex colors for inline HTML (chat + sheets). */
export const FOUNDRY_RARITY_COLORS: Record<string, string> = {
  base: "#9ca3af",
  common: "#c0c0c0",
  uncommon: "#1eff00",
  rare: "#0070dd",
  "very rare": "#a335ee",
  legendary: "#ff8000",
};

/** Resolves a rarity label to a Foundry-friendly highlight color. */
export function foundryRarityColor(rarity: string | undefined | null): string {
  const key = (rarity ?? "").trim().toLowerCase();
  return FOUNDRY_RARITY_COLORS[key] ?? FOUNDRY_RARITY_COLORS.common;
}

/**
 * Wraps text in a colored `<strong>` for rarity-highlighted feature titles.
 */
export function foundryRarityTitleHtml(
  name: string,
  rarity: string | undefined | null,
): string {
  const color = foundryRarityColor(rarity);
  return `<strong style="color:${color}">${escapeHtml(name)}</strong>`;
}

/** Soft rarity card chrome (inline styles — no world CSS required). */
const FEATURE_CARD_STYLE =
  "margin:0.65em 0;padding:0.55em 0.7em;border-left:3px solid VAR_COLOR;background:rgba(255,255,255,0.04);border-radius:0 4px 4px 0";
const UPGRADE_BLOCK_STYLE =
  "margin:0.45em 0 0.1em 0.35em;padding:0.4em 0.55em;border-left:2px solid VAR_COLOR;background:rgba(255,255,255,0.03);border-radius:0 3px 3px 0";
const CHAT_CARD_STYLE =
  "margin:0.4em 0;padding:0.35em 0.55em;border-left:3px solid VAR_COLOR;background:rgba(255,255,255,0.04);border-radius:0 4px 4px 0";

function withRarityBorder(template: string, rarity: string | undefined | null): string {
  return template.replace("VAR_COLOR", foundryRarityColor(rarity));
}

/**
 * PHB-style activation lead (`Bonus Action.`, `Reaction.`, `Action.`).
 * Pass an empty string to omit.
 */
export function foundryActivationLeadHtml(
  label: string | undefined | null,
): string {
  const trimmed = (label ?? "").trim();
  if (!trimmed) return "";
  const withDot = /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
  return `<p><strong>${escapeHtml(withDot)}</strong></p>`;
}

/** Maps parseFeatureUsage activation types to PHB lead labels. */
export function foundryActivationLabelFromType(
  type: string | undefined | null,
): string {
  switch ((type ?? "").trim().toLowerCase()) {
    case "bonus":
      return "Bonus Action";
    case "reaction":
      return "Reaction";
    case "action":
      return "Action";
    default:
      return "";
  }
}

/**
 * Turns enriched feature prose into HTML paragraphs / lists.
 * Consecutive lines starting with `-` or `•` become a `<ul>`.
 */
export function formatFeatureBodyHtml(enriched: string): string {
  const trimmed = enriched.trim();
  if (!trimmed) return "";
  if (/^</.test(trimmed) && !trimmed.includes("\n")) return trimmed;

  const blocks = trimmed
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);

  const out: string[] = [];
  for (const block of blocks) {
    if (block.startsWith("<") && !/^[-•]/.test(block)) {
      out.push(block);
      continue;
    }
    const lines = block.split(/\n/).map((l) => l.trim()).filter(Boolean);
    const listItemRe = /^[-•]\s+(.+)$/;
    let i = 0;
    while (i < lines.length) {
      if (listItemRe.test(lines[i]!)) {
        const items: string[] = [];
        while (i < lines.length) {
          const m = lines[i]!.match(listItemRe);
          if (!m) break;
          items.push(`<li>${m[1]}</li>`);
          i += 1;
        }
        out.push(`<ul>${items.join("")}</ul>`);
        continue;
      }
      const paraLines: string[] = [];
      while (i < lines.length && !listItemRe.test(lines[i]!)) {
        paraLines.push(lines[i]!);
        i += 1;
      }
      out.push(`<p>${paraLines.join("<br/>")}</p>`);
    }
  }
  return out.join("");
}

/** Soft card wrapper for a feature upgrade chain (sheet description). */
export function foundryFeatureCardHtml(
  innerHtml: string,
  rarity: string | undefined | null,
): string {
  const inner = innerHtml.trim();
  if (!inner) return "";
  const style = withRarityBorder(FEATURE_CARD_STYLE, rarity);
  return `<div style="${style}">${inner}</div>`;
}

/** Compact card for `system.description.chat`. */
export function foundryChatFeatureCardHtml(
  innerHtml: string,
  rarity: string | undefined | null,
): string {
  const inner = innerHtml.trim();
  if (!inner) return "";
  const style = withRarityBorder(CHAT_CARD_STYLE, rarity);
  return `<div style="${style}">${inner}</div>`;
}

/**
 * Nested upgrade block inside a feature card (replaces bare `<blockquote>`).
 */
export function foundryUpgradeBlockHtml(
  titleHtml: string,
  bodyHtml: string,
  rarity: string | undefined | null,
): string {
  const style = withRarityBorder(UPGRADE_BLOCK_STYLE, rarity);
  const title = titleHtml.trim();
  const body = bodyHtml.trim();
  return `<div style="${style}"><p>${title}</p>${body}</div>`;
}
