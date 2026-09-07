# Entities: Actor and Monster

> Split from legacy `instrucctions.md`. Prefer this file over reading the whole domain corpus.

## Entidades de la Aplicación

La jerarquía de actores y entidades de dominio es la siguiente:

```text
Actor (clase base)
  ├── Monster (hereda de Actor)
  └── Player  (hereda de Actor)

Entidades independientes (no heredan de Actor):
  ├── Rune            — materiales de monstruo (MM)
  ├── Weapon          — armas de cazador (GTMH, type HW)
  ├── OptionalFeature — features de arma (GTMH optionalfeature[])
  ├── MHItem          — ítems generales (GTMH)
  ├── Species         — especies/subrazas (GTMH race + subrace)
  ├── Background      — trasfondos (GTMH)
  ├── Feat            — dotes (GTMH)
  ├── DowntimeActivity — actividades parseadas de variantrule
  ├── Resource        — recursos de campo (estático)
  ├── Environment     — biomas (estático)
  ├── Shop            — tiendas (estático)
  ├── Spell           — conjuros (5etools, fetch bajo demanda)
  ├── Class           — clases 5e (5etools)
  ├── DndItem         — ítems 5e (5etools)
  └── BestiaryCreature — criaturas 5e (5etools bestiary)

Estado de UI (no persistido en IndexedDB):
  ├── CartEntry       — carrito de compras
  ├── EquippedWeapon / EquippedArmor / EquippedTrinket — Character Builder
  ├── CharacterStats / CombatCalculation — derivados del builder
  ├── RuneBuildState  — planificador de runas (RuneBuildContext)
  └── NpcCreatorState / MonstieCreatorState — generadores interactivos
```

---

### Actor (clase base)

Todos los campos de esta sección son compartidos por Monstruos y Personajes.

> **Nota sobre las fuentes**: Los nombres de campo siguen la convención de 5etools (fuente de datos) y Foundry VTT (sistema de destino). Donde difieren, se indica la equivalencia.

#### Identificación

- **name** — Nombre completo del actor.
- **shortName** — Nombre abreviado o apodo. Solo aplica en monstruos con nombre largo (ej. "Acidic Glavenus" → "Glavenus"). Omitir en personajes.
- **size** — Tamaño del actor. Código de 5etools: `T` (Tiny), `S` (Small), `M` (Medium), `L` (Large), `H` (Huge), `G` (Gargantuan). En Foundry: string completo en minúsculas (`med`, `lrg`, etc.).
- **type**
  - `type` — Tipo de criatura (ej. `wyvern`, `beast`, `humanoid`).
  - `tags` _(array)_ — Subtipos opcionales (ej. `["brute"]`, `["fanged"]`). Plural, puede estar vacío.
- **alignment** — Alineamiento. En 5etools es un array de códigos: `["U"]` = Unaligned, `["N"]` = Neutral, `["CE"]` = Chaotic Evil, etc.

#### Combate base

- **armorClass** _(array)_ — En 5etools es un array porque puede haber múltiples fuentes de AC:
  - `ac` _(int)_ — Valor de Clase de Armadura.
  - `from` _(array de strings)_ — Origen/s del valor (ej. `["natural armor"]`, `["chain mail", "shield"]`).
- **hp**
  - `formula` — Fórmula de dados (ej. `"20d12 + 140"`). Principalmente para monstruos.
  - `average` _(int)_ — Promedio calculado de la fórmula.
  - `current` _(int)_ — HP actual (relevante en combate y para personajes).
  - `temp` _(int)_ — HP temporales.
- **speed** — Velocidades de movimiento en pies. Omitir las que no apliquen:
  - `walk` _(int)_
  - `swim` _(int)_
  - `fly` _(int)_
  - `burrow` _(int)_
  - `climb` _(int)_
  - `hover` _(boolean)_ — `true` si puede flotar estático en el aire (sin velocidad fly activa).
- **initiative** _(int)_ — Bonificador de iniciativa. Calculado: modificador de `dex` + bonificaciones adicionales.
- **proficiencyBonus** _(int)_ — Calculado a partir del CR (monstruos) o nivel (personajes). Fórmula: `Math.ceil(CR / 4) + 1`.

#### Atributos base (Ability Scores)

Son siempre exactamente 6 campos fijos, **no una lista**. Se almacenan como valores enteros directamente:

| Campo | Atributo     |
| ----- | ------------ |
| `str` | Strength     |
| `dex` | Dexterity    |
| `con` | Constitution |
| `int` | Intelligence |
| `wis` | Wisdom       |
| `cha` | Charisma     |

- Cada uno almacena solo el **`value`** _(int, 1–30)_.
- El **modificador** nunca se almacena: siempre se calcula en el cliente con `Math.floor((value - 10) / 2)`.
- La tabla de referencia modificador/valor:

  | Valor | Modificador |
  | ----- | ----------- |
  | 1     | −5          |
  | 2–3   | −4          |
  | 4–5   | −3          |
  | 6–7   | −2          |
  | 8–9   | −1          |
  | 10–11 | +0          |
  | 12–13 | +1          |
  | 14–15 | +2          |
  | 16–17 | +3          |
  | 18–19 | +4          |
  | 20–21 | +5          |
  | 22–23 | +6          |
  | 24–25 | +7          |
  | 26–27 | +8          |
  | 28–29 | +9          |
  | 30    | +10         |

- **savingThrows** — Competencias en saving throws. Objeto con solo las entradas que tienen competencia. Valor: string con el modificador total (ej. `{ "str": "+13", "con": "+13" }`). En Foundry: `proficient: 1` en cada ability.

#### Habilidades (Skills)

Son siempre las mismas 18 habilidades fijas, **no una lista genérica**. En Foundry se identifican por clave abreviada:

| Clave | Habilidad       | Atributo |
| ----- | --------------- | -------- |
| `acr` | Acrobatics      | `dex`    |
| `ani` | Animal Handling | `wis`    |
| `arc` | Arcana          | `int`    |
| `ath` | Athletics       | `str`    |
| `dec` | Deception       | `cha`    |
| `his` | History         | `int`    |
| `ins` | Insight         | `wis`    |
| `itm` | Intimidation    | `cha`    |
| `inv` | Investigation   | `int`    |
| `med` | Medicine        | `wis`    |
| `nat` | Nature          | `int`    |
| `prc` | Perception      | `wis`    |
| `prf` | Performance     | `cha`    |
| `per` | Persuasion      | `cha`    |
| `rel` | Religion        | `int`    |
| `slt` | Sleight of Hand | `dex`    |
| `ste` | Stealth         | `dex`    |
| `sur` | Survival        | `wis`    |

- `value` _(int)_ — Nivel de competencia: `0` = ninguna, `1` = proficient, `2` = expertise.
- El modificador total nunca se almacena, siempre se calcula: `atributoMod + (value * proficiencyBonus)`.
- **passivePerception** _(int)_ — Campo separado a nivel de actor. Calculado: `10 + modificador total de Perception`.

#### Sentidos

- **senses**
  - `darkvision` _(int, en pies)_ — Visión en oscuridad. Omitir si no tiene.
  - `blindsight` _(int, en pies)_ — Visión ciega.
  - `tremorsense` _(int, en pies)_ — Sentido de vibración.
  - `truesight` _(int, en pies)_ — Visión verdadera.
  - `special` _(string)_ — Otros sentidos no estándar.

#### Daño y Condiciones

Estos son **tres campos separados**, no uno unificado. Así los maneja tanto 5etools como Foundry:

- **damageImmunities** _(array)_ — Tipos de daño a los que es inmune (recibe 0 daño). Ej: `["acid", "fire"]`.
- **damageResistances** _(array)_ — Tipos de daño a los que tiene resistencia (recibe 1/2 daño). Puede contener objetos con condición: `{ "resist": ["bludgeoning"], "note": "from nonmagical attacks", "cond": true }`.
- **damageVulnerabilities** _(array)_ — Tipos de daño a los que es vulnerable (recibe daño doble).

Tipos de daño válidos: `acid`, `bludgeoning`, `cold`, `fire`, `force`, `lightning`, `necrotic`, `piercing`, `poison`, `psychic`, `radiant`, `slashing`, `thunder`.

- **conditionImmunities** _(array)_ — Condiciones a las que el actor es inmune. Valores posibles: `blinded`, `charmed`, `deafened`, `frightened`, `grappled`, `incapacitated`, `invisible`, `paralyzed`, `petrified`, `poisoned`, `prone`, `restrained`, `stunned`, `unconscious`, `exhaustion`.

#### Idiomas

- **languages** _(array de strings)_ — Idiomas que el actor habla o entiende. Ej: `["common", "draconic"]`. Para monstruos suele ser vacío o `["—"]`.

#### Rasgos, Acciones y Reacciones

Todos comparten la misma estructura de entrada. El texto usa el formato de marcado de 5etools, que se debe parsear para mostrar en la UI:

```text
Marcado 5etools relevante:
  {@atk mw}         → "Melee Weapon Attack:"
  {@atk rw}         → "Ranged Weapon Attack:"
  {@hit N}          → "+N to hit"
  {@damage NdN + N} → tirada de daño
  {@dc N}           → "DC N"
  {@condition X}    → nombre de condición con referencia
  {@h}              → "Hit:"
  {@recharge N}     → "(Recharge N–6)"
```

- **traits** _(array)_ — Rasgos pasivos, siempre activos (ej. Legendary Resistance, Magic Resistance):
  - `name` _(string)_
  - `entries` _(array)_ — Párrafos de descripción con marcado 5etools.

- **actions** _(array)_ — Acciones disponibles en combate (incluyendo Multiataques):
  - `name` _(string)_
  - `entries` _(array)_ — Descripción del ataque/efecto con marcado 5etools.

- **reactions** _(array)_ — Reacciones disponibles. Misma estructura que `actions`.

---

### Monster (hereda de Actor)

Añade los siguientes campos sobre la base del Actor:

- **group** _(array)_ — Grupo o familia del monstruo (ej. `["Brute Wyverns"]`, `["Fanged Beasts"]`).
- **source** _(string)_ — Código de la fuente (ej. `"MHMM"`, `"AGMH"`).
- **page** _(int)_ — Página del libro de origen.
- **cr** _(string)_ — Challenge Rating (ej. `"19"`, `"1/2"`, `"0"`). Es string porque puede ser fracción.
- **environment** _(array)_ — Entornos donde habita. Valores del MM analizado: `forest`, `desert`, `swamp`, `mountain`, `underdark`, `arctic`, `coastal`, `grassland`, `urban`, `underwater`.
- **bonusActions** _(array)_ — Bonus actions. Misma estructura que `actions`. Viene de `raw.bonus` (5etools); si el feed aún embebe entradas `Bonus Action: …` dentro de `action`, el mapper las separa aquí y las quita de Actions.
- **legendaryActions** _(array)_ — Acciones legendarias. Misma estructura que `actions`. Solo presente en monstruos legendarios.
- **loot** — Resumen de obtención de materiales al derrotar o capturar el monstruo:
  - `rolls` _(int)_ — Número de tiradas de d20 al carvear o capturar el monstruo (ej. `3`). Mismo valor para ambos modos — viene del campo `"Carves/Capture"` del JSON.
  - Los materiales individuales NO viven aquí — son entidades `Rune` separadas que referencian al monstruo. Ver sección **Rune**.
- **fluff** — Texto de lore del monstruo. Array de entradas de texto 5etools.

---

