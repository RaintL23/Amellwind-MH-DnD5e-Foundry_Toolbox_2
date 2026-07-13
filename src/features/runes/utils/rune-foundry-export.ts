import type { Rune } from "@/shared/types";
import {
  foundryId,
  buildStats,
  DEFAULT_OWNERSHIP,
} from "@/features/builder/foundry-export/foundry-id.utils";
import {
  slugify,
  kebab,
} from "@/features/builder/foundry-export/mappings";
import type { FoundryItem } from "@/features/builder/foundry-export/foundry.types";

export type RuneSlotContext = "Weapon" | "Armor" | "Trinket";

let _itemSort = 0;

function buildRuneDescription(rune: Rune, slotContext: RuneSlotContext): string {
  const parts: string[] = [];

  parts.push(`<h3>Source Monster</h3>`);
  parts.push(`<p><strong>Monster:</strong> ${rune.monsterName}</p>`);
  if (rune.monsterSource) {
    parts.push(`<p><strong>Source:</strong> ${rune.monsterSource}</p>`);
  }
  parts.push(`<p><strong>CR:</strong> ${rune.monsterCr}</p>`);
  parts.push(`<p><strong>Tier:</strong> ${rune.tier}</p>`);

  parts.push(`<h3>Rune Extraction</h3>`);
  parts.push(`<p><strong>Carve Chance:</strong> ${rune.carveChance}</p>`);
  parts.push(`<p><strong>Capture Chance:</strong> ${rune.captureChance}</p>`);
  parts.push(`<p><strong>Rolls:</strong> ${rune.rolls}</p>`);
  const slotsLabel = rune.slots
    .map((s) => (s === "W" ? "Weapon" : "Armor"))
    .join(", ");
  parts.push(`<p><strong>Compatible Slots:</strong> ${slotsLabel}</p>`);

  if (slotContext === "Weapon") {
    if (rune.weaponEffect) {
      parts.push(`<h3>Weapon Effect</h3>`);
      parts.push(`<p>${rune.weaponEffect}</p>`);
    }
  } else if (slotContext === "Armor") {
    if (rune.armorEffect) {
      parts.push(`<h3>Armor Effect</h3>`);
      parts.push(`<p>${rune.armorEffect}</p>`);
    }
  } else {
    // Trinket — show both available effects
    if (rune.weaponEffect) {
      parts.push(`<h3>Weapon Effect</h3>`);
      parts.push(`<p>${rune.weaponEffect}</p>`);
    }
    if (rune.armorEffect) {
      parts.push(`<h3>Armor Effect</h3>`);
      parts.push(`<p>${rune.armorEffect}</p>`);
    }
  }

  if (rune.tags.length > 0) {
    parts.push(`<p><em><strong>Tags:</strong> ${rune.tags.join(", ")}</em></p>`);
  }

  return parts.join("\n");
}

export function buildRuneFoundryItem(
  rune: Rune,
  slotContext: RuneSlotContext,
): FoundryItem {
  const itemName = `${rune.name} Rune (${slotContext})`;
  _itemSort += 100000;

  const system: Record<string, unknown> = {
    source: {
      custom: "",
      book: rune.monsterSource ?? "",
      page: "",
      license: "",
      rules: "2024",
      revision: 1,
    },
    description: {
      value: buildRuneDescription(rune, slotContext),
      chat: "",
    },
    identifier: slugify(itemName),
    quantity: 1,
    weight: { value: 0, units: "lb" },
    price: { value: 0, denomination: "gp" },
    attuned: false,
    attunement: "",
    equipped: false,
    rarity: "",
    identified: true,
    type: { value: "trinket", baseItem: "" },
    armor: { value: null, dex: null, magicalBonus: null },
    properties: [],
    proficient: null,
    strength: null,
    activities: {},
    container: null,
    cover: null,
    crewed: false,
    unidentified: { description: "" },
    uses: { spent: 0, max: "", recovery: [] },
  };

  return {
    _id: foundryId(),
    name: itemName,
    type: "equipment",
    img: "icons/commodities/treasure/rune-carved-stone-tan.webp",
    system,
    effects: [],
    folder: null,
    sort: _itemSort,
    ownership: { ...DEFAULT_OWNERSHIP },
    flags: {},
    _stats: buildStats(),
  };
}

function triggerJsonDownload(item: FoundryItem, filename: string): void {
  const json = JSON.stringify(item, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadAllBuildRuneJsons(
  weaponRunes: (Rune | null)[],
  armorRunes: (Rune | null)[],
  trinket1Rune: Rune | null,
  trinket2Rune: Rune | null,
): void {
  const entries: { rune: Rune; slotContext: RuneSlotContext }[] = [
    ...weaponRunes
      .filter((r): r is Rune => r !== null)
      .map((r) => ({ rune: r, slotContext: "Weapon" as RuneSlotContext })),
    ...armorRunes
      .filter((r): r is Rune => r !== null)
      .map((r) => ({ rune: r, slotContext: "Armor" as RuneSlotContext })),
    ...(trinket1Rune
      ? [{ rune: trinket1Rune, slotContext: "Trinket" as RuneSlotContext }]
      : []),
    ...(trinket2Rune
      ? [{ rune: trinket2Rune, slotContext: "Trinket" as RuneSlotContext }]
      : []),
  ];

  entries.forEach(({ rune, slotContext }, index) => {
    const item = buildRuneFoundryItem(rune, slotContext);
    const filename = `${kebab(rune.monsterName)}-${kebab(rune.name)}-rune-${slotContext.toLowerCase()}.json`;
    // Stagger downloads slightly so browsers don't block them
    setTimeout(() => triggerJsonDownload(item, filename), index * 150);
  });
}
