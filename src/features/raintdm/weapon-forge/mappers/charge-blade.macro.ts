/**
 * Charge Blade — Item Macro (MidiQOL 12.4 / Foundry v12 / dnd5e 4.4).
 * On Use: [preTargeting]ItemMacro,[preDamageRoll]ItemMacro,[postDamageRoll]ItemMacro,[postActiveEffects]ItemMacro
 *
 * Placeholders replaced at export:
 *   __GUARD_POINT_DAMAGE__ / __ELEMENTAL_DISCHARGE_DAMAGE__ / __AED_DAMAGE__ / __ELEMENTAL_TYPE__
 */
export const CHARGE_BLADE_ITEM_MACRO = `// Charge Blade — Item Macro (MidiQOL 12.4 / Foundry v12 / dnd5e 4.4)
// On Use: [preTargeting]ItemMacro,[preDamageRoll]ItemMacro,[postDamageRoll]ItemMacro,[postActiveEffects]ItemMacro

const GUARD_POINT_DAMAGE = "__GUARD_POINT_DAMAGE__";
const ELEMENTAL_DISCHARGE_DAMAGE = "__ELEMENTAL_DISCHARGE_DAMAGE__";
const AED_DAMAGE = "__AED_DAMAGE__";
const ELEMENTAL_TYPE = "__ELEMENTAL_TYPE__";

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

const actName = String(rolled?.name ?? workflow?.activity?.name ?? "").toLowerCase().trim();
const actMidi = rolled?.midiProperties ?? workflow?.activity?.midiProperties ?? {};
const actId = String(
  rolled?.identifier
  ?? actMidi?.identifier
  ?? workflow?.activity?.identifier
  ?? "",
).toLowerCase().trim();

const weaponItem = item
  ?? workflow?.item
  ?? args?.[0]?.item
  ?? null;

const actorDoc = actor
  ?? workflow?.actor
  ?? weaponItem?.actor
  ?? weaponItem?.parent
  ?? (typeof token !== "undefined" ? token?.actor : null);

if (!weaponItem || !actorDoc) return;

const elementalType = String(
  foundry.utils.getProperty(weaponItem, "flags.world.chargeBlade.elementalType")
  ?? ELEMENTAL_TYPE
  ?? "",
).toLowerCase();

const dischargeDie = String(
  foundry.utils.getProperty(weaponItem, "flags.world.chargeBlade.elementalDischargeDamage")
  ?? ELEMENTAL_DISCHARGE_DAMAGE
  ?? "1d6",
);
const aedDie = String(
  foundry.utils.getProperty(weaponItem, "flags.world.chargeBlade.aedDamage")
  ?? AED_DAMAGE
  ?? "1d8",
);
const guardDie = String(
  foundry.utils.getProperty(weaponItem, "flags.world.chargeBlade.guardPointDamage")
  ?? GUARD_POINT_DAMAGE
  ?? "1d4",
);

const isModeEf = (ef) =>
  foundry.utils.getProperty(ef, "flags.world.cb.isModeIndicator") === true
  || /^(axe|sword(&?\\s*shield)?)\\s*mode$/i.test(ef.name ?? "")
  || /^sword\\s*&\\s*shield\\s*mode$/i.test(ef.name ?? "");

const modeKeyOf = (ef) => {
  const flagged = String(foundry.utils.getProperty(ef, "flags.world.cb.modeKey") ?? "").toLowerCase();
  if (flagged === "axe" || flagged === "sword") return flagged;
  if (/^axe\\s*mode$/i.test(ef.name ?? "")) return "axe";
  if (/sword/i.test(ef.name ?? "")) return "sword";
  return "";
};

const collectModeEffects = () => {
  const list = [];
  for (const ef of weaponItem.effects ?? []) {
    if (isModeEf(ef)) list.push(ef);
  }
  for (const ef of actorDoc.effects ?? []) {
    if (isModeEf(ef)) list.push(ef);
  }
  return list;
};

const currentMode = () => {
  const actorMode = String(foundry.utils.getProperty(actorDoc, "flags.world.cb.mode") ?? "").toLowerCase();
  if (actorMode === "axe" || actorMode === "sword") return actorMode;
  for (const ef of collectModeEffects()) {
    if (ef.disabled) continue;
    const key = modeKeyOf(ef);
    if (key) return key;
  }
  return "sword";
};

const isIntegratedShieldEf = (ef) =>
  foundry.utils.getProperty(ef, "flags.world.integratedShield.isIntegratedShield") === true
  || /^integrated\\s*shield/i.test(ef.name ?? "");

const collectIntegratedShieldEffects = () => {
  const list = [];
  for (const ef of weaponItem.effects ?? []) {
    if (isIntegratedShieldEf(ef)) list.push(ef);
  }
  for (const ef of actorDoc.effects ?? []) {
    if (isIntegratedShieldEf(ef)) list.push(ef);
  }
  return list;
};

const setMode = async (mode) => {
  const want = mode === "axe" ? "axe" : "sword";
  const ops = [];
  for (const ef of collectModeEffects()) {
    const key = modeKeyOf(ef);
    if (key !== "axe" && key !== "sword") continue;
    ops.push(ef.update({ disabled: key !== want }));
  }
  const shieldDisabled = want === "axe";
  for (const ef of collectIntegratedShieldEffects()) {
    if (Boolean(ef.disabled) !== shieldDisabled) {
      ops.push(ef.update({ disabled: shieldDisabled }));
    }
  }
  if (ops.length) await Promise.all(ops);

  const swordMastery = String(
    foundry.utils.getProperty(weaponItem, "flags.world.chargeBlade.swordMastery")
    ?? "sap",
  ).toLowerCase();
  const axeMastery = String(
    foundry.utils.getProperty(weaponItem, "flags.world.chargeBlade.axeMastery")
    ?? "cleave",
  ).toLowerCase();
  const mastery = want === "axe" ? axeMastery : swordMastery;
  try {
    await weaponItem.update({ "system.mastery": mastery });
  } catch (_) { /* ignore */ }

  try {
    await actorDoc.setFlag("world", "cb.mode", want);
  } catch (_) {
    await actorDoc.update({ "flags.world.cb.mode": want });
  }
  return { mode: want, mastery };
};

const phialAvailable = () => {
  const uses = weaponItem.system?.uses;
  if (!uses) return 0;
  const max = Math.max(0, Number(uses.max) || 0);
  const spent = Math.max(0, Number(uses.spent) || 0);
  return Math.max(0, max - spent);
};

const spendPhials = async (n) => {
  const uses = weaponItem.system?.uses;
  if (!uses) return false;
  const max = Math.max(0, Number(uses.max) || 0);
  const spent = Math.max(0, Number(uses.spent) || 0);
  const available = Math.max(0, max - spent);
  const take = Math.min(Math.max(0, Number(n) || 0), available);
  if (take <= 0) return false;
  await weaponItem.update({ "system.uses.spent": spent + take });
  return true;
};

const confirmDialog = (title, content, yesLabel = "Yes", noLabel = "No") =>
  new Promise((resolve) => {
    let settled = false;
    const done = (v) => {
      if (!settled) {
        settled = true;
        resolve(v);
      }
    };
    new Dialog({
      title,
      content: \`<div class="dnd5e2">\${content}</div>\`,
      buttons: {
        yes: {
          icon: '<i class="fas fa-check"></i>',
          label: yesLabel,
          callback: () => done(true),
        },
        no: {
          icon: '<i class="fas fa-times"></i>',
          label: noLabel,
          callback: () => done(false),
        },
      },
      default: "yes",
      close: () => done(false),
    }).render(true);
  });

/** @returns {Promise<number|null>} */
const aedChargesDialog = (available) =>
  new Promise((resolve) => {
    let settled = false;
    const done = (v) => {
      if (!settled) {
        settled = true;
        resolve(v);
      }
    };
    const aedDenom = Number(String(aedDie).match(/d(\\d+)/i)?.[1] || 8);
    const buttons = {};
    for (let n = 1; n <= available; n += 1) {
      buttons[\`n\${n}\`] = {
        icon: '<i class="fas fa-bolt"></i>',
        label: \`×\${n} (+\${n}d\${aedDenom} \${elementalType})\`,
        callback: () => done(n),
      };
    }
    buttons.cancel = {
      icon: '<i class="fas fa-times"></i>',
      label: "Cancel",
      callback: () => done(null),
    };
    new Dialog({
      title: "Amped Element Discharge (AED)",
      content: \`<div class="dnd5e2"><p>Phial Charges available: <strong>\${available}</strong>.</p><p>How many charges do you expend for the 15-ft cone?</p></div>\`,
      buttons,
      default: "n1",
      close: () => done(null),
    }).render(true);
  });

const setActivityDamageNumber = (act, n) => {
  if (!act?.damage?.parts?.[0]) return;
  const part0 = act.damage.parts[0];
  try {
    if (typeof act.updateSource === "function") {
      const parts = foundry.utils.duplicate(act.damage.parts);
      parts[0].number = n;
      act.updateSource({ "damage.parts": parts });
      return;
    }
  } catch (_) { /* fall through */ }
  part0.number = n;
};

const listActivities = () => {
  const col = weaponItem.system?.activities;
  if (!col) return [];
  if (typeof col === "object" && Array.isArray(col.contents)) return col.contents;
  if (typeof col.values === "function") return [...col.values()];
  return Object.values(col);
};

const findElementalDischargeActivity = () => {
  const list = listActivities();
  return list.find((a) => {
    const id = String(a?.identifier ?? a?.midiProperties?.identifier ?? "").toLowerCase();
    const name = String(a?.name ?? "").toLowerCase();
    return id === "elemental-discharge" || name === "elemental discharge";
  }) ?? null;
};

const elementalTypeDialog = () =>
  new Promise((resolve) => {
    let settled = false;
    const done = (v) => {
      if (!settled) {
        settled = true;
        resolve(v);
      }
    };
    const buttons = {};
    for (const type of ["acid", "cold", "fire", "lightning"]) {
      const label = type.charAt(0).toUpperCase() + type.slice(1);
      buttons[type] = {
        icon: '<i class="fas fa-flask"></i>',
        label,
        callback: () => done(type),
      };
    }
    buttons.cancel = {
      icon: '<i class="fas fa-times"></i>',
      label: "Cancel",
      callback: () => done(null),
    };
    new Dialog({
      title: "Elemental Attunement",
      content: \`<div class="dnd5e2"><p>Choose the element attuned to this Charge Blade.</p><p>Current: <strong>\${esc(elementalType || "none")}</strong></p></div>\`,
      buttons,
      default: elementalType || "fire",
      close: () => done(null),
    }).render(true);
  });

const applyElementalType = async (type) => {
  const pretty = type.charAt(0).toUpperCase() + type.slice(1);
  const updates = {
    "flags.world.chargeBlade.elementalType": type,
  };
  for (const act of listActivities()) {
    const id = act?.id ?? act?._id;
    if (!id) continue;
    const name = String(act?.name ?? "");
    const nameLc = name.toLowerCase();
    if (/^elemental\\s*attunement/i.test(name)) {
      updates[\`system.activities.\${id}.name\`] = \`Elemental Attunement (\${pretty})\`;
      updates[\`system.activities.\${id}.description.chatFlavor\`] =
        \`Currently attuned to \${type}. Once per Short or Long Rest, use this to change Acid / Cold / Fire / Lightning.\`;
      continue;
    }
    const touchesElement =
      /^guard\\s*point:\\s*eruption$/i.test(nameLc)
      || /^elemental\\s*discharge$/i.test(nameLc)
      || /amped\\s*element\\s*discharge/i.test(nameLc);
    if (!touchesElement || !act?.damage?.parts?.[0]) continue;
    const parts = foundry.utils.duplicate(act.damage.parts);
    parts[0].types = [type];
    updates[\`system.activities.\${id}.damage.parts\`] = parts;
  }
  await weaponItem.update(updates);
  return pretty;
};

const isElementalAttunement =
  actId === "elemental-attunement"
  || /^elemental\\s*attunement/i.test(actName);

const isSwordAttack =
  actId === "sword-shield"
  || actId === "sword--shield"
  || (actId.includes("sword") && actId.includes("shield"))
  || /^sword\\s*&\\s*shield$/i.test(actName);

const isAxeAttack = actId === "axe" || actName === "axe";

const isSwitchMode =
  actId === "switch-mode"
  || actName === "switch mode"
  || actName.includes("switch mode");

const isGuardPoint =
  actId === "guard-point"
  || (actId.includes("guard-point") && !actId.includes("eruption"))
  || (/guard\\s*point/i.test(actName) && !/eruption/i.test(actName));

const isElementalDischarge =
  actId === "elemental-discharge"
  || actName === "elemental discharge";

const isAed =
  actId === "aed"
  || actId.startsWith("aed")
  || actName.includes("amped element discharge");

const isPre = macroPass.includes("pretargeting");
const isPreDamage = macroPass.includes("predamageroll");
const isPostDamage = macroPass.includes("postdamageroll");
const isPostAe = macroPass.includes("postactiveeffects");

// ── Elemental Attunement (indicate / change damage type) ────────────────────
if (isElementalAttunement && (isPostAe || !macroPass)) {
  const chosen = await elementalTypeDialog();
  if (!chosen) {
    // Refund the 1/rest use if the player cancels without choosing.
    try {
      const act = rolled ?? workflow?.activity;
      const uses = act?.uses;
      if (uses && Number(uses.spent) > 0 && typeof act.update === "function") {
        await act.update({ "uses.spent": Math.max(0, Number(uses.spent) - 1) });
      } else if (act?.id || act?._id) {
        const id = act.id ?? act._id;
        const spent = Number(
          foundry.utils.getProperty(weaponItem, \`system.activities.\${id}.uses.spent\`) || 1,
        );
        await weaponItem.update({
          [\`system.activities.\${id}.uses.spent\`]: Math.max(0, spent - 1),
        });
      }
    } catch (_) { /* ignore refund failures */ }
    return;
  }
  const pretty = await applyElementalType(chosen);
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: actorDoc }),
    content: \`<div class="dnd5e2"><p><strong>Elemental Attunement</strong> — \${esc(actorDoc.name)} attunes the Charge Blade to <strong>\${esc(pretty)}</strong>.</p></div>\`,
  });
  return;
}

// ── Switch Mode ─────────────────────────────────────────────────────────────
if (isSwitchMode && (isPostAe || !macroPass)) {
  const next = currentMode() === "axe" ? "sword" : "axe";
  const applied = await setMode(next);
  const masteryLabel = String(applied.mastery || "").toUpperCase() || "—";
  const shieldLine = applied.mode === "axe"
    ? "<p>Integrated Shield AC bonus is removed while in Axe Mode.</p>"
    : "<p>Integrated Shield AC bonus is restored.</p>";
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: actorDoc }),
    content: \`<div class="dnd5e2"><p><strong>Switch Mode</strong> — \${esc(actorDoc.name)} switches to <strong>\${applied.mode === "axe" ? "Axe Mode" : "Sword &amp; Shield Mode"}</strong> (Mastery: <strong>\${esc(masteryLabel)}</strong>).</p>\${shieldLine}</div>\`,
  });
  return;
}

// ── Wrong-mode gates ────────────────────────────────────────────────────────
if (isPre && isSwordAttack && currentMode() === "axe") {
  ui.notifications.warn("Charge Blade: Sword & Shield Attack requires Sword & Shield Mode (Switch Mode).");
  if (typeof workflow !== "undefined" && workflow) workflow.aborted = true;
  return false;
}

if (isPre && isAxeAttack && currentMode() !== "axe") {
  ui.notifications.warn("Charge Blade: Axe Attack requires Axe Mode (Switch Mode).");
  if (typeof workflow !== "undefined" && workflow) workflow.aborted = true;
  return false;
}

if (isPre && (isElementalDischarge || isAed) && currentMode() !== "axe") {
  ui.notifications.warn("Charge Blade: Elemental Discharge / AED requires Axe Mode.");
  if (typeof workflow !== "undefined" && workflow) workflow.aborted = true;
  return false;
}

// ── AED: choose spend + scale damage ────────────────────────────────────────
if (isAed && (isPre || isPreDamage)) {
  if (isPre) {
    if (!elementalType) {
      ui.notifications.warn("Charge Blade: choose Elemental Attunement first.");
      if (typeof workflow !== "undefined" && workflow) workflow.aborted = true;
      return false;
    }
    const available = phialAvailable();
    if (available <= 0) {
      ui.notifications.warn("Charge Blade: AED needs ≥1 Phial Charge.");
      if (typeof workflow !== "undefined" && workflow) workflow.aborted = true;
      return false;
    }
    const n = await aedChargesDialog(available);
    if (!n) {
      if (typeof workflow !== "undefined" && workflow) workflow.aborted = true;
      return false;
    }
    const ok = await spendPhials(n);
    if (!ok) {
      ui.notifications.warn("Charge Blade: could not spend Phial Charges.");
      if (typeof workflow !== "undefined" && workflow) workflow.aborted = true;
      return false;
    }
    try {
      await weaponItem.setFlag("world", "cb.aedSpend", n);
    } catch (_) {
      await weaponItem.update({ "flags.world.cb.aedSpend": n });
    }
    setActivityDamageNumber(rolled, n);
    setActivityDamageNumber(workflow?.activity, n);
    return;
  }
  if (isPreDamage) {
    const n = Number(
      foundry.utils.getProperty(weaponItem, "flags.world.cb.aedSpend") || 0,
    );
    if (n > 0) {
      setActivityDamageNumber(rolled, n);
      setActivityDamageNumber(workflow?.activity, n);
    }
  }
  return;
}

// ── Guard Point (Shield pattern) ────────────────────────────────────────────
if (isGuardPoint && (isPostAe || !macroPass)) {
  if (currentMode() !== "sword") {
    ui.notifications.warn("Charge Blade: Guard Point requires Sword & Shield Mode.");
    return;
  }
  const available = phialAvailable();
  if (available <= 0) {
    ui.notifications.warn("Charge Blade: Guard Point needs ≥1 Phial Charge.");
    return;
  }
  await spendPhials(1);

  const isGuardAc = (ef) =>
    foundry.utils.getProperty(ef, "flags.world.cb.isGuardPointAc") === true
    || /^guard point \\(\\+/i.test(ef.name ?? "");

  const stale = actorDoc.effects.filter(isGuardAc);
  if (stale.length) {
    await actorDoc.deleteEmbeddedDocuments("ActiveEffect", stale.map((e) => e.id));
  }

  await actorDoc.createEmbeddedDocuments("ActiveEffect", [
    {
      name: "Guard Point (+2 AC)",
      img: "icons/skills/melee/shield-block-gray-orange.webp",
      transfer: false,
      disabled: false,
      changes: [
        {
          key: "system.attributes.ac.bonus",
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          value: "2",
          priority: 20,
        },
      ],
      duration: {
        startTime: null,
        seconds: null,
        combat: null,
        rounds: null,
        turns: null,
        startRound: null,
        startTurn: null,
      },
      flags: {
        dae: {
          specialDuration: ["isAttacked"],
          stackable: "noneName",
          showIcon: true,
          selfTarget: true,
          selfTargetAlways: true,
          dontApply: false,
        },
        world: { cb: { isGuardPointAc: true } },
      },
    },
  ]);

  const left = phialAvailable();
  const max = Math.max(0, Number(weaponItem.system?.uses?.max) || 0);
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: actorDoc }),
    content: \`<div class="dnd5e2"><p><strong>\${esc(actorDoc.name)}</strong> uses Guard Point: <strong>+2 AC</strong> against the triggering attack (Shield pattern). Phial Charges: \${left}/\${max}.</p><p>If the attack misses, use <strong>Guard Point: Eruption</strong> for [[/r \${guardDie}]][\${esc(elementalType)}] damage.</p></div>\`,
  });
  return;
}

// ── Axe hit → offer Elemental Discharge ─────────────────────────────────────
if (isPostDamage && isAxeAttack) {
  const hitCount = workflow?.hitTargets?.size
    ?? args?.[0]?.hitTargets?.size
    ?? 0;
  if (hitCount <= 0) return;
  if (currentMode() !== "axe") return;
  if (phialAvailable() <= 0) return;
  if (!elementalType) {
    ui.notifications.warn("Charge Blade: choose Elemental Attunement before Elemental Discharge.");
    return;
  }

  const yes = await confirmDialog(
    "Elemental Discharge",
    \`<p>Expend <strong>1 Phial Charge</strong> to deal extra <strong>[[/r \${dischargeDie}]][\${esc(elementalType)}]</strong> (\${esc(elementalType)})?</p>\`,
    "Discharge",
    "Skip",
  );
  if (!yes) return;

  const discharge = findElementalDischargeActivity();
  if (discharge && globalThis.MidiQOL?.completeActivityUse) {
    try {
      await MidiQOL.completeActivityUse(discharge.uuid ?? {
        itemUuid: weaponItem.uuid,
        activityId: discharge.id ?? discharge._id,
      }, { midiOptions: { targetUuids: [...(workflow?.hitTargets ?? [])].map((t) => t.document?.uuid).filter(Boolean) } });
      return;
    } catch (err) {
      console.warn("Charge Blade Elemental Discharge activity failed; falling back to roll.", err);
    }
  }

  const ok = await spendPhials(1);
  if (!ok) return;
  const roll = await new Roll(\`\${dischargeDie}[\${elementalType}]\`).evaluate();
  await roll.toMessage({
    speaker: ChatMessage.getSpeaker({ actor: actorDoc }),
    flavor: \`Elemental Discharge (\${elementalType})\`,
  });
  return;
}

// ── Phial Charges: recover on Sword & Shield hit ───────────────────────────
if (!isPostDamage || !isSwordAttack) return;

const hitCount = workflow?.hitTargets?.size
  ?? args?.[0]?.hitTargets?.size
  ?? 0;
if (hitCount <= 0) return;

const uses = weaponItem.system?.uses;
if (!uses) return;
const max = Math.max(0, Number(uses.max) || 0);
if (max <= 0) return;
const spent = Math.max(0, Number(uses.spent) || 0);
if (spent <= 0) return;

const gain = Math.min(1, spent);
if (gain <= 0) return;

await weaponItem.update({ "system.uses.spent": spent - gain });
const available = max - (spent - gain);

await ChatMessage.create({
  speaker: ChatMessage.getSpeaker({ actor: actorDoc }),
  content: \`<div class="dnd5e2"><p><strong>Phial Charges</strong> — generated \${gain} charge (\${available}/\${max}).</p></div>\`,
});
`;
