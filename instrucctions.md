# Amellwind Monster Hunter DnD5e Toolbox

## Descripción

Esta es una aplicación que servirá como toolkit para un Dungeon Master que quiera hacer uso del manual de Amellwind que combina Monster Hunter con Dungeons & Dragons 5e.

La información mostrada en esta aplicación proviene de los siguientes recursos homebrew de Amellwind disponibles en 5etools:

- [Amellwind; Monster Hunter Monster Manual.json](https://raw.githubusercontent.com/TheGiddyLimit/homebrew/master/collection/Amellwind;%20Monster%20Hunter%20Monster%20Manual.json)
- [Amellwind; Amellwind's Guide to Monster Hunting.json](https://raw.githubusercontent.com/TheGiddyLimit/homebrew/master/collection/Amellwind;%20Amellwind's%20Guide%20to%20Monster%20Hunting.json)

---

## Stack Tecnológico

| Capa               | Tecnología                           |
| ------------------ | ------------------------------------ |
| Framework          | React 18 + TypeScript                |
| Build tool         | Vite                                 |
| Estilos            | Tailwind CSS                         |
| Componentes UI     | shadcn/ui (Radix UI)                 |
| Tablas             | TanStack Table                       |
| Routing            | React Router v6 (lazy + Suspense)    |
| Almacenamiento     | IndexedDB (`idb`)                    |
| Gestor de paquetes | pnpm                                 |
| Node.js            | 22.x (`.nvmrc`)                      |

> Toda la app es una **SPA** (Single Page Application). No hay backend propio. Los datos de **Amellwind** se cachean en IndexedDB; el **compendio D&D 5e** (spells, classes, races, backgrounds, feats, items, bestiary) se obtiene bajo demanda desde el mirror de 5etools, con opción de mirror local (`VITE_5ETOOLS_DATA=local`). El **Character Builder** exporta/importa personajes en formato **Foundry VTT (dnd5e)**.

---

## Routing y Navegación

La app usa **React Router v6** con rutas declarativas montadas en `App.tsx`. El layout general (Sidebar + área de contenido) se aplica mediante un componente `MainLayout` que envuelve todas las rutas con contenido.

### Estructura de rutas

Todas las rutas de página se cargan con **`React.lazy`** y `<Suspense>` (fallback `LoadingScreen`).

```text
/                          → Redirect a /monsters

── Amellwind Homebrew ──
/builder                   → Character Builder (ALPHA, export/import Foundry VTT)
/damage-calculator         → Calculadora de daño por turno
/character-guide           → Guía de creación de personajes
/monstie-sidekick          → Reglas y creador de Monstie Sidekick
/npc-generator             → Generador de NPCs humanoides
/species                   → Especies y subrazas (GTMH)
/backgrounds               → Trasfondos (GTMH)
/feats                     → Dotes (GTMH)
/monsters                  → Listado de monstruos MH
/monsters/:monsterId       → Detalle de monstruo (página dedicada)
/runes                     → Materiales de monstruo + planificador
/material-effects          → Efectos de materiales (armadura/arma)
/conditions                → Condiciones (GTMH)
/diseases                  → Enfermedades (GTMH)
/weapons                   → Hunter Weapons
/items                     → Catálogo de ítems GTMH
/shops                     → Tiendas y carrito
/cooking                   → Cocina artesana
/combo                     → Combo List
/environments              → Biomas y tablas de cacería
/resources                 → Recursos de campo
/downtime                  → Actividades de downtime (GTMH)

── Compendio D&D 5e ──
/spells                    → Conjuros (5etools)
/classes                   → Listado de clases base
/classes/:classId          → Detalle de clase (variantes por fuente)
/dnd-races                 → Especies oficiales 5e
/dnd-backgrounds           → Trasfondos oficiales 5e
/dnd-feats                 → Dotes oficiales 5e
/dnd-items                 → Ítems mágicos y equipo (5etools)
/bestiary                  → Bestiario oficial
/bestiary/:creatureId      → Detalle de criatura
/xanathar-backstory        → Generador de trasfondo (XGE)

*                          → Página 404 / Not Found
```

### Implementación en `App.tsx`

Al montar, `App.tsx` ejecuta `syncData()` y muestra un banner de sincronización vía `SyncProvider` hasta que termina. Tras un sync exitoso invalida cachés en memoria según qué store se actualizó (monstruos/runas vs. species/backgrounds/feats/monstie).

Providers globales:

- **`ThemeProvider`** — temas visuales (selector en el footer del Sidebar).
- **`SyncProvider`** — estado de sincronización inicial (`syncing`).
- **`BrowserRouter`** + rutas lazy.

Providers en **`MainLayout`** (todas las rutas con layout):

- **`CartProvider`** — carrito de compras (tiendas e ítems).
- **`BuilderInventoryProvider`** — resuelve armas/armaduras equipables desde el carrito para el Builder.

Providers **por ruta** (no globales):

- **`RuneBuildProvider`** — envuelve `/runes` y `/builder` (planificador de runas).

```tsx
<ThemeProvider>
  <SyncProvider syncing={syncing}>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout syncing={syncing} />}>
          <Route index element={<Navigate to="/monsters" replace />} />
          {/* … rutas lazy con Suspense … */}
          <Route path="runes" element={
            <RuneBuildProvider><RuneList /></RuneBuildProvider>
          } />
          <Route path="builder" element={
            <RuneBuildProvider><BuilderPage /></RuneBuildProvider>
          } />
          <Route path="monsters" element={<MonstersOutlet />}>
            <Route index element={<MonsterList />} />
            <Route path=":monsterId" element={<MonsterDetailPage />} />
          </Route>
          {/* … */}
        </Route>
      </Routes>
    </BrowserRouter>
  </SyncProvider>
</ThemeProvider>
```

### Sidebar y navegación

El `Sidebar` agrupa links en grupos colapsables organizados bajo dos secciones: **Amellwind Homebrew** y **DnD 5e**. Soporta **colapso en desktop** (solo iconos) y **drawer en mobile** con overlay. Incluye **`ThemeSelector`** en el footer. La configuración vive en `NAV_GROUPS` (`Sidebar.tsx`); cada grupo tiene `section` + `label` + `items`.

El link **Builder** muestra un badge con `totalItems` del carrito (`BuilderInventoryContext`), no un inventario separado: el equipo equipable del builder proviene de ítems añadidos al carrito en Shops/Items.

| Sección           | Grupo Sidebar   | Links principales                                              |
| ----------------- | --------------- | -------------------------------------------------------------- |
| Amellwind Homebrew | _(suelto)_     | Builder                                                        |
| Amellwind Homebrew | DM Tools        | NPC Generator                                                 |
| Amellwind Homebrew | Character Tools | Monstie Sidekick, Damage Calculator                          |
| Amellwind Homebrew | Character       | Creation Guide, Species, Backgrounds, Feats                  |
| Amellwind Homebrew | Bestiary        | Monsters, Runes, Material Effects, Conditions, Diseases      |
| Amellwind Homebrew | Gear            | Weapons, Items                                                |
| Amellwind Homebrew | Craft & Trade   | Shops, Cooking, Combo List, Environments, Resources, Downtime |
| DnD 5e            | Compendium      | Spells, Classes, Races, Backgrounds, Feats, Items, Bestiary  |
| DnD 5e            | Character Tools | Xanathar Backstory, Damage Calculator                        |

### Layout global (`MainLayout`)

`MainLayout` monta `Sidebar`, banner de sync opcional, topbar mobile y `<Outlet />`. **No** incluye `BuildDrawer` global: el planificador de runas vive solo en **`RuneList`** (`/runes`) y el builder reutiliza `RuneBuildContext` en `/builder`.

---

## Arquitectura de datos

### Concepto general

Los JSONs guardados localmente actúan como la **base de datos** de la aplicación. Toda consulta de datos (listado de monstruos, detalle de un arma, búsqueda, filtros) se realiza **contra los JSONs en caché**, nunca directamente contra la API externa.

La API solo se consulta en un único momento: al abrir la aplicación, para verificar si hay datos más recientes disponibles. Una vez descargados y guardados, la API no vuelve a intervenir hasta la próxima sesión.

```text
┌─────────────────────────────────────────────────────┐
│                   FLUJO GENERAL                     │
│                                                     │
│  Abrir app → Sincronizar datos (1 sola vez)         │
│                    ↓                                │
│          JSONs en IndexedDB (base de datos local)   │
│                    ↓                                │
│  Todas las consultas de la app leen de aquí         │
└─────────────────────────────────────────────────────┘
```

### Flujo de sincronización al abrir la app

```text
Abrir app
  └─ ¿Existe BD local y tiene menos de 24 horas?
        ├─ SÍ → continuar directamente a la app (sin fetch)
        └─ NO → fetch a las URLs externas
                  └─ ¿Respuesta válida?
                        ├─ SÍ → guardar copia de los datos anteriores ("versión previa")
                        │        → guardar datos nuevos en BD local con timestamp
                        │        → continuar a la app con datos actualizados
                        └─ NO → continuar con los datos actuales aunque estén desactualizados (fallback)
```

### Almacenamiento: IndexedDB

Al ser una aplicación web de navegador, el almacenamiento se implementa con **`IndexedDB`** (no `localStorage`), ya que los JSONs fuente superan ampliamente el límite de 5–10 MB de localStorage.

IndexedDB permite almacenar objetos grandes, hacer consultas por clave, y es persistente entre sesiones sin límite de tamaño práctico.

#### Estructura de la base de datos local

| Store (tabla)   | Contenido                                              |
| --------------- | ------------------------------------------------------ |
| `mm_current`    | Datos actuales del Monster Manual (array de monstruos) |
| `mm_previous`   | Snapshot anterior del Monster Manual (para rollback)   |
| `mm_meta`       | Timestamp del último fetch, versión, etc.              |
| `gtmh_current`  | Datos de la Guía de Caza (ver claves abajo)            |
| `gtmh_previous` | Snapshot anterior de la Guía de Caza                   |
| `gtmh_meta`     | Timestamp del último fetch, versión, etc.              |

#### Claves dentro de `gtmh_current`

| Clave            | Origen JSON GTMH     | Uso en la app                          |
| ---------------- | -------------------- | -------------------------------------- |
| `data`           | `item[]`             | Ítems MH, armas (`type: "HW"`), etc.   |
| `optfeatures`    | `optionalfeature[]`  | Optional features de armas             |
| `race`           | `race[]`             | Especies base                          |
| `subrace`        | `subrace[]`          | Subrazas (Felyne, Dragonborn elder, …) |
| `background`     | `background[]`       | Trasfondos de cazador                  |
| `feat`           | `feat[]`             | Dotes                                  |
| `variantrule`    | `variantrule[]`      | Reglas variantes (downtime, guías)     |
| `classFeature`   | `classFeature[]`     | Features de Monstie Sidekick           |
| `class`          | `class[]`            | Clases MH (p. ej. Hunter)              |

Al sincronizar GTMH, `sync.service.ts` persiste cada array por separado. Si una clave no está cacheada (p. ej. tras upgrade), `ensureGtmhArrayStore()` puede hacer lazy-fetch del JSON remoto.

#### Datos 5etools (no en IndexedDB)

Spells, classes, items y bestiary oficiales se cargan bajo demanda desde `FIVETOOLS_DATA_BASE_URL` (`api.constants.ts`). En desarrollo offline, copiar JSON a `public/5etools/` y usar `VITE_5ETOOLS_DATA=local`.

### Objetivos del sistema

- **Velocidad**: todas las consultas son locales, sin latencia de red.
- **Actualización**: la sincronización con la API ocurre como máximo una vez cada 24 horas.
- **Resiliencia**: si el fetch falla o la nueva versión está rota, la app sigue funcionando con los datos anteriores.
- **Trazabilidad**: el snapshot previo permite hacer rollback manual si una actualización rompe algo.

---

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
- **legendaryActions** _(array)_ — Acciones legendarias. Misma estructura que `actions`. Solo presente en monstruos legendarios.
- **loot** — Resumen de obtención de materiales al derrotar o capturar el monstruo:
  - `rolls` _(int)_ — Número de tiradas de d20 al carvear o capturar el monstruo (ej. `3`). Mismo valor para ambos modos — viene del campo `"Carves/Capture"` del JSON.
  - Los materiales individuales NO viven aquí — son entidades `Rune` separadas que referencian al monstruo. Ver sección **Rune**.
- **fluff** — Texto de lore del monstruo. Array de entradas de texto 5etools.

---

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
- Las **listas de efectos** se identifican por su `name`: `"ARMOR MATERIAL EFFECTS"` y `"WEAPON MATERIAL EFFECTS"`. Cualquiera de las dos puede estar ausente si el monstruo no tiene materiales de ese tipo.
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

#### Atributos de la entidad Rune

- **name** _(string)_ — Nombre del material (ej. `"Acidic Glavenus Scale"`).
- **monsterName** _(string)_ — Nombre del monstruo del que proviene (ej. `"Acidic Glavenus"`).
- **monsterSource** _(string)_ — Código de la fuente del monstruo (ej. `"MHMM"`).
- **carveChance** _(string)_ — Rango de d20 para obtenerlo por carve (ej. `"1-6"`). Valor `"-"` si no es carveable.
- **captureChance** _(string)_ — Rango de d20 para obtenerlo por captura (ej. `"1-4"`). Valor `"-"` si no es capturable.
- **rolls** _(int)_ — Número de tiradas de d20 al carvear o capturar al monstruo (ej. `3`). Es el mismo valor para ambos modos de obtención — viene del campo `"Carves/Capture"` del JSON.
- **slots** _(array)_ — Tipos de equipo donde se puede usar. Valores posibles: `"A"` (Armor), `"W"` (Weapon). Puede ser `["A"]`, `["W"]`, o `["A", "W"]`. Mapeado desde el string `"(A,W)"` del JSON.
- **armorEffect** _(string | null)_ — Texto del efecto cuando se coloca en armadura. Presente solo si `slots` incluye `"A"`. El texto puede contener marcado de 5etools que debe parsearse.
- **weaponEffect** _(string | null)_ — Texto del efecto cuando se coloca en un arma. Presente solo si `slots` incluye `"W"`. Ídem sobre el marcado.
- **monsterCr** _(string)_ — CR del monstruo de origen (para referencia y filtros).
- **tier** _(1 | 2 | 3 | 4)_ — Rareza del material derivada del CR del monstruo (no confundir con el Tier de monstruos en la tabla de Monsters):

  | Tier | CR del monstruo |
  | ---- | --------------- |
  | 1    | 1 – 4           |
  | 2    | 5 – 10          |
  | 3    | 11 – 16         |
  | 4    | 17+             |

- **tags** _(string[])_ — Tags combinados de `armorEffect` y `weaponEffect` (ver taxonomía más abajo).
- **weaponTags** _(string[])_ — Tags extraídos solo del `weaponEffect` (validación de reglas de arma).
- **armorTags** _(string[])_ — Tags extraídos solo del `armorEffect` (validación de reglas de armadura).

#### Lógica del mapper (pseudocódigo)

```text
por cada monster en mm_current:

  // 1. Encontrar el inset dentro de fluff.entries
  inset = monster.fluff?.entries?.find(e => e.type === "inset")
  si no existe inset → saltar este monstruo (no tiene datos de loot)

  // 2. Extraer tablas y listas del inset
  lootTable    = inset.entries.find(e => e.type === "table" && e.colLabels?.[0] === "Carve Chance")
  headerTable  = inset.entries.find(e => e.type === "table" && !e.colLabels)
  armorList    = inset.entries.find(e => e.type === "list" && e.name === "ARMOR MATERIAL EFFECTS")
  weaponList   = inset.entries.find(e => e.type === "list" && e.name === "WEAPON MATERIAL EFFECTS")

  // 3. Indexar efectos por nombre de material (pueden ser undefined si no existe la lista)
  armorEffects  = indexarPorNombre(armorList?.items)   // { "Material Name" → item }
  weaponEffects = indexarPorNombre(weaponList?.items)  // { "Material Name" → item }

  // 4. Leer número de tiradas de la tabla de cabecera
  rolls = parseInt(headerTable?.rows[0][3]) ?? 0       // "3" → 3

  // 5. Emitir una Rune por cada fila de la tabla de loot
  por cada row en lootTable.rows:
    emitir Rune {
      name:           row[2],
      monsterName:    monster.name,
      monsterSource:  monster.source,
      carveChance:    row[0],                                    // "1-6" o "-"
      captureChance:  row[1],                                    // "1-4" o "-"
      rolls:          rolls,                                     // mismo valor para carve y capture
      slots:          parsearSlots(row[3]),                      // "(A,W)" → ["A", "W"]
      armorEffect:    armorEffects[row[2]]?.entries.join(" ") ?? null,
      weaponEffect:   weaponEffects[row[2]]?.entries.join(" ") ?? null,
    }
```

#### Notas del mapper

- `armorList` y `weaponList` pueden no existir si todos los materiales del monstruo son de un solo tipo de slot. El mapper debe tolerar la ausencia de cualquiera de las dos listas sin romper.
- Un material con `slots: ["A", "W"]` tendrá entrada en **ambas** listas de efectos, con el mismo nombre pero descripciones distintas.
- Un material con `carveChance: "-"` solo se obtiene por captura, y viceversa.
- Las listas de efectos pueden contener nombres de materiales que **no aparecen en la tabla de loot** (datos huérfanos). Se ignoran — solo se procesan los materiales presentes en `lootTable.rows`.
- El campo `rolls` es un entero único que aplica tanto para las tiradas de carve como de captura (es así en el JSON fuente: `"Carves/Capture": "3"`).

---

#### Atributo `tags`

- **tags** _(string[])_ — Array de etiquetas derivadas **automáticamente** del texto del efecto (`armorEffect` y/o `weaponEffect`). Una runa puede tener múltiples tags. El array puede estar vacío si el texto no coincide con ningún patrón conocido.

Los tags se extraen aplicando las reglas de detección sobre el texto del efecto **antes** de parsear el marcado de 5etools.

##### Taxonomía de tags

Los tags se agrupan en tres categorías. Los prefijos de categoría son parte del valor del tag:

**1. Restricción de clase** (`class:X`)

Se detectan a partir del patrón `{@i (NombreClase only)}` al inicio del texto del efecto. Un efecto puede restringirse a varias clases a la vez (ej. `(Druid, Sorcerer, Warlock, & Wizard only)`) — en ese caso se emite un tag por cada clase listada.

| Tag                 | Detectado cuando el texto contiene   |
| ------------------- | ------------------------------------ |
| `class:spellcaster` | `spellcaster only`                   |
| `class:monk`        | `Monk only`                          |
| `class:druid`       | `Druid` dentro del patrón `only`     |
| `class:sorcerer`    | `Sorcerer` dentro del patrón `only`  |
| `class:warlock`     | `Warlock` dentro del patrón `only`   |
| `class:wizard`      | `Wizard` dentro del patrón `only`    |
| `class:cleric`      | `Cleric` dentro del patrón `only`    |
| `class:paladin`     | `Paladin` dentro del patrón `only`   |
| `class:ranger`      | `Ranger` dentro del patrón `only`    |
| `class:artificer`   | `artificer` dentro del patrón `only` |
| `class:bard`        | `Bard` dentro del patrón `only`      |
| `class:barbarian`   | `Barbarian` dentro del patrón `only` |
| `class:fighter`     | `Fighter` dentro del patrón `only`   |
| `class:rogue`       | `Rogue` dentro del patrón `only`     |

**2. Restricción de tipo de arma** (`weapon-type:X`)

Misma regla que las clases pero con nombres de armas. Patrón: `{@i (TipoArma only)}`.

| Tag                         | Detectado cuando el texto contiene                       |
| --------------------------- | -------------------------------------------------------- |
| `weapon-type:bladed`        | `Bladed Weapon only`                                     |
| `weapon-type:melee`         | `Melee Weapon only`                                      |
| `weapon-type:ranged`        | `Ranged weapon only`                                     |
| `weapon-type:insect-glaive` | `Insect Glaive only`                                     |
| `weapon-type:greatsword`    | `Greatsword` dentro del patrón `only`                    |
| `weapon-type:lance`         | `Lance` dentro del patrón `only`                         |
| `weapon-type:bow`           | `Bow only`                                               |
| `weapon-type:gunlance`      | `Gunlance only`                                          |
| `weapon-type:hammer`        | `Hammer` dentro del patrón `only`                        |
| `weapon-type:charge-blade`  | `Charge blade` o `Charge Blade` dentro del patrón `only` |
| `weapon-type:switchaxe`     | `switchaxe` dentro del patrón `only`                     |

**3. Mecánica del efecto** (`mechanic:X`)

Se detectan buscando palabras clave o marcado de 5etools en el cuerpo del texto del efecto.

| Tag                      | Regla de detección                                                                                                     |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `mechanic:spell`         | Contiene `{@spell`                                                                                                     |
| `mechanic:rune-charges`  | Contiene `rune` seguido de número (ej. `"3 runes"`, `"has 4 runes"`)                                                   |
| `mechanic:critical`      | Contiene la palabra `critical` (case-insensitive)                                                                      |
| `mechanic:extra-damage`  | Contiene `extra {@damage` o `extra \d+d\d+`                                                                            |
| `mechanic:resistance`    | Contiene `resistance to` seguido de tipo de daño                                                                       |
| `mechanic:immunity`      | Contiene `immune to` o `immunity to`                                                                                   |
| `mechanic:bonus-action`  | Contiene `bonus action`                                                                                                |
| `mechanic:reaction`      | Contiene `reaction`                                                                                                    |
| `mechanic:saving-throw`  | Contiene `saving throw` con `advantage` o `disadvantage`                                                               |
| `mechanic:skill-bonus`   | Contiene `{@skill` con un valor de bonus (ej. `+2 bonus on`)                                                           |
| `mechanic:ac`            | Contiene `\bAC\b` o `armor class`                                                                                      |
| `mechanic:condition`     | Contiene `{@condition`                                                                                                 |
| `mechanic:movement`      | Contiene `movement` o `speed` o `jump` en contexto de desplazamiento                                                   |
| `mechanic:advantage`     | Contiene `advantage` (sin ser seguido de `saving throw` — ese ya tiene su tag)                                         |
| `mechanic:healing`       | Contiene `regain` o `restore` seguido de `hit points`                                                                  |
| `mechanic:cantrip`       | Contiene `cantrip`                                                                                                     |
| `mechanic:class-feature` | Contiene el nombre de una feature de clase específica (ej. `wyvernfire`, `dragonpiercer`, `Guard AC`, `Mighty Weapon`) |

##### Notas de implementación de tags

- Las reglas se aplican sobre el texto del efecto **ya concatenado** (`entries.join(" ")`), antes de parsear el marcado de 5etools.
- Un mismo efecto puede activar múltiples reglas simultáneamente. Ejemplo: `"{@i (Spellcaster only)} This weapon has 4 runes. Cast {@spell lightning bolt}"` → `["class:spellcaster", "mechanic:rune-charges", "mechanic:spell"]`.
- Si el texto no coincide con ninguna regla, `tags` es `[]`.
- Las reglas son **case-insensitive** salvo donde se indique lo contrario.

---

### Player (hereda de Actor)

Añade los siguientes campos sobre la base del Actor. Basado en el formato de exportación de Foundry VTT dnd5e system:

#### Identificación del personaje

- **race** — Raza del personaje.
- **background** — Trasfondo (ej. Hunter Initiate).
- **class** — Clase y nivel. En Foundry se almacena como item separado, pero a nivel de resumen:
  - `name` — Nombre de la clase (ej. `"Hunter"`).
  - `level` _(int)_ — Nivel actual (1–20).
  - `subclass` — Subclase elegida (ej. Weapon Style).
- **xp** _(int)_ — Puntos de experiencia acumulados.
- **alignment** — En personajes es un string legible (ej. `"Neutral Good"`), a diferencia del código de monstruos.

#### HP del personaje

A diferencia de los monstruos (que solo tienen `formula` y `average`), los personajes tienen:

- `hp.max` _(int)_ — HP máximo calculado.
- `hp.current` _(int)_ — HP actual.
- `hp.temp` _(int)_ — HP temporales.
- `hp.tempMax` _(int)_ — Incremento temporal al máximo.

#### Estados especiales

- **inspiration** _(boolean)_ — Si el personaje tiene inspiración activa.
- **exhaustion** _(int, 0–6)_ — Nivel de agotamiento actual.
- **deathSaves**
  - `success` _(int, 0–3)_ — Tiradas de muerte exitosas acumuladas.
  - `failure` _(int, 0–3)_ — Tiradas de muerte fallidas acumuladas.

#### Equipo y recursos

- **currency** — Monedas:
  - `pp` _(int)_ — Platinum pieces.
  - `gp` _(int)_ — Gold pieces.
  - `ep` _(int)_ — Electrum pieces.
  - `sp` _(int)_ — Silver pieces.
  - `cp` _(int)_ — Copper pieces.
- **attunement** — Slots de sintonización (máximo generalmente 3).
- **tools** _(array)_ — Herramientas con competencia. Cada entrada: `{ name, ability, value }`.
- **weaponProficiencies** _(array)_ — Armas con competencia.
- **armorProficiencies** _(array)_ — Tipos de armadura con competencia.
- **resources** — Recursos de clase que se recargan (ej. usos de Rage, Ki points):
  - `primary`, `secondary`, `tertiary`: `{ value, max, rechargeOn: "sr" | "lr", label }`.

#### Magia

- **spellcasting** _(string)_ — Atributo usado para el lanzamiento de conjuros (ej. `"wis"`, `"int"`). Vacío si no lanza conjuros.
- **spellSlots** — Slots de conjuros por nivel (1–9) + pacto (`pact`): `{ value, max }`.

#### Características de clase y raza (Features)

A diferencia de los monstruos, los personajes tienen features como items separados (ej. Rage, Second Wind, Hunter Arts):

- **features** _(array)_
  - `name` _(string)_
  - `source` _(string)_ — Origen (clase, raza, trasfondo).
  - `description` _(string)_ — Texto del efecto.
  - `uses` — Si tiene usos limitados: `{ value, max, rechargeOn: "sr" | "lr" }`.

#### Trasfondo y aspecto físico

- **details**
  - `biography` _(string)_ — Historia del personaje.
  - `ideal`, `bond`, `flaw`, `trait` _(strings)_ — Rasgos de personalidad.
  - `age`, `height`, `weight`, `eyes`, `hair`, `skin`, `gender`, `appearance` _(strings)_.

---

## Secciones Pendientes de Concepción

Estado de cobertura del manual / features de la app:

### Amellwind Homebrew — implementado

- [x] **Actor** — Clase base definida.
- [x] **Monster** — Hereda de Actor; listado, stat block, detalle en `/monsters/:id`.
- [x] **Player** — Hereda de Actor, definida con campos de Foundry VTT dnd5e.
- [x] **Rune** — Entidad, mapper, tags, listado, detalle, tier por CR, reglas (`RulesPanel`), planificador (`BuildDrawer` en `/runes`).
- [x] **Species** — Especies y subrazas GTMH con filtros por categoría.
- [x] **Backgrounds** — Trasfondos GTMH con detalle parseado.
- [x] **Feats** — Dotes GTMH con filtros y detalle.
- [x] **Character Guide** — Guía de creación (datos estáticos, pestañas).
- [x] **Monstie Sidekick** — Reglas, progresión, creador interactivo.
- [x] **NPC Generator** — Stat blocks humanoides con species/background/templates.
- [x] **Downtime** — Actividades parseadas de `variantrule[]`.
- [x] **Cooking System** — Datos estáticos, pantalla con pestañas y tiradas.
- [x] **Combo List** — Datos estáticos, pestañas por herramienta, búsqueda global.
- [x] **Armas (Hunter Weapons)** — Listado GTMH, rarezas, optional features, diálogo de detalle.
- [x] **Ítems y tiendas** — Catálogo GTMH + tiendas estáticas + carrito compartido.
- [x] **Recursos de entorno** — Tablas estáticas por categoría.
- [x] **Entornos / biomas** — Datos estáticos con DCs, clima, encuentros y tablas de recursos.
- [x] **Material Effects / Conditions / Diseases** — Listados de referencia derivados del homebrew.
- [x] **Damage Calculator** — Calculadora de daño por turno persistida en `localStorage`.

### Compendio D&D 5e — implementado

- [x] **Spells** — Conjuros desde 5etools con deduplicación y filtros.
- [x] **Classes** — Listado y detalle por variante de fuente.
- [x] **Races / Backgrounds / Feats** — Compendios 5e con dedupe por nombre y variantes por fuente.
- [x] **D&D Items** — Compendio de ítems con carga por fuente (+ catálogo de equipo del builder).
- [x] **Bestiary** — Criaturas oficiales con carga bajo demanda por source book.
- [x] **Xanathar Backstory** — Generador de trasfondo con tablas de XGE.

### En progreso o pendiente

- [~] **Character Builder** — ALPHA: stats, paper doll, runas, DPT, retrato/token y export/import Foundry VTT; inventario ligado al carrito; armaduras placeholder.
- [x] **Export/Import Foundry VTT** — Actor `character` dnd5e v12 con _matching_ contra catálogos de la app.
- [ ] **Armaduras (datos reales)** — Sets completos desde GTMH; hoy el builder usa `armor.placeholder.ts`.
- [ ] **Vista de Combate / Encuentros activos** — Gestión de combate en tiempo real.
- [ ] **Persistencia de personajes (interna)** — Guardar/cargar builds en la propia app (hoy la persistencia es vía export/import Foundry JSON).

---

## Capa de datos: Services y Mappers

### Flujo de datos

Ninguna pantalla consulta IndexedDB directamente. El flujo siempre pasa por dos capas intermedias:

```text
Pantalla (UI)
  → Service  (consulta IndexedDB y devuelve entidades tipadas)
      → Mapper  (transforma el formato crudo de 5etools al esquema de la app)
```

- **Service**: responsable de leer de IndexedDB y devolver datos ya transformados. La UI no sabe nada del formato fuente.
- **Mapper**: función pura que recibe un objeto crudo de 5etools y devuelve una entidad tipada del esquema de la app (`Monster`, `Player`, etc.). Un mapper por entidad.

### Mappers requeridos

| Mapper                    | Entrada (5etools / fuente)                                   | Salida (entidad app)           |
| ------------------------- | ------------------------------------------------------------ | ------------------------------ |
| `MonsterMapper`           | objeto crudo del store `mm_current`                          | `Monster`                      |
| `RuneMapper`              | fluff/inset de cada monstruo en `mm_current`                 | `Rune[]` (uno por material)    |
| `WeaponMapper`            | ítem con `type: "HW"` en `gtmh_current`                      | `Weapon`                       |
| `OptionalFeatureMapper`   | entrada de `optionalfeature[]` en GTMH                       | `OptionalFeature`              |
| `SpeciesMapper`           | `race[]` + `subrace[]` en GTMH                               | `Species`                      |
| `BackgroundMapper`        | `background[]` en GTMH                                       | `Background`                   |
| `FeatMapper`              | `feat[]` en GTMH                                             | `Feat`                         |
| `DowntimeMapper`          | entradas de `variantrule[]` (downtime)                       | `DowntimeActivity[]`           |
| `MonstieClassFeatureMapper` | `classFeature[]` en GTMH                                   | features de Monstie Sidekick   |
| `MaterialEffectMapper`    | efectos de material derivados de `mm_current`                | `MaterialEffect[]`             |
| `ConditionMapper`         | condiciones homebrew en GTMH                                  | `Condition[]`                  |
| `DiseaseMapper`           | enfermedades homebrew en GTMH                                | `Disease[]`                    |
| `SpellMapper`             | JSON de conjuros 5etools                                     | `Spell`                        |
| `ClassMapper`             | JSON de clase 5etools                                        | `Class`                        |
| `DndRaceMapper`           | `race[]` / `subrace[]` 5etools                              | `DndRace`                      |
| `DndBackgroundMapper`     | `background[]` 5etools                                       | `DndBackground`                |
| `DndFeatMapper`           | `feat[]` 5etools                                            | `DndFeat`                      |
| `DndOptionalFeatureMapper`| `optionalfeature[]` 5etools                                 | `OptionalFeature` (sin ruta)   |
| `mapDndBaseItemToWeapon` / `mapDndBaseItemToArmor` | ítems base 5etools (`dnd-items`)          | `Weapon` / `ArmorItem` (equipo builder) |
| _(inline en item.service)_ | ítems GTMH sin filtrar por tipo                                | `MHItem`                       |
| _(bestiary / dnd-items)_  | JSON bestiary/items 5etools                                  | `BestiaryCreature`, `DndItem`  |

> **Nota**: `RuneService.getAllRunes()` cachea el resultado en memoria hasta `clearRuneCache()` (p. ej. tras sync de MM en `App.tsx`). Los compendios 5etools cachean en memoria por servicio hasta recarga de página.

Agregar un mapper nuevo cada vez que se incorpore una entidad al esquema.

### Bootstrap de la aplicación (`App.tsx`)

Al arrancar (`App.tsx`, no `main.tsx`):

1. Se monta `ThemeProvider` y se inicia `syncData()` en un `useEffect`.
2. Mientras sync está activo, `SyncProvider` expone `syncing=true` y `MainLayout` muestra banner “Sincronizando…”.
3. Tras sync: si MM se actualizó → `clearMonsterCache()` + `clearRuneCache()` + `clearMaterialEffectCache()` + `clearConditionCache()` + `clearDiseaseCache()`; si GTMH → `clearSpeciesCache()`, `clearBackgroundCache()`, `clearFeatCache()`, `clearMonstieSidekickCache()` (y demás cachés derivadas de GTMH).
4. Las rutas lazy se montan con `<Suspense fallback={<LoadingScreen />}>`.

Si el sync falla, la app sigue con datos ya presentes en IndexedDB.

### Responsabilidades del Mapper

Cada mapper debe encargarse de:

- Renombrar campos (ej. `str` → `str.value`).
- Calcular campos derivados que no están en el JSON fuente (ej. `modifier = Math.floor((value - 10) / 2)`, `tier` desde `cr`, `passivePerception`).
- Normalizar tipos (ej. `size: ["H"]` → `size: "Huge"`).
- Parsear el marcado de texto de 5etools en las `entries` (ej. `{@hit 13}` → `"+13 to hit"`).
- Proveer valores por defecto para campos opcionales ausentes (ej. `speed.swim ?? 0`).

### Responsabilidades del Service

Cada service debe encargarse de:

- Abrir la conexión a IndexedDB y leer del store correspondiente.
- Invocar al mapper sobre cada objeto leído.
- Exponer métodos de consulta útiles para la UI: `getAll()`, `getById(id)`, `getByGroup(group)`, etc.
- No contener lógica de presentación.

### Factory de servicios y utilidades compartidas

Para evitar boilerplate repetido por feature, gran parte de los services del compendio se construyen con un **factory centralizado** y comparten utilidades transversales:

- **`shared/services/create-entity-service.ts`** — `createEntityService<TRaw, TMapped>(config)` devuelve la superficie estándar `{ getAll, getList, getById, getByName, clearCache }` con caché en módulo, índices por nombre/id, dedupe y promesa _in-flight_ compartida. También exporta el comparador `bySource`.
- **`shared/utils/dedupe-by-name.utils.ts`** — `dedupeByNameWithVariants(items, config)` colapsa múltiples impresiones (por fuente) de una misma entrada en una fila canónica (según `sourcePriority`) agregando `variantSources`, `variantCount` y `searchText`.
- **`shared/utils/fluff.utils.ts`** — `buildFluffIndex`, `attachFluff`, `attachFluffEntries` para fusionar el _fluff_ de 5etools con cada entidad por `name|source`.
- **`shared/constants/dnd/`** — constantes del sistema D&D centralizadas: `abilities.constants.ts` (`ABILITY_KEYS`, `ABILITY_NAMES`, `toAbilityKey`, …) y `skills.constants.ts` (`SKILL_ABILITY`, `SKILL_LABELS`, `SKILL_NAME_TO_KEY`, …).
- **`shared/components/StatBlockSection.tsx`** — sección titulada reutilizable (heading ámbar + regla) compartida por los stat blocks de monstruos y bestiario.

> El catálogo de **equipo del builder** (armas/armaduras D&D) se movió de `builder/services/` a la feature **`dnd-items`** (`dnd-equipment.service.ts` + `mappers/dnd-weapon.mapper.ts`, `dnd-armor.mapper.ts`, `utils/dnd-equipment-rarity.utils.ts`), exponiendo `getDndWeapons`, `getDndWeaponVariantsByName`, `getDndArmors` y `clearDndEquipmentCache`. El import de Foundry consume estos métodos.

---

## Pantallas / Features de la Aplicación

### Listado de Monstruos

**Fuente de datos**: store `mm_current` de IndexedDB (Monster Manual).

#### Tabla

Mostrar todos los monstruos en una tabla con las siguientes columnas:

| Columna         | Campo fuente         | Notas                                          |
| --------------- | -------------------- | ---------------------------------------------- |
| **Name**        | `name`               |                                                |
| **CR**          | `cr`                 | String: puede ser `"1/2"`, `"0"`, `"19"`, etc. |
| **Tier**        | calculado desde `cr` | Ver tabla de cálculo abajo.                    |
| **Type**        | `type.type`          | Capitalizar (`"wyvern"` → `"Wyvern"`).         |
| **Environment** | `environment`        | Array → separado por comas. Vacío si no tiene. |

**Cálculo de Tier** a partir del CR:

| Tier   | Rango de CR          | Valores posibles en el JSON      |
| ------ | -------------------- | -------------------------------- |
| Tier 0 | CR < 1               | `"0"`, `"1/8"`, `"1/4"`, `"1/2"` |
| Tier 1 | CR 1 – 8 (inclusive) | `"1"` … `"8"`                    |
| Tier 2 | CR 9 – 16            | `"9"` … `"16"`                   |
| Tier 3 | CR 17 – 24           | `"17"` … `"24"`                  |
| Tier 4 | CR 25 – 30           | `"25"` … `"30"`                  |

**Implementación del parser de CR:**

El campo `cr` es siempre un `string`. Para calcular el Tier hay que convertirlo a número primero:

```ts
function parseCR(cr: string): number {
  if (cr.includes("/")) {
    const [num, den] = cr.split("/").map(Number);
    return num / den; // "1/2" → 0.5, "1/4" → 0.25
  }
  return Number(cr);
}

function getTier(cr: string): number {
  const value = parseCR(cr);
  if (value < 1) return 0;
  if (value <= 8) return 1;
  if (value <= 16) return 2;
  if (value <= 24) return 3;
  return 4;
}
```

#### Filtros

Cada columna debe ser filtrable de forma independiente:

- **Name**: input de texto libre, filtrado por coincidencia parcial (case-insensitive).
- **CR**: selector de valores únicos presentes en los datos.
- **Tier**: selector múltiple (Tier 0 – Tier 4).
- **Type**: selector de valores únicos presentes en los datos.
- **Environment**: selector de valores únicos (expandiendo los arrays).

#### Detalle del monstruo

Al hacer clic en cualquier fila, se navega a **`/monsters/:monsterId`** (`MonsterDetailPage`) con el stat block completo en formato visual D&D 5e:

- Encabezado: nombre, tamaño, tipo, alineamiento.
- AC, HP (con fórmula), velocidades.
- Tabla de los 6 atributos con sus valores y modificadores calculados.
- Saving throws con competencia.
- Skills con competencia.
- Resistencias, inmunidades y vulnerabilidades a daño.
- Inmunidades a condiciones.
- Sentidos y passive Perception.
- Idiomas y CR.
- Traits (rasgos pasivos), Actions, Reactions y Legendary Actions, cada uno en su sección.
- Tabla de loot (carve/capture) si el monstruo la tiene.

### Listado de Runas

**Fuente de datos**: store `mm_current` de IndexedDB, procesado con `RuneMapper` (genera un `Rune[]` iterando todos los monstruos).

#### Columnas de la tabla

Mostrar todos los materiales de todos los monstruos en una tabla con las siguientes columnas:

| Columna     | Campo fuente    | Notas                                                                    |
| ----------- | --------------- | ------------------------------------------------------------------------ |
| **Name**    | `name`          |                                                                          |
| **Monster** | `monsterName`   | Nombre del monstruo de origen.                                           |
| **Slots**   | `slots`         | Mostrar como badges: `A` (Armor) y/o `W` (Weapon).                       |
| **Carve**   | `carveChance`   | Mostrar `—` si el valor es `"-"`.                                        |
| **Capture** | `captureChance` | Mostrar `—` si el valor es `"-"`.                                        |
| **Tags**    | `tags`          | Mostrar los primeros 2–3 tags como badges. El resto se ve en el detalle. |

#### Filtros disponibles

Cada columna debe ser filtrable de forma independiente:

- **Name**: input de texto libre, filtrado por coincidencia parcial (case-insensitive).
- **Monster**: selector de valores únicos presentes en los datos (lista de nombres de monstruos).
- **Slots**: selector múltiple con opciones `Armor` y `Weapon`.
- **Tags**: selector múltiple con todos los valores únicos de tags presentes en los datos, agrupados por categoría (`class:`, `weapon-type:`, `mechanic:`).
- **Tier**: selector por tier de material (1–4), alineado con el CR del monstruo de origen.
- **Obtención**: selector con opciones `Carveable`, `Capturable`, `Ambas` (para filtrar si `carveChance` o `captureChance` no es `"-"`).

La pantalla incluye **paginación** configurable, panel colapsable **`RulesPanel`** con las reglas oficiales de materiales en armadura, arma y trinkets, e integración con **`RuneBuildContext`**: las runas ya colocadas en el planificador se resaltan en la tabla y se pueden añadir desde el detalle.

#### Detalle de la Runa (dialog)

Al hacer clic en cualquier fila, se abre un **dialog** con la información completa del material.

##### Encabezado del dialog

- Nombre del material.
- Nombre del monstruo de origen (con link o referencia al detalle del monstruo si aplica).
- Badges de slots (`Armor`, `Weapon`).

##### Obtención

- Fila: `Carve` — chance en dado d20 (ej. `1–6`) o `No carveable`.
- Fila: `Capture` — chance en dado d20 o `No capturable`.

##### Efectos del material

- Si `slots` incluye `"A"`: sección **Armor Effect** con el texto del efecto parseado (sin marcado de 5etools).
- Si `slots` incluye `"W"`: sección **Weapon Effect** con el texto del efecto parseado.
- Si el material tiene ambos slots, mostrar ambas secciones separadas.

##### Tags del material

- Lista completa de todos los tags, agrupados por categoría.
- Cada tag se muestra como un badge con color diferente según su categoría: clase (azul), tipo de arma (naranja), mecánica (verde).

### Material Effects, Conditions y Diseases

Tres listados de referencia derivados del homebrew Amellwind, con caché en memoria invalidada tras sync de MM/GTMH:

| Feature           | Ruta                | Fuente / servicio                          | Contenido |
| ----------------- | ------------------- | ------------------------------------------ | --------- |
| Material Effects  | `/material-effects` | `material-effect.service.ts` (`MaterialEffectList`) | Efectos de materiales de monstruo (slots armadura/arma) consultables sin pasar por la tabla de runas |
| Conditions        | `/conditions`       | `condition.service.ts` (`ConditionList`)   | Condiciones del manual con texto parseado |
| Diseases          | `/diseases`         | `disease.service.ts` (`DiseaseList`)       | Enfermedades del manual con texto parseado |

Sus cachés se limpian en el bootstrap (`clearMaterialEffectCache`, `clearConditionCache`, `clearDiseaseCache`).

### Cooking System (Artisan Cooking)

**Ruta**: `/cooking`
**Fuente de datos**: datos estáticos embebidos en la app (`cooking.data.ts`). No requiere IndexedDB.

El sistema de cocina artesana permite al DM y a los jugadores gestionar las comidas que otorgan boons a la party durante una cacería. Está modelado sobre las reglas de cocina de la Guía de Caza de Amellwind.

#### Estructura de datos

##### Tipos principales

- **`CookingRank`** — `1 | 2 | 3 | 4`. Los rangos de comida disponibles.
- **`Meal`** — Representa una comida individual:
  - `rank` _(CookingRank)_ — Rango al que pertenece.
  - `name` _(string)_ — Nombre de la comida (ej. `"Wild Bacon"`).
  - `dc` _(number)_ — DC mínimo de la tirada de cocina para preparar el plato.
  - `boon` _(string)_ — Efecto/beneficio que otorga al comerla.
- **`MealTable`** — Tabla de comidas de un rango:
  - `rank` _(CookingRank)_
  - `caption` _(string)_
  - `footnote` _(string)_ — Nota sobre el incremento del DC por más de 4 raciones.
  - `levelRequirement` _(string)_ — Nivel mínimo del personaje (ej. `"5th level"`).
  - `meals` _(Meal[])_
- **`DailySkill`** — Habilidad felyne del día:
  - `index` _(number, 1–25)_ — Resultado en el dado.
  - `name` _(string)_ — Nombre de la habilidad felyne (ej. `"Felyne Sprinter"`).
  - `effect` _(string)_ — Descripción del efecto.
- **`CookingRule`** — Regla de pasos para cocinar:
  - `name` _(string)_
  - `content` _(string[])_

##### Tablas de comidas

| Rango  | DC base | Nivel requerido | Costo por ración | # de platos |
| ------ | ------- | --------------- | ---------------- | ----------- |
| Rank 1 | 10      | Cualquier nivel | 1 sp             | 18          |
| Rank 2 | 13      | 5to nivel       | 1 gp             | 18          |
| Rank 3 | 14      | 10mo nivel      | 5 gp             | 18          |
| Rank 4 | 16      | 15to nivel      | 10 gp            | 16          |

> El DC se incrementa por cada ración adicional sobre 4 (Rank 1: +1; Ranks 2–4: +2).

##### Daily Skills

25 habilidades felyne (índices 1–25). Se obtienen tirando `1d20 + 1d6 − 1`. Si el resultado no especifica duración, el efecto dura 24 horas, hasta terminar un descanso largo, o hasta comer otra comida.

#### Reglas del sistema de cocina (Steps)

1. **Step 1** — Decidir la receta y conseguir los ingredientes. Los ingredientes básicos son fáciles de obtener (menos de 1 sp para 4 personas).
2. **Step 2** — Elegir 3 pasos del proceso culinario (decidir receta, recolectar, preparar ingredientes, cocinar, emplatar) y asignar un ability score diferente a cada uno. Luego hacer las 3 tiradas de ability check. Quien tenga competencia con cooking utensils puede añadir el proficiency bonus a una de las tres tiradas.
3. **Step 3** — Promediar las 3 tiradas y comparar con el DC de la comida:
   - **Éxito**: cuenta como ración del día y otorga el boon.
   - **Éxito por 4+**: tirar una vez en la tabla de Daily Skills.
   - **Éxito por 8+**: tirar dos veces en la tabla de Daily Skills.
   - **Fallo**: comida insípida, cuenta como ración pero sin boon.
   - **Fallo por 5+**: no cuenta como ración; quienes la comen hacen una tirada de Constitución (DC = DC de la comida) o quedan envenenados 1 hora.

#### Pantalla (`CookingPage`)

La pantalla tiene un sistema de pestañas:

| Pestaña      | Contenido                                                                                    |
| ------------ | -------------------------------------------------------------------------------------------- |
| How to Cook  | Tarjetas con las reglas de los 3 pasos + cuadro de resumen de rangos (clickeable).           |
| Rank 1–4     | Panel con nombre, requisito de nivel, costo, nota al pie + tabla de comidas + botón de roll. |
| Daily Skills | Panel explicativo + tabla con las 25 habilidades felyne + botón de roll `1d20 + 1d6 − 1`.    |

- **Botón "Roll Random Meal"**: elige una comida al azar del rango activo. Resalta la fila correspondiente en la tabla y muestra una tarjeta de resultado con el nombre, DC, boon y el número obtenido.
- **Botón "Roll 1d20 + 1d6 − 1"**: calcula un resultado entre 1 y 25, resalta la habilidad en la tabla y muestra una tarjeta de resultado con los dados individuales y el total.
- Cada rango tiene color propio: azul (Rank 1), verde (Rank 2), naranja (Rank 3), rojo (Rank 4).

#### Service (`cooking.service.ts`)

| Función                    | Descripción                                                                         |
| -------------------------- | ----------------------------------------------------------------------------------- |
| `getAllMealTables()`       | Devuelve todas las tablas de comidas (`MealTable[]`).                               |
| `getMealTableByRank(rank)` | Devuelve la tabla de un rango concreto.                                             |
| `getAllMeals()`            | Devuelve todas las comidas de todos los rangos (`Meal[]`).                          |
| `getMealsByRank(rank)`     | Devuelve las comidas de un rango específico.                                        |
| `getAllDailySkills()`      | Devuelve las 25 habilidades felyne del día.                                         |
| `rollRandomMeal(rank)`     | Elige aleatoriamente una comida del rango dado. Devuelve `{ meal, roll }`.          |
| `rollDailySkill()`         | Tira `1d20 + 1d6 − 1` y devuelve la skill correspondiente + los dados individuales. |

---

### Combo List

**Ruta**: `/combo`
**Fuente de datos**: datos estáticos embebidos en la app (`combo.data.ts`). No requiere IndexedDB.

El Combo List es un sistema de crafteo de objetos (pociones, munición, trampas, etc.) típico del universo Monster Hunter. Cada receta indica dos ingredientes a combinar, la herramienta necesaria, el DC de la tirada de crafteo y la cantidad producida.

#### Estructura de datos

##### Tipos principales

- **`ComboRow`** — Fila de receta:
  - `category` _(string)_ — Subcategoría visual dentro de la tabla (ej. `"HEALING"`, `"BUFFS"`, `"TRAPS"`). Puede ser vacío.
  - `name` _(string)_ — Nombre del objeto resultante.
  - `item1` _(string)_ — Primer ingrediente.
  - `item2` _(string | undefined)_ — Segundo ingrediente (opcional; se muestra `—` si no aplica).
  - `dc` _(string | undefined)_ — DC de la tirada de crafteo.
  - `quantity` _(string | undefined)_ — Cantidad producida (ej. `"1"`, `"1d4"`, `"--"`).
- **`ComboToolTable`** — Tabla de recetas de una herramienta:
  - `id` _(string)_ — Identificador interno (ej. `"alchemist"`, `"cook"`, `"smith"`).
  - `toolName` _(string)_ — Nombre legible de la herramienta (ej. `"Alchemist's Supplies"`).
  - `hasCategory` _(boolean)_ — Si la tabla muestra la columna de categoría.
  - `rows` _(ComboRow[])_
- **`ComboRuleSection`** — Sección de reglas:
  - `name` _(string)_
  - `content` _(string[])_
  - `isInset` _(boolean | undefined)_ — Si es verdadero, se renderiza como un bloque destacado (Combo Books).

##### Herramientas disponibles

| ID            | Herramienta          | Tiene categorías |
| ------------- | -------------------- | ---------------- |
| `alchemist`   | Alchemist's Supplies | Sí               |
| `brewer`      | Brewer's Supplies    | No               |
| `cook`        | Cook's Utensils      | No               |
| `glassblower` | Glassblower's Tools  | Sí               |
| `herbalism`   | Herbalism Kit        | No               |
| `poisoner`    | Poisoner's Kit       | No               |
| `smith`       | Smith's Tools        | Sí               |
| `tinker`      | Tinker's Tools       | No               |
| `woodcarver`  | Woodcarver's Tools   | Sí               |

##### Categorías de objetos

Las categorías se usan para agrupar visualmente las filas dentro de una tabla. Cada categoría tiene un color badge propio:

| Categoría              | Color    |
| ---------------------- | -------- |
| HEALING                | verde    |
| BUFFS                  | azul     |
| COATINGS               | morado   |
| DR AMMO / Bowgun Ammo  | naranja  |
| Light Bowgun only ammo | amarillo |
| Heavy Bowgun only ammo | rojo     |
| HORNS                  | teal     |
| BOMBS                  | ámbar    |
| BARREL BOMBS           | rojo     |
| TRAPS                  | cyan     |
| LURES                  | sky      |

#### Reglas del Combo List

- **Cualquier PC** puede craftear cualquier objeto del Combo List siempre que tenga la herramienta requerida. No necesita tener competencia con ella.
- **Proceso**: el jugador declara el objeto que desea fabricar, presenta la herramienta y los ingredientes, y hace una **tirada de crafteo**: `1d20 + modificador de ability score + proficiency bonus` (si es competente con la herramienta).
- **Resultado de la tirada**:
  - **Éxito**: los ingredientes se consumen y el objeto es creado.
  - **Fallo por 5 o menos**: solo 1 ingrediente (a elección del jugador) se consume.
  - **Fallo por 6 o más**: ambos ingredientes se consumen.
- **Ability score**: no está ligado a una herramienta específica. El jugador puede argumentar al DM qué atributo usar. Si hay duda, tanto Wisdom (experiencia/talento natural) como Intelligence (conocimiento/seguir instrucciones) son opciones válidas.
- **Combo Books**: 5 volúmenes de una colección antigua. Mientras el cazador los posea, gana +1 a las tiradas de crafteo acumulativo por cada volumen distinto (máximo +5 con los 5 tomos).

#### Pantalla (`ComboPage`)

La pantalla tiene dos modos de funcionamiento:

**Modo normal (sin búsqueda activa)**:

- Pestañas: una pestaña "Reglas" + una pestaña por cada herramienta disponible.
- **Tab Reglas**: tarjetas con las 3 secciones de reglas + bloque destacado de Combo Books + panel de resumen de herramientas disponibles (clickeable para ir directamente a esa herramienta).
- **Tab de herramienta**: muestra encabezado con nombre de la herramienta y número de recetas, un buscador local para filtrar dentro de la tabla, y la tabla de recetas (columnas: categoría si aplica, objeto, ingrediente 1, ingrediente 2, DC, cantidad).

**Modo búsqueda (cuando el usuario escribe en el buscador global)**:

- Las pestañas se ocultan y se muestra un panel de resultados agrupados por herramienta.
- Muestra el número total de resultados y en cuántas herramientas se encontraron.
- Cada grupo tiene su encabezado con el nombre de la herramienta y el número de resultados dentro de ese grupo.
- Un botón `×` limpia la búsqueda y vuelve al modo normal.

La búsqueda global filtra simultáneamente por nombre del objeto, ingredientes y categoría (case-insensitive).

#### Service (`combo.service.ts`)

| Función                     | Descripción                                                                                |
| --------------------------- | ------------------------------------------------------------------------------------------ |
| `getAllComboTables()`       | Devuelve todas las tablas de herramientas (`ComboToolTable[]`).                            |
| `searchAllComboRows(query)` | Busca en todas las tablas por nombre, ingredientes o categoría. Devuelve `SearchResult[]`. |
| `filterRows(rows, query)`   | Filtra las filas de una tabla concreta por nombre, ingredientes o categoría.               |

`SearchResult` tiene la forma `{ toolId, toolName, row }`.

---

### Hunter Weapons (Armas)

**Ruta**: `/weapons`
**Fuente de datos**: store `gtmh_current` → ítems con `type === "HW"` → `WeaponMapper`.

Las 14 armas de Monster Hunter del manual GTMH. Cada arma escala de **Common** a **Legendary** mediante una tabla de rarezas embebida en un bloque `inset` dentro de `entries[]`.

#### Entidad `Weapon`

| Campo              | Descripción |
| ------------------ | ----------- |
| `name`, `source`, `page` | Identificación 5etools |
| `dmg1`, `dmg2`     | Notación de daño (ej. `1d8`, `2d6` en modo versatile) |
| `dmgType`          | `S` / `P` / `B` (Slashing, Piercing, Bludgeoning) |
| `properties`       | Códigos MH/D&D: `H`, `2H`, `F`, `L`, `R`, `V`, `A`, `S`, `T`, `MHL` |
| `weight`, `valueCp`| Peso y valor en copper pieces |
| `acBonus`, `range`, `isFocus` | Campos opcionales según el arma |
| `description`      | Texto superior parseado sin marcado 5etools |
| `rarityRows`       | Filas de la tabla inset: rareza, slots de runa, columnas dinámicas (stats, features, ammo, phials, etc.) |
| `baseFeatureNames` | Nombres de `{@optfeature ...}` en la descripción (features que aplican a todas las rarezas) |

`FEATURE_COL_KEYS` identifica columnas de tipo feature: `features`, `single features`, `splint features`, `notes`, `ammo`, `coatings`, `phials`, `available`.

#### Entidad `OptionalFeature`

Features opcionales de armas (Melody, Phials, etc.) almacenadas en `gtmh_current` / clave `optfeatures`:

- `name`, `source`, `page`, `featureType[]`
- `weaponName` — arma base parseada del prerequisite
- `prerequisiteRarity` — rareza mínima si aplica
- `paragraphs[]` — texto listo para UI

`optionalfeature.service.ts` expone un `Map` por nombre (lowercase) para resolver features en el diálogo de arma.

#### Pantalla (`WeaponList`)

- Grid de **`WeaponCard`** con color por tipo de daño.
- Filtros: búsqueda por nombre, tipo de daño, propiedad.
- **`WeaponDialog`**: carousel de rarezas, stats por tier, lista de features con tooltips/resolución de optional features.

#### Service (`weapon.service.ts`)

| Función           | Descripción |
| ----------------- | ----------- |
| `getAllWeapons()` | Filtra `HW`, mapea y cachea en memoria |
| `clearWeaponCache()` | Invalida caché tras sync |

---

### Ítems y Tiendas

**Rutas**: `/items` (catálogo), `/shops` (tiendas)
**Fuentes**: ítems desde `gtmh_current` (GTMH); tiendas desde `shops.data.ts` (estático).

#### Entidad `MHItem`

Ítems generales del manual (pociones, munición, phials, coatings, gear, etc.):

- `name`, `source`, `type`, `typeLabel` (mapeo de códigos: `HW`, `MHPSA`, `MHCB`, `P`, `G`, …)
- `rarity`, `valueCp`, `weight`, `page`, `entries[]`

#### Entidad `Shop` / `ShopEntry`

Tiendas definidas estáticamente con secciones, entradas (nombre, costo, peso, categoría, `craftOnly`, `extra`).

#### Contexto `CartContext`

Estado global del carrito (`CartEntry[]`): nombre, costo, peso, cantidad, tienda de origen. Compartido entre **ItemList** y **ShopList**.

#### Pantallas

- **`ItemList`**: tabla filtrable de todos los ítems GTMH, panel lateral de detalle, añadir al carrito.
- **`ShopList`**: pestañas por tienda, búsqueda global, tooltips con descripción cruzada desde el catálogo de ítems, añadir al carrito.
- **`CartDrawer`**: drawer del carrito accesible desde ambas pantallas.

#### Service (`item.service.ts`)

| Función              | Descripción |
| -------------------- | ----------- |
| `getAllItems()`      | Mapea todo el array GTMH a `MHItem[]` |
| `formatValueGp()`    | Formatea `valueCp` a gp legible |

---

### Recursos de entorno (Resources)

**Ruta**: `/resources`
**Fuente de datos**: `resource.data.ts` (estático).

Recursos recolectables en cacería (plantas, hongos, minerales, peces, insectos, bonepiles).

#### Entidad `Resource`

- `name`, `category` (`Bonepiles` | `Fish` | `Insects` | `Minerals` | `Mushrooms` | `Plants`)
- `rarity` (Common → Legendary)
- `details`, `sellValue`, `isCraftingMaterial`

#### Pantalla (`ResourcePage`)

- Pestañas por categoría con iconos.
- Búsqueda global que agrupa resultados por categoría.
- Filtro por rareza.
- Diálogo de detalle con badges de rareza y material de crafteo.

#### Service (`resource.service.ts`)

| Función                 | Descripción |
| ----------------------- | ----------- |
| `getAllResourceTables()`| Tablas por categoría con footnotes |
| `searchResources(query)`| Búsqueda cross-categoría |

---

### Entornos (Environments)

**Ruta**: `/environments`
**Fuente de datos**: `environment.data.ts` (estático).

Biomas del sistema de cacería con reglas de exploración, clima y tablas por nivel de party.

#### Entidad `Environment`

| Campo | Descripción |
| ----- | ----------- |
| `name`, `biome` | Identificación y tipo |
| `navigationDC`, `encounterDC`, `investigationDC` | DCs de exploración |
| `totalResources` | Recursos disponibles en el bioma |
| `commonWeather` | Clima habitual |
| `specialRules[]` | Reglas especiales (`name` + `description`) |
| `weatherTable[]` | Tabla opcional de clima (roll + resultado) |
| `levelTiers[]` | Por rango de nivel: monstruos comunes, tabla de recursos (`ResourceColumn` + `ResourceRow`), tabla de encuentros (`EncounterRow`) |

`ENVIRONMENT_COLORS` asigna paleta visual por nombre de entorno (Ancestral Steppes, Jungle, Volcano, etc.).

#### Pantalla

- **`EnvironmentList`**: tarjetas/grid filtrable por búsqueda.
- **`EnvironmentDetailDialog`**: DCs, reglas, clima, tablas por tier de nivel.

---

### Planificador de runas (`BuildDrawer`)

**Ubicación**: montado en **`RuneList`** (`/runes`), no en `MainLayout`.
**Estado**: `RuneBuildProvider` envuelve `/runes` y `/builder`.

Permite simular un set de equipo con materiales de monstruo **sin** depender del Character Builder.

#### Slots y rareza de equipo

| Slot      | Runas según rareza del equipo |
| --------- | ----------------------------- |
| Weapon    | 1–5 slots (Common → Legendary) |
| Armor     | 1–5 slots |
| Trinket 1 | 1 runa (material de arma o armadura) |
| Trinket 2 | 1 runa |

`RARITY_SLOTS`: common=1, uncommon=2, rare=3, very rare=4, legendary=5.

#### Validación (`build.validation.ts`)

Grupos de tags **mutuamente excluyentes** al colocar materiales:

- **Armadura**: resistencia/inmunidad elemental, bonus AC, efectos de runa-charges.
- **Arma**: críticos en 20, daño extra/on-hit, runa-charges.

`wouldViolateRule()` se usa antes de asignar una runa; el drawer muestra alertas con los materiales en conflicto.

#### UI

Drawer lateral colapsable: selectores de rareza, filas de slots, resumen de efectos parseados, botón limpiar build. Desde **RuneList** / **RuneDetailDialog** se pueden añadir runas al planificador.

---

### Character Builder (ALPHA)

**Ruta**: `/builder`
**Estado**: `CharacterBuilderProvider` (local a la página) + `RuneBuildProvider` (runas) + `BuilderInventoryProvider` (global en MainLayout).

Herramienta experimental para equipar armas/armadura/runas y estimar **daño por turno (DPT)**.

#### Layout (`BuilderPage`)

Grid de tres columnas en desktop:

| Columna | Componentes |
| ------- | ----------- |
| Izquierda | `StatsPanel`, `BuilderImagePanel`, `BuilderSavingThrowsPanel`, `BuilderSkillChecksPanel` |
| Centro | `BuilderCenterPanel` (paper doll, equipamiento + biblioteca) |
| Derecha | `BuilderDerivedPanel`, `BuilderDamagePanel`, `BuilderInventoryPanel`, `BuilderOtherProficienciesPanel`, `BuilderLanguagesPanel`, `BuilderDefensesPanel` |

Encima del grid: `CharacterCreationTipsPanel` con consejos de creación.

#### Inventario del builder (`BuilderInventoryContext`)

- **Fuente de verdad**: líneas del **`CartContext`** (ítems comprados/añadidos en Shops/Items).
- Resuelve nombres del carrito a `Weapon[]` y `ArmorItem[]` vía `cart-equipment.resolver`.
- Badge en Sidebar = `totalItems` del carrito (no un inventario separado de armas).
- Armaduras no GTMH: lista inicial desde `armor.placeholder.ts`.

#### Modelo `Character` (`builder/models/Character.ts`)

- Nivel 1–20, ability scores, proficiency bonus calculado.
- Modificadores derivados, AC base, iniciativa, ataques por turno (con override manual).

#### Equipo (`character.types.ts`)

| Tipo | Campos clave |
| ---- | ------------ |
| `EquippedWeapon` | `weapon`, `rarity`, `runeSlots`, `runes[]`, `useVersatile` |
| `EquippedArmor` | `armor`, `runes[]` |
| `EquippedTrinket` | `name`, `rune` |
| `ArmorItem` | placeholder hasta datos GTMH reales |

Slots: `mainHand`, `offHand`, `armor`, `trinket1`, `trinket2`.

Reglas de manos: armas `2H` bloquean off-hand; armas `V` (versatile) permiten modo a una o dos manos.

#### Componentes

| Componente | Rol |
| ---------- | --- |
| `StatsPanel` / `AbilityScoresSection` | Nivel, ability scores, AC, iniciativa, ataques/turno; botones de export/import Foundry |
| `BuilderImagePanel` | Sube retrato y token (base64 data URL) que alimentan el export de Foundry |
| `BuilderSavingThrowsPanel` / `BuilderSkillChecksPanel` | Saving throws y skills con competencia/expertise |
| `BuilderDerivedPanel` | Stats derivados (proficiency, modifiers, etc.) |
| `BuilderCenterPanel` / `PaperDoll` | Silueta con slots, paneles de detalle de arma/armadura |
| `BuilderItemLibraryPanel` | Biblioteca de equipo desde carrito |
| `BuilderDamagePanel` | Desglose DPT, críticos, fuentes de daño |
| `BuilderInventoryPanel` | Inventario derivado del carrito (overflow de equipo) |
| `BuilderOtherProficienciesPanel` / `BuilderLanguagesPanel` / `BuilderDefensesPanel` | Competencias varias, idiomas, resistencias/inmunidades |
| `RuneAssignmentPanel` | Asignar/quitar runas por slot con validación |

#### Resolución de especie y dotes

- **`useResolvedSpecies` / `resolveSpeciesParts`** — resuelven la especie seleccionada contra los catálogos de species MH y razas D&D (con subraza opcional), con precedencia `mhSpecies ?? dndRace`, y exponen nombre de display y traits fusionados.
- **`useActiveResolvedFeats`** — resuelve las dotes activas no-ASI (origin feats de especie/trasfondo + slots elegidos) a objetos `Feat` completos; fuente única para los hooks derivados de HP/velocidad.

#### Export / Import a Foundry VTT

El builder puede **exportar** el personaje a un actor `character` de **Foundry VTT (sistema dnd5e v12)** e **importar** de vuelta un JSON de actor. Botones en el `StatsPanel`.

- **Export** (`foundry-export/`, hook `useFoundryExport`): `buildFoundryActor(input)` ensambla el bloque `system` (abilities, skills, tools, traits, attributes, details, conjuros/slots, currency) más `items[]` y `prototypeToken`. Sub-builders por pieza (`item.builders.ts`: clase, subclase, raza, trasfondo, dotes, armas, armadura, trinkets, loot, conjuros), `advancement.builders.ts` (HP, item grants, scale values, size, traits), `effect.builders.ts` (active effects), `foundry-id.utils.ts` (IDs/stats/token) y `mappings.ts` (label→clave Foundry). `downloadFoundryActor` descarga el JSON con nombre `Name_Class_LevelN.json` e incluye retrato/token base64.
- **Import** (`foundry-import/`, hook `useFoundryImport`): `parseFoundryActor(raw)` valida `type === "character"`, recorre `items[]` y extrae clase/subclase/raza/trasfondo, dotes, conjuros, armas, armadura/escudos, trinkets y loot, además de abilities, tamaño, alineamiento, nivel y biografía. `applyParsed` resetea el build y hace _matching_ contra los catálogos de la app (`getClassesByName`, `getAllDndRaces`, `getListDndBackgrounds`, `getDndFeatsByName`, `getSpellsByName`, `getDndWeapons`/`getDndArmors` + homebrew Amellwind), equipa hasta dos armas/trinkets y una armadura (resto al inventario) y devuelve un resumen `{ matched, unmatched }`.

#### Cálculo de combate (`combat.calculator.ts`)

Produce `CombatCalculation` con `DamageBreakdown` por mano:

- Parseo de dados del arma (`dmg1` / `dmg2` versatile).
- Modificador de atributo (STR/DEX según propiedades).
- Dados extra extraídos de `weaponEffect` de runas (`+NdM` en el texto).
- `critRange` y `critRunes` (expansión permanente o Critical Draw condicional).
- `totalDPT` = suma main + off × ataques por turno.

Reutiliza `wouldViolateRule` al asignar runas en el builder.

---

### Damage Calculator

**Ruta**: `/damage-calculator`
**Estado**: persistido en `localStorage` (`"damage-calculator-state"`).

Calculadora independiente del builder para estimar el **daño esperado por turno** comparando varias builds de armas (ataques extra, dados de bonificación, críticos y efectos con tirada de salvación).

- **Componentes**: `DamageCalculatorPage` con paneles `WeaponList`, `AttacksPanel`, `WeaponSettingsPanel`, `DiceEditor`.
- **Hook**: `useDamageCalculator` (CRUD de armas/ataques/grupos de dados/bonos planos + normalización de estado legacy).
- **Matemática** (`utils/damage-math.utils.ts`): `calcWeaponDamage`, `calcHitChance`, `calcCritChance`, `calcSaveSuccessChance`, `calcTurnHitChance`, medias de dados y `ALL_DAMAGE_TYPES`.
- **Tipos** (`types/damage-calculator.types.ts`): `WeaponSetup`, `AttackDamageConfig`, `DiceGroup`, `FlatBonus`, `RollMode`, `AttackResolution`, `DamageCalculatorState`.

---

### Species, Backgrounds y Feats

**Rutas**: `/species`, `/backgrounds`, `/feats`
**Fuente**: claves `race`, `subrace`, `background`, `feat` en `gtmh_current` (sync o lazy-fetch).

- **Species**: grid de tarjetas con filtros por categoría (ancestry, folk, elder-dragon, subrace, lineage) y modo Roots/Subraces. Detalle en dialog.
- **Backgrounds**: listado con búsqueda y detalle parseado (traits, features, equipment).
- **Feats**: listado filtrable con detalle y referencias cruzadas parseadas.

Servicios: `species.service.ts`, `background.service.ts`, `feat.service.ts` con caché en memoria invalidada tras sync GTMH.

---

### Character Guide

**Ruta**: `/character-guide`
**Fuente**: `character-guide.data.ts` (estático).

Pestañas: Creating a Character, Higher Level, Skills, Hunt Roles. Renderiza secciones, tablas (`GuideTable`) e insets del manual para orientar la creación de personajes MH.

---

### Monstie Sidekick

**Ruta**: `/monstie-sidekick`
**Fuente**: `classFeature[]` y reglas en `variantrule[]` (GTMH).

Pestañas **Rules** (progresión, class features) y **Monstie Creator** (contexto interactivo para armar un sidekick). Servicio: `monstie-sidekick.service.ts`.

---

### NPC Generator

**Ruta**: `/npc-generator`
**Fuente**: plantillas estáticas (`npc-templates.data.ts`, `npc-power-scaling.data.ts`) + species/backgrounds GTMH.

Genera stat blocks humanoides combinando especie MH, trasfondo de gremio y template de combate escalado por hit dice. Estado en `NpcCreatorContext`.

---

### Downtime

**Ruta**: `/downtime`
**Fuente**: entradas de downtime en `variantrule[]` (GTMH) vía `downtime.mapper.ts`.

Listado lateral de actividades con contenido parseado (pasos, tablas, reglas). Servicio: `downtime.service.ts`.

---

### Compendio D&D 5e (Spells, Classes, Races, Backgrounds, Feats, Items, Bestiary)

Features de referencia oficial, separadas del homebrew Amellwind en el Sidebar. Varias se construyen con `createEntityService` y comparten `dedupeByNameWithVariants` + `attachFluff`.

| Feature        | Ruta               | Fuente                          | Notas |
| -------------- | ------------------ | ------------------------------- | ----- |
| Spells         | `/spells`          | `SPELLS_BASE_URL` + lookup JSON | Dedupe por nombre; filtros clase/nivel/fuente |
| Classes        | `/classes`         | `CLASSES_BASE_URL` + index      | Detalle en `/classes/:classId`; switcher de fuente |
| Races          | `/dnd-races`       | `race`/`subrace` 5etools        | Dedupe por nombre con variantes por fuente (2014/2024) |
| Backgrounds    | `/dnd-backgrounds` | `background` 5etools            | Dedupe por nombre con variantes |
| Feats          | `/dnd-feats`       | `feat` 5etools                  | Dedupe por nombre con variantes |
| D&D Items      | `/dnd-items`       | items.json + variants           | Carga por source book; toolbar TanStack Table; expone catálogo de equipo del builder |
| Bestiary       | `/bestiary`        | `BESTIARY_BASE_URL`             | Precarga MM/VGM/MPMM/XMM; resto bajo demanda |

Fetch centralizado en `shared/data/fivetools-fetch.ts` con soporte `VITE_5ETOOLS_DATA=local`. Nombres de libros vía `book-source.service.ts` y hook `useBookSourceNames`.

---

### Xanathar Backstory

**Ruta**: `/xanathar-backstory`

Generador de trasfondo de personaje basado en las tablas aleatorias de _Xanathar's Guide to Everything_ (origen, familia, eventos de vida, etc.). Herramienta de personaje del bloque DnD 5e. Componente `XanatharBackstoryPage`.

---

## Estructura del proyecto

Organización por **features** bajo `src/features/` y código compartido en `src/shared/`:

```text
src/
├── App.tsx                 # Router lazy, sync al arrancar, ThemeProvider, SyncProvider
├── main.tsx                # Punto de entrada React (sin sync)
├── components/
│   ├── layout/             # MainLayout, Sidebar, LoadingScreen, NotFound, ThemeSelector
│   ├── data-table/         # Tabla reutilizable (TanStack Table)
│   └── ui/                 # shadcn: button, dialog, input, badge, …
├── features/
│   ├── builder/            # Character Builder ALPHA (+ foundry-export/, foundry-import/)
│   ├── damage-calculator/  # Calculadora de daño por turno (localStorage)
│   ├── monsters/           # Listado + MonsterDetailPage
│   ├── runes/              # Materiales + BuildDrawer + RuneBuildContext
│   ├── material-effects/   # Efectos de materiales (armadura/arma)
│   ├── conditions/         # Condiciones Amellwind
│   ├── diseases/           # Enfermedades Amellwind
│   ├── weapons/            # Hunter Weapons + optional features
│   ├── shops/              # Items, Shops, CartContext
│   ├── species/            # Especies GTMH
│   ├── backgrounds/        # Trasfondos GTMH
│   ├── feats/              # Feats GTMH
│   ├── character-guide/    # Guía de creación (estático)
│   ├── monstie-sidekick/   # Sidekicks Monstie
│   ├── npc-generator/      # Generador de NPCs
│   ├── downtime/           # Actividades de downtime
│   ├── cooking/            # Cocina artesana
│   ├── combo/              # Combo List
│   ├── resources/          # Recursos de campo
│   ├── environments/       # Biomas
│   ├── spells/             # Conjuros 5e
│   ├── classes/            # Clases 5e
│   ├── dnd-items/          # Ítems 5e + catálogo de equipo del builder
│   ├── dnd-races/          # Especies 5e
│   ├── dnd-backgrounds/    # Trasfondos 5e
│   ├── dnd-feats/          # Dotes 5e
│   ├── dnd-optionalfeatures/ # Optional features 5e (sin ruta)
│   ├── xanathar-backstory/ # Generador de trasfondo (XGE)
│   └── bestiary/           # Bestiario 5e
├── shared/
│   ├── types/              # Entidades tipadas
│   ├── context/            # ThemeContext, SyncContext
│   ├── db/                 # IndexedDB (idb), sync, database
│   ├── data/               # fivetools-fetch helper
│   ├── services/           # create-entity-service (factory)
│   ├── utils/              # cn, cr.utils, fivetools-parser, dedupe-by-name, fluff, …
│   ├── constants/          # URLs API, stores, source maps, dnd/ (abilities, skills)
│   ├── components/         # ItemRefText, DndKeywordText, StatBlockSection
│   ├── hooks/              # useDebouncedValue, useBookSourceNames, …
│   └── theme/              # Definición de temas
└── index.css               # Tailwind + variables de tema
```

Convención por feature: `components/`, `services/`, `mappers/`, `data/` (estático), `context/`, `hooks/` según necesidad. Subcarpetas comunes en builder: `components/stats/`, `components/equipment/`, `components/paper-doll/`, `components/combat/`, `foundry-export/`, `foundry-import/`.

---

## Notas de Implementación

- **Amellwind (MM + GTMH)**: consultas contra **IndexedDB** o sync condicional (TTL 24 h). **Compendio 5e**: fetch bajo demanda desde mirror 5etools (opcional local con `VITE_5ETOOLS_DATA=local`).
- Contenido estático embebido en `*.data.ts`: cooking, combo, resources, environments, shops, character-guide, npc-templates.
- Stack: **React 18 + TypeScript + Vite**, **Tailwind CSS**, **shadcn/ui** (Radix), **TanStack Table**, **idb**, **react-router-dom v6** (lazy routes), **lucide-react**, **embla-carousel**.
- **Node.js 22.x** requerido (`package.json` engines + `.nvmrc`).
- Rutas lazy con `<Suspense>`; sync y temas gestionados en `App.tsx` / `ThemeProvider` / `SyncProvider`.
- `RuneBuildProvider` solo en `/runes` y `/builder`; `BuildDrawer` solo en `RuneList`.
- Inventario del builder derivado del **carrito** (`CartContext` → `BuilderInventoryContext`).
- Utilidades clave: `fivetools-parser.ts`, `cr.utils.ts`, `ItemRefText`, `DndKeywordText`, `fivetools-fetch.ts`, `dedupe-by-name.utils.ts`, `fluff.utils.ts`.
- Services del compendio 5e creados con el factory `createEntityService` (`shared/services/`); constantes D&D centralizadas en `shared/constants/dnd/`.
- **Export/Import Foundry VTT** en `builder/foundry-export/` y `foundry-import/` (actor `character` dnd5e v12), con botones en `StatsPanel`.
- Catálogo de equipo D&D del builder en `dnd-items/dnd-equipment.service.ts` (`getDndWeapons`, `getDndArmors`, …).
- El **Character Builder** y las **armaduras reales desde GTMH** siguen en desarrollo activo (ALPHA).
