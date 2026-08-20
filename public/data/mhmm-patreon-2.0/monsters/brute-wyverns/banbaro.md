---
name: Banbaro
slug: banbaro
group: Brute Wyverns
cr: "12"
pdfPage: 53
inGithubJson: true
source: MHMM-Patreon-2.0
size: Huge
creatureType: wyvern (brute)
alignment: unaligned
ac: 16
acFrom: natural armor
hp: 175
hpFormula: "13d12 + 91"
speed: "40 ft."
str: 25
dex: 10
con: 24
int: 6
wis: 10
cha: 7
lootRolls: 3
---

# Banbaro

## Bio

Banbaro is a large and heavy-set Brute Wyvern. Most of its body is covered in stout white fur, with portions on its head, legs, and arms being covered in gray scales. Its giant horns are its defining characteristic. These stout, pinkish horns end in broad, moose-like antlers. When enraged, a small horn-like projection on its snout folds out.

Banbaro is normally a fairly docile herbivore, but it is territorial and can be aggressive when provoked. In battle, Banbaro charges opponents while digging up soil or fallen trees. Digging up soil allows it to smash the gathered ball in a huge blast of debris that leaves a hindering pile behind; while digging up trees widens the charge's hitbox and can be thrown as projectiles.

Digging up volcanic rock causes it to leave trails of lava behind.

## Stat Block

*Huge wyvern (brute), unaligned*
- **Armor Class:** 16 (natural armor)
- **Hit Points:** 175 (13d12 + 91)
- **Speed:** 40 ft.

| STR | DEX | CON | INT | WIS | CHA |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 25 | 10 | 24 | 6 | 10 | 7 |

- **Saving Throws:** Str +11, Wis +4, Cha +2
- **Skills:** Athletics +11, Perception +4
- **Damage Immunities:** acid, cold
- **Senses:** passive Perception 14
- **Languages:** —
- **Proficiency Bonus:** +4
- **Challenge:** 12

## Actions

### Multiattack

The banbaro makes one Horn attack and one Hip Check attack. While holding a tree or boulder, it uses its Throw attack in place of its Hip Check.

### Hip Check

Melee Weapon Attack: +11 to hit, reach 10 ft., one target. Hit: 26 (3d12 + 7) bludgeoning damage.

### Horn

Melee Weapon Attack: +11 to hit, reach 10 ft., one target. Hit: 20 (3d8 + 7) bludgeoning damage.

### Horn (Requires Tree Trunk)

Melee Weapon Attack: +11 to hit, reach 15 ft., one target. Hit: 23 (3d10 + 7) bludgeoning damage. This attack can hit up to two extra creatures within 5 feet of the original target, if it is within the attack's reach, and the attack roll against the original target would hit it.

### Horn (Requires Boulder, Recharge 5-6)

While holding a boulder in its antlers, the banbaro moves up to its speed. During this move it can move through the spaces of other creatures without provoking opportunity attacks. Each creature the banbaro moves through must succeed on a DC 19 Dexterity saving throw, taking 26 (3d12 + 7) bludgeoning damage and be knocked prone on a failed save, or half as much damage on a successful one.

### Throw (Requires Tree Trunk or Boulder)

Ranged Weapon Attack: +11 to hit, range 20/60 ft., one target. Hit: 10 (3d6) bludgeoning damage and the tree trunk or boulder is destroyed.

### Bonus Action Improvised Weapon (Recharge 4-6)

The banbaro digs up a large boulder, strikes a nearby tree, or pick up a tree trunk and hold it in its antlers. 47


## Loot

**Carves/Capture rolls:** 3

| Carve | Capture | Material | Slots |
| --- | --- | --- | --- |
| 1-5 | 1-5 | Banbaro Chine | A, W |
| 6-11 | 6-9 | Banbaro Cortex | A, W |
| — | 10-12 | Dash Extract | O |
| 12-14 | 13-15 | Banbaro Great Horn | A, W |
| 13-19 | 16-19 | Banbaro Lash | A, W |
| 20 | 20 | Banbaro Gem | A, W |

## Materials (Runes)

These map to `Rune` entities (`name`, `carveChance`, `captureChance`, `slots`, `armorEffect`, `weaponEffect`).

### Banbaro Chine

- **Slots:** A, W
- **Carve:** 1-5
- **Capture:** 1-5
- **Armor effect:** Transporter. While you are attuned to this armor, you count as one size larger when determining your carrying capacity and the weight you can push, drag, or lift.
- **Weapon effect:** Your weapon deals an extra 1d6 cold damage.

### Banbaro Cortex

- **Slots:** A, W
- **Carve:** 6-11
- **Capture:** 6-9
- **Armor effect:** Speed Eating. While you are attuned to this armor, you can use any consumable, such as a potion or food, as a bonus action; so long as you are the one consuming it.
- **Weapon effect:** You are proficient with improvised weapons while attuned to this weapon.

### Dash Extract

- **Slots:** O
- **Carve:** —
- **Capture:** 10-12
- **Other effect:** Crafting material for mega dash juice.

### Banbaro Great Horn

- **Slots:** A, W
- **Carve:** 12-14
- **Capture:** 13-15
- **Armor effect:** You have resistance to cold damage while you wear this armor.
- **Weapon effect:** While attuned to this weapon, you can cast the catapult spell at 2nd level from it. Once you use this property, you can't use it again until you finish a long rest.

### Banbaro Lash

- **Slots:** A, W
- **Carve:** 13-19
- **Capture:** 16-19
- **Armor effect:** Health Boost. While wearing this armor, your hit point maximum increases by 1 for each character level you have.
- **Weapon effect:** (Greatsword & Lance Only) Offensive Guard. Whenever you use a reaction that increases your AC, the next attack you make with that weapon deals extra damage equal to the bonus AC the reaction provided.

### Banbaro Gem

- **Slots:** A, W
- **Carve:** 20
- **Capture:** 20
- **Armor effect:** Mushroomancer+. While wearing this armor you can digest mushrooms that would otherwise be inedible and gain its advantageous effects. The more banbaro materials equipped in your armor or trinkets, the more mushrooms you can eat. 1 banbaro material. Blue Mushroom, Restores a 2d4 hit points. Toadstool, You regain 2 hit point at the start of each of your turns for 1 minute. 2 banbaro material. Nitroshroom, An ability score of your choice increases by +2 for 1 minute (to a maximum of 20). Parashroom, Your AC becomes 14 + your Dexterity modifier for the next 8 hours. 3 banbaro material. Chaos Mushroom, You are poisoned for 1 hour, and gain 5 temporary hit points per character level for the next 10 minutes. Bindshroom, Your speed increases by 15 feet for 1 hour. Exciteshroom, Provides one of the other mushroom effects, roll a d6 to see which one: 1. Blue Mushroom 2. Parashroom 3. Toadstool 4. Chaos Mushroom 5. Nitroshroom 6. Bindshroom
- **Weapon effect:** Resentment. Until the end of your turn, you gain a +1 bonus to attack and damage rolls against any creature that has damaged you since the end of your last turn.
