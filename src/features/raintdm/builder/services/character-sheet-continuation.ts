/**
 * Continuation page(s) appended to the 2024 sheet when features, traits,
 * feats, spells or backstory do not fit their boxes at a readable size.
 * Drawn as page content (bold headings, two columns) after form appearances
 * are generated, so the original two pages stay an editable form.
 */
import type { PDFDocument, PDFFont, PDFPage } from "pdf-lib";
import {
  sanitizeTextForPdf,
  wrapTextLines,
  type ExportTextSection,
} from "../utils/character-sheet-export.utils";

export interface ContinuationGroup {
  heading: string;
  sections: ExportTextSection[];
}

const PAGE_WIDTH = 603;
const PAGE_HEIGHT = 774;
const MARGIN = 36;
const GUTTER = 18;
const COLUMN_WIDTH = (PAGE_WIDTH - MARGIN * 2 - GUTTER) / 2;
const HEADER_HEIGHT = 34;
const FOOTER_HEIGHT = 18;

const HEADING_SIZE = 9.5;
const TITLE_SIZE = 8.5;
const BODY_SIZE = 8;
const LINE_FACTOR = 1.25;
const SECTION_SPACING = 5;
const GROUP_SPACING = 10;

export async function appendContinuationPages(
  pdfDoc: PDFDocument,
  options: {
    characterName: string;
    groups: ContinuationGroup[];
    regular: PDFFont;
    bold: PDFFont;
  },
): Promise<void> {
  const groups = options.groups.filter((group) => group.sections.length > 0);
  if (groups.length === 0) return;

  const { rgb } = await import("pdf-lib");
  const ink = rgb(0.1, 0.1, 0.1);
  const muted = rgb(0.4, 0.4, 0.4);
  const rule = rgb(0.7, 0.7, 0.7);
  const { regular, bold } = options;
  const name = sanitizeTextForPdf(options.characterName.trim()) || "Character";

  const top = PAGE_HEIGHT - MARGIN - HEADER_HEIGHT;
  const bottom = MARGIN + FOOTER_HEIGHT;
  let pageNumber = 0;

  function newPage(): PDFPage {
    const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    pageNumber += 1;
    const titleY = PAGE_HEIGHT - MARGIN - 14;
    page.drawText(name, { x: MARGIN, y: titleY, size: 14, font: bold, color: ink });
    const subtitle = "Features & Traits (continued)";
    const subtitleWidth = regular.widthOfTextAtSize(subtitle, 9);
    page.drawText(subtitle, {
      x: PAGE_WIDTH - MARGIN - subtitleWidth,
      y: titleY + 2,
      size: 9,
      font: regular,
      color: muted,
    });
    page.drawLine({
      start: { x: MARGIN, y: titleY - 8 },
      end: { x: PAGE_WIDTH - MARGIN, y: titleY - 8 },
      thickness: 0.75,
      color: rule,
    });
    // The template has two pages; continuation pages follow them.
    const footer = `Page ${pageNumber + 2}`;
    page.drawText(footer, {
      x: (PAGE_WIDTH - regular.widthOfTextAtSize(footer, 7)) / 2,
      y: MARGIN,
      size: 7,
      font: regular,
      color: muted,
    });
    return page;
  }

  let page = newPage();
  let column = 0;
  let y = top;

  function columnX() {
    return MARGIN + column * (COLUMN_WIDTH + GUTTER);
  }

  /** Moves to the next column/page when `height` does not fit below `y`. */
  function ensureSpace(height: number) {
    if (y - height >= bottom) return;
    if (column === 0) {
      column = 1;
      y = top;
    } else {
      page = newPage();
      column = 0;
      y = top;
    }
  }

  function drawLine(text: string, font: PDFFont, size: number) {
    const lineHeight = size * LINE_FACTOR;
    ensureSpace(lineHeight);
    y -= lineHeight;
    if (text) page.drawText(text, { x: columnX(), y, size, font, color: ink });
  }

  for (const group of groups) {
    const headingHeight = HEADING_SIZE * LINE_FACTOR + 4;
    // Keep the heading with at least a couple of body lines.
    ensureSpace(headingHeight + TITLE_SIZE * LINE_FACTOR * 3);
    if (y < top) y -= GROUP_SPACING;
    y -= HEADING_SIZE * LINE_FACTOR;
    page.drawText(sanitizeTextForPdf(group.heading.toUpperCase()), {
      x: columnX(),
      y,
      size: HEADING_SIZE,
      font: bold,
      color: ink,
    });
    page.drawLine({
      start: { x: columnX(), y: y - 3 },
      end: { x: columnX() + COLUMN_WIDTH, y: y - 3 },
      thickness: 0.5,
      color: rule,
    });
    y -= 4;

    for (const section of group.sections) {
      const title = sanitizeTextForPdf(section.title.trim());
      const body = sanitizeTextForPdf(section.body.trim());
      // Title-only sections (inventory lines) render as a compact list.
      if (!body) {
        for (const line of wrapTextLines(title, regular, BODY_SIZE, COLUMN_WIDTH)) {
          drawLine(line.text, regular, BODY_SIZE);
        }
        continue;
      }
      if (title) {
        for (const line of wrapTextLines(title, bold, TITLE_SIZE, COLUMN_WIDTH)) {
          drawLine(line.text, bold, TITLE_SIZE);
        }
      }
      for (const line of wrapTextLines(body, regular, BODY_SIZE, COLUMN_WIDTH)) {
        drawLine(line.text, regular, BODY_SIZE);
      }
      y -= SECTION_SPACING;
    }
  }
}
