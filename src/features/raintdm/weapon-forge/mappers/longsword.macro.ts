/**
 * Longsword — Item Macro (MidiQOL 12.4 / Foundry v12 / dnd5e 4.4).
 * On Use: [preTargeting]ItemMacro,[postActiveEffects]ItemMacro
 *
 * Spirit Gauge:
 *   On a normal Attack hit, recover spiritGain uses (1 Uncommon/Rare, 2 VR+).
 *   Does not fill Spirit replace techniques or Spirit Blade.
 *
 * Foresight Slash (Rare+):
 *   Needs ≥2 spirit (preTargeting). Spends 2 via ItemMacro (Midi unpaid-reaction).
 *   Rolls 1d8 and applies system.attributes.ac.bonus + N with dae.specialDuration
 *   isAttacked so Midi can recheck the triggering attack (Shield / Lance pattern).
 *   If that causes a miss: refund 1 spirit and use Foresight Slash: Counter.
 *
 * Legendary techniqueSpiritOnHit:
 *   Foresight Counter / Spirit Thrust / Spirit Roundslash each grant 1 spirit on a hit.
 */
export const LONGSWORD_ITEM_MACRO = `// Longsword — Item Macro (MidiQOL 12.4 / Foundry v12 / dnd5e 4.4)
// On Use: [preTargeting]ItemMacro,[postActiveEffects]ItemMacro
//
// Spirit Gauge: recover spiritGain on a normal Attack hit (not Blade / replace / Foresight).
// Foresight Slash: spend 2 spirit, +1d8 AC vs the triggering melee hit (Midi rechecks).
//   On a miss caused this way: refund 1 spirit and use Foresight Slash: Counter.
// Legendary: Foresight Counter / Spirit Thrust / Spirit Roundslash grant 1 spirit on a hit.

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

const isForesightCounter =
  actId === "foresight-slash-counter"
  || actName.includes("foresight slash: counter")
  || actName.includes("foresight-slash-counter");

const isForesight =
  !isForesightCounter
  && (actId === "foresight-slash" || actName === "foresight slash" || actName.startsWith("foresight slash"));

const isSpiritBlade =
  actId.includes("spirit-blade")
  || actName.includes("spirit blade");

const isSpiritThrust =
  actId.includes("spirit-thrust")
  || actName.includes("spirit thrust");

const isSpiritRoundslash =
  actId.includes("spirit-roundslash")
  || actName.includes("spirit roundslash");

const isSpiritReplace =
  isSpiritThrust
  || isSpiritRoundslash
  || actId.includes("helm-breaker")
  || actId.includes("iai")
  || actName.includes("helm breaker")
  || actName.includes("iai");

const isAttack =
  !isForesight
  && !isForesightCounter
  && !isSpiritBlade
  && !isSpiritReplace
  && (actId === "attack" || actName === "attack" || actName === "");

const actorDoc = actor
  ?? workflow?.actor
  ?? item?.actor
  ?? item?.parent
  ?? (typeof token !== "undefined" ? token?.actor : null);

if (!actorDoc) {
  ui.notifications.warn("Longsword: actor not found.");
  return;
}

const isLongsword =
  foundry.utils.getProperty(item, "flags.world.longsword.isLongsword") === true
  || String(item?.system?.identifier ?? "") === "longsword"
  || /^longsword\\b/i.test(item?.name ?? "");

if (!isLongsword) return;

const uses = item?.system?.uses ?? {};
const max = Math.max(0, Number(uses.max) || 0);
const spent = Math.max(0, Number(uses.spent) || 0);
const available = Math.max(0, max - spent);
const spiritGain = Math.max(
  1,
  Number(foundry.utils.getProperty(item, "flags.world.longsword.spiritGain")) || 1,
);
const techniqueSpiritOnHit =
  foundry.utils.getProperty(item, "flags.world.longsword.techniqueSpiritOnHit") === true;

const isForesightAc = (ef) =>
  foundry.utils.getProperty(ef, "flags.world.longsword.isForesightAc") === true
  || /^foresight slash \\(\\+/i.test(ef.name ?? "");

const hitCount = (() => {
  const ht = workflow?.hitTargets;
  if (ht instanceof Set) return ht.size;
  if (Array.isArray(ht)) return ht.length;
  const n = Number(ht?.size ?? 0);
  if (Number.isFinite(n) && n > 0) return n;
  if (workflow?.damageList?.length) return workflow.damageList.length;
  if (args?.[0]?.hitTargets?.length) return args[0].hitTargets.length;
  return 0;
})();

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

// ── Foresight Slash: need 2 spirit before Midi commits the reaction ─────────
if (isForesight && (!macroPass || macroPass.includes("pretargeting"))) {
  if (available < 2) {
    ui.notifications.warn("Longsword: Foresight Slash needs ≥2 spirit.");
    return false;
  }
  if (macroPass.includes("pretargeting")) return;
}

// ── Foresight Slash: spend 2, apply +1d8 AC, maybe refund ───────────────────
if (isForesight) {
  if (macroPass && !macroPass.includes("postactiveeffects")) return;

  const take = Math.min(2, available);
  if (take < 2) {
    ui.notifications.warn("Longsword: Foresight Slash needs ≥2 spirit.");
    return;
  }

  const nextSpent = spent + take;
  await item.update({ "system.uses.spent": nextSpent });

  const roll = await new Roll("1d8").evaluate();
  await roll.toMessage({
    speaker: ChatMessage.getSpeaker({ actor: actorDoc }),
    flavor: "Foresight Slash — AC Bonus",
  });
  const bonus = roll.total;

  const stale = actorDoc.effects.filter(isForesightAc);
  if (stale.length) {
    await actorDoc.deleteEmbeddedDocuments("ActiveEffect", stale.map((e) => e.id));
  }

  await actorDoc.createEmbeddedDocuments("ActiveEffect", [
    {
      name: \`Foresight Slash (+\${bonus} AC)\`,
      img: "icons/skills/melee/strike-sword-steel-yellow.webp",
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
          longsword: {
            isForesightAc: true,
          },
        },
      },
    },
  ]);

  const attackTotal = findAttackTotal();
  const ac = Number(actorDoc.system?.attributes?.ac?.value);
  const causedMiss =
    Number.isFinite(attackTotal) && Number.isFinite(ac) && attackTotal < ac;

  let refundLine = "";
  if (causedMiss) {
    await item.update({ "system.uses.spent": Math.max(0, nextSpent - 1) });
    refundLine = \`<p>The attack now misses: regain <strong>1 spirit</strong> and use <strong>Foresight Slash: Counter</strong>.</p>\`;
  } else if (!Number.isFinite(attackTotal)) {
    refundLine = \`<p>If this causes the attack to miss: regain <strong>1 spirit</strong> and use <strong>Foresight Slash: Counter</strong>.</p>\`;
  } else {
    refundLine = \`<p>The attack still hits.</p>\`;
  }

  const left = max - (causedMiss ? nextSpent - 1 : nextSpent);
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: actorDoc }),
    content: \`<div class="dnd5e2"><p><strong>\${esc(actorDoc.name)}</strong> uses Foresight Slash: <strong>+\${bonus} AC</strong> against the triggering melee attack. Spirit: \${left}/\${max}.</p>\${refundLine}</div>\`,
  });
  return;
}

if (isSpiritBlade) return;

const isTechniqueOnHitGain =
  techniqueSpiritOnHit
  && (isForesightCounter || isSpiritThrust || isSpiritRoundslash);

if (isTechniqueOnHitGain) {
  if (macroPass && !macroPass.includes("postactiveeffects")) return;
  if (hitCount <= 0) return;
  if (spent <= 0) return;
  await item.update({ "system.uses.spent": spent - 1 });
  const left = max - (spent - 1);
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: actorDoc }),
    content: \`<div class="dnd5e2"><p><strong>Spirit Gauge</strong> — \${esc(rolled?.name ?? workflow?.activity?.name ?? "Spirit technique")} hit: gained 1 spirit (\${left}/\${max}).</p></div>\`,
  });
  return;
}

if (isForesightCounter) return;
if (!isAttack) return;
if (macroPass && !macroPass.includes("postactiveeffects")) return;
if (hitCount <= 0) return;
if (spent <= 0) return;

const gain = Math.min(spiritGain, spent);
await item.update({ "system.uses.spent": spent - gain });
const left = max - (spent - gain);
await ChatMessage.create({
  speaker: ChatMessage.getSpeaker({ actor: actorDoc }),
  content: \`<div class="dnd5e2"><p><strong>Spirit Gauge</strong> — gained \${gain} spirit (\${left}/\${max}).</p></div>\`,
});
`;
