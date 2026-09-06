// Lance — Counter-Thrust / Anchor Rage Item Macro (MidiQOL 12.4 / Foundry v12 / dnd5e 4.4)
// On Use: [postActiveEffects]ItemMacro
//
// Counter-Thrust:
//   Rolls 1d8 and applies system.attributes.ac.bonus + N with dae.specialDuration
//   isAttacked so Midi can recheck the triggering attack (Shield pattern).
//
// Anchor Rage (Rare+ via flags.world.lance.tier):
//   When Counter-Thrust causes a miss (attack total < new AC), or when Riposte is
//   used, applies +1d6 piercing on the next successful melee weapon attack until
//   end of your next turn (dae: 1Hit + turnEndSource).

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

const isRiposte =
  actId === "counter-thrust-riposte"
  || actName.includes("riposte");

const isCounterThrust =
  actId === "counter-thrust"
  || (actName.includes("counter-thrust") && !isRiposte);

if (!isCounterThrust && !isRiposte) return;
if (macroPass && !macroPass.includes("postactiveeffects")) return;

const actorDoc = actor
  ?? workflow?.actor
  ?? item?.actor
  ?? item?.parent
  ?? (typeof token !== "undefined" ? token?.actor : null);

if (!actorDoc) {
  ui.notifications.warn("Lance: actor not found.");
  return;
}

const tier = String(
  foundry.utils.getProperty(item, "flags.world.lance.tier") ?? "uncommon",
).toLowerCase().replace(/\s+/g, "");

const anchorRageEnabled = ["rare", "veryrare", "legendary"].includes(tier);

const isCounterThrustAc = (ef) =>
  foundry.utils.getProperty(ef, "flags.world.lance.isCounterThrustAc") === true
  || /^counter-thrust \(\+/i.test(ef.name ?? "");

const isAnchorRage = (ef) =>
  foundry.utils.getProperty(ef, "flags.world.lance.isAnchorRage") === true
  || /^anchor rage/i.test(ef.name ?? "");

const pickBuffActor = () => {
  const myToken = actorDoc.getActiveTokens()?.[0];
  const myDisp = myToken?.document?.disposition ?? 1;
  const targets = Array.from(workflow?.targets ?? []);

  for (const t of targets) {
    const other = t.actor;
    if (!other || other.id === actorDoc.id) continue;
    const theirDisp = t.document?.disposition ?? other.getActiveTokens()?.[0]?.document?.disposition;
    if (theirDisp != null && myDisp * theirDisp < 0) continue;
    return other;
  }
  return actorDoc;
};

const findAttackTotal = () => {
  const opts = args?.[0]?.workflowOptions ?? workflow?.workflowOptions ?? {};
  const direct = Number(opts.attackTotal ?? opts.attackRollTotal ?? args?.[0]?.attackTotal);
  if (Number.isFinite(direct) && direct > 0) return direct;

  const srcId = opts.triggeredWorkflowId
    ?? opts.sourceWorkflowId
    ?? opts.workflowId
    ?? opts.attackWorkflowId;
  if (srcId && globalThis.MidiQOL?.Workflow?.getWorkflow) {
    const atk = MidiQOL.Workflow.getWorkflow(srcId);
    const t = Number(atk?.attackTotal ?? atk?.attackRoll?.total);
    if (Number.isFinite(t) && t > 0) return t;
  }
  return null;
};

const applyAnchorRage = async () => {
  if (!anchorRageEnabled) return;

  const stale = actorDoc.effects.filter(isAnchorRage);
  if (stale.length) {
    await actorDoc.deleteEmbeddedDocuments("ActiveEffect", stale.map((e) => e.id));
  }

  await actorDoc.createEmbeddedDocuments("ActiveEffect", [
    {
      name: "Anchor Rage (+1d6)",
      img: "icons/skills/melee/strike-sword-blood-red.webp",
      transfer: false,
      disabled: false,
      changes: [
        {
          key: "system.bonuses.mwak.damage",
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          value: "1d6[piercing]",
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
          specialDuration: ["1Hit", "turnEndSource"],
          stackable: "noneName",
          showIcon: true,
          selfTarget: true,
          selfTargetAlways: true,
          dontApply: false,
        },
        world: {
          lance: {
            isAnchorRage: true,
          },
        },
      },
    },
  ]);

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: actorDoc }),
    content: `<div class="dnd5e2"><p><strong>Anchor Rage:</strong> ${esc(actorDoc.name)}'s next successful Lance attack deals an extra [[/r 1d6]] piercing damage (until the end of their next turn).</p></div>`,
  });
};

// ── Riposte: confirm melee miss → Anchor Rage (Rare+) ───────────────────────
if (isRiposte) {
  await applyAnchorRage();
  return;
}

// ── Counter-Thrust: roll AC bonus and apply AE ──────────────────────────────
const buffActor = pickBuffActor();

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

// Rare+: if we can see the attack total and it now misses, grant Anchor Rage.
if (anchorRageEnabled) {
  const attackTotal = findAttackTotal();
  const ac = Number(buffActor.system?.attributes?.ac?.value);
  if (Number.isFinite(attackTotal) && Number.isFinite(ac) && attackTotal < ac) {
    await applyAnchorRage();
  } else if (!Number.isFinite(attackTotal)) {
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: actorDoc }),
      content: `<div class="dnd5e2"><p><em>Anchor Rage:</em> if Counter-Thrust causes the attack to miss, use <strong>Counter-Thrust: Riposte</strong> (or confirm the miss) to empower your next Lance attack.</p></div>`,
    });
  }
}
