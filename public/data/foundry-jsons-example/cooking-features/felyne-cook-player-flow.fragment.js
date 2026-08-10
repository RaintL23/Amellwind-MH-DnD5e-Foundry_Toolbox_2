// Shared player cooking flow for Felyne Cook handoff / Ask feature.
// Expects in scope: cookActor, caller
// Optional in scope:
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

const dialogForm = (title, content, okLabel = "Continue", { width = 460, render } = {}) => new Promise((resolve) => {
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
        callback: (html) => finish(html[0].querySelector("form")),
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
      if (typeof render === "function") render(html);
    },
  }, { width }).render(true);
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

const getMealTemplates = () => cookActor.items.filter((i) => {
  const cooking = foundry.utils.getProperty(i, "flags.world.cooking") ?? {};
  return Number(cooking.rank) === 1 && Boolean(cooking.mealKey);
}).sort((a, b) => a.name.localeCompare(b.name));

const getDailyTemplates = () => {
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

const rollAbilityCheck = async (abilityId, { addProf = false, flavor = "" } = {}) => {
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
const rollDailySkillIndex = async () => {
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

const meals = getMealTemplates();
if (!meals.length) {
  ui.notifications.error("Felyne Cook: no Rank 1 meals loaded on this NPC.");
  return;
}

const mealPriceGp = Number(typeof MEAL_PRICE_GP !== "undefined" ? MEAL_PRICE_GP : 2) || 2;
const chargeForMeal = Boolean(typeof CHARGE_FOR_MEAL !== "undefined" && CHARGE_FOR_MEAL);

const mealOptions = meals.map((m) => {
  const dc = Number(foundry.utils.getProperty(m, "flags.world.cooking.dc") ?? 10);
  return `<option value="${esc(m.id)}">${esc(m.name)} (DC ${dc})</option>`;
}).join("");

const mealForm = await dialogForm(
  `${cookActor.name} — Pick a dish, nya!`,
  `<form class="flexcol">
    <p><em>${esc(felynePick(FELYNE.greetMenu))}</em></p>
    <p><strong>${esc(cookActor.name)}</strong> can whip up one Rank 1 serving for <strong>${esc(caller.name)}</strong>.</p>
    ${chargeForMeal ? `<p><strong>Price:</strong> ${mealPriceGp} gp (Rank 1 meal)</p>` : ""}
    <div class="form-group">
      <label>Meal</label>
      <select name="meal">${mealOptions}</select>
    </div>
    <div class="form-group meal-desc-box" style="margin-top:0.35rem;padding:0.5rem;border:1px solid var(--color-border-light-tertiary, #666);border-radius:4px;">
      <label style="font-weight:bold;">Boon</label>
      <div class="meal-desc"></div>
    </div>
    <p class="hint"><em>Servings: 1</em> (just for you, buddy-pal!)</p>
  </form>`,
  chargeForMeal ? "Order (pay next)" : "Choose abilities",
  {
    width: 520,
    render: (html) => {
      const root = html instanceof jQuery ? html[0] : html;
      const select = root.querySelector('select[name="meal"]');
      const desc = root.querySelector(".meal-desc");
      const update = () => {
        const meal = meals.find((m) => m.id === select?.value);
        if (desc) desc.innerHTML = meal ? getMealBoonHtml(meal) : "";
      };
      select?.addEventListener("change", update);
      update();
    },
  },
);
if (!mealForm) return;

const mealItem = meals.find((m) => m.id === mealForm.meal.value);
if (!mealItem) {
  ui.notifications.warn("Felyne Cook: meal not found.");
  return;
}

if (chargeForMeal) {
  const payLine = felynePick(FELYNE.confirmPay(mealItem.name, mealPriceGp));
  const payForm = await dialogForm(
    `${cookActor.name} — That'll be ${mealPriceGp} gp, nya!`,
    `<form class="flexcol">
      <p><em>${esc(payLine)}</em></p>
      <p>Pay <strong>${mealPriceGp} gp</strong> from <strong>${esc(caller.name)}</strong>'s pouch to start cooking <strong>${esc(mealItem.name)}</strong>?</p>
    </form>`,
    `Pay ${mealPriceGp} gp`,
  );
  if (!payForm) return;

  const spent = await trySpendGold(caller, mealPriceGp);
  if (!spent.ok) {
    const have = formatGpAmount(spent.haveGp);
    const line = felynePick(FELYNE.noGold(mealPriceGp, have));
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
    return;
  }

  const credited = await tryCreditCook(cookActor, mealPriceGp);
  const paidLine = felynePick(FELYNE.paid(mealPriceGp));
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: cookActor }),
    content: `
      <div class="dnd5e2">
        <h3>${esc(cookActor.name)} — Payment</h3>
        <p><em>${esc(paidLine)}</em></p>
        <p><strong>${esc(caller.name)}</strong> paid <strong>${mealPriceGp} gp</strong>${credited ? " (added to the cook's pouch)" : " (GM: credit the cook if desired)"}.</p>
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
  `${cookActor.name} — Three cookin' checks!`,
  `<form class="flexcol">
    <p><em>${esc(felynePick(FELYNE.checks))}</em></p>
    <p>Assign a <strong>different ability score</strong> to each step. If you are proficient with cook's utensils, add your proficiency bonus to <em>one</em> check.</p>
    <p><strong>Meal:</strong> ${esc(mealItem.name)} &nbsp;|&nbsp; <strong>DC:</strong> ${dc} &nbsp;|&nbsp; <strong>Servings:</strong> ${servings}</p>
    ${[1, 2, 3].map((n) => `
      <fieldset style="margin:0.35rem 0;padding:0.5rem;">
        <legend>Check ${n}</legend>
        <p style="margin:0 0 0.35rem 0;"><strong>Step (cook):</strong> ${esc(npcSteps[n - 1])}</p>
        <input type="hidden" name="step${n}" value="${esc(npcSteps[n - 1])}"/>
        <div class="form-group">
          <label>Ability</label>
          <select name="ability${n}">${abilityOptions(defaultAbilities[n - 1])}</select>
        </div>
      </fieldset>
    `).join("")}
    <div class="form-group">
      <label>Cook's utensils proficiency</label>
      <select name="profOn">
        <option value="">None</option>
        <option value="1">Add PB to check 1</option>
        <option value="2">Add PB to check 2</option>
        <option value="3">Add PB to check 3</option>
      </select>
    </div>
  </form>`,
  "Roll checks",
);
if (!checkForm) return;

const picks = [1, 2, 3].map((n) => ({
  step: String(checkForm[`step${n}`].value || npcSteps[n - 1]),
  ability: String(checkForm[`ability${n}`].value || "int"),
}));

if (new Set(picks.map((p) => p.ability)).size !== 3) {
  ui.notifications.warn("Felyne Cook: you must use three different ability scores, nya!");
  return;
}

const profOn = Number(checkForm.profOn.value || 0);
const totals = [];
for (let i = 0; i < 3; i += 1) {
  const pick = picks[i];
  const addProf = profOn === i + 1;
  const ablLabel = CONFIG.DND5E?.abilities?.[pick.ability]?.label ?? pick.ability.toUpperCase();
  totals.push(await rollAbilityCheck(pick.ability, {
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
      const dailyMap = getDailyTemplates();
      for (let i = 0; i < dailyRolls; i += 1) {
        const rollInfo = await rollDailySkillIndex();
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
    await rollAbilityCheck("con", { flavor: `Constitution saving throw (DC ${dc}) vs ruined meal` });
  }
}

await ChatMessage.create({
  speaker: ChatMessage.getSpeaker({ actor: cookActor }),
  content: `
    <div class="dnd5e2">
      <h3>${esc(cookActor.name)} — Artisan Cooking (Rank 1)</h3>
      <p><em>${esc(resultFlavor)}</em></p>
      <p><strong>Cook:</strong> ${esc(caller.name)} &nbsp;|&nbsp; <strong>Meal:</strong> ${esc(mealItem.name)}${chargeForMeal ? ` &nbsp;|&nbsp; <strong>Paid:</strong> ${mealPriceGp} gp` : ""}</p>
      <p><strong>Checks:</strong> ${totals.join(" / ")} &nbsp;|&nbsp; <strong>Average:</strong> ${average} vs DC ${dc} (${margin >= 0 ? "+" : ""}${margin})</p>
      <p><strong>${esc(resultTitle)}</strong></p>
      ${resultBody}
      ${grantedNames.length ? `<p><em>Granted:</em> ${grantedNames.map(esc).join(", ")}</p>` : ""}
    </div>
  `,
});

if (typeof HANDOFF_MACRO_ID === "string" && HANDOFF_MACRO_ID && game.user.isGM) {
  const handoff = game.macros.get(HANDOFF_MACRO_ID);
  if (handoff) await handoff.delete().catch(() => null);
}
