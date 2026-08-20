---
name: Red Khezu
slug: red-khezu
group: Flying Wyverns
cr: "18"
pdfPage: 391
inGithubJson: false
source: MHMM-Patreon-2.0
size: Large
creatureType: wyvern (flying)
alignment: unaligned
ac: 17
acFrom: natural armor
hp: 207
hpFormula: "18d10 + 108"
speed: "30 ft., fly 20 ft., climb 30 ft."
str: 24
dex: 9
con: 22
int: 5
wis: 11
cha: 1
lootRolls: 3
---

# Red Khezu

## Bio

The Red Khezu, much like its white cousin, falls into the class of Flying Wyvern. It is actually a normal Khezu, despite what is said by many, while the more common white Khezu are albinos. The Red Khezu's body is for the most part the same as a normal Khezu's, aside from the obvious color difference.

It does, however Red Khezu has more muscle mass in its body than a Khezu, making many of its attacks more powerful. Its electrical organs are further developed as well, giving it a wider variety of ways to disable and snare prey. The skin of Red Khezu has strange properties to it, allowing it to stretch its neck can much farther than Khezu.

## Stat Block

*Large wyvern (flying), unaligned*
- **Armor Class:** 17 (natural armor)
- **Hit Points:** 207 (18d10 + 108)
- **Speed:** 30 ft., fly 20 ft., climb 30 ft.

| STR | DEX | CON | INT | WIS | CHA |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 24 | 9 | 22 | 5 | 11 | 1 |

- **Skills:** Perception +6
- **Damage Resistances:** cold
- **Damage Immunities:** fire, lightning
- **Condition Immunities:** blind, paralyzed, charmed
- **Senses:** blindsight 60 ft., passive Perception 16
- **Languages:** —
- **Proficiency Bonus:** +6
- **Challenge:** 18

## Traits

### Electric Barrier

The khezu shrouds its body in electricity. Each creature that ends its turn within 5 feet of the khezu takes 22 (4d10) lightning damage.

### Keen Smell

The khezu has advantage on Wisdom (Perception) checks that rely on smell.

### Standing Leap

The khezu's long jump is up to 30 feet and its high jump is up to 15 feet, with or without a running start.


## Actions

### Multiattack

The khezu makes three Lightning Ball attacks or it uses its Electric Current and makes two Bite attacks.

### Bite

Melee Weapon Attack: +13 to hit, reach 20 ft., one target. Hit: 18 (2d10 + 7) piercing damage. Lightning ball. Ranged Weapon Attack: +12 to hit, reach 60/240 ft., one target. Hit: 14 (4d6) lightning damage and the target must make a DC 20 Constitution saving throw or become paralyzed until the end of its next turn.

### Electric Current

The khezu releases a jolt of electricity all around it. Each creature within 5 feet of it must make a DC 20 Constitution saving throw or become paralyzed until the end of its next turn.

### Deadly Leap

If the khezu jumps at least 15 feet as part of its movement, it can then use this action to land on its feet in a space that contains one or more other creatures. Each of those creatures must succeed on a DC 21 Strength or Dexterity saving throw (target's choice) or be knocked prone and take 14 (2d6 + 7) bludgeoning damage plus 14 (2d6 + 7) lightning damage. On a successful save, the creature takes only half the damage, isn't knocked prone, and is pushed 5 feet out of the khezu's space into an unoccupied space of the creature's choice. If no unoccupied space is within range, the creature instead falls prone in the khezu's space.

### Violent Roar (Recharge 5-6)

The khezu releases a high pitched scream that is excruciatingly painful to creatures in a 45-foot radius around it. Each creature 385


## Loot

**Carves/Capture rolls:** 3

| Carve | Capture | Material | Slots |
| --- | --- | --- | --- |
| 1-8 | 1-6 | Pale Extract | A, W |
| 9-13 | 7-10 | Alluring Glosshide | A, W, O |
| 14-16 | 11-14 | Khezu Special Cut | A |
| 17-19 | 15-18 | Lightning Sac | A, W |
| 20 | 19-20 | Alluring Fellwing | A, W |

## Materials (Runes)

These map to `Rune` entities (`name`, `carveChance`, `captureChance`, `slots`, `armorEffect`, `weaponEffect`).

### Pale Extract

- **Slots:** A, W
- **Carve:** 1-8
- **Capture:** 1-6
- **Armor effect:** Recovery Level. Whenever you suffer an effect that deals damage to you at the start of your turn your armor flashes white and ends the effect. This could include such effects as a bleeding wound, acid or poison that continues to damage you over time, being set on fire, etc. They have no effect on environmental effects, damage that you take from being in a given location or spell's area of effect or similar damage sources.
- **Weapon effect:** While you are holding this weapon, you can use an action to release a jolt of electricity in a 5-foot radius around you. Each creature in that area must succeed on a DC 13 Constitution saving throw or be incapacitated and has its movement speed is reduced to 0 until the end of its next turn. You can use this property a number of times equal to half of your Constitution modifier (minimum of 1), regaining all expended uses when you finish a long rest.
- **Other effect:** A material used for crafting Mega Demondrug & Mega Armorskin.

### Alluring Glosshide

- **Slots:** A, W, O
- **Carve:** 9-13
- **Capture:** 7-10
- **Armor effect:** Wide-Range+. When you use Herbs, Antidotes, Cool Drinks, Hot Drinks, Adamant Seeds, or Might Seeds; all other creatures within a 20-foot radius of you gain its effect.
- **Weapon effect:** As an action you shroud your body in electricity for 1 minute. Any creature that ends its turn within 5 feet of you takes 1d6 lightning damage. Once you use this property you can't use it again until you finish a short or long rest.

### Khezu Special Cut

- **Slots:** A
- **Carve:** 14-16
- **Capture:** 11-14
- **Armor effect:** Light Eater. When you consume a ration or nonmagical drink you have a 25% chance for it to magically create a duplicate of it in your hand or container.

### Lightning Sac

- **Slots:** A, W
- **Carve:** 17-19
- **Capture:** 15-18
- **Armor effect:** You are immune to lightning damage while you wear this armor..
- **Weapon effect:** Your weapon deals an extra 1d8 lightning damage.

### Alluring Fellwing

- **Slots:** A, W
- **Carve:** 20
- **Capture:** 19-20
- **Armor effect:** Recovery Speed+. Whenever you roll a Hit Die to regain hit points, double the number of hit points it restores. Additionally, you regain all expended hit die when you finish a long rest.
- **Weapon effect:** As an action you release a ball of lightning that travels along the ground in a 120-foot line, or until it hits a creature before creating an explosion of lightning. Each creature in a 5-foot radius around the creature or end of the line must make a DC 17 Constitution saving throw, taking 14 (4d6) lightning damage and be incapacitated and have its movement speed reduced to 0 until the end of your next turn on a failed save, or half as much damage, isn’t incapacitated, and its movement speed isn't reduced on a successful one.
