---
name: Izuchi
slug: izuchi
group: Theropods
cr: "1"
pdfPage: 556
inGithubJson: true
source: MHMM-Patreon-2.0
size: Medium
creatureType: beast (theropod)
alignment: unaligned
ac: 12
acFrom: natural armor
hp: 45
hpFormula: "6d8 + 18"
speed: "30 ft."
str: 16
dex: 13
con: 16
int: 4
wis: 10
cha: 6
lootRolls: 1
---

# Izuchi

## Bio

An omnivorous bird wyvern that has a characteristic scytheshaped tail. It uses this tail to attack, but also to climb trees and chop down fruit. Most Izuchi fall into a herd led by a Great Izuchi; in each herd, the two best fighters are selected by the leader to help it hunt prey.

## Stat Block

*Medium beast (theropod), unaligned*
- **Armor Class:** 12 (natural armor)
- **Hit Points:** 45 (6d8 + 18)
- **Speed:** 30 ft.

| STR | DEX | CON | INT | WIS | CHA |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 16 | 13 | 16 | 4 | 10 | 6 |

- **Senses:** passive Perception 10
- **Languages:** —
- **Proficiency Bonus:** +2
- **Challenge:** 1

## Traits

### Pack Tactics

The izuchi has advantage on attack rolls against a creature if at least one of the izuchi's allies is within 5 feet of the creature and the ally isn't incapacitated.


## Actions

### Bite

Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 7 (1d8 + 3) piercing damage.

### Tail

Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 6 (1d6 + 3) slashing damage.


## Loot

**Carves/Capture rolls:** 1

| Carve | Capture | Material | Slots |
| --- | --- | --- | --- |
| 1-7 | — | Sharp Claw | W |
| 8-13 | — | Izuchi Hide | A |
| 14-17 | — | Izuchi Tail | A, W |
| 18-20 | — | Bird Wyvern Bone | O |

## Materials (Runes)

These map to `Rune` entities (`name`, `carveChance`, `captureChance`, `slots`, `armorEffect`, `weaponEffect`).

### Sharp Claw

- **Slots:** W
- **Carve:** 1-7
- **Capture:** —
- **Weapon effect:** Your slashing weapon deals an extra 1 slashing damage.

### Izuchi Hide

- **Slots:** A
- **Carve:** 8-13
- **Capture:** —
- **Armor effect:** When you successfully gather from a bonepile resource, you roll twice on the resource table.

### Izuchi Tail

- **Slots:** A, W
- **Carve:** 14-17
- **Capture:** —
- **Armor effect:** Geologist. When you successfully gather a mining resource, you instead gather 2.
- **Weapon effect:** Hunter. While attuned to this weapon you gain one extra ration from whatever you hunt.

### Bird Wyvern Bone

- **Slots:** O
- **Carve:** 18-20
- **Capture:** —
- **Other effect:** Uncommon armor upgrade material.
