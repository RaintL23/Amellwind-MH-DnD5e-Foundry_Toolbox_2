/**
 * Amellwind hunter traps — canvas engine (Foundry v12 / dnd5e 4.4 / Midi QOL).
 *
 * Place / retrieve run from the item Item Macro. Trigger, camouflage notices,
 * 1-hour expiry, and + accustomed repeat-saves run here (GM mutations).
 *
 * Exposed as globalThis.__amellwindHunterTraps
 */
(() => {
  const NS = "hunterTrap";
  const FLAG = `flags.world.${NS}`;
  const HOOK_FLAG = "__amellwindHunterTrapsHooks";

  const SIZE_ORDER = ["tiny", "sm", "med", "lg", "huge", "grg"];

  const esc = (value) => {
    const s = String(value ?? "");
    if (globalThis.Handlebars?.Utils?.escapeExpression) {
      return Handlebars.Utils.escapeExpression(s);
    }
    return s
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  };

  const chat = async (speakerActor, html) => {
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: speakerActor ?? null }),
      content: `<div class="dnd5e2">${html}</div>`,
    });
  };

  const trapFlag = (doc) => foundry.utils.getProperty(doc, FLAG) ?? null;

  const isTrapTemplate = (doc) => trapFlag(doc)?.isTrap === true;

  const sceneTraps = () =>
    (canvas.scene?.templates ?? []).filter((tpl) => isTrapTemplate(tpl));

  const tokenSizeKey = (actor) => {
    const raw = String(actor?.system?.traits?.size ?? "med").toLowerCase();
    if (raw === "small") return "sm";
    if (raw === "medium") return "med";
    if (raw === "large") return "lg";
    if (raw === "gargantuan") return "grg";
    return SIZE_ORDER.includes(raw) ? raw : "med";
  };

  const sizeIndex = (actor) => {
    const idx = SIZE_ORDER.indexOf(tokenSizeKey(actor));
    return idx < 0 ? SIZE_ORDER.indexOf("med") : idx;
  };

  const sizeMatches = (actor, sizeMode) => {
    const idx = sizeIndex(actor);
    if (sizeMode === "largeOrLarger") return idx >= SIZE_ORDER.indexOf("lg");
    return idx <= SIZE_ORDER.indexOf("huge");
  };

  const tokenInTemplate = (token, template) => {
    if (!token || !template) return false;
    try {
      const obj = template.object;
      const center = token.center;
      if (obj?.shape && typeof obj.shape.contains === "function") {
        const origin = obj.center ?? { x: template.x, y: template.y };
        return obj.shape.contains(center.x - origin.x, center.y - origin.y)
          || obj.shape.contains(center.x - template.x, center.y - template.y);
      }
    } catch {
      /* fall through */
    }
    const dx = token.center.x - template.x;
    const dy = token.center.y - template.y;
    const grid = canvas.grid?.size || 100;
    const ft = canvas.grid?.distance || 5;
    const distFt = (Math.hypot(dx, dy) / grid) * ft;
    return distFt <= 7.5;
  };

  const distanceFt = (a, b) => {
    if (!a || !b) return Infinity;
    const grid = canvas.grid;
    if (grid?.measureDistance) return Number(grid.measureDistance(a, b)) || Infinity;
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const size = canvas.grid?.size || 100;
    const ft = canvas.grid?.distance || 5;
    return (Math.hypot(dx, dy) / size) * ft;
  };

  const templateCenter = (template) => {
    const obj = template.object;
    if (obj?.center) return obj.center;
    return { x: template.x, y: template.y };
  };

  const hasTruesight = (actor) => {
    const senses = actor?.system?.attributes?.senses ?? {};
    if (Number(senses.truesight ?? 0) > 0) return true;
    const special = String(senses.special ?? "").toLowerCase();
    return /\btruesight\b/.test(special);
  };

  const isAccustomed = (actor, family) =>
    (actor?.effects ?? []).some(
      (ef) =>
        !ef.disabled
        && foundry.utils.getProperty(ef, `${FLAG}.accustomed`) === family,
    );

  const abilityMod = (actor, ability) => {
    const key = ability === "str" ? "str" : "con";
    return Number(actor?.system?.abilities?.[key]?.mod ?? 0);
  };

  const rollSave = async (actor, ability, dc, { advantage = false } = {}) => {
    const key = ability === "str" ? "str" : "con";
    const label = key === "str" ? "Strength" : "Constitution";
    if (typeof actor.rollSavingThrow === "function") {
      const roll = await actor.rollSavingThrow({
        ability: key,
        targetValue: dc,
        advantage,
        skipDialog: true,
        chatMessage: true,
      });
      const total = Number(roll?.total ?? roll?.[0]?.total ?? NaN);
      if (Number.isFinite(total)) return { total, success: total >= dc };
    }
    const formula = advantage ? "2d20kh1" : "1d20";
    const roll = await new Roll(`${formula} + ${abilityMod(actor, key)}`).evaluate();
    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor }),
      flavor: `${label} saving throw vs DC ${dc}${advantage ? " (Advantage)" : ""}`,
    });
    return { total: roll.total, success: roll.total >= dc };
  };

  const applyLightning = async (token, formula, itemName) => {
    const actor = token?.actor;
    if (!actor) return;
    const roll = await new Roll(formula).evaluate();
    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor }),
      flavor: `${esc(itemName)} — lightning`,
    });
    const damage = Number(roll.total) || 0;
    if (damage <= 0) return;
    if (typeof MidiQOL?.applyTokenDamage === "function") {
      await MidiQOL.applyTokenDamage(
        [{ type: "lightning", damage }],
        damage,
        new Set([token]),
        null,
        new Set(),
      );
      return;
    }
    if (typeof actor.applyDamage === "function") {
      await actor.applyDamage(damage, { type: "lightning" });
    }
  };

  const applyTrapEffect = async (actor, data) => {
    const untilStart = data.durationMode !== "end";
    const statuses = data.family === "shock"
      ? ["incapacitated"]
      : ["prone", "restrained"];
    const changes = data.family === "shock"
      ? [{
          key: "system.attributes.movement.all",
          mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
          value: "0",
          priority: 40,
        }]
      : [];
    const [ae] = await actor.createEmbeddedDocuments("ActiveEffect", [{
      name: data.name,
      img: data.img,
      type: "base",
      disabled: false,
      transfer: false,
      statuses,
      changes,
      flags: {
        dae: {
          stackable: "noneName",
          showIcon: true,
          specialDuration: untilStart ? ["turnStart"] : ["turnEnd"],
        },
        world: {
          [NS]: {
            trapEffect: true,
            family: data.family,
            isPlus: data.isPlus,
            repeatSave: Boolean(data.repeatSave),
            saveAbility: data.saveAbility,
            saveDc: data.saveDc,
            ownerActorId: data.ownerActorId,
          },
        },
      },
    }]);
    return ae;
  };

  const applyAccustomed = async (actor, family, img) => {
    const label = family === "shock"
      ? "Accustomed to Shock Traps"
      : "Accustomed to Pitfall Traps";
    const stale = (actor.effects ?? []).filter(
      (ef) => foundry.utils.getProperty(ef, `${FLAG}.accustomed`) === family,
    );
    if (stale.length) {
      await actor.deleteEmbeddedDocuments("ActiveEffect", stale.map((e) => e.id));
    }
    await actor.createEmbeddedDocuments("ActiveEffect", [{
      name: label,
      img,
      type: "base",
      disabled: false,
      transfer: false,
      statuses: [],
      changes: [],
      flags: {
        dae: {
          stackable: "noneName",
          showIcon: true,
          specialDuration: ["shortRest", "longRest"],
        },
        world: { [NS]: { accustomed: family } },
      },
    }]);
  };

  const consumePlacedTrap = async (template) => {
    const scene = canvas.scene;
    if (!scene || !template?.id) return;
    await scene.deleteEmbeddedDocuments("MeasuredTemplate", [template.id]).catch(() => null);
  };

  const triggerTrap = async (token, template) => {
    if (!game.user.isGM) return false;
    const data = trapFlag(template);
    if (!data?.isTrap || data.triggered) return false;
    const actor = token?.actor;
    if (!actor || Number(actor.system?.attributes?.hp?.value ?? 1) <= 0) return false;
    if (!sizeMatches(actor, data.sizeMode)) return false;

    await template.update({ [`${FLAG}.triggered`]: true }).catch(() => null);

    const owner = game.actors?.get(data.ownerActorId) ?? null;
    const name = data.name || "Hunter Trap";
    const accustomed = isAccustomed(actor, data.family);

    if (accustomed && !data.isPlus) {
      await chat(
        owner,
        `<p><strong>${esc(token.name)}</strong> is accustomed to ${esc(data.family)} traps and ignores <em>${esc(name)}</em>.</p>`,
      );
      await consumePlacedTrap(template);
      return true;
    }

    if (data.lightning) {
      await applyLightning(token, data.lightning, name);
    }

    const save = await rollSave(actor, data.saveAbility, data.saveDc, {
      advantage: false,
    });

    if (!save.success) {
      await applyTrapEffect(actor, {
        name,
        img: data.img,
        family: data.family,
        isPlus: data.isPlus,
        durationMode: data.durationMode,
        repeatSave: Boolean(data.isPlus && accustomed),
        saveAbility: data.saveAbility,
        saveDc: data.saveDc,
        ownerActorId: data.ownerActorId,
      });
      await applyAccustomed(actor, data.family, data.img);
      await chat(
        owner,
        `<p><em>${esc(name)}</em> snaps shut on <strong>${esc(token.name)}</strong> (save ${save.total} vs DC ${data.saveDc}).</p>`,
      );
    } else {
      await chat(
        owner,
        `<p><strong>${esc(token.name)}</strong> evades <em>${esc(name)}</em> (save ${save.total} vs DC ${data.saveDc}). The trap is still consumed.</p>`,
      );
    }

    await consumePlacedTrap(template);
    return true;
  };

  const noticeTrap = async (token, template) => {
    if (!game.user.isGM) return;
    const data = trapFlag(template);
    if (!data?.isTrap || data.noticedIds?.includes(token.id)) return;
    const actor = token?.actor;
    if (!actor) return;
    const center = templateCenter(template);
    if (distanceFt(token.center, center) > 10) return;

    const noticedIds = Array.isArray(data.noticedIds) ? [...data.noticedIds] : [];
    noticedIds.push(token.id);
    await template.update({ [`${FLAG}.noticedIds`]: noticedIds }).catch(() => null);

    if (hasTruesight(actor)) {
      await chat(
        actor,
        `<p><strong>${esc(token.name)}</strong> sees through the camouflage of <em>${esc(data.name)}</em> (Truesight).</p>`,
      );
      return;
    }

    const passive = Number(actor.system?.skills?.prc?.passive ?? 10);
    if (passive >= 15) {
      await chat(
        actor,
        `<p><strong>${esc(token.name)}</strong> notices a camouflaged trap (Passive Perception ${passive} vs DC 15).</p>`,
      );
      return;
    }

    const whisper = game.users.filter((u) => u.isGM).map((u) => u.id);
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      whisper,
      content: `<div class="dnd5e2"><p><strong>${esc(token.name)}</strong> is within 10 ft of a camouflaged <em>${esc(data.name)}</em> (Passive Perception ${passive} vs DC 15 — not noticed unless they Search).</p></div>`,
    });
  };

  const armPlacedTemplate = async (template, config) => {
    if (!template) return null;
    const until = Number(game.time.worldTime ?? 0) + 3600;
    await template.update({
      hidden: true,
      borderColor: config.family === "shock" ? "#6ec6ff" : "#8b5a2b",
      fillColor: config.family === "shock" ? "#1e4d7b" : "#5c4033",
      [`${FLAG}`]: {
        isTrap: true,
        triggered: false,
        trapKey: config.trapKey,
        family: config.family,
        isPlus: Boolean(config.isPlus),
        name: config.name,
        img: config.img,
        saveAbility: config.saveAbility,
        saveDc: Number(config.saveDc),
        sizeMode: config.sizeMode,
        durationMode: config.durationMode,
        lightning: config.lightning || null,
        ownerActorId: config.ownerActorId,
        ownerTokenId: config.ownerTokenId || null,
        itemUuid: config.itemUuid || null,
        until,
        noticedIds: [],
      },
    });
    return template;
  };

  const retrieveTraps = async ({ actor, token, item }) => {
    if (!actor) return 0;
    const origin = token?.center ?? token?.getCenterPoint?.() ?? null;
    const owned = sceneTraps().filter((tpl) => {
      const data = trapFlag(tpl);
      if (data?.ownerActorId !== actor.id) return false;
      if (data.triggered) return false;
      if (!origin) return true;
      return distanceFt(origin, templateCenter(tpl)) <= 5.5;
    });
    if (!owned.length) {
      ui.notifications.warn("Hunter Traps: no unused trap of yours within 5 feet.");
      return 0;
    }
    const ids = owned.map((tpl) => tpl.id);
    await canvas.scene.deleteEmbeddedDocuments("MeasuredTemplate", ids);
    if (item) {
      const qty = Math.max(0, Number(item.system?.quantity ?? 0));
      await item.update({ "system.quantity": qty + owned.length });
    }
    await chat(
      actor,
      `<p><strong>${esc(actor.name)}</strong> retrieves ${owned.length === 1 ? "an unused hunter trap" : `${owned.length} unused hunter traps`}.</p>`,
    );
    return owned.length;
  };

  const expireTraps = async () => {
    if (!game.user.isGM) return;
    const now = Number(game.time.worldTime ?? 0);
    const expired = sceneTraps().filter((tpl) => {
      const until = Number(trapFlag(tpl)?.until ?? 0);
      return until > 0 && now >= until;
    });
    if (!expired.length || !canvas.scene) return;
    await canvas.scene.deleteEmbeddedDocuments(
      "MeasuredTemplate",
      expired.map((t) => t.id),
    );
    await chat(
      null,
      `<p>${expired.length === 1 ? "A hunter trap" : `${expired.length} hunter traps`} crumbled after 1 hour and cannot be retrieved.</p>`,
    );
  };

  const onTokenMove = async (tokenDoc, changes) => {
    if (!game.user.isGM) return;
    if (!("x" in changes || "y" in changes)) return;
    const token = tokenDoc.object ?? canvas.tokens?.get(tokenDoc.id);
    if (!token?.actor) return;
    for (const tpl of sceneTraps()) {
      await noticeTrap(token, tpl);
      if (tokenInTemplate(token, tpl)) {
        await triggerTrap(token, tpl);
      }
    }
  };

  const onCombatTurn = async (combat, update) => {
    if (!game.user.isGM) return;
    if (!("turn" in update) && !("round" in update)) return;
    const combatant = combat.combatant;
    const actor = combatant?.actor;
    if (!actor) return;
    const pending = (actor.effects ?? []).filter(
      (ef) =>
        !ef.disabled
        && foundry.utils.getProperty(ef, `${FLAG}.repeatSave`) === true,
    );
    for (const ef of pending) {
      const ability = foundry.utils.getProperty(ef, `${FLAG}.saveAbility`) ?? "con";
      const dc = Number(foundry.utils.getProperty(ef, `${FLAG}.saveDc`) ?? 16);
      const save = await rollSave(actor, ability, dc, { advantage: true });
      if (save.success) {
        await ef.delete();
        await chat(
          actor,
          `<p><strong>${esc(actor.name)}</strong> shakes off the upgraded trap (repeat save ${save.total} vs DC ${dc}, Advantage).</p>`,
        );
      }
    }
  };

  const ensureHooks = () => {
    if (globalThis[HOOK_FLAG]) return;
    globalThis[HOOK_FLAG] = true;
    Hooks.on("updateToken", (doc, changes) => {
      void onTokenMove(doc, changes);
    });
    Hooks.on("updateWorldTime", () => {
      void expireTraps();
    });
    Hooks.on("updateCombat", (combat, update) => {
      void onCombatTurn(combat, update);
    });
  };

  globalThis.__amellwindHunterTraps = {
    ensureHooks,
    armPlacedTemplate,
    retrieveTraps,
    triggerTrap,
    expireTraps,
    isTrapTemplate,
  };
})();
