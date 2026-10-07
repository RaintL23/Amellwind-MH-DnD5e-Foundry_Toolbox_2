/**
 * Source names/dates for official codes missing from books.json / adventures.json
 * (e.g. item-only sources like HAT-LMI). 5etools keeps them in `js/parser.js`
 * (SOURCE_JSON_TO_FULL / SOURCE_JSON_TO_DATE); we read them from the mirror
 * instead of hardcoding, so new sources are picked up automatically.
 */

export type ParserSource = {
  code: string;
  name: string;
  published?: string;
};

const ASSIGNMENT = /^Parser\.(\w+)\s*=\s*(.+?);\s*$/;
const TABLE_ENTRY = /^Parser\.SOURCE_JSON_TO_(FULL|DATE)\[Parser\.(\w+)\]\s*=\s*(.+?);\s*$/;
const REFERENCE = /\$\{Parser\.(\w+)\}/g;

/** Resolves a string literal, template literal or `Parser.X` reference. */
function resolveExpression(
  expr: string,
  constants: Map<string, string>,
): string | undefined {
  const bare = /^Parser\.(\w+)$/.exec(expr);
  if (bare) return constants.get(bare[1]!);

  const quoted = /^(["'`])(.*)\1$/.exec(expr);
  if (!quoted) return undefined;

  let unresolved = false;
  const value = quoted[2]!.replace(REFERENCE, (_, name: string) => {
    const ref = constants.get(name);
    if (ref === undefined) unresolved = true;
    return ref ?? "";
  });
  return unresolved ? undefined : value.replace(/\\(.)/g, "$1");
}

export function parseParserSources(parserJs: string): ParserSource[] {
  const constants = new Map<string, string>();
  const names = new Map<string, string>();
  const dates = new Map<string, string>();

  for (const line of parserJs.split("\n")) {
    const entry = TABLE_ENTRY.exec(line.trim());
    if (entry) {
      const [, table, key, expr] = entry;
      const code = constants.get(key!);
      const value = resolveExpression(expr!, constants);
      if (code && value) (table === "FULL" ? names : dates).set(code, value);
      continue;
    }
    const assign = ASSIGNMENT.exec(line.trim());
    if (assign) {
      const value = resolveExpression(assign[2]!, constants);
      if (value !== undefined) constants.set(assign[1]!, value);
    }
  }

  return [...names].map(([code, name]) => ({
    code,
    name,
    published: dates.get(code),
  }));
}
