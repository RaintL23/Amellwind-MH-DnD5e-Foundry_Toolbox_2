// Carving Knife — Amellwind (Foundry v12 / dnd5e 4.4 / MidiQOL + Item Macro)
// On Use: [postActiveEffects]ItemMacro
//
// Activity "Carving":
//   1. Require a target within 5 ft that is dead / unconscious / at 0 HP
//      (token name is used in the chat summary).
//   2. Dialog: Carve DC, number of carves, Slay (carve) vs Capture.
//   3. Slay — Dexterity (Survival) checks on the hunter's connected owner
//      (Foundry-style: player rolls if online, else GM). Carving Knife grants
//      Survival proficiency for the check if the hunter lacks it.
//      Success → roll d20 loot; fail → loot result 1.
//      Natural 20 (variant): extra d20 added to loot (cap 20).
//   4. Capture — no check; roll one d20 per carve count.
//   5. Chat summary with creature name + loot die results (no rune lookup).

(async () => {
  const macroPass = String(
    (typeof args !== "undefined" ? args?.[0]?.macroPass : "")
      ?? (typeof workflow !== "undefined" ? workflow?.macroPass : "")
      ?? "",
  ).toLowerCase();
  if (macroPass && !macroPass.includes("postactiveeffects")) return;

  const rolled =
    (typeof rolledActivity !== "undefined" && rolledActivity)
    || workflow?.activity
    || args?.[0]?.activity
    || null;
  const actName = String(rolled?.name ?? "").toLowerCase();
  const actId = String(
    rolled?.identifier
      ?? rolled?.midiProperties?.identifier
      ?? "",
  ).toLowerCase();
  const isCarving =
    !actId && !actName
    || actId === "carving"
    || actName === "carving"
    || actName.startsWith("carving");
  if (!isCarving) return;

  const hunter =
    (typeof actor !== "undefined" && actor)
    || workflow?.actor
    || item?.actor
    || item?.parent
    || (typeof token !== "undefined" ? token?.actor : null);

  if (!hunter) {
    ui.notifications.warn("Carving Knife: hunter actor not found.");
    return;
  }

  const esc = (value) => {
    const s = String(value ?? "");
    if (globalThis.Handlebars?.Utils?.escapeExpression) {
      return Handlebars.Utils.escapeExpression(s);
    }
    return s
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  };

  const workflowTargets = () => {
    const fromWf = Array.from(workflow?.targets ?? []);
    if (fromWf.length) return fromWf;
    const fromHits = Array.from(workflow?.hitTargets ?? []);
    if (fromHits.length) return fromHits;
    return Array.from(game.user?.targets ?? []);
  };

  const hasStatus = (targetActor, id) => {
    if (!targetActor) return false;
    const statuses = targetActor.statuses;
    if (statuses?.has?.(id)) return true;
    return [...(targetActor.effects ?? [])].some(
      (ef) => !ef.disabled && (ef.statuses?.has?.(id) || String(ef.name ?? "").toLowerCase() === id),
    );
  };

  const isCarveable = (targetActor, targetTok) => {
    if (!targetActor) return false;
    const hp = Number(targetActor.system?.attributes?.hp?.value ?? NaN);
    if (Number.isFinite(hp) && hp <= 0) return true;
    if (hasStatus(targetActor, "dead")) return true;
    if (hasStatus(targetActor, "unconscious")) return true;
    // Combat "defeated" toggle / death overlay on the token.
    if (targetTok?.combatant?.isDefeated) return true;
    if (targetTok?.document?.overlayEffect) return true;
    return false;
  };

  const parseCr = (raw) => {
    if (raw == null || raw === "") return null;
    if (typeof raw === "number" && Number.isFinite(raw)) return raw;
    const s = String(raw).trim();
    if (/^\d+\/\d+$/.test(s)) {
      const [a, b] = s.split("/").map(Number);
      if (b) return a / b;
    }
    const n = Number.parseFloat(s);
    return Number.isFinite(n) ? n : null;
  };

  const suggestCarveDc = (targetActor) => {
    const cr = parseCr(targetActor?.system?.details?.cr);
    if (cr == null) return 10;
    return 10 + Math.floor(cr / 2);
  };

  const suggestCarveCount = (targetActor) => {
    const fromFlag = Number(
      foundry.utils.getProperty(targetActor, "flags.world.amellwind.carveRolls")
        ?? foundry.utils.getProperty(targetActor, "flags.amellwind.carveRolls")
        ?? NaN,
    );
    if (Number.isFinite(fromFlag) && fromFlag > 0) return Math.min(12, Math.floor(fromFlag));
    return 3;
  };

  const survivalProficiency = (actorDoc) => {
    const sur = actorDoc?.system?.skills?.sur;
    const value = Number(sur?.value ?? sur?.prof?.multiplier ?? sur?.prof ?? 0) || 0;
    return value > 0;
  };

  const knifeProficiencyBonus = (actorDoc) => {
    if (survivalProficiency(actorDoc)) return null;
    const pb = Number(actorDoc?.system?.attributes?.prof ?? 0) || 0;
    return pb > 0 ? pb : null;
  };

  const targets = workflowTargets();
  if (!targets.length) {
    ui.notifications.warn("Carving Knife: select a creature within 5 feet to carve.");
    return;
  }
  const targetToken = targets[0];
  const prey = targetToken?.actor ?? null;
  const preyName = String(targetToken?.name ?? prey?.name ?? "Unknown Creature");

  if (!prey) {
    ui.notifications.warn("Carving Knife: target has no actor.");
    return;
  }
  if (!isCarveable(prey, targetToken)) {
    ui.notifications.warn(
      `Carving Knife: ${preyName} must be at 0 HP, dead, or unconscious.`,
    );
    return;
  }

  const defaultDc = suggestCarveDc(prey);
  const defaultCount = suggestCarveCount(prey);

  const promptSetup = () =>
    new Promise((resolve) => {
      let settled = false;
      const done = (value) => {
        if (settled) return;
        settled = true;
        resolve(value);
      };
      new Dialog({
        title: `Carving — ${preyName}`,
        content: `
          <form class="dnd5e2 flexcol" style="gap:.5rem">
            <p style="margin:0 0 .35rem">Carve <strong>${esc(preyName)}</strong>. Set the carve DC, how many materials this creature yields, and whether it was <em>Slain</em> or <em>Captured</em>.</p>
            <div class="form-group">
              <label>Carve DC</label>
              <input type="number" name="dc" value="${defaultDc}" min="1" max="40" step="1"/>
              <p class="hint" style="margin:.15rem 0 0;opacity:.75">Rule of thumb: 10 + ½ CR (rounded down). Suggested from token CR when available.</p>
            </div>
            <div class="form-group">
              <label>Number of carves / capture rolls</label>
              <input type="number" name="count" value="${defaultCount}" min="1" max="12" step="1"/>
            </div>
            <div class="form-group">
              <label>Outcome</label>
              <div class="flexrow" style="gap:1rem;align-items:center">
                <label style="display:flex;gap:.35rem;align-items:center;white-space:nowrap">
                  <input type="radio" name="mode" value="slay" checked/> Slay (Carve)
                </label>
                <label style="display:flex;gap:.35rem;align-items:center;white-space:nowrap">
                  <input type="radio" name="mode" value="capture"/> Capture
                </label>
              </div>
              <p class="hint" style="margin:.15rem 0 0;opacity:.75">
                <strong>Slay:</strong> Dexterity (Survival) vs DC per carve, then d20 loot on success (fail → 1).<br/>
                <strong>Capture:</strong> no check — one d20 loot roll per carve count (loot gathered in town).
              </p>
            </div>
          </form>
        `,
        buttons: {
          carve: {
            icon: '<i class="fas fa-cut"></i>',
            label: "Begin",
            callback: (html) => {
              const root = html[0] ?? html;
              const dc = Math.max(1, Math.min(40, Number(root.querySelector('[name="dc"]')?.value) || defaultDc));
              const count = Math.max(1, Math.min(12, Math.floor(Number(root.querySelector('[name="count"]')?.value) || defaultCount)));
              const mode = String(root.querySelector('[name="mode"]:checked')?.value || "slay");
              done({ dc, count, mode: mode === "capture" ? "capture" : "slay" });
            },
          },
          cancel: {
            icon: '<i class="fas fa-times"></i>',
            label: "Cancel",
            callback: () => done(null),
          },
        },
        default: "carve",
        close: () => done(null),
      }).render(true);
    });

  const setup = await promptSetup();
  if (!setup) return;

  const { dc, count, mode } = setup;
  const knifeBonus = knifeProficiencyBonus(hunter);
  const api = globalThis.__amellwindPlayerSaves;

  const rollSurvival = async (index) => {
    const flavor = `Carving Knife — Carve ${index}/${count} vs ${preyName} (DC ${dc}`
      + `${knifeBonus != null ? `; +${knifeBonus} from Carving Knife` : ""})`;
    const opts = {
      ability: "dex",
      bonus: knifeBonus != null ? knifeBonus : undefined,
      flavor,
      configure: true,
    };
    if (api?.rollSkill) {
      return api.rollSkill(hunter, "sur", dc, opts);
    }
    // Fallback if the module client script is not loaded yet.
    if (typeof hunter.rollSkill === "function") {
      try {
        const result = await hunter.rollSkill({
          skill: "sur",
          ability: "dex",
          target: dc,
          bonus: knifeBonus != null ? String(knifeBonus) : undefined,
          flavor,
          configure: true,
          chatMessage: true,
        });
        const total = Number(result?.total ?? result?.[0]?.total ?? NaN);
        if (!Number.isFinite(total)) return { success: false, total: 0, cancelled: true };
        return { success: total >= dc, total, cancelled: false };
      } catch (_err) {
        /* fall through */
      }
    }
    const dex = Number(hunter.system?.abilities?.dex?.mod ?? 0) || 0;
    const sur = hunter.system?.skills?.sur;
    const profMult = Number(sur?.value ?? sur?.prof?.multiplier ?? 0) || 0;
    const pb = Number(hunter.system?.attributes?.prof ?? 0) || 0;
    const profBonus = survivalProficiency(hunter) ? Math.floor(pb * (profMult || 1)) : (knifeBonus ?? 0);
    const roll = await new Roll(`1d20 + ${dex} + ${profBonus}`).evaluate();
    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: hunter }),
      flavor,
    });
    return { success: roll.total >= dc, total: roll.total, cancelled: false, isCritical: roll.dice?.[0]?.total === 20 };
  };

  const rollLootD20 = async (label) => {
    const roll = await new Roll("1d20").evaluate();
    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: hunter }),
      flavor: label,
    });
    return Number(roll.total) || 1;
  };

  /** Variant nat-20: extra d20 added to loot, capped at 20. */
  const resolveLoot = async (base, { nat20 = false, label } = {}) => {
    let loot = base;
    if (nat20) {
      const extra = await rollLootD20(`${label} — natural 20 bonus`);
      loot = Math.min(20, base + extra);
    }
    return Math.max(1, Math.min(20, loot));
  };

  const rows = [];

  if (mode === "capture") {
    for (let i = 1; i <= count; i += 1) {
      const loot = await rollLootD20(`Carving Knife — Capture loot ${i}/${count} (${preyName})`);
      rows.push({
        index: i,
        kind: "capture",
        checkTotal: null,
        checkSuccess: true,
        loot,
        note: "No Survival check (Capture)",
      });
    }
  } else {
    for (let i = 1; i <= count; i += 1) {
      const check = await rollSurvival(i);
      if (check?.cancelled) {
        rows.push({
          index: i,
          kind: "slay",
          checkTotal: check?.total ?? null,
          checkSuccess: false,
          loot: null,
          note: "Cancelled",
        });
        continue;
      }
      const success = Boolean(check?.success);
      let loot = 1;
      if (success) {
        const base = await rollLootD20(`Carving Knife — Loot ${i}/${count} (${preyName})`);
        loot = await resolveLoot(base, {
          nat20: Boolean(check?.isCritical),
          label: `Carving Knife — Loot ${i}/${count}`,
        });
      }
      rows.push({
        index: i,
        kind: "slay",
        checkTotal: check?.total ?? null,
        checkSuccess: success,
        loot,
        note: success
          ? (check?.isCritical ? "Success (nat 20)" : "Success")
          : "Fail → loot 1",
      });
    }
  }

  const modeLabel = mode === "capture" ? "Capture" : "Slay (Carve)";
  const rowHtml = rows
    .map((r) => {
      const checkCell = r.checkTotal == null
        ? "—"
        : `${r.checkTotal} vs DC ${dc} ${r.checkSuccess ? "✓" : "✗"}`;
      const lootCell = r.loot == null ? "—" : `<strong>${r.loot}</strong>`;
      return `<tr>
        <td style="text-align:center">${r.index}</td>
        <td>${esc(checkCell)}</td>
        <td style="text-align:center">${lootCell}</td>
        <td>${esc(r.note)}</td>
      </tr>`;
    })
    .join("");

  const successCount = rows.filter((r) => r.loot != null && (mode === "capture" || r.checkSuccess)).length;
  const lootList = rows
    .filter((r) => r.loot != null)
    .map((r) => r.loot)
    .join(", ");

  const html = `
    <div class="dnd5e2">
      <p><strong>${esc(hunter.name)}</strong> carved <strong>${esc(preyName)}</strong>
      with a <em>Carving Knife</em> — <strong>${esc(modeLabel)}</strong>
      (DC ${dc}, ${count} roll${count === 1 ? "" : "s"}).</p>
      <table class="dnd5e" style="width:100%;margin:.4rem 0">
        <thead>
          <tr>
            <th>#</th>
            <th>Survival</th>
            <th>Loot d20</th>
            <th>Note</th>
          </tr>
        </thead>
        <tbody>${rowHtml}</tbody>
      </table>
      <p style="margin:.35rem 0 0">
        Materials obtained (compare each d20 to the creature's loot table):
        <strong>${esc(lootList || "—")}</strong>
        ${mode === "slay" ? ` · ${successCount}/${count} successful carve${successCount === 1 ? "" : "s"}` : ""}.
      </p>
      <p class="hint" style="opacity:.75;margin:.25rem 0 0">
        Runes are not auto-granted — look up results on the Monster Hunter loot table.
      </p>
    </div>
  `;

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: hunter }),
    content: html,
  });
})();
