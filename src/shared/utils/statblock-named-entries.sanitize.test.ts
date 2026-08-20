import { describe, expect, it } from "vitest";
import {
  foldNestedNamedEntries,
  sanitizeNamedEntrySection,
  splitGluedNamedEntries,
  splitLeadingFormName,
} from "./statblock-named-entries.sanitize";

describe("splitLeadingFormName", () => {
  it("splits a two-word form prefix from a recharge ability", () => {
    expect(splitLeadingFormName("Black Scales Black Fire (Recharge 5-6)")).toEqual({
      form: "Black Scales",
      ability: "Black Fire (Recharge 5-6)",
    });
  });

  it("leaves a recharge ability without a form prefix intact", () => {
    expect(splitLeadingFormName("Fire Beam (Recharge 5-6)")).toEqual({
      ability: "Fire Beam (Recharge 5-6)",
    });
  });
});

describe("splitGluedNamedEntries", () => {
  it("splits a lowercase-breath recharge glued onto Swallow", () => {
    const split = splitGluedNamedEntries([
      {
        name: "Swallow",
        entries: [
          "The xeno'jiiva makes one bite attack against a Large or smaller creature it is grappling. Fire breath (Recharge 5-6). The xeno'jiiva exhales a beam of blue fire.",
        ],
      },
    ]);

    expect(split.map((entry) => entry.name)).toEqual([
      "Swallow",
      "Fire breath (Recharge 5-6)",
    ]);
  });

  it("splits a recharge action glued onto the previous attack", () => {
    const split = splitGluedNamedEntries([
      {
        name: "Bite",
        entries: [
          "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 12 (2d8 + 3) piercing damage plus 3 (1d6) cold damage. Ice Spit (Recharge 5-6}. Ranged Weapon Attack: +3 to hit, range 30/60 ft., one creature. Hit: The target is restrained by ice.",
        ],
      },
    ]);

    expect(split.map((entry) => entry.name)).toEqual([
      "Bite",
      "Ice Spit (Recharge 5-6)",
    ]);
    expect(split[0].entries[0]).toMatch(/piercing damage plus 3 \(1d6\) cold damage\.$/);
    expect(split[1].entries[0]).toMatch(/^Ranged Weapon Attack/);
  });

  it("splits a form breath glued onto Damage Immunities text", () => {
    const split = splitGluedNamedEntries([
      {
        name: "Damage Immunities",
        entries: [
          "necrotic, bludgeoning Crimson Scales Crimson Demons Breath (Recharge 5-6). The fatalis exhales flames mixed with necrotic energy.",
        ],
      },
    ]);

    expect(split).toEqual([
      {
        name: "Damage Immunities",
        entries: ["necrotic, bludgeoning"],
      },
      {
        name: "Crimson Scales Crimson Demons Breath (Recharge 5-6)",
        entries: ["The fatalis exhales flames mixed with necrotic energy."],
      },
    ]);
  });
});

describe("foldNestedNamedEntries", () => {
  it("nests form riders under Shifting Scales instead of duplicating Bite", () => {
    const folded = foldNestedNamedEntries(
      [
        {
          name: "Legendary Resistance (3/Day)",
          entries: ["If the fatalis fails a saving throw, it can choose to succeed instead."],
        },
        {
          name: "Shifting Scales",
          entries: [
            "The fatalis has three forms. Gain the benefits below of its new scale color.",
          ],
        },
        {
          name: "Black Scales Black Fire (Recharge 5-6)",
          entries: ["The fatalis exhales a black flame in a 90-foot cone."],
        },
        {
          name: "Bite",
          entries: [
            "attacks deal an additional 11 (2d10) necrotic damage (not included in the attack action).",
          ],
        },
        {
          name: "Damage Immunities",
          entries: ["necrotic, bludgeoning"],
        },
      ],
      new Set(["bite", "claw"]),
    );

    expect(folded.map((entry) => entry.name)).toEqual([
      "Legendary Resistance (3/Day)",
      "Shifting Scales",
    ]);
    const nested = folded[1].entries.filter((entry) => typeof entry === "object");
    expect(nested).toHaveLength(1);
    const form = nested[0] as { name: string; entries: unknown[] };
    expect(form.name).toBe("Black Scales");
  });
});

describe("sanitizeNamedEntrySection", () => {
  it("folds the catalog Fatalis trait dump into one Shifting Scales trait", () => {
    const sanitized = sanitizeNamedEntrySection(
      [
        {
          name: "Legendary Resistance (3/Day)",
          text: "If the fatalis fails a saving throw, it can choose to succeed instead.",
        },
        {
          name: "Magic Resistance",
          text: "The fatalis has advantage on saving throws against spells and other magical effects.",
        },
        {
          name: "Shifting Scales",
          text: "The fatalis has three forms; black, crimson, and white. At the start of the fatalis turn its scales shift, black to crimson, crimson to white, or white to black. The Fatalis loses its breath weapon, damage immunities, and elemental damage from its bite or claw attacks and gain the benefits below of its new scale color. Breath attacks all share the same recharge.",
        },
        {
          name: "Black Scales Black Fire (Recharge 5-6)",
          text: "The fatalis exhales a black flame in a 90-foot cone.",
        },
        {
          name: "Bite",
          text: "attacks deal an additional 11 (2d10) necrotic damage (not included in the attack action).",
        },
        {
          name: "Damage Immunities",
          text: "necrotic, bludgeoning Crimson Scales Crimson Demons Breath (Recharge 5-6). The fatalis exhales flames mixed with necrotic energy.",
        },
        {
          name: "Bite",
          text: "attacks deal an additional 11 (2d10) fire damage (not included in the attack action).",
        },
        {
          name: "Damage Immunities",
          text: "fire, slashing White Scales Emperor's Roar (Recharge 5-6). The fatalis calls down a giant bolt of red lightning.",
        },
        {
          name: "Claw",
          text: "attack deals an additional 7 (2d6) lightning damage (not included in the attack action).",
        },
        {
          name: "Damage Immunities",
          text: "lightning, piercing",
        },
      ],
      new Set(["bite", "claw", "tail", "multiattack"]),
    );

    expect(sanitized.map((entry) => entry.name)).toEqual([
      "Legendary Resistance (3/Day)",
      "Magic Resistance",
      "Shifting Scales",
    ]);
    const payload = JSON.stringify(sanitized);
    expect(payload).toContain("Black Scales");
    expect(payload).toContain("Crimson Scales");
    expect(payload).toContain("White Scales");
    expect(payload).toContain("Emperor's Roar (Recharge 5-6)");
    expect(payload).toContain("lightning, piercing");
  });

  it("leaves an already-nested GitHub trait untouched", () => {
    const github = [
      {
        name: "Shifting Scales",
        entries: [
          "The fatalis has three forms.",
          {
            type: "list",
            items: [
              {
                type: "item",
                name: "Black Fire",
                entries: ["The fatalis exhales a black flame."],
              },
            ],
          },
        ],
      },
    ];

    expect(sanitizeNamedEntrySection(github)).toEqual(github);
  });
});
