// Dual Blades — Item Macro (MidiQOL 12.4 / Foundry v12 / dnd5e 4.4)
// On Use: [postActiveEffects]ItemMacro
//
// Demon Dodge:
//   Applies system.attributes.ac.bonus + Proficiency Bonus with dae.specialDuration
//   isAttacked so Midi can recheck the triggering attack (Shield pattern).
//   If the attack misses, move 5 feet without Opportunity Attacks (manual).
//   Rare+: use Perfect Evade for the melee riposte as part of the same Reaction.
//
// Archdemon Mode (Rare+ via flags.world.dualBlades.tier):
//   Clears active Demon Mode AEs when Archdemon Mode is activated.

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

const isDemonDodge =
  actId === "demon-dodge"
  || actName === "demon dodge"
  || (actName.includes("demon dodge") && !actName.includes("perfect"));

const isArchdemon =
  actId === "archdemon-mode"
  || actName === "archdemon mode"
  || actName.includes("archdemon");

const isDemonDance =
  actId === "demon-dance"
  || actName === "demon dance"
  || actName.includes("demon dance");

const isAttack =
  actId === "attack"
  || actName === "attack";

if (!isDemonDodge && !isArchdemon && !isDemonDance && !isAttack) return;
if (macroPass && !macroPass.includes("postactiveeffects")) return;

const actorDoc = actor
  ?? workflow?.actor
  ?? item?.actor
  ?? item?.parent
  ?? (typeof token !== "undefined" ? token?.actor : null);

if (!actorDoc) {
  ui.notifications.warn("Dual Blades: actor not found.");
  return;
}

const tier = String(
  foundry.utils.getProperty(item, "flags.world.dualBlades.tier") ?? "uncommon",
).toLowerCase().replace(/\s+/g, "");

const perfectEvadeEnabled = ["rare", "veryrare", "legendary"].includes(tier);
const heavenlyEnabled = foundry.utils.getProperty(item, "flags.world.dualBlades.heavenlyBladeDance") === true;

const isDemonMode = (ef) => {
  if (ef.disabled) return false;
  const flag = foundry.utils.getProperty(ef, "flags.world.dualBlades.isDemonMode");
  return flag === true || /^demon mode$/i.test(ef.name ?? "");
};

const isDemonDodgeAc = (ef) =>
  foundry.utils.getProperty(ef, "flags.world.dualBlades.isDemonDodgeAc") === true
  || /^demon dodge \(\+/i.test(ef.name ?? "");

// ── Demon Dance ──────────────────────────────────────────────────────────────
if (isDemonDance) {
  const demonModeActive = actorDoc.effects.some(isDemonMode);
  if (!demonModeActive) {
    ui.notifications.warn("Dual Blades: Demon Mode must be active to use Demon Dance.");
    return;
  }
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: actorDoc }),
    content: `<div class="dnd5e2"><p><strong>Demon Dance:</strong> make <strong>four</strong> melee weapon attacks against one creature with <strong>Advantage</strong>. Your speed is 0 until the end of this turn. If all four hit, add [[/r 4d6]] slashing on the last attack.</p></div>`,
  });
  return;
}

// ── Heavenly Blade Dance (on Attack hit) ─────────────────────────────────────
if (isAttack && heavenlyEnabled) {
  const ht = workflow?.hitTargets;
  const hitCount = ht instanceof Set ? ht.size : Array.isArray(ht) ? ht.length : Number(ht?.size ?? 0);
  if (hitCount > 0) {
    const combat = game.combat;
    const turnKey = combat
      ? `${combat.id}:${combat.round}:${combat.turn}`
      : `ooc:${game.time?.worldTime ?? 0}\
