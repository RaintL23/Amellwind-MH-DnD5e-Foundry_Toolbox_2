---
name: Great Maccao
slug: great-maccao
group: Theropods
cr: "2"
pdfPage: 565
inGithubJson: true
source: MHMM-Patreon-2.0
size: Large
creatureType: beast (theropod)
alignment: unaligned
ac: 14
acFrom: natural armor
hp: 52
hpFormula: "7d10 + 14"
speed: "40 ft."
str: 16
dex: 13
con: 14
int: 5
wis: 11
cha: 6
lootRolls: 2
qa: missing-bio
---

# Great Maccao

## Stat Block

*Large beast (theropod), unaligned*
- **Armor Class:** 14 (natural armor)
- **Hit Points:** 52 (7d10 + 14)
- **Speed:** 40 ft.

| STR | DEX | CON | INT | WIS | CHA |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 16 | 13 | 14 | 5 | 11 | 6 |

- **Senses:** passive Perception 10
- **Languages:** —
- **Proficiency Bonus:** +2
- **Challenge:** 2

## Traits

### Standing Leap

The great maccao's long jump is up to 40 feet and its high jump is up to 20 feet, with or without a running start.


## Actions

### Multiattack

The great maccao makes two Kick attacks.

### Kick

Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 10 (2d6 + 3) bludgeoning damage.

### Deadly Leap

If the great maccao jumps at least 15 feet as part of its movement, it can then use this action to land on its feet in a space that contains one or more other creatures. Each of those creatures must succeed on a DC 13 Strength or Dexterity saving throw (target's choice) or be knocked prone and take 12 (2d8 + 3) bludgeoning damage On a successful save, the creature takes only half the damage, isn't knocked prone, and is pushed 5 feet out of the great maccao's space into an unoccupied space of the creature's choice. If no unoccupied space is within range, the creature instead falls prone in the great maccao's space.


## Loot

**Carves/Capture rolls:** 2

| Carve | Capture | Material | Slots |
| --- | --- | --- | --- |
| 1-3 | — | Maccao Scale | A, W |
| 4-5 | 1-4 | Maccao Tailspike | W |
| 6-12 | 5-8 | Great Maccao Scale | A, O |
| 13-17 | 9-16 | Great Maccao Hide | A, W |
| 18-19 | 17-19 | Champion's Crest | A, W |
| 20 | 20 | Maccao Gem | A, W |

## Materials (Runes)

These map to `Rune` entities (`name`, `carveChance`, `captureChance`, `slots`, `armorEffect`, `weaponEffect`).

### Maccao Scale

- **Slots:** A, W
- **Carve:** 1-3
- **Capture:** —
- **Armor effect:** You have a +1 bonus to Performance checks while you wear this armor.
- **Weapon effect:** Expert Fisherman. When you catch fish, you instead catch two.

### Maccao Tailspike

- **Slots:** W
- **Carve:** 4-5
- **Capture:** 1-4
- **Weapon effect:** Hitter. When a creature must succeed on a saving throw or become stunned by the effect of a weapon attack, increase the save DC by 2.

### Great Maccao Scale

- **Slots:** A, O
- **Carve:** 6-12
- **Capture:** 5-8
- **Armor effect:** You reduce fire damage you take by 3 while you wear this armor.
- **Other effect:** Uncommon armor upgrade material.

### Great Maccao Hide

- **Slots:** A, W
- **Carve:** 13-17
- **Capture:** 9-16
- **Armor effect:** You can use your reaction to reduce fall damage by 1d6 until the end of turn. Once you use this property you cannot use it again until you finish a long rest.
- **Weapon effect:** Whenever you break a grapple, you can choose to push the grappler up to 10 feet away from you as a bonus action.

### Champion's Crest

- **Slots:** A, W
- **Carve:** 18-19
- **Capture:** 17-19
- **Armor effect:** Whenever you are casting a spell as a ritual, you have advantage on Constitution saving throws to maintain concentration.
- **Weapon effect:** When you make a weapon attack with this weapon and roll a 20 for the attack roll, you can chose release a wave of concussive force. When you do, each creature within 5 feet of you must succeed on a DC 12 Strength saving throw or be knocked prone.

### Maccao Gem

- **Slots:** A, W
- **Carve:** 20
- **Capture:** 20
- **Armor effect:** Jump Master+. While wearing this armor, you can cast the jump spell but can target only yourself. You can use this property twice regaining all expended uses when you finish a short or long rest.
- **Weapon effect:** (Druid, Sorcerer, Warlock, or Wizard) While attuned to this weapon you can cast the jump spell at will, without expending a spell slot.

## QA flags

`missing-bio`
