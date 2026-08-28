---
name: Pumpkin Uragaan
slug: pumpkin-uragaan
group: Brute Wyverns
cr: "10"
pdfPage: 82
inGithubJson: true
source: MHMM-Patreon-2.0
size: Huge
creatureType: wyvern (brute)
alignment: unaligned
ac: 17
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

# Pumpkin Uragaan

## Bio

The pumpkin uragaan possesses a near identical body shape to the normal uragaan yet has a different coloration. Its back and belly are a dark purple while the rest of its body is a pumpkin orange. Its chin is no longer plated with a rock-like shell but instead is covered by a large jack-o'-lantern.

It has been said that on All Hallows' Eve, a pumpkin uragaan appears in a great pumpkin patch on the outskirts of one of the many villages in the old world. By dawn, the village is left burning, broken, and covered in pumpkin; and the pumpkin uragaan vanishes, until the next All Hallows' Eve.

## Stat Block

_Huge wyvern (brute), unaligned_

- **Armor Class:** 17 (natural armor)
- **Hit Points:** 123 (13d12 + 39)
- **Speed:** 40 ft.

| STR | DEX | CON | INT | WIS | CHA |
| --: | --: | --: | --: | --: | --: |
|  19 |  10 |  16 |   5 |  12 |   6 |

- **Skills:** Perception +5
- **Senses:** passive Perception 15
- **Languages:** —
- **Proficiency Bonus:** +4
- **Challenge:** 10

## Traits

### Glowing Chin

The uragaan's Jack-o'-lantern chin glows from its eyes and mouth, releasing bright light in a 30foot cone and dim light for an additional 30 feet.

### Risen (1/day)

When the uragaan is reduced to 0 hit points, it resurrects on initiative count 20 (losing initiative ties). When it resurrects, the uragaan's regains its maximum hit points, its type is changed from wyvern to undead, and it gains the undead fortitude trait.

### Undead Fortitude (While Undead Only)

If damage reduces the uragaan to 0 hit points, it must make a Constitution saving throw with a DC of 5 + the damage taken, unless the damage is radiant or from a critical hit. On a success, the uragaan drops to 1 hit point instead.

## Actions

### Multiattack

The uragaan makes one Tail attack and two Chin Slam attacks. Or it makes three Pumpkin Toss attacks.

### Jack-o'-lantern Chin Slam

Melee Weapon Attack: +8 to hit, reach 5 ft., one target. Hit: 17 (3d8 + 4) bludgeoning damage.

### Pumpkin Toss

Ranged Weapon Attack: +8 to hit, range 60/240 ft., one target. Hit: 17 (3d8 + 4) bludgeoning damage, and the target is covered in pumpkin guts.

### Tail

Melee Weapon Attack: +8 to hit, reach 5 ft., one target. Hit: 20 (3d10 + 4) bludgeoning damage.

### Roll (Recharge 5-6)

The uragaan rolls its body into a wheel and moves up to its speed. During this move, it can move through other creatures without provoking opportunity attacks. Each creature the uragaan moves through must succeed on a DC 16 Dexterity saving throw or take 28 (8d6) bludgeoning damage and be knocked prone.

### Emit Flames

(2/per Long rest). The uragaan releases a wave of fire from its underside in a 10-foot radius around it. Each creature in that area must make a DC 15 Dexterity saving throw, taking 21 (6d6) fire damage and catches fire on a failed save or half as much on a successful one and does not catch fire. until a creature takes an action to douse the fire, the creature takes 3 (1d6) fire damage at the start of each of its turns. 76

## Loot

**Carves/Capture rolls:** 3

| Carve | Capture | Material           | Slots |
| ----- | ------- | ------------------ | ----- |
| 1-4   | —       | Pumpkin.U Carapace | A, W  |
| 5-8   | —       | P.Firecell Stone   | A, W  |
| 9-11  | —       | Pumpkin.U Scale    | A, W  |
| 12-14 | —       | Pumpkin.U Scute    | A, W  |
| 15-16 | —       | Pumpkin Flame Sac  | A, W  |
| 17-18 | —       | Pumpkin.U Marrow   | A     |
| 19    | —       | Pumpkin.U Jaw      | A, W  |
| 20    | —       | Pumpkin.U Ruby     | A, W  |

## Materials (Runes)

These map to `Rune` entities (`name`, `carveChance`, `captureChance`, `slots`, `armorEffect`, `weaponEffect`).

### Pumpkin.U Carapace

- **Slots:** A, W
- **Carve:** 1-4
- **Capture:** —
- **Armor effect:** Constitution. While you are attuned to this armor, you can reroll a Constitution saving throw that you fail. If you do so, you must use the new roll, and you can't use this property again until you finish a long rest.
- **Weapon effect:** This weapon acts as a focus for your spellcasting.

### P.Firecell Stone

- **Slots:** A, W
- **Carve:** 5-8
- **Capture:** —
- **Armor effect:** When you must succeed on a saving throw or be knocked prone, you do so with advantage.
- **Weapon effect:** Your weapon deals an extra 1d6 fire damage.

### Pumpkin.U Scale

- **Slots:** A, W
- **Carve:** 9-11
- **Capture:** —
- **Armor effect:** Entomologist+. When you capture an insect with a bug net, you capture an extra 1d4 more.
- **Weapon effect:** Pumpkin Carver. While you are attuned to this weapon, you can carve a creature of CR 8 or lower 1 extra time.

### Pumpkin.U Scute

- **Slots:** A, W
- **Carve:** 12-14
- **Capture:** —
- **Armor effect:** Health Boost. While wearing this armor, your hit point maximum increases by 1 for each character level you have.
- **Weapon effect:** Partbreaker+1. You deal an extra 1d6 damage when you critically hit with this weapon.

### Pumpkin Flame Sac

- **Slots:** A, W
- **Carve:** 15-16
- **Capture:** —
- **Armor effect:** While you are attuned to this armor, you can use a bonus action to speak its command word and exhale fire at a target within 30 feet of you. The target must make a DC 16 Dexterity saving throw, taking 4d6 fire damage on a failed save, or half as much damage on a successful one. You can use this property a number of times equal to half your proficiency bonus, regaining all expended uses when you finish a long rest.
- **Weapon effect:** This weapon has 4 runes. While holding it, you can use an action to expend 1 or more of its runes to cast the flaming sphere spell (save DC 13) from it. For 1 rune, you cast the 1st-level version of the spell. You can increase the spell slot level by one for each additional rune you expend. A flaming sphere takes the form of a flaming jack-o'-lantern when cast in this way. This weapon regains 1d4 expended runes daily at dawn. If you expend the weapon's last rune, roll a d20. On a 1, the runes cannot recharge for a week.

### Pumpkin.U Marrow

- **Slots:** A
- **Carve:** 17-18
- **Capture:** —
- **Armor effect:** Guts+. When you are reduced to 0 hit points but not killed outright, you can drop to 1 hit point instead. Once you use this property, you can’t use it again until you finish a long rest.

### Pumpkin.U Jaw

- **Slots:** A, W
- **Carve:** 19
- **Capture:** —
- **Armor effect:** (Fighter Only) While attuned to this armor, you regain an extra 1d10 hit points from your Second Wind feature.
- **Weapon effect:** Resentment. Until the end of your turn, you gain a +1 bonus to attack and damage rolls against any creature that has damaged you since the end of your last turn.

### Pumpkin.U Ruby

- **Slots:** A, W
- **Carve:** 20
- **Capture:** —
- **Armor effect:** Mushroomancer+. While wearing this armor you can digest mushrooms that would otherwise be inedible and gain its advantageous effects. The more pumpkin uragaan materials equipped in your armor or trinkets, the more mushrooms you can eat. 1 pumpkin uragaan material. Blue Mushroom, Restores a 1d4 hit points. Toadstool, You regain 1 hit point at the start of each of your turns for 1 minute. 2 pumpkin uragaan material. Nitroshroom, Your Strength score increases by +2 for 1 minute. Parashroom, Your AC becomes 13 + your Dexterity modifier for the next 8 hours. 3 pumpkin uragaan material. Chaos Mushroom, You are poisoned for 1 hour, and gain 5 temporary hit points per character level for the next 10 minutes. Bindshroom, Your speed increases by 10 feet for 1 hour. Exciteshroom, Provides one of the other mushroom effects, roll a d6 to see which one: 1. Blue Mushroom 2. Parashroom 3. Toadstool 4. Chaos Mushroom 5. Nitroshroom 6. Bindshroom
- **Weapon effect:** (Insect Glaive Only) When you hit a creature with your kinsect, it leaves behind a fiery cloud of powder that fits in a 5-foot-cubed area in the creature’s space. When a creature attacks the cloud or a target in the cloud's space, it explodes, dealing 1d6 fire damage to anything in its space.
