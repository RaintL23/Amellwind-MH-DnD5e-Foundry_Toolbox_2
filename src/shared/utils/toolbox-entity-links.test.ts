import { describe, expect, it } from "vitest";
import {
  TOOLBOX_PUBLIC_ORIGIN,
  buildToolboxEntityHref,
  buildToolboxFilterHref,
  buildToolboxWeaponHref,
  formatEntityDisplayName,
  resolveToolboxEntityRef,
  toAbsoluteToolboxUrl,
} from "./toolbox-entity-links";

describe("formatEntityDisplayName", () => {
  it("title-cases 5etools lookup names", () => {
    expect(formatEntityDisplayName("dimension door")).toBe("Dimension Door");
    expect(formatEntityDisplayName("Dimension Door")).toBe("Dimension Door");
  });
});

describe("buildToolboxEntityHref", () => {
  it("builds spell query URLs with + for spaces", () => {
    expect(buildToolboxEntityHref("spell", "Dimension Door")).toBe(
      "/spells?spell=Dimension+Door",
    );
  });

  it("routes Amellwind items to /items and PHB items to /dnd-items", () => {
    expect(buildToolboxEntityHref("item", "Tranq Bomb", "AGMH")).toBe(
      "/items?item=Tranq+Bomb",
    );
    expect(buildToolboxEntityHref("item", "Greataxe", "XPHB")).toBe(
      "/dnd-items?item=Greataxe",
    );
  });

  it("routes hunter weapon names to /weapons", () => {
    expect(buildToolboxEntityHref("item", "Hunting Horn", "AGMH")).toBe(
      "/weapons?weapon=Hunting+Horn",
    );
  });

  it("routes conditions, classes, and AGMH races", () => {
    expect(buildToolboxEntityHref("condition", "stunned")).toBe(
      "/conditions?condition=Stunned",
    );
    expect(buildToolboxEntityHref("class", "Wizard")).toBe("/classes/Wizard");
    expect(buildToolboxEntityHref("race", "Wyverian", "AGMH")).toBe(
      "/species?species=Wyverian",
    );
    expect(buildToolboxEntityHref("race", "Elf", "XPHB")).toBe(
      "/dnd-races?race=Elf",
    );
  });
});

describe("resolveToolboxEntityRef", () => {
  it("prefers the display pipe and title-cases the name otherwise", () => {
    const spell = resolveToolboxEntityRef("spell", "dimension door|XPHB");
    expect(spell).toEqual({
      kind: "spell",
      href: "/spells?spell=Dimension+Door",
      label: "Dimension Door",
    });

    const item = resolveToolboxEntityRef(
      "item",
      "tranq ammo (1)|AGMH|tranq ammo",
    );
    expect(item?.label).toBe("tranq ammo");
    expect(item?.href).toBe("/items?item=Tranq+Ammo+%281%29");
  });

  it("returns null for non-entity tags", () => {
    expect(resolveToolboxEntityRef("damage", "1d6")).toBeNull();
    expect(resolveToolboxEntityRef("i", "Capture Novice.")).toBeNull();
  });
});

describe("buildToolboxFilterHref", () => {
  it("maps hunter-weapon item filters to the weapons page", () => {
    expect(buildToolboxFilterHref("Hunting Horn", "items", "")).toBe(
      "/weapons?weapon=Hunting+Horn",
    );
  });

  it("keeps broad spell-school filters on the spells list", () => {
    expect(
      buildToolboxFilterHref("Abjuration or Illusion", "spells", "school=A;I"),
    ).toBe("/spells");
  });
});

describe("toAbsoluteToolboxUrl", () => {
  it("prefixes the public origin", () => {
    expect(toAbsoluteToolboxUrl("/spells?spell=Fireball")).toBe(
      `${TOOLBOX_PUBLIC_ORIGIN}/spells?spell=Fireball`,
    );
  });

  it("builds weapon footer links", () => {
    expect(buildToolboxWeaponHref("Light Bowgun")).toBe(
      "/weapons?weapon=Light+Bowgun",
    );
  });
});
