// Hunting Horn — Item Macro (MidiQOL 12.4 / Foundry v12)
// On Use: ItemMacro @ "Called before targeting is resolved (*)" / preTargeting
//
// Compatible with:
// - Recital (uncommon): flags.world.hh.maxActiveMelodies = 1
// - Encore (rare+):     flags.world.hh.maxActiveMelodies = 2
// Melodies detected via flags.world.hh.isMelody / identifier melody-* / name "Melody of *"

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

const rolled = (typeof rolledActivity !== "undefined" && rolledActivity)
  ? rolledActivity
  : (workflow?.activity ?? args?.[0]?.activity ?? null);

const actName = (rolled?.name ?? workflow?.activity?.name ?? "").toLowerCase();
const actId = rolled?.identifier ?? workflow?.activity?.identifier ?? "";
const isSongUse =
  actId === "recital" || actId === "encore"
  || actName.includes("recital") || actName.includes("encore");

if (!isSongUse) return;

const actorDoc = actor
  ?? workflow?.actor
  ?? item?.actor
  ?? item?.parent
  ?? (typeof token !== "undefined" ? token?.actor : null);

if (!actorDoc) {
  ui.notifications.warn("Hunting Horn: no se encontró el actor.");
  return;
}

const maxActive = Math.max(1, Number(foundry.utils.getProperty(item, "flags.world.hh.maxActiveMelodies") ?? 1));

const isMelodyItem = (i) => {
  const flag = foundry.utils.getProperty(i, "flags.world.hh.isMelody");
  const id = String(i.system?.identifier ?? "");
  return flag === true
    || (i.type === "feat" && id.startsWith("melody-"))
    || /^melody of /i.test(i.name ?? "");
};

const isMelodyAura = (ef) => {
  const flag = foundry.utils.getProperty(ef, "flags.world.hh.isMelodyAura");
  return flag === true || /melody of/i.test(ef.name ?? "");
};

const melodies = actorDoc.items.filter(isMelodyItem);
if (!melodies.length) {
  ui.notifications.warn("Hunting Horn: no hay Melodies en el Songbook del actor.");
  return;
}

const pickCount = Math.min(maxActive, melodies.length);
const title = (actId === "encore" || actName.includes("encore")) ? "Encore — Songbook" : "Recital — Songbook";

ui.notifications.info(`${title}: elige ${pickCount} Melody${pickCount > 1 ? "s" : ""}…`);

let selectedIds = [];
if (pickCount === 1) {
  const optionsHtml = melodies.map(m => `<option value="${m.id}">${esc(m.name)}</option>`).join("");
  const content = `
<form class="flexcol">
  <p>Activa 1 Melody (aura 15 ft, 1 minuto).</p>
  <div class="form-group"><label>Melody</label>
    <div class="form-fields"><select id="hh-melody-select">${optionsHtml}</select></div>
  </div>
</form>`;
  const selectedId = await new Promise((resolve) => {
    let settled = false;
    const done = (v) => { if (!settled) { settled = true; resolve(v); } };
    new Dialog({
      title,
      content,
      buttons: {
        ok: {
          icon: '<i class="fas fa-music"></i>',
          label: "Perform",
          callback: (html) => {
            const $h = html?.find ? html : $(html);
            done($h.find("#hh-melody-select").val() || null);
          }
        },
        cancel: { icon: '<i class="fas fa-times"></i>', label: "Cancel", callback: () => done(null) }
      },
      default: "ok",
      close: () => done(null)
    }).render(true);
  });
  if (!selectedId) {
    ui.notifications.warn("Cancelado.");
    return;
  }
  selectedIds = [selectedId];
} else {
  const boxes = melodies.map(m => `
<label class="checkbox" style="display:block;margin:0.25em 0;">
  <input type="checkbox" name="melody" value="${m.id}"> ${esc(m.name)}
</label>`).join("");
  const content = `
<form class="flexcol">
  <p>Elige <strong>exactamente ${pickCount}</strong> Melodies distintas (aura 15 ft, 1 minuto).</p>
  <div class="form-group">${boxes}</div>
</form>`;
  selectedIds = await new Promise((resolve) => {
    let settled = false;
    const done = (v) => { if (!settled) { settled = true; resolve(v); } };
    new Dialog({
      title,
      content,
      buttons: {
        ok: {
          icon: '<i class="fas fa-music"></i>',
          label: "Perform",
          callback: (html) => {
            const $h = html?.find ? html : $(html);
            const picked = $h.find('input[name="melody"]:checked').map((_, el) => el.value).get();
            if (picked.length !== pickCount) {
              ui.notifications.warn(`Debes elegir exactamente ${pickCount} Melodies.`);
              done(null);
              return;
            }
            done(picked);
          }
        },
        cancel: { icon: '<i class="fas fa-times"></i>', label: "Cancel", callback: () => done(null) }
      },
      default: "ok",
      close: () => done(null)
    }).render(true);
  });
  if (!selectedIds?.length) {
    ui.notifications.warn("Cancelado.");
    return;
  }
}

const selected = selectedIds.map(id => melodies.find(m => m.id === id)).filter(Boolean);
if (selected.length !== pickCount) {
  ui.notifications.error("Selección de Melodies inválida.");
  return;
}

// Element choice for Harmful Elements
const ELEMENTS = ["acid", "cold", "fire", "lightning", "thunder"];
const chooseElement = async (melodyName) => {
  const opts = ELEMENTS.map(e => `<option value="${e}">${e.charAt(0).toUpperCase()}${e.slice(1)}</option>`).join("");
  return await new Promise((resolve) => {
    let settled = false;
    const done = (v) => { if (!settled) { settled = true; resolve(v); } };
    new Dialog({
      title: `${melodyName} — Element`,
      content: `<form><div class="form-group"><label>Damage Type</label>
        <div class="form-fields"><select id="hh-element">${opts}</select></div></div></form>`,
      buttons: {
        ok: {
          icon: '<i class="fas fa-check"></i>',
          label: "Choose",
          callback: (html) => {
            const $h = html?.find ? html : $(html);
            done($h.find("#hh-element").val() || "fire");
          }
        },
        cancel: { icon: '<i class="fas fa-times"></i>', label: "Cancel", callback: () => done(null) }
      },
      default: "ok",
      close: () => done(null)
    }).render(true);
  });
};

const elementByMelodyId = {};
for (const mel of selected) {
  const needs = foundry.utils.getProperty(mel, "flags.world.hh.needsElementChoice") === true
    || (mel.system?.identifier ?? "") === "melody-of-the-harmful-elements"
    || /harmful elements/i.test(mel.name ?? "");
  if (!needs) continue;
  const el = await chooseElement(mel.name);
  if (!el) {
    ui.notifications.warn("Cancelado.");
    return;
  }
  elementByMelodyId[mel.id] = el;
}

// Disable all melody auras
const ops = [];
for (const mel of melodies) {
  for (const ef of mel.effects) {
    if (!isMelodyAura(ef)) continue;
    ops.push(ef.update({
      disabled: true,
      duration: { seconds: null, rounds: null, turns: null, startTime: null }
    }));
  }
}
for (const ef of actorDoc.effects) {
  if (!isMelodyAura(ef)) continue;
  ops.push(ef.update({
    disabled: true,
    duration: { seconds: null, rounds: null, turns: null, startTime: null }
  }));
}
if (ops.length) await Promise.all(ops);

const startTime = game.time.worldTime;
const enabledNames = [];

for (const mel of selected) {
  const auras = mel.effects.filter(isMelodyAura);
  if (!auras.length) {
    ui.notifications.error(`${mel.name}: sin Active Effect de aura.`);
    return;
  }
  const element = elementByMelodyId[mel.id];
  for (const ef of auras) {
    const update = {
      disabled: false,
      duration: {
        seconds: 60,
        startTime,
        rounds: null,
        turns: null,
        combat: null,
        startRound: null,
        startTurn: null
      }
    };
    if (element) {
      const formula = `1d4[${element}]`;
      update.changes = [
        { key: "system.bonuses.mwak.damage", mode: 2, value: formula, priority: 20 },
        { key: "system.bonuses.rwak.damage", mode: 2, value: formula, priority: 20 },
        { key: "system.bonuses.msak.damage", mode: 2, value: formula, priority: 20 },
        { key: "system.bonuses.rsak.damage", mode: 2, value: formula, priority: 20 }
      ];
      update.name = `Melody of the Harmful Elements (${element}) (Aura 15 ft)`;
    }
    await ef.update(update);
  }
  enabledNames.push(element ? `${mel.name} [${element}]` : mel.name);
}

try {
  const sceneId = canvas.scene?.id;
  if (game.modules.get("ActiveAuras")?.active && sceneId) {
    if (globalThis.ActiveAuras?.CollateAuras) {
      await ActiveAuras.CollateAuras(sceneId, true, true, "hunting-horn-song");
    } else if (globalThis.AAHelpers?.collateAuras) {
      await AAHelpers.collateAuras(sceneId, true, true, "hunting-horn-song");
    }
  }
} catch (err) {
  console.warn("Hunting Horn: Active Auras refresh skipped", err);
}

await ChatMessage.create({
  speaker: ChatMessage.getSpeaker({ actor: actorDoc }),
  content: `<div class="dnd5e2"><p><strong>${esc(actorDoc.name)}</strong> performs <em>${esc(enabledNames.join(" + "))}</em>.</p><p>15-foot aura(s) active for 1 minute (or until Incapacitated / another performance).</p></div>`
});
