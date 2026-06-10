export type LawChaosAxis = "L" | "N" | "C";
export type GoodEvilAxis = "G" | "N" | "E";

const ALIGNMENT_MAP: Record<
  string,
  { lawChaos: LawChaosAxis; goodEvil: GoodEvilAxis }
> = {
  N: { lawChaos: "N", goodEvil: "N" },
  LG: { lawChaos: "L", goodEvil: "G" },
  LN: { lawChaos: "L", goodEvil: "N" },
  LE: { lawChaos: "L", goodEvil: "E" },
  NG: { lawChaos: "N", goodEvil: "G" },
  NE: { lawChaos: "N", goodEvil: "E" },
  CG: { lawChaos: "C", goodEvil: "G" },
  CN: { lawChaos: "C", goodEvil: "N" },
  CE: { lawChaos: "C", goodEvil: "E" },
  L: { lawChaos: "L", goodEvil: "N" },
  G: { lawChaos: "N", goodEvil: "G" },
  E: { lawChaos: "N", goodEvil: "E" },
  C: { lawChaos: "C", goodEvil: "N" },
};

export function parseAlignmentAxes(alignment: string[]): {
  lawChaos: LawChaosAxis;
  goodEvil: GoodEvilAxis;
} {
  const code = alignment[0] ?? "N";
  return ALIGNMENT_MAP[code] ?? { lawChaos: "N", goodEvil: "N" };
}

export function composeAlignment(
  lawChaos: LawChaosAxis,
  goodEvil: GoodEvilAxis,
): string[] {
  if (lawChaos === "N" && goodEvil === "N") return ["N"];
  return [`${lawChaos}${goodEvil}`];
}
