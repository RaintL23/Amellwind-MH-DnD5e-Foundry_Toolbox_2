---
name: Baby Basarios
slug: baby-basarios
group: Flying Wyverns
cr: "1"
pdfPage: 353
inGithubJson: true
source: MHMM-Patreon-2.0
size: Medium
creatureType: wyvern (flying)
alignment: unaligned
ac: 16
acFrom: natural armor
hp: 65
hpFormula: "10d8 + 20"
speed: "25 ft., burrow 20 ft."
str: 16
dex: 9
con: 14
int: 2
wis: 11
cha: 6
lootRolls: 1
qa: missing-bio
---

# Baby Basarios

## Stat Block

*Medium wyvern (flying), unaligned*
- **Armor Class:** 16 (natural armor)
- **Hit Points:** 65 (10d8 + 20)
- **Speed:** 25 ft., burrow 20 ft.

| STR | DEX | CON | INT | WIS | CHA |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 16 | 9 | 14 | 2 | 11 | 6 |

- **Senses:** passive Perception 10
- **Languages:** —
- **Proficiency Bonus:** +2
- **Challenge:** 1

## Traits

### False Appearance

While the basarios remains partially submerged in the ground and motionless, it is indistinguishable from a normal boulder.


## Actions

### Bite

Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 6 (1d6 + 3) bludgeoning damage.

### Ram

Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 7 (1d8 + 3) bludgeoning damage.


## Loot

**Carves/Capture rolls:** 1

| Carve | Capture | Material | Slots |
| --- | --- | --- | --- |
| 1-9 | 1-5 | B.Basarios Shell | A, W |
| 10-15 | 6-13 | Earth Crystal | O |
| 16-19 | 14-19 | B.Basarios Wing | A, W |
| 20 | 20 | B.Basarios Carapace | A, W |

## Materials (Runes)

These map to `Rune` entities (`name`, `carveChance`, `captureChance`, `slots`, `armorEffect`, `weaponEffect`).

### B.Basarios Shell

- **Slots:** A, W
- **Carve:** 1-9
- **Capture:** 1-5
- **Armor effect:** You reduce cold damage you take by 3 while you wear this armor.
- **Weapon effect:** Geologist. When you successfully gather a mining resource, you instead gather 2.

### Earth Crystal

- **Slots:** O
- **Carve:** 10-15
- **Capture:** 6-13
- **Other effect:** Item found in (AGtMH p.96)

### B.Basarios Wing

- **Slots:** A, W
- **Carve:** 16-19
- **Capture:** 14-19
- **Armor effect:** You have a +2 bonus to stealth checks made to hide in rocky terrain while you wear this armor.
- **Weapon effect:** Hitter. When a creature must succeed on a saving throw or be stunned by the effect of a weapon attack, increase the save DC by 2.

### B.Basarios Carapace

- **Slots:** A, W
- **Carve:** 20
- **Capture:** 20
- **Armor effect:** (Spellcaster Only) You know the shield spell while you wear this armor. If you prepare spells, you always have it prepared, and it doesn't count against the number of spells you can prepare each day. If this spell is not on your class list, the spell is nonetheless a class spell for you.
- **Weapon effect:** When you hit a creature with this weapon, you can speak this weapon's command word to gain a +2 bonus to your AC until the end of your next turn. Once used, you can't use this property again until you finish a long rest.

## QA flags

`missing-bio`
