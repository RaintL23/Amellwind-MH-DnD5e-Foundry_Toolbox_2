---
name: Young Lagiacrus
slug: young-lagiacrus
group: Leviathans
cr: "8"
pdfPage: 464
inGithubJson: true
source: MHMM-Patreon-2.0
size: Large
creatureType: leviathan
alignment: unaligned
ac: 16
acFrom: natural armor
hp: 180
hpFormula: "24d10 + 48"
speed: "30 ft., swim 40 ft."
str: 16
dex: 17
con: 14
int: 8
wis: 11
cha: 7
lootRolls: 3
qa: missing-bio
---

# Young Lagiacrus

## Stat Block

*Large leviathan, unaligned*
- **Armor Class:** 16 (natural armor)
- **Hit Points:** 180 (24d10 + 48)
- **Speed:** 30 ft., swim 40 ft.

| STR | DEX | CON | INT | WIS | CHA |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 16 | 17 | 14 | 8 | 11 | 7 |

- **Saving Throws:** Wis +3, Cha +1
- **Skills:** Perception +3
- **Damage Immunities:** acid, lightning
- **Senses:** darkvision 60 ft., passive Perception 13
- **Languages:** —
- **Proficiency Bonus:** +3
- **Challenge:** 8

## Traits

### Hold Breath

The lagiacrus can hold its breath for 12 hours.

### Legendary Resistance (1/Day)

If the lagiacrus fails a saving throw, it can choose to succeed instead.

### Lightning Aura

Lightning sparks off of the lagiacrus into the surrounding area. Any creature that ends its turn within 5 feet of the lagiacrus takes 3 (1d6) lightning damage.


## Actions

### Multiattack

The lagiacrus makes one Bite attack and one Claw attack.

### Bite

Melee Weapon Attack: +6 to hit, reach 5 ft., one target. Hit: 12 (2d8 + 3) piercing damage + 2 (1d4) lightning damage.

### Claw

Melee Weapon Attack: +6 to hit, reach 5 ft., one target. Hit: 10 (2d6 + 3) slashing damage. Lightning ball (Recharge 5-6). The lagiacrus exhales a ball of lightning which explodes at a point it can see within 60 feet of it. Each creature in a 10-foot radius sphere centered on that point must make a DC 13 Dexterity saving throw, taking 27 (5d10) lightning damage on a failed save or half as much damage on a successful one.


## Loot

**Carves/Capture rolls:** 3

| Carve | Capture | Material | Slots |
| --- | --- | --- | --- |
| 1-6 | 1-7 | Y.Lagiacrus Hide | A |
| 7-11 | 8-15 | Y.Lagiacrus Scale | A, W |
| 12-15 | 16 | Y.Lagiacrus Claw | W |
| — | 17-19 | Med Monster Bone | O |
| 16-19 | — | Y.Lagiacrus Tail | A, W |
| 20 | 20 | Y.Lagiacrus Horn | A, W |

## Materials (Runes)

These map to `Rune` entities (`name`, `carveChance`, `captureChance`, `slots`, `armorEffect`, `weaponEffect`).

### Y.Lagiacrus Hide

- **Slots:** A
- **Carve:** 1-6
- **Capture:** 1-7
- **Armor effect:** Guard. You cannot be pushed or knocked backwards while you wear this armor.

### Y.Lagiacrus Scale

- **Slots:** A, W
- **Carve:** 7-11
- **Capture:** 8-15
- **Armor effect:** While outside, as an action, you can strike a pose to call down a bolt of lightning from the sky that strikes in the distance behind to help create an intimidating scene. Each creature must make a DC 13 Charisma saving throw or become intimidated by you for 1 minute. A creature that is intimidated by you will do what it takes to appease you or get rid of you.
- **Weapon effect:** (Spellcaster Only) While attuned to this weapon, you know the lightning lure cantrip. If you already know it, you gain a +1 bonus to its spell save DC.

### Y.Lagiacrus Claw

- **Slots:** W
- **Carve:** 12-15
- **Capture:** 16
- **Weapon effect:** Your weapon deals an extra 1d6 lightning damage.

### Med Monster Bone

- **Slots:** O
- **Carve:** —
- **Capture:** 17-19
- **Other effect:** Rare armor upgrade material.

### Y.Lagiacrus Tail

- **Slots:** A, W
- **Carve:** 16-19
- **Capture:** —
- **Armor effect:** Champion Swimmer. You have a swimming speed of 30 feet while wearing this armor and your swim speed increases by an additional 10 feet for every young lagiacrus or lagiacrus material you have in your weapon, armor, or trinket.
- **Weapon effect:** Abnormal Status Atk up (S). Whenever you inflict a condition on a creature or object that has a duration of 1 minute or longer, the maximum duration of the condition is increased by 6 seconds.

### Y.Lagiacrus Horn

- **Slots:** A, W
- **Carve:** 20
- **Capture:** 20
- **Armor effect:** You have resistance to lighting damage while you wear this armor.
- **Weapon effect:** Critical Status (Incapacitate). When you make a weapon attack with this weapon, and roll a 20 for the attack roll, the target is incapacitated until the end of its next turn.

## QA flags

`missing-bio`
