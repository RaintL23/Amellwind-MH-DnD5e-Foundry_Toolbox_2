---
name: Volvidon Pup
slug: volvidon-pup
group: Fanged Beasts
cr: "1/2"
pdfPage: 297
inGithubJson: true
source: MHMM-Patreon-2.0
size: Small
creatureType: beast (fanged)
alignment: unaligned
ac: 13
acFrom: natural armor
hp: 36
hpFormula: "8d6 + 8"
speed: "30 ft."
str: 10
dex: 14
con: 12
int: 3
wis: 10
cha: 5
lootRolls: 1
qa: missing-bio
---

# Volvidon Pup

## Stat Block

*Small beast (fanged), unaligned*
- **Armor Class:** 13 (natural armor)
- **Hit Points:** 36 (8d6 + 8)
- **Speed:** 30 ft.

| STR | DEX | CON | INT | WIS | CHA |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 10 | 14 | 12 | 3 | 10 | 5 |

- **Damage Resistances:** fire
- **Senses:** passive Perception 10
- **Languages:** —
- **Proficiency Bonus:** +2
- **Challenge:** 1/2

## Actions

### Multiattack

The volvidon makes one Tongue attack and one Claw attack.

### Claws

Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 5 (1d6 + 2) slashing damage.

### Tongue

Melee Weapon Attack: +4 to hit, reach 10 ft., one target. Hit: 6 (1d8 + 2) bludgeoning damage and a Medium or smaller target is grappled (escape DC 10). Until this grapple ends, the target is restrained, and the volvidon can't make a make a Tongue attack against another target.


## Bonus Actions

### bonusActions

Pull in. The volvidon pulls a grappled target 10 feet towards it.


## Reactions

### Tumble

When a creature hits the volvidon with a melee weapon or spell attack, the volvidon can use its reaction to roll 5 feet backwards into an unoccupied space, without provoking opportunity attacks, and reduce the damage it takes from the attack by half.


## Loot

**Carves/Capture rolls:** 1

| Carve | Capture | Material | Slots |
| --- | --- | --- | --- |
| 1-5 | 1-3 | Sharpened Fang | A, W |
| 6-11 | 4-10 | Volvi Pup Carapace | A |
| 12-16 | 11-17 | Volvi Pup Talon | A |
| 17-20 | 18-20 | Volvi Pup Rickrack | A, W |

## Materials (Runes)

These map to `Rune` entities (`name`, `carveChance`, `captureChance`, `slots`, `armorEffect`, `weaponEffect`).

### Sharpened Fang

- **Slots:** A, W
- **Carve:** 1-5
- **Capture:** 1-3
- **Armor effect:** You reduce slashing damage you take by 2 while you wear this armor.
- **Weapon effect:** Your slashing weapon deals an extra 1 slashing damage.

### Volvi Pup Carapace

- **Slots:** A
- **Carve:** 6-11
- **Capture:** 4-10
- **Armor effect:** While wearing this armor you have a +1 bonus to Constitution saving throws to maintain concentration.

### Volvi Pup Talon

- **Slots:** A
- **Carve:** 12-16
- **Capture:** 11-17
- **Armor effect:** Botanist. When you successfully gather a plant resource, you instead gather 2.

### Volvi Pup Rickrack

- **Slots:** A, W
- **Carve:** 17-20
- **Capture:** 18-20
- **Armor effect:** While you wear this armor, you can choose to leave volvidon tracks instead of your own.
- **Weapon effect:** While you are attuned to this weapon, your tongue can extend out to 10 feet and you can grapple creatures with it. While a creature is grappled by your tongue, you are unable to speak coherently.

## QA flags

`missing-bio`
