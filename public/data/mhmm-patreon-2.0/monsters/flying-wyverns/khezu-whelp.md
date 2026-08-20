---
name: Khezu Whelp
slug: khezu-whelp
group: Flying Wyverns
cr: "1/2"
pdfPage: 390
inGithubJson: false
source: MHMM-Patreon-2.0
size: Tiny
creatureType: wyvern (flying)
alignment: unaligned
ac: 8
acFrom: natural armor
hp: 32
hpFormula: "5d4 + 20"
speed: "20 ft."
str: 14
dex: 6
con: 18
int: 3
wis: 6
cha: 2
lootRolls: 1
---

# Khezu Whelp

## Bio

The khezu whelp is a young, pale, eyeless creature that dwells in the darkest recesses of caves and atop remote mountain peaks. Its semi-translucent, rubbery hide is still developing, giving it a slimy texture with visible veins pulsating beneath the surface. The whelp constantly emits electricity, capable of paralyzing or shocking those who touch it.

To reproduce, the khezu must first paralyze and inject their whelps inside a host's body, where the young will incubate and obtain their first meal by consuming the host from the inside out.

## Stat Block

*Tiny wyvern (flying), unaligned*
- **Armor Class:** 8 (natural armor)
- **Hit Points:** 32 (5d4 + 20)
- **Speed:** 20 ft.

| STR | DEX | CON | INT | WIS | CHA |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 14 | 6 | 18 | 3 | 6 | 2 |

- **Skills:** Stealth +0
- **Damage Vulnerabilities:** fire
- **Senses:** blindsight 60 ft., passive Perception 8
- **Languages:** —
- **Proficiency Bonus:** +2
- **Challenge:** 1/2

## Actions

### Bite

Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 7 (2d4 + 2) piercing damage plus 2 (1d4) lightning damage. The target's hit point maximum is reduced by an amount equal to the lightning damage taken, and the khezu whelp regains hit points equal to that amount. The reduction lasts until the target finishes a long rest. The target dies if this effect reduces its hit point maximum to 0.

### Poison Spit

Ranged Weapon Attack: +4 to hit, range 20/60 ft., one target. Hit: 3 (1d6) poison damage.


## Bonus Actions

### Leech

Immediately after the khezu whelp hits a target with its Bite attack, it can attach itself to a creature (escape DC 10). At the start of the khezu whelp's turn, the creature it is attached takes 5 (2d4) lightning damage and the khezu whelp regains hit points equal to that amount. 384


## Loot

**Carves/Capture rolls:** 1

| Carve | Capture | Material | Slots |
| --- | --- | --- | --- |
| 1-13 | — | Spark Sac | A, W |
| 14-17 | — | Pale Membrane | A, W |
| 18-20 | — | Monster Fluid | O |

## Materials (Runes)

These map to `Rune` entities (`name`, `carveChance`, `captureChance`, `slots`, `armorEffect`, `weaponEffect`).

### Spark Sac

- **Slots:** A, W
- **Carve:** 1-13
- **Capture:** —
- **Armor effect:** Entomologist. When you capture an insect with a bug net, you instead catch two.
- **Weapon effect:** (Spellcaster Only) You know the shocking grasp cantrip while attuned to this weapon.

### Pale Membrane

- **Slots:** A, W
- **Carve:** 14-17
- **Capture:** —
- **Armor effect:** While attuned to this armor, it sheds bright light in a 10foot radius and dim light for an additional 10 feet.
- **Weapon effect:** When you cast a spell that deals lightning damage, add half of your proficiency bonus to that damage.

### Monster Fluid

- **Slots:** O
- **Carve:** 18-20
- **Capture:** —
- **Other effect:** Uncommon or rare upgrade material that can be used for weapons or armor.
