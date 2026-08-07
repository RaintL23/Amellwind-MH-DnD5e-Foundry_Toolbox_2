// Bow Coatings — Item Macros (MidiQOL 12.4 / Foundry v12 / dnd5e 4.4)
//
// EMBEDS:
// 1) Coating consumable (Power / Close Range / …)
//    On Use: [preTargeting]ItemMacro,[postActiveEffects]ItemMacro
//    Activity identifier: apply-coating
// 2) Bow weapon
//    On Use: [postAttackRoll]ItemMacro
//
// Flags:
// - flags.world.bow.isCoating (consumable item)
// - flags.world.bow.coatingKey ("power" | "close-range" | …)
// - flags.world.bow.chargesPerVial (default 3)
// - AE flags.world.bow.isCoatingActive + charges + coatingKey
//
// Apply Coating consumes 1 vial (item uses), recreates an actor AE with 3 charges.
// Switching coatings deletes the previous AE (remaining charges lost).
// Short/Long Rest: DAE specialDuration clears the AE (charges lost).
// Bow attacks spend 1 charge (hit or miss). At 0 the AE is deleted.

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
  ui.notifications.warn("Bow Coatings: actor not found.");
  return;
}

const isCoatingItem = foundry.utils.getProperty(item, "flags.world.bow.isCoating") === true
  || String(item?.system?.identifier ?? "").endsWith("-coating")
  || /coating$/i.test(item?.name ?? "");

const isBowWeapon = foundry.utils.getProperty(item, "flags.world.bow.isBow") === true
  || String(item?.system?.identifier ?? "") === "bow"
  || /^bow\b/i.test(item?.name ?? "");

const isCoatingActiveAe = (ef) =>
  foundry.utils.getProperty(ef, "flags.world.bow.isCoatingActive") === true
  || /coating \(active\)/i.test(ef.name ?? "");

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
  return `${base} (Active) [${charges}/${max}]`;
};

const isApplyActivity =
  actId === "apply-coating"
  || actName.includes("apply coating")
  || actName === "apply";

// ── Coating: once-per-turn gate (before vial is consumed) ───────────────────
if (isCoatingItem && isApplyActivity && (macroPass.includes("pretargeting") || macroPass.includes("preitemroll") || macroPass === "")) {
  // Empty macroPass can happen on some midi builds; only gate when we can detect apply.
  if (macroPass.includes("pretargeting") || macroPass.includes("preitemroll")) {
    const combat = game.combat;
    if (combat?.started) {
      const turnKey = `${combat.id}:${combat.round}:${combat.turn}:${actorDoc.id}`;
      const last = foundry.utils.getProperty(actorDoc, "flags.world.bow.lastCoatingApplyTurn");
      if (last === turnKey) {
        ui.notifications.warn("Bow Coatings: already applied a coating this turn.");
        if (workflow) workflow.aborted = true;
        return false;
      }
    }
    // Allow the activity to proceed; mark the turn after success in postActiveEffects.
    return;
  }
}

// ── Coating: apply / refresh active AE ──────────────────────────────────────
if (isCoatingItem && isApplyActivity && (macroPass.includes("postactiveeffects") || macroPass === "")) {
  if (macroPass && !macroPass.includes("postactiveeffects")) return;

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
    const turnKey = `${combat.id}:${combat.round}:${combat.turn}:${actorDoc.id}`;
    await actorDoc.setFlag("world", "bow.lastCoatingApplyTurn", turnKey);
  }

  // Recreate AE from this vial's template (previous coating charges are lost).
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
    ui.notifications.error(`${item.name}: missing coating Active Effect template.`);
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
    content: `<div class="dnd5e2"><p><strong>${esc(actorDoc.name)}</strong> applies <em>${esc(ae.name)}</em>.</p><p>3 coating charges. Spent when you make a ranged attack with the Bow (hit or miss). Remaining charges are lost if you apply a different coating or finish a Short/Long Rest.</p></div>`,
  });
  return;
}

// ── Bow weapon: spend coating charge on attack ──────────────────────────────
if (!isBowWeapon) return;
if (macroPass && !macroPass.includes("postattackroll")) return;

const isAttackActivity =
  actType === "attack"
  || actId === "attack"
  || actName === "attack";

if (!isAttackActivity) return;

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
    content: `<div class="dnd5e2"><p>Coating expended (0 charges left).</p></div>`,
  });
  return;
}

await ae.update({
  name: coatingLabel(coatingKey, charges, maxCharges),
  "flags.world.bow.charges": charges,
});
