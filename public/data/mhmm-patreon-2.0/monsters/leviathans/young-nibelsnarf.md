---
name: Young Nibelsnarf
slug: young-nibelsnarf
group: Leviathans
cr: "4"
pdfPage: 483
inGithubJson: true
source: MHMM-Patreon-2.0
size: Large
creatureType: leviathan
alignment: unaligned
ac: 16
acFrom: natural armor
hp: 97
hpFormula: "13d10 + 26"
speed: "30 ft., burrow 30 ft."
str: 16
dex: 13
con: 15
int: 8
wis: 10
cha: 8
lootRolls: 3
qa: missing-bio
---

# Young Nibelsnarf

## Stat Block

*Large leviathan, unaligned*
- **Armor Class:** 16 (natural armor)
- **Hit Points:** 97 (13d10 + 26)
- **Speed:** 30 ft., burrow 30 ft.

| STR | DEX | CON | INT | WIS | CHA |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 16 | 13 | 15 | 8 | 10 | 8 |

- **Saving Throws:** Dex +3, Con +4, Wis +2
- **Damage Immunities:** fire
- **Senses:** tremorsense 30 ft., passive Perception 11
- **Languages:** —
- **Proficiency Bonus:** +2
- **Challenge:** 4

## Traits

### Desert Camouflage

The nibelsnarf has advantage on Dexterity (Stealth) checks made to hide in desert terrain while burrowed.


## Actions

### Multiattack

The nibelsnarf makes two Bite attacks.

### Bite

Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 12 (2d8 + 3) piercing damage.

### Wind Tunnel (Recharge 6)

The nibelsnarf exhales sand and debris in a 30-foot cone. Each creature in the area must make a DC 12 Dexterity saving throw, taking 21 (6d6) bludgeoning damage on a failed save, or half as much damage on a successful save.


## Reactions

### Sand Cloud

When a creature attacks the nibelsnarf, it can expel a large sand cloud from the gills on the back of its head. The cloud fills a 15-foot square centered in a nibelsnarf's space that is closest to the attacker. Each creature in that area must succeed on a DC 12 Strength saving throw or be knocked prone. If the saving throw fails by 5 or more, the target is also pushed 10 feet away from the nibelsnarf.


## Loot

**Carves/Capture rolls:** 3

| Carve | Capture | Material | Slots |
| --- | --- | --- | --- |
| 1-8 | 1-10 | Y.Nibelsnarf Hide | A |
| 9-13 | — | Y.Nibel Shell | A |
| 14-16 | 11-14 | Y.Nibelsnarf Claw | A, W |
| 17-19 | 15-19 | Gleaming Fluid | A, W |
| 20 | 20 | Y.Nibelsnarf Scalp | A, W |

## Materials (Runes)

These map to `Rune` entities (`name`, `carveChance`, `captureChance`, `slots`, `armorEffect`, `weaponEffect`).

### Y.Nibelsnarf Hide

- **Slots:** A
- **Carve:** 1-8
- **Capture:** 1-10
- **Armor effect:** You can hold your breath underground for twice as long as normal.

### Y.Nibel Shell

- **Slots:** A
- **Carve:** 9-13
- **Capture:** —
- **Armor effect:** While you wear this armor, you have a +2 bonus on Dexterity (Stealth) checks made to hide in desert terrain.

### Y.Nibelsnarf Claw

- **Slots:** A, W
- **Carve:** 14-16
- **Capture:** 11-14
- **Armor effect:** Speed Eating. While you are attuned to this armor, you can use any consumable, such as a potion or food, as a bonus action; so long as you are the one consuming it.
- **Weapon effect:** Horn Maestro. While attuned to this weapon, your melody lasts an extra 30 seconds longer than normal.

### Gleaming Fluid

- **Slots:** A, W
- **Carve:** 17-19
- **Capture:** 15-19
- **Armor effect:** While you wear this armor, you can use a bonus action to exhale sand and debris in a 15-foot cone. Each creature in that area must make a DC 11 Dexterity saving throw, taking 2d6 bludgeoning damage on a failed save, or half as much damage on a successful one. Once used, this property can't be used again until you finish a long rest.
- **Weapon effect:** (Bard, Druid, Sorcerer, & Wizard Only) While attuned to this weapon you can cast the Earth Tremor spell once per long rest, without expending a spell slot.

### Y.Nibelsnarf Scalp

- **Slots:** A, W
- **Carve:** 20
- **Capture:** 20
- **Armor effect:** While wearing this armor, you are always covered in dust. Whenever a creature makes an attack against the you, you can use your reaction to expel a small sand cloud from your body, lightly obscuring the area in a 5-foot radius sphere around you until the start of your next turn.
- **Weapon effect:** (Hammer Only) Punish Draw. A creature hit for the first time by the Hammers Mighty Weapon, has disadvantage on the saving throw.

## QA flags

`missing-bio`
