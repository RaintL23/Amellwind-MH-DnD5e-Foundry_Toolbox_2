---
name: Viper Tobi-Kitachi
slug: viper-tobi-kitachi
group: Fanged Wyverns
cr: "3"
pdfPage: 322
inGithubJson: true
source: MHMM-Patreon-2.0
size: Small
creatureType: wyvern (fanged)
alignment: unaligned
ac: 14
acFrom: natural armor
hp: 84
hpFormula: "13d6 + 39"
speed: "30 ft., climb 30 ft."
str: 15
dex: 12
con: 16
int: 3
wis: 12
cha: 11
lootRolls: 3
qa: missing-bio
---

# Viper Tobi-Kitachi

## Stat Block

*Small wyvern (fanged), unaligned*
- **Armor Class:** 14 (natural armor)
- **Hit Points:** 84 (13d6 + 39)
- **Speed:** 30 ft., climb 30 ft.

| STR | DEX | CON | INT | WIS | CHA |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 15 | 12 | 16 | 3 | 12 | 11 |

- **Saving Throws:** Dex +3, Cha +2
- **Damage Immunities:** poison
- **Condition Immunities:** poisoned, paralyzed
- **Senses:** darkvision 60 ft., passive Perception 11
- **Languages:** —
- **Proficiency Bonus:** +2
- **Challenge:** 3

## Traits

### Glide

When the viper tobi-kitachi falls and isn't incapacitated, it can subtract up to 100 feet from the fall when calculating falling damage, and it can move up to 2 feet horizontally for every 1 foot it descends.

### Standing Leap

The viper tobi-kitachi's long jump is up to 20 feet and its high jump is up to 10 feet, with or without a running start.


## Actions

### Multiattack

The viper tobi-kitachi makes two Bite attacks and one Tail attack.

### Bite

Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 5 (1d6 + 2) piercing damage.

### Tail

Melee Weapon Attack: +4 to hit, reach 10 ft., one target. Hit: 6 (1d8 + 2) bludgeoning damage plus 3 (1d6) poison damage.

### Poison Spikes (Recharge 5-6)

The viper tobi-kitachi spins in a circle at a rapid pace, releasing poisoned spikes in a 15-foot cone in front of it. Each creature in that area must succeed on a DC 13 Constitution saving throw or be poisoned for 1 minute. While poisoned in this way, the creature takes 3 (1d6) poison damage at the start of each of its turns. A creature can repeat its saving throw at the end of its turn, ending the poison on a success.


## Loot

**Carves/Capture rolls:** 3

| Carve | Capture | Material | Slots |
| --- | --- | --- | --- |
| 1-7 | 1-6 | V.Tobi-Kit Fur | A, W |
| — | 7-10 | V.Poison Sac | A, W |
| 8-13 | 11-15 | V.Tobi-Kit Membrane | A |
| 14-17 | 16-20 | V.Tobi-Kit Claw | A, W |
| 18-20 | — | V.Tobi-Kit Thorn | A, W |

## Materials (Runes)

These map to `Rune` entities (`name`, `carveChance`, `captureChance`, `slots`, `armorEffect`, `weaponEffect`).

### V.Tobi-Kit Fur

- **Slots:** A, W
- **Carve:** 1-7
- **Capture:** 1-6
- **Armor effect:** You reduce acid damage you take by 3 while you wear this armor.
- **Weapon effect:** A purple hue emanates off your weapon. As an action you can extend the hue so that it encompasses your body for 1 minute. It provides no actual benefit, but it does look cool (at least you think so).

### V.Poison Sac

- **Slots:** A, W
- **Carve:** —
- **Capture:** 7-10
- **Armor effect:** Whenever you make a saving throw against the poisoned condition, you do so with a +2 bonus.
- **Weapon effect:** When you cast a spell that deals poison damage, add half of your proficiency bonus to that damage.

### V.Tobi-Kit Membrane

- **Slots:** A
- **Carve:** 8-13
- **Capture:** 11-15
- **Armor effect:** When you place this material into your armor it gains a gliding membrane, which extends from your forearms to your hindlegs. As an action or reaction, you can extend your arms to slow your descent to 30 feet until the end of the round. If you land before the round ends, you take no falling damage and land on your feet. Once used, you can't use this property again until you finish a short or long rest.

### V.Tobi-Kit Claw

- **Slots:** A, W
- **Carve:** 14-17
- **Capture:** 16-20
- **Armor effect:** Jump Master. While wearing this armor, you can use an action to double your jump distance. You can use this property twice, regaining all expended uses on a short or long rest.
- **Weapon effect:** Quick Sheath. While attuned to this weapon, you can always sheath it as a free action even if you have already drawn a weapon as part of your move action.

### V.Tobi-Kit Thorn

- **Slots:** A, W
- **Carve:** 18-20
- **Capture:** —
- **Armor effect:** Marathon Runner. While wearing this armor, your walking speed increases by 5 feet.
- **Weapon effect:** While attuned to this weapon, your spell save DC is increased by 1 when casting spells that paralyze or poison a creature.

## QA flags

`missing-bio`
