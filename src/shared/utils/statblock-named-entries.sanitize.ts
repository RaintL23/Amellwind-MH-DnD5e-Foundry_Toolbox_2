/**
 * Repair flattened PDF-dump stat blocks: glued "Name (Recharge)." abilities
 * split into separate entries, and nested form/variant items folded back under
 * the parent trait or action (Fatalis Shifting Scales, Nakarkos True Face, …).
 */

export interface RawNamedEntry {
  name: string;
  entries: unknown[];
}

const STAT_FIELD_NAME =
  /^(Damage Immunities|Damage Resistances|Damage Vulnerabilities|Condition Immunities)$/i;

const PASSIVE_RECHARGE_TRAIT =
  /mythic trait|risen state|limited recharge/i;

const NESTS_FOLLOWING =
  /benefits below|following effects|one of the following|depending on which|replacing .{5,160} with/i;

const RIDER_TEXT =
  /not included in the attack|attacks? deals? an additional/i;

const GLUED_ABILITY_RE =
  /([A-Z][A-Za-z'’-]+(?:\s+[A-Za-z'’-]+){0,6})\s*\(((?:[Rr]echarge[^)]*|\d+\s*\/\s*[Dd]ay|[Cc]osts\s+\d+\s+[Aa]ctions)[^)}]*)[)}]\.?\s*/g;

const FORM_THEN_ABILITY_RE =
  /^([A-Z][a-z]+ [A-Z][a-z]+)\s+([A-Z].+\((?:Recharge|Costs|\d+\s*\/\s*day).+)$/s;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function joinStringEntries(entries: unknown[]): string {
  return entries
    .filter((entry): entry is string => typeof entry === "string")
    .join(" ")
    .trim();
}

function hasStructuredEntries(entries: unknown[]): boolean {
  return entries.some((entry) => isRecord(entry));
}

function baseAbilityName(name: string): string {
  return name.replace(/\s*\([^)]*\)\s*$/, "").trim().toLowerCase();
}

function toNamedItem(entry: RawNamedEntry): Record<string, unknown> {
  return {
    type: "item",
    name: entry.name,
    entries: entry.entries.length > 0 ? entry.entries : [""],
  };
}

export function splitLeadingFormName(name: string): {
  form?: string;
  ability: string;
} {
  const match = name.match(FORM_THEN_ABILITY_RE);
  if (!match) return { ability: name };
  return { form: match[1], ability: match[2].trim() };
}

function normalizeRawEntry(raw: unknown): RawNamedEntry | null {
  if (!isRecord(raw) || typeof raw.name !== "string" || !raw.name.trim()) {
    return null;
  }
  if (Array.isArray(raw.entries)) {
    return { name: raw.name.trim(), entries: raw.entries };
  }
  if (typeof raw.text === "string") {
    return { name: raw.name.trim(), entries: raw.text ? [raw.text] : [] };
  }
  return { name: raw.name.trim(), entries: [] };
}

function collectBaseNames(entries: RawNamedEntry[]): Set<string> {
  return new Set(entries.map((entry) => baseAbilityName(entry.name)));
}

function namesShareToken(parentName: string, childName: string): boolean {
  const parentTokens = baseAbilityName(parentName)
    .split(/\s+/)
    .filter((token) => token.length > 3);
  const childTokens = new Set(
    baseAbilityName(childName)
      .split(/\s+/)
      .filter((token) => token.length > 3),
  );
  return parentTokens.some((token) => childTokens.has(token));
}

function matchesSiblingAction(
  childName: string,
  siblingBaseNames: Set<string>,
): boolean {
  const base = baseAbilityName(childName);
  if (siblingBaseNames.has(base)) return true;
  for (const sibling of siblingBaseNames) {
    if (base.startsWith(`${sibling} `) || sibling.startsWith(`${base} `)) {
      return true;
    }
  }
  return false;
}

export function splitGluedNamedEntries(entries: RawNamedEntry[]): RawNamedEntry[] {
  const result: RawNamedEntry[] = [];

  for (const entry of entries) {
    if (hasStructuredEntries(entry.entries)) {
      result.push(entry);
      continue;
    }

    const text = joinStringEntries(entry.entries);
    if (!text) {
      result.push(entry);
      continue;
    }

    const matches = [...text.matchAll(GLUED_ABILITY_RE)];
    if (matches.length === 0) {
      result.push(entry);
      continue;
    }

    let cursor = 0;
    let currentName = entry.name;

    for (const match of matches) {
      const index = match.index ?? 0;
      if (index === 0) {
        cursor = match[0].length;
        continue;
      }

      const chunk = text.slice(cursor, index).trim();
      result.push({
        name: currentName,
        entries: chunk ? [chunk] : [],
      });
      currentName = `${match[1]} (${match[2]})`;
      cursor = index + match[0].length;
    }

    const rest = text.slice(cursor).trim();
    result.push({
      name: currentName,
      entries: rest ? [rest] : [],
    });
  }

  return result.filter((entry) => entry.name);
}

function isLikelyNestedChild(
  entry: RawNamedEntry,
  parent: RawNamedEntry,
  siblingBaseNames: Set<string>,
): boolean {
  const name = entry.name;
  const text = joinStringEntries(entry.entries);

  if (STAT_FIELD_NAME.test(name)) return true;
  if (RIDER_TEXT.test(text)) return true;
  if (splitLeadingFormName(name).form) return true;
  if (namesShareToken(parent.name, name)) return true;
  if (matchesSiblingAction(name, siblingBaseNames)) return true;

  if (
    /\(Recharge/i.test(name) &&
    !PASSIVE_RECHARGE_TRAIT.test(name) &&
    siblingBaseNames.size > 0
  ) {
    return true;
  }

  return false;
}

function groupFoldedChildren(children: RawNamedEntry[]): unknown[] {
  const blocks: unknown[] = [];
  let currentForm: { name: string; items: RawNamedEntry[] } | null = null;
  const ungrouped: RawNamedEntry[] = [];

  const flushForm = () => {
    if (!currentForm) return;
    blocks.push({
      type: "entries",
      name: currentForm.name,
      entries: [
        {
          type: "list",
          style: "list-hang-notitle",
          items: currentForm.items.map(toNamedItem),
        },
      ],
    });
    currentForm = null;
  };

  for (const child of children) {
    const split = splitLeadingFormName(child.name);
    if (split.form) {
      flushForm();
      currentForm = {
        name: split.form,
        items: [{ name: split.ability, entries: child.entries }],
      };
      continue;
    }
    if (currentForm) {
      currentForm.items.push(child);
      continue;
    }
    ungrouped.push(child);
  }

  flushForm();

  if (ungrouped.length > 0) {
    blocks.unshift({
      type: "list",
      style: "list-hang-notitle",
      items: ungrouped.map(toNamedItem),
    });
  }

  return blocks;
}

export function foldNestedNamedEntries(
  entries: RawNamedEntry[],
  siblingBaseNames: Set<string> = new Set(),
): RawNamedEntry[] {
  const result: RawNamedEntry[] = [];

  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    const text = joinStringEntries(entry.entries);
    const alreadyNested = hasStructuredEntries(entry.entries);

    if (alreadyNested || !NESTS_FOLLOWING.test(text)) {
      result.push(entry);
      continue;
    }

    const children: RawNamedEntry[] = [];
    let cursor = index + 1;
    while (
      cursor < entries.length &&
      isLikelyNestedChild(entries[cursor], entry, siblingBaseNames)
    ) {
      children.push(entries[cursor]);
      cursor += 1;
    }

    if (children.length === 0) {
      result.push(entry);
      continue;
    }

    result.push({
      name: entry.name,
      entries: [...entry.entries, ...groupFoldedChildren(children)],
    });
    index = cursor - 1;
  }

  return result;
}

/**
 * Normalize, split glued recharge/limited-use headers, then fold variant
 * children under parents that promise "the following" benefits.
 */
export function sanitizeNamedEntrySection(
  raw: unknown[],
  siblingBaseNames: Set<string> = new Set(),
): RawNamedEntry[] {
  if (!Array.isArray(raw)) return [];
  const normalized = raw
    .map(normalizeRawEntry)
    .filter((entry): entry is RawNamedEntry => entry !== null);
  const split = splitGluedNamedEntries(normalized);
  return foldNestedNamedEntries(split, siblingBaseNames);
}

export function baseNamesFromNamedEntries(
  entries: RawNamedEntry[],
): Set<string> {
  return collectBaseNames(entries);
}
