// Shared player cooking flow for Felyne Cook (token double-click / Ask / handoff).
// Expects either:
//   - call runFelyneCookingFlow({ cookActor, caller, ... })
//   - or cookActor + caller already in scope (legacy Ask / handoff macros)
// Optional in scope / opts:
//   HANDOFF_MACRO_ID (string, may be "")
//   CHARGE_FOR_MEAL (boolean) — when true, Rank 1 meals cost MEAL_PRICE_GP
//   MEAL_PRICE_GP (number, default 2)

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

const ABILITIES = [
  { id: "str", label: "Strength" },
  { id: "dex", label: "Dexterity" },
  { id: "con", label: "Constitution" },
  { id: "int", label: "Intelligence" },
  { id: "wis", label: "Wisdom" },
  { id: "cha", label: "Charisma" },
];

const STEP_LABELS = [
  "Decide the recipe",
  "Gather ingredients",
  "Prepare ingredients",
  "Cook the meal",
  "Plate the meal",
];

const felynePick = (lines) => lines[Math.floor(Math.random() * lines.length)];

const FELYNE = {
  greetMenu: [
    "Welcome, buddy-pal! What's it gonna be today, nya?",
    "Hehe, the grill is hot and ready~! Pick something tasty, meowster!",
    "Ohhh a hungry hunter! Leave the cookin' to this Felyne, nya!",
    "Come closer, partner! Today's menu smells purrfect!",
  ],
  confirmPay: (name, price) => [
    `Alrighty! One ${name} comin' right up — that'll be ${price} gp, nya!`,
    `${price} gp for a fresh ${name}, buddy-pal. Sound good, meow?`,
    `Hehe~ a ${name} for ${price} gp! Dig deep in those pouches, partner!`,
  ],
  noGold: (price, have) => [
    `Nyooo… you only got ${have} gp, buddy-pal. I need ${price} gp for a Rank 1 meal!`,
    `Can't cook on empty purses, meowster! Need ${price} gp (you have ${have}).`,
    `Aww… not enough zenny-gp! Bring ${price} gp next time, partner!`,
  ],
  paid: (price) => [
    `Clink-clink~! ${price} gp received, nya! Time to get grill-cooking!`,
    `Thanks a bunch, buddy-pal! Pocketed ${price} gp — let's cook!`,
    `Purrfect payment! ${price} gp in the tip jar, meow!`,
  ],
  checks: [
    "Okay! Three cookin' steps — match 'em with three different abilities, nya!",
    "Assign your abilities wisely, meowster. Cooking is an art!",
    "Hehe, don't burn the pot! Pick different ability scores for each step!",
  ],
  delicious: [
    "Mmmrrrow~! Smell that? Absolute purrfection!",
    "Yes yes yes! A delicious success, buddy-pal!",
    "The hunters will love this one, nyaaa!",
  ],
  bland: [
    "Eh… it's edible? Kinda? Counts as a ration, but no tasty boon, nya…",
    "Oopsie. Bland batch. At least nobody goes hungry… probably.",
  ],
  ruined: [
    "NYAA?! Smoke everywhere! This one's ruined, partner!",
    "Aaagh— too much spice, too little care! Ruined meal, meow!",
  ],
  daily: [
    "Ooooh, and a Daily Skill bubbled up from the stew, nya!",
    "Lucky huntin'! Extra Daily Skill for the table!",
  ],
};

const COOK_STYLES = `
<style>
  .amw-fc-dialog {
    --amw-fc-bg0: #1a1410;
    --amw-fc-bg1: #2a2118;
    --amw-fc-panel: rgba(12, 9, 7, 0.72);
    --amw-fc-ink: #f3e6d0;
    --amw-fc-muted: #c4b094;
    --amw-fc-gold: #e0a84a;
    --amw-fc-gold-dim: #a7782f;
    --amw-fc-danger: #c45a4a;
    --amw-fc-ok: #6f9f55;
  }
  .amw-fc-dialog .window-header {
    background: linear-gradient(90deg, #3a2a18 0%, #221810 60%, #1a1410 100%);
    border-bottom: 1px solid var(--amw-fc-gold-dim);
  }
  .amw-fc-dialog .window-header .window-title {
    color: var(--amw-fc-gold);
    font-weight: 700;
    letter-spacing: 0.02em;
    text-transform: uppercase;
    font-size: 13px;
  }
  .amw-fc-dialog .window-content {
    background:
      radial-gradient(120% 80% at 10% 0%, rgba(224,168,74,0.12), transparent 55%),
      linear-gradient(180deg, var(--amw-fc-bg1) 0%, var(--amw-fc-bg0) 100%);
    color: var(--amw-fc-ink);
    padding: 12px;
  }
  .amw-fc-dialog .dialog-buttons {
    border-top: 1px solid rgba(224,168,74,0.25);
    padding-top: 10px;
    gap: 8px;
  }
  .amw-fc-dialog .dialog-buttons button {
    background: linear-gradient(180deg, #4a3824 0%, #2c2014 100%);
    border: 1px solid var(--amw-fc-gold-dim);
    color: var(--amw-fc-ink);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    border-radius: 4px;
  }
  .amw-fc-dialog .dialog-buttons button:hover:not(:disabled) {
    background: linear-gradient(180deg, #6a4f2c 0%, #3a2a18 100%);
    border-color: var(--amw-fc-gold);
    color: #fff8ea;
  }
  .amw-fc-dialog .dialog-buttons button[data-button="ok"] {
    border-color: var(--amw-fc-gold);
    color: #fff4dc;
    box-shadow: inset 0 0 0 1px rgba(224,168,74,0.2);
  }
  .amw-fc-dialog .dialog-buttons button:disabled,
  .amw-fc-dialog .dialog-buttons button.disabled {
    opacity: 0.4;
    cursor: not-allowed;
    filter: grayscale(0.7);
    box-shadow: none;
  }

  .amw-fc {
    display:flex; flex-direction:column; gap:12px;
    color: var(--amw-fc-ink);
    font-family: "Signika", "Palatino Linotype", serif;
  }
  .amw-fc * { color: inherit; }
  .amw-fc-banner {
    display:flex; gap:12px; align-items:flex-start;
    padding:12px 14px; border-radius:6px;
    background: linear-gradient(135deg, rgba(224,168,74,0.16), rgba(20,14,10,0.65));
    border: 1px solid rgba(224,168,74,0.45);
    box-shadow: inset 0 0 0 1px rgba(0,0,0,0.35);
  }
  .amw-fc-banner img {
    width:52px; height:52px; border-radius:6px; object-fit:contain;
    background: rgba(0,0,0,0.35);
    border: 1px solid rgba(224,168,74,0.35);
    flex:0 0 auto;
  }
  .amw-fc-banner h3 {
    margin:0 0 4px; font-size:1.15rem; color: var(--amw-fc-gold);
    text-transform: uppercase; letter-spacing: 0.04em;
  }
  .amw-fc-banner p { margin:0; color: var(--amw-fc-muted); font-size:12px; line-height:1.4; }
  .amw-fc-meta {
    display:flex; flex-wrap:wrap; gap:6px;
    font-size:11px; text-transform: uppercase; letter-spacing: 0.04em;
  }
  .amw-fc-chip {
    display:inline-flex; align-items:center; gap:4px;
    padding:4px 8px; border-radius:999px;
    background: rgba(0,0,0,0.35);
    border: 1px solid rgba(224,168,74,0.28);
    color: var(--amw-fc-muted);
  }
  .amw-fc-chip strong { color: var(--amw-fc-ink); font-weight:700; }
  .amw-fc-chip.is-warn {
    border-color: rgba(196,90,74,0.55);
    color: #f0b4aa;
  }
  .amw-fc-chip.is-warn strong { color: #ffd2cb; }
  .amw-fc-section-label {
    display:block; margin:0 0 6px;
    font-weight:700; font-size:11px; color: var(--amw-fc-gold);
    text-transform: uppercase; letter-spacing: 0.08em;
  }
  .amw-fc-meals {
    display:grid; grid-template-columns:1fr; gap:6px;
    max-height:230px; overflow:auto; padding:2px;
  }
  .amw-fc-meal {
    display:grid; grid-template-columns:40px 1fr auto; gap:10px; align-items:center;
    text-align:left; width:100%; cursor:pointer;
    padding:9px 11px; border-radius:5px;
    border:1px solid rgba(224,168,74,0.22);
    background: var(--amw-fc-panel);
    color: var(--amw-fc-ink);
  }
  .amw-fc-meal:hover {
    border-color: rgba(224,168,74,0.65);
    background: rgba(224,168,74,0.1);
  }
  .amw-fc-meal.is-selected {
    border-color: var(--amw-fc-gold);
    box-shadow: inset 0 0 0 1px rgba(224,168,74,0.35), 0 0 12px rgba(224,168,74,0.12);
    background: linear-gradient(90deg, rgba(224,168,74,0.18), rgba(20,14,10,0.55));
  }
  .amw-fc-meal img {
    width:36px; height:36px; object-fit:contain; border-radius:4px;
    background: rgba(0,0,0,0.3);
    border: 1px solid rgba(224,168,74,0.2);
  }
  .amw-fc-meal .amw-fc-meal-name {
    font-weight:700; display:block; color: #fff6e4; font-size:13px;
  }
  .amw-fc-meal .amw-fc-meal-sub { font-size:11px; color: var(--amw-fc-muted); }
  .amw-fc-meal .amw-fc-dc {
    font-size:11px; font-weight:700; color: var(--amw-fc-gold);
    padding:3px 8px; border-radius:999px;
    border:1px solid rgba(224,168,74,0.45);
    background: rgba(0,0,0,0.35);
  }
  .amw-fc-boon {
    padding:10px 12px; border-radius:5px;
    border:1px solid rgba(224,168,74,0.28);
    background: rgba(0,0,0,0.35);
    min-height:64px; font-size:13px; color: var(--amw-fc-ink);
  }
  .amw-fc-boon, .amw-fc-boon * { color: var(--amw-fc-ink) !important; }
  .amw-fc-boon > :first-child { margin-top:0; }
  .amw-fc-boon > :last-child { margin-bottom:0; }
  .amw-fc-step {
    margin:0; padding:10px 12px; border-radius:5px;
    border:1px solid rgba(224,168,74,0.25);
    background: var(--amw-fc-panel);
  }
  .amw-fc-step legend {
    padding:0 6px; font-weight:700; font-size:11px;
    color: var(--amw-fc-gold); text-transform: uppercase; letter-spacing: 0.06em;
  }
  .amw-fc-step p { margin:0 0 8px; font-size:12px; color: var(--amw-fc-muted); }
  .amw-fc-step .form-group label,
  .amw-fc .form-group label {
    color: var(--amw-fc-muted); font-size:11px; text-transform: uppercase;
  }
  .amw-fc-step select,
  .amw-fc select {
    background: #14100c; color: var(--amw-fc-ink);
    border: 1px solid rgba(224,168,74,0.35);
  }
  .amw-fc-hint { margin:0; font-size:11px; color: var(--amw-fc-muted); }
  .amw-fc-funds {
    display:flex; justify-content:space-between; gap:8px; align-items:center;
    padding:8px 10px; border-radius:5px;
    background: rgba(0,0,0,0.28);
    border: 1px dashed rgba(224,168,74,0.3);
    font-size:12px;
  }
  .amw-fc-funds.is-broke {
    border-color: rgba(196,90,74,0.55);
    background: rgba(80,24,18,0.35);
  }
</style>
`;

const dialogForm = (title, content, okLabel = "Continue", {
  width = 540,
  render,
  disableOk = false,
  classes = ["amw-fc-dialog"],
} = {}) => new Promise((resolve) => {
  let settled = false;
  const finish = (value) => {
    if (settled) return;
    settled = true;
    resolve(value);
  };
  new Dialog({
    title,
    content,
    buttons: {
      ok: {
        icon: '<i class="fas fa-check"></i>',
        label: okLabel,
        callback: (html) => {
          const app = html?.[0]?.closest?.(".app") ?? html?.closest?.(".app");
          const okBtn = app?.querySelector?.('button[data-button="ok"]');
          if (okBtn?.disabled) return finish(null);
          finish(html[0].querySelector("form"));
        },
      },
      cancel: {
        icon: '<i class="fas fa-times"></i>',
        label: "Cancel",
        callback: () => finish(null),
      },
    },
    default: "ok",
    close: () => finish(null),
    render: (html) => {
      const root = html instanceof jQuery ? html[0] : html;
      const app = root?.closest?.(".app");
      const okBtn = app?.querySelector?.('button[data-button="ok"]');
      if (okBtn) {
        okBtn.disabled = Boolean(disableOk);
        okBtn.classList.toggle("disabled", Boolean(disableOk));
      }
      if (typeof render === "function") render(html, { okBtn, app, root });
    },
  }, { width, classes }).render(true);
});

const currencyToCopper = (currency = {}) => {
  const pp = Number(currency.pp) || 0;
  const gp = Number(currency.gp) || 0;
  const ep = Number(currency.ep) || 0;
  const sp = Number(currency.sp) || 0;
  const cp = Number(currency.cp) || 0;
  return (pp * 1000) + (gp * 100) + (ep * 50) + (sp * 10) + cp;
};

const copperToCurrency = (totalCp) => {
  let n = Math.max(0, Math.floor(Number(totalCp) || 0));
  const pp = Math.floor(n / 1000);
  n %= 1000;
  const gp = Math.floor(n / 100);
  n %= 100;
  const ep = Math.floor(n / 50);
  n %= 50;
  const sp = Math.floor(n / 10);
  n %= 10;
  return { pp, gp, ep, sp, cp: n };
};

const formatGpAmount = (gp) => {
  const n = Number(gp) || 0;
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
};

const trySpendGold = async (payer, gpAmount) => {
  const needCp = Math.round(gpAmount * 100);
  const current = foundry.utils.deepClone(payer.system?.currency ?? {});
  const totalCp = currencyToCopper(current);
  if (totalCp < needCp) {
    return { ok: false, haveGp: totalCp / 100 };
  }

  const next = foundry.utils.deepClone(current);
  const haveGp = Number(next.gp) || 0;
  if (haveGp >= gpAmount) {
    next.gp = haveGp - gpAmount;
  } else {
    Object.assign(next, copperToCurrency(totalCp - needCp));
  }

  await payer.update({ "system.currency": next });
  return { ok: true, haveGp: totalCp / 100 };
};

const tryCreditCook = async (cook, gpAmount) => {
  try {
    if (!(cook.isOwner || game.user.isGM)) return false;
    const current = foundry.utils.deepClone(cook.system?.currency ?? {});
    current.gp = (Number(current.gp) || 0) + gpAmount;
    await cook.update({ "system.currency": current });
    return true;
  } catch (_err) {
    return false;
  }
};

const getMealTemplates = (cookActor) => cookActor.items.filter((i) => {
  const cooking = foundry.utils.getProperty(i, "flags.world.cooking") ?? {};
  return Number(cooking.rank) === 1 && Boolean(cooking.mealKey);
}).sort((a, b) => a.name.localeCompare(b.name));

const getDailyTemplates = (cookActor) => {
  const map = new Map();
  for (const i of cookActor.items) {
    const cooking = foundry.utils.getProperty(i, "flags.world.cooking") ?? {};
    if (cooking.dailySkill && Number.isFinite(Number(cooking.index))) {
      map.set(Number(cooking.index), i);
    }
  }
  return map;
};

const getMealBoonHtml = (meal) => {
  const chat = String(meal?.system?.description?.chat ?? "").trim();
  const value = String(meal?.system?.description?.value ?? "").trim();
  if (chat) return chat;
  if (!value) return "<p><em>No description available.</em></p>";
  return value;
};

const cloneFeatToActor = async (templateItem, targetActor) => {
  const data = templateItem.toObject();
  delete data._id;
  foundry.utils.setProperty(data, "flags.world.cooking.isTemplate", false);
  data.effects = (data.effects ?? []).map((ef) => {
    const next = foundry.utils.deepClone(ef);
    delete next._id;
    next.disabled = false;
    next.transfer = true;
    next.origin = targetActor.uuid;
    return next;
  });
  const created = await targetActor.createEmbeddedDocuments("Item", [data]);
  return created?.[0] ?? null;
};

const removePriorMeals = async (targetActor) => {
  const stale = targetActor.items.filter((i) => {
    const cooking = foundry.utils.getProperty(i, "flags.world.cooking") ?? {};
    return Boolean(cooking.mealKey) && cooking.isTemplate !== true;
  });
  if (!stale.length) return;
  await targetActor.deleteEmbeddedDocuments("Item", stale.map((i) => i.id));
};

const rollAbilityCheck = async (caller, abilityId, { addProf = false, flavor = "" } = {}) => {
  const abl = caller.system?.abilities?.[abilityId];
  const mod = Number(abl?.mod ?? 0);
  const prof = Number(caller.system?.attributes?.prof ?? 0);
  const parts = ["1d20", String(mod)];
  if (addProf) parts.push(String(prof));
  const roll = await new Roll(parts.join(" + ")).evaluate();
  await roll.toMessage({
    speaker: ChatMessage.getSpeaker({ actor: caller }),
    flavor: flavor || `${CONFIG.DND5E?.abilities?.[abilityId]?.label ?? abilityId} check`,
  });
  return Number(roll.total ?? 0);
};

/** @returns {{ index: number, d20: number, d6: number, total: number, formula: string }} */
const rollDailySkillIndex = async (caller) => {
  const roll = await new Roll("1d20 + 1d6 - 1").evaluate();
  const dice = roll.dice ?? [];
  const d20 = Number(dice[0]?.results?.[0]?.result ?? dice[0]?.total ?? 0);
  const d6 = Number(dice[1]?.results?.[0]?.result ?? dice[1]?.total ?? 0);
  const total = Number(roll.total ?? 1);
  const index = Math.min(25, Math.max(1, total));

  await roll.toMessage({
    speaker: ChatMessage.getSpeaker({ actor: caller }),
    flavor: `Daily Skill table — d20(${d20}) + d6(${d6}) − 1 = ${total} → row #${index}`,
  });

  return {
    index,
    d20,
    d6,
    total,
    formula: "1d20 + 1d6 − 1",
  };
};

const formatDailyRollLine = (rollInfo, skillLabel) => {
  const { d20, d6, total, index } = rollInfo;
  return `d20(${d20}) + d6(${d6}) − 1 = <strong>${total}</strong> → row #${index}: ${esc(skillLabel)}`;
};

const pickNpcSteps = () => {
  const pool = STEP_LABELS.slice();
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, 3);
};

const runFelyneCookingFlow = async ({
  cookActor,
  caller,
  chargeForMeal = false,
  mealPriceGp = 2,
  handoffMacroId = "",
} = {}) => {
  if (!cookActor || !caller) {
    ui.notifications.warn("Felyne Cook: cook or hunter missing.");
    return false;
  }

  const meals = getMealTemplates(cookActor);
  if (!meals.length) {
    ui.notifications.error("Felyne Cook: no Rank 1 meals loaded on this NPC.");
    return false;
  }

  const price = Number(mealPriceGp) || 2;
  const charge = Boolean(chargeForMeal);
  const cookImg = cookActor.img || "icons/svg/cowled.svg";
  const greet = felynePick(FELYNE.greetMenu);
  const purseCp = currencyToCopper(caller.system?.currency ?? {});
  const purseGp = purseCp / 100;
  const canAfford = !charge || purseCp >= Math.round(price * 100);
  const orderLabel = charge
    ? (canAfford ? `Order meal — ${price} gp` : `Need ${price} gp`)
    : "Choose abilities";

  const mealCards = meals.map((m, idx) => {
    const dc = Number(foundry.utils.getProperty(m, "flags.world.cooking.dc") ?? 10);
    const img = m.img || cookImg;
    return `
      <button type="button" class="amw-fc-meal${idx === 0 ? " is-selected" : ""}" data-meal-id="${esc(m.id)}">
        <img src="${esc(img)}" alt="" />
        <span>
          <span class="amw-fc-meal-name">${esc(m.name)}</span>
          <span class="amw-fc-meal-sub">Rank 1 · 1 serving</span>
        </span>
        <span class="amw-fc-dc">DC ${esc(dc)}</span>
      </button>
    `;
  }).join("");

  const mealForm = await dialogForm(
    `${cookActor.name} — Camp Kitchen`,
    `${COOK_STYLES}
    <form class="amw-fc">
      <div class="amw-fc-banner">
        <img src="${esc(cookImg)}" alt="" />
        <div>
          <h3>${esc(cookActor.name)}</h3>
          <p><em>${esc(greet)}</em></p>
        </div>
      </div>
      <div class="amw-fc-meta">
        <span class="amw-fc-chip">Hunter <strong>${esc(caller.name)}</strong></span>
        <span class="amw-fc-chip">Range <strong>10 ft</strong></span>
        ${charge
    ? `<span class="amw-fc-chip">Rank 1 <strong>${esc(price)} gp</strong></span>`
    : `<span class="amw-fc-chip"><strong>Complimentary</strong></span>`}
      </div>
      ${charge ? `
      <div class="amw-fc-funds${canAfford ? "" : " is-broke"}">
        <span>Your pouch: <strong>${esc(formatGpAmount(purseGp))} gp</strong></span>
        <span>${canAfford
    ? `Ready to pay <strong>${esc(price)} gp</strong>`
    : `<strong>Not enough zenny</strong> — need ${esc(price)} gp`}</span>
      </div>` : ""}
      <div>
        <span class="amw-fc-section-label">Today's menu</span>
        <div class="amw-fc-meals" data-meal-list>${mealCards}</div>
        <input type="hidden" name="meal" value="${esc(meals[0].id)}" />
      </div>
      <div>
        <span class="amw-fc-section-label">Boon</span>
        <div class="amw-fc-boon meal-desc"></div>
      </div>
      <p class="amw-fc-hint">Tip: double-click a dish to confirm instantly.</p>
    </form>`,
    orderLabel,
    {
      width: 560,
      disableOk: charge && !canAfford,
      render: (html, ctx = {}) => {
        const root = html instanceof jQuery ? html[0] : html;
        const hidden = root.querySelector('input[name="meal"]');
        const desc = root.querySelector(".meal-desc");
        const buttons = [...root.querySelectorAll(".amw-fc-meal")];
        const okBtn = ctx.okBtn ?? root.closest(".app")?.querySelector?.('button[data-button="ok"]');

        const selectMeal = (id) => {
          if (hidden) hidden.value = id;
          for (const btn of buttons) {
            btn.classList.toggle("is-selected", btn.dataset.mealId === id);
          }
          const meal = meals.find((m) => m.id === id);
          if (desc) desc.innerHTML = meal ? getMealBoonHtml(meal) : "";
        };

        for (const btn of buttons) {
          btn.addEventListener("click", (ev) => {
            ev.preventDefault();
            selectMeal(btn.dataset.mealId);
          });
          btn.addEventListener("dblclick", (ev) => {
            ev.preventDefault();
            if (okBtn?.disabled) return;
            selectMeal(btn.dataset.mealId);
            okBtn?.click?.();
          });
        }
        selectMeal(hidden?.value || meals[0].id);
      },
    },
  );
  if (!mealForm) return false;

  const mealItem = meals.find((m) => m.id === mealForm.meal.value);
  if (!mealItem) {
    ui.notifications.warn("Felyne Cook: meal not found.");
    return false;
  }

  if (charge) {
    // Re-check funds at confirm time (pouch may have changed while the dialog was open).
    const spent = await trySpendGold(caller, price);
    if (!spent.ok) {
      const have = formatGpAmount(spent.haveGp);
      const line = felynePick(FELYNE.noGold(price, have));
      ui.notifications.warn(line);
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: cookActor }),
        content: `
          <div class="dnd5e2">
            <h3>${esc(cookActor.name)}</h3>
            <p><em>${esc(line)}</em></p>
          </div>
        `,
      });
      return false;
    }

    const credited = await tryCreditCook(cookActor, price);
    const paidLine = felynePick(FELYNE.paid(price));
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: cookActor }),
      content: `
        <div class="dnd5e2">
          <h3>${esc(cookActor.name)} — Payment</h3>
          <p><em>${esc(paidLine)}</em></p>
          <p><strong>${esc(caller.name)}</strong> ordered <strong>${esc(mealItem.name)}</strong> for <strong>${price} gp</strong>${credited ? " (added to the cook's pouch)" : " (GM: credit the cook if desired)"}.</p>
        </div>
      `,
    });
  }

  const servings = 1;
  const baseDc = Number(foundry.utils.getProperty(mealItem, "flags.world.cooking.dc") ?? 10);
  const dc = baseDc;

  const abilityOptions = (selectedId) => ABILITIES.map((a) => (
    `<option value="${a.id}"${a.id === selectedId ? " selected" : ""}>${esc(a.label)}</option>`
  )).join("");

  const npcSteps = pickNpcSteps();
  const defaultAbilities = ["int", "wis", "dex"];

  const checkForm = await dialogForm(
    `${cookActor.name} — Cooking checks`,
    `${COOK_STYLES}
    <form class="amw-fc">
      <div class="amw-fc-banner">
        <img src="${esc(mealItem.img || cookImg)}" alt="" />
        <div>
          <h3>${esc(mealItem.name)}</h3>
          <p><em>${esc(felynePick(FELYNE.checks))}</em></p>
        </div>
      </div>
      <div class="amw-fc-meta">
        <span class="amw-fc-chip">DC <strong>${esc(dc)}</strong></span>
        <span class="amw-fc-chip">Servings <strong>${esc(servings)}</strong></span>
        <span class="amw-fc-chip">Use <strong>3 different</strong> abilities</span>
      </div>
      ${[1, 2, 3].map((n) => `
        <fieldset class="amw-fc-step">
          <legend>Check ${n}</legend>
          <p><strong>Step:</strong> ${esc(npcSteps[n - 1])}</p>
          <input type="hidden" name="step${n}" value="${esc(npcSteps[n - 1])}"/>
          <div class="form-group" style="margin:0;">
            <label>Ability</label>
            <select name="ability${n}">${abilityOptions(defaultAbilities[n - 1])}</select>
          </div>
        </fieldset>
      `).join("")}
      <div class="form-group" style="margin:0;">
        <label>Cook's utensils proficiency</label>
        <select name="profOn">
          <option value="">None</option>
          <option value="1">Add PB to check 1</option>
          <option value="2">Add PB to check 2</option>
          <option value="3">Add PB to check 3</option>
        </select>
      </div>
      <p class="amw-fc-hint">If proficient with cook's utensils, add your proficiency bonus to one check.</p>
    </form>`,
    "Roll checks",
    { width: 540 },
  );
  if (!checkForm) return false;

  const picks = [1, 2, 3].map((n) => ({
    step: String(checkForm[`step${n}`].value || npcSteps[n - 1]),
    ability: String(checkForm[`ability${n}`].value || "int"),
  }));

  if (new Set(picks.map((p) => p.ability)).size !== 3) {
    ui.notifications.warn("Felyne Cook: you must use three different ability scores, nya!");
    return false;
  }

  const profOn = Number(checkForm.profOn.value || 0);
  const totals = [];
  for (let i = 0; i < 3; i += 1) {
    const pick = picks[i];
    const addProf = profOn === i + 1;
    const ablLabel = CONFIG.DND5E?.abilities?.[pick.ability]?.label ?? pick.ability.toUpperCase();
    totals.push(await rollAbilityCheck(caller, pick.ability, {
      addProf,
      flavor: `Artisan Cooking — ${pick.step} (${ablLabel}${addProf ? " + proficiency" : ""})`,
    }));
  }

  const average = Math.floor(totals.reduce((a, b) => a + b, 0) / 3);
  const margin = average - dc;
  const success = average >= dc;

  let resultTitle = "Bland meal";
  let resultFlavor = felynePick(FELYNE.bland);
  let resultBody = "<p>The dish counts as a day's ration but grants <strong>no meal boon</strong>.</p>";
  const grantedNames = [];
  const canModifyCaller = caller.isOwner || game.user.isGM;
  /** @type {string[]} */
  const dailyDetailLines = [];

  if (success) {
    resultTitle = "Delicious success";
    resultFlavor = felynePick(FELYNE.delicious);
    if (!canModifyCaller) {
      resultBody = `<p><strong>${esc(caller.name)}</strong> cooked <strong>${esc(mealItem.name)}</strong>, but this client cannot grant items. Ask the GM to apply the meal feature.</p>`;
    } else {
      await removePriorMeals(caller);
      const mealGranted = await cloneFeatToActor(mealItem, caller);
      if (mealGranted) grantedNames.push(mealGranted.name);
      resultBody = `<p><strong>${esc(caller.name)}</strong> gains <strong>${esc(mealItem.name)}</strong>.</p>`;

      const dailyRolls = margin >= 8 ? 2 : margin >= 4 ? 1 : 0;
      if (dailyRolls > 0) {
        resultFlavor = `${resultFlavor} ${felynePick(FELYNE.daily)}`;
        const dailyMap = getDailyTemplates(cookActor);
        for (let i = 0; i < dailyRolls; i += 1) {
          const rollInfo = await rollDailySkillIndex(caller);
          const template = dailyMap.get(rollInfo.index);
          if (!template) {
            dailyDetailLines.push(formatDailyRollLine(rollInfo, `(missing template on cook)`));
            continue;
          }
          const already = caller.items.find((it) => {
            const key = foundry.utils.getProperty(it, "flags.world.cooking.skillKey");
            return key && key === foundry.utils.getProperty(template, "flags.world.cooking.skillKey");
          });
          if (already) {
            dailyDetailLines.push(formatDailyRollLine(rollInfo, `${template.name} (already known)`));
            continue;
          }
          const created = await cloneFeatToActor(template, caller);
          if (created) {
            grantedNames.push(created.name);
            dailyDetailLines.push(formatDailyRollLine(rollInfo, created.name));
          } else {
            dailyDetailLines.push(formatDailyRollLine(rollInfo, `${template.name} (grant failed)`));
          }
        }
        resultBody += `
          <p><strong>Daily Skill${dailyRolls > 1 ? "s" : ""}</strong> <em>(${felynePick(["lucky rollin', nya!", "extra helpin' from the pot!"])})</em>:</p>
          <ul>${dailyDetailLines.map((line) => `<li>${line}</li>`).join("")}</ul>
        `;
      }
    }
  } else if (margin <= -5) {
    resultTitle = "Ruined meal";
    resultFlavor = felynePick(FELYNE.ruined);
    resultBody = `<p>The meal does <strong>not</strong> count as a ration. ${esc(caller.name)} must succeed on a Constitution saving throw (DC ${dc}) or become poisoned for 1 hour.</p>`;
    if (typeof caller.rollSavingThrow === "function") {
      await caller.rollSavingThrow({ ability: "con", targetValue: dc });
    } else {
      await rollAbilityCheck(caller, "con", { flavor: `Constitution saving throw (DC ${dc}) vs ruined meal` });
    }
  }

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: cookActor }),
    content: `
      <div class="dnd5e2">
        <h3>${esc(cookActor.name)} — Artisan Cooking (Rank 1)</h3>
        <p><em>${esc(resultFlavor)}</em></p>
        <p><strong>Cook:</strong> ${esc(caller.name)} &nbsp;|&nbsp; <strong>Meal:</strong> ${esc(mealItem.name)}${charge ? ` &nbsp;|&nbsp; <strong>Paid:</strong> ${price} gp` : ""}</p>
        <p><strong>Checks:</strong> ${totals.join(" / ")} &nbsp;|&nbsp; <strong>Average:</strong> ${average} vs DC ${dc} (${margin >= 0 ? "+" : ""}${margin})</p>
        <p><strong>${esc(resultTitle)}</strong></p>
        ${resultBody}
        ${grantedNames.length ? `<p><em>Granted:</em> ${grantedNames.map(esc).join(", ")}</p>` : ""}
      </div>
    `,
  });

  const macroId = typeof handoffMacroId === "string" ? handoffMacroId : "";
  if (macroId && game.user.isGM) {
    const handoff = game.macros.get(macroId);
    if (handoff) await handoff.delete().catch(() => null);
  }

  return true;
};

globalThis.__amellwindFelyneCook = globalThis.__amellwindFelyneCook || {};
globalThis.__amellwindFelyneCook.runCookingFlow = runFelyneCookingFlow;

// Legacy Ask / handoff macros: variables already in scope.
if (typeof cookActor !== "undefined" && cookActor && typeof caller !== "undefined" && caller) {
  await runFelyneCookingFlow({
    cookActor,
    caller,
    chargeForMeal: Boolean(typeof CHARGE_FOR_MEAL !== "undefined" && CHARGE_FOR_MEAL),
    mealPriceGp: Number(typeof MEAL_PRICE_GP !== "undefined" ? MEAL_PRICE_GP : 2) || 2,
    handoffMacroId: typeof HANDOFF_MACRO_ID === "string" ? HANDOFF_MACRO_ID : "",
  });
}
