import { rollExpression } from "@/shared/utils/dice.utils";
import type { ActionLocks } from "./condition-effects.data";
import type { PlayInventoryItem } from "./play-character.types";
import type { PlaySessionAction } from "./play-session-reducer";
import {
  healingExpressionFromPotionName,
  isPotionItem,
} from "./inventory-item.utils";
import type { useSheetRoller } from "../hooks/useSheetRoller";

export function consumeInventoryItem(
  item: PlayInventoryItem,
  dispatch: (a: PlaySessionAction) => void,
): void {
  if (item.quantity <= 1) {
    dispatch({ type: "REMOVE_ITEM", id: item.id });
    return;
  }
  dispatch({
    type: "UPSERT_ITEM",
    item: { ...item, quantity: item.quantity - 1 },
  });
}

/** Magic Action: only attuned items (requiresAttunement without attune is not enough). */
export function magicActionItems(
  inventory: PlayInventoryItem[],
): PlayInventoryItem[] {
  return inventory.filter(
    (i) => i.quantity > 0 && !i.isWeapon && i.attuned,
  );
}

export function utilizeItems(
  inventory: PlayInventoryItem[],
): PlayInventoryItem[] {
  return inventory.filter((i) => {
    if (i.quantity <= 0 || i.isWeapon || i.attuned) return false;
    if (isPotionItem(i)) return false;
    return true;
  });
}

export function potionItems(
  inventory: PlayInventoryItem[],
): PlayInventoryItem[] {
  return inventory.filter(
    (i) => i.quantity > 0 && !i.isWeapon && isPotionItem(i),
  );
}

export function drinkPotion(
  item: PlayInventoryItem,
  locks: ActionLocks,
  dispatch: (a: PlaySessionAction) => void,
  logRoll: ReturnType<typeof useSheetRoller>["logRoll"],
): boolean {
  if (locks.bonusActions || locks.actions) return false;
  const healExpr = healingExpressionFromPotionName(item.name);
  if (healExpr) {
    const result = rollExpression(healExpr);
    dispatch({ type: "SET_HP_DELTA", delta: result.total });
    logRoll({
      label: `Drink ${item.name}`,
      expression: healExpr,
      total: result.total,
      detail: `${result.detail} HP restored`,
      mode: "normal",
    });
  } else {
    logRoll({
      label: `Drink ${item.name}`,
      expression: "—",
      total: 0,
      detail: "Consumed",
      mode: "normal",
    });
  }
  consumeInventoryItem(item, dispatch);
  return true;
}

/** Stack a new catalog/custom item onto an existing row when possible. */
export function stackOrAppendItem(
  inventory: PlayInventoryItem[],
  item: PlayInventoryItem,
): PlayInventoryItem[] {
  const match = inventory.find(
    (i) =>
      ((item.catalogId && i.catalogId === item.catalogId) ||
        (!item.catalogId &&
          !i.catalogId &&
          i.name.trim().toLowerCase() === item.name.trim().toLowerCase())) &&
      i.kind === item.kind &&
      !i.equipped &&
      !i.attuned &&
      i.requiresAttunement === item.requiresAttunement,
  );
  if (match) {
    return inventory.map((i) =>
      i.id === match.id
        ? { ...i, quantity: i.quantity + item.quantity }
        : i,
    );
  }
  return [...inventory, item];
}
