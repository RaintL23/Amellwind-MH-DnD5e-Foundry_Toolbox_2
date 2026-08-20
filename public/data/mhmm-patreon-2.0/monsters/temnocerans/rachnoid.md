---
name: Rachnoid
slug: rachnoid
group: Temnoceran
cr: "1"
pdfPage: 543
inGithubJson: true
source: MHMM-Patreon-2.0
size: Small
creatureType: monstrosity (temnoceran)
alignment: unaligned
ac: 15
acFrom: natural armor
hp: 27
hpFormula: "5d6 + 10"
speed: "20 ft., burrow 10 ft., climb 20 ft."
str: 14
dex: 16
con: 15
int: 2
wis: 11
cha: 4
lootRolls: 1
---

# Rachnoid

## Bio

The infant form of Rakna-Kadaki. At this stage in their life cycle, they cling to their mother's abdomen, feeding on scraps of her regurgitated prey. From birth, they are instantly able to spit webs that are just as strong as their mother's, which they use to bind prey or swiftly move about at her command.

## Stat Block

*Small monstrosity (temnoceran), unaligned*
- **Armor Class:** 15 (natural armor)
- **Hit Points:** 27 (5d6 + 10)
- **Speed:** 20 ft., burrow 10 ft., climb 20 ft.

| STR | DEX | CON | INT | WIS | CHA |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 14 | 16 | 15 | 2 | 11 | 4 |

- **Damage Immunities:** fire
- **Senses:** darkvision 60 ft., passive Perception 10
- **Languages:** —
- **Proficiency Bonus:** +2
- **Challenge:** 1

## Traits

### Spider Climb

The spider can climb difficult surfaces, including upside down on ceilings, without needing to make an ability check.

### Web Sense

While in contact with a web, the spider knows the exact location of any other creature in contact with the same web.

### Web Walker

The spider ignores movement restrictions caused by webbing.


## Actions

### Ram

Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 7 (2d4 + 2) bludgeoning damage.

### Web (2/long rest)

Ranged Weapon Attack: +5 to hit, range 30/60 ft., one creature. The target is restrained by webbing As an action, the restrained target can make a DC 12 Strength check, bursting the webbing on a success. The webbing can also be attacked and destroyed (AC 10; hp 5; vulnerability to slashing damage; immunity to bludgeoning, fire, poison, and psychic damage).

### Fire Breath (Recharge 5-6)

The rachnoid exhales fire in a 15-foot line that is 5 feet wide. Each creature in that line must make a DC l2 Dexterity saving throw, taking 7 (2d6) fire damage on a failed save, or half as much damage on a successful one.


## Loot

**Carves/Capture rolls:** 1

| Carve | Capture | Material | Slots |
| --- | --- | --- | --- |
| 1-7 | — | Sharp Claw | W |
| 8-15 | — | Rachnoid Silk | A, O |
| 16-20 | — | Monster Fluid | A |

## Materials (Runes)

These map to `Rune` entities (`name`, `carveChance`, `captureChance`, `slots`, `armorEffect`, `weaponEffect`).

### Sharp Claw

- **Slots:** W
- **Carve:** 1-7
- **Capture:** —
- **Weapon effect:** Your slashing weapon deals an extra 1 slashing damage.

### Rachnoid Silk

- **Slots:** A, O
- **Carve:** 8-15
- **Capture:** —
- **Armor effect:** While you are grappling a target you can use an action to speak this armor's command word, causing rachnoid silk covering your armor to wrap around the grappled target. Until you or the creature takes fire damage, or until it breaks free of your grapple, it has disadvantage on Strength (Athletics) and Dexterity (Acrobatics) checks. Once you use this property, you can't use it again until you finish a long rest.
- **Other effect:** Can be used to craft pitfall trap (AGtMH p.63) by combining it with a trap tool using smithing tools (DC 15).

### Monster Fluid

- **Slots:** A
- **Carve:** 16-20
- **Capture:** —
- **Other effect:** Uncommon or rare upgrade material that can be used for weapons or armor.
