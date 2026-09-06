/**
 * Amellwind MH conditions & diseases — shared registry for Foundry module.
 * Used by build-conditions.mjs (JSON items) and amellwind-conditions-engine.js (CONFIG).
 *
 * Target: Foundry 12.331 / dnd5e 4.4.4 / Midi QOL + DAE.
 */

/** @typedef {"condition"|"disease"} AfflictionKind */

/**
 * @typedef {object} AfflictionDef
 * @property {string} id Stable status / conditionTypes key (lowercase, no spaces).
 * @property {string} name Display name.
 * @property {AfflictionKind} kind
 * @property {string} img Token HUD / item icon.
 * @property {string} summary Short HUD / chat blurb.
 * @property {string} description HTML rules text.
 * @property {string[]} [riders] Extra statuses applied with this one (e.g. restrained).
 * @property {string[]} [conditionEffects] Keys of CONFIG.DND5E.conditionEffects to join.
 * @property {object[]} [changes] ActiveEffect changes applied when the status is active.
 * @property {Record<string, unknown>} [effectFlags] Extra AE flags (midi-qol overtime, etc.).
 * @property {string} [tint]
 */

/** ActiveEffect change modes (Foundry CONST.ACTIVE_EFFECT_MODES). */
export const MODE = {
  CUSTOM: 0,
  MULTIPLY: 1,
  ADD: 2,
  DOWNGRADE: 3,
  UPGRADE: 4,
  OVERRIDE: 5,
};

/** @type {AfflictionDef[]} */
export const AMELLWIND_AFFLICTIONS = [
  {
    id: "bloodblight",
    name: "Bloodblight",
    kind: "condition",
    img: "systems/dnd5e/icons/svg/statuses/bleeding.svg",
    tint: "#aa2222",
    summary:
      "Bleed: 1d10 HP at end of turn if you haven't attacked/dealt damage; healing halved.",
    description: `<p>A creature who is afflicted with bloodblight bleeds profusely. While afflicted, a creature loses <strong>1d10</strong> hit points at the end of each of its turns if it hasn't attacked or dealt damage to a hostile creature since the start of its turn. When it would regain hit points, it regains only half as many.</p>`,
    changes: [
      {
        key: "flags.midi-qol.halveHealing",
        mode: MODE.CUSTOM,
        value: "1",
        priority: 20,
      },
    ],
    effectFlags: {
      "midi-qol": {
        // Reminder damage; GM skips if the creature attacked / dealt damage this turn.
        overTime:
          "turn=end,damageRoll=1d10,damageType=none,label=Bloodblight,killAnim=true",
      },
    },
  },
  {
    id: "dragonblight",
    name: "Dragonblight",
    kind: "condition",
    img: "systems/dnd5e/icons/svg/statuses/cursed.svg",
    tint: "#6622aa",
    summary:
      "Can't deal cold/fire/lightning/necrotic/thunder damage; can't impose blinded, charmed, paralyzed, poisoned, or petrified.",
    description: `<p>While afflicted with dragonblight, the target can't deal cold, fire, lightning, necrotic, or thunder damage with its spells and attacks, and it can't impose any of the following conditions on other creatures: blinded, charmed, paralyzed, poisoned, and petrified. Dragonblight can be cured early with the <em>lesser restoration</em> spell or similar magic.</p>
<p><em>Token status indicates the affliction; elemental lockout is enforced at the table / by boss macros.</em></p>`,
    changes: [],
  },
  {
    id: "frozen",
    name: "Frozen",
    kind: "condition",
    img: "icons/magic/water/barrier-ice-crystal-wall-faceted-blue.webp",
    tint: "#88ccff",
    summary:
      "Speed −10 ft; can't attack or cast; Dex saves at disadvantage. Ice shell AC 10 / 15 HP (vuln fire, immune cold).",
    description: `<p>A frozen creature's speed is reduced by <strong>10 feet</strong>. The creature cannot attack or use spells and has disadvantage on Dexterity saving throws. For every 1 minute a creature is frozen, it gains one level of exhaustion.</p>
<p>A creature that is frozen has its body encased in ice and snow. This ice and snow can be attacked and destroyed (<strong>AC 10; hp 15</strong>; vulnerability to fire damage; immunity to cold damage), ending the frozen condition on the creature.</p>`,
    changes: [
      {
        key: "system.attributes.movement.walk",
        mode: MODE.ADD,
        value: "-10",
        priority: 20,
      },
      {
        key: "flags.midi-qol.disadvantage.ability.save.dex",
        mode: MODE.CUSTOM,
        value: "1",
        priority: 20,
      },
      {
        key: "flags.midi-qol.fail.attack",
        mode: MODE.CUSTOM,
        value: "1",
        priority: 20,
      },
      {
        key: "flags.midi-qol.fail.spell",
        mode: MODE.CUSTOM,
        value: "1",
        priority: 20,
      },
    ],
  },
  {
    id: "slick",
    name: "Slick",
    kind: "condition",
    img: "icons/magic/water/bubbles-air-water-blue.webp",
    tint: "#44aadd",
    summary:
      "Half speed; Dex saves at disadvantage; disad on grapple checks, adv to escape with Acrobatics. Action to wipe off.",
    description: `<p>A creature who is slick is covered in a slippery or slimy liquid. This liquid coats the body making it difficult to move or avoid attacks without slipping.</p>
<ul>
<li>Disadvantage on Dexterity saving throws.</li>
<li>Can only move up to half its speed.</li>
<li>Disadvantage when attempting to grapple a creature, but advantage when attempting to escape a grapple using Acrobatics.</li>
<li>A creature can use its action on itself or another adjacent creature to wipe off the liquid, removing the effect.</li>
</ul>`,
    conditionEffects: ["halfMovement"],
    changes: [
      {
        key: "flags.midi-qol.disadvantage.ability.save.dex",
        mode: MODE.CUSTOM,
        value: "1",
        priority: 20,
      },
    ],
  },
  {
    id: "tarred",
    name: "Tarred",
    kind: "condition",
    img: "systems/dnd5e/icons/svg/statuses/restrained.svg",
    tint: "#332211",
    summary:
      "Restrained; immune to disarm; can't use objects/weapons not already in hand. Ends (and ignites) on fire damage.",
    description: `<p>A creature, object, or area who is tarred is covered in a dark brown or black viscous liquid. This liquid sticks to anything it touches and is highly flammable.</p>
<ul>
<li>A creature who is tarred is <strong>restrained</strong>, immune to being disarmed, and cannot use an object or weapon not already in hand.</li>
<li>A tarred object cannot be moved or used. An area that is tarred is difficult terrain.</li>
<li>The condition ends if the creature, object, or area takes fire damage. When it ends this way, the target <strong>ignites</strong> (1d10 fire at the start of each turn until doused). An ignited area burns for 1 minute.</li>
</ul>`,
    riders: ["restrained"],
    changes: [],
  },
  {
    id: "stench",
    name: "Stench",
    kind: "condition",
    img: "systems/dnd5e/icons/svg/statuses/poisoned.svg",
    tint: "#668822",
    summary:
      "Disadvantage on Concentration; can't eat/drink (including potions); auto-fail Stealth vs creatures that can smell you.",
    description: `<p>A creature that is stenched is enveloped by a nauseating odor that disrupts its focus and draws unwanted attention.</p>
<ul>
<li>Disadvantage on Concentration checks to maintain spells or abilities.</li>
<li>Can't eat or drink (including potions).</li>
<li>Automatically fails Dexterity (Stealth) checks against any creature that can smell it.</li>
</ul>`,
    changes: [
      {
        key: "flags.midi-qol.disadvantage.concentration",
        mode: MODE.CUSTOM,
        value: "1",
        priority: 20,
      },
    ],
  },
  {
    id: "thunderblight",
    name: "Thunderblight",
    kind: "condition",
    img: "icons/magic/lightning/bolt-forked-blue.webp",
    tint: "#ddeeff",
    summary:
      "Disadvantage on saves against being stunned. Lightning/thunder damage while blighted: Con save (Carve DC) or stunned until end of next turn.",
    description: `<p>An afflicted creature has disadvantage on saving throws to be stunned. If the creature takes lightning or thunder damage while already under the effects of thunderblight, it must make a Constitution saving throw with a DC equal to the creature's Carve DC or be stunned until the end of its next turn.</p>
<p><em>Status indicates the blight; stun-on-shock / save disadvantage vs stun is enforced by hunt macros / GM (not a blanket Con-save penalty).</em></p>`,
    changes: [],
  },
  {
    id: "waterblight",
    name: "Waterblight",
    kind: "condition",
    img: "icons/magic/water/elemental-water.webp",
    tint: "#2266aa",
    summary:
      "Poison-type blight. On your turn: Action or Bonus Action, not both.",
    description: `<p><em>Waterblight is considered a type of poison for the purposes of features that grant advantage on saves against or immunity to poisons.</em></p>
<p>A creature afflicted by waterblight has its stamina drained. On the creature's turn, it can use either an Action or a Bonus Action, not both.</p>`,
    changes: [],
  },
  {
    id: "iceblight",
    name: "Iceblight",
    kind: "disease",
    img: "icons/magic/water/barrier-ice-wall-snow.webp",
    tint: "#aaddff",
    summary:
      "Disease. No reactions; half speed; only one attack on your turn.",
    description: `<p><em>Iceblight is considered a type of disease for the purposes of features that grant advantage on saves against or immunity to diseases.</em></p>
<p>A creature who is afflicted with iceblight is chilled to the bone. The creature can't use reactions. Its speed is halved. It can't make more than one attack on its turn.</p>`,
    conditionEffects: ["halfMovement"],
    changes: [
      {
        key: "flags.midi-qol.fail.reaction",
        mode: MODE.CUSTOM,
        value: "1",
        priority: 20,
      },
    ],
  },
  {
    id: "frenzy-virus",
    name: "Frenzy Virus",
    kind: "disease",
    img: "systems/dnd5e/icons/svg/statuses/diseased.svg",
    tint: "#662266",
    summary:
      "Sentient: crit on 19–20, +1d4 damage, no nonmagical healing, resistances/immunities suppressed. Greater Restoration cures.",
    description: `<p>The Frenzy Virus is an infectious disease caused by Gore Magala and Shagaru Magala. Infection typically comes from claw/bite hits or breath spores that apply <strong>Frenzy Charges</strong> (3 charges → Con save or become infected).</p>
<h3>Sentient races (while infected)</h3>
<ul>
<li><strong>Improved Critical.</strong> Weapon attacks score a critical hit on a roll of 19 or 20.</li>
<li><strong>Improved Damage.</strong> All spells and attacks deal an additional 1d4 damage.</li>
<li><strong>Impaired Healing.</strong> Cannot regain Hit Points except by magical means (potions of healing are <em>not</em> magical for this purpose).</li>
<li><strong>Suppressed Immunities.</strong> No longer benefits from resistance, absorption, or immunity for conditions or damage.</li>
<li><strong>Vulnerability.</strong> Gaining a Frenzy Charge while already infected deals an extra 1d6 necrotic from that attack.</li>
</ul>
<p>Repeat the Con save each dawn; <em>greater restoration</em> also cures it. Effects on sentient creatures usually last several minutes once active.</p>
<p><em>Monster / Apex templates are GM-facing; this Active Effect automates the sentient combat modifiers.</em></p>`,
    changes: [
      {
        key: "flags.midi-qol.criticalThreshold",
        mode: MODE.OVERRIDE,
        value: "19",
        priority: 20,
      },
      {
        key: "system.bonuses.mwak.damage",
        mode: MODE.ADD,
        value: "1d4",
        priority: 20,
      },
      {
        key: "system.bonuses.rwak.damage",
        mode: MODE.ADD,
        value: "1d4",
        priority: 20,
      },
      {
        key: "system.bonuses.msak.damage",
        mode: MODE.ADD,
        value: "1d4",
        priority: 20,
      },
      {
        key: "system.bonuses.rsak.damage",
        mode: MODE.ADD,
        value: "1d4",
        priority: 20,
      },
      {
        key: "flags.midi-qol.fail.heal.nonmagical",
        mode: MODE.CUSTOM,
        value: "1",
        priority: 20,
      },
    ],
  },
];

export function afflictionById(id) {
  return AMELLWIND_AFFLICTIONS.find((a) => a.id === id) ?? null;
}
