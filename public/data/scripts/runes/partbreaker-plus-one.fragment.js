// Partbreaker+1 — shared combat-pass fragment for unified runes.
// Canonical source: public/data/scripts/runes/partbreaker-plus-one.fragment.js
// Wired by wrapping runeApplySide / runeCleanup (injected BEFORE on/off handlers).

const PARTBREAKER_HOOK_EVENTS = [
  "midi-qol.DamageRollComplete",
  "midi-qol.damageRollComplete",
];

function pbTypeFromSet(types) {
  if (!types) return "";
  if (typeof types === "string") return types;
  if (Array.isArray(types)) return String(types[0] ?? "");
  if (typeof types?.[Symbol.iterator] === "function") { for (const t of types) return String(t ?? ""); }
  return "";
}

function pbIsWeaponAttack(wf) {
  const itemType = String(wf?.item?.type ?? "").toLowerCase();
  const actType = String(wf?.activity?.type ?? "").toLowerCase();
  const actionType = String(wf?.itemActionType ?? wf?.defaultActivityType ?? "").toLowerCase();
  if (itemType === "spell") return false;
  if (itemType === "weapon") return true;
  if (["mwak", "rwak"].includes(actionType)) return true;
  if (actType === "attack" && itemType !== "equipment" && itemType !== "consumable") return true;
  return false;
}

function pbIsCrit(wf) {
  if (wf?.isCritical === true) return true;
  if (wf?.tracker?.isCritical === true) return true;
  const atkRoll = wf?.d20AttackRoll ?? wf?.attackRoll;
  if (atkRoll?.isCritical === true) return true;
  const dmgRolls = [...(wf?.damageRolls ?? [])];
  if (dmgRolls.some((r) => r?.isCritical === true || r?.options?.isCritical === true)) return true;
  const d20 = atkRoll?.dice?.find?.((d) => d.faces === 20) ?? atkRoll?.terms?.find?.((t) => t?.faces === 20) ?? null;
  if (!d20) return false;
  const critThreshold = Number(d20.options?.critical ?? atkRoll?.options?.critical ?? 20) || 20;
  return (d20.results ?? []).some((r) => !r?.discarded && r?.active !== false && Number(r?.result) >= critThreshold);
}

function pbDamageType(wf) {
  return (String(wf?.defaultDamageType || wf?.damageDetail?.[0]?.type || pbTypeFromSet(wf?.item?.system?.damage?.base?.types) || pbTypeFromSet(wf?.activity?.damage?.parts?.[0]?.types) || "slashing").toLowerCase().trim() || "slashing");
}

function pbDisarm() {
  globalThis.__amellwindRuneHooks ??= {};
  const hooks = globalThis.__amellwindRuneHooks[item.uuid] ?? [];
  for (const h of hooks) { if (h?.event != null && h?.id != null) Hooks.off(h.event, h.id); }
  delete globalThis.__amellwindRuneHooks[item.uuid];
}

async function pbApply(wf) {
  try {
    if (!wf || !actorDoc || !item) return;
    if (!item.system?.equipped) return;
    const applied = getRuneFlag(item, "applied");
    if (!applied || applied.side !== "weapon") return;
    const attacker = wf.actor ?? wf.token?.actor;
    if (!attacker || attacker.uuid !== actorDoc.uuid) return;
    if (!pbIsWeaponAttack(wf)) return;
    if (!pbIsCrit(wf)) return;
    const targets = [...(wf.hitTargets ?? [])].filter(Boolean);
    if (!targets.length) return;
    globalThis.__amellwindPartbreaker ??= new Set();
    const wid = String(wf.id ?? wf.uuid ?? wf.itemCardId ?? `${wf.item?.id}-${wf.damageTotal ?? ""}`);
    const dedupeKey = `${item.uuid}:${wid}`;
    if (globalThis.__amellwindPartbreaker.has(dedupeKey)) return;
    globalThis.__amellwindPartbreaker.add(dedupeKey);
    const dtype = pbDamageType(wf);
    const rollData = actorDoc.getRollData?.() ?? {};
    const RollClass = CONFIG.Dice.DamageRoll ?? Roll;
    const damageRoll = await new RollClass(`1d6[${dtype}]`, rollData).evaluate();
    await damageRoll.toMessage({ speaker: ChatMessage.getSpeaker({ actor: actorDoc }), flavor: `Partbreaker+1 (${dtype})` });
    if (globalThis.MidiQOL?.applyTokenDamage) {
      await MidiQOL.applyTokenDamage([{ damage: damageRoll.total, type: dtype }], damageRoll.total, new Set(targets), wf.item ?? item, new Set());
    } else {
      for (const t of targets) {
        const ta = t.actor ?? t.document?.actor;
        if (typeof ta?.applyDamage === "function") await ta.applyDamage([{ value: damageRoll.total, type: dtype }]);
      }
    }
  } catch (err) { console.error(`${runeName} Partbreaker+1 apply failed`, err); }
}

function pbArm() {
  pbDisarm();
  globalThis.__amellwindRuneHooks ??= {};
  const hooks = [];
  const handler = (wf) => pbApply(wf);
  for (const event of PARTBREAKER_HOOK_EVENTS) hooks.push({ event, id: Hooks.on(event, handler) });
  globalThis.__amellwindRuneHooks[item.uuid] = hooks;
  ui.notifications?.info?.(`${runeName}: Partbreaker+1 armed — +1d6 on weapon critical hits.`);
}

// Wire arm/disarm into the equip flow
const _origApplySide = runeApplySide;
runeApplySide = async function(side, trinket) {
  await _origApplySide(side, trinket);
  if (side === "weapon") pbArm(); else pbDisarm();
};
const _origCleanup = runeCleanup;
runeCleanup = async function() {
  pbDisarm();
  await _origCleanup();
};
