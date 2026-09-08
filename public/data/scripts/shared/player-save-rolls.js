/**
 * Amellwind — request saving throws on the connected player owner (not the GM).
 * Loaded as a module script on every client before boss / trap automation.
 *
 * API: globalThis.__amellwindPlayerSaves.rollSave(actor, ability, dc, opts?)
 * Uses socketlib (via Midi QOL dependency). Falls back to a local roll only when
 * no non-GM owner is online, or the current user already is that owner.
 */
(() => {
  const MODULE_ID = "Amellwind-MH-RaintDM-module";
  const LOG = "Amellwind Player Saves";

  let socket = null;

  const ownershipOwner = () => CONST.DOCUMENT_OWNERSHIP_LEVELS?.OWNER ?? 3;

  /**
   * Prefer MidiQOL.playerForActor, then assigned character, then any active OWNER.
   * Never returns a GM user — those saves stay on the active GM client.
   */
  const activePlayerOwner = (actor) => {
    if (!actor) return null;
    if (typeof MidiQOL?.playerForActor === "function") {
      const midiPlayer = MidiQOL.playerForActor(actor);
      if (midiPlayer?.active && !midiPlayer.isGM) return midiPlayer;
    }
    const assigned = game.users?.find(
      (u) => u.active && !u.isGM && u.character?.id === actor.id,
    );
    if (assigned) return assigned;
    return (
      game.users?.find(
        (u) => u.active && !u.isGM && actor.testUserPermission(u, ownershipOwner()),
      ) ?? null
    );
  };

  const parseSaveResult = (result, dc) => {
    if (result == null) return { success: true, total: dc, cancelled: true };
    if (typeof result.success === "boolean" && result.total != null) {
      return {
        success: result.success,
        total: Number(result.total),
        roll: result.roll,
        cancelled: Boolean(result.cancelled),
      };
    }
    const roll = Array.isArray(result) ? result[0] : result;
    if (!roll) return { success: true, total: dc, cancelled: true };
    const total = Number(roll?.total ?? roll?._total ?? 0);
    return { success: total >= dc, total, roll };
  };

  const rollSaveLocal = async (actor, ability, dc, opts = {}) => {
    if (!actor) return { success: true, total: dc, cancelled: true };
    const ablLabel = CONFIG.DND5E?.abilities?.[ability]?.label ?? String(ability).toUpperCase();
    const flavor = opts.flavor ?? `${ablLabel} saving throw (DC ${dc})`;
    const advantage = Boolean(opts.advantage);
    const disadvantage = Boolean(opts.disadvantage);
    let result;
    if (typeof actor.rollSavingThrow === "function") {
      result = await actor.rollSavingThrow(
        { ability, target: dc, advantage, disadvantage },
        { configure: opts.configure !== false },
        { data: { flavor } },
      );
    } else if (typeof actor.rollAbilitySave === "function") {
      result = await actor.rollAbilitySave(ability, {
        targetValue: dc,
        advantage,
        disadvantage,
        fastForward: opts.configure === false,
        chatMessage: true,
        flavor,
      });
    }
    return parseSaveResult(result, dc);
  };

  const rollViaOwnSocket = async (owner, actor, ability, dc, opts) => {
    if (!socket?.executeAsUser) return null;
    return socket.executeAsUser("rollSavingThrow", owner.id, {
      actorUuid: actor.uuid,
      ability,
      dc,
      advantage: Boolean(opts.advantage),
      disadvantage: Boolean(opts.disadvantage),
      flavor: opts.flavor,
      configure: opts.configure !== false,
    });
  };

  const rollViaMidiSocket = async (owner, actor, ability, dc, opts) => {
    if (typeof MidiQOL?.socket !== "function") return null;
    const result = await MidiQOL.socket().executeAsUser("rollAbility", owner.id, {
      request: "save",
      targetUuid: actor.uuid,
      ability,
      options: {
        target: dc,
        targetValue: dc,
        advantage: Boolean(opts.advantage),
        disadvantage: Boolean(opts.disadvantage),
        fastForward: opts.configure === false,
        chatMessage: true,
        flavor: opts.flavor,
      },
    });
    return parseSaveResult(result, dc);
  };

  /**
   * @param {Actor} actor
   * @param {string} ability
   * @param {number} dc
   * @param {{ advantage?: boolean, disadvantage?: boolean, flavor?: string, configure?: boolean }} [opts]
   */
  const rollSave = async (actor, ability, dc, opts = {}) => {
    if (!actor) return { success: true, total: dc };
    const owner = activePlayerOwner(actor);

    if (owner && owner.id !== game.user.id) {
      try {
        const viaOwn = await rollViaOwnSocket(owner, actor, ability, dc, opts);
        if (viaOwn) return viaOwn;
      } catch (err) {
        console.warn(`${LOG} | module socket request failed`, err);
      }
      try {
        const viaMidi = await rollViaMidiSocket(owner, actor, ability, dc, opts);
        if (viaMidi) return viaMidi;
      } catch (err) {
        console.warn(`${LOG} | MidiQOL rollAbility request failed`, err);
      }
      ui.notifications?.warn?.(
        `${actor.name}: save request to ${owner.name} failed — GM rolling as fallback.`,
      );
    }

    return rollSaveLocal(actor, ability, dc, opts);
  };

  const registerSocket = () => {
    if (socket || !globalThis.socketlib?.registerModule) return;
    try {
      socket = socketlib.registerModule(MODULE_ID);
    } catch (err) {
      console.warn(`${LOG} | socketlib.registerModule failed`, err);
      return;
    }
    socket.register("rollSavingThrow", async (payload = {}) => {
      const uuid = payload.actorUuid;
      const actor =
        (typeof fromUuidSync === "function" ? fromUuidSync(uuid) : null)
        ?? (await fromUuid(uuid));
      return rollSaveLocal(actor, payload.ability, payload.dc, payload);
    });
    console.log(`${LOG} | socket armed`);
  };

  Hooks.once("socketlib.ready", registerSocket);
  Hooks.once("ready", registerSocket);

  globalThis.__amellwindPlayerSaves = {
    rollSave,
    rollSaveLocal,
    activePlayerOwner,
  };
})();
