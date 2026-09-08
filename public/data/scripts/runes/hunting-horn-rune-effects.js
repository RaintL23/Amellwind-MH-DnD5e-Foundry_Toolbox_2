/**
 * Hunting Horn ↔ rune automation helpers (Inspiring Melody, Lord's Favor, Muse sync).
 * Canonical: public/data/scripts/runes/hunting-horn-rune-effects.js
 * Called from hunting-horn-item-macro.js after melodies enable/disable.
 *
 * API: globalThis.__amellwindHhRuneEffects
 */
(() => {
  const FLAG = "amellwind-toolbox";
  const getFlag = (doc, key) => foundry.utils.getProperty(doc, `flags.${FLAG}.${key}`);

  const tokenCenter = (td) => {
    const grid = canvas?.grid?.size || 100;
    return {
      x: td.x + ((td.width ?? 1) * grid) / 2,
      y: td.y + ((td.height ?? 1) * grid) / 2,
    };
  };

  const distanceFt = (a, b) => {
    if (!a || !b || a.parent?.id !== b.parent?.id) return Infinity;
    try {
      if (canvas?.grid?.measureDistance) {
        return canvas.grid.measureDistance(tokenCenter(a), tokenCenter(b));
      }
    } catch (_) { /* fall through */ }
    const grid = canvas?.grid?.size || 100;
    const feet = canvas?.dimensions?.distance ?? 5;
    const c0 = tokenCenter(a);
    const c1 = tokenCenter(b);
    return (Math.hypot(c0.x - c1.x, c0.y - c1.y) / grid) * feet;
  };

  const allyTokensInRadius = (hornActor, radiusFt) => {
    const hornToken = hornActor.getActiveTokens?.(true)?.[0]?.document
      ?? hornActor.getActiveTokens?.()?.[0]?.document
      ?? null;
    if (!hornToken) return [];
    const out = [];
    for (const td of hornToken.parent?.tokens ?? []) {
      if (td.id === hornToken.id) continue;
      const a = td.actor;
      if (!a || a.type === "vehicle") continue;
      // Disposition: ally or friendly/neutral PC
      const disp = td.disposition ?? a.prototypeToken?.disposition;
      if (disp === CONST.TOKEN_DISPOSITIONS?.HOSTILE) continue;
      if (distanceFt(hornToken, td) > radiusFt) continue;
      out.push({ tokenDoc: td, actor: a });
    }
    return out;
  };

  const equippedRuneEffects = (actor) => {
    const list = [];
    for (const it of actor.items ?? []) {
      const applied = getFlag(it, "applied");
      if (!applied || applied.side !== "weapon") continue;
      const inspiringMelody = getFlag(it, "inspiringMelody");
      const lordsFavor = getFlag(it, "lordsFavor");
      if (inspiringMelody || lordsFavor || getFlag(it, "museEffect")) {
        list.push({ item: it, inspiringMelody, lordsFavor, museEffect: getFlag(it, "museEffect") });
      }
    }
    return list;
  };

  const clearTaggedEffects = async (actor, tagKey) => {
    if (!actor) return;
    const mine = actor.effects.filter((ef) => getFlag(ef, tagKey) === true);
    if (mine.length) await actor.deleteEmbeddedDocuments("ActiveEffect", mine.map((e) => e.id));
  };

  const applyInspiringMelody = async (hornActor, cfg, sourceItem) => {
    const radius = Number(cfg?.radius ?? 20) || 20;
    const dice = String(cfg?.damageBonus ?? "1d6");
    const allies = allyTokensInRadius(hornActor, radius);
    for (const { actor } of allies) {
      await clearTaggedEffects(actor, "inspiringMelodyBuff");
      await actor.createEmbeddedDocuments("ActiveEffect", [{
        name: `Inspiring Melody (+${dice})`,
        img: sourceItem?.img ?? "icons/skills/trades/music-notes-sound-blue.webp",
        origin: sourceItem?.uuid ?? hornActor.uuid,
        transfer: false,
        disabled: false,
        duration: {
          rounds: null,
          turns: null,
          seconds: null,
          startTime: null,
          combat: null,
          startRound: null,
          startTurn: null,
        },
        changes: [
          { key: "system.bonuses.mwak.damage", mode: 2, value: dice, priority: 20 },
          { key: "system.bonuses.rwak.damage", mode: 2, value: dice, priority: 20 },
          { key: "system.bonuses.msak.damage", mode: 2, value: dice, priority: 20 },
          { key: "system.bonuses.rsak.damage", mode: 2, value: dice, priority: 20 },
        ],
        flags: {
          dae: {
            specialDuration: ["turnEndSource"],
            stackable: "noneName",
            showIcon: true,
          },
          [FLAG]: {
            inspiringMelodyBuff: true,
            inspiringSource: sourceItem?.uuid ?? null,
          },
        },
      }]);
    }
    if (allies.length) {
      ui.notifications?.info?.(
        `Inspiring Melody: ${allies.length} ally(ies) within ${radius} ft gain +${dice} damage until end of your next turn.`,
      );
    }
  };

  const applyLordsFavor = async (hornActor, cfg, sourceItem) => {
    const dice = String(cfg?.damageBonus ?? "1d12");
    const dtype = String(cfg?.damageType ?? "bludgeoning");
    await clearTaggedEffects(hornActor, "lordsFavorBuff");
    await hornActor.createEmbeddedDocuments("ActiveEffect", [{
      name: `Lord's Favor (+${dice} ${dtype})`,
      img: sourceItem?.img ?? "icons/weapons/clubs/club-banded-steel.webp",
      origin: sourceItem?.uuid ?? hornActor.uuid,
      transfer: false,
      disabled: false,
      duration: {
        rounds: null,
        turns: null,
        seconds: null,
        startTime: null,
        combat: null,
        startRound: null,
        startTurn: null,
      },
      changes: [
        { key: "system.bonuses.mwak.damage", mode: 2, value: `${dice}[${dtype}]`, priority: 20 },
      ],
      flags: {
        dae: {
          specialDuration: ["turnEndSource"],
          stackable: "noneName",
          showIcon: true,
        },
        [FLAG]: { lordsFavorBuff: true },
      },
    }]);
    ui.notifications?.info?.(
      `Lord's Favor: your Hunting Horn deals +${dice} ${dtype} until the end of your next turn.`,
    );
  };

  /**
   * @param {Actor} hornActor
   * @param {{ ending?: boolean }} [opts]
   */
  const onMelodyPerformance = async (hornActor, opts = {}) => {
    if (!hornActor) return;
    const ending = opts.ending === true;
    const runes = equippedRuneEffects(hornActor);

    if (!ending) {
      for (const r of runes) {
        if (r.inspiringMelody) await applyInspiringMelody(hornActor, r.inspiringMelody, r.item);
        if (r.lordsFavor) await applyLordsFavor(hornActor, r.lordsFavor, r.item);
      }
    }

    if (globalThis.__amellwindRuneRuntime?.syncMuseForActor) {
      await globalThis.__amellwindRuneRuntime.syncMuseForActor(hornActor);
    }
  };

  globalThis.__amellwindHhRuneEffects = {
    onMelodyPerformance,
    applyInspiringMelody,
    applyLordsFavor,
  };
})();
