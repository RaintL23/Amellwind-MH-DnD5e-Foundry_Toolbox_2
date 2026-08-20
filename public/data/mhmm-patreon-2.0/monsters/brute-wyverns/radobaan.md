---
name: Radobaan
slug: radobaan
group: Brute Wyverns
cr: "10"
pdfPage: 77
inGithubJson: true
source: MHMM-Patreon-2.0
size: Huge
creatureType: wyvern (brute)
alignment: unaligned
ac: 15
acFrom: "19 with bone armor"
hp: 136
hpFormula: "13d12 + 52"
speed: "50 ft."
str: 21
dex: 14
con: 18
int: 5
wis: 12
cha: 6
lootRolls: 3
---

# Radobaan

## Bio

The radobaan looks very similar to uragaan in many aspects but has its own unique features. The radobaan is covered in a tar-like substance that sticks rows of bones onto its body. These bones vary in size throughout the radobaan's body, but the most distinctive ones are diablos horns on its legs.

Though these bones aren't as strong as ore, they are lighter. This lighter weight makes radobaan faster than uragaan. Despite not eating ore, radobaan still has a massive chin like uragaan. Like uragaan, radobaan can roll into a wheel and run over enemies. It also can emit coma-inducing gas from its body like uragaan.

Radobaan can be fairly calm unless provoked by a threat, but once provoked, they will turn violent.

## Stat Block

*Huge wyvern (brute), unaligned*
- **Armor Class:** 15 (19 with bone armor)
- **Hit Points:** 136 (13d12 + 52)
- **Speed:** 50 ft.

| STR | DEX | CON | INT | WIS | CHA |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 21 | 14 | 18 | 5 | 12 | 6 |

- **Skills:** Perception +5
- **Damage Resistances:** see Bone Armor
- **Senses:** passive Perception 15
- **Languages:** —
- **Proficiency Bonus:** +4
- **Challenge:** 10

## Traits

### Bone Armor

The radobaan is covered in the bones of fallen creatures granting it a +4 bonus to its AC and resistance to bludgeoning, piercing, slashing damage until the AC bonus is reduced to 0. When the radobaan takes more than 30 damage in a single turn, the bones snap and break, reducing the bonus AC by 1.


## Actions

### Multiattack

The radobaan makes one Tail attack and two Chin Slam attacks.

### Chin Slam

Melee Weapon Attack: +9 to hit, reach 5 ft., one target. Hit: 18 (3d8 + 5) bludgeoning damage.

### Tail

Melee Weapon Attack: +9 to hit, reach 5 ft., one target. Hit: 21 (3d10 + 5) slashing damage.

### Roll (Recharge 5-6)

The radobaan rolls its body into a wheel and moves up to its speed, during this move it can move through other creatures without provoking opportunity attacks. Each creatures the radobaan moves through must succeed on a DC 17 Dexterity saving throw or take 42 (12d6) slashing damage and be knocked prone.

### Sleeping Gas

(2/per Long rest). The radobaan releases sleeping gas in a 15-foot radius around it. Each creature in that area must succeed on a DC 16 Constitution saving throw or fall unconscious for 1 minute, until it takes damage, or until a creature uses an action to shake or slap it awake.


## Loot

**Carves/Capture rolls:** 3

| Carve | Capture | Material | Slots |
| --- | --- | --- | --- |
| 1-5 | 1-5 | Radobaan Shell | A |
| 6-11 | 6-10 | Radobaan Scale | A |
| 12-16 | 11-13 | Radobaan Oilshell | A |
| — | 14-16 | R.Sleep Sac | W, O |
| 17-19 | 17-19 | Radobaan Marrow | A |
| 20 | 19-20 | Radobaan Gem | A |

## Materials (Runes)

These map to `Rune` entities (`name`, `carveChance`, `captureChance`, `slots`, `armorEffect`, `weaponEffect`).

### Radobaan Shell

- **Slots:** A
- **Carve:** 1-5
- **Capture:** 1-5
- **Armor effect:** Guard. You cannot be pushed or knocked backwards while you wear this armor.

### Radobaan Scale

- **Slots:** A
- **Carve:** 6-11
- **Capture:** 6-10
- **Armor effect:** You have resistance to fire damage while you wear this armor.

### Radobaan Oilshell

- **Slots:** A
- **Carve:** 12-16
- **Capture:** 11-13
- **Armor effect:** Tremor-Proof. You cannot be knocked prone while you wear this armor.

### R.Sleep Sac

- **Slots:** W, O
- **Carve:** —
- **Capture:** 14-16
- **Weapon effect:** This weapon has 4 runes. When you hit a creature with this weapon, you can expend 1 of its runes to have the target make a DC 12 Constitution saving throw, or it falls unconscious for 1 minute, until the sleeper takes damage, or until a creature uses an action to shake or slap the sleeper awake. This weapon regains 1 expended rune daily at dawn.
- **Other effect:** A Material that replaces the sleep herb when crafting tranq bombs or tranq ammo. (100 uses). adults lean more on foraging when gas stores are low. Its frequent blasts churns nutrient-rich layers to the surface, drawing more invertebrates and incidentally enriching the habitat. The Rompopolo are territorial and quick to aggression, even where food is plentiful. When threatened, a rompopolo may submerge to hide. Though in some regions it clashes with other wetland predators and scavengers and is itself hunted by larger ambush specialists that tolerate poison.

### Radobaan Marrow

- **Slots:** A
- **Carve:** 17-19
- **Capture:** 17-19
- **Armor effect:** Negate Bleeding. You are immune to wounding effects, such as the Odogaron's bloody wound or the bearded devil's infernal wound while you wear this armor.

### Radobaan Gem

- **Slots:** A
- **Carve:** 20
- **Capture:** 19-20
- **Armor effect:** While you wear this armor, any creature that hits you with a melee attack takes 1d6 slashing damage.
