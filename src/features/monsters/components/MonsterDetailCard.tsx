/**
 * MonsterDetailCard Component
 *
 * Displays comprehensive monster information in a tabbed interface
 * Tabs: Stat Block, Description, Image, Runes
 */

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Image, Scroll, Swords } from "lucide-react";
import type {
  Monster,
  Entry,
  Action,
  Trait,
  ComplexEntry,
  Rune,
} from "../types/monster.types";
import {
  getMonsterSize,
  getMonsterType,
  formatCR,
} from "../services/monster.service";
import { useMonsterFluff } from "../hooks/useMonsterFluff";

interface MonsterDetailCardProps {
  monster: Monster;
}

/**
 * Helper function to render entry text (handles both strings and complex entries)
 */
function renderEntry(entry: Entry, index: number): React.ReactNode {
  if (typeof entry === "string") {
    return (
      <p key={index} className="mb-2">
        {entry}
      </p>
    );
  }

  // Handle complex entries (lists, tables, etc.)
  if (entry.type === "list" && entry.items) {
    return (
      <ul key={index} className="list-disc list-inside mb-2 ml-4">
        {entry.items.map((item, i) => (
          <li key={i}>
            {typeof item === "string" ? item : JSON.stringify(item)}
          </li>
        ))}
      </ul>
    );
  }

  if (entry.type === "entries" && entry.entries) {
    return (
      <div key={index} className="mb-2">
        {entry.entries.map((subEntry, i) => renderEntry(subEntry, i))}
      </div>
    );
  }

  // Fallback for other complex types
  return (
    <p key={index} className="mb-2">
      {JSON.stringify(entry)}
    </p>
  );
}

/**
 * Format ability modifier
 */
function getAbilityModifier(score?: number): string {
  if (!score) return "+0";
  const modifier = Math.floor((score - 10) / 2);
  return modifier >= 0 ? `+${modifier}` : `${modifier}`;
}

/**
 * Format AC display
 */
function formatAC(monster: Monster): string {
  if (!monster.ac || monster.ac.length === 0) return "—";

  const acParts = monster.ac.map((ac) => {
    if (!ac.ac) return "";
    let result = String(ac.ac);
    if (ac.from && ac.from.length > 0) {
      result += ` (${ac.from.join(", ")})`;
    }
    return result;
  });

  return acParts.filter(Boolean).join(", ");
}

/**
 * Format HP display
 */
function formatHP(monster: Monster): string {
  if (!monster.hp) return "—";

  if (monster.hp.special) return monster.hp.special;

  if (monster.hp.average && monster.hp.formula) {
    return `${monster.hp.average} (${monster.hp.formula})`;
  }

  if (monster.hp.average) return String(monster.hp.average);

  return "—";
}

/**
 * Format Speed display
 */
function formatSpeed(monster: Monster): string {
  if (!monster.speed) return "—";

  const speeds: string[] = [];

  if (monster.speed.walk) speeds.push(`walk ${monster.speed.walk} ft.`);
  if (monster.speed.fly) {
    const flySpeed = `fly ${monster.speed.fly} ft.`;
    speeds.push(monster.speed.canHover ? `${flySpeed} (hover)` : flySpeed);
  }
  if (monster.speed.swim) speeds.push(`swim ${monster.speed.swim} ft.`);
  if (monster.speed.climb) speeds.push(`climb ${monster.speed.climb} ft.`);
  if (monster.speed.burrow) speeds.push(`burrow ${monster.speed.burrow} ft.`);

  return speeds.length > 0 ? speeds.join(", ") : "—";
}

/**
 * Format alignment
 */
function formatAlignment(alignment?: string | string[]): string {
  if (!alignment) return "—";
  if (Array.isArray(alignment)) return alignment.join(" or ");
  return alignment;
}

/**
 * Stat Block Tab Component
 */
function StatBlockTab({ monster }: { monster: Monster }) {
  const size = getMonsterSize(monster.size);
  const type = getMonsterType(monster.type);
  const cr = formatCR(monster.cr);
  const alignment = formatAlignment(monster.alignment);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-2xl font-bold mb-1">{monster.name}</h3>
        <p className="text-muted-foreground italic">
          {size} {type}, {alignment}
        </p>
      </div>

      {/* Basic Stats */}
      <div className="border-t border-b py-3 space-y-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          <div>
            <span className="font-semibold">Armor Class:</span>{" "}
            {formatAC(monster)}
          </div>
          <div>
            <span className="font-semibold">Hit Points:</span>{" "}
            {formatHP(monster)}
          </div>
          <div>
            <span className="font-semibold">Speed:</span> {formatSpeed(monster)}
          </div>
          <div>
            <span className="font-semibold">Challenge Rating:</span> {cr}
          </div>
        </div>
      </div>

      {/* Ability Scores */}
      <div className="border-t border-b py-3">
        <div className="grid grid-cols-6 gap-2 text-center">
          <div>
            <div className="font-semibold text-xs uppercase mb-1">STR</div>
            <div className="text-sm">
              {monster.str || "—"} ({getAbilityModifier(monster.str)})
            </div>
          </div>
          <div>
            <div className="font-semibold text-xs uppercase mb-1">DEX</div>
            <div className="text-sm">
              {monster.dex || "—"} ({getAbilityModifier(monster.dex)})
            </div>
          </div>
          <div>
            <div className="font-semibold text-xs uppercase mb-1">CON</div>
            <div className="text-sm">
              {monster.con || "—"} ({getAbilityModifier(monster.con)})
            </div>
          </div>
          <div>
            <div className="font-semibold text-xs uppercase mb-1">INT</div>
            <div className="text-sm">
              {monster.int || "—"} ({getAbilityModifier(monster.int)})
            </div>
          </div>
          <div>
            <div className="font-semibold text-xs uppercase mb-1">WIS</div>
            <div className="text-sm">
              {monster.wis || "—"} ({getAbilityModifier(monster.wis)})
            </div>
          </div>
          <div>
            <div className="font-semibold text-xs uppercase mb-1">CHA</div>
            <div className="text-sm">
              {monster.cha || "—"} ({getAbilityModifier(monster.cha)})
            </div>
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="space-y-2 text-sm">
        {monster.save && Object.keys(monster.save).length > 0 && (
          <div>
            <span className="font-semibold">Saving Throws:</span>{" "}
            {Object.entries(monster.save)
              .map(([key, value]) => `${key.toUpperCase()} ${value}`)
              .join(", ")}
          </div>
        )}

        {monster.skill && Object.keys(monster.skill).length > 0 && (
          <div>
            <span className="font-semibold">Skills:</span>{" "}
            {Object.entries(monster.skill)
              .map(([key, value]) => `${key} ${value}`)
              .join(", ")}
          </div>
        )}

        {monster.vulnerable && monster.vulnerable.length > 0 && (
          <div>
            <span className="font-semibold">Damage Vulnerabilities:</span>{" "}
            {monster.vulnerable.join(", ")}
          </div>
        )}

        {monster.resist && monster.resist.length > 0 && (
          <div>
            <span className="font-semibold">Damage Resistances:</span>{" "}
            {monster.resist.join(", ")}
          </div>
        )}

        {monster.immune && monster.immune.length > 0 && (
          <div>
            <span className="font-semibold">Damage Immunities:</span>{" "}
            {monster.immune.join(", ")}
          </div>
        )}

        {monster.conditionImmune && monster.conditionImmune.length > 0 && (
          <div>
            <span className="font-semibold">Condition Immunities:</span>{" "}
            {monster.conditionImmune.join(", ")}
          </div>
        )}

        {monster.senses && monster.senses.length > 0 && (
          <div>
            <span className="font-semibold">Senses:</span>{" "}
            {monster.senses.join(", ")}
            {monster.passive && `, passive Perception ${monster.passive}`}
          </div>
        )}

        {monster.languages && monster.languages.length > 0 && (
          <div>
            <span className="font-semibold">Languages:</span>{" "}
            {monster.languages.join(", ")}
          </div>
        )}

        {monster.environment && monster.environment.length > 0 && (
          <div>
            <span className="font-semibold">Environment:</span>{" "}
            <div className="inline-flex flex-wrap gap-1 mt-1">
              {monster.environment.map((env, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {env}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Traits */}
      {monster.trait && monster.trait.length > 0 && (
        <div className="border-t pt-4">
          <h4 className="font-semibold text-lg mb-3">Traits</h4>
          <div className="space-y-3">
            {monster.trait.map((trait: Trait, index: number) => (
              <div key={index}>
                <h5 className="font-semibold text-sm mb-1">{trait.name}</h5>
                <div className="text-sm text-muted-foreground">
                  {trait.entries.map((entry, i) => renderEntry(entry, i))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      {monster.action && monster.action.length > 0 && (
        <div className="border-t pt-4">
          <h4 className="font-semibold text-lg mb-3">Actions</h4>
          <div className="space-y-3">
            {monster.action.map((action: Action, index: number) => (
              <div key={index}>
                <h5 className="font-semibold text-sm mb-1">{action.name}</h5>
                <div className="text-sm text-muted-foreground">
                  {action.entries.map((entry, i) => renderEntry(entry, i))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bonus Actions */}
      {monster.bonus && monster.bonus.length > 0 && (
        <div className="border-t pt-4">
          <h4 className="font-semibold text-lg mb-3">Bonus Actions</h4>
          <div className="space-y-3">
            {monster.bonus.map((action: Action, index: number) => (
              <div key={index}>
                <h5 className="font-semibold text-sm mb-1">{action.name}</h5>
                <div className="text-sm text-muted-foreground">
                  {action.entries.map((entry, i) => renderEntry(entry, i))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reactions */}
      {monster.reaction && monster.reaction.length > 0 && (
        <div className="border-t pt-4">
          <h4 className="font-semibold text-lg mb-3">Reactions</h4>
          <div className="space-y-3">
            {monster.reaction.map((reaction: Action, index: number) => (
              <div key={index}>
                <h5 className="font-semibold text-sm mb-1">{reaction.name}</h5>
                <div className="text-sm text-muted-foreground">
                  {reaction.entries.map((entry, i) => renderEntry(entry, i))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legendary Actions */}
      {monster.legendary && monster.legendary.length > 0 && (
        <div className="border-t pt-4">
          <h4 className="font-semibold text-lg mb-3">Legendary Actions</h4>
          <div className="space-y-3">
            {monster.legendary.map((action: Action, index: number) => (
              <div key={index}>
                <h5 className="font-semibold text-sm mb-1">{action.name}</h5>
                <div className="text-sm text-muted-foreground">
                  {action.entries.map((entry, i) => renderEntry(entry, i))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Source */}
      <div className="border-t pt-4 text-xs text-muted-foreground">
        <span className="font-semibold">Source:</span> {monster.source}
        {monster.page && `, page ${monster.page}`}
      </div>
    </div>
  );
}

/**
 * Description Tab Component
 *
 * Extracts and displays only the description strings from the fluff data.
 * The structure is typically:
 * fluff.entries[0] = { type: "entries", entries: [string1, string2, ..., object] }
 * We show only the initial strings before the first object.
 */
function DescriptionTab({ monster }: { monster: Monster }) {
  const {
    data: fluff,
    isLoading,
    error,
  } = useMonsterFluff(monster.name, monster.source);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">
            Loading description...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-destructive">Failed to load description</p>
      </div>
    );
  }

  if (!fluff || !fluff.entries || fluff.entries.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <p className="text-muted-foreground">
          No description available for this monster.
        </p>
      </div>
    );
  }

  // Extract description strings from the fluff structure
  const descriptionStrings: string[] = [];

  // Navigate through the fluff structure to find description strings
  for (const entry of fluff.entries) {
    if (typeof entry === "string") {
      descriptionStrings.push(entry);
    } else {
      if (entry.type === "entries" && entry.entries) {
        for (const subEntry of entry.entries) {
          if (typeof subEntry === "string") {
            descriptionStrings.push(subEntry);
          }
        }
      }
      break;
    }
  }

  if (descriptionStrings.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <p className="text-muted-foreground">
          No description available for this monster.
        </p>
      </div>
    );
  }

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none space-y-4">
      {descriptionStrings.map((text, index) => (
        <p key={index} className="text-sm leading-relaxed">
          {text}
        </p>
      ))}
    </div>
  );
}

/**
 * Image Tab Component
 */
function ImageTab({ monster }: { monster: Monster }) {
  if (!monster.tokenUrl) {
    return (
      <div className="text-center py-12">
        <Image className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <p className="text-muted-foreground">
          No image available for this monster.
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-4">
      <img
        src={monster.tokenUrl}
        alt={monster.name}
        className="max-w-full h-auto rounded-lg shadow-lg"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.style.display = "none";
          const parent = target.parentElement;
          if (parent) {
            parent.innerHTML = `
              <div class="text-center py-12">
                <p class="text-muted-foreground">Failed to load image.</p>
              </div>
            `;
          }
        }}
      />
    </div>
  );
}

/**
 * Runes Tab Component
 *
 * Displays Monster Hunter rune information including armor and weapon material effects
 */
function RunesTab({ monster }: { monster: Monster }) {
  const {
    data: fluff,
    isLoading,
    error,
  } = useMonsterFluff(monster.name, monster.source);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Loading runes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-destructive">Failed to load runes</p>
      </div>
    );
  }

  if (!fluff || !fluff.entries || fluff.entries.length === 0) {
    return (
      <div className="text-center py-12">
        <Scroll className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <p className="text-muted-foreground">
          Rune information for {monster.name} is not available.
        </p>
      </div>
    );
  }

  // Extract runes from fluff data
  const runes: Rune[] = extractRunes(fluff.entries);

  if (runes.length === 0) {
    return (
      <div className="text-center py-12">
        <Scroll className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <p className="text-muted-foreground">
          No rune information available for {monster.name}.
        </p>
      </div>
    );
  }

  // Group runes by type
  const armorRunes = runes.filter((r) => r.type === "armor");
  const weaponRunes = runes.filter((r) => r.type === "weapon");
  const otherRunes = runes.filter((r) => r.type === "other");

  return (
    <div className="space-y-8">
      {/* Armor Runes */}
      {armorRunes.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Badge variant="default" className="bg-blue-600">
              Armor
            </Badge>
            <span>Material Effects</span>
          </h4>
          <RuneTable runes={armorRunes} />
        </div>
      )}

      {/* Weapon Runes */}
      {weaponRunes.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Badge variant="default" className="bg-red-600">
              Weapon
            </Badge>
            <span>Material Effects</span>
          </h4>
          <RuneTable runes={weaponRunes} />
        </div>
      )}

      {/* Other Runes */}
      {otherRunes.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Badge variant="default" className="bg-purple-600">
              Other
            </Badge>
            <span>Effects</span>
          </h4>
          <RuneTable runes={otherRunes} />
        </div>
      )}
    </div>
  );
}

/**
 * Helper function to extract runes from fluff entries
 */
function extractRunes(entries: Entry[] | ComplexEntry[]): Rune[] {
  const runes: Rune[] = [];
  if (!entries || entries.length === 0) return runes;

  // Handle case where entries is wrapped in a single inset object
  if (
    entries.length === 1 &&
    typeof entries[0] === "object" &&
    entries[0].entries
  ) {
    entries = entries[0].entries;
  }

  // Helper function to extract runes from list entries
  const extractRunesFromList = (listEntries: any[]) => {
    for (const listEntry of listEntries) {
      if (
        typeof listEntry === "object" &&
        listEntry.type === "list" &&
        listEntry.items
      ) {
        const runeType = determineRuneType(listEntry.name);

        for (const item of listEntry.items) {
          if (typeof item === "object" && item.name) {
            const rune: Rune = {
              name: item.name || "Unknown",
              type: runeType,
              effect: extractEffect(item.entries),
            };
            runes.push(rune);
          }
        }
      }
    }
  };

  // First attempt: Extract runes directly from entries
  extractRunesFromList(entries);

  // Second attempt: If no runes found, look inside inset entries
  if (runes.length === 0) {
    for (const entry of entries) {
      if (
        typeof entry === "object" &&
        entry.type === "inset" &&
        entry.entries
      ) {
        extractRunesFromList(entry.entries);
      }
    }
  }

  return runes;
}

/**
 * Determine rune type from section name
 */
function determineRuneType(sectionName?: string): string {
  if (!sectionName) return "other";

  const name = sectionName.toUpperCase();

  if (name.includes("ARMOR")) return "armor";
  if (name.includes("WEAPON")) return "weapon";

  return "other";
}

/**
 * Extract effect text from entries
 */
function extractEffect(entries?: Entry[] | ComplexEntry[]): string {
  if (!entries || entries.length === 0) return "";

  const effectParts: string[] = [];

  for (const entry of entries) {
    if (typeof entry === "string") {
      effectParts.push(entry);
    } else if (typeof entry === "object") {
      // Try to extract text from complex entries
      if (entry.entries) {
        effectParts.push(extractEffect(entry.entries));
      }
    }
  }

  return effectParts.filter(Boolean).join(" ");
}

/**
 * Rune Table Component
 */
function RuneTable({ runes }: { runes: Rune[] }) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-muted">
          <tr>
            <th className="text-left p-3 font-semibold text-sm">Name</th>
            <th className="text-left p-3 font-semibold text-sm">Effect</th>
          </tr>
        </thead>
        <tbody>
          {runes.map((rune, index) => (
            <tr
              key={index}
              className="border-t hover:bg-muted/50 transition-colors"
            >
              <td className="p-3 font-medium text-sm align-top w-1/3">
                {rune.name}
              </td>
              <td className="p-3 text-sm text-muted-foreground">
                {rune.effect || "No effect description available"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Main Monster Detail Card Component with Tabs
 */
export function MonsterDetailCard({ monster }: MonsterDetailCardProps) {
  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl font-bold">{monster.name}</CardTitle>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="statblock" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="statblock" className="flex items-center gap-2">
              <Swords className="h-4 w-4" />
              <span className="hidden sm:inline">Stat Block</span>
              <span className="sm:hidden">Stats</span>
            </TabsTrigger>
            <TabsTrigger
              value="description"
              className="flex items-center gap-2"
            >
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Description</span>
              <span className="sm:hidden">Lore</span>
            </TabsTrigger>
            <TabsTrigger value="image" className="flex items-center gap-2">
              <Image className="h-4 w-4" />
              <span className="hidden sm:inline">Image</span>
              <span className="sm:hidden">Img</span>
            </TabsTrigger>
            <TabsTrigger value="runes" className="flex items-center gap-2">
              <Scroll className="h-4 w-4" />
              <span className="hidden sm:inline">Runes</span>
              <span className="sm:hidden">Runes</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="statblock" className="mt-6">
            <StatBlockTab monster={monster} />
          </TabsContent>

          <TabsContent value="description" className="mt-6">
            <DescriptionTab monster={monster} />
          </TabsContent>

          <TabsContent value="image" className="mt-6">
            <ImageTab monster={monster} />
          </TabsContent>

          <TabsContent value="runes" className="mt-6">
            <RunesTab monster={monster} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
