/**
 * Foundry module stack required/recommended for Amellwind JSON exports.
 * Target: Core 12.331 / dnd5e 4.4.4. The JSON embeds schema and references;
 * companion modules resolve those references at runtime.
 */

export { FOUNDRY_EXPORT_TARGET } from "./target";

export type FoundryModuleTier = "required" | "recommended";

export type FoundryModuleGroup =
  | "midi"
  | "itemMacro"
  | "premades"
  | "text"
  | "aura"
  | "animation";

export interface FoundryModuleRequirement {
  id: string;
  name: string;
  tier: FoundryModuleTier;
  group: FoundryModuleGroup;
  /** Human-readable reason this module matters for the export. */
  reason: string;
  /** Compatible version pin for Foundry v12 / dnd5e 4.4.x when known. */
  versionHint?: string;
}

const MIDI_STACK: FoundryModuleRequirement[] = [
  {
    id: "midi-qol",
    name: "Midi QOL",
    tier: "required",
    group: "midi",
    reason:
      "Combat workflow, activity midiProperties, triggered activities, flags.midi-qol Active Effects, [pass]ItemMacro on-use hooks",
    versionHint: "12.4.27+ (dnd5e 4.2+; verified 12.4.64 on Core 12.331)",
  },
  {
    id: "dae",
    name: "Dynamic Active Effects",
    tier: "required",
    group: "midi",
    reason: "DAE flags (specialDuration, selfTargetAlways, stackable, showIcon) on Active Effects",
    versionHint: "12.x (Midi 12.4 requires the updated DAE)",
  },
  {
    id: "times-up",
    name: "Times Up",
    tier: "required",
    group: "midi",
    reason: "Effect expiry for rounds/turns and DAE specialDuration timing",
    versionHint: "12.x",
  },
  {
    id: "lib-wrapper",
    name: "libWrapper",
    tier: "required",
    group: "midi",
    reason: "Required dependency of Midi QOL",
  },
  {
    id: "socketlib",
    name: "socketlib",
    tier: "required",
    group: "midi",
    reason: "Required dependency of Midi QOL",
  },
];

const ITEM_MACRO_STACK: FoundryModuleRequirement[] = [
  {
    id: "itemacro",
    name: "Item Macro",
    tier: "required",
    group: "itemMacro",
    reason:
      "Stores flags.itemacro.macro on items; Midi calls it via [preTargeting]ItemMacro / [postActiveEffects]ItemMacro (disable sheet-hook and override-default-execution)",
    versionHint: "2.0.0–2.2.0 (Foundry 12; verified 12.331)",
  },
];

const OPTIONAL_AUTOMATION_STACK: FoundryModuleRequirement[] = [
  {
    id: "foundryvtt-simple-calendar",
    name: "Simple Calendar",
    tier: "recommended",
    group: "midi",
    reason:
      "World clock used with Times Up for accurate effect expiry by game time",
  },
  {
    id: "ActiveAuras",
    name: "Active Auras",
    tier: "recommended",
    group: "aura",
    reason:
      "Aura tab on Active Effects (`flags.ActiveAuras.*`) for stance/mode auras; required by Gambit's Premades on Foundry 12",
    versionHint: "v12 compatible",
  },
  {
    id: "region-attacher",
    name: "Region Attacher",
    tier: "recommended",
    group: "aura",
    reason: "Required by Gambit's Premades (Foundry 12 / dnd5e 4.x) for region-based automations",
    versionHint: "v12 compatible",
  },
];

const RICH_TEXT_STACK: FoundryModuleRequirement[] = [
  {
    id: "plutonium",
    name: "Plutonium",
    tier: "recommended",
    group: "text",
    reason:
      "Resolves @item / @spell / @feat / @variantrule / @book content links in descriptions (JSON still imports without it)",
    versionHint: "12.x (Foundry 12 / dnd5e 4.x)",
  },
];

const PREMADE_STACK: FoundryModuleRequirement[] = [
  {
    id: "chris-premades",
    name: "Cauldron of Plentiful Resources (CPR)",
    tier: "recommended",
    group: "premades",
    reason:
      "Actor/Item Medkit overlays PHB/XPHB spells, feats, and class features by English name + system.source.rules. Homebrew MH items keep Toolbox Midi/Item Macro and are skipped by name",
    versionHint: "Foundry 12 / dnd5e 4.4.x release (not CPR v13 / Foundry 13)",
  },
  {
    id: "gambits-premades",
    name: "Gambit's Premades",
    tier: "recommended",
    group: "premades",
    reason:
      "Reaction suite (Opportunity Attack, Counterspell, Silvery Barbs, …) via CPR Medkit additional-compendium priority, plus module settings. Matches feats like Sentinel / War Caster / Polearm Master by exact English name",
    versionHint: "1.0.1–1.0.56 (Foundry 12 / dnd5e 4.x)",
  },
];

const ANIMATION_STACK: FoundryModuleRequirement[] = [
  {
    id: "autoanimations",
    name: "Automated Animations",
    tier: "recommended",
    group: "animation",
    reason: "Spell/weapon animations matched by item name",
  },
  {
    id: "sequencer",
    name: "Sequencer",
    tier: "recommended",
    group: "animation",
    reason: "Animation runtime used by Automated Animations and Gambit's Premades",
  },
  {
    id: "JB2A_DnD5e",
    name: "JB2A Animated Assets",
    tier: "recommended",
    group: "animation",
    reason: "Animation asset pack (free or Patreon)",
  },
];

export type FoundryExportKind = "actor" | "weapon" | "rune";

function dedupeById(
  modules: FoundryModuleRequirement[],
): FoundryModuleRequirement[] {
  const seen = new Set<string>();
  const out: FoundryModuleRequirement[] = [];
  for (const mod of modules) {
    if (seen.has(mod.id)) continue;
    seen.add(mod.id);
    out.push(mod);
  }
  return out;
}

/** Module requirements for a given export surface. */
export function getFoundryModuleRequirements(
  kind: FoundryExportKind,
): FoundryModuleRequirement[] {
  if (kind === "actor") {
    return dedupeById([
      ...MIDI_STACK,
      ...ITEM_MACRO_STACK,
      ...OPTIONAL_AUTOMATION_STACK,
      ...RICH_TEXT_STACK,
      ...PREMADE_STACK,
      ...ANIMATION_STACK,
    ]);
  }
  if (kind === "weapon") {
    return dedupeById([
      ...MIDI_STACK,
      ...ITEM_MACRO_STACK,
      ...OPTIONAL_AUTOMATION_STACK,
      ...RICH_TEXT_STACK,
      ...PREMADE_STACK,
      ...ANIMATION_STACK,
    ]);
  }
  return [...RICH_TEXT_STACK];
}

const GROUP_LABEL: Record<FoundryModuleGroup, string> = {
  midi: "Midi QoL",
  itemMacro: "Item Macro",
  premades: "CPR / Gambit's Premades",
  text: "Plutonium",
  aura: "Auras / regions",
  animation: "Animations",
};

export function formatModuleRequirementsSummary(
  kind: FoundryExportKind,
): { required: string; recommended: string } {
  const all = getFoundryModuleRequirements(kind);
  const required = all
    .filter((m) => m.tier === "required")
    .map((m) => m.name)
    .join(", ");
  const recommended = all
    .filter((m) => m.tier === "recommended")
    .map((m) => m.name)
    .join(", ");
  return { required, recommended };
}

/** Grouped list for the export notice UI. */
export function groupFoundryModuleRequirements(
  kind: FoundryExportKind,
): { group: FoundryModuleGroup; label: string; modules: FoundryModuleRequirement[] }[] {
  const all = getFoundryModuleRequirements(kind);
  const order: FoundryModuleGroup[] = [
    "midi",
    "itemMacro",
    "premades",
    "text",
    "aura",
    "animation",
  ];
  return order
    .map((group) => ({
      group,
      label: GROUP_LABEL[group],
      modules: all.filter((m) => m.group === group),
    }))
    .filter((entry) => entry.modules.length > 0);
}