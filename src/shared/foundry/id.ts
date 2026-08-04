import type { FoundryStats } from "./types";
import { FOUNDRY_EXPORT_TARGET } from "./target";

const ID_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

/** Foundry document ids are 16-char base62 strings. */
export function foundryId(): string {
  let id = "";
  const cryptoObj =
    typeof globalThis !== "undefined" ? globalThis.crypto : undefined;
  if (cryptoObj?.getRandomValues) {
    const bytes = new Uint8Array(16);
    cryptoObj.getRandomValues(bytes);
    for (let i = 0; i < 16; i++) {
      id += ID_ALPHABET[bytes[i] % ID_ALPHABET.length];
    }
    return id;
  }
  for (let i = 0; i < 16; i++) {
    id += ID_ALPHABET[Math.floor(Math.random() * ID_ALPHABET.length)];
  }
  return id;
}

/** Deterministic 16-char Foundry id from a seed (stable across rarity exports). */
export function foundryIdFromSeed(seed: string): string {
  let h1 = 2166136261;
  let h2 = 2166136261 ^ 0x9e3779b9;
  for (let i = 0; i < seed.length; i++) {
    const c = seed.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 16777619);
    h2 = Math.imul(h2 ^ c, 16777619);
  }
  let id = "";
  const x = h1 >>> 0;
  const y = h2 >>> 0;
  for (let i = 0; i < 16; i++) {
    const n = i < 8 ? x : y;
    const shift = (i % 8) * 4;
    id += ID_ALPHABET[(n >>> shift) % ID_ALPHABET.length];
  }
  return id;
}

/** @deprecated Use FOUNDRY_EXPORT_TARGET.coreVersion */
export const CORE_VERSION = FOUNDRY_EXPORT_TARGET.coreVersion;
/** @deprecated Use FOUNDRY_EXPORT_TARGET.systemVersion */
export const SYSTEM_VERSION = FOUNDRY_EXPORT_TARGET.systemVersion;

export function buildStats(): FoundryStats {
  const now = Date.now();
  return {
    compendiumSource: null,
    duplicateSource: null,
    coreVersion: FOUNDRY_EXPORT_TARGET.coreVersion,
    systemId: FOUNDRY_EXPORT_TARGET.systemId,
    systemVersion: FOUNDRY_EXPORT_TARGET.systemVersion,
    createdTime: now,
    modifiedTime: now,
    lastModifiedBy: null,
  };
}

export const DEFAULT_OWNERSHIP: Record<string, number> = { default: 0 };

export function buildPrototypeToken(
  name: string,
  textureSrc?: string | null,
): Record<string, unknown> {
  return {
    name,
    displayName: 0,
    actorLink: true,
    appendNumber: false,
    prependAdjective: false,
    width: 1,
    height: 1,
    texture: {
      src: textureSrc || "icons/svg/mystery-man.svg",
      anchorX: 0.5,
      anchorY: 0.5,
      offsetX: 0,
      offsetY: 0,
      fit: "contain",
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
      tint: "#ffffff",
      alphaThreshold: 0.75,
    },
    hexagonalShape: 0,
    lockRotation: false,
    rotation: 0,
    alpha: 1,
    disposition: 1,
    displayBars: 0,
    bar1: { attribute: "attributes.hp" },
    bar2: { attribute: null },
    light: {
      negative: false,
      priority: 0,
      alpha: 0.5,
      angle: 360,
      bright: 0,
      color: null,
      coloration: 1,
      dim: 0,
      attenuation: 0.5,
      luminosity: 0.5,
      saturation: 0,
      contrast: 0,
      shadows: 0,
      animation: { type: null, speed: 5, intensity: 5, reverse: false },
      darkness: { min: 0, max: 1 },
    },
    sight: {
      enabled: true,
      range: 0,
      angle: 360,
      visionMode: "basic",
      color: null,
      attenuation: 0.1,
      brightness: 0,
      saturation: 0,
      contrast: 0,
    },
    detectionModes: [],
    flags: {},
    randomImg: false,
  };
}
