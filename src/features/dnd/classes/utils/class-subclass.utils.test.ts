import { describe, expect, it } from "vitest";
import { subclassesForClassVariant } from "./class-subclass.utils";
import type { Class, Subclass } from "@/shared/types";

function sub(name: string, source: string, extra: Partial<Subclass> = {}): Subclass {
  return {
    id: `${name}::${source}`,
    name,
    shortName: name,
    source,
    classSource: "EFA",
    progression: [],
    ...extra,
  };
}

describe("subclassesForClassVariant", () => {
  it("keeps original brew subclasses on a 2024 class but drops _copy re-links", () => {
    const efa = {
      id: "Artificer::EFA",
      name: "Artificer",
      source: "EFA",
      edition: "one",
      subclasses: [
        sub("Alchemist", "EFA"),
        sub("Alchemist", "TCE", { linkedFromCopy: true }),
        sub("Forge Adept", "ExploringEberron24"),
        sub("Reanimator", "RHW"),
      ],
    } as Class;

    expect(subclassesForClassVariant(efa).map((s) => s.id)).toEqual([
      "Alchemist::EFA",
      "Forge Adept::ExploringEberron24",
      "Reanimator::RHW",
    ]);
  });
});
