/**
 * Converts 5etools fluff entries + images into Foundry-ready HTML (Plutonium-style
 * description panes with art + lore). Keeps `{@…}` tags so `toFoundryDescription`
 * can turn them into content links.
 *
 * Image layout matches 5etools/Plutonium: lead art → lore entries → remaining
 * images with captions.
 */

import { escapeHtml } from "@/shared/foundry";

/** Public 5e.tools image CDN root (same host Plutonium uses for book art). */
export const FIVETOOLS_IMG_BASE = "https://5e.tools/img";

type Raw = Record<string, unknown>;

export interface FluffArtResult {
  /** Full HTML for `system.description.value` (images + lore). */
  html: string;
  /** First art URL for the Foundry item `img` field. */
  img?: string;
}

/** Builds an absolute 5e.tools image URL from an internal fluff path. */
export function fiveToolsImageUrl(path: string): string {
  const cleaned = path.replace(/^\/+/, "").trim();
  return `${FIVETOOLS_IMG_BASE}/${cleaned}`;
}

/** Extracts the first usable image URL from a fluff `images` array. */
export function resolveFluffImageUrl(images: unknown): string | undefined {
  if (!Array.isArray(images)) return undefined;
  for (const entry of images) {
    const url = imageEntryUrl(entry);
    if (url) return url;
  }
  return undefined;
}

function imageEntryUrl(entry: unknown): string | undefined {
  if (typeof entry !== "object" || entry === null) return undefined;
  const img = entry as Raw;
  const href = img.href;
  if (typeof href === "object" && href !== null) {
    const h = href as Raw;
    if (typeof h.path === "string" && h.path.trim()) {
      return fiveToolsImageUrl(h.path);
    }
    if (typeof h.url === "string" && h.url.trim()) {
      return h.url.trim();
    }
  }
  if (typeof href === "string" && href.trim()) return href.trim();
  return undefined;
}

function imageCaption(entry: unknown): { title?: string; credit?: string } {
  if (typeof entry !== "object" || entry === null) return {};
  const img = entry as Raw;
  return {
    title: typeof img.title === "string" ? img.title.trim() : undefined,
    credit: typeof img.credit === "string" ? img.credit.trim() : undefined,
  };
}

/** Renders a fluff image block with optional title/credit caption (Plutonium-like). */
export function renderFluffImage(entry: unknown): string {
  const url = imageEntryUrl(entry);
  if (!url) return "";
  const { title, credit } = imageCaption(entry);
  const alt = escapeHtml(title || credit || "");
  const parts = [
    `<img src="${escapeHtml(url)}" alt="${alt}" style="max-width:100%;height:auto;border-radius:4px"/>`,
  ];
  if (title || credit) {
    const captionBits = [
      title ? `<em>${escapeHtml(title)}</em>` : "",
      credit ? escapeHtml(credit) : "",
    ].filter(Boolean);
    parts.push(
      `<p style="margin-top:0.25em;opacity:0.85;font-size:0.9em">${captionBits.join(" — ")}</p>`,
    );
  }
  return `<figure style="margin:0 0 1em 0">${parts.join("")}</figure>`;
}

function renderImages(images: unknown[]): string {
  return images.map(renderFluffImage).filter(Boolean).join("");
}

/** Renders a single 5etools entry tree to HTML, preserving `{@…}` tags. */
export function renderFiveToolsEntry(entry: unknown, depth = 0): string {
  if (typeof entry === "string") {
    const trimmed = entry.trim();
    if (!trimmed) return "";
    return `<p>${trimmed}</p>`;
  }
  if (typeof entry !== "object" || entry === null) return "";

  const obj = entry as Raw;
  const type = typeof obj.type === "string" ? obj.type : "";

  if (type === "image") {
    return renderFluffImage(obj);
  }

  if (type === "quote") {
    const body = Array.isArray(obj.entries)
      ? (obj.entries as unknown[])
          .map((e) => renderFiveToolsEntry(e, depth + 1))
          .join("")
      : "";
    const by =
      typeof obj.by === "string" && obj.by.trim()
        ? `<footer>— ${escapeHtml(obj.by.trim())}</footer>`
        : "";
    return `<blockquote>${body}${by}</blockquote>`;
  }

  if (type === "list" && Array.isArray(obj.items)) {
    const items = (obj.items as unknown[])
      .map((item) => {
        if (typeof item === "string") return `<li>${item}</li>`;
        if (typeof item === "object" && item !== null) {
          const it = item as Raw;
          if (it.type === "item" && typeof it.name === "string") {
            const body =
              typeof it.entry === "string"
                ? it.entry
                : Array.isArray(it.entries)
                  ? (it.entries as unknown[])
                      .map((e) => renderFiveToolsEntry(e, depth + 1))
                      .join("")
                  : "";
            return `<li><strong>${escapeHtml(it.name)}</strong>${body ? ` ${body}` : ""}</li>`;
          }
          return `<li>${renderFiveToolsEntry(item, depth + 1)}</li>`;
        }
        return "";
      })
      .filter(Boolean)
      .join("");
    return items ? `<ul>${items}</ul>` : "";
  }

  if (type === "table") {
    return renderFiveToolsTable(obj);
  }

  if (Array.isArray(obj.entries)) {
    const children = (obj.entries as unknown[])
      .map((e) => renderFiveToolsEntry(e, depth + 1))
      .join("");
    const name = typeof obj.name === "string" ? obj.name.trim() : "";
    if (name) {
      const heading =
        type === "section" || depth === 0
          ? `<h2>${escapeHtml(name)}</h2>`
          : `<h3>${escapeHtml(name)}</h3>`;
      return `${heading}${children}`;
    }
    return children;
  }

  return "";
}

function renderFiveToolsTable(obj: Raw): string {
  const caption =
    typeof obj.caption === "string" && obj.caption.trim()
      ? `<caption>${obj.caption.trim()}</caption>`
      : "";
  const labels = Array.isArray(obj.colLabels)
    ? (obj.colLabels as unknown[]).map((l) => String(l ?? ""))
    : [];
  const rows = Array.isArray(obj.rows) ? (obj.rows as unknown[][]) : [];
  const head =
    labels.length > 0
      ? `<thead><tr>${labels.map((l) => `<th>${l}</th>`).join("")}</tr></thead>`
      : "";
  const body = rows
    .map(
      (row) =>
        `<tr>${(Array.isArray(row) ? row : [])
          .map((cell) => `<td>${formatTableCell(cell)}</td>`)
          .join("")}</tr>`,
    )
    .join("");
  return `<table style="width:100%;border-collapse:collapse;margin:1em 0">${caption}${head}<tbody>${body}</tbody></table>`;
}

function formatTableCell(cell: unknown): string {
  if (cell == null) return "—";
  if (typeof cell === "string" || typeof cell === "number") return String(cell);
  if (typeof cell === "object") {
    const c = cell as Raw;
    if (c.type === "bonus" && typeof c.value === "number") {
      return c.value === 0 ? "—" : `+${c.value}`;
    }
    if (c.type === "bonusSpeed" && typeof c.value === "number") {
      return c.value === 0 ? "—" : `+${c.value} ft.`;
    }
    if (c.type === "dice" && Array.isArray(c.toRoll)) {
      return (c.toRoll as { number?: number; faces?: number }[])
        .map((d) => `${d.number ?? 1}d${d.faces ?? 6}`)
        .join("+");
    }
  }
  return String(cell);
}

/** Renders an array of 5etools entries to HTML. */
export function renderFiveToolsEntries(entries: unknown[] | undefined): string {
  if (!Array.isArray(entries) || entries.length === 0) return "";
  return entries.map((e) => renderFiveToolsEntry(e)).join("");
}

/**
 * Builds Foundry description HTML from a raw 5etools fluff object
 * (`{ entries, images }`). Lead image → lore → remaining images (Plutonium order).
 */
export function fluffToFoundryHtml(fluff: unknown): FluffArtResult {
  if (typeof fluff !== "object" || fluff === null) {
    return { html: "" };
  }
  const f = fluff as Raw;
  const images = Array.isArray(f.images) ? (f.images as unknown[]) : [];
  const lead = images.length > 0 ? renderFluffImage(images[0]) : "";
  const entriesHtml = Array.isArray(f.entries)
    ? renderFiveToolsEntries(f.entries as unknown[])
    : "";
  const rest = images.length > 1 ? renderImages(images.slice(1)) : "";
  const html = `${lead}${entriesHtml}${rest}`.trim();
  return {
    html,
    img: resolveFluffImageUrl(images),
  };
}
