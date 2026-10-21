import { describe, expect, it } from "vitest";
import {
  buildTableIndex,
  inlineStatblockTableRefs,
} from "./class-feature-entries.utils";
import { mapStatBlockEntries } from "@/shared/utils/statblock-entries.mapper";

const hexbladeTable = {
  name: "Hexblade Spells",
  source: "XUA2025ArcaneSubclasses",
  type: "table",
  colLabels: ["Warlock Level", "Spells"],
  rows: [["3", "{@spell Hex|XPHB}, {@spell Shield|XPHB}"]],
};

const statblockRef = {
  type: "statblock",
  tag: "table",
  name: "Hexblade Spells",
  source: "XUA2025ArcaneSubclasses",
};

describe("inlineStatblockTableRefs", () => {
  const tables = buildTableIndex([hexbladeTable]);

  it("replaces a statblock table ref with the referenced table", () => {
    const [feature] = inlineStatblockTableRefs(
      [{ entries: ["Intro.", statblockRef] }],
      tables,
    );
    expect(feature.entries?.[1]).toBe(hexbladeTable);

    const content = mapStatBlockEntries(feature.entries ?? []);
    expect(content.map((block) => block.type)).toEqual(["paragraph", "table"]);
  });

  it("resolves refs nested inside entries blocks", () => {
    const [feature] = inlineStatblockTableRefs(
      [{ entries: [{ type: "entries", name: "Outer", entries: [statblockRef] }] }],
      tables,
    );
    const outer = feature.entries?.[0] as { entries: unknown[] };
    expect(outer.entries[0]).toBe(hexbladeTable);
  });

  it("keeps unresolved refs and untouched features as-is", () => {
    const unknownRef = { ...statblockRef, name: "Missing" };
    const plain = { entries: ["No table here."] };
    const withUnknown = { entries: [unknownRef] };

    const [a, b] = inlineStatblockTableRefs([plain, withUnknown], tables);
    expect(a).toBe(plain);
    expect(b.entries?.[0]).toBe(unknownRef);
  });
});
