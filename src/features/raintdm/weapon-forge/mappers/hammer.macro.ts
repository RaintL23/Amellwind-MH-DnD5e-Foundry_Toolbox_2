/**
 * Hammer — Item Macro (MidiQOL 12.4 / Foundry v12 / dnd5e 4.4).
 * On Use: [preItemRoll]ItemMacro,[postActiveEffects]ItemMacro
 *
 * Keep in sync with:
 *   public/data/scripts/weapons-resources/hammer/hammer-item-macro.js
 */
export const HAMMER_ITEM_MACRO = `// Hammer — Power Charge / Mighty Weapon / Upswing / Spinning Bludgeon / Offset / Big Bang
// MidiQOL 12.4 / Foundry v12 / dnd5e 4.4
// On Use: [preItemRoll]ItemMacro,[postActiveEffects]ItemMacro
//
// Power Charge (Attack hit, postActiveEffects):
//   Clears Power Charge AE, unlocks charged follow-ups this turn.
//
// Mighty Weapon / Upswing / Spinning Bludgeon (preItemRoll):
//   Require active Power Charge OR pending charged-hit unlock this turn.
//   Huge+ Con-save Advantage unless flags.world.hammer.stunUpgrade (Stun Upgrade).
//
// Offset Smash (preItemRoll): Advantage when Power Charge is active.
// Big Bang Combo (Attack hit): remind +2d6 / double charge dice vs Prone or Stunned.

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

const isAttack = actId === "attack" || actName === "attack";
const isMighty =
  actId === "mighty-weapon"
  || actId === "stun-upgrade"
  || actName === "mighty weapon"
  || actName === "stun upgrade"
  || actName.includes("mighty weapon")
  || actName.includes("stun upgrade");
const isUpswing = actId === "upswing" || actName === "upswing";
const isSpin =
  actId === "spinning-bludgeon"
  || actName === "spinning bludgeon"
  || actName.includes("spinning bludgeon");
const isOffset =
  actId === "offset-smash"
  || actName === "offset smash"
  || actName.includes("offset smash");
const isChargedFollowUp = isMighty || isUpswing || isSpin;

if (!isAttack && !isChargedFollowUp && !isOffset) return;

const actorDoc = actor
  ?? workflow?.actor
  ?? item?.actor
  ?? item?.parent
  ?? (typeof token !== "undefined" ? token?.actor : null);

if (!actorDoc) {
  ui.notifications.warn("Hammer: actor not found.");
  return;
}

const hammerFlags = foundry.utils.getProperty(item, "flags.world.hammer") ?? {};
const tier = String(hammerFlags.tier ?? "uncommon").toLowerCase().replace(/\\s+/g, "");
const chargeDiceByTier = {
  uncommon: "1d6",
  rare: "2d6",
  veryrare: "3d6",
  legendary: "4d6",
};
const chargeDice = chargeDiceByTier[tier] ?? "1d6";
const stunUpgrade = hammerFlags.stunUpgrade === true;
const bigBang = hammerFlags.bigBangCombo === true;

const combat = game.combat;
const turnKey = combat
  ? \`\${combat.id}:\${combat.round}:\${combat.turn}\`
  : \`ooc:\${game.time?.worldTime ?? 0}\`;

const isPowerCharge = (ef) => {
  if (ef.disabled) return false;
  const flag = foundry.utils.getProperty(ef, "flags.world.hammer.isPowerCharged");
  return flag === true || /^power charge$/i.test(String(ef.name ?? "").trim());
};

const findPowerCharges = () => {
  const list = actorDoc.appliedEffects ?? actorDoc.effects?.contents ?? actorDoc.effects ?? [];
  return Array.from(list).filter(isPowerCharge);
};

const isHugeOrLarger = (targetActor) => {
  const size = String(targetActor?.system?.traits?.size ?? "").toLowerCase();
  return size === "huge" || size === "grg" || size === "gargantuan";
};

const isProneOrStunned = (targetActor) => {
  const list = targetActor?.appliedEffects ?? targetActor?.effects?.contents ?? targetActor?.effects ?? [];
  return Array.from(list).some((ef) => {
    if (ef.disabled) return false;
    const statuses = ef.statuses instanceof Set
      ? Array.from(ef.statuses)
      : Array.from(ef.statuses ?? []);
    if (statuses.some((s) => /^(prone|stunned)$/i.test(String(s)))) return true;
    return /\\b(prone|stunned)\\b/i.test(String(ef.name ?? ""));
  });
};

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

const requireChargedUnlock = async () => {
  const charged = findPowerCharges();
  const pending = foundry.utils.getProperty(item, "flags.world.hammer.pendingMightyTurn");
  const unlocked = charged.length > 0 || pending === turnKey;
  if (!unlocked) {
    ui.notifications.warn(
      "Hammer: this feature requires an active Power Charge (or a Power Charge hit this turn).",
    );
    return false;
  }
  if (foundry.utils.getProperty(item, "flags.world.hammer.mightyUsedTurn") != null) {
    await item.unsetFlag("world", "hammer.mightyUsedTurn");
  }
  return true;
};

// ── Offset Smash (preItemRoll): Adv while Power Charge is active ─────────────
if (isOffset) {
  if (macroPass.includes("postactiveeffects")) return;
  if (macroPass && !macroPass.includes("preitemroll")) return;

  if (findPowerCharges().length) {
    const targets = Array.from(workflow?.targets ?? args?.[0]?.targets ?? []);
    for (const t of targets) {
      const targetActor = t?.actor ?? t;
      if (!targetActor) continue;
      await targetActor.createEmbeddedDocuments("ActiveEffect", [
        {
          name: "Offset Smash (Advantage)",
          img: "icons/skills/melee/strike-hammer-destructive-orange.webp",
          transfer: false,
          disabled: false,
          changes: [
            {
              key: "flags.midi-qol.grants.advantage.attack.all",
              mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
              value: "1",
              priority: 20,
            },
          ],
          duration: { turns: 1 },
          flags: {
            dae: {
              specialDuration: ["1Attack", "isAttacked"],
              stackable: "noneName",
              showIcon: true,
              dontApply: false,
            },
            world: { hammer: { isOffsetAdv: true } },
          },
        },
      ]);
    }
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: actorDoc }),
      content: \`<div class="dnd5e2"><p><strong>Offset Smash:</strong> Power Charge is active — this reaction attack has <strong>Advantage</strong> and gains the charge's extra damage.</p></div>\`,
    });
  }
  return;
}

// ── Charged follow-ups (preItemRoll) ─────────────────────────────────────────
if (isChargedFollowUp) {
  if (macroPass.includes("postactiveeffects")) return;
  if (macroPass && !macroPass.includes("preitemroll")) return;

  const ok = await requireChargedUnlock();
  if (!ok) return false;

  if (isUpswing) {
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: actorDoc }),
      content: \`<div class="dnd5e2"><p><strong>Upswing:</strong> push the target <strong>10 feet</strong> away.</p><p>If they hit a solid object or another creature, use <strong>Upswing: Collision</strong> for [[/r 1d6]] bludgeoning.</p></div>\`,
    });
    return;
  }

  if (isSpin) {
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: actorDoc }),
      content: \`<div class="dnd5e2"><p><strong>Spinning Bludgeon:</strong> make one melee weapon attack vs a second creature within 5 feet of the original target. This attack does <em>not</em> gain Power Charge extra damage.</p></div>\`,
    });
    return;
  }

  if (isMighty) {
    if (stunUpgrade) return;

    const targets = Array.from(workflow?.targets ?? args?.[0]?.targets ?? []);
    const hugeNames = [];

    for (const t of targets) {
      const targetActor = t?.actor ?? t;
      if (!targetActor || !isHugeOrLarger(targetActor)) continue;
      hugeNames.push(targetActor.name);

      const stale = targetActor.effects.filter((ef) =>
        foundry.utils.getProperty(ef, "flags.world.hammer.isMightySaveAdv") === true
        || /^mighty weapon \\(save advantage\\)$/i.test(ef.name ?? ""),
      );
      if (stale.length) {
        await targetActor.deleteEmbeddedDocuments("ActiveEffect", stale.map((e) => e.id));
      }

      await targetActor.createEmbeddedDocuments("ActiveEffect", [
        {
          name: "Mighty Weapon (Save Advantage)",
          img: "icons/skills/melee/strike-flail-destructive-yellow.webp",
          transfer: false,
          disabled: false,
          changes: [
            {
              key: "flags.midi-qol.advantage.ability.save.con",
              mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
              value: "1",
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
              specialDuration: ["isSave"],
              stackable: "noneName",
              showIcon: true,
              dontApply: false,
            },
            world: {
              hammer: {
                isMightySaveAdv: true,
              },
            },
          },
        },
      ]);
    }

    if (hugeNames.length) {
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: actorDoc }),
        content: \`<div class="dnd5e2"><p><strong>Mighty Weapon:</strong> Huge+ targets have Advantage on the Con save (\${hugeNames.map(esc).join(", ")}).</p></div>\`,
      });
    }
    return;
  }
}

// ── Attack hit (postActiveEffects) ───────────────────────────────────────────
if (!isAttack) return;
if (macroPass && !macroPass.includes("postactiveeffects")) return;
if (hitCount <= 0) return;

const hitTargets = (() => {
  const ht = workflow?.hitTargets;
  if (ht instanceof Set) return Array.from(ht);
  if (Array.isArray(ht)) return ht;
  return Array.from(args?.[0]?.hitTargets ?? []);
})();

if (bigBang) {
  const downed = hitTargets
    .map((t) => t?.actor ?? t)
    .filter((a) => a && isProneOrStunned(a));
  if (downed.length) {
    const wasCharged = findPowerCharges().length > 0;
    const names = downed.map((a) => esc(a.name)).join(", ");
    const extra = wasCharged
      ? \` Power Charge dice ([[/r \${chargeDice}]]) are rolled <strong>twice</strong>.\`
      : "";
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: actorDoc }),
      content: \`<div class="dnd5e2"><p><strong>Big Bang Combo:</strong> +[[/r 2d6]] bludgeoning vs Prone/Stunned (\${names}).\${extra}</p></div>\`,
    });
  }
}

const charged = findPowerCharges();
if (!charged.length) return;

await actorDoc.deleteEmbeddedDocuments(
  "ActiveEffect",
  charged.map((e) => e.id),
);

await item.setFlag("world", "hammer.pendingMightyTurn", turnKey);

await ChatMessage.create({
  speaker: ChatMessage.getSpeaker({ actor: actorDoc }),
  content: \`<div class="dnd5e2"><p><strong>\${esc(actorDoc.name)}</strong>'s <strong>Power Charge</strong> is spent on this hit (+[[/r \${chargeDice}]] bludgeoning already included).</p><p>This turn you may use <strong>Mighty Weapon</strong>, <strong>Upswing</strong>, and/or <strong>Spinning Bludgeon</strong>.</p></div>\`,
});
`;
