import { toFoundryDescription, FOUNDRY_EXPORT_TARGET } from "@/shared/foundry";

export function sourceBlock(source: string | undefined): Record<string, unknown> {
  return {
    custom: "",
    book: source ?? "",
    page: "",
    license: "",
    rules: FOUNDRY_EXPORT_TARGET.rules,
    revision: 1,
  };
}

export function htmlDesc(text: string | undefined): { value: string; chat: string } {
  return toFoundryDescription(text);
}

export function parseDice(formula: string): { number: number; denomination: number } | null {
  const match = formula.match(/(\d+)\s*d\s*(\d+)/i);
  if (!match) return null;
  return { number: Number(match[1]), denomination: Number(match[2]) };
}

export function parseMagicBonus(name: string): { bonus: number; clean: string } {
  const prefix = name.match(/^\+(\d+)\s+(.*)$/);
  if (prefix) return { bonus: Number(prefix[1]), clean: prefix[2] };
  const suffix = name.match(/^(.*?)[\s,]+\+(\d+)$/);
  if (suffix) return { bonus: Number(suffix[2]), clean: suffix[1].trim() };
  return { bonus: 0, clean: name };
}
