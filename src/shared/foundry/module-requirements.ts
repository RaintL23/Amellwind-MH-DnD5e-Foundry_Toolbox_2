/**
 * Foundry module stack required/recommended for Amellwind JSON exports.
 * The JSON embeds dnd5e schema and references (flags, enrichers, names);
 * companion modules resolve those references at runtime.
 */

export { FOUNDRY_EXPORT_TARGET } from "./target";

export type FoundryModuleTier = "required" | "recommended";

export interface FoundryModuleRequirement {
  id: string;
  name: string;
  tier: FoundryModuleTier;
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
    reason:
      "Combat workflow, midiProperties on activities, triggered activities, flags.midi-qol Active Effects",
    versionHint: "12.4.28+ (dnd5e 4.2+; ActivityOverTime)",
  },
  {
    id: "dae",
    name: "Dynamic Active Effects",
    tier: "required",
    reason: "DAE flags (specialDuration, selfTargetAlways, stackable) on Active Effects",
    versionHint: "12.x",
  },
  {
    id: "times-up",
    name: "Times Up",
    tier: "required",
    reason: "Effect expiry for rounds/turns and DAE specialDuration timing",
    versionHint: "12.x",
  },
  {
    id: "lib-wrapper",
    name: "libWrapper",
    tier: "required",
    reason: "Required dependency of Midi QOL",
  },
  {
    id: "socketlib",
    name: "socketlib",
    tier: "required",
    reason: "Required dependency of Midi QOL",
  },
];

const OPTIONAL_AUTOMATION_STACK: FoundryModuleRequirement[] = [
  {
    id: "foundryvtt-simple-calendar",
    name: "Simple Calendar",
    tier: "recommended",
    reason:
      "World clock used with Times Up for accurate effect expiry by game time",
  },
  {
    id: "ActiveAuras",
    name: "Active Auras",
    tier: "recommended",
    reason:
      "Aura tab on Active Effects (`flags.ActiveAuras.*`) for stance/mode auras on Foundry v12; self transfer AEs work without it",
    versionHint: "v12 compatible",
  },
];

const RICH_TEXT_STACK: FoundryModuleRequirement[] = [
  {
    id: "plutonium",
    name: "Plutonium",
    tier: "recommended",
    reason:
      "Resolves @item / @variantrule / @spell content links in descriptions (JSON still imports without it)",
  },
];

const AUTOMATION_STACK: FoundryModuleRequirement[] = [
  {
    id: "chris-premades",
    name: "Cauldron of Plentiful Resources (CPR)",
    tier: "recommended",
    reason:
      "Runtime macros/premades matched by item name; JSON emits canonical English names and static AE overlays",
  },
];

const ANIMATION_STACK: FoundryModuleRequirement[] = [
  {
    id: "autoanimations",
    name: "Automated Animations",
    tier: "recommended",
    reason: "Spell/weapon animations matched by item name",
  },
  {
    id: "sequencer",
    name: "Sequencer",
    tier: "recommended",
    reason: "Animation runtime used by Automated Animations",
  },
  {
    id: "JB2A_DnD5e",
    name: "JB2A Animated Assets",
    tier: "recommended",
    reason: "Animation asset pack (free or Patreon)",
  },
];

export type FoundryExportKind = "actor" | "weapon" | "rune";

/** Module requirements for a given export surface. */
export function getFoundryModuleRequirements(
  kind: FoundryExportKind,
): FoundryModuleRequirement[] {
  const base = [...MIDI_STACK, ...RICH_TEXT_STACK];
  if (kind === "actor") {
    return [...base, ...AUTOMATION_STACK, ...ANIMATION_STACK];
  }
  if (kind === "weapon") {
    return [
      ...base,
      ...OPTIONAL_AUTOMATION_STACK,
      ...AUTOMATION_STACK,
      ...ANIMATION_STACK,
    ];
  }
  // Runes from the builder are description-only; Plutonium helps @spell enrichers
  return [...RICH_TEXT_STACK];
}

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
