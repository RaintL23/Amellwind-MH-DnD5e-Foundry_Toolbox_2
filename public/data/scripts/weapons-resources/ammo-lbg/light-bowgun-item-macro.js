// Light Bowgun — Item Macro (MidiQOL 12.4 / Foundry v12 / dnd5e 4.4)
// On Use: [preTargeting]ItemMacro
//
// Reload / Evading Reload:
//   Dialog → pick ammo from inventory → fill Magazine (full or half) → spend rounds from ammo stack.
//   Same ammo type already loaded: only top up empty slots (do not re-spend rounds still in the magazine).
//   Different ammo type: replace the magazine (remaining rounds are discarded).
// Fire activities (Normal Ammo, Pierce Ammo, …):
//   Require matching flags.world.lbg.loadedAmmoKey (and magazine rounds remaining).
// Rapid Fire:
//   Requires magazine rounds; uses the weapon Attack (player should pick the matching ammo activity
//   for Pierce / Spread / Recover / Explosive / Sleep).
//
// Flags (weapon):
//   flags.world.lbg.isLightBowgun
//   flags.world.lbg.tier                ("uncommon" | "rare" | "veryRare" | …)
//   flags.world.lbg.specialAmmoMax      (2 / 4 / 6 / 10)
//   flags.world.lbg.unlockedAmmo        (string[] ammo keys)
//   flags.world.lbg.loadedAmmoKey       (current magazine load)
//   flags.world.lbg.lastEvadingReloadTurn
// Flags (ammo consumable):
//   flags.world.lbg.isAmmo / ammoKey / isSpecial

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

// Only gate / dialog before the activity resolves.
if (macroPass && !macroPass.includes("pretargeting") && !macroPass.includes("preitemroll")) {
  return;
}

const rolled = (typeof rolledActivity !== "undefined" && rolledActivity)
  ? rolledActivity
  : (workflow?.activity ?? args?.[0]?.activity ?? null);

const actName = (rolled?.name ?? workflow?.activity?.name ?? "").toLowerCase();
const actId = String(
  rolled?.identifier
  ?? rolled?.midiProperties?.identifier
  ?? workflow?.activity?.identifier
  ?? workflow?.activity?.midiProperties?.identifier
  ?? "",
).toLowerCase();

const actorDoc = actor
  ?? workflow?.actor
  ?? item?.actor
  ?? item?.parent
  ?? (typeof token !== "undefined" ? token?.actor : null);

if (!actorDoc) {
  ui.notifications.warn("Light Bowgun: actor not found.");
  return;
}

const isLbgWeapon = foundry.utils.getProperty(item, "flags.world.lbg.isLightBowgun") === true
  || String(item?.system?.identifier ?? "") === "lightbowgun"
  || /^light bowgun\b/i.test(item?.name ?? "");

if (!isLbgWeapon) return;

const STANDARD_KEYS = new Set(["normal", "pierce", "spread"]);
const SPECIAL_KEYS = new Set([
  "recover",
  "flaming",
  "water",
  "thunder",
  "freeze",
  "poison",
  "paralysis",
  "explosive-sticky",
  "sleep",
  "dragon",
]);

const AMMO_LABELS = {
  normal: "Normal Ammo",
  pierce: "Pierce Ammo",
  spread: "Spread Ammo",
  recover: "Recover Ammo",
  flaming: "Flaming Ammo",
  water: "Water Ammo",
  thunder: "Thunder Ammo",
  freeze: "Freeze Ammo",
  poison: "Poison Ammo",
  paralysis: "Paralysis Ammo",
  "explosive-sticky": "Explosive/Sticky Ammo",
  sleep: "Sleep Ammo",
  dragon: "Dragon Ammo",
};

const activityToAmmoKey = () => {
  if (actId === "normal-ammo" || actName === "normal ammo" || actName === "attack") return "normal";
  if (actId === "pierce-ammo" || actName.includes("pierce ammo")) return "pierce";
  if (actId === "spread-ammo" || actName.includes("spread ammo")) return "spread";
  if (actId === "recover-ammo" || actName.includes("recover ammo")) return "recover";
  if (actId === "flaming-ammo" || actName.includes("flaming ammo")) return "flaming";
  if (actId === "water-ammo" || actName.includes("water ammo")) return "water";
  if (actId === "thunder-ammo" || actName.includes("thunder ammo")) return "thunder";
  if (actId === "freeze-ammo" || actName.includes("freeze ammo")) return "freeze";
  if (actId === "poison-ammo" || actName.includes("poison ammo")) return "poison";
  if (actId === "paralysis-ammo" || actName.includes("paralysis ammo")) return "paralysis";
  if (actId === "explosive-sticky-ammo" || actName.includes("explosive") || actName.includes("sticky")) {
    return "explosive-sticky";
  }
  if (actId === "sleep-ammo" || actName.includes("sleep ammo")) return "sleep";
  if (actId === "dragon-ammo" || actName.includes("dragon ammo")) return "dragon";
  return null;
};

const isReload =
  actId === "reload"
  || (actName === "reload" && !actName.includes("evading"));
const isEvadingReload =
  actId === "evading-reload"
  || actName.includes("evading reload");
const isRapidFire =
  actId === "rapid-fire"
  || actName.includes("rapid fire");
const fireAmmoKey = activityToAmmoKey();
const isFireActivity = Boolean(fireAmmoKey) || isRapidFire;

const abort = (msg) => {
  if (msg) ui.notifications.warn(msg);
  if (workflow) workflow.aborted = true;
  return false;
};

const magazineMax = () => {
  const raw = item.system?.uses?.max;
  const n = Number(raw);
  if (Number.isFinite(n) && n > 0) return Math.trunc(n);
  // Fallback: evaluate formula-like max if present
  try {
    const rolledMax = item.system?.uses?.max
      ? Number(Roll.getFormula?.(String(raw)) ?? raw)
      : NaN;
    if (Number.isFinite(rolledMax) && rolledMax > 0) return Math.trunc(rolledMax);
  } catch (_) { /* ignore */ }
  return 6;
};

const magazineSpent = () => Math.max(0, Number(item.system?.uses?.spent ?? 0));
const magazineAvailable = () => Math.max(0, magazineMax() - magazineSpent());

const specialMax = () => Math.max(
  1,
  Number(foundry.utils.getProperty(item, "flags.world.lbg.specialAmmoMax") ?? 2),
);

const unlockedAmmo = () => {
  const listed = foundry.utils.getProperty(item, "flags.world.lbg.unlockedAmmo");
  if (Array.isArray(listed) && listed.length) {
    return listed.map((k) => String(k).toLowerCase());
  }
  return ["normal", "pierce", "spread", "recover", "flaming", "water", "thunder", "freeze"];
};

const isAmmoItem = (i) => {
  if (foundry.utils.getProperty(i, "flags.world.lbg.isAmmo") === true) return true;
  const id = String(i.system?.identifier ?? "").toLowerCase();
  if (id.endsWith("-ammo")) return true;
  if (i.type === "consumable" && /ammo$/i.test(i.name ?? "")) return true;
  return false;
};

const ammoKeyOf = (i) => {
  const flagged = foundry.utils.getProperty(i, "flags.world.lbg.ammoKey");
  if (flagged) return String(flagged).toLowerCase();
  const id = String(i.system?.identifier ?? "").toLowerCase().replace(/-ammo$/, "");
  if (id) return id;
  return String(i.name ?? "")
    .toLowerCase()
    .replace(/\s+ammo.*$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
};

const isSpecialAmmoKey = (key) => {
  if (SPECIAL_KEYS.has(key)) return true;
  if (STANDARD_KEYS.has(key)) return false;
  return foundry.utils.getProperty(
    actorDoc.items.find((i) => isAmmoItem(i) && ammoKeyOf(i) === key),
    "flags.world.lbg.isSpecial",
  ) === true;
};

const capacityFor = (key) => (isSpecialAmmoKey(key) ? specialMax() : magazineMax());

const inventoryAmmoOptions = () => {
  const unlocked = new Set(unlockedAmmo());
  const byKey = new Map();
  for (const i of actorDoc.items) {
    if (!isAmmoItem(i)) continue;
    const key = ammoKeyOf(i);
    if (!unlocked.has(key)) continue;
    const qty = Math.max(0, Number(i.system?.quantity ?? 0));
    if (qty <= 0) continue;
    const prev = byKey.get(key);
    if (!prev || qty > prev.qty) {
      byKey.set(key, { key, item: i, qty, label: AMMO_LABELS[key] ?? i.name });
    }
  }
  return [...byKey.values()].sort((a, b) => a.label.localeCompare(b.label));
};

const loadedKey = () => String(
  foundry.utils.getProperty(item, "flags.world.lbg.loadedAmmoKey") ?? "",
).toLowerCase() || null;

// ── Fire gate ───────────────────────────────────────────────────────────────
if (isFireActivity && !isReload && !isEvadingReload) {
  const avail = magazineAvailable();
  if (avail <= 0) {
    return abort("Light Bowgun: magazine empty — Reload first.");
  }
  const loaded = loadedKey();
  if (!loaded) {
    return abort("Light Bowgun: no ammo type loaded — use Reload.");
  }
  if (isRapidFire) {
    // Pierce / Spread / Recover / Explosive / Sleep need their dedicated activities.
    if (["pierce", "spread", "recover", "explosive-sticky", "sleep"].includes(loaded)) {
      return abort(
        `Light Bowgun: ${AMMO_LABELS[loaded] ?? loaded} is loaded — use that ammo activity (not Rapid Fire).`,
      );
    }
    return;
  }
  if (fireAmmoKey && fireAmmoKey !== loaded) {
    return abort(
      `Light Bowgun: magazine is loaded with ${AMMO_LABELS[loaded] ?? loaded}, not ${AMMO_LABELS[fireAmmoKey] ?? fireAmmoKey}. Reload to switch.`,
    );
  }
  return;
}

// ── Reload / Evading Reload ─────────────────────────────────────────────────
if (!isReload && !isEvadingReload) return;

if (isEvadingReload) {
  const combat = game.combat;
  if (combat?.started) {
    const turnKey = `${combat.id}:${combat.round}:${combat.turn}:${actorDoc.id}`;
    const last = foundry.utils.getProperty(actorDoc, "flags.world.lbg.lastEvadingReloadTurn");
    if (last === turnKey) {
      return abort("Light Bowgun: Evading Reload already used this turn.");
    }
  }
}

const options = inventoryAmmoOptions();
if (!options.length) {
  return abort("Light Bowgun: no unlocked ammo in inventory (quantity > 0).");
}

const half = isEvadingReload;
const title = half ? "Evading Reload — Magazine" : "Reload — Magazine";
const currentLoaded = loadedKey();
const magMax = magazineMax();
const magAvail = magazineAvailable();

const optsHtml = options.map((o) => {
  const cap = capacityFor(o.key);
  const targetAvail = half ? Math.floor(cap / 2) : cap;
  const sameType = Boolean(currentLoaded && currentLoaded === o.key);
  const need = sameType
    ? Math.max(0, targetAvail - magAvail)
    : targetAvail;
  const selected = currentLoaded === o.key ? " selected" : "";
  const special = isSpecialAmmoKey(o.key) ? " [Special]" : "";
  const loadHint = sameType
    ? (need > 0 ? `top up ${need}/${cap}` : `full ${magAvail}/${cap}`)
    : `load ${targetAvail}/${cap}`;
  return `<option value="${esc(o.key)}"${selected}>${esc(o.label)}${special} — pack ${o.qty}, ${loadHint}</option>`;
}).join("");

const content = `
<form class="flexcol">
  <p>Magazine: <strong>${magAvail}/${magMax}</strong>${
    currentLoaded ? ` · loaded <em>${esc(AMMO_LABELS[currentLoaded] ?? currentLoaded)}</em>` : ""
  }</p>
  <p>${half
    ? "Evading Reload loads <strong>half</strong> of the chosen ammo capacity (rounded down)."
    : "Reload fills up to the chosen ammo capacity (standard Magazine or Special Ammo limit)."
  }</p>
  <p>Reloading the <strong>same</strong> ammo type only spends rounds for empty slots. Switching ammo replaces the magazine.</p>
  <div class="form-group">
    <label>Ammunition</label>
    <div class="form-fields">
      <select name="lbg-ammo">${optsHtml}</select>
    </div>
  </div>
</form>`;

const chosenKey = await new Promise((resolve) => {
  let settled = false;
  const done = (v) => { if (!settled) { settled = true; resolve(v); } };
  new Dialog({
    title,
    content,
    buttons: {
      ok: {
        icon: '<i class="fas fa-sync"></i>',
        label: half ? "Evading Reload" : "Reload",
        callback: (html) => {
          const $h = html?.find ? html : $(html);
          done($h.find('select[name="lbg-ammo"]').val() || null);
        },
      },
      cancel: {
        icon: '<i class="fas fa-times"></i>',
        label: "Cancel",
        callback: () => done(null),
      },
    },
    default: "ok",
    close: () => done(null),
  }).render(true);
});

if (!chosenKey) {
  return abort("Light Bowgun: reload cancelled.");
}

const pick = options.find((o) => o.key === chosenKey);
if (!pick) {
  return abort("Light Bowgun: invalid ammo selection.");
}

const cap = capacityFor(chosenKey);
const targetAvail = half ? Math.floor(cap / 2) : cap;
if (targetAvail <= 0) {
  return abort("Light Bowgun: load amount is 0 for this capacity.");
}

const sameType = Boolean(currentLoaded && currentLoaded === chosenKey);
const need = sameType
  ? Math.max(0, targetAvail - magAvail)
  : targetAvail;

if (sameType && need <= 0) {
  return abort(
    half
      ? "Light Bowgun: magazine already at or above half capacity for this ammo."
      : "Light Bowgun: magazine already full for this ammo.",
  );
}

const loadAmt = Math.min(need, pick.qty);
if (loadAmt <= 0) {
  return abort(`Light Bowgun: no rounds left in ${pick.label}.`);
}

const finalAvail = sameType ? magAvail + loadAmt : loadAmt;
const bowItem = actorDoc.items.get(item.id) ?? item;
const max = magazineMax();
const newSpent = Math.max(0, max - finalAvail);
const newQty = Math.max(0, Number(pick.item.system?.quantity ?? 0) - loadAmt);

await pick.item.update({ "system.quantity": newQty });
await bowItem.update({
  "system.uses.spent": newSpent,
  "flags.world.lbg.loadedAmmoKey": chosenKey,
});

if (half) {
  const combat = game.combat;
  if (combat?.started) {
    const turnKey = `${combat.id}:${combat.round}:${combat.turn}:${actorDoc.id}`;
    await actorDoc.setFlag("world", "lbg.lastEvadingReloadTurn", turnKey);
  }
}

const specialNote = isSpecialAmmoKey(chosenKey)
  ? ` Special Ammo capacity ${cap}.`
  : "";
const topUpNote = sameType ? " (top-up)" : "";

await ChatMessage.create({
  speaker: ChatMessage.getSpeaker({ actor: actorDoc }),
  content: `<div class="dnd5e2"><p><strong>${esc(actorDoc.name)}</strong> ${
    half ? "evading-reloads" : "reloads"
  } the Light Bowgun with <em>${esc(pick.label)}</em>${topUpNote}.</p><p>Magazine <strong>${finalAvail}/${max}</strong> · spent ${loadAmt} from inventory (${newQty} left).${specialNote}</p></div>`,
});

return;
