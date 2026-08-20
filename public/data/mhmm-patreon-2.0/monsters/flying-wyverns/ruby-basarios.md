---
name: Ruby Basarios
slug: ruby-basarios
group: Flying Wyverns
cr: "14"
pdfPage: 355
inGithubJson: false
source: MHMM-Patreon-2.0
size: Huge
creatureType: wyvern (flying)
alignment: unaligned
ac: 20
acFrom: natural armor
hp: 178
hpFormula: "17d12 + 68"
speed: "40 ft., burrow 30 ft."
str: 24
dex: 9
con: 19
int: 3
wis: 11
cha: 6
lootRolls: 3
---

# Ruby Basarios

## Bio

The ruby basarios is a subspecies of the common basarios. The most notable feature of this species of basarios is the assortment of pink crystals protruding from all over its back, suggesting a considerable variation in its diet compared to its rocky cousin. Its body is also heavily covered in moss, due to it living in a vegetation-rich environment.

Its shell is highly resistant to damage and is difficult to penetrate and it is capable of launching crystals from its back by shaking its body back and forth. Like the common basarios, this subspecies prefers to spend much of its time buried in the earth, camouflaged as a rock. It will attack if disturbed but will not respond aggressively should it be approached by a hunter or another monster while in this state.

This subspecies is exclusively found in deep forests, presumably because the pink crystals it feeds on are supposedly found there.

## Stat Block

*Huge wyvern (flying), unaligned*
- **Armor Class:** 20 (natural armor)
- **Hit Points:** 178 (17d12 + 68)
- **Speed:** 40 ft., burrow 30 ft.

| STR | DEX | CON | INT | WIS | CHA |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 24 | 9 | 19 | 3 | 11 | 6 |

- **Skills:** Athletics +12, Perception +5, Stealth +4
- **Damage Vulnerabilities:** thunder
- **Damage Resistances:** acid, cold, fire, lightning, necrotic, piercing, slashing
- **Senses:** passive Perception 15
- **Languages:** —
- **Proficiency Bonus:** +5
- **Challenge:** 14

## Traits

### Brittle

The basarios takes 10 extra damage whenever it is dealt bludgeoning damage.

### Rollover

Whenever the basarios is knocked prone by a creature or object, it rolls over, moving 10 feet away from the creature or object that knocked it prone, before actually falling prone. If the basarios rolls into another creatures space, that creature must make a DC 20 Strength or Dexterity saving throw (creature's choice). On a failed save, the creature is knocked prone and takes 14 (4d6) bludgeoning damage. On a successful save, the creature takes only half the damage, isn't knocked prone, and is pushed 5 feet out of the basario's space into an unoccupied space of the creature's choice. If no unoccupied space is within range, the creature instead falls prone in the basario's space.

### Stone Camouflage

The basarios has advantage on Dexterity (Stealth) checks made to hide in rocky terrain while burrowed.

### Trampling Charge

If the basarios moves at least 20 feet straight toward a creature and then hits it with a Ram attack on the same turn, that target must succeed on a DC 20 Strength saving throw or be knocked prone. If the target is prone, the basarios can make one Body Slam attack against it as a bonus action.


## Actions

### Body Slam

Melee Weapon Attack: +12 to hit, reach 5 ft., one target. Hit: 29 (4d10 + 7) bludgeoning damage.

### Ram



### Melee Weapon Attack

+12 to hit, reach 5 ft., one target. Hit: 25 (4d8 + 7) bludgeoning damage.

### Fireball

The basarios exhales a fireball which explodes at a point within 60 feet of it. Each creature in a 15-foot radius sphere centered on that point must make a DC 17 Dexterity saving throw, taking 28 (8d6) fire damage on a failed save, or half as much damage on a successful one.

### Shake

The basarios shakes loose chunks of sparkling ruby from its back that cascade down in a 10-foot radius around it. Each creature in that area must make a DC 20 Dexterity saving throw, taking 24 (7d6) bludgeoning damage on a failed save, or half as much damage on a successful one.

### Combustible Gas (Recharge 5-6)

The basarios releases a swirling cloud of gas shot through with white-hot embers from its underside. Each creature within 15-feet of the basarios must make a DC 17 Dexterity saving throw. On a failed save, a creature takes 27 (6d8) fire damage and catches fire. Until a creature takes an action to douse the fire, the target takes 5 (1d10) fire damage at the start of each of its turns. On a successful save, the creature takes half as much damage and doesn't catch fire.


## Legendary Actions

The basarios can take 3 legendary actions, choosing from the options below. Only one legendary action option can be used at a time and only at the end of another creature's turn. The basarios regains spent legendary actions at the start of its turn.

### Tail Swipe

Melee Weapon Attack: +12 to hit, reach 10 ft., one target. Hit: 14 (2d6 + 7) bludgeoning damage and the target and each creature adjacent to it must succeed a DC 20 Strength saving throw or be pushed 10 feet away and be knocked prone on a failed save. On a successful save it still pushed back but isn't knocked prone.

### Poisonous Gas (Costs 2 Actions)

The basarios releases a poisonous gas from its underside in a 15-foot radius around it. Each creature in that area must make a DC 17 Constitution saving throw or become poisoned for 1 minute. A creature can repeat the saving throw at the end of each of its turns, ending the effect on itself on a success.

### Sleep Gas (Costs 3 Actions)

The basarios releases sleeping gas from its underbelly. Roll 21d8; the total is how many hit points of creatures this action can affect. Creatures within 20 feet of the basarios affected in ascending order of their current hit points (ignoring unconscious creatures). Starting with the creature that has the lowest current hit points, each creature affected by the gas falls unconscious for 1 minute, the sleeper takes damage, or someone uses an action to shake or slap the sleeper awake. Subtract each creature's hit points from the total before moving on to the creature with the next lowest hit points. A creature's hit points must be equal to or less than the remaining total for that creature to be affected. 350


## Loot

**Carves/Capture rolls:** 3

| Carve | Capture | Material | Slots |
| --- | --- | --- | --- |
| 1-9 | 1-5 | R.Basarios Carapace | A, W |
| 10-13 | 6-11 | Toxin Sac | A, W, O |
| 14-18 | 12-18 | Dragonite Ore x2 | O |
| 19 | 19 | R.Basarios Wing | A, W |
| 20 | 20 | R.Basarios Cortex | A, W |

## Materials (Runes)

These map to `Rune` entities (`name`, `carveChance`, `captureChance`, `slots`, `armorEffect`, `weaponEffect`).

### R.Basarios Carapace

- **Slots:** A, W
- **Carve:** 1-9
- **Capture:** 1-5
- **Armor effect:** Heat Guard. While wearing this armor you are immune to damage from lava and you are unaffected by extreme heat.
- **Weapon effect:** Geologist. When you successfully gather a mining resource, you instead gather 2.

### Toxin Sac

- **Slots:** A, W, O
- **Carve:** 10-13
- **Capture:** 6-11
- **Armor effect:** You are immune to the poisoned condition while you wear this armor.
- **Weapon effect:** Your poison spells and attacks with this weapon deal an extra 1d6 poison damage.
- **Other effect:** You can make a DC 17 Wisdom (Poisoner's Kit) check using this material as its ingredient plus a vial. On a success you create a vial of midnight tears (DMG p. 258). On a fail, the material is destroyed.

### Dragonite Ore x2

- **Slots:** O
- **Carve:** 14-18
- **Capture:** 12-18

### R.Basarios Wing

- **Slots:** A, W
- **Carve:** 19
- **Capture:** 19
- **Armor effect:** (Lance & Greatsword Only) Your Guard AC bonus now lasts until the start of your next turn and you cannot be knocked prone.
- **Weapon effect:** (Bowgun Only) Load Up+. While attuned to this weapon, you increase the maximum capacity for all your ammo by 4.

### R.Basarios Cortex

- **Slots:** A, W
- **Carve:** 20
- **Capture:** 20
- **Armor effect:** Guard Up. When you fail a Dexterity or Strength saving throw, you can use your reaction to use your AC in place of your roll. You can use this property a number of times equal to your Constitution modifier, regaining all expended uses when you finish a long rest.
- **Weapon effect:** Strong Attack. When you hit a creature with this weapon you can use your bonus action to push the creature back 10 feet.
