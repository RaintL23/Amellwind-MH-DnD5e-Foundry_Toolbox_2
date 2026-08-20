---
name: Tempered Teostra
slug: tempered-teostra
group: Elder Dragons
cr: "20"
pdfPage: 210
inGithubJson: true
source: MHMM-Patreon-2.0
size: Huge
creatureType: dragon (elder)
alignment: unaligned
ac: 19
acFrom: natural armor
hp: 243
hpFormula: "18d12 + 126"
speed: "50 ft., fly 60 ft."
str: 25
dex: 17
con: 24
int: 16
wis: 15
cha: 10
lootRolls: 4
qa: missing-bio
---

# Tempered Teostra

## Stat Block

*Huge dragon (elder), unaligned*
- **Armor Class:** 19 (natural armor)
- **Hit Points:** 243 (18d12 + 126)
- **Speed:** 50 ft., fly 60 ft.

| STR | DEX | CON | INT | WIS | CHA |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 25 | 17 | 24 | 16 | 15 | 10 |

- **Saving Throws:** Str +13, Con +13, Wis +8, Cha +6
- **Skills:** Perception +8
- **Damage Resistances:** lightning, necrotic; bludgeoning, piercing, and slashing damage from nonmagical attacks
- **Damage Immunities:** fire
- **Condition Immunities:** charmed, frightened, poisoned
- **Senses:** blindsight 60 ft., darkvision 120 ft., passive Perception 18
- **Languages:** Draconic
- **Proficiency Bonus:** +6
- **Challenge:** 20

## Traits

### Explosive Cloud

At the start of the teostra's turn, it beats its wings and four clouds of explosive powder appear in unoccupied 5-foot cubes of air within 60 feet of the teostra. Additionally, every 15 feet the teostra moves, it leaves a cloud of explosive powder in a 5-foot cube. The clouds remain until detonation, until a wind of moderate or greater speed (at least 10 miles per hour) disperses it, or when the teostra dies.

### Fire Aura

At the start of each of the teostra's turns, each creature within 5 feet of it takes 7 (2d6) fire damage, and flammable objects in the aura that aren't being worn or carried ignite. A creature that touches the teostra or hits it with a melee attack while within 5 feet of it takes 7 (2d6) fire damage.

### Legendary Resistance (3/Day)

If the teostra fails a saving throw, it can choose to succeed instead.

### Standing Leap

The teostra's long jump is up to 30 feet and its high jump is up to 15 feet, with or without a running start.


## Actions

### Multiattack

The teostra makes three attacks: two with its claw and one with its bite or tail.

### Bite

Melee Weapon Attack: +13 to hit, reach 10 ft., one target. Hit: 20 (3d8 + 7) piercing damage.

### Claws

Melee Weapon Attack: +13 to hit, reach 5 ft., one target. Hit: 17 (3d6 + 7) slashing damage.

### Tail

Melee Weapon Attack: +13 to hit, reach 10 ft., one target. Hit: 20 (3d8 + 7) bludgeoning damage, and the target must make a DC 21 Strength saving throw or be knocked prone.

### Deadly Leap

If the teostra jumps at least 15 feet as part of its movement, it can then use this action to land on its feet in a space that contains one or more other creatures. Each of those creatures must succeed on a DC 21 Strength or Dexterity saving throw (target's choice) or be knocked prone and take 33 (6d8 + 6) bludgeoning damage. On a successful save, the creature takes only half the damage, isn't knocked prone, and is pushed 5 feet out of the teostra's space into an unoccupied space of the creature's choice. If no unoccupied space is within range, the creature instead falls prone in the teostra's space.

### Fire Breath (Recharge 5-6)

The teostra exhales fire in a 90-foot cone. Each creature in that area must make a DC 21 Dexterity saving throw, taking 38 (11d6) fire damage on a failed save, or half as much damage on a successful one.

### Supernova (1/day)

The teostra beats its wings rising 20 feet into the air and releases a large burst of fire all around it. Each creature within a 40-foot-radius sphere of the teostra must succeed on a DC 21 Dexterity saving throw, taking 63 (14d8) fire damage and are pushed back 10 feet on a failed save, or half as much damage on a successful one and not pushed back.


## Bonus Actions

### Move Dust Cloud

The teostra moves up to two explosive clouds 10 feet in any direction.


## Legendary Actions

The teostra can take 2 legendary actions, choosing from the options below. Only one legendary action option can be used at a time and only at the end of another creature's turn. The teostra regains spent legendary actions at the start of its turn.

### Move

The teostra moves up to its speed without provoking opportunity attacks.

### Attack

The teostra makes a bite attack.

### Detonate (Costs 2 Actions)

All Explosive Clouds detonate and burst into flames. Each creature within 10-feet of an explosive cloud must make a DC 21 Dexterity saving throw, taking 22 (4d10) fire damage on a failed save or half as much damage on a successful one. If a creature is within range of more than one explosive cloud, it takes an additional 22 (4d10) fire damage for each additional cloud.


## Loot

**Carves/Capture rolls:** 4

| Carve | Capture | Material | Slots |
| --- | --- | --- | --- |
| 1-2 | — | Elder Dragon Bone | O |
| 3-4 | — | Elder Dragon Blood | O |
| 5-7 | — | T.Fire Dragon Scale | A, W |
| 8-10 | — | T.Teostra Carapace | A, W |
| 11-12 | — | T.Teostra Claw | A, W |
| 13-14 | — | T.Teostra Webbing | A, W |
| 15-16 | — | T.Teostra Tail | A, W |
| 17-18 | — | T.Teostra Mane | A, W |
| 19 | — | T.Teostra Horn | A, W |
| 20 | — | T.Teostra Gem | A, W |

## Materials (Runes)

These map to `Rune` entities (`name`, `carveChance`, `captureChance`, `slots`, `armorEffect`, `weaponEffect`).

### Elder Dragon Bone

- **Slots:** O
- **Carve:** 1-2
- **Capture:** —
- **Other effect:** Any rarity armor upgrade material.

### Elder Dragon Blood

- **Slots:** O
- **Carve:** 3-4
- **Capture:** —
- **Other effect:** Any rarity weapon upgrade material.

### T.Fire Dragon Scale

- **Slots:** A, W
- **Carve:** 5-7
- **Capture:** —
- **Armor effect:** Biology. You become proficient with dung bombs while you are wearing this armor, and you are immune to blight effects such as waterblight, iceblight, or the blight spell.
- **Weapon effect:** Quick Load. You can reload as a free action while you are attuned to this weapon.

### T.Teostra Carapace

- **Slots:** A, W
- **Carve:** 8-10
- **Capture:** —
- **Armor effect:** While wearing this armor you can use an action to cast the protection from energy(fire) spell from it. This property can be used three times, regaining all expended uses daily at dawn.
- **Weapon effect:** (Bow Only) Special Ammo Boost +2. Your coating now coats up to 30 arrows and your dragonpiercer deals an extra 3d6 piercing damage.

### T.Teostra Claw

- **Slots:** A, W
- **Carve:** 11-12
- **Capture:** —
- **Armor effect:** Archaeologist+. When you successfully gather a bone resource, you gather an extra 1d4 more.
- **Weapon effect:** Your weapon deals an extra 1d10 fire damage.

### T.Teostra Webbing

- **Slots:** A, W
- **Carve:** 13-14
- **Capture:** —
- **Armor effect:** While wearing this armor You are immune to fire damage.
- **Weapon effect:** While attuned to this weapon, your fire spells bypass a creatures resistance and deal half damage to a creature that is immune to fire damage.

### T.Teostra Tail

- **Slots:** A, W
- **Carve:** 15-16
- **Capture:** —
- **Armor effect:** (Wizard Only) While attuned to this armor, you can recover spell slots with your arcane recovery that have a combined level that is equal to or less than half your Wizard level (rounded up) +2.
- **Weapon effect:** Once per turn, when you hit a creature with a melee weapon attack using this Weapon, you can engulf the target in flames. At the start of each of the engulfed creature’s turns, it takes 1d6 fire damage and it can then make a DC 15 Dexterity saving throw, putting out the flames on a successful save. Alternatively, the engulfed creature, or a creature within 5 feet of it, can use an action to smother the flames ending the effect.

### T.Teostra Mane

- **Slots:** A, W
- **Carve:** 17-18
- **Capture:** —
- **Armor effect:** (Paladin Only) You can use an action to speak this armor's command word to extend your aura by 10 feet for 1 minute. Once you use this property, you can't use it again until you finish a long rest.
- **Weapon effect:** Critical Eye+. Your weapon attacks critical hit range is increased by 2.

### T.Teostra Horn

- **Slots:** A, W
- **Carve:** 19
- **Capture:** —
- **Armor effect:** Wide-Range+. When you eat or drink an Uncommon or lower consumable item (except potions of resistance), each creature within 20 feet of you also gain its effect.
- **Weapon effect:** Reckless Abandon. When you make your first attack on your turn with this weapon, you can choose to without care or regard for consequences. Doing so gives you advantage on melee weapon attack rolls using Strength during this turn, but you have disadvantage on all saving throws and all attack rolls against you have advantage until the start of your next turn.

### T.Teostra Gem

- **Slots:** A, W
- **Carve:** 20
- **Capture:** —
- **Armor effect:** (Spellcaster Only) While wearing this armor you can use an action to cast the fire shield (warm shield) spell from it. This property can be used twice, regaining all expended uses daily at dawn.
- **Weapon effect:** Latent Power +2. When you are reduced to a half of your maximum hit points for the first time in combat or at the start of your turn on the 10th round of combat, whichever comes first, you gain the effects of the haste spell for 1 minute. Once used, you must finish a short or long rest before you can use this property again.

## QA flags

`missing-bio`
