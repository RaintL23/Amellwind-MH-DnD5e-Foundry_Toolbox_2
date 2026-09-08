import type { SiegeWeapon, SiegeWeaponAction } from "@/shared/types";
import { SIZE_MAP } from "@/shared/utils/cr.utils";
import {
  parseFiveToolsMarkup,
  renderFiveToolsEntries,
} from "@/shared/utils/fivetools-parser";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>;

const OBJECT_TYPE_LABELS: Record<string, string> = {
  SW: "Siege Weapon",
};

const ATTACK_TYPE_LABELS: Record<string, string> = {
  MW: "Melee Weapon Attack",
  RW: "Ranged Weapon Attack",
  MS: "Melee Spell Attack",
  RS: "Ranged Spell Attack",
};

function siegeWeaponId(name: string, source: string): string {
  return `${name}::${source}`;
}

function formatStatValue(value: unknown): string {
  if (typeof value === "number") return String(value);
  if (typeof value === "string" && value.trim()) return value.trim();
  if (value && typeof value === "object") {
    const special = (value as Raw).special;
    if (typeof special === "string" && special.trim()) return special.trim();
  }
  return "—";
}

function formatSize(raw: unknown): string {
  if (!Array.isArray(raw) || raw.length === 0) return "—";
  return raw
    .map((code) => {
      const key = String(code);
      if (SIZE_MAP[key]) return SIZE_MAP[key];
      if (key === "V") return "Varies";
      return key;
    })
    .join(", ");
}

function formatImmunity(entry: unknown): string | null {
  if (typeof entry === "string" && entry.trim()) {
    return entry.trim().charAt(0).toUpperCase() + entry.trim().slice(1);
  }
  if (entry && typeof entry === "object") {
    const special = (entry as Raw).special;
    if (typeof special === "string" && special.trim()) return special.trim();
  }
  return null;
}

function mapAttackParagraph(entry: Raw): string {
  const attackLabel =
    ATTACK_TYPE_LABELS[String(entry.attackType ?? "")] ?? "Attack";
  const attackText = Array.isArray(entry.attackEntries)
    ? entry.attackEntries
        .filter((part: unknown): part is string => typeof part === "string")
        .map((part: string) => parseFiveToolsMarkup(part))
        .join(" ")
    : "";
  const hitText = Array.isArray(entry.hitEntries)
    ? entry.hitEntries
        .filter((part: unknown): part is string => typeof part === "string")
        .map((part: string) => parseFiveToolsMarkup(part))
        .join(" ")
    : "";

  const parts = [`${attackLabel}: ${attackText}`.trim()];
  if (hitText) parts.push(`Hit: ${hitText}`);
  return parts.filter(Boolean).join(" ");
}

function mapActionEntries(raw: unknown[]): SiegeWeaponAction[] {
  const actions: SiegeWeaponAction[] = [];

  for (const block of raw) {
    if (!block || typeof block !== "object") continue;
    const entry = block as Raw;
    const name =
      typeof entry.name === "string" && entry.name.trim()
        ? entry.name.trim()
        : "Action";
    const paragraphs: string[] = [];

    for (const child of Array.isArray(entry.entries) ? entry.entries : []) {
      if (typeof child === "string") {
        paragraphs.push(parseFiveToolsMarkup(child));
        continue;
      }
      if (!child || typeof child !== "object") continue;
      const nested = child as Raw;
      if (nested.type === "attack") {
        paragraphs.push(mapAttackParagraph(nested));
        continue;
      }
      paragraphs.push(...renderFiveToolsEntries([nested]));
    }

    if (paragraphs.length > 0) actions.push({ name, paragraphs });
  }

  return actions;
}

function buildSummary(paragraphs: string[]): string {
  const first = paragraphs.find((line) => line.trim().length > 0);
  if (!first) return "";
  return first.length > 160 ? `${first.slice(0, 160).trim()}…` : first;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapSiegeWeapon(raw: any): SiegeWeapon {
  const name = String(raw.name ?? "Unknown");
  const source = String(raw.source ?? "AGMH");
  const objectType = String(raw.objectType ?? "SW");
  const paragraphs = renderFiveToolsEntries(
    Array.isArray(raw.entries) ? raw.entries : [],
  );
  const immunities = (
    Array.isArray(raw.immune) ? raw.immune : []
  )
    .map(formatImmunity)
    .filter((value: string | null): value is string => Boolean(value));

  return {
    id: siegeWeaponId(name, source),
    name,
    source,
    page: typeof raw.page === "number" && raw.page > 0 ? raw.page : undefined,
    sizeLabel: formatSize(raw.size),
    objectType,
    objectTypeLabel: OBJECT_TYPE_LABELS[objectType] ?? objectType,
    acLabel: formatStatValue(raw.ac),
    hpLabel: formatStatValue(raw.hp),
    immunities,
    paragraphs,
    actions: mapActionEntries(
      Array.isArray(raw.actionEntries) ? raw.actionEntries : [],
    ),
    summary: buildSummary(paragraphs),
  };
}
