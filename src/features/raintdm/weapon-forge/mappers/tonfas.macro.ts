/**
 * Tonfas — Item Macro (MidiQOL 12.4 / Foundry v12 / dnd5e 4.4).
 * On Use: [preTargeting]ItemMacro,[postActiveEffects]ItemMacro
 *
 * Spirit Gauge:
 *   On a melee Attack hit, recover 1 Spirit Charge (pool starts empty).
 *   Spirit Burst spends are handled by the damage activity.
 *
 * Tonfa Styles:
 *   Bonus Action toggle cycles Sky Style ↔ Earth Style on the actor.
 */
export const TONFAS_ITEM_MACRO = `// Tonfas — Item Macro (MidiQOL 12.4 / Foundry v12 / dnd5e 4.4)
// On Use: [preTargeting]ItemMacro,[postActiveEffects]ItemMacro
//
// Spirit Gauge: +1 charge on a melee Attack hit (not Spirit Burst).
// Tonfa Styles: toggle Sky Style ↔ Earth Style (flags.world.tonfas.style).

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
const actId = String(
  rolled?.identifier
  ?? rolled?.midiProperties?.identifier
  ?? workflow?.activity?.identifier
  ?? workflow?.activity?.midiProperties?.identifier
  ?? "",
).toLowerCase();

const isAttack =
  rolled?.type === "attack"
  || workflow?.activity?.type === "attack"
  || actId === "attack"
  || actName === "attack"
  || actName === "";

const isSpiritBurst =
  actId.includes("spirit-burst")
  || actName.includes("spirit burst");

const isTonfaStyles =
  actId.includes("tonfa-styles")
  || actName.includes("tonfa styles");

const itemDoc = item ?? workflow?.item ?? args?.[0]?.item ?? null;
const actorDoc = actor ?? workflow?.actor ?? itemDoc?.actor ?? null;

async function recoverSpiritCharges(amount = 1) {
  if (!itemDoc?.update || amount <= 0) return;
  const uses = itemDoc.system?.uses;
  const max = Number.parseInt(String(uses?.max ?? ""), 10);
  const spent = Number.parseInt(String(uses?.spent ?? 0), 10);
  if (!Number.isFinite(max) || max <= 0) return;
  const nextSpent = Math.max(0, spent - amount);
  if (nextSpent === spent) return;
  await itemDoc.update({ "system.uses.spent": nextSpent });
}

async function toggleTonfaStyle() {
  if (!actorDoc?.update) return;
  const path = "flags.world.tonfas.style";
  const current = String(foundry.utils.getProperty(actorDoc, path) ?? "sky").toLowerCase();
  const next = current === "earth" ? "sky" : "earth";
  await actorDoc.update({ [path]: next });
  const label = next === "earth" ? "Earth Style" : "Sky Style";
  ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: actorDoc }),
    content: \`<p><strong>Tonfa Styles:</strong> \${esc(label)} active.</p>\`,
  });
}

if (macroPass.includes("pretargeting") || macroPass.includes("preitemroll")) {
  if (isTonfaStyles) {
    await toggleTonfaStyle();
  }
  return;
}

if (!macroPass.includes("postactiveeffects")) return;

if (isAttack && !isSpiritBurst) {
  const hitCount = Number(
    workflow?.hitTargets?.size
    ?? workflow?.damageRoll?.options?.hitCount
    ?? 0,
  );
  if (hitCount > 0 || workflow?.hitTargets?.size > 0) {
    await recoverSpiritCharges(1);
  }
}
`;
