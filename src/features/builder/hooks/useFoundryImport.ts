import { useCallback, useState } from "react";
import type { ArmorItem, CartEntry, Class, Weapon } from "@/shared/types";
import { useCharacterBuilder } from "../context/CharacterBuilderContext";
import { useBuilderInventory } from "../context/BuilderInventoryContext";
import {
  getClassesByName,
  getListClasses,
} from "@/features/classes/services/class.service";
import { getAllDndRaces } from "@/features/dnd-races/services/dnd-race.service";
import { getListDndBackgrounds } from "@/features/dnd-backgrounds/services/dnd-background.service";
import { getDndFeatsByName } from "@/features/dnd-feats/services/dnd-feat.service";
import { dndFeatToBuilderSelection } from "../utils/origin-feat.constants";
import { getSpellsByName } from "@/features/spells/services/spell.service";
import { getAllWeapons } from "@/features/weapons/services/weapon.service";
import {
  getDndArmors,
  getDndWeapons,
} from "@/features/dnd-items/services/dnd-equipment.service";
import { MH_ARMOR_CATALOG } from "../utils/cart-equipment.resolver";
import { getFeatSlotLevels } from "../utils/builder-class.utils";
import { parseFoundryActor } from "../foundry-import";
import type {
  FoundryImportSummary,
  ParsedFoundryActor,
} from "../foundry-import";

/** Case-insensitive, trimmed name comparison used across catalog lookups. */
function namesEqual(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

function toCartEntry(name: string, quantity = 1, source?: string): CartEntry {
  return {
    name,
    cost: "",
    weight: "",
    quantity: Math.max(1, quantity),
    ...(source ? { source } : {}),
  };
}

export function useFoundryImport() {
  const builder = useCharacterBuilder();
  const inventory = useBuilderInventory();
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<FoundryImportSummary | null>(null);

  const applyParsed = useCallback(
    async (parsed: ParsedFoundryActor) => {
      const matched: string[] = [];
      const unmatched: string[] = [];

      // Start from a clean slate so nothing from the previous build lingers.
      builder.resetBuild();

      // ── Identity: class + subclass ──
      if (parsed.className) {
        const variants = await getClassesByName(parsed.className);
        let classMatch: Class | null = variants[0] ?? null;
        if (!classMatch) {
          const list = await getListClasses();
          classMatch =
            list.find((c) => namesEqual(c.name, parsed.className!)) ?? null;
        }
        if (classMatch) {
          builder.setClass({ id: classMatch.id, name: classMatch.name });
          matched.push(`Class: ${classMatch.name}`);

          if (parsed.subclassName) {
            const searchIn = variants.length ? variants : [classMatch];
            let subRef: { id: string; name: string } | null = null;
            for (const variant of searchIn) {
              const sub = variant.subclasses?.find((s) =>
                namesEqual(s.name, parsed.subclassName!),
              );
              if (sub) {
                subRef = { id: sub.id, name: sub.name };
                break;
              }
            }
            if (subRef) {
              builder.setSubclass(subRef);
              matched.push(`Subclass: ${subRef.name}`);
            } else {
              unmatched.push(`Subclass: ${parsed.subclassName}`);
            }
          }
        } else {
          unmatched.push(`Class: ${parsed.className}`);
        }
      }

      // ── Identity: species (handles subraces by linking to their parent) ──
      if (parsed.raceName) {
        const races = await getAllDndRaces();
        const match = races.find((r) => namesEqual(r.name, parsed.raceName!));
        if (match) {
          if (!match.parentName) {
            builder.setSpecies({
              id: match.id,
              name: match.name,
              subraceId: null,
              subraceName: null,
            });
          } else {
            const parent =
              races.find(
                (r) =>
                  !r.parentName &&
                  namesEqual(r.name, match.parentName!) &&
                  r.source === match.parentSource,
              ) ??
              races.find(
                (r) => !r.parentName && namesEqual(r.name, match.parentName!),
              );
            if (parent) {
              builder.setSpecies({
                id: parent.id,
                name: parent.name,
                subraceId: match.id,
                subraceName: match.name,
              });
            } else {
              builder.setSpecies({
                id: match.id,
                name: match.name,
                subraceId: null,
                subraceName: null,
              });
            }
          }
          matched.push(`Species: ${match.name}`);
        } else {
          unmatched.push(`Species: ${parsed.raceName}`);
        }
      }

      // ── Identity: background ──
      if (parsed.backgroundName) {
        const backgrounds = await getListDndBackgrounds();
        const match = backgrounds.find((b) =>
          namesEqual(b.name, parsed.backgroundName!),
        );
        if (match) {
          builder.setBackground({ id: match.id, name: match.name });
          matched.push(`Background: ${match.name}`);
        } else {
          unmatched.push(`Background: ${parsed.backgroundName}`);
        }
      }

      // ── Core character fields ──
      if (parsed.name) builder.setName(parsed.name);
      builder.setCreatureSize(parsed.size);

      const alignLower = parsed.alignment.toLowerCase();
      builder.setLawChaosAlignment(
        alignLower.includes("lawful")
          ? "L"
          : alignLower.includes("chaotic")
            ? "C"
            : "N",
      );
      builder.setGoodEvilAlignment(
        alignLower.includes("good")
          ? "G"
          : alignLower.includes("evil")
            ? "E"
            : "N",
      );

      builder.setLevel(parsed.level);
      if (Object.keys(parsed.abilities).length > 0) {
        builder.setAbilityScores(parsed.abilities);
      }
      if (parsed.biography) builder.setBackstoryNotes(parsed.biography);

      // ── Standalone feats (capped to the build's ASI feat slots) ──
      const maxFeatSlots = getFeatSlotLevels(
        parsed.className ?? "",
        parsed.level,
      ).length;
      let featSlot = 0;
      for (const name of parsed.featNames) {
        if (featSlot >= maxFeatSlots) {
          unmatched.push(`Feat (no free slot): ${name}`);
          continue;
        }
        const feats = await getDndFeatsByName(name);
        if (feats.length > 0) {
          builder.setFeatAtIndex(featSlot, dndFeatToBuilderSelection(feats[0]));
          featSlot += 1;
          matched.push(`Feat: ${name}`);
        } else {
          unmatched.push(`Feat: ${name}`);
        }
      }

      // ── Spells ──
      for (const spell of parsed.spells) {
        const found = await getSpellsByName(spell.name);
        if (found.length > 0) {
          const chosen = found[0];
          builder.addSpell(chosen.level, {
            id: chosen.id,
            name: chosen.name,
            level: chosen.level,
            source: chosen.source,
            ...(chosen.school ? { school: chosen.school } : {}),
          });
          matched.push(`Spell: ${chosen.name}`);
        } else {
          unmatched.push(`Spell: ${spell.name}`);
        }
      }

      // ── Equipment ──
      const [dndWeapons, dndArmors] = await Promise.all([
        getDndWeapons(true).catch(() => [] as Weapon[]),
        getDndArmors(true).catch(() => [] as ArmorItem[]),
      ]);
      const homebrewWeapons = builder.useAmellwindHomebrew
        ? await getAllWeapons().catch(() => [] as Weapon[])
        : [];
      const weaponCatalog: Weapon[] = [...dndWeapons, ...homebrewWeapons];
      const armorCatalog: ArmorItem[] = [
        ...dndArmors,
        ...(builder.useAmellwindHomebrew ? MH_ARMOR_CATALOG : []),
      ];

      // Weapons: equip up to two (equipped ones first), rest go to inventory.
      const sortedWeapons = [...parsed.weapons].sort(
        (a, b) => Number(b.equipped) - Number(a.equipped),
      );
      let handSlot = 0;
      for (const weapon of sortedWeapons) {
        const found = weaponCatalog.find((c) => namesEqual(c.name, weapon.name));
        if (!found) {
          unmatched.push(`Weapon: ${weapon.name}`);
          continue;
        }
        if (handSlot < 2) {
          builder.equipWeapon(
            handSlot === 0 ? "mainHand" : "offHand",
            found,
            found.itemRarityLabel ?? "Standard",
          );
          handSlot += 1;
        } else {
          inventory.addToInventory(toCartEntry(found.name, 1, found.source));
        }
        matched.push(`Weapon: ${found.name}`);
      }

      // Armor: equip the first non-shield piece; everything else to inventory.
      let armorEquipped = false;
      for (const armor of parsed.armors) {
        const found = armorCatalog.find((c) => namesEqual(c.name, armor.name));
        if (!found) {
          unmatched.push(`Armor: ${armor.name}`);
          continue;
        }
        if (!armor.isShield && !armorEquipped) {
          builder.equipArmor(found);
          armorEquipped = true;
        } else {
          inventory.addToInventory(toCartEntry(found.name, 1, found.source));
        }
        matched.push(`Armor: ${found.name}`);
      }

      // Trinkets: equip up to two; rest to inventory.
      parsed.trinkets.forEach((name, index) => {
        if (index < 2) {
          builder.equipTrinket(index === 0 ? "trinket1" : "trinket2", name);
        } else {
          inventory.addToInventory(toCartEntry(name));
        }
        matched.push(`Trinket: ${name}`);
      });

      // Loot / generic inventory.
      for (const entry of parsed.loot) {
        inventory.addToInventory(toCartEntry(entry.name, entry.quantity));
        matched.push(`Item: ${entry.name}`);
      }

      // ── Images ──
      if (parsed.portraitImage) {
        builder.setPortraitImage(parsed.portraitImage);
        matched.push("Portrait image");
      }
      if (parsed.tokenImage) {
        builder.setTokenImage(parsed.tokenImage);
        matched.push("Token image");
      }

      setSummary({ matched, unmatched });
    },
    [builder, inventory],
  );

  const importFromFile = useCallback(
    async (file: File) => {
      setImporting(true);
      setError(null);
      setSummary(null);
      try {
        const text = await file.text();
        let json: unknown;
        try {
          json = JSON.parse(text);
        } catch {
          throw new Error("The selected file is not valid JSON.");
        }
        const parsed = parseFoundryActor(json);
        await applyParsed(parsed);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Foundry import failed");
      } finally {
        setImporting(false);
      }
    },
    [applyParsed],
  );

  const clearResult = useCallback(() => {
    setError(null);
    setSummary(null);
  }, []);

  return { importFromFile, importing, error, summary, clearResult };
}
