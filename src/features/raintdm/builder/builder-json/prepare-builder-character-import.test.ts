import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Rune, Weapon } from "@/shared/types";
import { parseBuilderCharacter } from "./parse-builder-character";
import type { BuilderCharacterJson } from "./builder-character.types";
import v1Fixture from "./__fixtures__/builder-character.v1.json";

const fighter = { id: "XPHB::Fighter", name: "Fighter", source: "XPHB", subclasses: [] };

const mocks = vi.hoisted(() => ({
  ensureClassUaSourcesLoaded: vi.fn(async () => false),
  ensureDndRaceUaSourcesLoaded: vi.fn(async () => false),
  ensureDndFeatUaSourcesLoaded: vi.fn(async () => false),
  ensureSpellUaSourcesLoaded: vi.fn(async () => false),
  getClassById: vi.fn(),
  getClassesByName: vi.fn(),
  getDndRaceById: vi.fn(),
  getDndRacesByName: vi.fn(),
  getSpeciesById: vi.fn(),
  getSpeciesByName: vi.fn(),
  getRuneByName: vi.fn(),
  getRunesByMonster: vi.fn(),
  getAllWeapons: vi.fn(),
}));

vi.mock("@/features/dnd/classes/services/class.service", () => ({
  ensureClassUaSourcesLoaded: mocks.ensureClassUaSourcesLoaded,
  getClassById: mocks.getClassById,
  getClassesByName: mocks.getClassesByName,
}));
vi.mock("@/features/dnd/classes/utils/class-subclass.utils", () => ({
  subclassesForClassVariant: () => [{ id: "XPHB::Champion", name: "Champion", source: "XPHB" }],
}));
vi.mock("@/features/dnd/races/services/dnd-race.service", () => ({
  ensureDndRaceUaSourcesLoaded: mocks.ensureDndRaceUaSourcesLoaded,
  getDndRaceById: mocks.getDndRaceById,
  getDndRacesByName: mocks.getDndRacesByName,
}));
vi.mock("@/features/amellwind/species/services/species.service", () => ({
  getSpeciesById: mocks.getSpeciesById,
  getSpeciesByName: mocks.getSpeciesByName,
}));
vi.mock("@/features/dnd/backgrounds/services/dnd-background.service", () => ({
  getDndBackgroundById: async (id: string) =>
    id === "Soldier::XPHB" ? { id, name: "Soldier", source: "XPHB" } : undefined,
  getDndBackgroundsByName: async () => [],
}));
vi.mock("@/features/amellwind/backgrounds/services/background.service", () => ({
  getAllBackgrounds: async () => [],
  getBackgroundById: async () => undefined,
}));
vi.mock("@/features/dnd/feats/services/dnd-feat.service", () => ({
  ensureDndFeatUaSourcesLoaded: mocks.ensureDndFeatUaSourcesLoaded,
  getAllDndFeats: async () => [],
  resolveDndFeatForRef: async (ref: { id: string; name: string }) => ({ ...ref, source: "XPHB" }),
}));
vi.mock("@/features/amellwind/feats/services/feat.service", () => ({
  getAllFeats: async () => [],
  getFeatById: async () => undefined,
}));
vi.mock("@/features/dnd/spells/services/spell.service", () => ({
  ensureSpellUaSourcesLoaded: mocks.ensureSpellUaSourcesLoaded,
  getSpellById: async () => undefined,
  getSpellsByName: async () => [],
}));
vi.mock("@/features/dnd/optionalfeatures/services/dnd-optionalfeature.service", () => ({
  getAllDndOptionalFeatures: async () => [
    { id: "Defense::XPHB", name: "Defense", source: "XPHB" },
  ],
}));
vi.mock("@/features/amellwind/weapons/services/weapon.service", () => ({
  getAllWeapons: mocks.getAllWeapons,
}));
vi.mock("@/features/raintdm/weapon-forge/services/weapon-forge.service", () => ({
  getAllForgeWeapons: async () => [],
}));
vi.mock("@/features/dnd/items/services/dnd-equipment.service", () => ({
  getDndArmors: async () => [],
  getDndWeaponVariantsByName: async () => [],
}));
vi.mock("@/features/amellwind/runes/services/rune.service", () => ({
  getRuneByName: mocks.getRuneByName,
  getRunesByMonster: mocks.getRunesByMonster,
}));

const { prepareBuilderCharacterImport } = await import("./prepare-builder-character-import");

function fixture(mutate?: (json: BuilderCharacterJson) => void): BuilderCharacterJson {
  const parsed = parseBuilderCharacter(structuredClone(v1Fixture));
  if (!parsed.ok) throw new Error(parsed.error);
  mutate?.(parsed.data);
  return parsed.data;
}

const human = { id: "Human::XPHB", name: "Human", source: "XPHB" };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getClassById.mockImplementation(async (id: string) =>
    id === fighter.id ? fighter : undefined,
  );
  mocks.getClassesByName.mockResolvedValue([fighter]);
  mocks.getSpeciesById.mockResolvedValue(undefined);
  mocks.getSpeciesByName.mockResolvedValue([]);
  mocks.getDndRaceById.mockImplementation(async (id: string) =>
    id === human.id ? human : undefined,
  );
  mocks.getDndRacesByName.mockResolvedValue([]);
  mocks.getAllWeapons.mockResolvedValue([]);
  mocks.getRunesByMonster.mockResolvedValue([]);
  mocks.getRuneByName.mockResolvedValue(undefined);
});

describe("prepareBuilderCharacterImport", () => {
  it("keeps a build whose refs all resolve, without warnings", async () => {
    const { data, warnings } = await prepareBuilderCharacterImport(fixture());
    expect(warnings).toEqual([]);
    expect(data.identity.class).toEqual(fixture().identity.class);
  });

  it("re-links a class by name when its id no longer exists", async () => {
    const { data, warnings } = await prepareBuilderCharacterImport(
      fixture((json) => {
        json.identity.class = { id: "PHB::Fighter", name: "Fighter" };
      }),
    );
    expect(data.identity.class?.id).toBe("XPHB::Fighter");
    expect(warnings).toEqual([
      'Class "Fighter": id "PHB::Fighter" not found; matched by name (XPHB::Fighter).',
    ]);
  });

  it("keeps unresolvable refs as saved and reports them", async () => {
    const { data, warnings } = await prepareBuilderCharacterImport(
      fixture((json) => {
        json.identity.species = { id: "Kobold::HOMEBREW", name: "Kobold" };
      }),
    );
    expect(data.identity.species?.id).toBe("Kobold::HOMEBREW");
    expect(warnings).toEqual([
      'Species "Kobold" (Kobold::HOMEBREW) is not in the catalog; kept as saved.',
    ]);
  });

  it("loads UA / brew sources found in ids before resolving", async () => {
    await prepareBuilderCharacterImport(
      fixture((json) => {
        json.identity.subclass = { id: "UA2025::Sniper", name: "Sniper" };
      }),
    );
    expect(mocks.ensureClassUaSourcesLoaded).toHaveBeenCalledWith(
      expect.arrayContaining(["XPHB", "UA2025"]),
    );
  });

  it("re-links equipped runes and keeps an uncatalogued weapon's saved copy", async () => {
    const savedRune = { name: "Rathalos Scale", monsterName: "Rathalos", armorEffect: "old" } as Rune;
    const catalogRune = { ...savedRune, armorEffect: "new" } as Rune;
    mocks.getRunesByMonster.mockResolvedValue([catalogRune]);
    const weapon = { name: "Custom Blade", source: "HOME", properties: [] } as unknown as Weapon;

    const { data, warnings } = await prepareBuilderCharacterImport(
      fixture((json) => {
        json.snapshot.equipment.mainHand = {
          weapon,
          rarity: "Rare",
          runeSlots: 3,
          runes: [savedRune, null, null],
          activeModeIndex: 1,
        };
      }),
    );

    const mainHand = data.snapshot.equipment.mainHand!;
    expect(mainHand.weapon).toBe(weapon);
    expect(mainHand.runes[0]).toBe(catalogRune);
    expect(mainHand).toMatchObject({ rarity: "Rare", runeSlots: 3, activeModeIndex: 1 });
    expect(warnings).toEqual([
      'Main hand "Custom Blade" (HOME) is not in the catalog; kept the saved copy.',
    ]);
  });

  it("keeps the saved value when a catalog cannot be read", async () => {
    mocks.getClassById.mockRejectedValue(new Error("offline"));
    const { data, warnings } = await prepareBuilderCharacterImport(fixture());
    expect(data.identity.class?.id).toBe("XPHB::Fighter");
    expect(warnings[0]).toBe("Class: could not check the catalog (offline); kept as saved.");
  });
});
