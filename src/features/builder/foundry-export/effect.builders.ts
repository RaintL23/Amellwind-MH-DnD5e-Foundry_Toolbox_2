import type { FoundryActiveEffect, FoundryEffectChange } from "./foundry.types";
import { buildStats, foundryId } from "./foundry-id.utils";

const DEFAULT_ICON = "systems/dnd5e/icons/svg/items/equipment.svg";

/**
 * ActiveEffect change modes (Foundry `CONST.ACTIVE_EFFECT_MODES`). Exposed so
 * the automation registry can author changes with readable mode names.
 */
export const EFFECT_MODE = {
  CUSTOM: 0,
  MULTIPLY: 1,
  ADD: 2,
  DOWNGRADE: 3,
  UPGRADE: 4,
  OVERRIDE: 5,
} as const;

const DEFAULT_DURATION: Record<string, unknown> = {
  startTime: null,
  seconds: null,
  combat: null,
  rounds: null,
  turns: null,
  startRound: null,
  startTurn: null,
};

interface BuildEffectOptions {
  name: string;
  changes: FoundryEffectChange[];
  img?: string;
  description?: string;
  transfer?: boolean;
  disabled?: boolean;
  statuses?: string[];
  /** Partial duration merged over the empty default (e.g. `{ seconds: 60 }`). */
  duration?: Record<string, unknown>;
  /** Extra effect flags (e.g. `dae.specialDuration`, `core.statusId`). */
  flags?: Record<string, unknown>;
}

/** Builds a Foundry v12 ActiveEffect document (dnd5e 4.x shape). */
export function buildEffect(opts: BuildEffectOptions): FoundryActiveEffect {
  return {
    _id: foundryId(),
    name: opts.name,
    img: opts.img ?? DEFAULT_ICON,
    description: opts.description ?? "",
    changes: opts.changes,
    disabled: opts.disabled ?? false,
    duration: { ...DEFAULT_DURATION, ...(opts.duration ?? {}) },
    origin: null,
    transfer: opts.transfer ?? true,
    statuses: opts.statuses ?? [],
    type: "base",
    system: {},
    tint: "#ffffff",
    sort: 0,
    flags: opts.flags ?? {},
    _stats: buildStats(),
  };
}

/** AC calculation override (e.g. Unarmored Defense → "unarmoredMonk"). */
export function acCalcEffect(name: string, calc: string): FoundryActiveEffect {
  return buildEffect({
    name,
    changes: [
      { key: "system.attributes.ac.calc", mode: EFFECT_MODE.OVERRIDE, value: calc, priority: 20 },
    ],
  });
}
