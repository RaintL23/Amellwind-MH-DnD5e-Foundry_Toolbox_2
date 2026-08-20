---
name: Juvenile Zinogre
slug: juvenile-zinogre
group: Fanged Wyverns
cr: "3"
pdfPage: 324
inGithubJson: true
source: MHMM-Patreon-2.0
size: Large
creatureType: wyvern (fanged)
alignment: unaligned
ac: 16
acFrom: natural armor
hp: 82
hpFormula: "11d10 + 22"
speed: "30 ft."
str: 16
dex: 12
con: 15
int: 4
wis: 10
cha: 8
lootRolls: 3
qa: missing-bio
---

# Juvenile Zinogre

## Stat Block

*Large wyvern (fanged), unaligned*
- **Armor Class:** 16 (natural armor)
- **Hit Points:** 82 (11d10 + 22)
- **Speed:** 30 ft.

| STR | DEX | CON | INT | WIS | CHA |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 16 | 12 | 15 | 4 | 10 | 8 |

- **Skills:** Perception +2, Survival +2
- **Damage Immunities:** lightning
- **Senses:** darkvision 60 ft., passive Perception 12
- **Languages:** —
- **Proficiency Bonus:** +2
- **Challenge:** 3

## Traits

### Lightning Aura

At the start of each of the zinogre's turns, each creature within 5 feet of it takes 2 (1d4) lightning damage. A creature that touches the zinogre or hits it with a melee attack while within 5 feet of it takes 2 (1d4) lightning damage.


## Actions

### Multiattack

The zinogre makes one Claw attack and one Tail attack.

### Claw

Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 6 (1d6 + 3) piercing damage plus 2 (1d4) lightning damage.

### Tail

Melee Weapon Attack: +5 to hit, reach 10 ft., one target. Hit: 14 (2d10 + 3) bludgeoning damage plus 2 (1d4) lightning damage.


## Loot

**Carves/Capture rolls:** 3

| Carve | Capture | Material | Slots |
| --- | --- | --- | --- |
| 1-5 | — | Juv.Zinogre Shell | A |
| 6-8 | 6-9 | Juv.Zinogre Electrofur | A, W |
| 9-13 | 10-14 | Juv.Zinogre Claw | A, W |
| 14-16 | 15-19 | Fulgurbug | A |
| 17-20 | 20 | Juv.Zinogre Tail | A, W |

## Materials (Runes)

These map to `Rune` entities (`name`, `carveChance`, `captureChance`, `slots`, `armorEffect`, `weaponEffect`).

### Juv.Zinogre Shell

- **Slots:** A
- **Carve:** 1-5
- **Capture:** —
- **Armor effect:** You reduce lightning damage you take by 3 while you wear this armor.

### Juv.Zinogre Electrofur

- **Slots:** A, W
- **Carve:** 6-8
- **Capture:** 6-9
- **Armor effect:** While you wear this armor insects are attracted to you. You have advantage on Investigation check to find insects.
- **Weapon effect:** (Melee Weapon Only) You can use a bonus action to speak this magic sword's command word, causing lightning to arc across the weapon. This lightning sheds bright light in a 20-foot radius and dem light for an additional 20 feet. The lightning last until you use a bonus action to speak the command word again or until you drop or put away the weapon.

### Juv.Zinogre Claw

- **Slots:** A, W
- **Carve:** 9-13
- **Capture:** 10-14
- **Armor effect:** Entomologist. When you capture an insect with a bug net, you instead catch two.
- **Weapon effect:** When you cast a spell that deals lightning damage, add half of your proficiency bonus to that damage.

### Fulgurbug

- **Slots:** A
- **Carve:** 14-16
- **Capture:** 15-19
- **Armor effect:** While attuned to this armor, a thunderbug (AC 10; 1 hit point) travels with you. As an action, it will take flight (fly 20 ft.), until you use a bonus action to call it back to you. While in flight it sheds bright light in a 5-foot radius and dim light for an additional 15 feet. If the thunderbug is killed, a new one appears on your shoulder when you finish a short or long rest.

### Juv.Zinogre Tail

- **Slots:** A, W
- **Carve:** 17-20
- **Capture:** 20
- **Armor effect:** Whenever you make a saving throw against the paralyzed condition, you do so with a +1 bonus.
- **Weapon effect:** (Spellcaster Only) While attuned to this weapon you know the thunderwave spell. If you already know it, the spells save DC is increased by 1 and when a creature fails the saving throw, they are pushed back an additional 10 feet. 318

## QA flags

`missing-bio`
