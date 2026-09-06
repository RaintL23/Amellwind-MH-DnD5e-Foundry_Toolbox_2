/**
 * Builds Amellwind Conditions & Diseases Foundry Items from the shared registry.
 *
 * Writes:
 *   - conditions/*.json  (fvtt-Item-*)
 *   - diseases/*.json
 *
 * Run: node public/data/foundry-jsons-example/conditions/build-conditions.mjs
 */
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { AMELLWIND_AFFLICTIONS } from "../../scripts/conditions/amellwind-conditions-registry.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../../../..");

const CORE_VERSION = "12.331";
const SYSTEM_ID = "dnd5e";
const SYSTEM_VERSION = "4.4.4";
const MODULE_ID = "Amellwind-MH-RaintDM-module";

const ID_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

function stableId(seed) {
  const hash = createHash("sha1").update(seed).digest();
  let id = "";
  for (let i = 0; i < 16; i += 1) id += ID_ALPHABET[hash[i] % ID_ALPHABET.length];
  return id;
}

const stats = () => ({
  compendiumSource: null,
  duplicateSource: null,
  coreVersion: CORE_VERSION,
  systemId: SYSTEM_ID,
  systemVersion: SYSTEM_VERSION,
  createdTime: null,
  modifiedTime: null,
  lastModifiedBy: null,
});

const emptyUses = () => ({ spent: 0, max: "", recovery: [] });

const midiProps = (identifier) => ({
  ignoreTraits: [],
  triggeredActivityId: "none",
  triggeredActivityConditionText: "",
  triggeredActivityTargets: "targets",
  triggeredActivityRollAs: "self",
  autoConsume: false,
  forceConsumeDialog: "default",
  forceRollDialog: "default",
  forceDamageDialog: "default",
  confirmTargets: "default",
  autoTargetType: "any",
  autoTargetAction: "default",
  automationOnly: false,
  otherActivityCompatible: true,
  identifier,
  displayActivityName: true,
  rollMode: "default",
  chooseEffects: false,
  toggleEffect: false,
  ignoreFullCover: false,
  removeChatButtons: "default",
  magicEffect: false,
  magicDamage: false,
  noConcentrationCheck: false,
  autoCEEffects: "default",
});

function makeApplyActivity({ id, name, identifier, effectId, img, chatFlavor }) {
  return {
    _id: id,
    type: "utility",
    sort: 0,
    name,
    img,
    activation: { type: "action", value: 1, condition: "", override: false },
    consumption: { scaling: { allowed: false, max: "" }, spellSlot: false, targets: [] },
    description: { chatFlavor },
    duration: { value: "1", units: "minute", concentration: false, override: false },
    effects: [{ _id: effectId, onSave: false }],
    range: { value: null, units: "ft", special: "", override: false },
    target: {
      template: {
        count: "",
        contiguous: false,
        type: "",
        size: "",
        width: "",
        height: "",
        units: "ft",
      },
      affects: { count: "1", type: "creature", choice: false, special: "" },
      prompt: true,
      override: false,
    },
    uses: emptyUses(),
    midiProperties: midiProps(identifier),
    roll: { formula: "", name: "", prompt: false, visible: false },
    useConditionText: "",
    useConditionReason: "",
    effectConditionText: "",
  };
}

function makeEffect({ id, def }) {
  return {
    _id: id,
    name: def.name,
    img: def.img,
    type: "base",
    system: {},
    changes: def.changes ?? [],
    disabled: false,
    duration: {
      startTime: null,
      seconds: 60,
      combat: null,
      rounds: 10,
      turns: null,
      startRound: null,
      startTurn: null,
    },
    description: def.summary ?? "",
    origin: null,
    tint: def.tint || "#ffffff",
    transfer: false,
    statuses: [def.id, ...(def.riders ?? [])],
    sort: 0,
    flags: {
      dae: {
        enableCondition: "",
        disableCondition: "",
        stackable: "noneName",
        showIcon: true,
        durationExpression: "",
        specialDuration: [],
      },
      ...(def.effectFlags ?? {}),
      world: {
        amellwindConditions: {
          kind: def.id,
          afflictionKind: def.kind,
        },
      },
    },
    _stats: stats(),
  };
}

function makeItem(def) {
  const itemId = stableId(`${MODULE_ID}::affliction::${def.id}`);
  const effectId = stableId(`${MODULE_ID}::affliction::${def.id}::effect`);
  const activityId = stableId(`${MODULE_ID}::affliction::${def.id}::apply`);
  const kindLabel = def.kind === "disease" ? "Disease" : "Condition";
  const description = `<p><strong>Amellwind ${kindLabel}</strong></p>${def.description}
<p><em>Toggle from the token HUD, or use <strong>Apply Affliction</strong> (Midi applies the Active Effect + status icon).</em></p>`;

  return {
    _id: itemId,
    name: def.name,
    type: "feat",
    img: def.img,
    system: {
      description: {
        value: description,
        chat: `<p>${def.summary}</p>`,
      },
      source: {
        custom: "",
        book: "MHMM",
        page: "",
        license: "",
        rules: "2014",
        revision: 1,
      },
      identifier: def.id,
      type: { value: "feat", subtype: "" },
      requirements: "",
      properties: [],
      activities: {
        [activityId]: makeApplyActivity({
          id: activityId,
          name: "Apply Affliction",
          identifier: `apply-${def.id}`,
          effectId,
          img: def.img,
          chatFlavor: `Apply ${def.name} (1 minute).`,
        }),
      },
      enchant: {},
      prerequisites: { level: null, repeatable: false },
      uses: emptyUses(),
    },
    effects: [makeEffect({ id: effectId, def })],
    folder: null,
    sort: 0,
    ownership: { default: 0 },
    flags: {
      dnd5e: { riders: { activity: [], effect: [] } },
      "midi-qol": {
        fumbleThreshold: null,
        rollAttackPerTarget: "default",
        removeAttackDamageButtons: "default",
        itemCondition: "",
        reactionCondition: "",
        otherCondition: "",
        effectCondition: "",
      },
      midiProperties: {
        autoFailFriendly: false,
        autoSaveFriendly: false,
        magicdam: false,
        magiceffect: false,
        noConcentrationCheck: false,
        toggleEffect: false,
        ignoreTotalCover: false,
      },
      world: {
        amellwindConditions: {
          kind: def.id,
          afflictionKind: def.kind,
        },
      },
    },
    _stats: stats(),
    __meta: { itemId, effectId, activityId },
  };
}

function ensureCleanDir(dir) {
  fs.rmSync(dir, { force: true, recursive: true, maxRetries: 10 });
  fs.mkdirSync(dir, { recursive: true });
}

function slugFile(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const conditionsDir = path.join(__dirname, "conditions");
const diseasesDir = path.join(__dirname, "diseases");
ensureCleanDir(conditionsDir);
ensureCleanDir(diseasesDir);

const built = [];
for (const def of AMELLWIND_AFFLICTIONS) {
  const item = makeItem(def);
  const { __meta, ...doc } = item;
  const folder = def.kind === "disease" ? diseasesDir : conditionsDir;
  const out = path.join(folder, `fvtt-Item-${slugFile(def.name)}.json`);
  fs.writeFileSync(out, `${JSON.stringify(doc, null, 2)}\n`);
  built.push({ ...def, itemId: __meta.itemId, file: path.relative(ROOT, out) });
  console.log("Wrote", path.relative(ROOT, out), `(${__meta.itemId})`);
}

const manifestPath = path.join(__dirname, "afflictions-manifest.json");
fs.writeFileSync(
  manifestPath,
  `${JSON.stringify(
    built.map(({ id, name, kind, itemId, img, file }) => ({ id, name, kind, itemId, img, file })),
    null,
    2,
  )}\n`,
);
console.log("Wrote", path.relative(ROOT, manifestPath));
console.log(`Done: ${built.length} affliction item(s).`);
