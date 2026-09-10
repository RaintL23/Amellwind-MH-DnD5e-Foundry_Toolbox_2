import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clearGtmhPatreonSupplementCache,
  loadGtmhPatreonOverlay,
} from "./gtmh-supplement";

describe("loadGtmhPatreonOverlay", () => {
  afterEach(() => {
    clearGtmhPatreonSupplementCache();
    vi.restoreAllMocks();
  });

  it("normalizes missing keys to empty arrays/objects", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          feat: [{ name: "Arcane Adaption" }],
          variantrule: [{ name: "Downtime Activity: Solo Hunt" }],
        }),
      ),
    );

    const overlay = await loadGtmhPatreonOverlay();
    expect(overlay.feat).toHaveLength(1);
    expect(overlay.variantrule).toHaveLength(1);
    expect(overlay.item).toEqual([]);
    expect(overlay.bookData).toEqual({});
  });

  it("falls back to empty overlay when response is not ok", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("nope", { status: 500 }));

    const overlay = await loadGtmhPatreonOverlay();
    expect(overlay.item).toEqual([]);
    expect(overlay.feat).toEqual([]);
    expect(overlay.bookData).toEqual({});
  });
});
