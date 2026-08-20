---
name: Young Odogaron
slug: young-odogaron
group: Fanged Wyverns
cr: "4"
pdfPage: 313
inGithubJson: true
source: MHMM-Patreon-2.0
size: Medium
creatureType: wyvern (fanged)
alignment: unaligned
ac: 14
acFrom: natural armor
hp: 97
hpFormula: "15d8 + 30"
speed: "50 ft., climb 30 ft."
str: 16
dex: 13
con: 15
int: 6
wis: 10
cha: 10
lootRolls: 2
qa: missing-bio
---

# Young Odogaron

## Stat Block

*Medium wyvern (fanged), unaligned*
- **Armor Class:** 14 (natural armor)
- **Hit Points:** 97 (15d8 + 30)
- **Speed:** 50 ft., climb 30 ft.

| STR | DEX | CON | INT | WIS | CHA |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 16 | 13 | 15 | 6 | 10 | 10 |

- **Saving Throws:** Con +4, Wis +2, Cha +2
- **Skills:** Acrobatics +3, Athletics +5
- **Damage Resistances:** fire, necrotic
- **Senses:** darkvision 60 ft., passive Perception 10
- **Languages:** —
- **Proficiency Bonus:** +2
- **Challenge:** 4

## Actions

### Multiattack

The odogaron makes one with Bite attack and two Claw attacks.

### Bite

Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 7 (1d8 + 3) piercing damage.

### Claws

Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit 6 (1d6 + 3) slashing damage. If the target is a creature other than an undead or a construct, it must succeed on a DC 13 Constitution saving throw or lose 2 (1d4) hit points at the start of each of its turns due to a bloody wound. Each time the odogaron hits the wounded target with this attack, the damage dealt by the wound increases by 2 (1d4). Any creature can take an action to stanch the wound with a successful DC 13 Wisdom (Medicine) check. The wound also closes if the target receives magical healing.


## Reactions

### Uncanny Dodge

The odogaron halves the damage that it takes from an attack that hits it. The odogaron must be able to see the attacker.


## Loot

**Carves/Capture rolls:** 2

| Carve | Capture | Material | Slots |
| --- | --- | --- | --- |
| 1-7 | 1-9 | Y.Odogaron Scale | A, W |
| 8-13 | 10-16 | Y.Odogaron Claw | A, W |
| 14-18 | — | Y.Odogaron Fang | A, W |
| 19 | 17 | Nourishing Extract | O |
| 20 | 18-20 | Y.Odogaron Plate | A, W |

## Materials (Runes)

These map to `Rune` entities (`name`, `carveChance`, `captureChance`, `slots`, `armorEffect`, `weaponEffect`).

### Y.Odogaron Scale

- **Slots:** A, W
- **Carve:** 1-7
- **Capture:** 1-9
- **Armor effect:** While you are wearing this armor, you can use your reaction or bonus action to gain resistance to necrotic damage until the end of your next turn. You can use this property once, regaining all uses when you finish a long rest.
- **Weapon effect:** While you are attuned to this weapon, you can use this weapon as your spellcasting focus.

### Y.Odogaron Claw

- **Slots:** A, W
- **Carve:** 8-13
- **Capture:** 10-16
- **Armor effect:** Wall Runner. You have a climbing speed equal to your walking speed while you wear this armor.
- **Weapon effect:** When you cast a spell that deals necrotic damage, add half of your proficiency bonus to that damage.

### Y.Odogaron Fang

- **Slots:** A, W
- **Carve:** 14-18
- **Capture:** —
- **Armor effect:** Sprinter. While wearing this armor, you can take the dash action as a bonus action. You can use this property a number of times equal to half of your Dexterity modifier (minimum of 1), regaining all expended uses when you finish a long rest.
- **Weapon effect:** Your weapon deals an extra 1d4 necrotic damage.

### Nourishing Extract

- **Slots:** O
- **Carve:** 19
- **Capture:** 17
- **Other effect:** A material that replaces the catalyst for crafting demondrug or armorskin potions. It can also be used in place of mega nutrients when crafting max potions or ancient potions.

### Y.Odogaron Plate

- **Slots:** A, W
- **Carve:** 20
- **Capture:** 18-20
- **Armor effect:** Hypercoagulation. While you wear this armor, you have advantage on Constitution saving throws against wounding effects, such as the Odogaron's bloody wound or the bearded devil's infernal wound.
- **Weapon effect:** Speed Sharpening. You can spend 1 minute sharpening a bladed weapon. When you hit a creature for the first time after sharpening it, the weapon deals its maximum piercing or slashing damage to the target.

## QA flags

`missing-bio`
