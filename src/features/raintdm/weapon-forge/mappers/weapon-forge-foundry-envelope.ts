import type { FoundryItem } from "@/shared/foundry";
import { FOUNDRY_EXPORT_TARGET, foundryIdFromSeed, embedItemMacro } from "@/shared/foundry";
import { DUAL_BLADES_DEMON_DODGE_ITEM_MACRO } from "./dual-blades-demon-dodge.macro";
import { DUAL_REPEATERS_MAGAZINES_ITEM_MACRO } from "./dual-repeaters-magazines.macro";
import { HUNTING_HORN_RECITAL_ITEM_MACRO } from "./hunting-horn-recital.macro";
import { WIRE_KNUCKLES_SILKBIND_ITEM_MACRO } from "./wire-knuckles-silkbind.macro";
import type { CustomWeapon } from "../types/weapon-forge.types";
import { getAssignedFeaturesForRow } from "../utils/weapon-forge-features.utils";
import { listUnlockedMagazineKeys } from "./weapon-forge-magazine.export";

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
  isSoloRecital: boolean;
  isEncore: boolean;
  isEndMelodies: boolean;
} {
  const name = String(activity.name ?? "").toLowerCase();
  const midi = activity.midiProperties as Record<string, unknown> | undefined;
  const id = String(midi?.identifier ?? "").toLowerCase();
  const isSoloRecital =
    id === "solo-recital" ||
    id === "solo-recital-upgrade" ||
    name.includes("solo recital");
  const isTrio =
    name.includes("magnificent trio") || id.includes("magnificent");
  return {
    // Exact Recital leaf — do not treat Solo Recital as Recital.
    isRecital:
      !isSoloRecital &&
      !isTrio &&
      (name === "recital" || id === "recital" || name.includes("recital")),
    isSoloRecital,
    isEncore:
      isTrio ||
      name === "encore" ||
      id === "encore" ||
      name.includes("encore"),
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
    const { isRecital, isSoloRecital, isEncore } = songActivityMeta(activity);
    return isRecital || isSoloRecital || isEncore;
  });
}

function resolveMaxActiveMelodies(item: FoundryItem): number {
  const system = item.system as Record<string, unknown>;
  const activities = system.activities;
  if (!activities || typeof activities !== "object") return 1;
  const list = Object.values(
    activities as Record<string, Record<string, unknown>>,
  );
  const hasTrio = list.some((activity) => {
    if (!activity) return false;
    const name = String(activity.name ?? "").toLowerCase();
    const midi = activity.midiProperties as Record<string, unknown> | undefined;
    const id = String(midi?.identifier ?? "").toLowerCase();
    return name.includes("magnificent trio") || id.includes("magnificent");
  });
  if (hasTrio) return 3;
  const hasEncore = list.some(
    (activity) => activity && songActivityMeta(activity).isEncore,
  );
  return hasEncore ? 2 : 1;
}

/** Solo Recital slot count (independent of Encore / Magnificent Trio). */
function resolveMaxSoloMelodies(item: FoundryItem): number {
  const system = item.system as Record<string, unknown>;
  const activities = system.activities;
  if (!activities || typeof activities !== "object") return 1;
  const hasUpgrade = Object.values(
    activities as Record<string, Record<string, unknown>>,
  ).some((activity) => {
    if (!activity) return false;
    const name = String(activity.name ?? "").toLowerCase();
    const midi = activity.midiProperties as Record<string, unknown> | undefined;
    const id = String(midi?.identifier ?? "").toLowerCase();
    return (
      name.includes("solo recital upgrade") || id === "solo-recital-upgrade"
    );
  });
  return hasUpgrade ? 2 : 1;
}

function resolveSongbookMagical(item: FoundryItem): boolean {
  const system = item.system as Record<string, unknown>;
  const activities = system.activities;
  if (!activities || typeof activities !== "object") return false;
  return Object.values(
    activities as Record<string, Record<string, unknown>>,
  ).some((activity) => {
    if (!activity) return false;
    const { isRecital, isSoloRecital, isEncore } = songActivityMeta(activity);
    if (!isRecital && !isSoloRecital && !isEncore) return false;
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
  const maxSoloMelodies = resolveMaxSoloMelodies(item);
  const existingWorld =
    (item.flags?.world as Record<string, unknown> | undefined) ?? {};
  const existingHh =
    (existingWorld.hh as Record<string, unknown> | undefined) ?? {};

  const actNames = Object.values(activities).map((a) =>
    String(a?.name ?? "").toLowerCase(),
  );
  const songbookMastery =
    actNames.some((n) => n.includes("songbook mastery"))
    || /songbook mastery/i.test(
      (system.description as { value?: string } | undefined)?.value ?? "",
    );
  const hasInfernal = actNames.some((n) => n.includes("infernal melody"));

  embedItemMacro(item, {
    command: HUNTING_HORN_RECITAL_ITEM_MACRO,
    passes: ["preTargeting"],
    midiMode: "replace",
  });

  item.flags = {
    ...item.flags,
    world: {
      ...existingWorld,
      hh: {
        ...existingHh,
        songbook: true,
        melodyFlag: "world.hh.isMelody",
        maxActiveMelodies,
        maxSoloMelodies,
        songbookMastery,
        infernalMelody: hasInfernal,
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
  flagKey: "isDemonMode" | "isArchdemonMode" | "isHeavenlyBladeDance",
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
    } else if (/heavenly\s*blade\s*dance/i.test(effectName)) {
      tagDualBladesEffect(effect, "isHeavenlyBladeDance");
    }
  }

  const actNames = Object.values(activities).map((a) =>
    String(a?.name ?? "").toLowerCase(),
  );
  const hasDemonDance = actNames.some((n) => n.includes("demon dance"));
  const hasHeavenly = actNames.some((n) => n.includes("heavenly blade"))
    || item.effects.some((e) => /heavenly\s*blade/i.test(e.name ?? ""));
  const dualMastery =
    String(system.mastery ?? "").toLowerCase() === "nick"
    || actNames.some((n) => n.includes("dual mastery"))
    || /dual mastery/i.test(
      (item.system as { description?: { value?: string } }).description?.value
        ?? "",
    );

  if (dualMastery) {
    system.mastery = "nick";
  }

  const existingWorld =
    (item.flags?.world as Record<string, unknown> | undefined) ?? {};
  const existingDb =
    (existingWorld.dualBlades as Record<string, unknown> | undefined) ?? {};

  embedItemMacro(item, {
    command: DUAL_BLADES_DEMON_DODGE_ITEM_MACRO,
    passes: ["postActiveEffects"],
  });

  item.flags = {
    ...item.flags,
    world: {
      ...existingWorld,
      dualBlades: {
        ...existingDb,
        isDualBlades: true,
        tier: resolveDualBladesTier(item),
        dualMastery,
        demonDance: hasDemonDance,
        heavenlyBladeDance: hasHeavenly,
      },
    },
  };

  return true;
}

/**
 * Wire Knuckles (Rare+): Silkbind tether zone, auto-grapple, and Snap Tether.
 *
 * - Silkbind Tether / Upgrade → Item Macro places a radius template + grants the
 *   target a temporary Snap Tether feat (STR save clears zone + AE).
 * - Silkbind Grapple → applies Grappled; requires Tethered (macro warns).
 * - Snap Tether (on this weapon) → hunter releases tether with no save.
 */
export function applyWireKnucklesSilkbindOverlay(item: FoundryItem): boolean {
  if (!/^wire knuckles/i.test(item.name ?? "")) return false;

  const system = item.system as Record<string, unknown>;
  const activities = system.activities as
    | Record<string, Record<string, unknown>>
    | undefined;
  if (!activities) return false;

  // Foundry rarity may be "veryRare" or "very-rare".
  const rarityKey = String(system.rarity ?? "")
    .toLowerCase()
    .replace(/[\s_-]+/g, "");

  const isTetherActivity = (name: string) =>
    /^silkbind tether$/i.test(name) || /^silkbind upgrade\b/i.test(name);

  const hasTether = Object.values(activities).some((activity) =>
    isTetherActivity(String(activity?.name ?? "").trim()),
  );
  if (!hasTether) return false;

  const tetherRadius =
    rarityKey === "veryrare" || rarityKey === "legendary" ? 10 : 15;
  const dcBonus =
    rarityKey === "legendary" ? 2 : rarityKey === "veryrare" ? 1 : 0;
  const dcNote =
    dcBonus > 0
      ? `Silkbind DC +${dcBonus}${rarityKey === "legendary" ? " (Legendary upgrade)" : ""}. Tether radius ${tetherRadius} ft.`
      : `Tether radius ${tetherRadius} ft.`;

  const magical =
    Number((system.magicalBonus as number | null | undefined) ?? 0) > 0 ||
    (Array.isArray(system.properties) &&
      (system.properties as string[]).includes("mgc"));

  // ── Silkbind Tether / Upgrade flavor + AE description ──
  for (const activity of Object.values(activities)) {
    if (!isTetherActivity(String(activity?.name ?? "").trim())) continue;
    activity.description = {
      ...((activity.description as Record<string, unknown> | undefined) ?? {}),
      chatFlavor: `Expend 2 Wirebugs: apply Tethered (cannot move more than ${tetherRadius} ft from the embed point). ${dcNote} Target gains Snap Tether (STR save). Hunter may Snap Tether to release safely.`,
    };
    // Keep Midi identifier stable for the Item Macro.
    const midi =
      (activity.midiProperties as Record<string, unknown> | undefined) ?? {};
    activity.midiProperties = {
      ...midi,
      identifier: "silkbind-tether",
      displayActivityName: true,
    };
  }

  const tetherEffect = item.effects.find((e) =>
    /^tethered$/i.test(String(e.name ?? "")),
  );
  if (tetherEffect) {
    tetherEffect.description = `Tethered by ironsilk. Cannot move more than ${tetherRadius} feet away from the point where the silk was embedded. Use your Snap Tether feat to attempt a Strength saving throw against the silkbinder's Silkbind DC; on a success the silk snaps and this effect ends.`;
    const efFlags = (tetherEffect.flags ?? {}) as Record<string, unknown>;
    const efWorld = (efFlags.world as Record<string, unknown> | undefined) ?? {};
    tetherEffect.flags = {
      ...efFlags,
      dae: {
        ...((efFlags.dae as Record<string, unknown> | undefined) ?? {}),
        stackable: "noneName",
        showIcon: true,
      },
      world: {
        ...efWorld,
        wireKnuckles: {
          isTethered: true,
        },
      },
    };
  }

  // ── Silkbind Grapple: target creature + Grappled status AE ──
  let grappledEffect = item.effects.find((e) =>
    /^grappled \(silkbind\)$/i.test(String(e.name ?? "")),
  );
  if (!grappledEffect) {
    const grappledId = foundryIdFromSeed("eff-wire-knuckles-silkbind-grapple");
    grappledEffect = {
      _id: grappledId,
      name: "Grappled (Silkbind)",
      img: "icons/skills/melee/unarmed-punch-fist-yellow-red.webp",
      description:
        "Grappled by Silkbind. Succeeds automatically while Tethered (even up to two sizes larger). Does not end if the silkbinder becomes Incapacitated, and remains after the tether ends.",
      changes: [],
      disabled: false,
      duration: {
        startTime: null,
        seconds: null,
        combat: null,
        rounds: null,
        turns: null,
        startRound: null,
        startTurn: null,
      },
      origin: null,
      transfer: false,
      statuses: ["grappled"],
      type: "base",
      system: {},
      tint: "#ffffff",
      sort: 0,
      flags: {
        dae: {
          stackable: "noneName",
          showIcon: true,
        },
        world: {
          wireKnuckles: {
            isSilkbindGrapple: true,
          },
        },
      },
      _stats: {
        compendiumSource: null,
        duplicateSource: null,
        coreVersion: FOUNDRY_EXPORT_TARGET.coreVersion,
        systemId: FOUNDRY_EXPORT_TARGET.systemId,
        systemVersion: FOUNDRY_EXPORT_TARGET.systemVersion,
        createdTime: null,
        modifiedTime: null,
        lastModifiedBy: null,
      },
    };
    item.effects.push(grappledEffect);
  }

  for (const activity of Object.values(activities)) {
    if (!/^silkbind grapple$/i.test(String(activity?.name ?? "").trim())) {
      continue;
    }
    activity.description = {
      ...((activity.description as Record<string, unknown> | undefined) ?? {}),
      chatFlavor:
        "Automatically Grapple a Tethered creature (even up to two sizes larger). No contested check. Grapple does not end if you become Incapacitated, and remains after the tether ends.",
    };
    activity.range = {
      value: "5",
      units: "ft",
      special: "",
      override: false,
    };
    activity.target = {
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
    };
    const linked = Array.isArray(activity.effects)
      ? (activity.effects as Array<{ _id: string }>)
      : [];
    if (!linked.some((e) => e._id === grappledEffect!._id)) {
      activity.effects = [...linked, { _id: grappledEffect!._id }];
    }
  }

  // ── Snap Tether on weapon = hunter release (no save) ──
  // Remove legacy Snap Silkbind save if present under the old seed id.
  const legacySnapId = foundryIdFromSeed("act-wire-knuckles-snap-silkbind");
  if (activities[legacySnapId]) {
    delete activities[legacySnapId];
  }
  for (const [id, activity] of Object.entries(activities)) {
    if (/^snap silkbind$/i.test(String(activity?.name ?? "").trim())) {
      delete activities[id];
    }
  }

  const snapId = foundryIdFromSeed("act-wire-knuckles-snap-tether");
  const maxSort = Math.max(
    0,
    ...Object.values(activities).map((a) => Number(a.sort ?? 0) || 0),
  );
  activities[snapId] = {
    _id: snapId,
    type: "utility",
    sort: maxSort + 100000,
    name: "Snap Tether",
    img: "icons/magic/control/debuff-chains-purple.webp",
    activation: {
      type: "special",
      value: null,
      condition: "While a creature is Tethered by your Silkbind",
      override: false,
    },
    consumption: {
      scaling: { allowed: false, max: "" },
      spellSlot: false,
      targets: [],
    },
    description: {
      chatFlavor:
        "Safely release your ironsilk tether (no save). Removes Tethered, the tether zone template, and the target's Snap Tether feat.",
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
      value: 30,
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
      identifier: "snap-tether",
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
    useConditionText: "",
    useConditionReason: "",
    effectConditionText: "",
    roll: { formula: "", name: "", prompt: false, visible: false },
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

  embedItemMacro(item, {
    command: WIRE_KNUCKLES_SILKBIND_ITEM_MACRO,
    passes: ["postActiveEffects"],
    midiMode: "merge",
  });

  const existingWorld =
    (item.flags?.world as Record<string, unknown> | undefined) ?? {};
  item.flags = {
    ...item.flags,
    world: {
      ...existingWorld,
      wireKnuckles: {
        hasSilkbind: true,
        tetherRadius,
        dcBonus,
      },
    },
  };

  return true;
}

function isDualRepeatersWeapon(item: FoundryItem): boolean {
  const system = item.system as Record<string, unknown>;
  const identifier = String(system.identifier ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
  if (identifier === "dualrepeaters") return true;
  return /^dual\s+repeaters\b/i.test(item.name ?? "");
}

/**
 * Dual Repeaters: Magazines are consumables that fill weapon Charges (6 Volleys).
 * Wire ItemMacro for Magazines / Empowered Reload dialogs + Attack charge spend.
 * Charges are shown on the weapon sheet via system.uses (Bow-style resource UI).
 */
export function applyDualRepeatersOverlay(
  item: FoundryItem,
  weapon?: CustomWeapon,
  rarityIndex = 0,
): boolean {
  if (!isDualRepeatersWeapon(item)) return false;

  const system = item.system as Record<string, unknown>;
  const activities = system.activities as
    | Record<string, Record<string, unknown>>
    | undefined;
  if (!activities) return false;

  const hasMagazinesActivity = Object.values(activities).some((activity) => {
    const name = String(activity?.name ?? "").toLowerCase();
    const id = String(
      (activity?.midiProperties as { identifier?: string } | undefined)
        ?.identifier ?? "",
    ).toLowerCase();
    return (
      id === "magazines" ||
      id === "empowered-reload" ||
      name === "magazines" ||
      name.includes("empowered reload")
    );
  });
  if (!hasMagazinesActivity) return false;

  // Charges (Volleys) on the weapon sheet — starts empty until a Magazine is loaded.
  system.uses = { spent: 6, max: "6", recovery: [] };

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
    // Each Attack spends 1 Charge (weapon system.uses).
    activity.consumption = {
      scaling: { allowed: false },
      spellSlot: false,
      targets: [
        {
          type: "itemUses",
          target: "",
          value: "1",
          scaling: { mode: "", formula: "" },
        },
      ],
    };
  }

  const unlockedMagazines = weapon
    ? listUnlockedMagazineKeys(weapon, rarityIndex)
    : ["normal", "blaze", "cryo", "storm", "slime"];

  const existingWorld =
    (item.flags?.world as Record<string, unknown> | undefined) ?? {};
  const existingDr =
    (existingWorld.dualRepeaters as Record<string, unknown> | undefined) ?? {};

  const featureNames = weapon
    ? (() => {
        const names: string[] = [];
        const end = Math.min(rarityIndex, weapon.rarityRows.length - 1);
        for (let i = 0; i <= end; i++) {
          const row = weapon.rarityRows[i];
          if (!row) continue;
          for (const ref of getAssignedFeaturesForRow(
            row,
            weapon.customFeatures,
          )) {
            names.push(ref.name.trim().toLowerCase());
          }
        }
        return names;
      })()
    : [];

  const capacitiveFrame = featureNames.some((n) =>
    n.includes("capacitive frame"),
  );
  const tacticalMods = featureNames.some((n) =>
    n.includes("tactical modifications"),
  );
  const perfectEmpowerment = featureNames.some((n) =>
    n.includes("perfect empowerment"),
  );

  // Rename Perfect Empowerment leaf (or keep Empowered Reload renamed).
  for (const activity of Object.values(activities)) {
    const nm = String(activity?.name ?? "").trim();
    if (
      perfectEmpowerment
      && (/^empowered\s*reload$/i.test(nm) || /^perfect\s*empowerment$/i.test(nm))
    ) {
      activity.name = "Perfect Empowerment";
      const midi =
        (activity.midiProperties as Record<string, unknown> | undefined) ?? {};
      activity.midiProperties = {
        ...midi,
        identifier: "empowered-reload",
        displayActivityName: true,
      };
      (activity.description as { chatFlavor?: string }).chatFlavor =
        "Expend one Magazine to reload Charges (6). Empowered (+1d6) if a hostile is within attack range (30 ft, or 60 ft if Scoped).";
    }
  }

  embedItemMacro(item, {
    command: DUAL_REPEATERS_MAGAZINES_ITEM_MACRO,
    passes: ["preTargeting", "postAttackRoll", "postDamageRoll"],
  });

  item.flags = {
    ...item.flags,
    world: {
      ...existingWorld,
      dualRepeaters: {
        ...existingDr,
        isDualRepeaters: true,
        volleysMax: 6,
        unlockedMagazines,
        capacitiveFrame,
        tacticalModifications: tacticalMods,
        perfectEmpowerment,
        empoweredDamage: perfectEmpowerment ? "1d6" : "1d4",
      },
    },
  };

  return true;
}

/**
 * Sword and Shield Legendary: True Perfect Rush adds a companion CON save for Stunned.
 */
export function polishSwordAndShieldTruePerfectRush(item: FoundryItem): boolean {
  if (!/^sword and shield/i.test(item.name ?? "")) return false;

  const system = item.system as Record<string, unknown>;
  const activities = system.activities as
    | Record<string, Record<string, unknown>>
    | undefined;
  if (!activities) return false;

  const perfect = Object.values(activities).find((a) =>
    /^perfect\s*rush$/i.test(String(a?.name ?? "").trim()),
  );
  if (!perfect) return false;

  const isLegendary = /legendary/i.test(item.name ?? "");
  const dmg = perfect.damage as
    | { parts?: Array<{ number?: number; denomination?: number }> }
    | undefined;
  const isTrue =
    isLegendary
    || (dmg?.parts?.[0]?.number === 5 && dmg?.parts?.[0]?.denomination === 6);
  if (!isTrue) return false;

  (perfect.description as { chatFlavor?: string }).chatFlavor =
    "Once per turn after Sword + Shield Strike hit the same creature: +5d6. Target CON save (DC 8 + PB + STR or DEX) or Stunned until start of its next turn.";

  const stunId = foundryIdFromSeed("act-sns-true-perfect-rush-stun");
  if (!activities[stunId]) {
    activities[stunId] = {
      _id: stunId,
      type: "save",
      sort: Number(perfect.sort ?? 500000) + 1000,
      name: "True Perfect Rush: Stun",
      img: "icons/magic/control/silhouette-fall-slip-prone.webp",
      activation: {
        type: "special",
        value: null,
        condition: "After Perfect Rush damage hits",
        override: false,
      },
      consumption: {
        scaling: { allowed: false, max: "" },
        spellSlot: false,
        targets: [],
      },
      description: {
        chatFlavor:
          "CON save vs SnS DC or Stunned until the start of the target's next turn.",
      },
      duration: {
        value: "",
        units: "inst",
        concentration: false,
        override: false,
      },
      effects: [],
      range: { units: "self", special: "", override: false },
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
      uses: { spent: 0, max: "", recovery: [] },
      damage: { parts: [], onSave: "none" },
      save: {
        ability: ["con"],
        dc: { calculation: "str", formula: "" },
      },
      midiProperties: {
        identifier: "true-perfect-rush-stun",
        displayActivityName: true,
      },
    };
  }

  return true;
}
