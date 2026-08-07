// Hunting Horn — Item Macro (MidiQOL 12.4 / Foundry v12)
// On Use: ItemMacro @ "Called before targeting is resolved (*)" / preTargeting
//
// Compatible with:
// - Recital (uncommon): flags.world.hh.maxActiveMelodies = 1
// - Encore (rare+):     flags.world.hh.maxActiveMelodies = 2+
// - End Melodies:       disables all Songbook auras (any rarity)
// Melodies detected via flags.world.hh.isMelody / identifier melody-* / name "Melody of *"
// UI: one dropdown per active Melody slot (no checkboxes); exclusive options when multi-slot.

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
const actId = String(rolled?.identifier ?? workflow?.activity?.identifier ?? "").toLowerCase();

const isEndMelodies =
  actId === "end-melodies" || actId === "cancel-melodies"
  || actName.includes("end melod") || actName.includes("cancel melod");

const isSongUse =
  actId === "recital" || actId === "encore"
  || actName.includes("recital") || actName.includes("encore");

if (!isEndMelodies && !isSongUse) return;

const actorDoc = actor
  ?? workflow?.actor
  ?? item?.actor
  ?? item?.parent
  ?? (typeof token !== "undefined" ? token?.actor : null);

if (!actorDoc) {
  ui.notifications.warn("Hunting Horn: no se encontró el actor.");
  return;
}

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

const disableAllMelodyAuras = async () => {
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
  return ops.length;
};

const refreshActiveAuras = async (reason) => {
  try {
    const sceneId = canvas.scene?.id;
    if (game.modules.get("ActiveAuras")?.active && sceneId) {
      if (globalThis.ActiveAuras?.CollateAuras) {
        await ActiveAuras.CollateAuras(sceneId, true, true, reason);
      } else if (globalThis.AAHelpers?.collateAuras) {
        await AAHelpers.collateAuras(sceneId, true, true, reason);
      }
    }
  } catch (err) {
    console.warn("Hunting Horn: Active Auras refresh skipped", err);
  }
};

// ── End Melodies (any rarity) ──────────────────────────────────────────────
if (isEndMelodies) {
  if (!melodies.length) {
    ui.notifications.warn("Hunting Horn: no hay Melodies en el Songbook del actor.");
    return;
  }
  const changed = await disableAllMelodyAuras();
  await refreshActiveAuras("hunting-horn-end");
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: actorDoc }),
    content: `<div class="dnd5e2"><p><strong>${esc(actorDoc.name)}</strong> ends all active Songbook Melodies.</p>${
      changed ? "" : "<p><em>No active Melody auras were found.</em></p>"
    }</div>`
  });
  if (!changed) ui.notifications.info("Hunting Horn: no había Melodies activas.");
  return;
}

// ── Recital / Encore (perform) ─────────────────────────────────────────────
if (!melodies.length) {
  ui.notifications.warn("Hunting Horn: no hay Melodies en el Songbook del actor.");
  return;
}

const maxActive = Math.max(1, Number(foundry.utils.getProperty(item, "flags.world.hh.maxActiveMelodies") ?? 1));
const pickCount = Math.min(maxActive, melodies.length);
const title = (actId === "encore" || actName.includes("encore")) ? "Encore — Songbook" : "Recital — Songbook";

ui.notifications.info(`${title}: elige ${pickCount} Melody${pickCount > 1 ? "s" : ""}…`);

// One dropdown per active slot; pre-select distinct defaults (1st, 2nd, …).
const selectsHtml = Array.from({ length: pickCount }, (_, i) => {
  const label = pickCount === 1 ? "Melody" : `Melody ${i + 1}`;
  const opts = melodies.map((m, mi) =>
    `<option value="${m.id}"${mi === i ? " selected" : ""}>${esc(m.name)}</option>`
  ).join("");
  return `
  <div class="form-group">
    <label>${label}</label>
    <div class="form-fields">
      <select class="hh-melody-select" data-slot="${i}">${opts}</select>
    </div>
  </div>`;
}).join("");

const promptText = pickCount === 1
  ? "Activa 1 Melody (aura 15 ft, 1 minuto)."
  : `Elige <strong>${pickCount}</strong> Melodies distintas (aura 15 ft, 1 minuto).`;

const content = `
<form class="flexcol">
  <p>${promptText}</p>
  ${selectsHtml}
</form>`;

const selectedIds = await new Promise((resolve) => {
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
          const picked = $h.find("select.hh-melody-select").map((_, el) => el.value).get();
          if (picked.length !== pickCount || picked.some(id => !id)) {
            ui.notifications.warn(`Debes elegir ${pickCount} Melody${pickCount > 1 ? "s" : ""}.`);
            done(null);
            return;
          }
          if (new Set(picked).size !== picked.length) {
            ui.notifications.warn("Las Melodies deben ser distintas.");
            done(null);
            return;
          }
          done(picked);
        }
      },
      cancel: { icon: '<i class="fas fa-times"></i>', label: "Cancel", callback: () => done(null) }
    },
    default: "ok",
    close: () => done(null),
    // Multi-slot: hide a Melody from other dropdowns once it is selected.
    render: (html) => {
      if (pickCount <= 1) return;
      const $h = html?.find ? html : $(html);
      const syncExclusiveOptions = () => {
        const selects = $h.find("select.hh-melody-select").toArray();
        const chosen = selects.map((sel) => sel.value);
        selects.forEach((sel, i) => {
          const current = chosen[i];
          const blocked = new Set(chosen.filter((id, j) => j !== i && id));
          const opts = melodies
            .filter((m) => m.id === current || !blocked.has(m.id))
            .map((m) => `<option value="${m.id}"${m.id === current ? " selected" : ""}>${esc(m.name)}</option>`)
            .join("");
          sel.innerHTML = opts;
          if (current && [...sel.options].some((o) => o.value === current)) sel.value = current;
        });
      };
      $h.find("select.hh-melody-select").off("change.hhExclusive").on("change.hhExclusive", syncExclusiveOptions);
      syncExclusiveOptions();
    }
  }).render(true);
});

if (!selectedIds?.length) {
  ui.notifications.warn("Cancelado.");
  return;
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

await disableAllMelodyAuras();

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

await refreshActiveAuras("hunting-horn-song");

await ChatMessage.create({
  speaker: ChatMessage.getSpeaker({ actor: actorDoc }),
  content: `<div class="dnd5e2"><p><strong>${esc(actorDoc.name)}</strong> performs <em>${esc(enabledNames.join(" + "))}</em>.</p><p>15-foot aura(s) active for 1 minute (or until Incapacitated / another performance / End Melodies).</p></div>`
});
