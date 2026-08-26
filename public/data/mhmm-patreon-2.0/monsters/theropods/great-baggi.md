---
name: Great Baggi
slug: great-baggi
group: Theropods
cr: "2"
pdfPage: 548
inGithubJson: true
source: MHMM-Patreon-2.0
size: Large
creatureType: beast (theropod)
alignment: unaligned
ac: 13
acFrom: natural armor
hp: 59
hpFormula: "7d10 + 21"
speed: "30 ft."
str: 18
dex: 13
con: 16
int: 4
wis: 10
cha: 6
lootRolls: 2
---

# Great Baggi

## Bio

The Great Baggi's eyes will glow yellow in the dark. Great Baggi are matured male Baggi that have taken over a pack of their own. Great Baggi is also slightly larger than the Great Jaggi. Located on its head is a crest that is highly prized by merchants for its use in armor and weapon crafting.

It has developed its own unique ability; it can spit a tranquilizing liquid that inflicts sleep on its prey or hunters. It also has developed the ability to command Baggi to surround prey or hunters and spit tranquilizing liquid at them with a roar.

## Stat Block

_Large beast (theropod), unaligned_

- **Armor Class:** 13 (natural armor)
- **Hit Points:** 59 (7d10 + 21)
- **Speed:** 30 ft.

| STR | DEX | CON | INT | WIS | CHA |
| --: | --: | --: | --: | --: | --: |
|  18 |  13 |  16 |   4 |  10 |   6 |

- **Skills:** Athletics +6
- **Damage Immunities:** cold
- **Senses:** passive Perception 10
- **Languages:** —
- **Proficiency Bonus:** +2
- **Challenge:** 2

## Traits

### Pounce

If the great baggi moves at least 20 feet straight toward a creature and then hits it with a Claw attack on the same turn, that target must succeed on a DC 14 Strength saving throw or be knocked prone. If the target is prone, the great baggi can make one Bite attack against it as a bonus action.

## Actions

### Bite

Melee Weapon Attack: +6 to hit, reach 5 ft., one target. Hit: 17 (3d8 + 4) piercing damage. If the target is a creature, it must succeed on a DC 13 Constitution saving throw or be incapacitated until the end of its next turn, or until it takes damage.

### Claw

Melee Weapon Attack: +6 to hit, reach 5 ft., one target. Hit: 14 (4d4 + 4) Slashing damage.

### Sleep Spit

The great baggi spits a sleepy concoction at a location within 60 feet of it. Each creature within a 5foot radius of that location must succeed on a DC 13 Constitution saving throw or be incapacitated until the end of its next turn, or until it takes damage. If the saving throw fails by 5 or more, the target is instead knocked unconscious. The target wakes up if it takes damage or if another creature takes an action to shake it awake.

### Alpha Call (1/day)

The great baggi looses a guttural howl, calling 2 (1d4) baggi to its aid. The creatures arrive on initiative 20 (losing initiative ties), acting as allies of the great baggi and obeying its commands.

## Loot

**Carves/Capture rolls:** 2

| Carve | Capture | Material         | Slots |
| ----- | ------- | ---------------- | ----- |
| 1-2   | —       | Baggi Scale      | A     |
| 3-5   | 1-5     | B.Sleep Sac x2   | O     |
| 6-12  | 6-7     | Great Baggi Hide | A, W  |
| 13-17 | 8-10    | Great Baggi Claw | A, W  |
| —     | 11-18   | B.King's Crest   | A, W  |
| 18-19 | 19      | Great Baggi Piel | A, W  |
| 20    | 20      | Imperial Crest   | A     |

## Materials (Runes)

These map to `Rune` entities (`name`, `carveChance`, `captureChance`, `slots`, `armorEffect`, `weaponEffect`).

### Baggi Scale

- **Slots:** A
- **Carve:** 1-2
- **Capture:** —
- **Armor effect:** You have a +1 bonus to Athletics checks while you wear this armor.

### B.Sleep Sac x2

- **Slots:** O
- **Carve:** 3-5
- **Capture:** 1-5
- **Other effect:** A Material that replaces the sleep herb when crafting tranq bombs or tranq ammo.

### Great Baggi Hide

- **Slots:** A, W
- **Carve:** 6-12
- **Capture:** 6-7
- **Armor effect:** You reduce cold damage you take by 3 while you wear this armor.
- **Weapon effect:** When you hit a creature with this weapon, it must succeed on a DC 10 Constitution saving throw or become Incapacitated for 1d4 turns or until it takes damage. Once you use this property, you cannot use it again until you finish a long rest.

### Great Baggi Claw

- **Slots:** A, W
- **Carve:** 13-17
- **Capture:** 8-10
- **Armor effect:** Geologist. When you successfully gather a mining resource, you instead gather 2.
- **Weapon effect:** Your slashing weapon deals an extra 1 slashing damage.

### B.King's Crest

- **Slots:** A, W
- **Carve:** —
- **Capture:** 11-18
- **Armor effect:** Whenever you make a saving throw against the unconscious condition or other sleep-like effects, you do so with a +1 bonus.
- **Weapon effect:** FastCharge. When you roll for initiative, your greatsword, longsword, charge blade, or tonfas gains 1 charge, spirit, or phial charge.

### Great Baggi Piel

- **Slots:** A, W
- **Carve:** 18-19
- **Capture:** 19
- **Armor effect:** You can read books you are touching while sleeping.
- **Weapon effect:** Your weapon deals an extra 1 weapon damage if it uses ammunition.

### Imperial Crest

- **Slots:** A
- **Carve:** 20
- **Capture:** 20
- **Armor effect:** Capture Novice. While attuned to this armor, tranq bombs and tranq ammo roll an extra 2d8 when it hits a creature.
