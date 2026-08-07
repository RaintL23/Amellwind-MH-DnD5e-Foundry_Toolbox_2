import type { FoundryItem } from "@/shared/foundry";
import { FOUNDRY_EXPORT_TARGET, foundryIdFromSeed } from "@/shared/foundry";
import { DUAL_BLADES_DEMON_DODGE_ITEM_MACRO } from "./dual-blades-demon-dodge.macro";
import { HUNTING_HORN_RECITAL_ITEM_MACRO } from "./hunting-horn-recital.macro";

/** Default item-level Midi / dnd5e flags stamped on Weapon Forge exports. */
export function defaultWeaponForgeItemFlags(opts: {
  baseWeaponName: string;
}): Record<string, unknown> {
  return {
    "amellwind-toolbox": {
      baseWeaponName: opts.baseWeaponName,
      exportKind: "weapon-forge",
    },
    dnd5e: {
      riders: { activity: [], effect: [] },
    },
    "midi-qol": {
      fumbleThreshold: null,
      rollAttackPerTarget: "default",
      removeAttackDamageButtons: "default",
      itemCondition: "",
      reactionCondition: "",
      otherCondition: "",
      effectCondition: "",
    },
    // Match Foundry-exported GS samples: item-level midiProperties stay off even with +1.
    midiProperties: {
      autoFailFriendly: false,
      autoSaveFriendly: false,
      magicdam: false,
      magiceffect: false,
      noConcentrationCheck: false,
      toggleEffect: false,
      ignoreTotalCover: false,
    },
    exportSource: {
      world: "amellwind-toolbox",
      system: FOUNDRY_EXPORT_TARGET.systemId,
      coreVersion: FOUNDRY_EXPORT_TARGET.coreVersion,
      systemVersion: FOUNDRY_EXPORT_TARGET.systemVersion,
    },
  };
}

function songActivityMeta(activity: Record<string, unknown>): {
  isRecital: boolean;
  isEncore: boolean;
  isEndMelodies: boolean;
} {
  const name = String(activity.name ?? "").toLowerCase();
  const midi = activity.midiProperties as Record<string, unknown> | undefined;
  const id = String(midi?.identifier ?? "").toLowerCase();
  return {
    isRecital:
      name === "recital" || id === "recital" || name.includes("recital"),
    isEncore: name === "encore" || id === "encore" || name.includes("encore"),
    isEndMelodies:
      id === "end-melodies" ||
      id === "cancel-melodies" ||
      name.includes("end melod") ||
      name.includes("cancel melod"),
  };
}

function hasSongbookActivity(item: FoundryItem): boolean {
  const system = item.system as Record<string, unknown>;
  const activities = system.activities;
  if (!activities || typeof activities !== "object") return false;
  return Object.values(
    activities as Record<string, Record<string, unknown>>,
  ).some((activity) => {
    if (!activity) return false;
    const { isRecital, isEncore } = songActivityMeta(activity);
    return isRecital || isEncore;
  });
}

function resolveMaxActiveMelodies(item: FoundryItem): number {
  const system = item.system as Record<string, unknown>;
  const activities = system.activities;
  if (!activities || typeof activities !== "object") return 1;
  const hasEncore = Object.values(
    activities as Record<string, Record<string, unknown>>,
  ).some((activity) => activity && songActivityMeta(activity).isEncore);
  return hasEncore ? 2 : 1;
}

function resolveSongbookMagical(item: FoundryItem): boolean {
  const system = item.system as Record<string, unknown>;
  const activities = system.activities;
  if (!activities || typeof activities !== "object") return false;
  return Object.values(
    activities as Record<string, Record<string, unknown>>,
  ).some((activity) => {
    if (!activity) return false;
    const { isRecital, isEncore } = songActivityMeta(activity);
    if (!isRecital && !isEncore) return false;
    const midi = activity.midiProperties as Record<string, unknown> | undefined;
    return midi?.magicEffect === true || midi?.magicDamage === true;
  });
}

/** Stable activity id for End Melodies (Songbook cancel). */
export const HUNTING_HORN_END_MELODIES_ACTIVITY_ID = foundryIdFromSeed(
  "hunting-horn-end-melodies",
);

function buildEndMelodiesActivity(magical: boolean): Record<string, unknown> {
  const id = HUNTING_HORN_END_MELODIES_ACTIVITY_ID;
  return {
    _id: id,
    sort: 310000,
    name: "End Melodies",
    img: "icons/skills/trades/music-notes-sound-blue.webp",
    type: "utility",
    activation: {
      type: "special",
      value: null,
      condition: "",
      override: false,
    },
    consumption: {
      scaling: { allowed: false, max: "" },
      spellSlot: false,
      targets: [],
    },
    description: {
      chatFlavor: "End all active Songbook Melodies",
    },
    duration: {
      value: "",
      units: "inst",
      concentration: false,
      override: false,
    },
    effects: [],
    range: {
      value: null,
      units: "self",
      special: "",
      override: false,
    },
    target: {
      template: {
        count: "",
        contiguous: false,
        type: "",
        size: "",
        width: "",
        height: "",
        units: "ft",
      },
      affects: {
        count: "",
        type: "self",
        choice: false,
        special: "",
      },
      prompt: false,
      override: false,
    },
    uses: {
      spent: 0,
      max: "",
      recovery: [],
    },
    midiProperties: {
      ignoreTraits: [],
      triggeredActivityId: "none",
      triggeredActivityConditionText: "",
      triggeredActivityTargets: "targets",
      triggeredActivityRollAs: "self",
      autoConsume: false,
      forceConsumeDialog: "default",
      forceRollDialog: "default",
      forceDamageDialog: "default",
      confirmTargets: "default",
      autoTargetType: "any",
      autoTargetAction: "default",
      automationOnly: false,
      otherActivityCompatible: false,
      identifier: "end-melodies",
      displayActivityName: true,
      rollMode: "default",
      chooseEffects: false,
      toggleEffect: false,
      ignoreFullCover: false,
      removeChatButtons: "default",
      magicEffect: magical,
      magicDamage: magical,
      noConcentrationCheck: false,
      autoCEEffects: "default",
    },
    roll: {
      formula: "",
      name: "",
      prompt: false,
      visible: false,
    },
    macroData: {
      name: "",
      command: "",
    },
    useConditionText: "",
    useConditionReason: "",
    effectConditionText: "false",
    ignoreTraits: {
      idi: false,
      idr: false,
      idv: false,
      ida: false,
    },
    isOverTimeFlag: false,
    overTimeProperties: {
      saveRemoves: true,
      preRemoveConditionText: "",
      postRemoveConditionText: "",
    },
    otherActivityId: "none",
  };
}

function ensureEndMelodiesActivity(item: FoundryItem): void {
  const system = item.system as Record<string, unknown>;
  const activities = system.activities as
    | Record<string, Record<string, unknown>>
    | undefined;
  if (!activities) return;

  const existing = Object.values(activities).find(
    (activity) => activity && songActivityMeta(activity).isEndMelodies,
  );
  const magical = resolveSongbookMagical(item);
  if (existing) {
    const midi =
      (existing.midiProperties as Record<string, unknown> | undefined) ?? {};
    existing.name = "End Melodies";
    existing.midiProperties = {
      ...midi,
      identifier: "end-melodies",
      displayActivityName: true,
      otherActivityCompatible: false,
      magicEffect: magical,
      magicDamage: magical,
    };
    return;
  }

  const activity = buildEndMelodiesActivity(magical);
  activities[String(activity._id)] = activity;
}

/**
 * Hunting Horn Songbook: name the primary attack, wire Item Macro + world flags
 * so Recital/Encore can toggle Melody feat auras (N dropdowns via maxActiveMelodies),
 * and inject End Melodies to cancel active auras at any rarity.
 */
export function applyHuntingHornSongbookOverlay(item: FoundryItem): boolean {
  if (!hasSongbookActivity(item)) return false;

  const system = item.system as Record<string, unknown>;
  const activities = system.activities as
    | Record<string, Record<string, unknown>>
    | undefined;
  if (!activities) return false;

  for (const activity of Object.values(activities)) {
    if (!activity || activity.type !== "attack") continue;
    const name = String(activity.name ?? "").trim();
    if (name !== "" && name.toLowerCase() !== "attack") continue;
    activity.name = "Attack";
    const midi =
      (activity.midiProperties as Record<string, unknown> | undefined) ?? {};
    activity.midiProperties = {
      ...midi,
      identifier: "attack",
      displayActivityName: true,
      otherActivityCompatible: false,
    };
    // Match Foundry-exported Attack activity shape for HH.
    if (activity.otherActivityId === "" || activity.otherActivityId == null) {
      activity.otherActivityId = "none";
    }
  }

  ensureEndMelodiesActivity(item);

  const maxActiveMelodies = resolveMaxActiveMelodies(item);
  const existingWorld =
    (item.flags?.world as Record<string, unknown> | undefined) ?? {};
  const existingHh =
    (existingWorld.hh as Record<string, unknown> | undefined) ?? {};

  item.flags = {
    ...item.flags,
    "midi-qol": {
      onUseMacroName: "[preTargeting]ItemMacro",
      onUseMacroParts: {
        items: [{ macroName: "ItemMacro", option: "preTargeting" }],
      },
    },
    itemacro: {
      macro: {
        name: item.name,
        type: "script",
        scope: "global",
        author: "",
        img: "icons/svg/dice-target.svg",
        command: HUNTING_HORN_RECITAL_ITEM_MACRO,
        folder: null,
        sort: 0,
        ownership: { default: 0 },
        flags: {},
        _stats: {
          coreVersion: FOUNDRY_EXPORT_TARGET.coreVersion,
          systemId: FOUNDRY_EXPORT_TARGET.systemId,
          systemVersion: FOUNDRY_EXPORT_TARGET.systemVersion,
        },
      },
    },
    world: {
      ...existingWorld,
      hh: {
        ...existingHh,
        songbook: true,
        melodyFlag: "world.hh.isMelody",
        maxActiveMelodies,
      },
    },
  };

  return true;
}

function activityMeta(activity: Record<string, unknown>): {
  name: string;
  id: string;
} {
  const name = String(activity.name ?? "").toLowerCase();
  const midi = activity.midiProperties as Record<string, unknown> | undefined;
  const id = String(midi?.identifier ?? "").toLowerCase();
  return { name, id };
}

function hasDualBladesAutomation(item: FoundryItem): boolean {
  const system = item.system as Record<string, unknown>;
  const activities = system.activities;
  if (!activities || typeof activities !== "object") return false;
  return Object.values(
    activities as Record<string, Record<string, unknown>>,
  ).some((activity) => {
    if (!activity) return false;
    const { name, id } = activityMeta(activity);
    return (
      id === "demon-dodge" ||
      id === "demon-mode" ||
      id === "archdemon-mode" ||
      id === "perfect-evade" ||
      name.includes("demon dodge") ||
      name.includes("demon mode") ||
      name.includes("archdemon") ||
      name.includes("perfect evade")
    );
  });
}

function resolveDualBladesTier(item: FoundryItem): string {
  const system = item.system as Record<string, unknown>;
  const rarity = String(system.rarity ?? "uncommon")
    .toLowerCase()
    .replace(/\s+/g, "");
  if (rarity === "veryrare") return "veryRare";
  return rarity || "uncommon";
}

function tagDualBladesEffect(
  effect: { name?: string; flags?: Record<string, unknown> },
  flagKey: "isDemonMode" | "isArchdemonMode",
): void {
  const flags = (effect.flags ?? {}) as Record<string, unknown>;
  const world = (flags.world as Record<string, unknown> | undefined) ?? {};
  const dualBlades =
    (world.dualBlades as Record<string, unknown> | undefined) ?? {};
  effect.flags = {
    ...flags,
    world: {
      ...world,
      dualBlades: {
        ...dualBlades,
        [flagKey]: true,
      },
    },
  };
}

/**
 * Dual Blades: wire ItemMacro (Demon Dodge AC / Archdemon cleanup) and tag
 * Demon Mode / Archdemon Mode AEs for macro gates.
 */
export function applyDualBladesDemonDodgeOverlay(item: FoundryItem): boolean {
  if (!hasDualBladesAutomation(item)) return false;

  const system = item.system as Record<string, unknown>;
  const activities = system.activities as
    | Record<string, Record<string, unknown>>
    | undefined;
  if (!activities) return false;

  for (const activity of Object.values(activities)) {
    if (!activity || activity.type !== "attack") continue;
    const name = String(activity.name ?? "").trim();
    if (name !== "" && name.toLowerCase() !== "attack") continue;
    activity.name = "Attack";
    const midi =
      (activity.midiProperties as Record<string, unknown> | undefined) ?? {};
    activity.midiProperties = {
      ...midi,
      identifier: "attack",
      displayActivityName: true,
    };
  }

  for (const effect of item.effects) {
    const effectName = effect.name ?? "";
    if (/^demon mode$/i.test(effectName)) {
      tagDualBladesEffect(effect, "isDemonMode");
    } else if (/^archdemon mode$/i.test(effectName)) {
      tagDualBladesEffect(effect, "isArchdemonMode");
    }
  }

  const existingWorld =
    (item.flags?.world as Record<string, unknown> | undefined) ?? {};
  const existingDb =
    (existingWorld.dualBlades as Record<string, unknown> | undefined) ?? {};
  const existingMidi =
    (item.flags?.["midi-qol"] as Record<string, unknown> | undefined) ?? {};

  item.flags = {
    ...item.flags,
    "midi-qol": {
      ...existingMidi,
      onUseMacroName: "[postActiveEffects]ItemMacro",
      onUseMacroParts: {
        items: [{ macroName: "ItemMacro", option: "postActiveEffects" }],
      },
    },
    itemacro: {
      macro: {
        name: item.name,
        type: "script",
        scope: "global",
        author: "",
        img: "icons/svg/dice-target.svg",
        command: DUAL_BLADES_DEMON_DODGE_ITEM_MACRO,
        folder: null,
        sort: 0,
        ownership: { default: 0 },
        flags: {},
        _stats: {
          coreVersion: FOUNDRY_EXPORT_TARGET.coreVersion,
          systemId: FOUNDRY_EXPORT_TARGET.systemId,
          systemVersion: FOUNDRY_EXPORT_TARGET.systemVersion,
        },
      },
    },
    world: {
      ...existingWorld,
      dualBlades: {
        ...existingDb,
        isDualBlades: true,
        tier: resolveDualBladesTier(item),
      },
    },
  };

  return true;
}

/**
 * Wire Knuckles (Rare+): companion STR save to snap Silkbind Tether.
 * The 15-ft leash is description-only; this activity rolls the start-of-turn save.
 */
export function applyWireKnucklesSilkbindOverlay(item: FoundryItem): boolean {
  if (!/^wire knuckles/i.test(item.name ?? "")) return false;

  const system = item.system as Record<string, unknown>;
  const activities = system.activities as
    | Record<string, Record<string, unknown>>
    | undefined;
  if (!activities) return false;

  const hasTether = Object.values(activities).some((activity) =>
    /^silkbind tether$/i.test(String(activity?.name ?? "").trim()),
  );
  if (!hasTether) return false;

  const snapId = foundryIdFromSeed("act-wire-knuckles-snap-silkbind");
  if (activities[snapId]) return true;

  const magical =
    Number((system.magicalBonus as number | null | undefined) ?? 0) > 0 ||
    (Array.isArray(system.properties) &&
      (system.properties as string[]).includes("mgc"));

  activities[snapId] = {
    _id: snapId,
    type: "save",
    sort: 600000,
    name: "Snap Silkbind",
    img: "icons/magic/control/debuff-chains-orb-purple-white.webp",
    activation: {
      type: "special",
      value: null,
      condition: "At the start of a Tethered creature's turn",
      override: false,
    },
    consumption: {
      scaling: { allowed: false, max: "" },
      spellSlot: false,
      targets: [],
    },
    description: {
      chatFlavor:
        "STR save vs Silkbind DC (8 + PB + STR or DEX — use the higher). On a success, remove the Tethered effect.",
    },
    duration: {
      value: "",
      units: "inst",
      concentration: false,
      override: false,
    },
    effects: [],
    range: {
      units: "ft",
      value: 5,
      special: "",
      override: false,
    },
    target: {
      template: {
        count: "",
        contiguous: false,
        type: "",
        size: "",
        width: "",
        height: "",
        units: "ft",
      },
      affects: {
        count: "1",
        type: "creature",
        choice: false,
        special: "",
      },
      prompt: true,
      override: false,
    },
    uses: {
      spent: 0,
      max: "",
      recovery: [],
    },
    midiProperties: {
      ignoreTraits: [],
      triggeredActivityId: "none",
      triggeredActivityConditionText: "",
      triggeredActivityTargets: "targets",
      triggeredActivityRollAs: "self",
      autoConsume: false,
      forceConsumeDialog: "default",
      forceRollDialog: "default",
      forceDamageDialog: "default",
      confirmTargets: "default",
      autoTargetType: "any",
      autoTargetAction: "default",
      automationOnly: false,
      otherActivityCompatible: true,
      identifier: "snap-silkbind",
      displayActivityName: true,
      rollMode: "default",
      chooseEffects: false,
      toggleEffect: false,
      ignoreFullCover: false,
      removeChatButtons: "default",
      magicEffect: magical,
      magicDamage: magical,
      noConcentrationCheck: false,
      autoCEEffects: "default",
    },
    damage: {
      parts: [],
      onSave: "none",
    },
    save: {
      ability: ["str"],
      dc: {
        // Prefer STR; chat notes DEX if higher (Foundry DC calc is single-ability).
        calculation: "str",
        formula: "",
      },
    },
    useConditionText: "",
    useConditionReason: "",
    effectConditionText: "",
    macroData: { name: "", command: "" },
    ignoreTraits: { idi: false, idr: false, idv: false, ida: false },
    isOverTimeFlag: false,
    overTimeProperties: {
      saveRemoves: true,
      preRemoveConditionText: "",
      postRemoveConditionText: "",
    },
    otherActivityId: "none",
  };

  const existingWorld =
    (item.flags?.world as Record<string, unknown> | undefined) ?? {};
  item.flags = {
    ...item.flags,
    world: {
      ...existingWorld,
      wireKnuckles: {
        hasSilkbind: true,
      },
    },
  };

  return true;
}
