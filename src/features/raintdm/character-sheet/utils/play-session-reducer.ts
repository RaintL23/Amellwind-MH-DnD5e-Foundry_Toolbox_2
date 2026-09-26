import type {
  PlayCharacterCompiled,
  PlayConditionInstance,
  PlayCurrency,
  PlayInventoryItem,
  PlaySessionState,
} from "./play-character.types";
import { EMPTY_DEATH_SAVES } from "./play-character.types";
import {
  applyHpChangeToActor,
  resolveDeathSaveForActor,
  setDeathSaveCountOnActor,
} from "@/shared/utils/hp-actor.utils";
import { applyRest, spendHitDie } from "./rest.utils";

export type PlaySessionAction =
  | { type: "SET_HP_DELTA"; delta: number; critical?: boolean; setTempHp?: number }
  | { type: "SET_HP_ABSOLUTE"; current: number; temp?: number }
  | { type: "SET_TEMP_HP"; temp: number }
  | { type: "SET_DEATH_SAVES"; side: "successes" | "failures"; count: number }
  | { type: "ROLL_DEATH_SAVE"; d20: number }
  | { type: "SET_EXHAUSTION"; level: number }
  | { type: "ADD_CONDITION"; condition: PlayConditionInstance }
  | { type: "REMOVE_CONDITION"; id: string }
  | { type: "UPDATE_CONDITION"; condition: PlayConditionInstance }
  | { type: "TOGGLE_INSPIRATION" }
  | { type: "SET_CONCENTRATION"; spellName: string | null }
  | { type: "SPEND_FEATURE_USE"; featureId: string; max: number }
  | { type: "CLEAR_FEATURE_USE"; featureId: string }
  | { type: "SET_FEATURE_USES_SPENT"; featureId: string; spent: number; max: number }
  | { type: "SPEND_RESOURCE"; resourceId: string; max: number }
  | { type: "CLEAR_RESOURCE"; resourceId: string }
  | { type: "SET_RESOURCE_SPENT"; resourceId: string; spent: number; max: number }
  | { type: "SPEND_SLOT"; level: number; max: number }
  | { type: "CLEAR_SLOT"; level: number }
  | { type: "SET_SLOTS_SPENT"; level: number; spent: number; max: number }
  | { type: "SPEND_PACT"; max: number }
  | { type: "CLEAR_PACT" }
  | { type: "SET_PACT_SPENT"; spent: number; max: number }
  | { type: "SET_PREPARED"; spellIds: string[] }
  | { type: "TOGGLE_PREPARED"; spellId: string }
  | { type: "SET_FEATURE_OVERRIDE"; featureId: string; bucket?: string; usesMax?: number }
  | { type: "SET_INVENTORY"; inventory: PlayInventoryItem[] }
  | { type: "UPSERT_ITEM"; item: PlayInventoryItem }
  | { type: "REMOVE_ITEM"; id: string }
  | { type: "SET_CURRENCY"; currency: PlayCurrency }
  | { type: "SET_AC_ADJUST"; value: number }
  | { type: "SET_NOTES"; notes: string }
  | { type: "SET_FLAGS"; countCoinWeight?: boolean; useVariantEncumbrance?: boolean }
  | { type: "SHORT_REST" }
  | { type: "LONG_REST" }
  | { type: "SPEND_HIT_DIE"; dieKey: string }
  | { type: "REPLACE_SESSION"; session: PlaySessionState }
  | { type: "SYNC_CLAMP"; compiled: PlayCharacterCompiled }
  | { type: "MIGRATE_EXHAUSTION_CONDITIONS" };

export interface PlaySessionReduceResult {
  session: PlaySessionState;
  /** Side-channel for UI (hit die heal text, death save outcome) */
  meta?: {
    deathSaveKind?: string;
    hitDieDetail?: string;
    healed?: number;
  };
}

function asPc(session: PlaySessionState) {
  return {
    kind: "pc" as const,
    hp: session.hp,
    deathSaves: session.deathSaves,
  };
}

export function playSessionReducer(
  compiled: PlayCharacterCompiled,
  session: PlaySessionState,
  action: PlaySessionAction,
): PlaySessionReduceResult {
  switch (action.type) {
    case "SET_HP_DELTA": {
      const actor = applyHpChangeToActor(asPc(session), action.delta, {
        critical: action.critical,
        setTempHp: action.setTempHp,
      });
      return {
        session: {
          ...session,
          hp: { ...actor.hp, max: compiled.hpMax },
          deathSaves: actor.deathSaves,
        },
      };
    }
    case "SET_HP_ABSOLUTE": {
      const current = Math.max(0, Math.min(compiled.hpMax, action.current));
      const temp = action.temp != null ? Math.max(0, action.temp) : session.hp.temp;
      const deathSaves =
        session.hp.current <= 0 && current > 0
          ? { ...EMPTY_DEATH_SAVES }
          : session.deathSaves;
      return {
        session: {
          ...session,
          hp: { current, max: compiled.hpMax, temp },
          deathSaves,
        },
      };
    }
    case "SET_TEMP_HP": {
      return {
        session: {
          ...session,
          hp: { ...session.hp, temp: Math.max(0, Math.floor(action.temp)) },
        },
      };
    }
    case "SET_DEATH_SAVES": {
      const actor = setDeathSaveCountOnActor(asPc(session), action.side, action.count);
      return { session: { ...session, deathSaves: actor.deathSaves } };
    }
    case "ROLL_DEATH_SAVE": {
      const { kind, actor } = resolveDeathSaveForActor(asPc(session), action.d20);
      return {
        session: {
          ...session,
          hp: { ...actor.hp, max: compiled.hpMax },
          deathSaves: actor.deathSaves,
        },
        meta: { deathSaveKind: kind },
      };
    }
    case "SET_EXHAUSTION":
      return {
        session: {
          ...session,
          exhaustion: Math.max(0, Math.min(6, action.level)),
        },
      };
    case "ADD_CONDITION": {
      const nameKey = action.condition.name.trim().toLowerCase();
      if (nameKey === "exhaustion" || nameKey === "exhausted") {
        const level = Math.max(
          1,
          action.condition.level ?? session.exhaustion + 1,
        );
        return {
          session: {
            ...session,
            exhaustion: Math.min(6, level),
            concentration: action.condition.effectOverride?.denyConcentration
              ? null
              : session.concentration,
          },
        };
      }
      const already = session.conditions.some(
        (c) =>
          c.name.trim().toLowerCase() === nameKey &&
          c.kind === action.condition.kind,
      );
      if (already) return { session };
      return {
        session: {
          ...session,
          conditions: [...session.conditions, action.condition],
          concentration: action.condition.effectOverride?.denyConcentration
            ? null
            : session.concentration,
        },
      };
    }
    case "MIGRATE_EXHAUSTION_CONDITIONS": {
      const exhaustionConds = session.conditions.filter((c) => {
        const n = c.name.trim().toLowerCase();
        return n === "exhaustion" || n === "exhausted";
      });
      if (exhaustionConds.length === 0) return { session };
      const fromInst = Math.max(
        0,
        ...exhaustionConds.map((c) => c.level ?? 1),
      );
      return {
        session: {
          ...session,
          exhaustion: Math.max(session.exhaustion, Math.min(6, fromInst)),
          conditions: session.conditions.filter((c) => {
            const n = c.name.trim().toLowerCase();
            return n !== "exhaustion" && n !== "exhausted";
          }),
        },
      };
    }
    case "REMOVE_CONDITION":
      return {
        session: {
          ...session,
          conditions: session.conditions.filter((c) => c.id !== action.id),
        },
      };
    case "UPDATE_CONDITION":
      return {
        session: {
          ...session,
          conditions: session.conditions.map((c) =>
            c.id === action.condition.id ? action.condition : c,
          ),
        },
      };
    case "TOGGLE_INSPIRATION":
      return { session: { ...session, inspiration: !session.inspiration } };
    case "SET_CONCENTRATION":
      return { session: { ...session, concentration: action.spellName } };
    case "SPEND_FEATURE_USE": {
      const spent = session.featureUsesSpent[action.featureId] ?? 0;
      if (spent >= action.max) return { session };
      return {
        session: {
          ...session,
          featureUsesSpent: {
            ...session.featureUsesSpent,
            [action.featureId]: spent + 1,
          },
        },
      };
    }
    case "CLEAR_FEATURE_USE": {
      const featureUsesSpent = { ...session.featureUsesSpent };
      delete featureUsesSpent[action.featureId];
      return { session: { ...session, featureUsesSpent } };
    }
    case "SET_FEATURE_USES_SPENT": {
      const spent = Math.max(0, Math.min(action.max, action.spent));
      const featureUsesSpent = { ...session.featureUsesSpent };
      if (spent <= 0) delete featureUsesSpent[action.featureId];
      else featureUsesSpent[action.featureId] = spent;
      return { session: { ...session, featureUsesSpent } };
    }
    case "SPEND_RESOURCE": {
      const spent = session.resourcesSpent[action.resourceId] ?? 0;
      if (spent >= action.max) return { session };
      return {
        session: {
          ...session,
          resourcesSpent: {
            ...session.resourcesSpent,
            [action.resourceId]: spent + 1,
          },
        },
      };
    }
    case "CLEAR_RESOURCE": {
      const resourcesSpent = { ...session.resourcesSpent };
      delete resourcesSpent[action.resourceId];
      return { session: { ...session, resourcesSpent } };
    }
    case "SET_RESOURCE_SPENT": {
      const spent = Math.max(0, Math.min(action.max, action.spent));
      const resourcesSpent = { ...session.resourcesSpent };
      if (spent <= 0) delete resourcesSpent[action.resourceId];
      else resourcesSpent[action.resourceId] = spent;
      return { session: { ...session, resourcesSpent } };
    }
    case "SPEND_SLOT": {
      const spent = session.slotsSpent[action.level] ?? 0;
      if (spent >= action.max) return { session };
      return {
        session: {
          ...session,
          slotsSpent: {
            ...session.slotsSpent,
            [action.level]: spent + 1,
          },
        },
      };
    }
    case "CLEAR_SLOT": {
      const slotsSpent = { ...session.slotsSpent };
      delete slotsSpent[action.level];
      return { session: { ...session, slotsSpent } };
    }
    case "SET_SLOTS_SPENT": {
      const spent = Math.max(0, Math.min(action.max, action.spent));
      const slotsSpent = { ...session.slotsSpent };
      if (spent <= 0) delete slotsSpent[action.level];
      else slotsSpent[action.level] = spent;
      return { session: { ...session, slotsSpent } };
    }
    case "SPEND_PACT": {
      if (session.pactSpent >= action.max) return { session };
      return { session: { ...session, pactSpent: session.pactSpent + 1 } };
    }
    case "CLEAR_PACT":
      return { session: { ...session, pactSpent: 0 } };
    case "SET_PACT_SPENT": {
      const spent = Math.max(0, Math.min(action.max, action.spent));
      return { session: { ...session, pactSpent: spent } };
    }
    case "SET_PREPARED":
      return { session: { ...session, preparedSpellIds: action.spellIds } };
    case "TOGGLE_PREPARED": {
      const set = new Set(session.preparedSpellIds);
      if (set.has(action.spellId)) set.delete(action.spellId);
      else set.add(action.spellId);
      return { session: { ...session, preparedSpellIds: [...set] } };
    }
    case "SET_FEATURE_OVERRIDE": {
      const prev = session.featureOverrides[action.featureId] ?? {};
      return {
        session: {
          ...session,
          featureOverrides: {
            ...session.featureOverrides,
            [action.featureId]: {
              ...prev,
              ...(action.bucket
                ? { bucket: action.bucket as typeof prev.bucket }
                : {}),
              ...(action.usesMax != null ? { usesMax: action.usesMax } : {}),
            },
          },
        },
      };
    }
    case "SET_INVENTORY":
      return { session: { ...session, inventory: action.inventory } };
    case "UPSERT_ITEM": {
      const idx = session.inventory.findIndex((i) => i.id === action.item.id);
      const inventory =
        idx >= 0
          ? session.inventory.map((i) =>
              i.id === action.item.id ? action.item : i,
            )
          : [...session.inventory, action.item];
      return { session: { ...session, inventory } };
    }
    case "REMOVE_ITEM":
      return {
        session: {
          ...session,
          inventory: session.inventory.filter((i) => i.id !== action.id),
        },
      };
    case "SET_CURRENCY":
      return { session: { ...session, currency: action.currency } };
    case "SET_AC_ADJUST":
      return { session: { ...session, acAdjust: action.value } };
    case "SET_NOTES":
      return { session: { ...session, notes: action.notes } };
    case "SET_FLAGS":
      return {
        session: {
          ...session,
          countCoinWeight:
            action.countCoinWeight ?? session.countCoinWeight,
          useVariantEncumbrance:
            action.useVariantEncumbrance ?? session.useVariantEncumbrance,
        },
      };
    case "SHORT_REST":
      return { session: applyRest(compiled, session, "short") };
    case "LONG_REST":
      return { session: applyRest(compiled, session, "long") };
    case "SPEND_HIT_DIE": {
      const result = spendHitDie(compiled, session, action.dieKey);
      if (!result) return { session };
      return {
        session: result.session,
        meta: { hitDieDetail: result.detail, healed: result.healed },
      };
    }
    case "REPLACE_SESSION":
      return { session: action.session };
    case "SYNC_CLAMP": {
      const c = action.compiled;
      const clampSpent = (
        spent: Record<string, number>,
        maxOf: (id: string) => number,
      ) => {
        const out: Record<string, number> = {};
        for (const [id, n] of Object.entries(spent)) {
          const max = maxOf(id);
          if (max > 0 && n > 0) out[id] = Math.min(n, max);
        }
        return out;
      };
      const featureUsesSpent = clampSpent(session.featureUsesSpent, (id) => {
        const f = c.features.find((x) => x.id === id);
        const ov = session.featureOverrides[id];
        return ov?.usesMax ?? f?.uses?.max ?? 0;
      });
      const resourcesSpent = clampSpent(session.resourcesSpent, (id) => {
        return c.resources.find((x) => x.id === id)?.max ?? 0;
      });
      const slotsSpent: Record<number, number> = {};
      for (const [lvl, n] of Object.entries(session.slotsSpent)) {
        const level = Number(lvl);
        const max = c.spellcasting?.slotMax[level] ?? 0;
        if (max > 0) slotsSpent[level] = Math.min(n, max);
      }
      const pactMax = c.spellcasting?.pact?.max ?? 0;
      return {
        session: {
          ...session,
          hp: {
            current: Math.min(session.hp.current, c.hpMax),
            max: c.hpMax,
            temp: session.hp.temp,
          },
          featureUsesSpent,
          resourcesSpent,
          slotsSpent,
          pactSpent: Math.min(session.pactSpent, pactMax),
          exhaustion: Math.min(6, session.exhaustion),
        },
      };
    }
    default:
      return { session };
  }
}
