---
name: Fledgling Legiana
slug: fledgling-legiana
group: Flying Wyverns
cr: "4"
pdfPage: 395
inGithubJson: false
source: MHMM-Patreon-2.0
size: Medium
creatureType: wyvern (flying)
alignment: unaligned
ac: 15
acFrom: natural armor
hp: 100
hpFormula: "15d12 + 90"
speed: "30 ft., fly 60 ft."
str: 16
dex: 10
con: 15
int: 4
wis: 12
cha: 12
lootRolls: 3
qa: missing-bio
---

# Fledgling Legiana

## Stat Block

*Medium wyvern (flying), unaligned*
- **Armor Class:** 15 (natural armor)
- **Hit Points:** 100 (15d12 + 90)
- **Speed:** 30 ft., fly 60 ft.

| STR | DEX | CON | INT | WIS | CHA |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 16 | 10 | 15 | 4 | 12 | 12 |

- **Saving Throws:** Dex +2, Con +4
- **Skills:** Acrobatics +4, Perception +3
- **Damage Immunities:** cold
- **Senses:** darkvision 60 ft., passive Perception 13
- **Languages:** —
- **Proficiency Bonus:** +2
- **Challenge:** 4

## Traits

### Flyby

The legiana doesn't provoke an opportunity attack when it flies out of an enemy's reach.

### Frost

A creature that starts its turn or moves into an area covered in frost must make a DC 12 Constitution saving throw or be diseased with iceblight for 1 minute.


## Actions

### Multiattack

The legiana makes one bite attack, one talons attack, and one tail attack.

### Bite

Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 6 (1d6 + 3) piercing damage.

### Tail

Melee Weapon Attack: +5 to hit, reach 10 ft., one target. Hit: 7 (1d8 + 3) bludgeoning damage plus 2 (1d4) cold damage and the legiana leaves a layer of frost in an area that is 5 feet long and 15 feet wide centered on the target or 10 feet long and 5 feet wide originating from the legiana. The frost remains until the start of the legiana's next turn.

### Talons

Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 6 (1d6 + 3) piercing damage. If the target is a Small or smaller creature, it is grappled (Escape DC 13). 389


## Loot

**Carves/Capture rolls:** 3

| Carve | Capture | Material | Slots |
| --- | --- | --- | --- |
| 1-4 | 1-5 | Legiana Hide | A, W |
| 5-8 | 6-9 | F.Legiana Scale | A, W |
| 9-12 | 10-12 | F.Legiana Claw | W |
| 13-15 | 13-14 | F.Legiana Wing | A, W |
| 16-19 | 15-17 | Freezer Sac | A, W |
| 20 | 18-20 | F.Legiana Plate | A, W |

## Materials (Runes)

These map to `Rune` entities (`name`, `carveChance`, `captureChance`, `slots`, `armorEffect`, `weaponEffect`).

### Legiana Hide

- **Slots:** A, W
- **Carve:** 1-4
- **Capture:** 1-5
- **Armor effect:** Airborne. While wearing this armor, you can cast the jump spell from it as a bonus action at will but can target only yourself when you do so.
- **Weapon effect:** This weapon has a reservoir of ice magic that can freeze the ground for up to 1 minute. While holding this weapon, you can use an action to plant this weapon in the ground releasing the ice magic within. While planted and undepleted, the ground in a 10-foot radius of this weapon becomes difficult terrain. This weapon recharges 3d6 seconds of energy to the weapon's reservoir daily at dawn.

### F.Legiana Scale

- **Slots:** A, W
- **Carve:** 5-8
- **Capture:** 6-9
- **Armor effect:** While attuned to this armor, it gleams with a frosty shimmer and you have advantage on Charisma (Persuasion) checks when interacting with creatures native to cold climates while wearing it.
- **Weapon effect:** (Cosmetic; Shield Only) While attuned to this weapon, you can use your action to transform your shield's surface into a tray of frost, keeping drinks and small items chilled for up to an hour when placed on it.

### F.Legiana Claw

- **Slots:** W
- **Carve:** 9-12
- **Capture:** 10-12
- **Weapon effect:** Your weapon is adorned with a penguin emblem when you place this material into it. While attuned to it, it emits a faint cooing sound when in the presence of hidden doors or passages.

### F.Legiana Wing

- **Slots:** A, W
- **Carve:** 13-15
- **Capture:** 13-14
- **Armor effect:** The air around you is always unnaturally cold while you wear this armor. Your breath becomes visible, and frost continually forms on the surface of your hair, weapons, and armor. Additionally, you suffer no ill effect from being in extremely cold environments.
- **Weapon effect:** (Shield Only) While attuned to this weapon you can use an action to speak its command word, transforming the surface your shield into a crystal clear mirror until you speak the command word once more. While in this mirror state, your shield has an AC of 10 and 1 hit point. When it is reduced to 0 hit points, it reverts back to its normal form and can't transform back into a mirror for 24 hours.

### Freezer Sac

- **Slots:** A, W
- **Carve:** 16-19
- **Capture:** 15-17
- **Armor effect:** (Spellcaster Only) This armor has two runes that it regains daily at dawn. As an action you can expend one of these runes to coat your armor in magical ice, gaining 5 temporary hit points. If a creature hits you with a melee attack while you have these hit points, the creature takes 5 cold damage.
- **Weapon effect:** (Light Bowgun Only) When you hit a creature with your water ammo it must make a DC 14 Constitution saving throw or have its movement speed reduced to 0 until the end of its next turn on a failed save. On a successful save, the creature's movement speed is reduced by 10 feet.

### F.Legiana Plate

- **Slots:** A, W
- **Carve:** 20
- **Capture:** 18-20
- **Armor effect:** Stroke of Luck. While you are attuned to this armor, you can roll a d4 and add the number rolled to one ability check, attack roll, or saving throw. You can wait until after you roll the d20 before deciding to use the Stroke of Luck die but must decide before the DM says whether the roll succeeds or fails. You can use this property a number of times equal to your proficiency modifier, regaining all expended uses when you finish a long rest.
- **Weapon effect:** Your weapon deals an extra 1d4 cold damage.

## QA flags

`missing-bio`
