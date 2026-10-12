import type { BuilderCharacterJson } from "@/features/raintdm/builder/builder-json/builder-character.types";
import { parseBuilderCharacter } from "@/features/raintdm/builder/builder-json/parse-builder-character";

/**
 * Upgrades a Builder JSON stored in a play-sheet record (older envelope
 * versions, hand-edited files) through the same migrate + normalize pipeline
 * as a file import. Falls back to the stored value if it cannot be parsed, so
 * an existing sheet never becomes unreadable.
 */
export function upgradeStoredBuilderJson(json: BuilderCharacterJson): BuilderCharacterJson {
  const parsed = parseBuilderCharacter(json);
  return parsed.ok ? parsed.data : json;
}
