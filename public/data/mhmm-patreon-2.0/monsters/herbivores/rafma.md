---
name: Rafma
slug: rafma
group: Herbivore
cr: "1/2"
pdfPage: 606
inGithubJson: false
source: MHMM-Patreon-2.0
size: Medium
creatureType: beast
alignment: unaligned
ac: 11
hp: 32
hpFormula: "5d8 + 10"
speed: "30 ft."
str: 15
dex: 10
con: 14
int: 3
wis: 11
cha: 6
lootRolls: 1
---

# Rafma

## Bio

The rafma is a small herbivorous quadruped that inhabits cold, mountainous regions and sheer cliff faces. They move in tight herds led by a larger alpha. When threatened, the alpha discharges static energy from its horn to stun attackers and drive the herd clear. Sightings often note their ease on steep slopes and their tendency to cluster around safe ledges before shifting to new grazing grounds.

## Stat Block

*Medium beast, unaligned*
- **Armor Class:** 11
- **Hit Points:** 32 (5d8 + 10)
- **Speed:** 30 ft.

| STR | DEX | CON | INT | WIS | CHA |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 15 | 10 | 14 | 3 | 11 | 6 |

- **Damage Immunities:** cold
- **Senses:** passive Perception 10
- **Languages:** —
- **Proficiency Bonus:** +2
- **Challenge:** 1/2

## Traits

### Ice Walk

The Rafma can move across and climb icy surfaces without needing to make an ability check. Additionally, difficult terrain composed of ice or snow doesn't cost it extra moment.


## Actions

### Ram

Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 3 (1d4 + 1) bludgeoning damage. If the Rafma moved at least 20 feet straight toward a target immediately before the hit, the target takes an extra 2 (1d4) bludgeoning damage. If the target is a creature, it must succeed on a DC 10 Strength saving throw or be knocked prone.


## Bonus Actions

### Static Discharge (Recharge 6)

The next time the rafma hits a target with a Ram attack before the end of its turn, the target must succeed on a DC 12 Constitution saving throw or be paralyzed until the end of its next turn. If the attack would require the target to make a different saving throw, use this Constitution saving throw instead; on a failure, the target suffers all effects of a failed save from the attack. 600


## Loot

**Carves/Capture rolls:** 1

| Carve | Capture | Material | Slots |
| --- | --- | --- | --- |
| 1-4 | — | Raw Meat | O |
| 5-6 | — | Sm Monster Bone | O |
| 7-11 | — | Rafma Pelt | A |
| 12-20 | — | Rafma Antler | A, O |

## Materials (Runes)

These map to `Rune` entities (`name`, `carveChance`, `captureChance`, `slots`, `armorEffect`, `weaponEffect`).

### Raw Meat

- **Slots:** O
- **Carve:** 1-4
- **Capture:** —
- **Other effect:** Provides 2 days rations when cooked.

### Sm Monster Bone

- **Slots:** O
- **Carve:** 5-6
- **Capture:** —
- **Other effect:** Uncommon weapon upgrade material.

### Rafma Pelt

- **Slots:** A
- **Carve:** 7-11
- **Capture:** —
- **Armor effect:** While attuned to this armor you have a +2 bonus to checks to keep your balance and footing when climbing.

### Rafma Antler

- **Slots:** A, O
- **Carve:** 12-20
- **Capture:** —
- **Weapon effect:** A creature hit by this weapon must succeed a DC 8 Constitution saving throw or become incapacitated and has its movement speed is reduced to 0 until the start of its next turn.
- **Other effect:** A Material that replaces the parashroom when crafting paralysis coating or paralysis ammo (1d4 uses before it is destroyed).
