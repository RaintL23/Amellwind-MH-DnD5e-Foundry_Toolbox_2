/**
 * Dual Blades — Item Macro (MidiQOL 12.4 / Foundry v12 / dnd5e 4.4).
 * On Use: [postActiveEffects]ItemMacro
 *
 * Demon Dodge:
 *   Applies system.attributes.ac.bonus + Proficiency Bonus with dae.specialDuration
 *   isAttacked so Midi can recheck the triggering attack (Shield pattern).
 *   If the attack misses, move 5 feet without Opportunity Attacks (manual).
 *   Rare+: remind to use Perfect Evade for the riposte attack.
 *
 * Archdemon Mode (Rare+):
 *   When activated, removes active Demon Mode AEs so only Archdemon damage remains.
 */
export const DUAL_BLADES_DEMON_DODGE_ITEM_MACRO = `// Dual Blades — Item Macro (MidiQOL 12.4 / Foundry v12 / dnd5e 4.4)
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
).toLowerCase().replace(/\\s+/g, "");

const perfectEvadeEnabled = ["rare", "veryrare", "legendary"].includes(tier);
const heavenlyEnabled = foundry.utils.getProperty(item, "flags.world.dualBlades.heavenlyBladeDance") === true;

const isDemonMode = (ef) => {
  if (ef.disabled) return false;
  const flag = foundry.utils.getProperty(ef, "flags.world.dualBlades.isDemonMode");
  return flag === true || /^demon mode$/i.test(ef.name ?? "");
};

const isDemonDodgeAc = (ef) =>
  foundry.utils.getProperty(ef, "flags.world.dualBlades.isDemonDodgeAc") === true
  || /^demon dodge \\(\\+/i.test(ef.name ?? "");

// ── Demon Dance ──────────────────────────────────────────────────────────────
if (isDemonDance) {
  const demonModeActive = actorDoc.effects.some(isDemonMode);
  if (!demonModeActive) {
    ui.notifications.warn("Dual Blades: Demon Mode must be active to use Demon Dance.");
    return;
  }
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: actorDoc }),
    content: \`<div class="dnd5e2"><p><strong>Demon Dance:</strong> make <strong>four</strong> melee weapon attacks against one creature with <strong>Advantage</strong>. Your speed is 0 until the end of this turn. If all four hit, add [[/r 4d6]] slashing on the last attack.</p></div>\`,
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
      ? \`\${combat.id}:\${combat.round}:\${combat.turn}\`
      : \`ooc:\${game.time?.worldTime ?? 0}\`;
    const used = foundry.utils.getProperty(item, "flags.world.dualBlades.heavenlyUsedTurn");
    if (used !== turnKey) {
      await item.setFlag("world", "dualBlades.heavenlyUsedTurn", turnKey);
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: actorDoc }),
        content: \`<div class="dnd5e2"><p><strong>Heavenly Blade Dance:</strong> if you moved through this Large+ creature's space this turn, add [[/r 2d6]] slashing (once per turn).</p></div>\`,
      });
    }
  }
  return;
}

if (!isDemonDodge && !isArchdemon) return;

// ── Archdemon Mode: end Demon Mode when entering Archdemon ───────────────────
if (isArchdemon) {
  const stale = actorDoc.effects.filter(isDemonMode);
  if (stale.length) {
    await actorDoc.deleteEmbeddedDocuments(
      "ActiveEffect",
      stale.map((e) => e.id),
    );
  }
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: actorDoc }),
    content: \`<div class="dnd5e2"><p><strong>\${esc(actorDoc.name)}</strong> enters <strong>Archdemon Mode</strong>.</p><p>Speed bonus and Demon Dodge end; keep the extra [[/r 1d4]] slashing on Light-property attacks for 1 minute.</p></div>\`,
  });
  return;
}

// ── Demon Dodge ───────────────────────────────────────────────────────────────
const demonModeActive = actorDoc.effects.some(isDemonMode);

if (!demonModeActive) {
  ui.notifications.warn("Dual Blades: Demon Mode must be active to use Demon Dodge.");
  return;
}

const prof = Number(actorDoc.system?.attributes?.prof);
const bonus = Number.isFinite(prof) && prof > 0 ? Math.trunc(prof) : 2;

const stale = actorDoc.effects.filter(isDemonDodgeAc);
if (stale.length) {
  await actorDoc.deleteEmbeddedDocuments(
    "ActiveEffect",
    stale.map((e) => e.id),
  );
}

await actorDoc.createEmbeddedDocuments("ActiveEffect", [
  {
    name: \`Demon Dodge (+\${bonus} AC)\`,
    img: "icons/skills/movement/figure-running-gray.webp",
    transfer: false,
    disabled: false,
    changes: [
      {
        key: "system.attributes.ac.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        value: String(bonus),
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
      world: {
        dualBlades: {
          isDemonDodgeAc: true,
        },
      },
    },
  },
]);

const evadeLine = perfectEvadeEnabled
  ? \`<p>If the attack misses, move <strong>5 feet</strong> without Opportunity Attacks, then use <strong>Perfect Evade</strong> for one melee weapon attack as part of the same Reaction.</p>\`
  : \`<p>If the attack misses, immediately move <strong>5 feet</strong> without provoking Opportunity Attacks.</p>\`;

await ChatMessage.create({
  speaker: ChatMessage.getSpeaker({ actor: actorDoc }),
  content: \`<div class="dnd5e2"><p><strong>\${esc(actorDoc.name)}</strong> uses Demon Dodge: <strong>+\${bonus} AC</strong> against the triggering melee attack.</p>\${evadeLine}</div>\`,
});
`;
