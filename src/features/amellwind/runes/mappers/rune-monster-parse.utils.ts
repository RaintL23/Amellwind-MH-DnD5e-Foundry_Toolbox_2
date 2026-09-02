/**
 * Monster fluff parsing helpers for the rune mapper.
 *
 * Finds the inset block that contains the carve loot table and derives slot letters,
 * CR tier, and display metadata copied onto every `Rune` from that monster.
 */
import { RuneSlot, RuneTier } from "@/shared/types";
import { formatCrDisplay, getBaseCr, getCrValues, parseCR } from "@/shared/utils/cr.utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>;

// ─── Slot & tier derivation ──────────────────────────────────────────────────

export function crToTier(cr: unknown): RuneTier {
  const n = parseCR(getBaseCr(cr));
  if (n <= 4) return 1;
  if (n <= 10) return 2;
  if (n <= 16) return 3;
  return 4;
}

export function parseSlots(slotsStr: string): RuneSlot[] {
  const slots: RuneSlot[] = [];
  if (slotsStr.includes("A")) slots.push("A");
  if (slotsStr.includes("W")) slots.push("W");
  return slots;
}

// ─── Inset discovery inside fluff.entries ────────────────────────────────────

function insetHasLootTable(insetEntries: unknown[]): boolean {
  return insetEntries.some((e) => {
    if (typeof e !== "object" || e === null) return false;
    const obj = e as Raw;
    return (
      obj.type === "table" &&
      Array.isArray(obj.colLabels) &&
      String(obj.colLabels[0]).toLowerCase().includes("carve")
    );
  });
}

export function findInset(entries: unknown[]): Raw | undefined {
  const insets: Raw[] = [];

  for (const e of entries) {
    if (typeof e !== "object" || e === null) continue;
    const obj = e as Raw;
    if (obj.type === "inset") {
      insets.push(obj);
    } else if (Array.isArray(obj.entries)) {
      const found = findInset(obj.entries as unknown[]);
      if (found) return found;
    }
  }

  return (
    insets.find(
      (inset) =>
        Array.isArray(inset.entries) &&
        insetHasLootTable(inset.entries as unknown[]),
    ) ?? insets[0]
  );
}

// ─── Shared monster fields stamped on each Rune row ──────────────────────────

export function buildRuneMonsterMeta(monster: Raw) {
  return {
    monsterName: String(monster.name ?? ""),
    monsterSource: String(monster.source ?? ""),
    monsterCr: formatCrDisplay(monster.cr),
    monsterCrs: getCrValues(monster.cr),
    tier: crToTier(monster.cr),
  };
}
