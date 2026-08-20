import { describe, expect, it } from "vitest";
import { resolveMhTokenPath } from "./mh-token.utils";

describe("resolveMhTokenPath", () => {
  it("resolves the original monster name to its curated token", () => {
    expect(resolveMhTokenPath("Dire Miralis")).toBe("/mh-tokens/dire-miralis.webp");
    expect(resolveMhTokenPath("Namielle")).toBe("/mh-tokens/namielle.webp");
  });

  it("reuses the original token when a prefixed variant has no art", () => {
    expect(resolveMhTokenPath("Tempered Dire Miralis")).toBe(
      "/mh-tokens/dire-miralis.webp",
    );
    expect(resolveMhTokenPath("Archtempered Dire Miralis")).toBe(
      "/mh-tokens/dire-miralis.webp",
    );
    expect(resolveMhTokenPath("Archtempered Namielle")).toBe(
      "/mh-tokens/namielle.webp",
    );
    expect(resolveMhTokenPath("Tempered Kulu-ya-ku")).toBe(
      "/mh-tokens/kulu-ya-ku.webp",
    );
  });

  it("reuses the original token when a suffixed variant has no art", () => {
    expect(resolveMhTokenPath("Arzuros Cub")).toBe("/mh-tokens/arzuros.webp");
    expect(resolveMhTokenPath("Girros Pup")).toBe("/mh-tokens/girros.webp");
  });

  it("keeps a subspecies token when that variant has its own art", () => {
    expect(resolveMhTokenPath("Azure Rathalos")).toBe(
      "/mh-tokens/azure-rathalos.webp",
    );
    expect(resolveMhTokenPath("Great Jagras")).toBe(
      "/mh-tokens/great-jagras.webp",
    );
    expect(resolveMhTokenPath("Great Izuchi")).toBe(
      "/mh-tokens/great-izuchi-token.webp",
    );
  });

  it("returns undefined when neither the variant nor an original has art", () => {
    expect(resolveMhTokenPath("Tempered Espinas")).toBeUndefined();
    expect(resolveMhTokenPath("Unknown Monster")).toBeUndefined();
  });
});
