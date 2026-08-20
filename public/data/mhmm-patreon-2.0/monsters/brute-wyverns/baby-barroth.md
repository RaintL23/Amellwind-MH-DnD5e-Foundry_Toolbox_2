---
name: Baby Barroth
slug: baby-barroth
group: Brute Wyverns
cr: "1/4"
pdfPage: 60
inGithubJson: true
source: MHMM-Patreon-2.0
size: Small
creatureType: wyvern (brute)
alignment: unaligned
ac: 12
acFrom: "14 with Wallow"
hp: 31
hpFormula: "7d6+7"
speed: "30 ft."
str: 14
dex: 8
con: 12
int: 4
wis: 6
cha: 4
lootRolls: 1
qa: missing-bio
---

# Baby Barroth

## Stat Block

*Small wyvern (brute), unaligned*
- **Armor Class:** 12 (14 with Wallow)
- **Hit Points:** 31 (7d6+7)
- **Speed:** 30 ft.

| STR | DEX | CON | INT | WIS | CHA |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 14 | 8 | 12 | 4 | 6 | 4 |

- **Senses:** passive Perception 8
- **Languages:** —
- **Proficiency Bonus:** +2
- **Challenge:** 1/4

## Actions

### HeadButt

Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 6 (1d8 + 2) bludgeoning damage.

### Stomp

Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 5 (1d6 + 2) bludgeoning damage.

### Wallow

The barroth wallows in mud, covering itself in a thick layer, which grants the barroth a +2 bonus to its AC for 1 minute or until it takes 10 damage from a single attack.


## Loot

**Carves/Capture rolls:** 1

| Carve | Capture | Material | Slots |
| --- | --- | --- | --- |
| 1-5 | — | Fertile Mud | A, O |
| 6-13 | — | B.Barroth Shell | A, W |
| 14-19 | — | B.Barroth Ridge | A |
| 20 | — | B.Barroth Claw | W |

## Materials (Runes)

These map to `Rune` entities (`name`, `carveChance`, `captureChance`, `slots`, `armorEffect`, `weaponEffect`).

### Fertile Mud

- **Slots:** A, O
- **Carve:** 1-5
- **Capture:** —
- **Armor effect:** You do not suffer from difficult terrain in muddy or swamp terrain while wearing this armor.
- **Other effect:** A material that increases the fertility of crops.

### B.Barroth Shell

- **Slots:** A, W
- **Carve:** 6-13
- **Capture:** —
- **Armor effect:** You reduce bludgeoning damage you take by 2 while you wear this armor.
- **Weapon effect:** Your bludgeoning weapon deals an extra 1 bludgeoning damage.

### B.Barroth Ridge

- **Slots:** A
- **Carve:** 14-19
- **Capture:** —
- **Armor effect:** Whenever you make a saving throw against the stunned condition, you do so with a +1 bonus.

### B.Barroth Claw

- **Slots:** W
- **Carve:** 20
- **Capture:** —
- **Weapon effect:** (Hammer & Lance Only) You gain a +1 bonus to your attack rolls if you move 20 feet in a straight line towards a creature without taking damage.

## QA flags

`missing-bio`
