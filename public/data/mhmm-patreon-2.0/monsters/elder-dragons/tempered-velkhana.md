---
name: Tempered Velkhana
slug: tempered-velkhana
group: Elder Dragons
cr: "22"
pdfPage: 230
inGithubJson: true
source: MHMM-Patreon-2.0
size: Huge
creatureType: dragon (elder)
alignment: unaligned
ac: 18
acFrom: natural armor
hp: 275
hpFormula: "19d12 + 152"
speed: "40 ft., fly 80 ft."
str: 22
dex: 12
con: 26
int: 14
wis: 16
cha: 21
lootRolls: 4
qa: missing-bio
---

# Tempered Velkhana

## Stat Block

*Huge dragon (elder), unaligned*
- **Armor Class:** 18 (natural armor)
- **Hit Points:** 275 (19d12 + 152)
- **Speed:** 40 ft., fly 80 ft.

| STR | DEX | CON | INT | WIS | CHA |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 22 | 12 | 26 | 14 | 16 | 21 |

- **Saving Throws:** Dex +8, Con+15, Wis +10, Cha +12
- **Skills:** Perception +10
- **Damage Resistances:** acid; bludgeoning, piercing, slashing damage from nonmagical attacks
- **Damage Immunities:** cold
- **Senses:** darkvision 120 ft., passive Perception 20
- **Languages:** Draconic
- **Proficiency Bonus:** +7
- **Challenge:** 22

## Traits

### Legendary Resistance (3/Day)

If the velkhana fails a saving throw, it can choose to succeed instead.

### Magic Resistance

The velkhana has advantage on saving throws against spells and other magical effects.

### Rime

An area covered in rime is difficult terrain. Additionally, any creature that ends its turn while touching a frost covered area takes 7 (2d6) cold damage and is grappled by the frost (Escape 23).


## Actions

### Multiattack

The velkhana makes three attacks with its tail.

### Tail

Melee Weapon Attack: +13 to hit, reach 15 ft., one target. Hit: 15 (2d8 + 6) piercing damage plus 10 (3d6) cold damage.

### Breath Weapons (Recharge 5-6)

The velkhana uses one of the following breath weapons.

### Cold Breath

The velkhana exhales an icy blast in a 90foot line that is 5 feet wide. That area is covered in rime for 1 minute and each creature in that line must make a DC 23 Dexterity saving throw, taking 66 (12d10) cold damage on a failed save, or half as much damage on a successful one.

### Hoarfrost Breath

The velkhana exhales an icy blast of hoarfrost in a 60-foot cone. The area is covered in rime for 1 minute and each creature in that area must make a DC 23 Constitution saving throw, taking 28 (8d6) cold damage on a failed save, or half as much damage on a successful one. 224 Additionally, four 1 foot thick, 10-foot-square walls of ice form within the area and last for 10 minutes. If the wall is formed on a creature's space, the creature is pushed to one side of the wall and must make a DC 23 Dexterity saving throw, taking 28 (8d6) cold damage on a failed save, or half as much damage on a successful one. Each 10-foot section of the wall has 12 AC and 30 hit points and is vulnerable to fire damage. If damaged to 0 hit points, it leaves a hole filled with freezing air. The first time a creature moves through the air on a turn, it makes a DC 23 Constitution save, taking 17 (5d6) cold damage on a failed save or half as much damage on a successful one.


## Bonus Actions

### Ice Armor (2/day)

The velkhana coats its body in ice, granting it a +2 bonus to its AC for 1 minute, or until it takes 55 points of damage from a single creature on a turn.


## Legendary Actions

The velkhana can take 3 legendary actions, choosing from the options below. Only one legendary action option can be used at a time and only at the end of another creature's turn. The velkhana regains spent legendary actions at the start of its turn.

### Bite

Melee Weapon Attack: +13 to hit, reach 15 ft., one target. Hit: 16 (3d6 + 6) piercing damage.

### Wing Attack (costs 2 Actions)

The velkhana beats its wings, covering the ground in a 15-foot radius in rime for 1 minute. Each creature within 15 feet of it must succeed on a DC 21 Dexterity saving throw or take 13 (2d6 + 6) bludgeoning damage and be knocked prone. The velkhana can then fly up to half its flying speed.

### Hail Storm (Costs 3 Actions)

The velkhana forms five boulder-sized chunks of ice from the water in the air that plummet to the ground at different points within 90 feet of it. Each creature in a 5-foot-radius sphere centered on each point that it chooses must make a DC 21 Dexterity saving throw. A creature takes 9 (2d8) cold damage plus 9 (2d8) bludgeoning damage on a failed save, or half as much damage on a successful one. A creature in the area of more than one ice chunk is affected only once.


## Loot

**Carves/Capture rolls:** 4

| Carve | Capture | Material | Slots |
| --- | --- | --- | --- |
| 1 | — | Elder Dragon Bone | O |
| 2 | — | Elder Dragon Blood | O |
| 3-7 | — | T.Crystal Shard | A, W |
| 8-11 | — | T.Velkhana Cortex | A, W |
| 12-14 | — | T.Velkhana Lash | A, W |
| 15-17 | — | T.Velkhana Hardclaw | A, W |
| 18-19 | — | T.Velkhana Crownhorn | A, W |
| 20 | — | T.Velkhana Crystal | A, W |

## Materials (Runes)

These map to `Rune` entities (`name`, `carveChance`, `captureChance`, `slots`, `armorEffect`, `weaponEffect`).

### Elder Dragon Bone

- **Slots:** O
- **Carve:** 1
- **Capture:** —
- **Other effect:** Any rarity armor upgrade material.

### Elder Dragon Blood

- **Slots:** O
- **Carve:** 2
- **Capture:** —
- **Other effect:** Any rarity weapon upgrade material.

### T.Crystal Shard

- **Slots:** A, W
- **Carve:** 3-7
- **Capture:** —
- **Armor effect:** Flinch Free. While wearing this armor you cannot be knocked prone or unwillingly moved from your current location by any means.
- **Weapon effect:** Quick Sheath. While attuned to this weapon, you can always sheath it as a free action even if you have already drawn a weapon as part of your move action.

### T.Velkhana Cortex

- **Slots:** A, W
- **Carve:** 8-11
- **Capture:** —
- **Armor effect:** Divine Blessing+3. While wearing this armor, you have a pool of divine dice equal to your proficiency bonus, which are d10s. When you take damage that you aren’t immune or resistant to, you can expend one or more divine dice to reduce the damage by the total rolled. You regain all expended dice when you finish a long rest.
- **Weapon effect:** While attuned to this weapon you can use an action to cast the wall of ice (save DC 17) spell from it, but it deals only 5d6 cold damage and the wall is only 5 feet high. Once you use this property, new walls deal no damage and are only 3 feet tall until you finish along rest.

### T.Velkhana Lash

- **Slots:** A, W
- **Carve:** 12-14
- **Capture:** —
- **Armor effect:** While you wear this armor you are resistant to cold damage and immune to the iceblight disease.
- **Weapon effect:** While you are attuned to this weapon, you can use a bonus action to speak its command word and exhale ice in a 30foot line that is 5 feet wide. Each creature in that line must make a DC 16 Dexterity saving throw, taking 6d6 cold damage on a failed save, or half as much damage on a successful one. You can use this property twice, regaining all expended uses when you finish a long rest

### T.Velkhana Hardclaw

- **Slots:** A, W
- **Carve:** 15-17
- **Capture:** —
- **Armor effect:** When a creature that touches or hits you with a melee weapon attack while within 5 feet of you, you can use your reaction to have it make a DC 16 Constitution saving throw. On a failed save, the creature is afflicted with iceblight for 1 minute. A creature can repeat its saving throw at the end of its turn, ending the effect on a success. You can use this property a number of times equal to 1 + your Constitution modifier (minimum of 1), regaining all expended uses when you finish a long rest.
- **Weapon effect:** Your cold spells bypass a creatures resistance to cold damage while you are attuned to this weapon.

### T.Velkhana Crownhorn

- **Slots:** A, W
- **Carve:** 18-19
- **Capture:** —
- **Armor effect:** (Sorcerer, Warlock, and Wizard Only) This armor has two runes that it regains daily at dawn. As an action you can expend one of these runes to coat your armor in magical ice, gaining 25 temporary hit points. If a creature hits you with a melee attack while you have these hit points, the creature takes 25 cold damage.
- **Weapon effect:** Critical Draw++. During the first round of combat your melee weapon attacks score a critical hit on a roll of 13 or higher. T.Velkhana Divinity Set bonus (2): When you critically hit with a weapon or spell that deals cold damage, you deal an extra 1d8 cold damage. Set bonus (4): An aura of frost builds when your weapon is sheathed for at least 1 minute. When you draw this weapon, it deals an extra 1d8 cold damage for the next 4 rounds.

### T.Velkhana Crystal

- **Slots:** A, W
- **Carve:** 20
- **Capture:** —
- **Armor effect:** You are immune to cold damage while you wear this armor.
- **Weapon effect:** Coalescence+. Whenever you succeed on a saving throw to end a condition, you gain a +2 bonus to your attack rolls and spell save DC, and your weapon or spell attacks deal an extra 1d6 cold, fire, or lightning damage (your choice) until the end of your next turn.

## QA flags

`missing-bio`
