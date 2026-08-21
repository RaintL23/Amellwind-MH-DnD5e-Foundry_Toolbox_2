/**
 * Magus Staff — Item Macro (MidiQOL 12.4 / Foundry v12 / dnd5e 4.4).
 * On Use: [preTargeting]ItemMacro,[postActiveEffects]ItemMacro
 *
 * Mastery (Sap) — all rarities:
 *   On a melee weapon Attack hit, the target has Disadvantage on its next
 *   attack roll before the start of your next turn.
 *
 * Harvest Magic (Uncommon+):
 *   After dealing cantrip damage to a hostile, use this activity. Dialog asks
 *   whether the target was within 15 ft (2 counters) or farther (1). Restores
 *   Spell Core uses (spent decreases). Caps at max.
 *
 * Offset Ward (Rare+):
 *   Reaction when hit by melee. Needs ≥2 Spell Counters (preTargeting).
 *   Spends 2 and applies +5 AC with dae.specialDuration isAttacked so Midi can
 *   recheck the triggering attack. On a miss caused this way, cast a cantrip
 *   spell-attack at the attacker as part of the same Reaction (manual).
 */
export const MAGUS_STAFF_ITEM_MACRO = `// Magus Staff — Item Macro (MidiQOL 12.4 / Foundry v12 / dnd5e 4.4)
// On Use: [preTargeting]ItemMacro,[postActiveEffects]ItemMacro
//
// Mastery (Sap): on a melee weapon Attack hit, the target has Disadvantage
// on its next attack roll before the start of your next turn.
// Harvest Magic (Uncommon+): dialog recovers 1 Spell Counter (2 if within 15 ft).
// Offset Ward (Rare+): spend 2 Spell Counters, +5 AC vs the triggering melee hit.

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
  actId === "attack"
  || actName === "attack";

const isHarvest =
  actId === "harvest-magic"
  || actName === "harvest magic"
  || actName.startsWith("harvest magic");

const isOffsetWard =
  actId === "offset-ward"
  || actName === "offset ward"
  || actName.startsWith("offset ward");

if (!isAttack && !isHarvest && !isOffsetWard) return;

const actorDoc = actor
  ?? workflow?.actor
  ?? item?.actor
  ?? item?.parent
  ?? (typeof token !== "undefined" ? token?.actor : null);

if (!actorDoc) {
  ui.notifications.warn("Magus Staff: actor not found.");
  return;
}

const isMagusStaff =
  foundry.utils.getProperty(item, "flags.world.magusStaff.isMagusStaff") === true
  || String(item?.system?.identifier ?? "") === "magusstaff"
  || /^magus staff\\b/i.test(item?.name ?? "");

if (!isMagusStaff) return;

const uses = item?.system?.uses ?? {};
const max = Math.max(0, Number(uses.max) || 0);
const spent = Math.max(0, Number(uses.spent) || 0);
const available = Math.max(0, max - spent);

const isSap = (ef) =>
  foundry.utils.getProperty(ef, "flags.world.magusStaff.isSap") === true
  || /^mastery \\(sap\\)$/i.test(ef.name ?? "");

const isOffsetWardAc = (ef) =>
  foundry.utils.getProperty(ef, "flags.world.magusStaff.isOffsetWardAc") === true
  || /^offset ward \\(\\+/i.test(ef.name ?? "");

// ── Offset Ward: need ≥2 Spell Counters before Midi commits the reaction ────
if (isOffsetWard && (!macroPass || macroPass.includes("pretargeting"))) {
  if (available < 2) {
    ui.notifications.warn("Magus Staff: Offset Ward needs ≥2 Spell Counters.");
    return false;
  }
  if (macroPass.includes("pretargeting")) return;
}

// ── Offset Ward: spend 2, apply +5 AC, remind cantrip on miss ───────────────
if (isOffsetWard) {
  if (macroPass && !macroPass.includes("postactiveeffects")) return;

  if (available < 2) {
    ui.notifications.warn("Magus Staff: Offset Ward needs ≥2 Spell Counters.");
    return;
  }

  await item.update({ "system.uses.spent": spent + 2 });

  const stale = actorDoc.effects.filter(isOffsetWardAc);
  if (stale.length) {
    await actorDoc.deleteEmbeddedDocuments("ActiveEffect", stale.map((e) => e.id));
  }

  await actorDoc.createEmbeddedDocuments("ActiveEffect", [
    {
      name: "Offset Ward (+5 AC)",
      img: "icons/magic/defensive/barrier-shield-dome-blue-purple.webp",
      transfer: false,
      disabled: false,
      changes: [
        {
          key: "system.attributes.ac.bonus",
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          value: "5",
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
          magusStaff: {
            isOffsetWardAc: true,
          },
        },
      },
    },
  ]);

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: actorDoc }),
    content: \`<div class="dnd5e2"><p><strong>\${esc(actorDoc.name)}</strong> projects <strong>Offset Ward</strong>: <strong>+5 AC</strong> against the triggering melee attack (2 Spell Counters expended).</p><p>If that causes the attack to miss, immediately cast a Cantrip spell-attack (casting time 1 Action) targeting the attacker as part of the same Reaction.</p></div>\`,
  });
  return;
}

// ── Harvest Magic: dialog recovers 1 or 2 Spell Counters ────────────────────
if (isHarvest) {
  if (macroPass && !macroPass.includes("postactiveeffects")) return;

  if (max <= 0) {
    ui.notifications.warn("Magus Staff: Spell Core Gauge is not available.");
    return;
  }
  if (available >= max) {
    ui.notifications.warn("Magus Staff: Spell Core is already full.");
    return;
  }

  const choice = await new Promise((resolve) => {
    new Dialog({
      title: "Harvest Magic",
      content: \`<p>Was the cantrip target a hostile creature within <strong>15 feet</strong>?</p><p>Current Spell Counters: <strong>\${available}</strong> / \${max}</p>\`,
      buttons: {
        close: {
          icon: '<i class="fas fa-bolt"></i>',
          label: "Within 15 ft (+2)",
          callback: () => resolve(2),
        },
        far: {
          icon: '<i class="fas fa-magic"></i>',
          label: "Farther (+1)",
          callback: () => resolve(1),
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: "Cancel",
          callback: () => resolve(0),
        },
      },
      default: "far",
      close: () => resolve(0),
    }).render(true);
  });

  const gain = Math.max(0, Number(choice) || 0);
  if (gain <= 0) return;

  const recovered = Math.min(gain, max - available);
  if (recovered <= 0) return;

  await item.update({ "system.uses.spent": Math.max(0, spent - recovered) });

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: actorDoc }),
    content: \`<div class="dnd5e2"><p><strong>Harvest Magic:</strong> \${esc(item.name)} gains <strong>\${recovered}</strong> Spell Counter\${recovered === 1 ? "" : "s"} (now \${available + recovered}/\${max}).</p></div>\`,
  });
  return;
}

// ── Mastery (Sap) on Attack hit ─────────────────────────────────────────────
if (!isAttack) return;
if (macroPass && !macroPass.includes("postactiveeffects")) return;

const hitTokens = (() => {
  const ht = workflow?.hitTargets;
  if (ht instanceof Set) return [...ht];
  if (Array.isArray(ht)) return ht;
  if (args?.[0]?.hitTargets?.length) return args[0].hitTargets;
  return [];
})();

if (hitTokens.length <= 0) return;

const sapped = [];

for (const t of hitTokens) {
  const targetActor = t?.actor ?? t;
  if (!targetActor?.createEmbeddedDocuments) continue;

  const stale = targetActor.effects.filter(isSap);
  if (stale.length) {
    await targetActor.deleteEmbeddedDocuments("ActiveEffect", stale.map((e) => e.id));
  }

  await targetActor.createEmbeddedDocuments("ActiveEffect", [
    {
      name: "Mastery (Sap)",
      img: "icons/magic/control/hypnosis-mesmerism-eye.webp",
      transfer: false,
      disabled: false,
      changes: [
        {
          key: "flags.midi-qol.disadvantage.attack.all",
          mode: CONST.ACTIVE_EFFECT_MODES.UPGRADE,
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
          specialDuration: ["1Attack", "turnStartSource"],
          stackable: "noneName",
          showIcon: true,
          selfTarget: false,
          selfTargetAlways: false,
          dontApply: false,
        },
        world: {
          magusStaff: {
            isSap: true,
          },
        },
      },
    },
  ]);

  sapped.push(targetActor.name);
}

if (sapped.length) {
  const names = sapped.map((n) => esc(n)).join(", ");
  const verb = sapped.length === 1 ? "has" : "have";
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: actorDoc }),
    content: \`<div class="dnd5e2"><p><strong>Mastery (Sap):</strong> \${names} \${verb} Disadvantage on the next attack roll (until the start of \${esc(actorDoc.name)}'s next turn).</p></div>\`,
  });
}
`;
