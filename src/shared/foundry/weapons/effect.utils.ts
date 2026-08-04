/**
 * Resolve + build Foundry Active Effects from weapon feature automation params.
 * Shared by the Foundry compiler and the Weapon Forge AE editor/preview.
 */

import { buildEffect, EFFECT_MODE } from "../effects";
import type { FoundryActiveEffect } from "../types";
import { foundryIdFromSeed } from "../id";
import type { WeaponActivityParams } from "./activity.types";
import {
  toFoundryChanges,
  type WeaponActiveEffectConfig,
} from "./effect.types";

function asTrimmed(value: string | undefined): string | undefined {
  const t = value?.trim();
  return t || undefined;
}

/**
 * Merge legacy flat AE params (`effectTransfer`, `effectChanges`, …) with the
 * nested `params.activeEffect` object (nested wins on conflict).
 */
export function resolveWeaponActiveEffectConfig(
  params: WeaponActivityParams,
): WeaponActiveEffectConfig {
  const nested = params.activeEffect ?? {};
  const changes = [
    ...(params.effectChanges ?? []),
    ...(nested.changes ?? []),
  ];

  if (params.acBonus?.trim()) {
    changes.push({
      key: "system.attributes.ac.bonus",
      mode: EFFECT_MODE.ADD,
      value: params.acBonus.trim(),
      priority: 20,
    });
  }
  if (params.speedBonus?.trim()) {
    changes.push({
      key: "system.attributes.movement.walk",
      mode: EFFECT_MODE.ADD,
      value: params.speedBonus.trim(),
      priority: 20,
    });
  }

  const specialDuration = [
    ...(params.specialDuration ?? []),
    ...(nested.specialDuration ?? []),
  ];
  const statuses = [...(params.statuses ?? []), ...(nested.statuses ?? [])];

  return {
    ...nested,
    transfer: nested.transfer ?? params.effectTransfer,
    durationSeconds:
      nested.durationSeconds !== undefined
        ? nested.durationSeconds
        : (params.durationSeconds ?? null),
    durationRounds:
      nested.durationRounds !== undefined
        ? nested.durationRounds
        : (params.durationRounds ?? null),
    specialDuration: specialDuration.length ? specialDuration : undefined,
    statuses: statuses.length ? statuses : undefined,
    changes: changes.length ? changes : undefined,
  };
}

/** True when resolved AE config has enough data to emit an Active Effect. */
export function hasWeaponActiveEffectPayload(
  params: WeaponActivityParams,
): boolean {
  const cfg = resolveWeaponActiveEffectConfig(params);
  return (
    (cfg.changes?.length ?? 0) > 0 ||
    (cfg.statuses?.length ?? 0) > 0 ||
    (cfg.statusesSeparate?.length ?? 0) > 0 ||
    !!cfg.isAura ||
    cfg.transfer === true ||
    cfg.disabled === true ||
    !!asTrimmed(cfg.description) ||
    !!asTrimmed(cfg.disableCondition) ||
    !!asTrimmed(cfg.img) ||
    (!!asTrimmed(cfg.tint) &&
      cfg.tint!.trim().toLowerCase() !== "#ffffff") ||
    !!asTrimmed(cfg.stackable) ||
    !!asTrimmed(cfg.macroRepeat) ||
    (cfg.specialDuration?.length ?? 0) > 0 ||
    cfg.durationSeconds != null ||
    cfg.durationRounds != null ||
    cfg.durationTurns != null ||
    !!asTrimmed(cfg.durationSecondsFormula) ||
    cfg.startTime != null ||
    cfg.startRound != null ||
    cfg.startTurn != null ||
    !!asTrimmed(cfg.combat ?? undefined) ||
    cfg.showIcon === true ||
    cfg.overlay === true ||
    cfg.selfTargetAlways === true ||
    cfg.disableIncapacitated === true ||
    !!params.acBonus?.trim() ||
    !!params.speedBonus?.trim()
  );
}

function buildDaeFlags(
  cfg: WeaponActiveEffectConfig,
): Record<string, unknown> | undefined {
  const dae: Record<string, unknown> = {};

  if (cfg.specialDuration?.length) {
    dae.specialDuration = [...cfg.specialDuration];
  }
  if (cfg.stackable?.trim()) {
    dae.stackable = cfg.stackable.trim();
  } else if (cfg.specialDuration?.length) {
    // Match prior compiler default when specialDuration is set.
    dae.stackable = "noneName";
  }
  if (cfg.selfTargetAlways === true) dae.selfTargetAlways = true;
  if (asTrimmed(cfg.disableCondition)) {
    dae.disableCondition = cfg.disableCondition!.trim();
  }
  if (cfg.disableIncapacitated === true) dae.disableIncapacitated = true;
  if (cfg.showIcon === true) dae.showIcon = true;
  if (asTrimmed(cfg.durationSecondsFormula)) {
    dae.durationExpression = cfg.durationSecondsFormula!.trim();
  }
  if (asTrimmed(cfg.macroRepeat)) {
    dae.macroRepeat = cfg.macroRepeat!.trim();
  }
  if (cfg.statusesSeparate?.length) {
    dae.statuses = [...cfg.statusesSeparate];
  }

  return Object.keys(dae).length > 0 ? dae : undefined;
}

function buildActiveAurasFlags(
  cfg: WeaponActiveEffectConfig,
): Record<string, unknown> | undefined {
  if (!cfg.isAura) return undefined;
  return {
    isAura: true,
    aura: cfg.auraTargets?.trim() || "Allies",
    radius: cfg.auraRadius?.trim() || "10",
    alignment: cfg.auraAlignment ?? "",
    type: cfg.auraType ?? "",
    ignoreSelf: cfg.auraIgnoreSelf === true,
    height: cfg.auraHeight === true,
    hidden: cfg.auraHidden === true,
    displayTemp: cfg.auraDisplayTemp === true,
    hostile: cfg.auraHostile === true,
    onlyOnce: cfg.auraOnlyOnce === true,
  };
}

/**
 * Build a Foundry v12 ActiveEffect document from weapon automation params.
 * When `stableSeed` is set, `_id` is deterministic (`eff-${seed}`).
 */
export function buildWeaponActiveEffect(
  displayName: string,
  params: WeaponActivityParams,
  opts?: { stableSeed?: string },
): FoundryActiveEffect {
  const cfg = resolveWeaponActiveEffectConfig(params);
  const name = asTrimmed(cfg.name) || displayName;

  const flags: Record<string, unknown> = {};
  const dae = buildDaeFlags(cfg);
  if (dae) flags.dae = dae;

  const core: Record<string, unknown> = {};
  if (cfg.overlay === true) core.overlay = true;
  if (Object.keys(core).length > 0) flags.core = core;

  const activeAuras = buildActiveAurasFlags(cfg);
  if (activeAuras) flags.ActiveAuras = activeAuras;

  const effect = buildEffect({
    name,
    img: asTrimmed(cfg.img),
    description: cfg.description ?? "",
    transfer: cfg.transfer ?? false,
    disabled: cfg.disabled ?? false,
    statuses: cfg.statuses ?? [],
    tint: asTrimmed(cfg.tint),
    changes: toFoundryChanges(cfg.changes),
    duration: {
      startTime: cfg.startTime ?? null,
      seconds: cfg.durationSeconds ?? null,
      combat: cfg.combat ?? null,
      rounds: cfg.durationRounds ?? null,
      turns: cfg.durationTurns ?? null,
      startRound: cfg.startRound ?? null,
      startTurn: cfg.startTurn ?? null,
    },
    flags,
  });

  if (opts?.stableSeed) {
    effect._id = foundryIdFromSeed(`eff-${opts.stableSeed}`);
  }

  return effect;
}

/** Strip `_id` / `_stats` noise for the Feature dialog live preview. */
export function previewWeaponActiveEffectJson(
  displayName: string,
  params: WeaponActivityParams,
): string {
  const effect = buildWeaponActiveEffect(displayName || "Feature", params, {
    stableSeed: "preview",
  });
  const { _stats: _omitStats, ...rest } = effect;
  return JSON.stringify(rest, null, 2);
}
