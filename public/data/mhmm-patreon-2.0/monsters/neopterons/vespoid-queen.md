---
name: Vespoid Queen
slug: vespoid-queen
group: Neopterons
cr: "1"
pdfPage: 515
inGithubJson: true
source: MHMM-Patreon-2.0
size: Medium
creatureType: monstrosity (neopteron)
alignment: unaligned
ac: 14
hp: 27
hpFormula: "5d8 + 5"
speed: "0 ft., fly 30 ft."
str: 9
dex: 18
con: 13
int: 6
wis: 12
cha: 9
lootRolls: 2
---

# Vespoid Queen

## Bio

The Vespoid Queen resembles a typical Vespoid but is several times larger, with a deeper abdomen, giant rainbowcolored wings, a crown-like crest, and a thick exoskeleton shielding soft organs. She rarely leaves the nest, instead dispatching workers to forage. Her diet includes smaller insects, birds, small mammals, lizards, and some vegetation.

When she does venture out, she risks predation from bird wyverns. Most of her time is spent in the hive laying eggs. In battle, the queen uses the same attacks as ordinary Vespoids but with greater force. She also has a unique tactic: spraying body fluid that halves a hunter’s defense.

Additionally, she emits a rhythmic beating to command nearby Vespoids during fights.

## Stat Block

*Medium monstrosity (neopteron), unaligned*
- **Armor Class:** 14
- **Hit Points:** 27 (5d8 + 5)
- **Speed:** 0 ft., fly 30 ft.

| STR | DEX | CON | INT | WIS | CHA |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 9 | 18 | 13 | 6 | 12 | 9 |

- **Senses:** passive Perception 11
- **Languages:** —
- **Proficiency Bonus:** +2
- **Challenge:** 1

## Traits

### Flyby

The vespoid queen doesn't provoke opportunity attacks when it flies out of an enemy's reach.


## Actions

### Sting

Melee Weapon Attack: +6 to hit, reach 5 ft., one target. Hit: 1 piercing damage plus 10 (4d4) poison damage, and the target must succeed on a DC 11 Constitution saving throw or be paralyzed for 1 minute. The target can repeat the saving throw at the end of each of its turns, ending the effect on itself on a success.

### Corrosive Gas (Recharge 5-6)

The vespoid queen releases a corrosive gas from her stinger in a 30-foot cone. Each creature in that area must make a DC 14 Dexterity saving throw, taking 7 (2d6) acid damage on a failed save or half as much damage on a successful one. If a creature in that area has a nonmagical weapon made of metal, the weapon takes a permanent and cumulative -1 penalty to damage rolls. If its penalty drops to -5, the weapon is destroyed.


## Loot

**Carves/Capture rolls:** 2

| Carve | Capture | Material | Slots |
| --- | --- | --- | --- |
| 1-4 | — | Vespoid Abdomen | A, W |
| 5-12 | — | QueenVespoidShl | A |
| 13-17 | — | Monster Fluid | O |
| 18-20 | — | VespoidQn'sCrown | W |

## Materials (Runes)

These map to `Rune` entities (`name`, `carveChance`, `captureChance`, `slots`, `armorEffect`, `weaponEffect`).

### Vespoid Abdomen

- **Slots:** A, W
- **Carve:** 1-4
- **Capture:** —
- **Armor effect:** While you wear this armor, the maximum number of resources your party can gather on a hunt is increased by 1.
- **Weapon effect:** (Spellcaster Only) You know the poison spray cantrip while attuned to this weapon. If you already know it, the DC of the spell increases by 1.

### QueenVespoidShl

- **Slots:** A
- **Carve:** 5-12
- **Capture:** —
- **Armor effect:** Entomologist. When you capture an insect with a bug net, you instead catch two.

### Monster Fluid

- **Slots:** O
- **Carve:** 13-17
- **Capture:** —
- **Other effect:** Uncommon or rare upgrade material that can be used for weapons or armor.

### VespoidQn'sCrown

- **Slots:** W
- **Carve:** 18-20
- **Capture:** —
- **Weapon effect:** When you hit a creature with this weapon and it is suffering from a condition, it takes an extra 2 damage of the same type dealt.
