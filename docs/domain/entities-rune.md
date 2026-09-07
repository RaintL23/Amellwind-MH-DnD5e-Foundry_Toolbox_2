# Entities: Rune

> Split from legacy `instrucctions.md`. Prefer this file over reading the whole domain corpus.

For tag taxonomy and implementation notes, see [`entities-rune-tags.md`](./entities-rune-tags.md).

### Rune (entidad independiente)

Un `Rune` representa un **material crafteable** que se obtiene al carvear o capturar un monstruo. Cada material puede usarse para fabricar armadura, arma, o ambas, y tiene un efecto diferente según el tipo de equipo donde se coloque.

Los `Rune` **no viven dentro del Monster** — son entidades propias que referencian al monstruo de origen. Esto permite consultarlos, filtrarlos y buscarlos de forma independiente.

#### Origen de los datos en el JSON

##### Dónde vive el fluff

El campo `fluff` está **directamente dentro del objeto monstruo** en el array `monster` del JSON. No existe un array separado `monsterFluff` — no hay que hacer ningún join externo:

```json
{
  "monster": [
    {
      "name": "Acidic Glavenus",
      "cr": "19",
      "...": "...otros campos del monstruo...",
      "fluff": {
        "entries": ["...texto de lore...", { "type": "inset", "...": "..." }]
      }
    }
  ]
}
```

##### Estructura interna de `fluff.entries`

`fluff.entries` es un array mixto que contiene:

1. **Strings** — Párrafos de texto de lore del monstruo (descripción narrativa). Se ignoran para el mapper de Runes.
2. **Un objeto `inset`** — Contiene toda la información de loot y efectos de materiales. Es el único objeto del array y tiene `"type": "inset"`.

El mapper debe encontrar el inset así:

```ts
const inset = monster.fluff.entries.find((e) => e.type === "inset");
if (!inset) return []; // el monstruo no tiene datos de loot
```

##### Estructura interna del inset

`inset.entries` es un array con exactamente estos elementos (en orden):

```json
[
  // 1. Tabla de cabecera: CR y número de tiradas
  {
    "type": "table",
    "rows": [["Challenge Rating", "19", "Carves/Capture", "3"]]
  },

  // 2. Tabla de loot: una fila por material
  {
    "type": "table",
    "colLabels": ["Carve Chance", "Capture Chance", "Material", "Slots"],
    "rows": [
      ["1-6",   "1-4",   "Acidic Glavenus Scale",    "(A)"],
      ["7-11",  "5-8",   "Acidic Glavenus Cortex",   "(A)"],
      ["12-14", "9-11",  "Acidic Glavenus Hardfang",  "(A,W)"],
      ["...",   "...",   "...",                       "..."]
    ]
  },

  // 3. Lista de efectos de armadura (puede no existir)
  {
    "type": "list",
    "name": "ARMOR MATERIAL EFFECTS",
    "items": [
      { "type": "entries", "name": "Acidic Glavenus Scale", "entries": ["texto del efecto"] },
      { "...", "name": "Acidic Glavenus Cortex", "entries": ["..."] }
    ]
  },

  // 4. Lista de efectos de arma (puede no existir)
  {
    "type": "list",
    "name": "WEAPON MATERIAL EFFECTS",
    "items": [
      { "type": "entries", "name": "Acidic Glavenus Hardfang", "entries": ["texto del efecto"] },
      { "...", "name": "...", "entries": ["..."] }
    ]
  }
]
```

**Notas críticas sobre el inset:**

- La **tabla de cabecera** (elemento 0) no tiene `colLabels`. El número de tiradas está en `rows[0][3]`. Es un único número que aplica igual para carve y capture (ej. `"3"` significa 3 tiradas de d20 para ambos).
- La **tabla de loot** (elemento 1) se identifica por tener `colLabels` con el valor `"Carve Chance"` en la primera posición.
- Las **listas de efectos** se identifican por su `name`: `"ARMOR MATERIAL EFFECTS"`, `"WEAPON MATERIAL EFFECTS"` y `"OTHER MATERIAL EFFECTS"`. Cualquiera puede estar ausente si el monstruo no tiene materiales de ese tipo.
- Los efectos de armadura y arma se buscan **por nombre de material** haciendo lookup en los items de cada lista.
- Puede haber entradas en las listas de efectos que **no están en la tabla de loot** (datos huérfanos del JSON fuente). El mapper debe ignorarlos — solo procesa los materiales que aparecen en la tabla de loot.

##### Cómo identificar la tabla de loot dentro del inset

```ts
const tables = inset.entries.filter((e) => e.type === "table");
const lootTable = tables.find((t) => t.colLabels?.[0] === "Carve Chance");
const headerTable = tables.find((t) => !t.colLabels); // la tabla sin colLabels es la de cabecera
```

##### Fuentes que el mapper cruza por `name` del material

| Fuente en el JSON                                       | Campo mapeado                                       |
| ------------------------------------------------------- | --------------------------------------------------- |
| `lootTable.rows` — cada fila del array                  | `name`, `carveChance`, `captureChance`, `slots`     |
| `headerTable.rows[0][3]`                                | `rolls` (tiradas d20 tanto para carve como capture) |
| Lista `ARMOR MATERIAL EFFECTS` → item con mismo `name`  | `armorEffect`                                       |
| Lista `WEAPON MATERIAL EFFECTS` → item con mismo `name` | `weaponEffect`                                      |
| Lista `OTHER MATERIAL EFFECTS` → item con mismo `name`  | `otherEffect`                                       |

