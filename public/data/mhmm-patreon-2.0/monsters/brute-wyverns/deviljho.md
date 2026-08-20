---
name: Deviljho
slug: deviljho
group: Brute Wyverns
cr: "18"
pdfPage: 63
inGithubJson: true
source: MHMM-Patreon-2.0
size: Gargantuan
creatureType: wyvern (brute)
alignment: unaligned
ac: 19
acFrom: natural armor
hp: 198
hpFormula: "12d20 + 72"
speed: "50 ft."
str: 27
dex: 18
con: 23
int: 10
wis: 15
cha: 8
lootRolls: 4
---

# Deviljho

## Bio

Deviljho is a bipedal Brute Wyvern characterized by its uniform forest green coloration and muscular upper body. Its thick hide is littered with short, jagged spines that reach a maximum height along the back and tail. Deviljho has a narrow snout with a large lower jaw, covered in multiple rows of teeth spreading outwards from the mouth.

It has massive, powerful hind legs, but tiny, poorly developed forelegs that it rarely utilizes. Their eyes are small and simple, suggesting their vision is rather poor, but their other senses such as smell can compensate for this. Their tails are long and powerful, but their main feature of note is its breath attack.

When provoked, deviljho back and shoulder muscles swell considerably. During this period, areas of its skin will take on a bright red coloration. Deviljho is a nomadic monster, prone to wandering vast distances in search of prey. Its status as a super-predator allows it to overtake the territory of any monster that stands in its path.

Because of the extreme amount of energy its body consumes, deviljho is always in search of food sources. It is known to be cannibalistic and is also prone to eating prey alive in order to waste as little time as possible in replenishing its energy.

## Stat Block

*Gargantuan wyvern (brute), unaligned*
- **Armor Class:** 19 (natural armor)
- **Hit Points:** 198 (12d20 + 72)
- **Speed:** 50 ft.

| STR | DEX | CON | INT | WIS | CHA |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 27 | 18 | 23 | 10 | 15 | 8 |

- **Saving Throws:** Str +14, Con +12, Wis +8
- **Skills:** Athletics +14, Intimidation +5, Perception +8
- **Condition Immunities:** charmed, frightened, stunned
- **Senses:** passive Perception 18
- **Languages:** —
- **Proficiency Bonus:** +6
- **Challenge:** 18

## Traits

### Legendary Resistance (2/Day)

If the deviljho fails a saving throw, it can choose to succeed instead.


## Actions

### Multiattack

The deviljho makes one Body Slam attack and one Bite attack.

### Bite

Melee Weapon Attack: +14 to hit, reach 10 ft., one target. Hit: 26 (4d8 + 8) piercing damage.

### Body Slam

Melee Weapon Attack: +14 to hit, reach 5 ft., one target. Hit: 30 (4d10 + 8) bludgeoning damage, and the target must make a DC 22 Strength saving throw or be pushed 10 feet away and knocked prone. If the deviljho moved at least 20 feet straight toward the target immediately before the hit, the target takes an extra 11 (2d10) bludgeoning damage.

### Tail

Melee Weapon Attack: +14 to hit, reach 20 ft., one target. Hit: 21 (2d12 + 8) piercing damage.

### Swallow

The deviljho makes one Bite attack against a Large or smaller creature that is prone. If the attack hits, the target takes the bite damage, the target is swallowed, and no longer prone. While swallowed, the creature is blinded and restrained, it has total cover against attacks and other effects outside the deviljho, and it takes 56 (16d6) acid damage at the start of each of the deviljho turns. If the deviljho takes 40 damage or more on a single turn from a creature inside it, the deviljho must succeed on a DC 20 Constitution saving throw at the end of that turn or regurgitate all swallowed creatures, which fall prone in a space within 10 feet of the deviljho. If the deviljho dies, a swallowed creature is no longer restrained by it and can escape from the corpse by using 15 feet of movement, exiting prone.

### Dragons Breath (Recharge 5-6)

The deviljho unleashes a terrible breath in a 45-foot cone. Each creature in that area must make a DC 20 Dexterity saving throw, taking 31 (7d8) fire damage plus 45 (10d8) necrotic damage on a failed save, or half as much damage on a successful one.


## Legendary Actions

The deviljho can take 3 legendary actions, choosing from the options below. Only one legendary action option can be used at a time and only at the end of another creature's turn. The deviljho regains spent legendary actions at the start of its turn.

### Detect

The deviljho makes a Wisdom (Perception) Check.

### Tail Attack

The deviljho makes a Tail attack.

### Devour (Costs 2 actions)

The deviljho uses Swallow. 57


## Loot

**Carves/Capture rolls:** 4

| Carve | Capture | Material | Slots |
| --- | --- | --- | --- |
| 1-4 | 1-4 | Deviljho Hide | A |
| 5-7 | 5-8 | Deviljho Scale | A |
| 8-10 | 9-11 | Deviljho Talon | W |
| 11-12 | 12-14 | Deviljho Tallfang | W |
| 13-14 | — | Deviljho Scalp | A, W |
| 15-17 | 15-18 | Deviljho Saliva | A, W |
| 18-19 | 19-20 | Deviljho Tail | A, W |
| 20 | — | Deviljho Gem | A, W |

## Materials (Runes)

These map to `Rune` entities (`name`, `carveChance`, `captureChance`, `slots`, `armorEffect`, `weaponEffect`).

### Deviljho Hide

- **Slots:** A
- **Carve:** 1-4
- **Capture:** 1-4
- **Armor effect:** Carving Celebrity. While you are attuned to this armor, you can carve a creature of CR 13 or lower 1 extra time.

### Deviljho Scale

- **Slots:** A
- **Carve:** 5-7
- **Capture:** 5-8
- **Armor effect:** Speed Eating. While you are attuned to this armor, you can use any consumable, such as a potion or food, as a bonus action; so long as you are the one consuming it.

### Deviljho Talon

- **Slots:** W
- **Carve:** 8-10
- **Capture:** 9-11
- **Weapon effect:** Weakness Exploit+. When you have advantage on an attack roll with this weapon and you hit the target; you can have your weapon deal its maximum damage if the lower of the two d20 rolls would also hit the target (all extra damage dice must still be rolled)\*. You can use this property a number of times equal to your Strength or Dexterity modifier (your choice), regaining all expended uses when you finish a short or long rest.

### Deviljho Tallfang

- **Slots:** W
- **Carve:** 11-12
- **Capture:** 12-14
- **Weapon effect:** Partbreaker+2. You deal an extra 1d8 damage when you critically hit with this weapon.

### Deviljho Scalp

- **Slots:** A, W
- **Carve:** 13-14
- **Capture:** —
- **Armor effect:** While you wear this armor, you taste in all directions, and you have advantage on Wisdom (Perception) checks that rely on taste.
- **Weapon effect:** When you cast a necromancy spell, you gain a +2 bonus to its spell attack roll or increase its spell save DC by 2.

### Deviljho Saliva

- **Slots:** A, W
- **Carve:** 15-17
- **Capture:** 15-18
- **Armor effect:** Whenever you make a saving throw against the frightened condition, you do so with advantage.
- **Weapon effect:** (Sorcerer & Wizard Only) The weapon has 10 runes. You can use an action to expend 1 or more of its runes to cast one of the following spells from it, using your spell save DC: cause fear (1 rune), ray of enfeeblement (2 runes), ray of sickness at 3rd level( 3 runes), contagion (4 runes), or harm (6 runes). The weapon regains 1d6 + 4 expended runes daily at dawn. If you expend the last rune it can't regain any runes for one week.

### Deviljho Tail

- **Slots:** A, W
- **Carve:** 18-19
- **Capture:** 19-20
- **Armor effect:** While you wear this armor, you can use an action, to speak the armor's command word and attempt to swallow either a creature, or object, that is Medium or smaller. An unwilling creature must make a DC 14 Dexterity saving throw to escape the armor's grasp. Once swallowed, the creature or object is transported to a room that exists on a plane of existence found only within the armor. The room is a 10 foot by 10 foot cube, and can hold a single, living creature, and up to 1,000 pounds of objects. There are two windows on one of the walls that peer out, giving vision of the outside world. For every hour that passes, a creature can attempt to escape by succeeding on a DC 15 Strength saving throw. On a success, the creature is regurgitated, falling prone in a space within 10 feet of you. Also, whenever you take 40 damage or more on a single turn, you must succeed on a DC 16 Constitution saving throw, or regurgitate any swallowed creature and all swallowed objects, which fall prone in a space within 10 feet of you. Speaking the armor's command word again spits out the creature or an object of your choice.
- **Weapon effect:** Your weapon deals an extra 1d4 fire damage and an extra 1d4 necrotic damage.

### Deviljho Gem

- **Slots:** A, W
- **Carve:** 20
- **Capture:** —
- **Armor effect:** You have resistance to fire and necrotic damage while you wear this armor.
- **Weapon effect:** While you are attuned to this weapon, you can speak its command word to exhale a beam of hellfire in a 60-foot line that is 5 feet wide. Each creature in that line must make a DC 15 Dexterity saving throw, taking 4d6 fire damage and 4d6 necrotic damage on a failed save, or half as much damage on a successful one. Once used, this property cannot be used again until you finish a long rest.
