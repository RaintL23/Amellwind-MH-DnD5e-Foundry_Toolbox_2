/** pdf-lib form fields use WinAnsi (Windows-1252); strip/replace unsupported Unicode. */
const PDF_TEXT_REPLACEMENTS: ReadonlyArray<[string, string]> = [
  ["\u2192", "->"],
  ["\u2190", "<-"],
  ["\u2194", "<->"],
  ["\u21D2", "=>"],
  ["\u2026", "..."],
  ["\u201C", '"'],
  ["\u201D", '"'],
  ["\u2018", "'"],
  ["\u2019", "'"],
  ["\u2013", "-"],
  ["\u2014", "-"],
  ["\u2264", "<="],
  ["\u2265", ">="],
  ["\u2260", "!="],
  ["\u2212", "-"],
  ["\u2022", "-"],
];

export function sanitizeTextForPdf(text: string): string {
  let sanitized = text;
  for (const [from, to] of PDF_TEXT_REPLACEMENTS) {
    sanitized = sanitized.split(from).join(to);
  }
  return sanitized.replace(/[^\t\n\r\u0020-\u007E\u00A0-\u00FF]/g, "");
}

/** Pick the largest font size that fits inside a PDF text field box. */
export function estimatePdfFontSize(
  text: string,
  widthPt: number,
  heightPt: number,
  multiline: boolean,
  maxSize: number,
  minSize: number,
): number {
  if (!text.trim()) return maxSize;

  for (let size = maxSize; size >= minSize; size -= 0.5) {
    const charWidth = size * 0.48;
    const lineHeight = size * 1.15;
    const charsPerLine = Math.max(1, Math.floor(widthPt / charWidth));

    if (multiline) {
      const totalLines = text.split("\n").reduce((count, line) => {
        const trimmed = line.trim();
        if (!trimmed) return count + 1;
        return count + Math.max(1, Math.ceil(trimmed.length / charsPerLine));
      }, 0);
      if (totalLines * lineHeight <= heightPt) return size;
    } else if (text.length * charWidth <= widthPt) {
      return size;
    }
  }

  return minSize;
}
