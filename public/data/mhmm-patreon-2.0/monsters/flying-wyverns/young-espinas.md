---
name: Young Espinas
slug: young-espinas
group: Flying Wyverns
cr: "6"
pdfPage: 371
inGithubJson: false
source: MHMM-Patreon-2.0
size: Large
creatureType: wyvern (flying)
alignment: unaligned
ac: 15
acFrom: natural armor
hp: 119
hpFormula: "14d10 + 42"
speed: "40 ft., fly 80 ft."
str: 19
dex: 12
con: 16
int: 5
wis: 13
cha: 10
lootRolls: 3
---

# Young Espinas

## Bio

The young espinas, while bearing a resemblance to its adult counterpart, has several distinct differences that set it apart. Its scales, though still covered in the characteristic hot pink spikes and rough green plating, are much softer and more vulnerable, making it a light sleeper.

Unlike the adults, it cannot afford to be as passive and remains more alert to potential threats. This heightened awareness ensures that the young espinas can quickly respond to danger, using its agility and speed to evade predators. In this juvenile stage, the young espinas has not yet developed the sac that allows its venom to cause paralysis.

However, it can still fire toxic fireballs that inflict poison on its prey or aggressors. When threatened or enraged, instead of its scales softening, the young espinas undergoes a remarkable transformation where its scales harden. This defensive adaptation not only helps it survive in the competitive environments it inhabits, but this hardening also accelerates the development of the scales into the impenetrable armor seen in adults.

Behaviorally, the young espinas is more active and aggressive compared to its adult form. It actively hunts smaller prey and is quick to defend itself from potential threats. It can often be seen using its horn to ram into foes or predators, leveraging its agility to outmaneuver them.

Despite its relative vulnerability, the young espinas shows signs of the formidable predator it will eventually become, displaying bursts of speed and tactical cunning in its interactions within the ecosystem.

## Stat Block

*Large wyvern (flying), unaligned*
- **Armor Class:** 15 (natural armor)
- **Hit Points:** 119 (14d10 + 42)
- **Speed:** 40 ft., fly 80 ft.

| STR | DEX | CON | INT | WIS | CHA |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 19 | 12 | 16 | 5 | 13 | 10 |

- **Saving Throws:** Con +6
- **Skills:** Perception +4
- **Damage Resistances:** bludgeoning (soft hide), fire, lightning
- **Damage Immunities:** poison
- **Condition Immunities:** paralyzed, poisoned
- **Senses:** passive Perception 14
- **Languages:** —
- **Proficiency Bonus:** +3
- **Challenge:** 6

## Traits

### Enrage (Recharges After a Short or Long Rest)

When the espinas hit points drop below half of its maximum, it enrages for 1 minute. While enraged, the espinas AC is increased by 2, it has advantage on melee attack rolls and loses its resistance to bludgeoning damage.

### Light Sleeper

The espinas gains a +5 bonus to its passive Perception while it is naturally asleep. Sounds louder than a whisper within 10 feet of the espinas awaken it, if the creature making the sound fails a DC 19 Stealth check using the appropriate ability score.

### Soft Hide

The espinas has resistance to bludgeoning damage while it is not enraged.


## Actions

### Multiattack

The espinas makes one Bite attack and one Tail attack.

### Bite

Melee Weapon Attack: +7 to hit, reach 5 ft., one target. Hit: 11 (2d6 + 4) piercing damage.

### Horn

Melee Weapon Attack: +7 to hit, reach 5 ft., one target. Hit: 13 (2d8 + 4) piercing damage. If the espinas moved at least 20 feet straight toward the target immediately before the hit, the target takes an extra 14 (4d6) piercing damage. If the target is a creature, it must succeed on a DC 15 Strength saving throw or be pushed up to 10 feet away and knocked prone.

### Tail

Melee Weapon Attack: +7 to hit, reach 10 ft., one target. Hit: 15 (2d10 + 4) piercing damage.

### Blight Breath (Recharge 5-6)

The espinas exhales a fireball at a point within 60 feet of it. Each creature in a 10-foot radius sphere centered on that point must make a DC 14 Dexterity or Constitution saving throw. On a failed save, a creature takes 16 (3d10) fire damage plus 10 (3d6) poison damage and is poisoned for 1 minute. On a successful save, a creature takes half as much damage and isn't poisoned. A poisoned creature can repeat the saving throw at the end of each of its turns, ending the effect on itself on a success.


## Loot

**Carves/Capture rolls:** 3

| Carve | Capture | Material | Slots |
| --- | --- | --- | --- |
| 1-5 | 1-4 | Espinas Shell | A, W |
| 6-9 | 5-7 | Espinas Carapace | A, W |
| 10-14 | 8-14 | Espinas Horn | A, W |
| 15-18 | 15-19 | Espinas Poison Blood | A, W |
| 19-20 | 20 | Espinas Tail | A, W |

## Materials (Runes)

These map to `Rune` entities (`name`, `carveChance`, `captureChance`, `slots`, `armorEffect`, `weaponEffect`).

### Espinas Shell

- **Slots:** A, W
- **Carve:** 1-5
- **Capture:** 1-4
- **Armor effect:** While attuned to this armor, you don't suffer any ill effects from sleeping in it.
- **Weapon effect:** (Cosmetic) While you are attuned to this weapon you can grow a cactus flower on the blade or surface of your weapon. Once you use this property you can't use it again until you finish a short or long rest.

### Espinas Carapace

- **Slots:** A, W
- **Carve:** 6-9
- **Capture:** 5-7
- **Armor effect:** You have advantage on Dexterity (Stealth) checks to hide in forest or jungle terrain.
- **Weapon effect:** Abnormal Status Atk up (S). Whenever you inflict a condition on a creature or object that has a duration of 1 minute or longer, the maximum duration of the condition is increased by 6 seconds.

### Espinas Horn

- **Slots:** A, W
- **Carve:** 10-14
- **Capture:** 8-14
- **Armor effect:** While you wear this armor, any creature that hits you with a melee attack takes 1d4 poison damage.
- **Weapon effect:** Partbreaker. You deal an extra 1d4 damage when you critically hit with this weapon.

### Espinas Poison Blood

- **Slots:** A, W
- **Carve:** 15-18
- **Capture:** 15-19
- **Armor effect:** You gain a +2 bonus on saving throws against being paralyzed and poisoned while you wear this armor.
- **Weapon effect:** When you cast a spell that deals fire damage while attuned to this armor, the damage is split evenly between fire and poison damage.

### Espinas Tail

- **Slots:** A, W
- **Carve:** 19-20
- **Capture:** 20
- **Armor effect:** Stamina Surge+1. While wearing this armor, you can use an action to cast the haste spell from it once per day but can target only yourself when you do so and you gain 2 levels of exhaustion when the spell ends.
- **Weapon effect:** Awaken. When this material is placed in a weapon that does not deal cold, fire, lightning, necrotic, or thunder damage, it rolls one extra damage die when it hits. For example, a shortsword now rolls 2d6 and a greatsword deals 3d6.
