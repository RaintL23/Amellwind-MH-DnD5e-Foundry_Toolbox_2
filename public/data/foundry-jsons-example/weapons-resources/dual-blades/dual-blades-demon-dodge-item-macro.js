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

if (!isDemonDodge && !isArchdemon) return;
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

const isDemonMode = (ef) => {
  if (ef.disabled) return false;
  const flag = foundry.utils.getProperty(ef, "flags.world.dualBlades.isDemonMode");
  return flag === true || /^demon mode$/i.test(ef.name ?? "");
};

const isDemonDodgeAc = (ef) =>
  foundry.utils.getProperty(ef, "flags.world.dualBlades.isDemonDodgeAc") === true
  || /^demon dodge \(\+/i.test(ef.name ?? "");

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
    content: `<div class="dnd5e2"><p><strong>${esc(actorDoc.name)}</strong> enters <strong>Archdemon Mode</strong>.</p><p>Speed bonus and Demon Dodge end; keep the extra [[/r 1d4]] slashing on Light-property attacks for 1 minute.</p></div>`,
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
    name: `Demon Dodge (+${bonus} AC)`,
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
  ? `<p>If the attack misses, move <strong>5 feet</strong> without Opportunity Attacks, then use <strong>Perfect Evade</strong> for one melee weapon attack as part of the same Reaction.</p>`
  : `<p>If the attack misses, immediately move <strong>5 feet</strong> without provoking Opportunity Attacks.</p>`;

await ChatMessage.create({
  speaker: ChatMessage.getSpeaker({ actor: actorDoc }),
  content: `<div class="dnd5e2"><p><strong>${esc(actorDoc.name)}</strong> uses Demon Dodge: <strong>+${bonus} AC</strong> against the triggering melee attack.</p>${evadeLine}</div>`,
});

