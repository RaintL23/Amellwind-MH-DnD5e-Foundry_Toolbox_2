---
name: Zinogre
slug: zinogre
group: Fanged Wyverns
cr: "10"
pdfPage: 322
inGithubJson: true
source: MHMM-Patreon-2.0
size: Huge
creatureType: wyvern (fanged)
alignment: unaligned
ac: 18
acFrom: natural armor
hp: 189
hpFormula: "18d12 + 72"
speed: "40 ft."
str: 21
dex: 15
con: 18
int: 8
wis: 14
cha: 9
lootRolls: 3
---

# Zinogre

## Bio

Zinogre is a quadrupedal monster that is very wolf-like if one looks at its face and has a very muscular set of forelimbs very comparable to those of big cats. It has surprising agility for such a large monster, similar to nargacuga. It has Sharp Claws attached to strong muscular fore-limbs, which are used to deliver a fatal blow to prey and hunters.

It also helps them to climb mountains and rocky terrain. The spikes on its body mostly lie flat, but when it has built up an electric charge they stick out vertically into the air. The Zinogre can also harness the power of electricity, much like a lagiacrus, using it to take down larger prey and to defend itself and its territory.

Thunderbugs are seen gathering around zinogre when it is "charging" electricity; they may act as a source of energy. As Zinogre preys on Gargwa, Thunderbugs become safe, simply by flying around in close proximity to a Zinogre. Zinogre can exploit this by absorbing the energy emitted by the bugs during battle, granting it special abilities.

Thunderbugs might glow blue

## Stat Block

*Huge wyvern (fanged), unaligned*
- **Armor Class:** 18 (natural armor)
- **Hit Points:** 189 (18d12 + 72)
- **Speed:** 40 ft.

| STR | DEX | CON | INT | WIS | CHA |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 21 | 15 | 18 | 8 | 14 | 9 |

- **Skills:** Perception +6, Survival +6
- **Damage Resistances:** necrotic
- **Damage Immunities:** lightning
- **Senses:** darkvision 60 ft., passive Perception 16
- **Languages:** —
- **Proficiency Bonus:** +4
- **Challenge:** 10

## Actions

### Multiattack

The zinogre makes two Claw attacks and one Tail attack.

### Claws

Melee Weapon Attack: +9 to hit, reach 5 ft., one target. Hit: 18 (3d8 + 5) piercing damage plus 3 (1d6) lightning damage.

### Tail

Melee Weapon Attack: +9 to hit, reach 10 ft., one target. Hit: 24 (3d12 + 5) bludgeoning damage plus 3 (1d6) lightning damage.

### Charge State (Recharge 6)

Electricity swells around the zinogre before exploding in a flash of lightning. Each creature in within 10 feet of the zinogre must make a DC 16 Dexterity saving throw, taking 38 (11d6) lightning damage, and be pushed back 10 feet on a failed saving throw or half as much damage and isn't pushed back on a successful one.


## Bonus Actions

### Lightning Aura

Immediately after the zinogre uses Charge State, it can surround itself in an aura of lightning for 1 minute. While the aura is active, a creature takes 7 (2d6) lightning damage when it ends it turns within 5 feet of the zinogre.


## Loot

**Carves/Capture rolls:** 3

| Carve | Capture | Material | Slots |
| --- | --- | --- | --- |
| 1-5 | 1-5 | Zinogre Carapace | A |
| 6-8 | 6-9 | Zinogre Electrofur | A, W |
| 9-10 | 10-12 | Zinogre Claw | W |
| 11-12 | 13-15 | Zinogre Shocker | W |
| 13 | — | Zinogre Shell | A |
| 14 | 16-17 | Fulgurbug | A |
| 15-19 | — | Zinogre Tail | A |
| 20 | 18 | Zinogre Jasper | A, W |
| — | 19-20 | Zinogre Plate | A, W |

## Materials (Runes)

These map to `Rune` entities (`name`, `carveChance`, `captureChance`, `slots`, `armorEffect`, `weaponEffect`).

### Zinogre Carapace

- **Slots:** A
- **Carve:** 1-5
- **Capture:** 1-5
- **Armor effect:** Stam Recov. When you take a long rest, you reduce your exhaustion by 2 levels instead of 1.

### Zinogre Electrofur

- **Slots:** A, W
- **Carve:** 6-8
- **Capture:** 6-9
- **Armor effect:** While you are not wearing light, medium, or heavy armor and not holding a shield, your Armor Class equals 10 + your Dexterity modifier + your Charisma modifier.
- **Weapon effect:** While you are attuned to this weapon, you can use its command word to give a weather prediction for the next day, as detailed in the druidcraft cantrip. Once used, you can't use this property again until the next dawn.

### Zinogre Claw

- **Slots:** W
- **Carve:** 9-10
- **Capture:** 10-12
- **Weapon effect:** Your weapon deals an extra 1d6 lightning damage.

### Zinogre Shocker

- **Slots:** W
- **Carve:** 11-12
- **Capture:** 13-15
- **Weapon effect:** Critical Element (lightning). When you critically hit with a weapon or spell that deals lightning damage, you deal an extra 1d6 lightning damage. Additionally, if a creature fails its saving throw by 5 or more against a spell that deals lightning damage, you deal an extra 1d6 lightning damage to it.

### Zinogre Shell

- **Slots:** A
- **Carve:** 13
- **Capture:** —
- **Armor effect:** When you take lightning or thunder damage while wearing this armor, your walking speed increases by 20 feet until the end of your next turn.

### Fulgurbug

- **Slots:** A
- **Carve:** 14
- **Capture:** 16-17
- **Armor effect:** While attuned to this armor, a thunderbug (AC 10; 1 hit point) travels with you. As an action, it will take flight (fly 20 ft.), until you use a bonus action to call it back to you. While in flight it sheds bright light in a 5-foot radius and dim light for an additional 15 feet. If the thunderbug is killed, a new one appears on your shoulder when you finish a short or long rest.

### Zinogre Tail

- **Slots:** A
- **Carve:** 15-19
- **Capture:** —
- **Armor effect:** (Barbarian Only) When you rage, you shroud yourself in an aura of lightning until your rage ends. Any creature that ends its turn within 5 feet of you takes 1d4 lightning damage.

### Zinogre Jasper

- **Slots:** A, W
- **Carve:** 20
- **Capture:** 18
- **Armor effect:** You have resistance to lightning damage while you wear this armor.
- **Weapon effect:** When a creature must succeed on a saving throw due to the effect of your weapon attack, increase the save DC by 1.  Zinogre Plate Chain Crit. Every consecutive hit on a creature increases your crit range by 1 until you score a critical hit, miss an attack, or hit a different creature.

### Zinogre Plate

- **Slots:** A, W
- **Carve:** —
- **Capture:** 19-20
- **Armor effect:** Whenever you make a saving throw against the paralyzed condition, you do so with advantage.
