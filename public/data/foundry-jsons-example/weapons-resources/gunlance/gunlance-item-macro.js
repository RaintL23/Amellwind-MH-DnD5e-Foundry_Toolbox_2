// Gunlance — Item Macro (MidiQOL 12.4 / Foundry v12 / dnd5e 4.4)
// On Use: [preTargeting]ItemMacro,[postDamageRoll]ItemMacro,[postActiveEffects]ItemMacro
//
// Shelling Strike / Full Burst (Attack hit, postDamageRoll):
//   Uncommon: yes/no → Shelling Strike ×1 (1d6 Thunder).
//   Rare+: buttons ×1 / ×2 / ×3 (capped by shells) → Shelling Strike / Full Burst ×N (1d8).
//
// Guard Reload (reaction, preTargeting):
//   Midi offers when useCondition matches isMissed melee.
//   Confirm yes/no; Cancel aborts before −itemUses restore.
//
// Blast Dash (Rare+, postActiveEffects):
//   After BA dash (1 shell spent), optional dialog to make one Attack as part of the BA.
//
// Flags (weapon):
//   flags.world.gunlance.isGunlance
//   flags.world.gunlance.tier   ("uncommon" | "rare" | "veryRare" | "legendary")

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
const actMidi = rolled?.midiProperties ?? workflow?.activity?.midiProperties ?? {};
const actId = String(
  rolled?.identifier
  ?? actMidi?.identifier
  ?? workflow?.activity?.identifier
  ?? "",
).toLowerCase().trim();
const actType = String(rolled?.type ?? workflow?.activity?.type ?? "").toLowerCase();

const weaponItem = item
  ?? workflow?.item
  ?? args?.[0]?.item
  ?? null;

const actorDoc = actor
  ?? workflow?.actor
  ?? weaponItem?.actor
  ?? weaponItem?.parent
  ?? (typeof token !== "undefined" ? token?.actor : null);

if (!weaponItem || !actorDoc) return;

const tier = String(
  foundry.utils.getProperty(weaponItem, "flags.world.gunlance.tier") ?? "uncommon",
).toLowerCase().replace(/\s+/g, "");

const fullBurstEnabled = ["rare", "veryrare", "legendary"].includes(tier);
const blastDashEnabled = fullBurstEnabled;

const isPre = macroPass.includes("pretargeting");
const isPostDamage = macroPass.includes("postdamageroll");
const isPostAe = macroPass.includes("postactiveeffects");

const isAttack =
  actType === "attack"
  && (actId === "attack" || actName === "attack" || actName === "");

const isGuardReload =
  actId === "guard-reload"
  || actName === "guard reload";

const isBlastDash =
  actId === "blast-dash"
  || actName === "blast dash";

const isShellingLike =
  actId.startsWith("shelling-strike")
  || actId.startsWith("full-burst")
  || actName.includes("shelling strike")
  || actName.includes("full burst");

const shellsAvailable = () => {
  const uses = weaponItem.system?.uses;
  if (!uses) return 0;
  const max = Math.max(0, Number(uses.max) || 0);
  const spent = Math.max(0, Number(uses.spent) || 0);
  return Math.max(0, max - spent);
};

const shellsSpent = () => {
  const uses = weaponItem.system?.uses;
  if (!uses) return 0;
  return Math.max(0, Number(uses.spent) || 0);
};

const shellsMax = () => Math.max(0, Number(weaponItem.system?.uses?.max) || 4);

const confirmDialog = (title, content, yesLabel = "Yes", noLabel = "No") =>
  new Promise((resolve) => {
    let settled = false;
    const done = (v) => {
      if (!settled) {
        settled = true;
        resolve(v);
      }
    };
    new Dialog({
      title,
      content: `<div class="dnd5e2">${content}</div>`,
      buttons: {
        yes: {
          icon: '<i class="fas fa-check"></i>',
          label: yesLabel,
          callback: () => done(true),
        },
        no: {
          icon: '<i class="fas fa-times"></i>',
          label: noLabel,
          callback: () => done(false),
        },
      },
      default: "yes",
      close: () => done(false),
    }).render(true);
  });

/** @returns {Promise<number|null>} shell count, or null if skipped */
const shellingChoiceDialog = (title, content, maxSpend) =>
  new Promise((resolve) => {
    let settled = false;
    const done = (v) => {
      if (!settled) {
        settled = true;
        resolve(v);
      }
    };
    const buttons = {};
    for (let n = 1; n <= maxSpend; n += 1) {
      const dieLabel = fullBurstEnabled ? `${n}d8` : "1d6";
      buttons[`n${n}`] = {
        icon: '<i class="fas fa-bomb"></i>',
        label: `×${n} (+${dieLabel})`,
        callback: () => done(n),
      };
    }
    buttons.skip = {
      icon: '<i class="fas fa-times"></i>',
      label: "Skip",
      callback: () => done(null),
    };
    new Dialog({
      title,
      content: `<div class="dnd5e2">${content}</div>`,
      buttons,
      default: "n1",
      close: () => done(null),
    }).render(true);
  });

const listActivities = () => {
  const col = weaponItem.system?.activities;
  if (!col) return [];
  if (typeof col === "object" && Array.isArray(col.contents)) return col.contents;
  if (typeof col.values === "function") return [...col.values()];
  return Object.values(col);
};

const findShellingActivity = (n) => {
  const list = listActivities();
  const want = Number(n) || 1;
  const idExact = [
    `shelling-strike-${want}`,
    `full-burst-${want}`,
  ];
  const nameExact = [
    `shelling strike ×${want}`,
    `shelling strike x${want}`,
    `full burst ×${want}`,
    `full burst x${want}`,
  ];
  const hit = list.find((a) => {
    const id = String(a?.identifier ?? a?.midiProperties?.identifier ?? "").toLowerCase();
    const name = String(a?.name ?? "").toLowerCase();
    return idExact.includes(id) || nameExact.includes(name);
  });
  if (hit) return hit;
  if (want === 1) {
    return list.find((a) => {
      const id = String(a?.identifier ?? a?.midiProperties?.identifier ?? "").toLowerCase();
      const name = String(a?.name ?? "").toLowerCase();
      return id.startsWith("shelling-strike") || id.startsWith("full-burst")
        || name.includes("shelling strike") || name.includes("full burst");
    }) ?? null;
  }
  return null;
};

const findAttackActivity = () => {
  const list = listActivities();
  return (
    list.find((a) => {
      const id = String(a?.identifier ?? a?.midiProperties?.identifier ?? "").toLowerCase();
      const name = String(a?.name ?? "").toLowerCase();
      return a?.type === "attack" && (id === "attack" || name === "attack" || name === "");
    })
    ?? list.find((a) => a?.type === "attack")
    ?? null
  );
};

const abort = (msg) => {
  if (msg) ui.notifications.warn(msg);
  if (typeof workflow !== "undefined" && workflow) workflow.aborted = true;
  return false;
};

const launchActivity = async (activity, targetUuids = []) => {
  if (!activity) {
    ui.notifications.warn("Gunlance: activity not found.");
    return;
  }
  const midiOptions = {
    ...(targetUuids.length ? { targetUuids } : {}),
    workflowOptions: {
      autoRollAttack: true,
      autoRollDamage: "always",
      fastForwardAttack: true,
      fastForwardDamage: true,
    },
  };
  if (typeof MidiQOL?.completeActivityUse === "function") {
    await MidiQOL.completeActivityUse(activity, { midiOptions });
  } else if (typeof activity.use === "function") {
    await activity.use({ midiOptions }, { configure: false }, { create: true });
  } else {
    ui.notifications.warn("Gunlance: cannot launch activity (MidiQOL missing).");
  }
};

// ── Guard Reload: confirm before restoring shells ───────────────────────────
if (isGuardReload && (isPre || !macroPass)) {
  const spent = shellsSpent();
  if (spent <= 0) {
    return abort("Gunlance: no expended shells to reload.");
  }
  const restore = Math.min(2, spent);
  const remaining = shellsAvailable();
  const ok = await confirmDialog(
    "Guard Reload",
    `<p><strong>${esc(actorDoc.name)}</strong> — reload <strong>${restore}</strong> expended shell${restore === 1 ? "" : "s"}?</p>
     <p>Current shells: <strong>${remaining}</strong> / <strong>${shellsMax()}</strong> (spent ${spent}).</p>`,
    "Reload",
    "Cancel",
  );
  if (!ok) return abort();
  return;
}

// ── Blast Dash (Rare+): optional melee attack after the dash ────────────────
if (isBlastDash && blastDashEnabled && (isPostAe || (!macroPass && !isPre))) {
  const ok = await confirmDialog(
    "Blast Dash",
    `<p><strong>${esc(actorDoc.name)}</strong> dashed up to 20 ft (no OA).</p>
     <p>If you ended within reach of a hostile creature, make <strong>one melee weapon attack</strong> as part of this Bonus Action?</p>`,
    "Attack",
    "Skip",
  );
  if (!ok) return;
  await launchActivity(findAttackActivity());
  return;
}

// Shelling activities themselves never re-prompt
if (isShellingLike) return;
if (!isAttack) return;
if (!isPostDamage && !isPostAe) return;

// Prefer postDamageRoll; postActiveEffects is a fallback. Avoid double-asking.
const asked = foundry.utils.getProperty(workflow, "flags.world.gunlance.shellingAsked");
if (asked) return;
try {
  foundry.utils.setProperty(workflow, "flags.world.gunlance.shellingAsked", true);
} catch (_) {
  // ignore
}

const hitTargets = [...(workflow?.hitTargets ?? args?.[0]?.hitTargets ?? [])];
if (!hitTargets.length) return;

const available = shellsAvailable();
if (available <= 0) return;

const primary = hitTargets[0];
const targetName = primary?.name ?? primary?.document?.name ?? "the target";
const max = shellsMax();
const maxSpend = fullBurstEnabled ? Math.min(3, available) : Math.min(1, available);
const dieHint = fullBurstEnabled ? "1d8 Thunder per shell (Full Burst)" : "1d6 Thunder";

let spendN = null;
if (!fullBurstEnabled) {
  const useShelling = await confirmDialog(
    "Shelling Strike",
    `<p>Hit <strong>${esc(targetName)}</strong> with ${esc(weaponItem.name)}.</p>
     <p>Expend <strong>1</strong> shell for <strong>+1d6 Thunder</strong>?</p>
     <p>Shells remaining: <strong>${available}</strong> / <strong>${max}</strong>.</p>`,
    "Shelling Strike",
    "Skip",
  );
  spendN = useShelling ? 1 : null;
} else {
  spendN = await shellingChoiceDialog(
    "Shelling Strike — Full Burst",
    `<p>Hit <strong>${esc(targetName)}</strong> with ${esc(weaponItem.name)}.</p>
     <p>Expend shells for <strong>${dieHint}</strong>.</p>
     <p>Shells remaining: <strong>${available}</strong> / <strong>${max}</strong> (choose up to <strong>${maxSpend}</strong>).</p>`,
    maxSpend,
  );
}

if (!spendN) return;

const shellAct = findShellingActivity(spendN);
if (!shellAct) {
  ui.notifications.warn(`Gunlance: Shelling Strike ×${spendN} activity not found.`);
  return;
}

const targetUuid = primary?.document?.uuid ?? primary?.uuid;
if (!targetUuid) {
  ui.notifications.warn("Gunlance: could not resolve hit target.");
  return;
}

await launchActivity(shellAct, [targetUuid]);
