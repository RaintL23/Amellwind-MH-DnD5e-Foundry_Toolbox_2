import type { FoundryItem } from "@/shared/foundry";
import { FOUNDRY_EXPORT_TARGET } from "@/shared/foundry";
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

function hasRecitalActivity(item: FoundryItem): boolean {
  const system = item.system as Record<string, unknown>;
  const activities = system.activities;
  if (!activities || typeof activities !== "object") return false;
  return Object.values(activities as Record<string, Record<string, unknown>>).some(
    (activity) => {
      if (!activity) return false;
      const name = String(activity.name ?? "").toLowerCase();
      const midi = activity.midiProperties as
        | Record<string, unknown>
        | undefined;
      const id = String(midi?.identifier ?? "").toLowerCase();
      return name === "recital" || id === "recital";
    },
  );
}

/**
 * Hunting Horn Songbook: name the primary attack, wire Item Macro + world flags
 * so Recital can toggle Melody feat auras.
 */
export function applyHuntingHornSongbookOverlay(item: FoundryItem): boolean {
  if (!hasRecitalActivity(item)) return false;

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
      hh: {
        songbook: true,
        melodyFlag: "world.hh.isMelody",
      },
    },
  };

  return true;
}
