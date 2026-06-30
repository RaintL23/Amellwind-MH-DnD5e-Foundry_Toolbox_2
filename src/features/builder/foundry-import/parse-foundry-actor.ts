import type { AbilityScores } from "@/shared/types";
import { ABILITY_KEYS } from "@/shared/constants/dnd";
import type {
  ParsedFoundryActor,
  ParsedFoundryArmor,
  ParsedFoundryLoot,
  ParsedFoundrySpell,
  ParsedFoundryWeapon,
} from "./foundry-import.types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** Safely reads a nested path (e.g. "system.details.alignment") from an object. */
function getPath(root: unknown, path: string): unknown {
  let current: unknown = root;
  for (const key of path.split(".")) {
    if (!isRecord(current)) return undefined;
    current = current[key];
  }
  return current;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/** Strips HTML tags / entities so Foundry rich text becomes plain builder text. */
function stripHtml(html: string): string {
  return html
    .replace(/<\s*br\s*\/?\s*>/gi, "\n")
    .replace(/<\/\s*p\s*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Only keep an image if it is an embedded data URL (built-in icon paths are dropped). */
function dataUrlOnly(src: unknown): string | null {
  const value = asString(src);
  return value.startsWith("data:") ? value : null;
}

function parseAbilities(system: unknown): Partial<AbilityScores> {
  const abilities = getPath(system, "abilities");
  const result: Partial<AbilityScores> = {};
  if (!isRecord(abilities)) return result;
  for (const key of ABILITY_KEYS) {
    const value = asNumber(getPath(abilities[key], "value"));
    if (value !== null) result[key] = value;
  }
  return result;
}

/**
 * Parses a Foundry VTT v12 (dnd5e) character actor JSON into a normalized
 * {@link ParsedFoundryActor}. Throws when the payload is not a character actor.
 */
export function parseFoundryActor(raw: unknown): ParsedFoundryActor {
  if (!isRecord(raw)) {
    throw new Error("The file does not contain a valid JSON object.");
  }
  if (raw.type !== "character") {
    throw new Error(
      'This JSON is not a Foundry VTT character actor (expected type "character").',
    );
  }

  const system = raw.system;
  const items = Array.isArray(raw.items) ? raw.items : [];

  let className: string | null = null;
  let subclassName: string | null = null;
  let raceName: string | null = null;
  let backgroundName: string | null = null;
  let classLevels: number | null = null;
  const featNames: string[] = [];
  const spells: ParsedFoundrySpell[] = [];
  const weapons: ParsedFoundryWeapon[] = [];
  const armors: ParsedFoundryArmor[] = [];
  const trinkets: string[] = [];
  const loot: ParsedFoundryLoot[] = [];

  for (const item of items) {
    if (!isRecord(item)) continue;
    const name = asString(item.name).trim();
    if (!name) continue;
    const itemType = asString(item.type);

    switch (itemType) {
      case "class":
        className = name;
        classLevels = asNumber(getPath(item, "system.levels"));
        break;
      case "subclass":
        subclassName = name;
        break;
      case "race":
        raceName = name;
        break;
      case "background":
        backgroundName = name;
        break;
      case "feat":
        if (asString(getPath(item, "system.type.value")) === "feat") {
          featNames.push(name);
        }
        break;
      case "spell":
        spells.push({
          name,
          level: asNumber(getPath(item, "system.level")) ?? 0,
        });
        break;
      case "weapon":
        weapons.push({
          name,
          equipped: getPath(item, "system.equipped") === true,
        });
        break;
      case "equipment": {
        const equipKind = asString(getPath(item, "system.type.value"));
        if (equipKind === "trinket") {
          trinkets.push(name);
        } else {
          armors.push({
            name,
            equipped: getPath(item, "system.equipped") === true,
            isShield: equipKind === "shield",
          });
        }
        break;
      }
      case "loot":
        loot.push({
          name,
          quantity: asNumber(getPath(item, "system.quantity")) ?? 1,
        });
        break;
      default:
        break;
    }
  }

  const sizeCode = asString(getPath(system, "traits.size")).toLowerCase();
  const size: "M" | "S" = sizeCode === "sm" ? "S" : "M";

  const biographyHtml = asString(getPath(system, "details.biography.value"));

  return {
    name: asString(raw.name).trim(),
    size,
    alignment: asString(getPath(system, "details.alignment")).trim(),
    level: classLevels ?? 1,
    abilities: parseAbilities(system),
    biography: stripHtml(biographyHtml),
    className,
    subclassName,
    raceName,
    backgroundName,
    featNames,
    spells,
    weapons,
    armors,
    trinkets,
    loot,
    portraitImage: dataUrlOnly(raw.img),
    tokenImage: dataUrlOnly(getPath(raw, "prototypeToken.texture.src")),
  };
}
