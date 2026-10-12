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
