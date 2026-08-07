// Lance — Counter-Thrust Item Macro (MidiQOL 12.4 / Foundry v12 / dnd5e 4.4)
// On Use: [postActiveEffects]ItemMacro
//
// Activity utility rolls alone do NOT change AC. This macro rolls 1d8 (or reuses
// the activity utility roll) and applies a non-transfer AE:
//   system.attributes.ac.bonus += N
//   dae.specialDuration: isAttacked
// so Midi can recheck the triggering attack after the reaction (Shield pattern).
//
// Buff target:
// - Friendly targeted token → that ally (manual protect)
// - Otherwise → the Lance wielder (Midi reaction when YOU are hit)

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

const isCounterThrust =
  actId === "counter-thrust"
  || (actName.includes("counter-thrust") && !actName.includes("riposte"));

if (!isCounterThrust) return;
if (macroPass && !macroPass.includes("postactiveeffects")) return;

const actorDoc = actor
  ?? workflow?.actor
  ?? item?.actor
  ?? item?.parent
  ?? (typeof token !== "undefined" ? token?.actor : null);

if (!actorDoc) {
  ui.notifications.warn("Counter-Thrust: actor not found.");
  return;
}

const isCounterThrustAc = (ef) =>
  foundry.utils.getProperty(ef, "flags.world.lance.isCounterThrustAc") === true
  || /^counter-thrust \(\+/i.test(ef.name ?? "");

const pickBuffActor = () => {
  const myToken = actorDoc.getActiveTokens()?.[0];
  const myDisp = myToken?.document?.disposition ?? 1;
  const targets = Array.from(workflow?.targets ?? []);

  for (const t of targets) {
    const other = t.actor;
    if (!other || other.id === actorDoc.id) continue;
    const theirDisp = t.document?.disposition ?? other.getActiveTokens()?.[0]?.document?.disposition;
    // Skip hostiles (Midi reaction often targets the attacker).
    if (theirDisp != null && myDisp * theirDisp < 0) continue;
    return other;
  }
  return actorDoc;
};

const buffActor = pickBuffActor();

// Always roll here (activity.roll is empty on purpose) so the AC AE uses a fixed total.
const roll = await new Roll("1d8").evaluate();
await roll.toMessage({
  speaker: ChatMessage.getSpeaker({ actor: actorDoc }),
  flavor: "Counter-Thrust — AC Bonus",
});
const bonus = roll.total;

const stale = buffActor.effects.filter(isCounterThrustAc);
if (stale.length) {
  await buffActor.deleteEmbeddedDocuments(
    "ActiveEffect",
    stale.map((e) => e.id),
  );
}

await buffActor.createEmbeddedDocuments("ActiveEffect", [
  {
    name: `Counter-Thrust (+${bonus} AC)`,
    img: "icons/skills/melee/shield-damaged-broken-orange.webp",
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
        selfTarget: false,
        selfTargetAlways: false,
        dontApply: false,
      },
      world: {
        lance: {
          isCounterThrustAc: true,
        },
      },
    },
  },
]);

await ChatMessage.create({
  speaker: ChatMessage.getSpeaker({ actor: actorDoc }),
  content: `<div class="dnd5e2"><p><strong>${esc(actorDoc.name)}</strong> intervenes with Counter-Thrust: <em>${esc(buffActor.name)}</em> gains <strong>+${bonus} AC</strong> against the triggering attack.</p><p>If that causes a melee attack to miss, use <strong>Counter-Thrust: Riposte</strong>.</p></div>`,
});
