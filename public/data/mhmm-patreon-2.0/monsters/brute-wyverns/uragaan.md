---
name: Uragaan
slug: uragaan
group: Brute Wyverns
cr: "6"
pdfPage: 79
inGithubJson: true
source: MHMM-Patreon-2.0
size: Huge
creatureType: wyvern (brute)
alignment: unaligned
ac: 15
acFrom: natural armor
hp: 123
hpFormula: "13d12 + 39"
speed: "40 ft."
str: 19
dex: 10
con: 16
int: 5
wis: 12
cha: 6
lootRolls: 3
---

# Uragaan

## Bio

Uragaan are covered in a lustrous gold-colored hide. Its back is lined with hard crystals and its chin is plated with a rocklike shell, suggesting the uragaan has evolved a tough exterior due to life in volcanic regions. Its underbelly is covered in a sticky, tar-like substance which it uses to affix explosive rocks to itself.

The uragaan's signature ability is to roll its body into a wheel to increase its speed and agility. The growths on their back stable this rolling ability. It will do this often in an attempt to crush hunters. The uragaan creates a very effective weapon in the form of its chin by melting minerals and attaching them with lava, which it can use for breaking up rocks.

The chin also evens its center of gravity so its legs can compensate for its heavy body. In a group of uragaan, the one with the largest chin has the highest status among them. Uragaan is something of oddity in the food chain - it has almost no natural predators but is not particularly predatory itself and has no competitors, preferring to consume vast amounts of plants and rock.

The rocks that it feeds on are surprisingly nutrient rich, and its rock-hard lower jaw is perfectly designed to break them up, although it does make them awkward to swallow.

## Stat Block

*Huge wyvern (brute), unaligned*
- **Armor Class:** 15 (natural armor)
- **Hit Points:** 123 (13d12 + 39)
- **Speed:** 40 ft.

| STR | DEX | CON | INT | WIS | CHA |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 19 | 10 | 16 | 5 | 12 | 6 |

- **Skills:** Perception +4
- **Damage Resistances:** fire, lightning
- **Senses:** passive Perception 14
- **Languages:** —
- **Proficiency Bonus:** +3
- **Challenge:** 6

## Actions

### Multiattack

The uragaan makes one Tail attack and Two Chin Slam attacks.

### Chin Slam

Melee Weapon Attack: +7 to hit, reach 5 ft., one target. Hit: 17 (3d8 + 4) bludgeoning damage.

### Tail

Melee Weapon Attack: +7 to hit, reach 5 ft., one target. Hit: 20 (3d10 + 4) bludgeoning damage.

### Roll (Recharge 5-6)

The uragaan rolls its body into a wheel and moves up to its speed, during this move it can move through other creatures without provoking opportunity attacks. Each creature the uragaan moves through must succeed on a DC 15 Dexterity saving throw or take 28 (8d6) bludgeoning damage and be knocked prone.

### Emit Flames

(2/per Long rest). The uragaan releases a wave of fire from its underside in a 10-foot radius around it. Each creature in that area must make a DC 14 Dexterity saving throw, taking 21 (6d6) fire damage and catches fire on a failed save or half as much damage on a successful one and does not catch fire. Until a creature takes an action to douse the fire, the creature takes 3 (1d6) fire damage at the start of each of its turns.


## Loot

**Carves/Capture rolls:** 3

| Carve | Capture | Material | Slots |
| --- | --- | --- | --- |
| 1-4 | 1-5 | Uragaan Carapace | A, W |
| 5-9 | 6-9 | Uragaan Scale | W |
| — | 10-11 | U.Firecell Stone | A, W |
| 10-14 | 12-15 | Uragaan Scute | A, W |
| — | 16-18 | Flame Sac | A, W |
| 15-17 | 19-20 | Uragaan Marrow | A |
| 18-19 | — | Uragaan Jaw | W |
| 20 | — | Uragaan Ruby | A |

## Materials (Runes)

These map to `Rune` entities (`name`, `carveChance`, `captureChance`, `slots`, `armorEffect`, `weaponEffect`).

### Uragaan Carapace

- **Slots:** A, W
- **Carve:** 1-4
- **Capture:** 1-5
- **Armor effect:** While you are wearing this armor, you can use your reaction or bonus action to gain resistance to lightning or thunder damage (your choice) until the end of your next turn. Once you use this property, you cannot use it again until you finish a long rest.
- **Weapon effect:** Sharpening. During a short or long rest you can spend your time sharpening a bladed weapon. When you hit a creature for the first time after sharpening it, the weapon deals its maximum piercing or slashing damage to the target.

### Uragaan Scale

- **Slots:** W
- **Carve:** 5-9
- **Capture:** 6-9
- **Weapon effect:** Carver. You have advantage on your first carve attempt on a creature while you are attuned to this weapon.

### U.Firecell Stone

- **Slots:** A, W
- **Carve:** —
- **Capture:** 10-11
- **Armor effect:** Shield. While you are attuned to this armor and you use a reaction that would increase your AC, you gain an additional +1 bonus to your AC until the start of your next turn.

### Uragaan Scute

- **Slots:** A, W
- **Carve:** 10-14
- **Capture:** 12-15
- **Armor effect:** Guard. You cannot be pushed or knocked backwards while you wear this armor.
- **Weapon effect:** Partbreaker. You deal an extra 1d4 damage when you critically hit with this weapon.

### Flame Sac

- **Slots:** A, W
- **Carve:** —
- **Capture:** 16-18
- **Armor effect:** While you are attuned to this armor, you can use a bonus action to speak its command word and exhale fire at a target within 15 feet of you. The target must make a DC 15 Dexterity saving throw, taking 3d6 fire damage on a failed save, or half as much damage on a successful one. You can use this property a number of times equal to half your proficiency bonus, regaining all expended uses when you finish a long rest.
- **Weapon effect:** When you cast a spell that deals fire damage, it deals an extra 1d4 fire damage.

### Uragaan Marrow

- **Slots:** A
- **Carve:** 15-17
- **Capture:** 19-20
- **Armor effect:** Negate Bleeding. You are immune to wounding effects, such as the Odogaron's bloody wound or the bearded devil's infernal wound while you wear this armor.

### Uragaan Jaw

- **Slots:** W
- **Carve:** 18-19
- **Capture:** —
- **Weapon effect:** (Bowgun Only) Spread up. When you hit a creature with spread ammo and it is within half your normal bowgun range, increase the damage die size by 1.

### Uragaan Ruby

- **Slots:** A
- **Carve:** 20
- **Capture:** —
- **Armor effect:** Uragaan Protection. When you must make a saving throw while taking the dodge action, you can use your Armor Class in place of making the roll. You can use this property three times, regaining all uses when you finish a long rest.
