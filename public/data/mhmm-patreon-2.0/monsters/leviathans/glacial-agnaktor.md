---
name: Glacial Agnaktor
slug: glacial-agnaktor
group: Leviathans
cr: "9"
pdfPage: 496
inGithubJson: false
source: MHMM-Patreon-2.0
size: Huge
creatureType: leviathan
alignment: unaligned
ac: 16
acFrom: "20 with ice armor"
hp: 189
hpFormula: "18d12 + 72"
speed: "30 ft., burrow 40 ft., swim 40 ft."
str: 17
dex: 16
con: 18
int: 10
wis: 11
cha: 9
lootRolls: 3
---

# Glacial Agnaktor

## Bio

The glacial agnaktor is a tundra-based subspecies of the agnaktor. It is capable of traveling through the solid ice and permafrost of the tundra. Their beak-like jaws are substantially sharper and more spear-like than their relatives in the volcanic region which allows them to pierce through the solid ice with ease.

The glacial agnaktor are able to coat themselves in a layer of ice that acts just like armor. This ice armor gives these creatures an excellent form of defense that can protect them from other predatory species. The claws of this species are extremely sharp and help them maintain their balance on the icy surface of the Tundra.

This species is also capable of shooting a large powerful blast of frigid water. The glacial agnaktor preys on bullfango, anteka and popo. The leviathans may also prey on baggi, great baggi, and lagombi as they have few defenses other than to flee when confronted with the powerful predator.

Like their volcanic dwelling relatives, the glacial agnaktor are top predators in their environment. When making a kill they sometimes leave it to rot and then return to feed on the much softer flesh. These creatures will sometimes even leave a carcass as a trap in order to ambush smaller predators from below.

## Stat Block

*Huge leviathan, unaligned*
- **Armor Class:** 16 (20 with ice armor)
- **Hit Points:** 189 (18d12 + 72)
- **Speed:** 30 ft., burrow 40 ft., swim 40 ft.

| STR | DEX | CON | INT | WIS | CHA |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 17 | 16 | 18 | 10 | 11 | 9 |

- **Saving Throws:** Dex +7, Wis +4 Cha +3
- **Skills:** Acrobatics +7, Perception +4
- **Damage Immunities:** Cold
- **Senses:** tremorsense 60 ft., passive Perception 14
- **Languages:** -
- **Proficiency Bonus:** +4
- **Challenge:** 9

## Traits

### Ice Armor

The agnaktor’s body is covered in an icy armor, increasing its AC by 4. At the start of its turn, if glacial agnaktor is above ground, the armor begins to melt, reducing the bonus AC by 1 for every turn it remains above ground. If the agnaktor is hit with a cold effect, it gains +1 AC to its icy armor. If it is hit with a fire effect, its bonus AC from the ice armor is reduced by 1. The glacial agnaktor remains in cold water or under ice for a round, its ice armor resets back to 4 AC at the start of its turn.

### Ice Walk

The agnaktor can move across and climb icy surfaces without needing to make an ability check. Additionally, difficult terrain composed of ice or snow doesn't cost it extra moment.


## Actions

### Multiattack

The agnaktor makes two bite attacks.

### Bite

Melee Weapon Attack: +7 to hit, reach 5 ft., one target. Hit 16 (3d8 + 3) piercing damage plus 7 (2d6) cold damage.

### Hydropump (Recharge 5-6)

The agnaktor releases a high pressure stream of frigid water in a 60-foot line that is 5 feet wide. Each creature in that line must make a DC 14 Dexterity saving throw. On a failed save the creature takes 45 (13d6) acid damage and is afflicted with waterblight. On a successful save, the target takes half as much damage and isn't afflicted with waterblight.


## Legendary Actions

The agnaktor can take 2 legendary actions, choosing from the options below. Only one legendary action option can be used at a time and only at the end of another creatures turn. The agnaktor regains spent legendary actions at the start of its turn.

### Detect

The agnaktor makes a Wisdom (Perception) check.

### Move

The agnaktor moves up to its speed without provoking opportunity attacks.


## Loot

**Carves/Capture rolls:** 3

| Carve | Capture | Material | Slots |
| --- | --- | --- | --- |
| 1-5 | — | G.Agnak Carapace | A, W |
| 6-8 | 1-6 | G.Agnak Hide | A |
| 9 | 7-9 | G.Agnak Claw | W |
| 10-11 | 10-13 | G.Agnak Cortex | A |
| 12 | 14-15 | Dewy Pleura | W |
| 13-14 | — | G.Agnak Tail | W |
| 15-18 | 16-19 | G.Agnak Fin | W |
| 19-20 | 20 | Drenched Pleura | A, W |

## Materials (Runes)

These map to `Rune` entities (`name`, `carveChance`, `captureChance`, `slots`, `armorEffect`, `weaponEffect`).

### G.Agnak Carapace

- **Slots:** A, W
- **Carve:** 1-5
- **Capture:** —
- **Armor effect:** Guard. You cannot be pushed or knocked backwards while you wear this armor.
- **Weapon effect:** (Greatsword and Lance only) You gain an extra +1 bonus to your AC until the end of your next turn, whenever you use a reaction that would increase your AC.

### G.Agnak Hide

- **Slots:** A
- **Carve:** 6-8
- **Capture:** 1-6
- **Armor effect:** Detect+. You gain a +2 bonus to your passive Perception while you wear this armor.

### G.Agnak Claw

- **Slots:** W
- **Carve:** 9
- **Capture:** 7-9
- **Weapon effect:** When you cast a spell that deals cold damage, you gain a +1 bonus to its spell attack roll.

### G.Agnak Cortex

- **Slots:** A
- **Carve:** 10-11
- **Capture:** 10-13
- **Armor effect:** Your movement speed is increased by 5 feet and you ignore difficult terrain created by ice or snow while you wear this armor.

### Dewy Pleura

- **Slots:** W
- **Carve:** 12
- **Capture:** 14-15
- **Weapon effect:** This weapon has 3 runes that it regains daily at dawn. When you hit a creature with this weapon you can expend a rune to have the target make a DC 14 Dexterity saving throw. On a failed save, ice forms from the ground and latches onto the target, reducing its movement speed to 0 for 1 minute. At the end of the creatures turn it can make a DC 15 strength saving throw, breaking free on a success.

### G.Agnak Tail

- **Slots:** W
- **Carve:** 13-14
- **Capture:** —
- **Weapon effect:** (Ranged Weapon Only) Bonus Shot. When you take the attack action, you can make one additional attack with this weapon as a bonus action.

### G.Agnak Fin

- **Slots:** W
- **Carve:** 15-18
- **Capture:** 16-19
- **Weapon effect:** Mind's Eye. Your attacks with this weapon bypass the damage resistances of any creature.

### Drenched Pleura

- **Slots:** A, W
- **Carve:** 19-20
- **Capture:** 20
- **Armor effect:** You have resistance to cold damage while you wear this armor.
- **Weapon effect:** Critical Eye. Your weapon attacks critical hit range are increased by 1.
