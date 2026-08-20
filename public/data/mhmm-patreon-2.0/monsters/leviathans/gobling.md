---
name: Gobling
slug: gobling
group: Leviathans
cr: "3"
pdfPage: 453
inGithubJson: true
source: MHMM-Patreon-2.0
size: Medium
creatureType: leviathan
alignment: unaligned
ac: 16
acFrom: natural armor
hp: 77
hpFormula: "14d8 + 14"
speed: "20 ft., swim 30 ft."
str: 16
dex: 12
con: 12
int: 4
wis: 10
cha: 10
lootRolls: 3
---

# Gobling

## Bio

A young gobul is known as a gobling. They are roughly the size of a young arzuros with hard shells to protect them. As they grow the hardshell softens allowing the gobul to expand like its adult counterpart.

## Stat Block

*Medium leviathan, unaligned*
- **Armor Class:** 16 (natural armor)
- **Hit Points:** 77 (14d8 + 14)
- **Speed:** 20 ft., swim 30 ft.

| STR | DEX | CON | INT | WIS | CHA |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 16 | 12 | 12 | 4 | 10 | 10 |

- **Skills:** Perception +2, Stealth +3
- **Damage Resistances:** acid
- **Condition Immunities:** paralyzed, poisoned
- **Senses:** darkvision 60 ft., passive Perception 12
- **Languages:** —
- **Proficiency Bonus:** +2
- **Challenge:** 3

## Traits

### Amphibious

The gobling can breathe air and water.

### Lure

While hidden, the gobling can use the lure on its head to create a mesmerizing flash of lights. Each creature that can see the lure, must make a DC 10 Wisdom saving throw or be charmed for 1 minute by the gobling or until the gobling does something harmful to the creature. While charmed in this way, the creature can only use its turn to move towards the lure.

### Natural Camouflage

While the gobling remains motionless on river bed, lake bottom, or sea floor, it is indistinguishable from common water plants.


## Actions

### Multiattack

The gobling makes one Bite attack and one Tail attack. It can't make both attacks against the same target.

### Bite

Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 10 (2d6 + 3) piercing damage, and the target is grappled (escape DC 13). Until this grapple ends, the target is restrained, and the gobling can't bite another target.

### Tail

Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 8 (1d10 + 3) piercing damage.

### Swallow

The gobling makes one bite attack against a Small or smaller target it is grappling. If the attack hits, the target is swallowed, and the grapple ends. The swallowed target is blinded and restrained, it has total cover against attacks and other effects outside the gobling, and it takes 5 (2d4) acid damage at the start of each of the gobling's turns. The gobling can have only one target swallowed at a time. If the gobling dies, 449 a swallowed creature is no longer restrained by it and can escape from the corpse using 5 ft. of movement, exiting prone.


## Bonus Actions

### Blinding Flash (recharge 6)

The gobling's lure emits blinding flashes of light in a 15-foot cone. Each creature in the area is blinded until the start of the gobling's next turn, unless it uses its reaction to avert its eyes.


## Loot

**Carves/Capture rolls:** 3

| Carve | Capture | Material | Slots |
| --- | --- | --- | --- |
| 1-9 | 1-7 | Gobling Hide | A, W |
| 10-14 | 8-12 | Gobling Fin | A, W |
| 15-19 | 13-18 | Gobling Whisker | A, W |
| 20 | 19-20 | Gobling Lantern | O |

## Materials (Runes)

These map to `Rune` entities (`name`, `carveChance`, `captureChance`, `slots`, `armorEffect`, `weaponEffect`).

### Gobling Hide

- **Slots:** A, W
- **Carve:** 1-9
- **Capture:** 1-7
- **Armor effect:** You reduce acid damage you take by 3 while you wear this armor.
- **Weapon effect:** While holding your weapon, you can speak a command word and transform it into a fishing pole with a hook, a line, and a reel. Speaking the command word again changes the fishing pole back into the weapon.

### Gobling Fin

- **Slots:** A, W
- **Carve:** 10-14
- **Capture:** 8-12
- **Armor effect:** Whenever you make a saving throw against the paralyzed condition, you do so with a +1 bonus.
- **Weapon effect:** This weapon has 3 runes. While you carry it, you can use an action and expend 1 rune to cast the dominate beast (save DC 11) spell from it, on a beast that has an innate swimming speed. This weapon regains 1d3 expended runes daily at dawn.

### Gobling Whisker

- **Slots:** A, W
- **Carve:** 15-19
- **Capture:** 13-18
- **Armor effect:** While wearing this armor, you can use a bonus action to speak its command word to ignite the magic within it, causing it to flare brilliantly. Any creature within a 10-foot radius of you must use its reaction to shield its eyes or be blinded until the end of its next turn. Once used, you can't use this property again until you finish a long rest.
- **Weapon effect:** (Ranged Weapon Only) While underwater, your weapon's normal attack range is doubled.

### Gobling Lantern

- **Slots:** O
- **Carve:** 20
- **Capture:** 19-20
- **Other effect:** When placed into a trinket, that trinket becomes a driftglobe (DMG p.166) while you are attuned to it.
