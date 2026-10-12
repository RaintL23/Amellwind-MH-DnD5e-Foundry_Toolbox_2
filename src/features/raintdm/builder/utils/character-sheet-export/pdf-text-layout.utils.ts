/**
 * Text layout for the character-sheet PDF using real font metrics.
 *
 * Lines are wrapped with the same rule pdf-lib applies to multiline fields
 * (a line breaks once its width reaches the box width), and the wrapped text
 * is written with explicit newlines, so what we measure is what gets drawn.
 * Long blocks are laid out as sections; whatever does not fit on the sheet at
 * the minimum readable size is returned as overflow for the continuation page.
 */

/** Subset of pdf-lib's `PDFFont` used for measuring (kept minimal for tests). */
export interface PdfTextMeasurer {
  widthOfTextAtSize(text: string, size: number): number;
  heightAtSize(size: number): number;
}

/** Inner text area of a form field, in PDF points. */
export interface PdfTextBox {
  width: number;
  height: number;
}

/** A titled block of text (class feature, trait, feat, inventory line…). */
export interface ExportTextSection {
  title: string;
  body: string;
}

export interface WrappedLine {
  text: string;
  /** True when the line closes a source paragraph (vs. a soft wrap). */
  paragraphEnd: boolean;
}

/** Same line height pdf-lib uses when drawing multiline fields. */
export function pdfLineHeight(font: PdfTextMeasurer, size: number): number {
  return font.heightAtSize(size) * 1.2;
}

/**
 * Lines that fit in `height`: pdf-lib puts baseline N at N line heights below
 * the top, so the last line's descender (~0.21em in Helvetica) needs room too.
 */
export function linesThatFit(height: number, font: PdfTextMeasurer, size: number): number {
  return Math.max(0, Math.floor((height - size * 0.25) / pdfLineHeight(font, size)));
}

function hardBreakWord(
  word: string,
  font: PdfTextMeasurer,
  size: number,
  maxWidth: number,
): string[] {
  const parts: string[] = [];
  let current = "";
  for (const char of word) {
    const next = current + char;
    if (current && font.widthOfTextAtSize(next, size) >= maxWidth) {
      parts.push(current);
      current = char;
    } else {
      current = next;
    }
  }
  if (current) parts.push(current);
  return parts;
}

/** Greedy word wrap; respects explicit newlines and splits over-long words. */
export function wrapTextLines(
  text: string,
  font: PdfTextMeasurer,
  size: number,
  maxWidth: number,
): WrappedLine[] {
  const lines: WrappedLine[] = [];
  for (const paragraph of text.split("\n")) {
    const words = paragraph.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines.push({ text: "", paragraphEnd: true });
      continue;
    }
    let current = "";
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) < maxWidth) {
        current = candidate;
        continue;
      }
      if (current) lines.push({ text: current, paragraphEnd: false });
      if (font.widthOfTextAtSize(word, size) < maxWidth) {
        current = word;
      } else {
        const pieces = hardBreakWord(word, font, size, maxWidth);
        current = pieces.pop() ?? "";
        for (const piece of pieces) lines.push({ text: piece, paragraphEnd: false });
      }
    }
    lines.push({ text: current, paragraphEnd: true });
  }
  return lines;
}

/** Rejoins wrapped lines into source text (soft wraps become spaces). */
function unwrapLines(lines: WrappedLine[]): string {
  return lines
    .map((line, idx) =>
      line.text + (idx === lines.length - 1 ? "" : line.paragraphEnd ? "\n" : " "),
    )
    .join("")
    .trim();
}

export interface FitTextResult {
  fontSize: number;
  /** Text with explicit line breaks, ready for `setText`. */
  text: string;
  fits: boolean;
}

/** Largest size in [min, max] at which `text` fits the box (multiline). */
export function fitTextToBox(
  text: string,
  font: PdfTextMeasurer,
  box: PdfTextBox,
  options: { maxSize: number; minSize: number; step?: number },
): FitTextResult {
  const step = options.step ?? 0.5;
  let last: FitTextResult | null = null;
  for (let size = options.maxSize; size >= options.minSize - 1e-6; size -= step) {
    const lines = wrapTextLines(text, font, size, box.width);
    const fits = lines.length <= linesThatFit(box.height, font, size);
    last = { fontSize: size, text: lines.map((line) => line.text).join("\n"), fits };
    if (fits) return last;
  }
  return last ?? { fontSize: options.minSize, text, fits: false };
}

/** Largest size in [min, max] at which a single line fits the box width. */
export function fitSingleLine(
  text: string,
  font: PdfTextMeasurer,
  width: number,
  options: { maxSize: number; minSize: number; step?: number },
): number {
  const step = options.step ?? 0.5;
  for (let size = options.maxSize; size >= options.minSize; size -= step) {
    if (font.widthOfTextAtSize(text, size) < width) return size;
  }
  return options.minSize;
}

/** "Title. Body" run-in heading, PHB style; keeps titles that end in punctuation. */
export function formatSectionText(section: ExportTextSection): string {
  const title = section.title.trim();
  const body = section.body.trim();
  if (!body) return title;
  if (!title) return body;
  const separator = /[.:!?]$/.test(title) ? " " : ". ";
  return `${title}${separator}${body}`;
}

export interface SectionLayoutOptions {
  maxSize: number;
  minSize: number;
  step?: number;
  /** Blank line between sections (off for compact lists such as equipment). */
  sectionGap?: boolean;
  /** Line appended to the last box when content moves to the continuation page. */
  continuationNote?: string;
  /** Minimum lines of a section kept on the sheet before splitting it. */
  minSplitLines?: number;
}

export interface SectionLayoutResult {
  fontSize: number;
  /** One entry per box, with explicit line breaks. */
  texts: string[];
  /** Sections (or section remainders) that did not fit. */
  overflow: ExportTextSection[];
}

interface WrappedSection {
  section: ExportTextSection;
  lines: WrappedLine[];
}

function wrapSections(
  sections: ExportTextSection[],
  font: PdfTextMeasurer,
  size: number,
  width: number,
): WrappedSection[] {
  return sections.map((section) => ({
    section,
    lines: wrapTextLines(formatSectionText(section), font, size, width),
  }));
}

/** Flows wrapped sections through boxes; returns null when they do not all fit. */
function flowAll(
  wrapped: WrappedSection[],
  capacities: number[],
  gap: boolean,
): string[][] | null {
  const boxes: string[][] = capacities.map(() => []);
  let boxIdx = 0;
  for (let s = 0; s < wrapped.length; s++) {
    if (gap && s > 0 && boxes[boxIdx].length > 0) {
      if (boxes[boxIdx].length < capacities[boxIdx]) boxes[boxIdx].push("");
      else boxIdx++;
    }
    for (const line of wrapped[s].lines) {
      while (boxIdx < capacities.length && boxes[boxIdx].length >= capacities[boxIdx]) {
        boxIdx++;
      }
      if (boxIdx >= capacities.length) return null;
      boxes[boxIdx].push(line.text);
    }
  }
  return boxes;
}

/**
 * Lays sections out across one or more boxes (e.g. the two Class Features
 * columns) at the largest size that fits. When nothing fits at `minSize`,
 * whole sections are kept in order and the rest is returned as overflow; the
 * section at the cut point is split by lines when enough of it fits.
 */
export function layoutSectionsIntoBoxes(
  sections: ExportTextSection[],
  boxes: PdfTextBox[],
  font: PdfTextMeasurer,
  options: SectionLayoutOptions,
): SectionLayoutResult {
  const gap = options.sectionGap ?? true;
  const step = options.step ?? 0.5;
  const width = Math.min(...boxes.map((box) => box.width));
  if (sections.length === 0 || boxes.length === 0) {
    return { fontSize: options.maxSize, texts: boxes.map(() => ""), overflow: [] };
  }

  for (let size = options.maxSize; size >= options.minSize - 1e-6; size -= step) {
    const capacities = boxes.map((box) => linesThatFit(box.height, font, size));
    const flowed = flowAll(wrapSections(sections, font, size, width), capacities, gap);
    if (flowed) {
      return {
        fontSize: size,
        texts: flowed.map((lines) => lines.join("\n")),
        overflow: [],
      };
    }
  }

  // Overflow: keep what fits at the minimum size, reserve one line for the note.
  const size = options.minSize;
  const capacities = boxes.map((box) => linesThatFit(box.height, font, size));
  if (options.continuationNote) {
    capacities[capacities.length - 1] = Math.max(0, capacities[capacities.length - 1] - 1);
  }
  const minSplit = options.minSplitLines ?? 3;
  const wrapped = wrapSections(sections, font, size, width);
  const out: string[][] = capacities.map(() => []);
  const overflow: ExportTextSection[] = [];
  let boxIdx = 0;

  const remaining = () =>
    capacities.reduce(
      (sum, cap, idx) => (idx < boxIdx ? sum : sum + cap - out[idx].length),
      0,
    );
  const pushLine = (text: string) => {
    // A section gap never opens a new box.
    if (!text && out[boxIdx] && out[boxIdx].length >= capacities[boxIdx]) return;
    while (boxIdx < capacities.length && out[boxIdx].length >= capacities[boxIdx]) boxIdx++;
    if (boxIdx < capacities.length) out[boxIdx].push(text);
  };

  for (let s = 0; s < wrapped.length; s++) {
    const { section, lines } = wrapped[s];
    if (overflow.length > 0) {
      overflow.push(section);
      continue;
    }
    const needsGap = gap && s > 0 && (out[boxIdx]?.length ?? 0) > 0;
    const available = remaining() - (needsGap ? 1 : 0);
    if (lines.length <= available) {
      if (needsGap) pushLine("");
      lines.forEach((line) => pushLine(line.text));
      continue;
    }
    // Split at line level only when a useful chunk stays and no orphan moves.
    const canSplit = available >= minSplit && lines.length - available >= 2;
    if (canSplit || s === 0) {
      const kept = Math.max(0, available);
      if (kept > 0) {
        if (needsGap) pushLine("");
        lines.slice(0, kept).forEach((line) => pushLine(line.text));
      }
      const rest = unwrapLines(lines.slice(kept));
      overflow.push(
        kept > 0
          ? { title: `${section.title.replace(/:$/, "")} (continued)`.trim(), body: rest }
          : section,
      );
      continue;
    }
    overflow.push(section);
  }

  if (overflow.length > 0 && options.continuationNote) {
    const last = capacities.length - 1;
    capacities[last] += 1;
    if (out[last].length > 0 && gap && out[last].length < capacities[last] - 1) {
      out[last].push("");
    }
    out[last].push(options.continuationNote);
  }

  return {
    fontSize: size,
    texts: out.map((lines) => lines.join("\n")),
    overflow,
  };
}
