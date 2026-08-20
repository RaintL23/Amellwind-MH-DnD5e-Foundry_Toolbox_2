---
name: Tempered Seregios
slug: tempered-seregios
group: Flying Wyverns
cr: "15"
pdfPage: 433
inGithubJson: true
source: MHMM-Patreon-2.0
size: Huge
creatureType: wyvern (flying)
alignment: unaligned
ac: 18
acFrom: natural armor
hp: 189
hpFormula: "18d12 + 72"
speed: "40 ft., fly 80 ft."
str: 21
dex: 20
con: 18
int: 8
wis: 12
cha: 15
lootRolls: 3
qa: missing-bio
---

# Tempered Seregios

## Stat Block

*Huge wyvern (flying), unaligned*
- **Armor Class:** 18 (natural armor)
- **Hit Points:** 189 (18d12 + 72)
- **Speed:** 40 ft., fly 80 ft.

| STR | DEX | CON | INT | WIS | CHA |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 21 | 20 | 18 | 8 | 12 | 15 |

- **Saving Throws:** Dex +10, Wis +6, Cha +7
- **Skills:** Acrobatics +10, Perception +6
- **Damage Resistances:** necrotic
- **Damage Immunities:** fire
- **Senses:** darkvision 60 ft., passive Perception 16
- **Languages:** —
- **Proficiency Bonus:** +5
- **Challenge:** 15

## Traits

### Flyby

The seregios doesn't provoke opportunity attacks when it flies out of an enemy's reach.


## Actions

### Multiattack

The seregios makes two Talon attacks, or three with its Bladescale attacks.

### Talon

Melee Weapon Attack: +10 to hit, reach 5 ft., one target. Hit: 18 (3d8 + 5) slashing damage. If the seregios is flying and dives at least 30 feet straight toward a target toward the target immediately before the hit, the target takes an extra 13 (3d8) slashing damage. If the target is a creature, it must succeed on a DC 18 Strength saving throw or be pushed up to 10 feet away and knocked prone.

### Tail

Melee Weapon Attack: +10 to hit, 10 ft., one target. Hit: 16 (2d10 + 5) bludgeoning damage plus 4 (1d8) piercing damage.

### Bladescale

Ranged Weapon Attack: +10 to hit, range 60/240 ft., one target. Hit: 14 (2d8 + 5) piercing damage and it must succeed on a DC 18 Constitution saving throw or lose 5 (2d4) hit points at the start of each of its turns due to an open wound. Each time the seregios hits the wounded target with an attack, the damage dealt by the wound increases by 5 (2d4). Any creature can take an action to stanch the wound with a successful DC 15 Wisdom (Medicine) check. The wound also closes if the target receives magical healing.

### Bladescale Barrage (Recharge 5-6)

If the seregios flies at least 30 feet as part of its movement, it can then use this action make one Talon attack against a creature. It then flies up to 20 feet away, or to its remaining fly speed (whichever is lower) before releasing a hailstorm of bladescales centered the target of the talon attack. Each creature in a 15-foot radius of the target (including the target) must make a DC 18 Dexterity saving throw, taking 40 (9d8) piercing damage and suffer from an open wound as if by the seregios's Bladescale attack on a failed save, or half as much damage and doesn't suffer from an open wound on a successful one.


## Legendary Actions

The seregios can take 3 legendary actions, choosing from the options below. Only one legendary action option can be used at a time and only at the end of another creature's turn. The seregios regains spent legendary actions at the start of its turn.

### Attack

The seregios makes one Tail attack or one Bladescale attack.

### Fly (Costs 2 Actions)

The seregios flies up to half its flying speed. 427


## Loot

**Carves/Capture rolls:** 3

| Carve | Capture | Material | Slots |
| --- | --- | --- | --- |
| 1-6 | 1-2 | Seregios Slavescale+ | A, W |
| 7-10 | 3-9 | Seregios Airblade+ | A, W |
| 11 | 10-11 | Seregios Carver+ | A, W |
| 12-13 | 12-14 | Seregios Breacher+ | A, W |
| 14-17 | 15-17 | Seregios Scraper+ | W |
| 18-19 | 18-19 | Seregios Impaler+ | A, W |
| 20 | 20 | Seregios Lens | W |

## Materials (Runes)

These map to `Rune` entities (`name`, `carveChance`, `captureChance`, `slots`, `armorEffect`, `weaponEffect`).

### Seregios Slavescale+

- **Slots:** A, W
- **Carve:** 1-6
- **Capture:** 1-2
- **Armor effect:** Handicraft+2. For 24 hours, you gain proficiency with two artisan tools of your choice each dawn.
- **Weapon effect:** When you jump or fly 20 feet towards a creature in a straight line without taking damage, your first attack against it deals an extra 1d6 damage.

### Seregios Airblade+

- **Slots:** A, W
- **Carve:** 7-10
- **Capture:** 3-9
- **Armor effect:** Wall Runner. You have a climbing speed equal to your walking speed while you wear this armor.
- **Weapon effect:** Carver. You have advantage on your first carve attempt on a creature while you are attuned to this weapon.

### Seregios Carver+

- **Slots:** A, W
- **Carve:** 11
- **Capture:** 10-11
- **Armor effect:** Constitution+. While you are attuned to this armor, you can reroll a Constitution saving throw that you fail. If you do so, you must use the new roll. You can use this property twice, regaining all expended uses when you finish a long rest.
- **Weapon effect:** While you are attuned to this armor, you can cast the blade barrier spell from it. Once you use this property, you can't use it again until you finish a long rest.

### Seregios Breacher+

- **Slots:** A, W
- **Carve:** 12-13
- **Capture:** 12-14
- **Armor effect:** Evade Window. This armor has 3 runes, and it regains 1d3 expended runes daily at dawn. When you fail a Dexterity saving throw while wearing it, you can use your reaction to expend 1 of its runes to succeed on that saving throw instead.
- **Weapon effect:** (Ranged Weapon Only) While you are attuned to this weapon you can speak its command word as a bonus action causing bladescales to magically appear and circle around the weapon. The next time you hit a creature with a ranged weapon attack in the next minute, the target of the attack and each creature within 5 feet of it must make a DC 16 Dexterity saving throw, taking 3d10 piercing damage on a failed save, or half as much damage on a successful one. You can use this property twice, regaining all expended uses when you finish a long rest.

### Seregios Scraper+

- **Slots:** W
- **Carve:** 14-17
- **Capture:** 15-17
- **Weapon effect:** Your weapon deals an extra 1d8 slashing damage.

### Seregios Impaler+

- **Slots:** A, W
- **Carve:** 18-19
- **Capture:** 18-19
- **Armor effect:** While you wear this armor, any creature that hits you with a melee attack takes 1d6 slashing damage.
- **Weapon effect:** When you hit a creature with this weapon, it must succeed on a DC 16 Constitution saving throw or lose 1d4 hit points at the start of each of its turns due to an open wound. Any creature can take an action to stanch the wound with a successful DC 12 Wisdom (Medicine) check. The wound also closes if the target receives magical healing.

### Seregios Lens

- **Slots:** W
- **Carve:** 20
- **Capture:** 20
- **Weapon effect:** Bladescale Hone. When you take the Dodge action and a creature misses you before the start of your next turn or when you succeed on a Dexterity saving throw to take only half damage, the next attack roll you make before the end of your next turn has advantage.

## QA flags

`missing-bio`
