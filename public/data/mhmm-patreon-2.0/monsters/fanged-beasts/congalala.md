---
name: Congalala
slug: congalala
group: Fanged Beasts
cr: "6"
pdfPage: 269
inGithubJson: true
source: MHMM-Patreon-2.0
size: Large
creatureType: beast (fanged)
alignment: unaligned
ac: 13
acFrom: natural armor
hp: 142
hpFormula: "15d10 + 60"
speed: "40 ft., Climb 40 ft."
str: 21
dex: 14
con: 18
int: 7
wis: 14
cha: 7
lootRolls: 3
qa: missing-bio
---

# Congalala

## Stat Block

*Large beast (fanged), unaligned*
- **Armor Class:** 13 (natural armor)
- **Hit Points:** 142 (15d10 + 60)
- **Speed:** 40 ft., Climb 40 ft.

| STR | DEX | CON | INT | WIS | CHA |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 21 | 14 | 18 | 7 | 14 | 7 |

- **Skills:** Acrobatics +5, Perception +5
- **Damage Immunities:** necrotic
- **Senses:** passive Perception 15
- **Languages:** —
- **Proficiency Bonus:** +3
- **Challenge:** 6

## Traits

### Mushroom Eater

All congalala love to eat mushrooms, so much so that it always carries one around in its tail. Roll a 1d6 to determine the element of the mushroom it is carrying. On a 1, fire; On a 2, poison; On a 3, lightning; On a 4, cold; On a 5, acid; On a 6, necrotic.


## Actions

### Multiattack

The congalala makes two Fist attacks.

### Fist

Melee Weapon Attack: +8 to hit, reach 5 ft., one target. Hit: 14 (2d8 + 5) bludgeoning damage.

### Belly Thrust

Melee Weapon Attack: +8 to hit, reach 5 ft., one target. Hit: 16 (2d10 +5) bludgeoning damage.

### Chow Down (Recharge 6)

The congalala eats part of its mushroom then breaths a noxious gas in a 30-foot cone. Each creature in that area must make a DC 15 Dexterity saving throw, taking 28 (8d6) damage of the mushroom's type on a failed save or half as much damage on a successful one.


## Reactions

### Belly Thrust

When the congalala is hit by a melee attack, it can use its reaction to make a Belly Thrust attack against the attacker.

### Fart

When the congalala is hit by a melee weapon attack, it can use its reaction to release a noxious fart at the attacker. If the attacker is concentrating on a spell or spell-like ability, it must succeed on a DC 15 Constitution saving throw, to maintain concentration on it.


## Loot

**Carves/Capture rolls:** 3

| Carve | Capture | Material | Slots |
| --- | --- | --- | --- |
| 1-4 | 1-4 | Congalala Pelt | A, W |
| 5-10 | — | Congalala Claw | A, W |
| 11-12 | 5-8 | Congalala Fang | W |
| 13 | 9-10 | Brute Bone | W, O |
| 14-18 | 11-16 | Territorial Dung | O |
| 19-20 | 17-20 | Vibrant Pelt | A, W |

## Materials (Runes)

These map to `Rune` entities (`name`, `carveChance`, `captureChance`, `slots`, `armorEffect`, `weaponEffect`).

### Congalala Pelt

- **Slots:** A, W
- **Carve:** 1-4
- **Capture:** 1-4
- **Armor effect:** When you attune to this armor, you gain proficiency with either alchemist's supplies or tinker's tools. You can change which tool you are proficient with daily at dawn.
- **Weapon effect:** (Monk Only) While you are attuned to this weapon, you can spend one minute contemplating the patterns etched on this weapon's surface and regain a number of expended ki points equal to half your proficiency modifier. Once you use this property, you cannot use it again until you finish a long rest.

### Congalala Claw

- **Slots:** A, W
- **Carve:** 5-10
- **Capture:** —
- **Armor effect:** Whenever you must succeed on a saving throw or be knocked prone, you do so with a +2 bonus.
- **Weapon effect:** When you hit a creature with this weapon, it must make a DC 12 Constitution saving throw. On a failed save the creature has disadvantage on Constitution saving throws to maintain concentration for 1 minute. You can use this property three times, regaining all expended uses when you finish a long rest.

### Congalala Fang

- **Slots:** W
- **Carve:** 11-12
- **Capture:** 5-8
- **Weapon effect:** Load Up. While attuned to this weapon, you increase the maximum capacity for all your ammo by 2.

### Brute Bone

- **Slots:** W, O
- **Carve:** 13
- **Capture:** 9-10
- **Weapon effect:** Your weapon deals an extra 1d4 bludgeoning damage.
- **Other effect:** Rare armor upgrade material.

### Territorial Dung

- **Slots:** O
- **Carve:** 14-18
- **Capture:** 11-16
- **Other effect:** A material that replaces dung for crafting dung bombs. When used in this way, it becomes a territorial dung bomb that blinds a creature for 1 minute on hit. Stench A creature that is stenched is enveloped by a nauseating odor that disrupts its focus and draws unwanted attention. A creature under this effect has disadvantage on Concentration checks to maintain spells or abilities. It can't eat or drink (This includes potions). It automatically fails Dexterity (Stealth) checks against any creature that can smell it.

### Vibrant Pelt

- **Slots:** A, W
- **Carve:** 19-20
- **Capture:** 17-20
- **Armor effect:** Capture Novice. While attuned to this armor, tranq bombs and tranq ammo roll an extra 2d8 when it hits a creature.
- **Weapon effect:** (Sorcerer & Wizard Only) While attuned to this weapon you can cast the chromatic orb spell once a day, without the required the material components and without expending a spell slot.

## QA flags

`missing-bio`
