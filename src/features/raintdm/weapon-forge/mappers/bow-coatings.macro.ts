/**
 * Bow coating Item Macro — keep in sync with
 * `public/data/foundry-jsons-example/weapons-resources/coatings/bow-coatings-item-macro.js`
 */
export const BOW_COATINGS_ITEM_MACRO = `// Bow — Item Macros (MidiQOL 12.4 / Foundry v12 / dnd5e 4.4)
//
// EMBEDS:
// 1) Coating consumable (Power / Close Range / Acid / …)
//    On Use: [preTargeting]ItemMacro,[postActiveEffects]ItemMacro
//    Activity identifier: apply-coating
// 2) Bow weapon (Uncommon+)
//    On Use: [postAttackRoll]ItemMacro,[postDamageRoll]ItemMacro
//    Rare+: also gains Tracer on Attack hits; Dragonpiercer spends Tracer via ×N activities
//
// Charge / Sidestep cleanup runs AFTER damage when the attack hits.
// On a miss (no damage roll), cleanup runs on postAttackRoll instead.
//
// Flags:
// - flags.world.bow.isCoating / coatingKey / chargesPerVial
// - AE flags.world.bow.isCoatingActive + charges
// - AE flags.world.bow.isSidestepBuff
// - flags.world.bow.tracerMax (default 3) — item system.uses tracks Tracer pool

const esc = (value) => {
  const s = String(value ?? "");
  if (globalThis.Handlebars?.Utils?.escapeExpression) return Handlebars.Utils.escapeExpression(s);
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
};

const macroPass = String(
  args?.[0]?.macroPass
  ?? workflow?.macroPass
  ?? "",
).toLowerCase();

const rolled = (typeof rolledActivity !== "undefined" && rolledActivity)
  ? rolledActivity
  : (workflow?.activity ?? args?.[0]?.activity ?? null);

const actName = (rolled?.name ?? workflow?.activity?.name ?? "").toLowerCase();
const actId = String(rolled?.identifier ?? workflow?.activity?.identifier ?? "").toLowerCase();
const actType = String(rolled?.type ?? workflow?.activity?.type ?? "").toLowerCase();

const actorDoc = actor
  ?? workflow?.actor
  ?? item?.actor
  ?? item?.parent
  ?? (typeof token !== "undefined" ? token?.actor : null);

if (!actorDoc) {
  ui.notifications.warn("Bow: actor not found.");
  return;
}

const isCoatingItem = foundry.utils.getProperty(item, "flags.world.bow.isCoating") === true
  || String(item?.system?.identifier ?? "").endsWith("-coating")
  || /coating$/i.test(item?.name ?? "");

const isBowWeapon = foundry.utils.getProperty(item, "flags.world.bow.isBow") === true
  || String(item?.system?.identifier ?? "") === "bow"
  || /^bow\\b/i.test(item?.name ?? "");

const isCoatingActiveAe = (ef) =>
  foundry.utils.getProperty(ef, "flags.world.bow.isCoatingActive") === true
  || /coating \\(active\\)/i.test(ef.name ?? "");

const isSidestepAe = (ef) =>
  foundry.utils.getProperty(ef, "flags.world.bow.isSidestepBuff") === true
  || /charging sidestep/i.test(ef.name ?? "");

const coatingLabel = (key, charges, max) => {
  const names = {
    power: "Power Coating",
    "close-range": "Close Range Coating",
    acid: "Acid Coating",
    cold: "Cold Coating",
    fire: "Fire Coating",
    lightning: "Lightning Coating",
    blast: "Blast Coating",
    poison: "Poison Coating",
    paralysis: "Paralysis Coating",
    sleep: "Sleep Coating",
  };
  const base = names[key] ?? "Coating";
  return \`\${base} (Active) [\${charges}/\${max}]\`;
};

const isApplyActivity =
  actId === "apply-coating"
  || actName.includes("apply coating")
  || actName === "apply";

const tracerEnabled = () => {
  const max = Number(foundry.utils.getProperty(item, "flags.world.bow.tracerMax") ?? 0);
  if (max > 0) return max;
  const usesMax = Number(item?.system?.uses?.max ?? 0);
  return Number.isFinite(usesMax) && usesMax > 0 ? usesMax : 0;
};

const refreshTracerIdle = async () => {
  const max = tracerEnabled();
  if (!max || !item) return;
  const now = game.time?.worldTime ?? 0;
  const last = Number(foundry.utils.getProperty(actorDoc, "flags.world.bow.tracerLastAttack") ?? 0);
  if (last && now - last > 60) {
    const spent = Number(item.system?.uses?.spent ?? 0);
    if (spent < max) {
      await item.update({ "system.uses.spent": max });
      ui.notifications.info("Bow Tracer faded (1 minute without attacking).");
    }
  }
  await actorDoc.setFlag("world", "bow.tracerLastAttack", now);
};

const gainTracer = async () => {
  const max = tracerEnabled();
  if (!max || !item) return;
  await refreshTracerIdle();
  const bowItem = actorDoc.items.get(item.id) ?? item;
  const spent = Number(bowItem.system?.uses?.spent ?? 0);
  if (spent <= 0) return; // already full (available = max - spent)
  await bowItem.update({ "system.uses.spent": spent - 1 });
};

// ── Coating: once-per-turn gate (before vial is consumed) ───────────────────
if (isCoatingItem && isApplyActivity && (macroPass.includes("pretargeting") || macroPass.includes("preitemroll"))) {
  const combat = game.combat;
  if (combat?.started) {
    const turnKey = \`\${combat.id}:\${combat.round}:\${combat.turn}:\${actorDoc.id}\`;
    const last = foundry.utils.getProperty(actorDoc, "flags.world.bow.lastCoatingApplyTurn");
    if (last === turnKey) {
      ui.notifications.warn("Bow Coatings: already applied a coating this turn.");
      if (workflow) workflow.aborted = true;
      return false;
    }
  }
  return;
}

// ── Coating: apply / refresh active AE ──────────────────────────────────────
if (isCoatingItem && isApplyActivity && (macroPass.includes("postactiveeffects") || macroPass === "")) {
  if (macroPass && !macroPass.includes("postactiveeffects") && macroPass !== "") return;

  const coatingKey = String(
    foundry.utils.getProperty(item, "flags.world.bow.coatingKey")
    ?? (item.system?.identifier ?? "").replace(/-coating$/, "")
    ?? "power",
  ).toLowerCase();
  const maxCharges = Math.max(
    1,
    Number(foundry.utils.getProperty(item, "flags.world.bow.chargesPerVial") ?? 3),
  );

  const combat = game.combat;
  if (combat?.started) {
    const turnKey = \`\${combat.id}:\${combat.round}:\${combat.turn}:\${actorDoc.id}\`;
    await actorDoc.setFlag("world", "bow.lastCoatingApplyTurn", turnKey);
  }

  const stale = actorDoc.effects.filter(isCoatingActiveAe);
  if (stale.length) {
    await actorDoc.deleteEmbeddedDocuments("ActiveEffect", stale.map((e) => e.id));
  }

  const template = item.effects.find((ef) =>
    foundry.utils.getProperty(ef, "flags.world.bow.isCoatingTemplate") === true
    || foundry.utils.getProperty(ef, "flags.world.bow.coatingKey") === coatingKey
    || /coating/i.test(ef.name ?? ""),
  );
  if (!template) {
    ui.notifications.error(\`\${item.name}: missing coating Active Effect template.\`);
    return;
  }

  const data = template.toObject();
  delete data._id;
  data.disabled = false;
  data.transfer = false;
  foundry.utils.setProperty(data, "flags.world.bow.isCoatingActive", true);
  foundry.utils.setProperty(data, "flags.world.bow.isCoatingTemplate", false);
  foundry.utils.setProperty(data, "flags.world.bow.coatingKey", coatingKey);
  foundry.utils.setProperty(data, "flags.world.bow.charges", maxCharges);
  foundry.utils.setProperty(data, "flags.world.bow.chargesMax", maxCharges);
  data.name = coatingLabel(coatingKey, maxCharges, maxCharges);
  const [ae] = await actorDoc.createEmbeddedDocuments("ActiveEffect", [data]);

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: actorDoc }),
    content: \`<div class="dnd5e2"><p><strong>\${esc(actorDoc.name)}</strong> applies <em>\${esc(ae.name)}</em>.</p><p>3 coating charges. Spent after the Bow's damage is resolved (or on a miss). Remaining charges are lost if you apply a different coating or finish a Short/Long Rest.</p></div>\`,
  });
  return;
}

// ── Bow weapon ──────────────────────────────────────────────────────────────
if (!isBowWeapon) return;

const isAttackActivity =
  actType === "attack"
  || actId === "attack"
  || actName === "attack";

const isDragonpiercer =
  actId.startsWith("dragonpiercer")
  || actName.includes("dragonpiercer");

// Keep Tracer idle timer fresh on any Bow attack / Dragonpiercer use
if ((isAttackActivity || isDragonpiercer) && (macroPass.includes("postattackroll") || macroPass.includes("postdamageroll") || macroPass.includes("pretargeting"))) {
  if (macroPass.includes("pretargeting") && isDragonpiercer) {
    await refreshTracerIdle();
  }
}

if (!isAttackActivity) return;

const hitCount = workflow?.hitTargets?.size
  ?? args?.[0]?.hitTargets?.size
  ?? 0;
const isHit = hitCount > 0;

const isPostAttack = macroPass.includes("postattackroll");
const isPostDamage = macroPass.includes("postdamageroll");

const shouldResolve =
  (isPostDamage && isHit)
  || (isPostAttack && !isHit)
  || (isPostDamage && !isHit);

if (!shouldResolve) return;

const spendCoatingCharge = async () => {
  const ae = actorDoc.effects.find(isCoatingActiveAe);
  if (!ae) return;

  const maxCharges = Math.max(1, Number(foundry.utils.getProperty(ae, "flags.world.bow.chargesMax") ?? 3));
  let charges = Number(foundry.utils.getProperty(ae, "flags.world.bow.charges") ?? 0);
  const coatingKey = String(foundry.utils.getProperty(ae, "flags.world.bow.coatingKey") ?? "power");

  charges -= 1;
  if (charges <= 0) {
    await ae.delete();
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: actorDoc }),
      content: \`<div class="dnd5e2"><p>Coating expended (0 charges left).</p></div>\`,
    });
    return;
  }

  await ae.update({
    name: coatingLabel(coatingKey, charges, maxCharges),
    "flags.world.bow.charges": charges,
  });
};

const clearSidestepBuff = async () => {
  const buffs = actorDoc.effects.filter(isSidestepAe);
  if (!buffs.length) return;
  await actorDoc.deleteEmbeddedDocuments("ActiveEffect", buffs.map((e) => e.id));
};

const bowSaveDc = () => {
  const dex = Number(actorDoc.system?.abilities?.dex?.mod ?? 0);
  const pb = Number(actorDoc.system?.attributes?.prof ?? 2);
  return 8 + pb + dex;
};

const measureDistanceFt = (fromTok, toTok) => {
  if (!fromTok || !toTok) return Infinity;
  if (globalThis.MidiQOL?.computeDistance) {
    return Number(MidiQOL.computeDistance(fromTok, toTok, { wallsBlock: false })) || Infinity;
  }
  if (canvas?.grid?.measureDistance) {
    return Number(canvas.grid.measureDistance(fromTok.center, toTok.center)) || Infinity;
  }
  return Infinity;
};

const rollAbilitySaveVsDc = async (targetActor, ability, dc, flavor) => {
  if (!targetActor) return null;
  if (typeof targetActor.rollAbilitySave === "function") {
    return targetActor.rollAbilitySave(ability, {
      targetValue: dc,
      fastForward: false,
      chatMessage: true,
      flavor,
    });
  }
  return null;
};

const applyCoatingStatus = async (targetActor, data) => {
  if (!targetActor) return;
  await targetActor.createEmbeddedDocuments("ActiveEffect", [data]);
};

const resolveAdvancedCoatingRider = async () => {
  if (!isHit || !isPostDamage) return;

  const ae = actorDoc.effects.find(isCoatingActiveAe);
  if (!ae) return;

  const coatingKey = String(foundry.utils.getProperty(ae, "flags.world.bow.coatingKey") ?? "").toLowerCase();
  if (!["blast", "poison", "paralysis", "sleep"].includes(coatingKey)) return;

  const dc = bowSaveDc();
  const hits = [...(workflow?.hitTargets ?? args?.[0]?.hitTargets ?? [])];
  const primaryTok = hits[0];
  const primaryActor = primaryTok?.actor ?? primaryTok?.document?.actor;

  if (coatingKey === "blast" && primaryTok) {
    const splashTargets = (canvas?.tokens?.placeables ?? []).filter((tok) => {
      if (tok.id === primaryTok.id) return false;
      const targetActor = tok.actor;
      if (!targetActor || targetActor.uuid === actorDoc.uuid) return false;
      return measureDistanceFt(primaryTok, tok) <= 5;
    });

    for (const tok of splashTargets) {
      const targetActor = tok.actor;
      if (!targetActor) continue;
      const save = await rollAbilitySaveVsDc(targetActor, "dex", dc, "Blast Coating splash");
      if ((save?.total ?? 999) >= dc) continue;
      const roll = await new Roll("1d8").evaluate();
      await roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: actorDoc }),
        flavor: \`Blast Coating — \${targetActor.name}\`,
      });
      if (globalThis.MidiQOL?.applyTokenDamage) {
        await MidiQOL.applyTokenDamage(
          [{ damage: roll.total, type: "fire" }],
          roll.total,
          new Set([tok]),
          item,
          new Set(),
        );
      } else if (typeof targetActor.applyDamage === "function") {
        await targetActor.applyDamage(roll.total);
      }
    }
    return;
  }

  if (!primaryActor) return;

  if (coatingKey === "poison") {
    const save = await rollAbilitySaveVsDc(primaryActor, "con", dc, "Poison Coating");
    if ((save?.total ?? 999) < dc) {
      await applyCoatingStatus(primaryActor, {
        name: "Poison Coating — Poisoned",
        img: "systems/dnd5e/icons/svg/statuses/poisoned.svg",
        type: "base",
        disabled: false,
        transfer: false,
        changes: [],
        duration: { seconds: 60, rounds: 10 },
        statuses: ["poisoned"],
        flags: {
          dae: {
            stackable: "noneName",
            showIcon: true,
            specialDuration: [],
          },
          world: { bow: { isCoatingRider: true, coatingKey: "poison" } },
        },
      });
    }
    return;
  }

  if (coatingKey === "paralysis") {
    const immuneUntil = Number(
      foundry.utils.getProperty(primaryActor, "flags.world.bow.paralysisCoatingImmuneUntil") ?? 0,
    );
    if (immuneUntil && game.time.worldTime < immuneUntil) {
      ui.notifications.info(\`\${primaryActor.name} is immune to Paralysis Coating.\`);
      return;
    }
    const save = await rollAbilitySaveVsDc(primaryActor, "con", dc, "Paralysis Coating");
    if ((save?.total ?? 999) >= dc) {
      await primaryActor.setFlag("world", "bow.paralysisCoatingImmuneUntil", game.time.worldTime + 86400);
      return;
    }
    await applyCoatingStatus(primaryActor, {
      name: "Paralysis Coating — Paralyzed",
      img: "systems/dnd5e/icons/svg/statuses/paralyzed.svg",
      type: "base",
      disabled: false,
      transfer: false,
      changes: [],
      duration: { turns: 1 },
      statuses: ["paralyzed"],
      flags: {
        dae: {
          stackable: "noneName",
          showIcon: true,
          specialDuration: ["turnEndTarget"],
        },
        world: { bow: { isCoatingRider: true, coatingKey: "paralysis" } },
      },
    });
    return;
  }

  if (coatingKey === "sleep") {
    const creatureType = String(primaryActor.system?.details?.type?.value ?? "").toLowerCase();
    if (creatureType.includes("construct") || creatureType.includes("undead")) return;

    const save = await rollAbilitySaveVsDc(primaryActor, "con", dc, "Sleep Coating");
    if ((save?.total ?? 999) < dc) {
      await applyCoatingStatus(primaryActor, {
        name: "Sleep Coating — Unconscious",
        img: "systems/dnd5e/icons/svg/statuses/unconscious.svg",
        type: "base",
        disabled: false,
        transfer: false,
        changes: [],
        duration: { seconds: 60, rounds: 10 },
        statuses: ["unconscious"],
        flags: {
          dae: {
            stackable: "noneName",
            showIcon: true,
            specialDuration: [],
          },
          world: { bow: { isCoatingRider: true, coatingKey: "sleep" } },
        },
      });
    }
  }
};

await resolveAdvancedCoatingRider();
await spendCoatingCharge();
await clearSidestepBuff();

// Tracer I+: gain 1 on a hit with Attack (after damage resolves)
if (isHit && isPostDamage) {
  await gainTracer();
} else if (!isHit && isPostAttack) {
  await refreshTracerIdle();
}
`;
