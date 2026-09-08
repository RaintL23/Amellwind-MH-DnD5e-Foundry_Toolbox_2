/**
 * Amellwind rune runtime hooks (Foundry v12 / dnd5e 4.4).
 * Canonical: public/data/scripts/runes/rune-runtime-hooks.js
 * Loaded as a module script — weapon unequip gate cleanup, Muse sync on move/rest.
 *
 * API: globalThis.__amellwindRuneRuntime
 */
(() => {
  const FLAG = "amellwind-toolbox";
  const getFlag = (doc, key) => foundry.utils.getProperty(doc, `flags.${FLAG}.${key}`);

  const normalizeWeaponKey = (value) => String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

  const weaponKeysOfItem = (w) => {
    if (!w || w.type !== "weapon") return [];
    const keys = new Set();
    for (const v of [
      w.system?.identifier,
      w.system?.type?.baseItem,
      getFlag(w, "baseWeaponName"),
      w.name,
    ]) {
      const k = normalizeWeaponKey(v);
      if (k) keys.add(k);
    }
    return [...keys];
  };

  const isRangedWeaponItem = (w) => {
    if (!w || w.type !== "weapon") return false;
    const props = w.system?.properties;
    if (props?.has?.("ranged") || props?.ranged || (Array.isArray(props) && props.includes("ranged"))) {
      return true;
    }
    const t = String(w.system?.type?.value ?? "").toLowerCase();
    return t === "martialr" || t === "simpler" || t.includes("ranged");
  };

  const actorHasRequiredWeapon = (actor, requireWeaponTypes = []) => {
    const req = (requireWeaponTypes ?? []).map(normalizeWeaponKey).filter(Boolean);
    if (!req.length) return true;
    if (!actor) return false;
    const equipped = [...(actor.items ?? [])].filter((i) => i.type === "weapon" && i.system?.equipped);
    if (req.includes("ranged") && equipped.some(isRangedWeaponItem)) return true;
    const concrete = req.filter((k) => k !== "ranged");
    if (!concrete.length) return false;
    for (const w of equipped) {
      const keys = weaponKeysOfItem(w);
      if (concrete.some((k) => keys.includes(k))) return true;
    }
    return false;
  };

  const isMelodyAura = (ef) => {
    const flag = foundry.utils.getProperty(ef, "flags.world.hh.isMelodyAura");
    return flag === true || /melody of/i.test(ef.name ?? "");
  };

  const isMelodyItem = (i) => {
    const flag = foundry.utils.getProperty(i, "flags.world.hh.isMelody");
    const id = String(i.system?.identifier ?? "");
    return flag === true
      || (i.type === "feat" && id.startsWith("melody-"))
      || /^melody of /i.test(i.name ?? "");
  };

  const tokenDistanceFt = (a, b) => {
    if (!a || !b || a.parent?.id !== b.parent?.id) return Infinity;
    try {
      if (canvas?.grid?.measureDistance) {
        return canvas.grid.measureDistance(a.object?.center ?? a.center, b.object?.center ?? b.center);
      }
    } catch (_) { /* fall through */ }
    const grid = canvas?.grid?.size || 100;
    const dist = Math.hypot(
      (a.x + (a.width * grid) / 2) - (b.x + (b.width * grid) / 2),
      (a.y + (a.height * grid) / 2) - (b.y + (b.height * grid) / 2),
    );
    const feet = canvas?.dimensions?.distance ?? 5;
    return (dist / grid) * feet;
  };

  const resolveTokenDoc = (uuid) => {
    if (!uuid) return null;
    try {
      const doc = fromUuidSync?.(uuid);
      if (doc?.documentName === "Token") return doc;
    } catch (_) { /* ignore */ }
    return null;
  };

  const clearMuseClones = async (museActor, runeUuid = null) => {
    if (!museActor) return;
    const mine = museActor.effects.filter((ef) => {
      if (getFlag(ef, "museClone") !== true) return false;
      if (runeUuid && getFlag(ef, "museSourceRune") !== runeUuid) return false;
      return true;
    });
    if (mine.length) {
      await museActor.deleteEmbeddedDocuments("ActiveEffect", mine.map((e) => e.id));
    }
  };

  const findMuseRune = (hornActor) => {
    if (!hornActor) return null;
    return [...(hornActor.items ?? [])].find((it) => {
      if (getFlag(it, "exportKind") !== "rune" && !/rune/i.test(it.name ?? "")) return false;
      const applied = getFlag(it, "applied");
      if (!applied || applied.side !== "weapon") return false;
      const sides = getFlag(it, "sides") ?? {};
      if (getFlag(it, "museEffect") === true) return true;
      if (sides.weapon?.muse === true) return true;
      return /muse/i.test(sides.weapon?.label ?? "") || /muse/i.test(it.name ?? "");
    }) ?? null;
  };

  /**
   * Sync Gravios Pleura Muse: clone active melody aura changes onto the muse actor
   * when within 120 ft (non-aura personal AEs).
   */
  const syncMuseForActor = async (hornActor) => {
    const rune = findMuseRune(hornActor);
    if (!rune) return;
    const museMeta = getFlag(rune, "muse");
    if (!museMeta?.actorUuid) return;

    let museActor = null;
    try {
      museActor = await fromUuid(museMeta.actorUuid);
    } catch (_) { /* ignore */ }
    if (!museActor) return;

    const hornToken = hornActor.getActiveTokens?.(true)?.[0]?.document
      ?? hornActor.getActiveTokens?.()?.[0]?.document
      ?? null;
    let museToken = resolveTokenDoc(museMeta.tokenUuid);
    if (!museToken) {
      museToken = museActor.getActiveTokens?.(true)?.[0]?.document
        ?? museActor.getActiveTokens?.()?.[0]?.document
        ?? null;
    }

    const inRange = hornToken && museToken
      ? tokenDistanceFt(hornToken, museToken) <= 120
      : false;

    await clearMuseClones(museActor, rune.uuid);
    if (!inRange) return;

    const melodies = [...(hornActor.items ?? [])].filter(isMelodyItem);
    const docs = [];
    for (const mel of melodies) {
      for (const ef of mel.effects) {
        if (!isMelodyAura(ef) || ef.disabled) continue;
        const o = ef.toObject();
        delete o._id;
        o.origin = rune.uuid;
        o.transfer = false;
        o.disabled = false;
        o.name = `Muse: ${String(ef.name ?? mel.name).replace(/\s*\(Aura.*?\)\s*/i, "").trim()}`;
        foundry.utils.setProperty(o, "flags.ActiveAuras", {
          isAura: false,
          aura: "",
          radius: "",
          ignoreSelf: true,
          displayTemp: true,
        });
        foundry.utils.setProperty(o, `flags.${FLAG}.museClone`, true);
        foundry.utils.setProperty(o, `flags.${FLAG}.museSourceRune`, rune.uuid);
        foundry.utils.setProperty(o, `flags.${FLAG}.museSourceMelody`, mel.uuid);
        foundry.utils.setProperty(o, "flags.dae.showIcon", true);
        foundry.utils.setProperty(o, "flags.dae.stackable", "noneName");
        docs.push(o);
      }
    }
    if (docs.length) await museActor.createEmbeddedDocuments("ActiveEffect", docs);
  };

  const clearMuseOnLongRest = async (actor) => {
    if (!actor) return;
    for (const it of actor.items ?? []) {
      const muse = getFlag(it, "muse");
      if (!muse) continue;
      let museActor = null;
      try {
        museActor = muse.actorUuid ? await fromUuid(muse.actorUuid) : null;
      } catch (_) { /* ignore */ }
      if (museActor) await clearMuseClones(museActor, it.uuid);
      await it.update({ [`flags.${FLAG}.-=muse`]: null });
    }
  };

  const enforceWeaponGateOnUnequip = async (weaponItem, actor) => {
    if (!actor || !weaponItem || weaponItem.type !== "weapon") return;
    for (const rune of actor.items ?? []) {
      if (getFlag(rune, "exportKind") !== "rune" && !String(rune.name ?? "").toLowerCase().includes("rune")) {
        continue;
      }
      const applied = getFlag(rune, "applied");
      if (!applied?.side) continue;
      const sides = getFlag(rune, "sides") ?? {};
      const req = sides[applied.side]?.requireWeaponTypes ?? [];
      if (!req.length) continue;
      if (actorHasRequiredWeapon(actor, req)) continue;

      // Drop weapon-side clones and unequip the rune
      const clones = actor.effects.filter(
        (e) => getFlag(e, "runeClone") && e.origin === rune.uuid,
      );
      if (clones.length) {
        await actor.deleteEmbeddedDocuments("ActiveEffect", clones.map((e) => e.id));
      }
      const muse = getFlag(rune, "muse");
      if (muse?.actorUuid) {
        try {
          const museActor = await fromUuid(muse.actorUuid);
          if (museActor) await clearMuseClones(museActor, rune.uuid);
        } catch (_) { /* ignore */ }
      }
      await rune.update({
        "system.equipped": false,
        [`flags.${FLAG}.-=applied`]: null,
      });
      ui.notifications?.warn?.(
        `${rune.name}: deactivated — required weapon is no longer equipped.`,
      );
    }
  };

  let hooksArmed = false;
  let moveTimer = null;

  const ensureHooks = () => {
    if (hooksArmed) return;
    hooksArmed = true;

    Hooks.on("updateItem", async (doc, changes, _opts, _userId) => {
      try {
        if (doc.type !== "weapon") return;
        const equippedPath = changes?.system?.equipped;
        if (equippedPath !== false && changes?.system?.equipped !== false) return;
        const actor = doc.actor ?? doc.parent;
        if (!actor) return;
        await enforceWeaponGateOnUnequip(doc, actor);
      } catch (err) {
        console.error("Amellwind Runes | weapon unequip gate failed", err);
      }
    });

    Hooks.on("dnd5e.restCompleted", async (actor, result) => {
      try {
        if (!result?.longRest && result?.type !== "long") return;
        await clearMuseOnLongRest(actor);
        ui.notifications?.info?.("Amellwind Runes: Muse cleared after long rest — use Choose Muse again.");
      } catch (err) {
        console.error("Amellwind Runes | muse long-rest clear failed", err);
      }
    });

    Hooks.on("updateToken", (tokenDoc, changes) => {
      if (changes.x === undefined && changes.y === undefined) return;
      if (moveTimer) clearTimeout(moveTimer);
      moveTimer = setTimeout(async () => {
        try {
          const sceneActors = new Set();
          for (const t of tokenDoc.parent?.tokens ?? []) {
            const a = t.actor;
            if (a) sceneActors.add(a);
          }
          for (const a of sceneActors) await syncMuseForActor(a);
        } catch (err) {
          console.error("Amellwind Runes | muse range sync failed", err);
        }
      }, 250);
    });
  };

  globalThis.__amellwindRuneRuntime = {
    ensureHooks,
    syncMuseForActor,
    clearMuseClones,
    clearMuseOnLongRest,
    actorHasRequiredWeapon,
  };
})();
