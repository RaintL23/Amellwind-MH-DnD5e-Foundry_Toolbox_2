/** Target Core + system versions for all Foundry exports. */
export const FOUNDRY_EXPORT_TARGET = {
  coreVersion: "12.331",
  systemId: "dnd5e",
  systemVersion: "4.4.4",
  rules: "2024",
} as const;

export type FoundryRulesVersion = "2014" | "2024";

/** 5etools / dnd5e 2024 book abbreviations (CPR Medkit keys off `system.source.rules`). */
const RULES_2024_BOOKS = new Set(["xphb", "xdmg", "xmm"]);

const RULES_2014_BOOKS = new Set([
  "phb",
  "dmg",
  "mm",
  "tce",
  "xge",
  "vgm",
  "mtf",
  "ftd",
  "egw",
  "mot",
  "scc",
  "ggr",
  "ai",
  "aag",
  "idrotf",
  "cos",
  "toa",
  "skt",
  "wdh",
  "lmop",
  "hotdq",
  "rot",
  "pota",
  "oota",
  "bgdia",
  "kkw",
  "llk",
  "sato",
  "bmt",
  "bam",
]);

/**
 * Infers dnd5e `system.source.rules` from a 5etools book code so CPR / Gambit's
 * Premades Medkit can match 2014 vs 2024 automations. Unknown books keep the
 * export target (2024).
 */
export function inferFoundryRulesVersion(
  book?: string | null,
): FoundryRulesVersion {
  const key = (book ?? "").trim().toLowerCase();
  if (RULES_2024_BOOKS.has(key)) return "2024";
  if (RULES_2014_BOOKS.has(key)) return "2014";
  return FOUNDRY_EXPORT_TARGET.rules;
}

/** Canonical `system.source` blob for exported items. */
export function foundrySourceBlock(
  book?: string | null,
): Record<string, unknown> {
  const trimmed = (book ?? "").trim();
  return {
    custom: "",
    book: trimmed,
    page: "",
    license: "",
    rules: inferFoundryRulesVersion(trimmed),
    revision: 1,
  };
}
