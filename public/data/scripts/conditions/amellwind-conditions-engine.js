/**
 * Amellwind Conditions & Diseases — Foundry client engine.
 * Auto-injected registry: /* @@AMELLWIND_AFFLICTIONS@@ */
 *
 * Registers afflictions into CONFIG.DND5E.conditionTypes (token HUD + sheet) with
 * Active Effect changes, and exposes applyToActor for boss macros / GMs.
 */
(() => {
  const MODULE_ID = "Amellwind-MH-RaintDM-module";
  const NS = "amellwindConditions";

  /* @@AMELLWIND_AFFLICTIONS@@ */
  const AFFLICTIONS = [];

  const isObject = (value) => value !== null && typeof value === "object";

  const registerConditionTypes = () => {
    const types = (CONFIG.DND5E ??= {}).conditionTypes ?? (CONFIG.DND5E.conditionTypes = {});
    for (const def of AFFLICTIONS) {
      const entry = {
        label: def.name,
        name: def.name,
        icon: def.img,
        img: def.img,
        reference: def.itemId
          ? `Compendium.${MODULE_ID}.conditions.Item.${def.itemId}`
          : undefined,
        pseudo: false,
        description: def.description ?? "",
        changes: Array.isArray(def.changes) ? foundry.utils.deepClone(def.changes) : [],
        statuses: Array.isArray(def.riders) ? [...def.riders] : [],
        tint: def.tint || "#ffffff",
        flags: {
          ...(isObject(def.effectFlags) ? foundry.utils.deepClone(def.effectFlags) : {}),
          world: {
            [NS]: {
              kind: def.id,
              afflictionKind: def.kind,
            },
          },
        },
      };
      types[def.id] = foundry.utils.mergeObject(types[def.id] ?? {}, entry, { inplace: false });
    }
  };

  const registerConditionEffects = () => {
    const effects = CONFIG.DND5E?.conditionEffects;
    if (!effects) return;
    for (const def of AFFLICTIONS) {
      for (const key of def.conditionEffects ?? []) {
        const set = effects[key];
        if (set instanceof Set) set.add(def.id);
      }
    }
  };

  const ensureStatusEffects = () => {
    if (!Array.isArray(CONFIG.statusEffects)) return;
    for (const def of AFFLICTIONS) {
      const existing = CONFIG.statusEffects.find((s) => s.id === def.id);
      const payload = {
        id: def.id,
        name: def.name,
        label: def.name,
        img: def.img,
        icon: def.img,
        description: def.description ?? "",
        changes: Array.isArray(def.changes) ? foundry.utils.deepClone(def.changes) : [],
        statuses: Array.isArray(def.riders) ? [...def.riders] : [],
        tint: def.tint || "#ffffff",
        reference: def.itemId
          ? `Compendium.${MODULE_ID}.conditions.Item.${def.itemId}`
          : undefined,
        flags: {
          ...(isObject(def.effectFlags) ? foundry.utils.deepClone(def.effectFlags) : {}),
          world: { [NS]: { kind: def.id, afflictionKind: def.kind } },
        },
      };
      if (existing) foundry.utils.mergeObject(existing, payload);
      else {
        const _id =
          globalThis.dnd5e?.utils?.staticID?.(`dnd5e${def.id}`) ?? foundry.utils.randomID();
        CONFIG.statusEffects.push({ ...payload, _id });
      }
    }
  };

  const buildEffectData = (def, { durationSeconds = null, origin = null } = {}) => ({
    name: def.name,
    img: def.img,
    description: def.description ?? "",
    disabled: false,
    transfer: false,
    statuses: [def.id, ...(def.riders ?? [])],
    changes: Array.isArray(def.changes) ? foundry.utils.deepClone(def.changes) : [],
    tint: def.tint || "#ffffff",
    origin,
    duration: {
      startTime: game.time?.worldTime ?? null,
      seconds: durationSeconds,
      combat: null,
      rounds: durationSeconds ? Math.ceil(durationSeconds / 6) : null,
      turns: null,
      startRound: null,
      startTurn: null,
    },
    flags: {
      ...(isObject(def.effectFlags) ? foundry.utils.deepClone(def.effectFlags) : {}),
      dae: { stackable: "noneName", specialDuration: [] },
      world: { [NS]: { kind: def.id, afflictionKind: def.kind } },
    },
  });

  const applyToActor = async (actor, afflictionId, { durationSeconds = 60, origin = null } = {}) => {
    if (!actor || !afflictionId) return null;
    const def = AFFLICTIONS.find((a) => a.id === afflictionId);
    if (!def) {
      console.warn(`Amellwind Conditions | unknown affliction "${afflictionId}"`);
      return null;
    }
    const existing = (actor.effects?.contents ?? actor.effects ?? []).filter((ef) => {
      const kind = foundry.utils.getProperty(ef, `flags.world.${NS}.kind`);
      return kind === def.id || ef.statuses?.has?.(def.id);
    });
    if (existing.length) {
      await actor.deleteEmbeddedDocuments(
        "ActiveEffect",
        existing.map((ef) => ef.id),
      );
    }
    const [created] = await actor.createEmbeddedDocuments("ActiveEffect", [
      buildEffectData(def, { durationSeconds, origin }),
    ]);
    return created ?? null;
  };

  globalThis.__amellwindConditions = {
    NS,
    MODULE_ID,
    afflictions: AFFLICTIONS,
    applyToActor,
    buildEffectData,
    ensureStatusEffects,
    registerConditionTypes,
    registerConditionEffects,
  };

  Hooks.once("init", () => {
    try {
      registerConditionTypes();
      registerConditionEffects();
      console.log(
        `Amellwind Conditions | registered ${AFFLICTIONS.length} affliction(s) in conditionTypes`,
      );
    } catch (err) {
      console.error("Amellwind Conditions | init failed", err);
    }
  });

  Hooks.once("setup", () => {
    try {
      ensureStatusEffects();
    } catch (err) {
      console.error("Amellwind Conditions | setup failed", err);
    }
  });

  Hooks.once("ready", () => {
    try {
      ensureStatusEffects();
      console.log("Amellwind Conditions | HUD statuses armed");
    } catch (err) {
      console.error("Amellwind Conditions | ready failed", err);
    }
  });
})();
