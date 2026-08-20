---
name: Blangonga
slug: blangonga
group: Fanged Beasts
cr: "9"
pdfPage: 261
inGithubJson: true
source: MHMM-Patreon-2.0
size: Large
creatureType: beast (fanged)
alignment: unaligned
ac: 18
acFrom: natural armor
hp: 161
hpFormula: "17d10 + 68"
speed: "40 ft., burrow 40 ft."
str: 19
dex: 17
con: 18
int: 13
wis: 8
cha: 10
lootRolls: 3
qa: missing-bio
---

# Blangonga

## Stat Block

*Large beast (fanged), unaligned*
- **Armor Class:** 18 (natural armor)
- **Hit Points:** 161 (17d10 + 68)
- **Speed:** 40 ft., burrow 40 ft.

| STR | DEX | CON | INT | WIS | CHA |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 19 | 17 | 18 | 13 | 8 | 10 |

- **Saving Throws:** Str +8, Dex +7, Wis +3
- **Skills:** Athletics +8, Perception +3
- **Damage Immunities:** cold, necrotic
- **Senses:** tremorsense 60 ft., passive Perception 13
- **Languages:** —
- **Proficiency Bonus:** +4
- **Challenge:** 9

## Actions

### Multiattack

The blangonga makes three Fist attacks. It can use its Ice Boulder in place of any melee attack.

### Fist

Melee Weapon Attack: +8 to hit, reach 5 ft., one target. Hit: 13 (2d8 + 4) bludgeoning damage. If the blangonga moved at least 20 feet straight toward a target immediately before the hit, the target takes an extra 9 (2d8) bludgeoning damage. If the target is a creature, it must succeed on a DC 16 Strength saving throw or be knocked prone.

### Ice Boulder

Ranged Weapon Attack: +8 to hit, range 30/120 ft., one target. Hit: 8 (1d8 +4) bludgeoning damage plus 4 (1d8) cold damage.

### Ice Spray (Recharge 5-6)

The blangonga exhales a spray of ice shards in a 30-foot cone. Each creature in that area must make a DC 16 Dexterity saving throw, taking 42 (12d6) cold damage on a failed save, or half as much damage on a successful one.


## Reactions

### Retreat

When the blangonga is hit by a melee attack, it can use its reaction to leap 20 feet away from the attacker without provoking opportunity attacks. 255


## Loot

**Carves/Capture rolls:** 3

| Carve | Capture | Material | Slots |
| --- | --- | --- | --- |
| 1-5 | 1-7 | Blangonga Pelt | A, W |
| 6-11 | 8 | Territorial Dung | O |
| 12-13 | 9-15 | Blangonga Whisker | A, W |
| 14-18 | 16-17 | Blangonga Tail | A, W |
| 19 | 18-20 | Brute Bone | W, O |
| 20 | — | Blangonga Fang | A, W |

## Materials (Runes)

These map to `Rune` entities (`name`, `carveChance`, `captureChance`, `slots`, `armorEffect`, `weaponEffect`).

### Blangonga Pelt

- **Slots:** A, W
- **Carve:** 1-5
- **Capture:** 1-7
- **Armor effect:** Well Rested+. When you finish a long rest, you gain 10 temporary hit points for 24 hours while attuned to this armor.
- **Weapon effect:** When you are in freezing temperatures, this weapon sheds bright light in a 10-foot radius and dim light for an additional 10 feet.

### Territorial Dung

- **Slots:** O
- **Carve:** 6-11
- **Capture:** 8
- **Other effect:** A material that replaces dung for crafting dung bombs. When used in this way, it becomes a territorial dung bomb that blinds a creature for 1 minute on hit.

### Blangonga Whisker

- **Slots:** A, W
- **Carve:** 12-13
- **Capture:** 9-15
- **Armor effect:** While you are attuned to this armor, you can use a bonus action to speak its command word to exhale ice and snow at a target within 30 feet of you. The target must make a DC 15 Dexterity saving throw, taking 4d6 cold damage on a failed save, or half as much damage on a successful one. You can use this property a number of times equal to half your proficiency bonus, regaining all expended uses when you finish a long rest.
- **Weapon effect:** Your weapon deals an extra 1d4 cold damage.

### Blangonga Tail

- **Slots:** A, W
- **Carve:** 14-18
- **Capture:** 16-17
- **Armor effect:** You ignore difficult terrain created by ice or snow while you wear this armor.
- **Weapon effect:** While you are attuned to this weapon you can draw it, to extinguish all nonmagical flames within 30 feet of you. This property can be used no more than once per hour.

### Brute Bone

- **Slots:** W, O
- **Carve:** 19
- **Capture:** 18-20
- **Weapon effect:** Your weapon deals an extra 1d4 bludgeoning damage.
- **Other effect:** Rare armor upgrade material.

### Blangonga Fang

- **Slots:** A, W
- **Carve:** 20
- **Capture:** —
- **Armor effect:** You have resistance to cold damage while you wear this armor.
- **Weapon effect:** Your weapon deals an extra 1d6 cold damage.

## QA flags

`missing-bio`
