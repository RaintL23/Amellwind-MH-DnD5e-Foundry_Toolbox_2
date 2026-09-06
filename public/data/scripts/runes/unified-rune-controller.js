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

if (arg0 === "on") {
  if (!actorDoc) return;
  await runeCleanup();
  const sides = getRuneFlag(item, "sides") ?? {};
  const available = Object.keys(sides).filter((s) => sides[s]);
  if (!available.length) return;
  const radios = available
    .map((s, i) => `<label style="display:block;margin:.15rem 0"><input type="radio" name="runeSide" value="${s}" ${i === 0 ? "checked" : ""}/> ${sides[s].label ?? s}</label>`)
    .join("");
  const content = `<form class="dnd5e2"><p>Choose which effect to activate for <strong>${runeName}</strong>:</p>${radios}<hr/><label style="display:block;margin-top:.35rem"><input type="checkbox" name="runeTrinket"/> Equipped in a trinket</label></form>`;
  const choice = await new Promise((resolve) => {
    new Dialog({
      title: `${runeName} Rune`,
      content,
      buttons: {
        ok: { icon: '<i class="fas fa-check"></i>', label: "Activate", callback: (html) => resolve({ side: html.find('input[name="runeSide"]:checked').val(), trinket: html.find('input[name="runeTrinket"]').is(":checked") }) },
        cancel: { icon: '<i class="fas fa-times"></i>', label: "Cancel", callback: () => resolve(null) },
      },
      default: "ok",
      close: () => resolve(null),
    }).render(true);
  });
  if (!choice || !choice.side) { await item.update({ "system.equipped": false }); return; }
  await runeApplySide(choice.side, choice.trinket);
  return;
}

if (arg0 === "off") { await runeCleanup(); return; }
if (arg0 === "each") return;
