---
name: Gajios
slug: gajios
group: Leviathans
cr: "1/2"
pdfPage: 452
inGithubJson: false
source: MHMM-Patreon-2.0
size: Small
creatureType: leviathan
alignment: unaligned
ac: 12
hp: 18
hpFormula: "4d6 + 4"
speed: "25 ft., swim 30 ft."
str: 15
dex: 14
con: 12
int: 1
wis: 11
cha: 9
lootRolls: 1
---

# Gajios

## Bio

The gajios is a small crocodilian leviathan distinguished by horn-like scales along both sides of the snout that give the head a double-saw profile. It lives near bodies of water and, when the water is deep, often remains submerged with only the tip of its nose exposed while it waits to ambush passing prey.

## Stat Block

*Small leviathan, unaligned*
- **Armor Class:** 12
- **Hit Points:** 18 (4d6 + 4)
- **Speed:** 25 ft., swim 30 ft.

| STR | DEX | CON | INT | WIS | CHA |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 15 | 14 | 12 | 1 | 11 | 9 |

- **Skills:** Stealth +3
- **Senses:** darkvision 60 ft., passive Perception 10
- **Languages:** —
- **Proficiency Bonus:** +2
- **Challenge:** 1/2

## Actions

### Razor Snout

Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 6 (1d4 + 2) slashing damage. If the target is a creature other than an undead or a construct, it must succeed on a DC 12 Constitution saving throw or lose 2 (1d4) hit points at the start of each of its turns due to a bloody wound. Each time the gajios hits the wounded target with this attack, the damage dealt by the wound increases by 2 (1d4). Any creature can take an action to stanch the wound with a successful DC 12 Wisdom (Medicine) check. The wound also closes if the target receives magical healing.


## Loot

**Carves/Capture rolls:** 1

| Carve | Capture | Material | Slots |
| --- | --- | --- | --- |
| 1-9 | — | Raw Meat | O |
| 10-16 | — | Gajios Hide | A |
| 17-20 | — | Razor Snout | A, W |

## Materials (Runes)

These map to `Rune` entities (`name`, `carveChance`, `captureChance`, `slots`, `armorEffect`, `weaponEffect`).

### Raw Meat

- **Slots:** O
- **Carve:** 1-9
- **Capture:** —
- **Other effect:** Provides 2 days rations when cooked.

### Gajios Hide

- **Slots:** A
- **Carve:** 10-16
- **Capture:** —
- **Armor effect:** While you are wearing this armor, the DC to staunch a wound you have is reduced by 2.

### Razor Snout

- **Slots:** A, W
- **Carve:** 17-20
- **Capture:** —
- **Armor effect:** While you wear this armor, any creature that hits you with a melee weapon, an unarmed strike, or a natural melee weapon takes 1 piercing damage.
- **Weapon effect:** While holding your weapon, you can speak a command word to transform it into a saw. The saw grants a +2 bonus to skill checks using woodworking tools. Speaking the command word again returns the saw to its original weapon form.
