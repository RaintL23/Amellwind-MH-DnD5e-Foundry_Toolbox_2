/**
 * Switch Axe — Item Macro (MidiQOL 12.4 / Foundry v12 / dnd5e 4.4).
 * On Use: [preTargeting]ItemMacro,[postDamageRoll]ItemMacro,[postActiveEffects]ItemMacro
 *
 * - Fluid Morph: toggle Axe Mode ↔ Sword Mode indicator AEs
 * - Kinetic Generator: on Axe hit, recover Phial Gauge uses
 * - 0-charge Sword actions: abort and revert to Axe Mode
 * - ZSD: after use, force Axe Mode and empty the gauge
 */
export const SWITCH_AXE_ITEM_MACRO = `// Switch Axe — Item Macro (MidiQOL 12.4 / Foundry v12 / dnd5e 4.4)
// On Use: [preTargeting]ItemMacro,[postDamageRoll]ItemMacro,[postActiveEffects]ItemMacro

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

const isModeEf = (ef) =>
  foundry.utils.getProperty(ef, "flags.world.sa.isModeIndicator") === true
  || /^(axe|sword)\\s*mode$/i.test(ef.name ?? "");

const modeKeyOf = (ef) => {
  const flagged = String(foundry.utils.getProperty(ef, "flags.world.sa.modeKey") ?? "").toLowerCase();
  if (flagged === "axe" || flagged === "sword") return flagged;
  if (/^axe\\s*mode$/i.test(ef.name ?? "")) return "axe";
  if (/^sword\\s*mode$/i.test(ef.name ?? "")) return "sword";
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
  const actorMode = String(foundry.utils.getProperty(actorDoc, "flags.world.sa.mode") ?? "").toLowerCase();
  if (actorMode === "axe" || actorMode === "sword") return actorMode;
  for (const ef of collectModeEffects()) {
    if (ef.disabled) continue;
    const key = modeKeyOf(ef);
    if (key) return key;
  }
  return "axe";
};

const setMode = async (mode) => {
  const want = mode === "sword" ? "sword" : "axe";
  const ops = [];
  for (const ef of collectModeEffects()) {
    const key = modeKeyOf(ef);
    if (key !== "axe" && key !== "sword") continue;
    ops.push(ef.update({ disabled: key !== want }));
  }
  if (ops.length) await Promise.all(ops);
  try {
    await actorDoc.setFlag("world", "sa.mode", want);
  } catch (_) {
    await actorDoc.update({ "flags.world.sa.mode": want });
  }
  return want;
};

const phialAvailable = () => {
  const uses = weaponItem.system?.uses;
  if (!uses) return 0;
  const max = Math.max(0, Number(uses.max) || 0);
  const spent = Math.max(0, Number(uses.spent) || 0);
  return Math.max(0, max - spent);
};

const emptyGauge = async () => {
  const uses = weaponItem.system?.uses;
  if (!uses) return;
  const max = Math.max(0, Number(uses.max) || 0);
  await weaponItem.update({ "system.uses.spent": max });
};

const isAxeAttack = actId === "axe" || actName === "axe";
const isFluidMorph =
  actId === "fluid-morph"
  || actName === "fluid morph"
  || actName.includes("fluid morph");
const isPhialDischarge =
  actId.startsWith("phial-discharge")
  || actName.includes("phial discharge");
const isZsd =
  actId.includes("zero-sum-discharge")
  || actId.includes("zsd")
  || actName.includes("zero sum discharge")
  || /\\bzsd\\b/.test(actName);

const isPre = macroPass.includes("pretargeting");
const isPostDamage = macroPass.includes("postdamageroll");
const isPostAe = macroPass.includes("postactiveeffects");

// ── Fluid Morph: toggle mode indicators ────────────────────────────────────
if (isFluidMorph && (isPostAe || !macroPass)) {
  const next = currentMode() === "sword" ? "axe" : "sword";
  const applied = await setMode(next);
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: actorDoc }),
    content: \`<div class="dnd5e2"><p><strong>Fluid Morph</strong> — \${esc(actorDoc.name)} switches to <strong>\${applied === "sword" ? "Sword Mode" : "Axe Mode"}</strong>.</p></div>\`,
  });
  return;
}

// ── Sword actions with 0 Phial Charges: abort + revert ──────────────────────
if (isPre && (isPhialDischarge || isZsd)) {
  if (phialAvailable() <= 0) {
    await setMode("axe");
    ui.notifications.warn("Switch Axe: no Phial Charges — reverted to Axe Mode.");
    if (typeof workflow !== "undefined" && workflow) workflow.aborted = true;
    return false;
  }
  if (currentMode() !== "sword") {
    ui.notifications.warn("Switch Axe: enter Sword Mode with Fluid Morph first.");
    if (typeof workflow !== "undefined" && workflow) workflow.aborted = true;
    return false;
  }
  return;
}

// ── Axe attack only while in Axe Mode ──────────────────────────────────────
if (isPre && isAxeAttack && currentMode() === "sword") {
  ui.notifications.warn("Switch Axe: Axe Attack requires Axe Mode (Fluid Morph).");
  if (typeof workflow !== "undefined" && workflow) workflow.aborted = true;
  return false;
}

// ── ZSD: force Axe Mode + empty gauge after resolution ─────────────────────
if (isZsd && (isPostAe || isPostDamage)) {
  await emptyGauge();
  await setMode("axe");
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: actorDoc }),
    content: \`<div class="dnd5e2"><p><strong>Zero Sum Discharge</strong> — recoil reverts to <strong>Axe Mode</strong> with 0 Phial Charges.</p></div>\`,
  });
  return;
}

// ── Kinetic Generator: recover on Axe hit ──────────────────────────────────
if (!isPostDamage || !isAxeAttack) return;

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

const isCrit = Boolean(
  workflow?.isCritical
  ?? workflow?.attackRoll?.isCritical
  ?? args?.[0]?.isCritical
  ?? false,
);
const gain = Math.min(isCrit ? 2 : 1, spent);
if (gain <= 0) return;

await weaponItem.update({ "system.uses.spent": spent - gain });
const available = max - (spent - gain);

await ChatMessage.create({
  speaker: ChatMessage.getSpeaker({ actor: actorDoc }),
  content: \`<div class="dnd5e2"><p><strong>Kinetic Generator</strong> — recovered \${gain} Phial Charge\${gain === 1 ? "" : "s"} (\${available}/\${max})\${isCrit ? " <em>(critical)</em>" : ""}.</p></div>\`,
});
`;

/** @deprecated Use {@link SWITCH_AXE_ITEM_MACRO} */
export const SWITCH_AXE_KINETIC_ITEM_MACRO = SWITCH_AXE_ITEM_MACRO;
