// Amellwind unified rune controller (Foundry v12 / dnd5e 4.4 / MidiQOL + DAE + Item Macro)
// DAE runs this via change key "macro.itemMacro": args[0] === "on" when equipped, "off" when unequipped.
// MidiQOL on-use passes arrive with args[0].macroPass (registered by the cloned effect on the actor).
//
// Canonical source: public/data/scripts/runes/unified-rune-controller.js
// Injected into each rune Item by foundry-jsons-example/runes/build-runes-itemacro.mjs
// Per-rune combat / on-equip hooks fill the RUNE_COMBAT_PASSES slot below (must run before
// the on/off handlers so wraps of runeApplySide / runeCleanup and runeOnEquip take effect).
const FLAG = "amellwind-toolbox";
// Foundry only allows getFlag/setFlag for active module ids / "world" / "core".
// This content pack uses a custom namespace, so read/write via getProperty + update.
const getRuneFlag = (doc, key) => foundry.utils.getProperty(doc, `flags.${FLAG}.${key}`);
const setRuneFlag = async (doc, key, value) => doc.update({ [`flags.${FLAG}.${key}`]: value });
const unsetRuneFlag = async (doc, key) => doc.update({ [`flags.${FLAG}.-=${key}`]: null });
const actorDoc = actor ?? item?.actor ?? item?.parent;
if (!item) return;
const arg0 = args?.[0];
const pass = String(arg0?.macroPass ?? "").toLowerCase();
const runeName = getRuneFlag(item, "runeName") ?? item.name;

/** Normalize forge identifier / baseItem / display name → compact key (e.g. huntinghorn). */
const normalizeWeaponKey = (value) => String(value ?? "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "");

const WEAPON_TYPE_LABELS = {
  huntinghorn: "Hunting Horn",
  gunlance: "Gunlance",
  bow: "Bow",
  dualblades: "Dual Blades",
  greatsword: "Great Sword",
  lance: "Lance",
  chargeblade: "Charge Blade",
  switchaxe: "Switch Axe",
  lightbowgun: "Light Bowgun",
  heavybowgun: "Heavy Bowgun",
  dualrepeaters: "Dual Repeaters",
};

function weaponKeysOfItem(w) {
  if (!w || w.type !== "weapon") return [];
  const keys = new Set();
  const id = normalizeWeaponKey(w.system?.identifier);
  const base = normalizeWeaponKey(w.system?.type?.baseItem);
  const named = normalizeWeaponKey(getRuneFlag(w, "baseWeaponName") ?? w.name);
  if (id) keys.add(id);
  if (base) keys.add(base);
  if (named) keys.add(named);
  // Common aliases
  if (keys.has("greatsword") || named.includes("greatsword")) keys.add("greatsword");
  if (keys.has("huntinghorn") || named.includes("huntinghorn")) keys.add("huntinghorn");
  return [...keys];
}

function isRangedWeaponItem(w) {
  if (!w || w.type !== "weapon") return false;
  const props = w.system?.properties;
  if (props?.has?.("ranged") || props?.ranged || (Array.isArray(props) && props.includes("ranged"))) return true;
  const t = String(w.system?.type?.value ?? "").toLowerCase();
  return t === "martialr" || t === "simpler" || t.includes("ranged");
}

function actorHasRequiredWeapon(actor, requireWeaponTypes = []) {
  const req = (requireWeaponTypes ?? []).map(normalizeWeaponKey).filter(Boolean);
  if (!req.length) return true;
  if (!actor) return false;
  const equipped = [...(actor.items ?? [])].filter((i) => i.type === "weapon" && i.system?.equipped);
  if (req.includes("ranged")) {
    if (equipped.some(isRangedWeaponItem)) return true;
  }
  const concrete = req.filter((k) => k !== "ranged");
  if (!concrete.length) return false;
  for (const w of equipped) {
    const keys = weaponKeysOfItem(w);
    if (concrete.some((k) => keys.includes(k))) return true;
  }
  return false;
}

function requireLabel(requireWeaponTypes = []) {
  const req = requireWeaponTypes ?? [];
  if (!req.length) return "";
  const labels = req.map((k) => WEAPON_TYPE_LABELS[normalizeWeaponKey(k)] ?? k);
  if (labels.length === 1) return labels[0];
  if (labels.length === 2) return `${labels[0]} or ${labels[1]}`;
  return `${labels.slice(0, -1).join(", ")}, or ${labels[labels.length - 1]}`;
}

function findRuneActivity(identifierOrName) {
  const needle = String(identifierOrName ?? "").toLowerCase().trim();
  if (!needle || !item?.system?.activities) return null;
  const activities = item.system.activities;
  const list = typeof activities?.contents !== "undefined"
    ? [...activities]
    : Object.values(activities ?? {});
  return list.find((a) => {
    const id = String(a?.midiProperties?.identifier ?? a?.identifier ?? "").toLowerCase();
    const name = String(a?.name ?? "").toLowerCase();
    return id === needle || name === needle || id.includes(needle) || name.includes(needle);
  }) ?? null;
}

/**
 * Run a Midi/dnd5e save (or other) activity so owners roll via Midi — not GM rollSavingThrow.
 * Guard: nested ItemMacro onUse from completeActivityUse is ignored via __amellwindRuneActivityDepth.
 */
async function useRuneSaveActivity({
  identifier,
  targetUuids = [],
  midiOptions = {},
  configure = false,
} = {}) {
  const activity = findRuneActivity(identifier);
  if (!activity) {
    console.warn(`${runeName} | activity not found`, identifier);
    return null;
  }
  globalThis.__amellwindRuneActivityDepth = (globalThis.__amellwindRuneActivityDepth ?? 0) + 1;
  try {
    const options = {
      midiOptions: {
        targetUuids: targetUuids.filter(Boolean),
        ...midiOptions,
      },
    };
    if (typeof MidiQOL?.completeActivityUse === "function") {
      return await MidiQOL.completeActivityUse(activity, options, { configure }, { create: true });
    }
    if (typeof activity.use === "function") {
      return await activity.use(options, { configure }, { create: true });
    }
  } catch (err) {
    console.error(`${runeName} | useRuneSaveActivity failed`, identifier, err);
  } finally {
    globalThis.__amellwindRuneActivityDepth = Math.max(
      0,
      (globalThis.__amellwindRuneActivityDepth ?? 1) - 1,
    );
  }
  return null;
}

async function runeCleanup() {
  if (!actorDoc) return;
  const mine = actorDoc.effects.filter((e) => getRuneFlag(e, "runeClone") && e.origin === item.uuid);
  if (mine.length) await actorDoc.deleteEmbeddedDocuments("ActiveEffect", mine.map((e) => e.id));
  await unsetRuneFlag(item, "applied");
}

function runeAeName(side, matName, trinket) {
  let n = `${runeName}-${side}`;
  if (matName) n += `-${matName}`;
  if (trinket) n += " (Trinket)";
  return n;
}

async function runeApplySide(side, trinket) {
  if (!actorDoc) return;
  const blueprints = item.effects.filter((e) => getRuneFlag(e, "runeSide") === side);
  const docs = blueprints.map((e) => {
    const o = e.toObject();
    delete o._id;
    o.origin = item.uuid;
    o.disabled = false;
    o.transfer = false;
    o.name = runeAeName(side, getRuneFlag(e, "materialEffectName"), trinket);
    foundry.utils.setProperty(o, `flags.${FLAG}.runeClone`, true);
    // Never clutter the token with rune status icons (many runes equipped at once).
    foundry.utils.setProperty(o, "flags.dae.showIcon", false);
    return o;
  });
  if (docs.length) await actorDoc.createEmbeddedDocuments("ActiveEffect", docs);
  await setRuneFlag(item, "applied", { side, trinket });
  if (typeof runeOnEquip === "function") await runeOnEquip(side, trinket);
}

// ===== rune-specific combat passes =====
/* @@RUNE_COMBAT_PASSES@@ */

// Nested completeActivityUse re-enters ItemMacro — skip combat/equip logic.
if ((globalThis.__amellwindRuneActivityDepth ?? 0) > 0 && arg0 !== "on" && arg0 !== "off") {
  return;
}

if (arg0 === "on") {
  if (!actorDoc) return;
  await runeCleanup();
  const sides = getRuneFlag(item, "sides") ?? {};
  const available = Object.keys(sides).filter((s) => sides[s]);
  if (!available.length) return;

  const sideMeta = available.map((s) => {
    const meta = sides[s] ?? {};
    const req = meta.requireWeaponTypes ?? [];
    const ok = actorHasRequiredWeapon(actorDoc, req);
    const need = requireLabel(req);
    return { side: s, label: meta.label ?? s, req, ok, need };
  });

  const radios = sideMeta
    .map((m, i) => {
      const firstOk = sideMeta.findIndex((x) => x.ok);
      const checked = (firstOk >= 0 ? firstOk : 0) === i ? "checked" : "";
      const disabled = m.ok ? "" : "disabled";
      const hint = m.req.length
        ? (m.ok
          ? ` <em style="opacity:.75">(requires ${m.need})</em>`
          : ` <em style="color:#a66">(needs ${m.need} equipped)</em>`)
        : "";
      return `<label style="display:block;margin:.15rem 0;${m.ok ? "" : "opacity:.55"}"><input type="radio" name="runeSide" value="${m.side}" ${checked} ${disabled}/> ${m.label}${hint}</label>`;
    })
    .join("");

  const content = `<form class="dnd5e2"><p>Choose which effect to activate for <strong>${runeName}</strong>:</p>${radios}<hr/><label style="display:block;margin-top:.35rem"><input type="checkbox" name="runeTrinket"/> Equipped in a trinket</label></form>`;
  const choice = await new Promise((resolve) => {
    new Dialog({
      title: `${runeName} Rune`,
      content,
      buttons: {
        ok: {
          icon: '<i class="fas fa-check"></i>',
          label: "Activate",
          callback: (html) => resolve({
            side: html.find('input[name="runeSide"]:checked').val(),
            trinket: html.find('input[name="runeTrinket"]').is(":checked"),
          }),
        },
        cancel: { icon: '<i class="fas fa-times"></i>', label: "Cancel", callback: () => resolve(null) },
      },
      default: "ok",
      close: () => resolve(null),
    }).render(true);
  });
  if (!choice || !choice.side) {
    await item.update({ "system.equipped": false });
    return;
  }
  const picked = sideMeta.find((m) => m.side === choice.side);
  if (picked && !picked.ok) {
    ui.notifications?.warn?.(
      `${runeName}: equip a ${picked.need || "required weapon"} before activating this effect.`,
    );
    await item.update({ "system.equipped": false });
    return;
  }
  await runeApplySide(choice.side, choice.trinket);
  return;
}

if (arg0 === "off") { await runeCleanup(); return; }
if (arg0 === "each") return;

// Choose Muse activity (Gravios Pleura) — utility use from the sheet
{
  const act = workflow?.activity ?? arg0?.activity ?? rolledActivity;
  const actId = String(
    act?.midiProperties?.identifier ?? act?.identifier ?? "",
  ).toLowerCase();
  const actName = String(act?.name ?? "").toLowerCase();
  const isChooseMuse = actId === "choose-muse" || actName.includes("choose muse");
  if (isChooseMuse && actorDoc) {
    const applied = getRuneFlag(item, "applied");
    if (!applied || applied.side !== "weapon") {
      ui.notifications?.warn?.(`${runeName}: activate the Muse (weapon) side first.`);
      return;
    }
    const sides = getRuneFlag(item, "sides") ?? {};
    const req = sides.weapon?.requireWeaponTypes ?? ["huntinghorn"];
    if (!actorHasRequiredWeapon(actorDoc, req)) {
      ui.notifications?.warn?.(`${runeName}: Hunting Horn must be equipped to choose a Muse.`);
      return;
    }
    const targets = [...(workflow?.targets ?? arg0?.targets ?? game.user.targets ?? [])];
    let museToken = targets[0]?.document ?? targets[0] ?? null;
    let museActor = museToken?.actor ?? targets[0]?.actor ?? null;
    if (!museActor) {
      ui.notifications?.warn?.(`${runeName}: target a creature to become your Muse.`);
      return;
    }
    if (museActor.uuid === actorDoc.uuid) {
      ui.notifications?.warn?.(`${runeName}: choose a creature other than yourself.`);
      return;
    }
    await setRuneFlag(item, "muse", {
      actorUuid: museActor.uuid,
      tokenUuid: museToken?.uuid ?? museActor.getActiveTokens?.()?.[0]?.document?.uuid ?? null,
      name: museActor.name,
      chosenAt: game.time?.worldTime ?? 0,
    });
    ui.notifications?.info?.(`${runeName}: ${museActor.name} is now your Muse (until your next long rest).`);
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: actorDoc }),
      content: `<div class="dnd5e2"><p><strong>${runeName}</strong> — Muse: <em>${museActor.name}</em> (within 120 ft gains your completed melody benefits).</p></div>`,
    });
    if (globalThis.__amellwindRuneRuntime?.syncMuseForActor) {
      await globalThis.__amellwindRuneRuntime.syncMuseForActor(actorDoc);
    }
    return;
  }
}
