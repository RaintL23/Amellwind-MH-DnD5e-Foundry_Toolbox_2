/**
 * Detect passive sheet-stat effects from feature prose (speed, AC, senses, resistances).
 * Heuristic only — not a full rules engine.
 */
import { plainFeatureText } from "@/features/raintdm/builder/foundry-export/feature-usage.utils";
import type { PlayFeatureStatEffect } from "../utils/play-character.types";

const DAMAGE_TYPES =
  "acid|bludgeoning|cold|fire|force|lightning|necrotic|piercing|poison|psychic|radiant|slashing|thunder";

function pushUnique(
  out: PlayFeatureStatEffect[],
  effect: PlayFeatureStatEffect,
): void {
  if (out.some((e) => e.kind === effect.kind && e.label === effect.label)) {
    return;
  }
  out.push(effect);
}

function detectSpeedEffects(text: string): PlayFeatureStatEffect[] {
  const effects: PlayFeatureStatEffect[] = [];
  const t = text.toLowerCase();

  const walkInc =
    t.match(
      /(?:your )?(?:base )?walking speed (?:is )?increas(?:ed|es) by (\d+) feet/,
    ) ?? t.match(/your speed increases by (\d+) feet/);
  if (walkInc && !/flying|swim|climb|burrow/.test(walkInc[0])) {
    pushUnique(effects, {
      kind: "speed",
      label: `Speed +${walkInc[1]} ft.`,
    });
  }

  const walkSet = t.match(
    /(?:your )?(?:base )?walking speed (?:is|becomes) (\d+) feet/,
  );
  if (walkSet) {
    pushUnique(effects, {
      kind: "speed",
      label: `Speed ${walkSet[1]} ft.`,
    });
  }

  for (const [re, label] of [
    [/flying speed of (\d+) feet/, "Fly"],
    [/swim(?:ming)? speed of (\d+) feet/, "Swim"],
    [/climb(?:ing)? speed of (\d+) feet/, "Climb"],
    [/burrow(?:ing)? speed of (\d+) feet/, "Burrow"],
  ] as const) {
    const m = t.match(re);
    if (m) {
      pushUnique(effects, {
        kind: "speed",
        label: `${label} ${m[1]} ft.`,
      });
    }
  }

  if (/swim(?:ming)? speed equal to your walking speed/.test(t)) {
    pushUnique(effects, { kind: "speed", label: "Swim = walk" });
  }
  if (/climb(?:ing)? speed equal to your walking speed/.test(t)) {
    pushUnique(effects, { kind: "speed", label: "Climb = walk" });
  }

  return effects;
}

function detectAcEffects(text: string): PlayFeatureStatEffect[] {
  const effects: PlayFeatureStatEffect[] = [];
  const t = text.toLowerCase();

  const inc = t.match(
    /(?:armor class|ac)\s+(?:increases|increase)s?\s+by\s+(\d+)/,
  );
  if (inc) {
    pushUnique(effects, { kind: "ac", label: `AC +${inc[1]}` });
  }

  const unarmored = t.match(
    /(?:armor class|ac)\s+(?:equals|is)\s+(\d+)\s*\+\s*(?:your\s+)?(dexterity|dex|constitution|con|wisdom|wis)/i,
  );
  if (unarmored || /while (?:you are )?not wearing (?:any )?armor/.test(t)) {
    if (unarmored) {
      pushUnique(effects, {
        kind: "ac",
        label: `Unarmored AC ${unarmored[1]}+${unarmored[2].slice(0, 3).toUpperCase()}`,
      });
    } else if (/calculate your armor class/.test(t) || /unarmored defense/.test(t)) {
      pushUnique(effects, { kind: "ac", label: "Unarmored Defense" });
    }
  }

  const natural = t.match(/natural armor[^.]{0,40}?(\d+)/i);
  if (natural) {
    pushUnique(effects, { kind: "ac", label: `Natural armor ${natural[1]}` });
  }

  return effects;
}

function detectDarkvisionEffects(
  name: string,
  text: string,
  speciesDarkvision?: number,
): PlayFeatureStatEffect[] {
  const effects: PlayFeatureStatEffect[] = [];
  const nameIsDarkvision = /darkvision/i.test(name);
  const t = text.toLowerCase();

  const range =
    t.match(/darkvision[^.]*?(?:range|out to(?: a range of)?)[^.]*?(\d+)\s*feet/) ??
    t.match(/darkvision.*?(\d+)\s*feet/) ??
    t.match(/see in dim light.*?(\d+)\s*feet/);

  const ft =
    (range ? Number(range[1]) : undefined) ??
    (nameIsDarkvision ? speciesDarkvision : undefined);

  if (ft && ft > 0) {
    pushUnique(effects, { kind: "darkvision", label: `Darkvision ${ft} ft.` });
  } else if (nameIsDarkvision && speciesDarkvision) {
    pushUnique(effects, {
      kind: "darkvision",
      label: `Darkvision ${speciesDarkvision} ft.`,
    });
  }

  return effects;
}

function detectResistanceEffects(
  name: string,
  text: string,
  speciesResistances?: string[],
): PlayFeatureStatEffect[] {
  const effects: PlayFeatureStatEffect[] = [];
  const t = text.toLowerCase();
  const nameLooksResistant = /resistance/i.test(name);

  const listed = t.match(
    new RegExp(
      `resistance to ((?:(?:${DAMAGE_TYPES})(?:\\s+and\\s+|\\s*,\\s*)?)+)`,
      "i",
    ),
  );
  if (listed) {
    const types = listed[1]
      .split(/\s+and\s+|,\s*/i)
      .map((s) => s.trim())
      .filter(Boolean);
    if (types.length) {
      pushUnique(effects, {
        kind: "resistance",
        label: `Resistance: ${types.join(", ")}`,
      });
      return effects;
    }
  }

  if (nameLooksResistant && speciesResistances && speciesResistances.length > 0) {
    pushUnique(effects, {
      kind: "resistance",
      label: `Resistance: ${speciesResistances.join(", ")}`,
    });
  }

  return effects;
}

export function detectFeatureStatEffects(options: {
  name: string;
  description: string;
  speciesDarkvision?: number;
  speciesResistances?: string[];
}): PlayFeatureStatEffect[] {
  const text = plainFeatureText(options.description);
  if (!text && !options.name) return [];

  return [
    ...detectSpeedEffects(text),
    ...detectAcEffects(text),
    ...detectDarkvisionEffects(options.name, text, options.speciesDarkvision),
    ...detectResistanceEffects(
      options.name,
      text,
      options.speciesResistances,
    ),
  ];
}

/** True when a compiled feature still looks like a provenance stub (no rules text). */
export function isStubFeatureDescription(
  name: string,
  description: string,
  sourceKind: string,
): boolean {
  const desc = description.trim();
  const n = name.trim();
  if (!desc) return true;
  if (desc === n) return true;
  if (sourceKind === "species" && desc.length <= n.length + 2) return true;
  if (
    sourceKind === "feat" &&
    desc.length < 140 &&
    !/\.\s+[A-Z]/.test(desc) &&
    /^(origin feat|granted|from |background)/i.test(desc)
  ) {
    return true;
  }
  if (
    sourceKind === "class" &&
    desc.length < 40 &&
    !/\.\s/.test(desc) &&
    /^(class|subclass|feature)/i.test(desc)
  ) {
    return true;
  }
  return false;
}
