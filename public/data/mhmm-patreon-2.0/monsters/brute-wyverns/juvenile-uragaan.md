---
name: Juvenile Uragaan
slug: juvenile-uragaan
group: Brute Wyverns
cr: "3"
pdfPage: 81
inGithubJson: true
source: MHMM-Patreon-2.0
size: Large
creatureType: wyvern (brute)
alignment: unaligned
ac: 15
acFrom: natural armor
hp: 97
hpFormula: "13d10 + 26"
speed: "40 ft."
str: 16
dex: 10
con: 14
int: 3
wis: 10
cha: 6
lootRolls: 3
qa: missing-bio
---

# Juvenile Uragaan

## Stat Block

*Large wyvern (brute), unaligned*
- **Armor Class:** 15 (natural armor)
- **Hit Points:** 97 (13d10 + 26)
- **Speed:** 40 ft.

| STR | DEX | CON | INT | WIS | CHA |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 16 | 10 | 14 | 3 | 10 | 6 |

- **Skills:** Perception +2
- **Senses:** passive Perception 12
- **Languages:** —
- **Proficiency Bonus:** +2
- **Challenge:** 3

## Actions

### Multiattack

The uragaan makes one Tail attack and Chin Slam attack.

### Chin Slam

Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 10 (2d6 + 3) bludgeoning damage.

### Tail

Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 12 (2d8 + 3) bludgeoning damage.

### Roll (Recharge 5-6)

The uragaan rolls its body into a wheel and moves up to half its speed. During this move it can move through other creatures without provoking opportunity attacks. Each creature the uragaan moves through must succeed on a DC 13 Dexterity saving throw or take 14 (4d6) bludgeoning damage and be knocked prone.


## Loot

**Carves/Capture rolls:** 3

| Carve | Capture | Material | Slots |
| --- | --- | --- | --- |
| 1-4 | 1-5 | J.Uragaan Carapace | A, W |
| 5-9 | 6-11 | J.Uragaan Scale | W |
| 10-14 | 12-17 | J.Uragaan Scute | A, W |
| 15-19 | 18-20 | J.Uragaan Marrow | A, W |
| 20 | — | J.Uragaan Ruby | A |

## Materials (Runes)

These map to `Rune` entities (`name`, `carveChance`, `captureChance`, `slots`, `armorEffect`, `weaponEffect`).

### J.Uragaan Carapace

- **Slots:** A, W
- **Carve:** 1-4
- **Capture:** 1-5
- **Armor effect:** You reduce thunder and lightning damage you take by 2 while you wear this armor.
- **Weapon effect:** Your bludgeoning weapon deals an extra 2 bludgeoning damage.

### J.Uragaan Scale

- **Slots:** W
- **Carve:** 5-9
- **Capture:** 6-11
- **Weapon effect:** The first time you make a Carve check on a creature, you do so with advantage.

### J.Uragaan Scute

- **Slots:** A, W
- **Carve:** 10-14
- **Capture:** 12-17
- **Armor effect:** You have a +2 bonus to Athletics checks while you wear this armor.
- **Weapon effect:** When you make a weapon attack with this weapon and roll a 20 for the attack roll, you can choose to release a wave of concussive force. When you do, each creature within 5 feet of you must succeed on a DC 12 Strength saving throw or be knocked prone.

### J.Uragaan Marrow

- **Slots:** A, W
- **Carve:** 15-19
- **Capture:** 18-20
- **Armor effect:** Staunch Bleeding. You have advantage on Wisdom (Medicine) checks to staunch a wound, such as the odogaron's blood wound or bearded devil's infernal wound.
- **Weapon effect:** Load Up. While attuned to this weapon, you increase the maximum capacity for all your ammo by 2.

### J.Uragaan Ruby

- **Slots:** A
- **Carve:** 20
- **Capture:** —
- **Armor effect:** Uragaan Minor Protection. When you must make a saving throw while taking the dodge action, you can use your Armor Class in place of making the roll. Once used, you can't use this property again until you finish a long rest.

## QA flags

`missing-bio`
