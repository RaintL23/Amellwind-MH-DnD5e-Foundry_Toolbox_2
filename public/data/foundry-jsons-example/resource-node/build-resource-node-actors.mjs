/**
 * Builds environment Resource Node actors (one per Environment × Tier × Category).
 *
 * Each actor embeds:
 *   - Resource Node feature (category + harvest DC from the environment table)
 *   - Hidden Detection feature (Passive Perception DC by tier)
 *   - Loot stacks for every resource entry in that column (table odds preserved)
 *
 * Icons: category mh-icons (herb / mushroom / minerals / fish / bug / bones),
 * with honey.webp for Honey.
 *
 * Run: node public/data/foundry-jsons-example/resource-node/build-resource-node-actors.mjs
 */
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../../../..");
const ENV_DATA = path.join(ROOT, "src/features/amellwind/environments/data/environment.data.ts");
const RESOURCE_DATA = path.join(ROOT, "src/features/amellwind/resources/data/resource.data.ts");
const OUT_DIR = path.join(__dirname, "actors");
const RESOURCE_NODE_ITEM = path.join(__dirname, "fvtt-Item-resource-node.json");
const HIDDEN_DETECT_ITEM = path.join(__dirname, "../hidden-detect/fvtt-Item-hidden-detection.json");

const CORE_VERSION = "12.331";
const SYSTEM_ID = "dnd5e";
const SYSTEM_VERSION = "4.4.4";

const ID_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

const CATEGORY_ICONS = {
  Bonepiles: "mh-icons/bones.webp",
  Fish: "mh-icons/fish.webp",
  Insects: "mh-icons/bug.webp",
  Minerals: "mh-icons/minerals.webp",
  Mushrooms: "mh-icons/mushroom.webp",
  Plants: "mh-icons/herb.webp",
};

/** Known spelling drift between environment tables and resource.data.ts */
const NAME_ALIASES = {
  "Burst Arowana": "Burst Arrowana",
  "Bomb Arowana": "Bomb Arrowana",
  "Lg Monsterbone": "Lg Monster Bone",
  "Med Monster Bone": "Med Monsterbone",
  "Sm Monster Bone": "Sm Monsterbone",
  Dragonseed: "Dragon Seed",
  "Elder Dragonbone": "Elder Dragon Bone",
  "Gloamgrass Root": "Gloamgrass Herb",
  "Insect Husks": "Insect Husk",
  "Sm BoneHusk": "Sm Bone Husk",
  "Bird Wyvern bone": "Bird Wyvern Bone",
  Lifecrystals: "Lifecrystals",
};

/** Parse "Honey x5" → { baseName: "Honey", quantity: 5 } */
const parseTableEntry = (rawName) => {
  const text = String(rawName ?? "").trim();
  const m = text.match(/^(.*?)\s+[x×](\d+)\s*$/i);
  if (m) {
    return { baseName: m[1].trim(), quantity: Math.max(1, Number(m[2]) || 1) };
  }
  return { baseName: text, quantity: 1 };
};

const stableId = (seed) => {
  const hash = createHash("sha1").update(seed).digest();
  let id = "";
  for (let i = 0; i < 16; i += 1) id += ID_ALPHABET[hash[i] % ID_ALPHABET.length];
  return id;
};

const slugify = (value) =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const escHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const passiveDcForLevelRange = (levelRange) => {
  const m = String(levelRange).match(/(\d+)\s*-\s*(\d+)/);
  if (!m) return 15;
  const mid = (Number(m[1]) + Number(m[2])) / 2;
  if (mid <= 5) return 12;
  if (mid <= 10) return 15;
  if (mid <= 16) return 18;
  return 21;
};

const parseSellValue = (sellValue) => {
  const m = String(sellValue ?? "")
    .trim()
    .match(/^(\d+(?:\.\d+)?)\s*(cp|sp|ep|gp|pp)$/i);
  if (!m) return { value: 0, denomination: "gp" };
  return { value: Number(m[1]), denomination: m[2].toLowerCase() };
};

const rarityKey = (rarity) => {
  const map = {
    Common: "common",
    Uncommon: "uncommon",
    Rare: "rare",
    "Very Rare": "veryRare",
    Legendary: "legendary",
  };
  return map[rarity] ?? "";
};

const itemIconFor = (name, category) => {
  if (String(name).toLowerCase() === "honey") return "mh-icons/honey.webp";
  return CATEGORY_ICONS[category] ?? "mh-icons/mystery-item.webp";
};

const parseEnvironments = (src) => {
  const text = src.replace(/\r\n/g, "\n");
  const re =
    /\{\n    name: "([^"]+)",\n    biome: "([^"]+)",\n    navigationDC: (\d+),\n    encounterDC: (\d+),\n    investigationDC: (\d+),/g;
  const envs = [];
  let m;
  while ((m = re.exec(text))) {
    envs.push({
      name: m[1],
      biome: m[2],
      navigationDC: Number(m[3]),
      encounterDC: Number(m[4]),
      investigationDC: Number(m[5]),
      index: m.index,
    });
  }

  for (let i = 0; i < envs.length; i += 1) {
    const start = envs[i].index;
    const end = i + 1 < envs.length ? envs[i + 1].index : text.length;
    const block = text.slice(start, end);
    const tierStarts = [...block.matchAll(/levelRange: "([^"]+)"/g)];
    const tiers = [];
    for (let t = 0; t < tierStarts.length; t += 1) {
      const tStart = tierStarts[t].index;
      const tEnd = t + 1 < tierStarts.length ? tierStarts[t + 1].index : block.length;
      const tb = block.slice(tStart, tEnd);
      const columns = [
        ...tb.matchAll(/\{ category: "(Bonepiles|Fish|Insects|Minerals|Mushrooms|Plants)", dc: (\d+) \}/g),
      ].map((x) => ({ category: x[1], dc: Number(x[2]) }));
      const rows = [...tb.matchAll(/\{ roll: "([^"]+)", items: \[([^\]]+)\] \}/g)].map((x) => ({
        roll: x[1],
        items: x[2].split(",").map((s) => s.trim().replace(/^"|"$/g, "")),
      }));
      tiers.push({ levelRange: tierStarts[t][1], columns, rows });
    }
    envs[i].tiers = tiers;
  }
  return envs;
};

const parseResourceCatalog = (src) => {
  const text = src.replace(/\r\n/g, "\n");
  const byName = new Map();
  const re =
    /\{\s*name: "([^"]+)",\s*category: "(Bonepiles|Fish|Insects|Minerals|Mushrooms|Plants)",\s*rarity: "([^"]+)",\s*details: "((?:\\.|[^"\\])*)",\s*sellValue: "([^"]+)",\s*isCraftingMaterial: (true|false)\s*\}/g;
  let m;
  while ((m = re.exec(text))) {
    const name = m[1];
    byName.set(name.toLowerCase(), {
      name,
      category: m[2],
      rarity: m[3],
      details: m[4].replace(/\\"/g, '"').replace(/\\'/g, "'"),
      sellValue: m[5],
      isCraftingMaterial: m[6] === "true",
    });
  }
  return byName;
};

const resolveResource = (rawName, category, catalog) => {
  const { baseName, quantity } = parseTableEntry(rawName);
  const aliased = NAME_ALIASES[baseName] ?? baseName;
  const hit = catalog.get(aliased.toLowerCase());
  if (hit) return { ...hit, tableName: rawName, quantity };
  return {
    name: aliased,
    tableName: rawName,
    category,
    rarity: "Common",
    details: `${aliased} — Amellwind field resource.`,
    sellValue: "0 gp",
    isCraftingMaterial: true,
    unknown: true,
    quantity,
  };
};

const makeLootItem = ({ seed, resource, stackIndex }) => {
  const price = parseSellValue(resource.sellValue);
  const img = itemIconFor(resource.name, resource.category);
  const id = stableId(`${seed}::loot::${stackIndex}::${resource.name}`);
  const identifier = slugify(resource.name);
  const rarity = rarityKey(resource.rarity);
  const details = escHtml(resource.details);
  const sell = escHtml(resource.sellValue);
  const quantity = Math.max(1, Number(resource.quantity) || 1);
  return {
    _id: id,
    name: resource.name,
    type: "loot",
    img,
    system: {
      description: {
        value: `<p><strong>${escHtml(resource.name)}</strong> <em>(${escHtml(resource.category)} · ${escHtml(resource.rarity)})</em></p><p>${details}</p><p>Sell value: ${sell}.${resource.isCraftingMaterial ? " Crafting material." : ""}</p>`,
        chat: "",
      },
      identifier,
      source: {
        custom: "",
        book: "AGMH",
        page: "",
        license: "",
        rules: "2024",
        revision: 1,
      },
      identified: true,
      unidentified: { name: "" },
      container: null,
      quantity,
      weight: { value: 0, units: "lb" },
      price: { value: price.value, denomination: price.denomination },
      rarity,
      properties: [],
      type: { value: "", subtype: "" },
    },
    effects: [],
    folder: null,
    sort: 100 + stackIndex,
    ownership: { default: 0 },
    flags: {
      world: {
        resourceNodeLoot: true,
        resourceCategory: resource.category,
        tableName: resource.tableName,
        grantQuantity: quantity,
      },
    },
    _stats: {
      compendiumSource: null,
      duplicateSource: null,
      coreVersion: CORE_VERSION,
      systemId: SYSTEM_ID,
      systemVersion: SYSTEM_VERSION,
      createdTime: null,
      modifiedTime: null,
      lastModifiedBy: null,
    },
  };
};

/** Slim embedded feature: keep automation flags + sheet text, drop huge Item Macros. */
const slimFeature = (template, { seed, nameSuffix, img, flagPatch, descriptionExtra }) => {
  const data = structuredClone(template);
  data._id = stableId(`${seed}::${data.system?.identifier ?? data.name}`);
  data.img = img;
  data.folder = null;
  data.sort = 0;
  if (nameSuffix) data.name = `${data.name} (${nameSuffix})`;

  if (descriptionExtra) {
    const base = data.system?.description?.value ?? "";
    data.system.description.value = `${base}\n<p>${descriptionExtra}</p>`;
  }

  // Re-key activities with stable ids unique to this actor embed.
  const activities = data.system?.activities ?? {};
  const nextActivities = {};
  let actSort = 0;
  for (const act of Object.values(activities)) {
    const actId = stableId(`${seed}::${data.system.identifier}::act::${act.identifier ?? act.name}`);
    nextActivities[actId] = {
      ...act,
      _id: actId,
      img,
      sort: actSort++,
    };
  }
  data.system.activities = nextActivities;

  delete data.flags?.itemacro;
  if (data.flags?.["midi-qol"]) {
    data.flags["midi-qol"].onUseMacroName = "";
    delete data.flags["midi-qol"].onUseMacroParts;
  }

  if (flagPatch.resourceNode) {
    data.flags = data.flags ?? {};
    data.flags.world = data.flags.world ?? {};
    data.flags.world.resourceNode = {
      ...(data.flags.world.resourceNode ?? {}),
      ...flagPatch.resourceNode,
    };
  }
  if (flagPatch.hiddenDetect) {
    data.flags = data.flags ?? {};
    data.flags.world = data.flags.world ?? {};
    data.flags.world.hiddenDetect = {
      ...(data.flags.world.hiddenDetect ?? {}),
      ...flagPatch.hiddenDetect,
    };
  }

  data._stats = {
    compendiumSource: null,
    duplicateSource: null,
    coreVersion: CORE_VERSION,
    systemId: SYSTEM_ID,
    systemVersion: SYSTEM_VERSION,
    createdTime: null,
    modifiedTime: null,
    lastModifiedBy: null,
  };
  return data;
};

const abilityBlock = (value) => ({
  value,
  proficient: 0,
  max: null,
  bonuses: { check: "", save: "" },
});

const makeActor = ({
  env,
  tier,
  column,
  lootItems,
  resourceNodeFeature,
  hiddenDetectFeature,
  img,
  passiveDc,
}) => {
  const seed = `resource-node-actor::${env.name}::${tier.levelRange}::${column.category}`;
  const actorId = stableId(seed);
  const actorName = `${env.name} — ${column.category} (Tier ${tier.levelRange})`;
  const description = `<p><strong>${escHtml(actorName)}</strong></p>
<p>Amellwind field gathering node for <em>${escHtml(env.name)}</em> (${escHtml(env.biome)}), party levels <strong>${escHtml(tier.levelRange)}</strong>.</p>
<ul>
<li><strong>Resource Node:</strong> ${escHtml(column.category)} harvest DC <strong>${column.dc}</strong>. Double-click the token to gather (Item Piles–style).</li>
<li><strong>Hidden Detection:</strong> Passive Perception DC <strong>${passiveDc}</strong> (tier-scaled). Place the token <em>hidden</em>; proximity reveals it.</li>
<li><strong>Loot pool:</strong> ${lootItems.length} stack(s) from the environment resource table (roll 1dN on success).</li>
</ul>
<p><em>Requires Midi QOL + Item Macro modules. Resource Node hooks arm from the module script; Hidden Detection arms from the module script / Sync macro.</em></p>`;

  return {
    _id: actorId,
    name: actorName,
    type: "npc",
    img,
    system: {
      description: { value: description, chat: "", unidentified: "" },
      details: {
        type: { value: "custom", subtype: "", swarm: "", custom: "Resource Node" },
        alignment: "unaligned",
        race: "",
        biography: { value: description, public: "" },
        cr: 0,
        spellLevel: 0,
        source: { custom: "", book: "AGMH", page: "", license: "", rules: "2024", revision: 1 },
      },
      abilities: {
        str: abilityBlock(10),
        dex: abilityBlock(10),
        con: abilityBlock(10),
        int: abilityBlock(10),
        wis: abilityBlock(10),
        cha: abilityBlock(10),
      },
      attributes: {
        ac: { flat: 10, calc: "flat", formula: "" },
        hp: { value: 1, max: 1, temp: 0, tempmax: 0, formula: "" },
        init: { ability: "dex", bonus: "" },
        movement: {
          burrow: null,
          climb: null,
          fly: null,
          swim: null,
          walk: 0,
          units: "ft",
          hover: false,
        },
        senses: {
          darkvision: 0,
          blindsight: 0,
          tremorsense: 0,
          truesight: 0,
          units: "ft",
          special: "",
        },
        spellcasting: "",
        exhaustion: 0,
      },
      traits: {
        size: "med",
        di: { value: [], bypasses: [], custom: "" },
        dr: { value: [], bypasses: [], custom: "" },
        dv: { value: [], bypasses: [], custom: "" },
        ci: { value: [], custom: "" },
        languages: { value: [], custom: "" },
      },
      currency: { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 },
    },
    prototypeToken: {
      name: actorName,
      displayName: 0,
      actorLink: true,
      width: 1,
      height: 1,
      texture: {
        src: img,
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
      lockRotation: false,
      rotation: 0,
      alpha: 1,
      disposition: 0,
      displayBars: 0,
      bar1: { attribute: null },
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
        enabled: false,
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
      hidden: true,
    },
    items: [resourceNodeFeature, hiddenDetectFeature, ...lootItems],
    effects: [],
    folder: null,
    sort: 0,
    ownership: { default: 0 },
    flags: {
      world: {
        resourceNodeActor: true,
        environment: env.name,
        levelRange: tier.levelRange,
        category: column.category,
        harvestDc: column.dc,
        hiddenPassiveDc: passiveDc,
      },
    },
    _stats: {
      compendiumSource: null,
      duplicateSource: null,
      coreVersion: CORE_VERSION,
      systemId: SYSTEM_ID,
      systemVersion: SYSTEM_VERSION,
      createdTime: null,
      modifiedTime: null,
      lastModifiedBy: null,
    },
  };
};

const rmDirContents = (dir) => {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    fs.rmSync(full, { recursive: true, force: true });
  }
};

const main = () => {
  if (!fs.existsSync(RESOURCE_NODE_ITEM) || !fs.existsSync(HIDDEN_DETECT_ITEM)) {
    throw new Error(
      "Missing feature templates. Run build-resource-node.mjs and build-hidden-detection.mjs first.",
    );
  }

  const environments = parseEnvironments(fs.readFileSync(ENV_DATA, "utf8"));
  const catalog = parseResourceCatalog(fs.readFileSync(RESOURCE_DATA, "utf8"));
  const resourceNodeTemplate = JSON.parse(fs.readFileSync(RESOURCE_NODE_ITEM, "utf8"));
  const hiddenDetectTemplate = JSON.parse(fs.readFileSync(HIDDEN_DETECT_ITEM, "utf8"));

  rmDirContents(OUT_DIR);
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const unknown = new Set();
  let actorCount = 0;
  let lootCount = 0;

  for (const env of environments) {
    const envSlug = slugify(env.name);
    for (const tier of env.tiers) {
      const tierSlug = `tier-${slugify(tier.levelRange)}`;
      const passiveDc = passiveDcForLevelRange(tier.levelRange);
      for (let colIdx = 0; colIdx < tier.columns.length; colIdx += 1) {
        const column = tier.columns[colIdx];
        const img = CATEGORY_ICONS[column.category];
        const seed = `resource-node-actor::${env.name}::${tier.levelRange}::${column.category}`;

        // One loot stack per table row cell (preserves 1dN odds).
        const lootItems = [];
        tier.rows.forEach((row, rowIdx) => {
          const rawName = row.items[colIdx];
          if (!rawName) return;
          const resource = resolveResource(rawName, column.category, catalog);
          if (resource.unknown) unknown.add(`${rawName} (${env.name} / ${tier.levelRange} / ${column.category})`);
          lootItems.push(makeLootItem({ seed, resource, stackIndex: rowIdx }));
        });

        const resourceNodeFeature = slimFeature(resourceNodeTemplate, {
          seed,
          img,
          flagPatch: {
            resourceNode: {
              isFeature: true,
              enabled: true,
              category: column.category,
              dc: column.dc,
              requireTool: column.category !== "Bonepiles",
              interactionDistance: 5,
              attemptedBy: [],
            },
          },
          descriptionExtra: `<em>Preconfigured for ${escHtml(env.name)} · Tier ${escHtml(tier.levelRange)} · ${escHtml(column.category)} (DC ${column.dc}).</em>`,
        });

        const hiddenDetectFeature = slimFeature(hiddenDetectTemplate, {
          seed,
          img: "mh-icons/mystery-item.webp",
          flagPatch: {
            hiddenDetect: {
              isFeature: true,
              enabled: true,
              rangeFt: 30,
              detectMode: "passivePerception",
              skill: "prc",
              dc: passiveDc,
              wallsBlock: false,
              allowRetryOnFail: false,
              revealToParty: false,
              whisperToGm: true,
              revealed: false,
              revealedBy: null,
              failedBy: [],
              inRangeBy: {},
              visibleToUsers: [],
            },
          },
          descriptionExtra: `<em>Preconfigured Passive Perception DC ${passiveDc} for Tier ${escHtml(tier.levelRange)}.</em>`,
        });
        hiddenDetectFeature.sort = 1;

        const actor = makeActor({
          env,
          tier,
          column,
          lootItems,
          resourceNodeFeature,
          hiddenDetectFeature,
          img,
          passiveDc,
        });

        const dir = path.join(OUT_DIR, envSlug, tierSlug);
        fs.mkdirSync(dir, { recursive: true });
        const fileName = `fvtt-Actor-${envSlug}-${tierSlug}-${slugify(column.category)}.json`;
        fs.writeFileSync(path.join(dir, fileName), `${JSON.stringify(actor, null, 2)}\n`);

        actorCount += 1;
        lootCount += lootItems.length;
      }
    }
  }

  console.log(`Wrote ${actorCount} actors under ${path.relative(ROOT, OUT_DIR)}`);
  console.log(`Embedded loot stacks: ${lootCount}`);
  if (unknown.size) {
    console.warn(`Unknown resource names (${unknown.size}):`);
    for (const name of [...unknown].sort()) console.warn(`  - ${name}`);
  }
};

main();
