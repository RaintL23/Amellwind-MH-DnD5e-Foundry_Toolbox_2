#!/usr/bin/env node
/**
 * Clone a Foundry weapon golden file to the next rarity tier.
 * Run from repo root:
 *   node public/data/foundry-jsons-example/weapons/_clone-tier.mjs light-bowgun very-rare legendary
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const [weaponStem, fromTier, toTier] = process.argv.slice(2);
if (!weaponStem || !fromTier || !toTier) {
  console.error(
    "Usage: node _clone-tier.mjs <weapon-stem> <from-tier> <to-tier>",
  );
  process.exit(1);
}

const tierLabel = {
  uncommon: "Uncommon",
  rare: "Rare",
  "very-rare": "Very Rare",
  legendary: "Legendary",
};

const tierRarity = {
  uncommon: "uncommon",
  rare: "rare",
  "very-rare": "veryRare",
  legendary: "legendary",
};

const tierBonus = {
  uncommon: 0,
  rare: 1,
  "very-rare": 2,
  legendary: 3,
};

const TIER_PATCHES = {
  "light-bowgun": {
    legendary: {
      magazineMax: "15",
      specialAmmoMax: 10,
      magicalBonus: 3,
      replaceInDescription: [
        ["Light Bowgun (Very Rare)", "Light Bowgun (Legendary)"],
        ['"rarity": "veryRare"', '"rarity": "legendary"'],
        ['"tier": "veryRare"', '"tier": "legendary"'],
        ['"specialAmmoMax": 6', '"specialAmmoMax": 10'],
        ['"max": "12"', '"max": "15"'],
        ['"magicalBonus": 2', '"magicalBonus": 3'],
        [
          "Rapid Fire Upgrade II",
          "Rapid Fire Upgrade II</strong></p><div style=\"margin:0.45em 0 0.1em 0.35em;padding:0.4em 0.55em;border-left:2px solid #ff8000;background:rgba(255,255,255,0.03);border-radius:0 3px 3px 0\"><p>▸ Upgrade — <strong style=\"color:#ff8000\">Rapid Fire Upgrade III",
        ],
        [
          "Magazine Upgrade III",
          "Magazine Upgrade III</strong></p><div style=\"margin:0.45em 0 0.1em 0.35em;padding:0.4em 0.55em;border-left:2px solid #ff8000;background:rgba(255,255,255,0.03);border-radius:0 3px 3px 0\"><p>▸ Upgrade — <strong style=\"color:#ff8000\">Magazine Upgrade IV",
        ],
        [
          "Special Ammo Upgrade II",
          "Special Ammo Upgrade II</strong></p><div style=\"margin:0.45em 0 0.1em 0.35em;padding:0.4em 0.55em;border-left:2px solid #ff8000;background:rgba(255,255,255,0.03);border-radius:0 3px 3px 0\"><p>▸ Upgrade — <strong style=\"color:#ff8000\">Special Ammo Upgrade III",
        ],
        [
          "Wyvernblast Upgrade I",
          "Wyvernblast Upgrade I</strong></p><div style=\"margin:0.45em 0 0.1em 0.35em;padding:0.4em 0.55em;border-left:2px solid #ff8000;background:rgba(255,255,255,0.03);border-radius:0 3px 3px 0\"><p>▸ Upgrade — <strong style=\"color:#ff8000\">Wyvernblast Upgrade II",
        ],
        ["[[/r 1d8]] Fire damage.</p></div></div>", "[[/r 1d10]] Fire damage. Additionally, you can now plant or shoot a Wyvernblast charge as part of the Attack action instead of requiring a Bonus Action.</p></div></div>"],
        ["detonations increases to [[/r 1d8]]", "detonations increases to [[/r 1d10]]"],
      ],
    },
  },
  "heavy-bowgun": {
    "very-rare": {
      magazineMax: "10",
      specialAmmoMax: 6,
      magicalBonus: 2,
      fromTierLabel: "Rare",
      toTierLabel: "Very Rare",
    },
    legendary: {
      magazineMax: "12",
      specialAmmoMax: 8,
      magicalBonus: 3,
      fromTierLabel: "Very Rare",
      toTierLabel: "Legendary",
    },
  },
  bow: {
    "very-rare": {
      tracerMax: 4,
      magicalBonus: 2,
      fromTierLabel: "Rare",
      toTierLabel: "Very Rare",
    },
    legendary: {
      tracerMax: 5,
      magicalBonus: 3,
      fromTierLabel: "Very Rare",
      toTierLabel: "Legendary",
    },
  },
};

const srcPath = path.join(
  __dirname,
  weaponStem,
  `fvtt-Item-${weaponStem}-${fromTier}.json`,
);
const destPath = path.join(
  __dirname,
  weaponStem,
  `fvtt-Item-${weaponStem}-${toTier}.json`,
);

let text = readFileSync(srcPath, "utf8");
const patch = TIER_PATCHES[weaponStem]?.[toTier];

if (!patch) {
  console.error(`No patch config for ${weaponStem} -> ${toTier}`);
  process.exit(1);
}

const fromLabel = patch.fromTierLabel ?? tierLabel[fromTier];
const toLabel = patch.toTierLabel ?? tierLabel[toTier];
const weaponName = weaponStem
  .split("-")
  .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
  .join(" ");

text = text.replaceAll(`${weaponName} (${fromLabel})`, `${weaponName} (${toLabel})`);
text = text.replaceAll(
  `"rarity": "${tierRarity[fromTier]}"`,
  `"rarity": "${tierRarity[toTier]}"`,
);

if (patch.magicalBonus != null) {
  text = text.replace(
    /"magicalBonus": \d+/,
    `"magicalBonus": ${patch.magicalBonus}`,
  );
  if (patch.magicalBonus > 0 && !text.includes('"mgc"')) {
    text = text.replace(
      /"properties": \[([^\]]+)\]/,
      (m, inner) =>
        inner.includes("mgc") ? m : `"properties": [${inner}, "mgc"]`,
    );
  }
}

if (patch.magazineMax) {
  text = text.replace(/"max": "\d+"/, `"max": "${patch.magazineMax}"`);
}

if (patch.specialAmmoMax != null) {
  text = text.replace(
    /"specialAmmoMax": \d+/,
    `"specialAmmoMax": ${patch.specialAmmoMax}`,
  );
}

if (patch.tracerMax != null) {
  if (text.includes('"tracerMax"')) {
    text = text.replace(/"tracerMax": \d+/, `"tracerMax": ${patch.tracerMax}`);
  }
  text = text.replace(/"max": "\d+"/, `"max": "${patch.tracerMax}"`);
}

const flagKey =
  weaponStem === "light-bowgun"
    ? "lbg"
    : weaponStem === "heavy-bowgun"
      ? "hbg"
      : weaponStem === "bow"
        ? "bow"
        : null;

if (flagKey && tierRarity[toTier]) {
  text = text.replace(
    `"tier": "${tierRarity[fromTier]}"`,
    `"tier": "${tierRarity[toTier]}"`,
  );
}

if (patch.replaceInDescription) {
  for (const [from, to] of patch.replaceInDescription) {
    text = text.replaceAll(from, to);
  }
}

// New _id for top-level item
text = text.replace(/"_id": "[^"]+"/, `"_id": "${crypto.randomUUID().slice(0, 16)}"`);

writeFileSync(destPath, text);
console.log(`Wrote ${destPath}`);
