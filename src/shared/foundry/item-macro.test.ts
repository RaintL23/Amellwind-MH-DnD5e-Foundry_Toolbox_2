import { describe, expect, it } from "vitest";
import {
  buildItemMacroDocument,
  embedItemMacro,
  midiOnUseMacroName,
  parseMidiOnUseMacroName,
  wrapItem,
} from "@/shared/foundry";

describe("item-macro", () => {
  it("parses Midi [pass]ItemMacro lists", () => {
    expect(
      parseMidiOnUseMacroName(
        "[preTargeting]ItemMacro,[postDamageRoll]ItemMacro",
      ),
    ).toEqual(["preTargeting", "postDamageRoll"]);
  });

  it("embeds Item Macro 2.x flags and Midi on-use parts", () => {
    const item = wrapItem({
      name: "Test Weapon",
      type: "weapon",
      system: {},
    });
    embedItemMacro(item, {
      command: "return;",
      passes: ["preTargeting", "postActiveEffects"],
    });
    const flags = item.flags as {
      "midi-qol"?: { onUseMacroName?: string; onUseMacroParts?: { items?: unknown[] } };
      itemacro?: { macro?: { command?: string; type?: string } };
    };
    expect(flags["midi-qol"]?.onUseMacroName).toBe(
      midiOnUseMacroName(["preTargeting", "postActiveEffects"]),
    );
    expect(flags["midi-qol"]?.onUseMacroParts?.items).toHaveLength(2);
    expect(flags.itemacro?.macro?.command).toBe("return;");
    expect(flags.itemacro?.macro?.type).toBe("script");
  });

  it("keeps authored Item Macro command when building the document envelope", () => {
    const doc = buildItemMacroDocument({
      name: "Hunting Horn",
      command: "console.log(1)",
    });
    expect(doc._stats).toMatchObject({
      coreVersion: "12.331",
      systemId: "dnd5e",
      systemVersion: "4.4.4",
    });
  });
});
