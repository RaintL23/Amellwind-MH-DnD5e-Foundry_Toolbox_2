// Felyne Cook — Refresh / Arm Kitchen Aura
// MidiQOL On Use: [postActiveEffects]ItemMacro
// Activity identifier: refresh-kitchen-aura
//
// GM: run once after placing the cook (or anytime) to grant
// "Ask for a Meal (Rank 1)" to characters currently within 10 ft.

/* @@AURA_HOOKS@@ */

const macroPass = String(
  args?.[0]?.macroPass
  ?? workflow?.macroPass
  ?? "",
).toLowerCase();

if (macroPass && !macroPass.includes("postactiveeffects")) return;

const rolled = (typeof rolledActivity !== "undefined" && rolledActivity)
  ? rolledActivity
  : (workflow?.activity ?? args?.[0]?.activity ?? null);

const actName = (rolled?.name ?? workflow?.activity?.name ?? "").toLowerCase();
const actId = String(rolled?.identifier ?? workflow?.activity?.identifier ?? "").toLowerCase();

const isRefresh =
  actId === "refresh-kitchen-aura"
  || actName.includes("refresh kitchen")
  || actName.includes("arm kitchen");

if (!isRefresh && macroPass) return;

if (!game.user.isGM) {
  ui.notifications.warn("Felyne Cook: only the GM can refresh the kitchen aura.");
  return;
}

const sync = globalThis.__amellwindFelyneCookAura?.syncKitchenFeatures;
if (typeof sync !== "function") {
  ui.notifications.error("Felyne Cook: kitchen sync helper missing.");
  return;
}

await sync({ notify: true });
