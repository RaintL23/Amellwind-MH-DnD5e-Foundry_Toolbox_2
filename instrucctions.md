# Amellwind Monster Hunter DnD5e Toolbox

## Descripción

Esta es una aplicación que servirá como toolkit para un Dungeon Master que quiera hacer uso del manual de Amellwind que combina Monster Hunter con Dungeons & Dragons 5e.

La información mostrada en esta aplicación proviene de los siguientes recursos homebrew de Amellwind disponibles en 5etools:

- [Amellwind; Monster Hunter Monster Manual.json](https://raw.githubusercontent.com/TheGiddyLimit/homebrew/master/collection/Amellwind;%20Monster%20Hunter%20Monster%20Manual.json) (feed público; se usa como respaldo para nombres que el PDF no cubre)
- [MHMM with Loot Tables 2.0](https://www.patreon.com/amellwind/posts/monster-hunter-137502033) — PDF gratuito en el Patreon de Amellwind (fuente de las fichas y runas que muestra la app)
- [Amellwind; Amellwind's Guide to Monster Hunting.json](https://raw.githubusercontent.com/TheGiddyLimit/homebrew/master/collection/Amellwind;%20Amellwind's%20Guide%20to%20Monster%20Hunting.json)

---

## Stack Tecnológico

| Capa               | Tecnología                        |
| ------------------ | --------------------------------- |
| Framework          | React 18 + TypeScript             |
| Build tool         | Vite                              |
| Estilos            | Tailwind CSS                      |
| Componentes UI     | shadcn/ui (Radix UI)              |
| Tablas             | TanStack Table                    |
| Routing            | React Router v6 (lazy + Suspense) |
| Almacenamiento     | IndexedDB (`idb`)                 |
| Gestor de paquetes | pnpm                              |
| Node.js            | 22.x (`.nvmrc`)                   |

> Toda la app es una **SPA** (Single Page Application). No hay backend propio. Los datos de **Amellwind** se cachean en IndexedDB; el **compendio D&D 5e** (spells, classes, races, backgrounds, feats, items, bestiary) se obtiene bajo demanda desde el mirror de 5etools, con opción de mirror local (`VITE_5ETOOLS_DATA=local`). El **Character Builder** exporta/importa personajes en formato **Foundry VTT (dnd5e)**.

---

## Routing y Navegación

La app usa **React Router v6** con rutas declarativas montadas en `App.tsx`. El layout general (Sidebar + área de contenido) se aplica mediante un componente `MainLayout` que envuelve todas las rutas con contenido.

### Estructura de rutas

Todas las rutas de página se cargan con **`React.lazy`** y `<Suspense>` (fallback `LoadingScreen` con skeletons).

```text
/                          → Home (landing; replica las 3 secciones del Sidebar)

── Amellwind Homebrew ──
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
/conditions                → Condiciones y enfermedades (GTMH; UI combinada)
/diseases                  → Redirect a /conditions
/weapons                   → Hunter Weapons
/items                     → Catálogo de ítems GTMH (`amellwind/shops` ItemList)
/shops                     → Tiendas y carrito
/cooking                   → Cocina artesana
/combo                     → Combo List
/hunt                      → Hunt Planner
/environments              → Biomas y tablas de cacería
/resources                 → Recursos de campo
/downtime                  → Actividades de downtime (GTMH)

── Amellwind (RaintDM) ──
/builder                   → Character Builder (ALPHA, export/import Foundry VTT)
/weapon-forge              → Weapon Forge (variantes RaintDM + armas custom)
/weapon-forge/new          → Crear arma custom
/weapon-forge/edit/:id     → Editar arma custom
/item-forge                → Items Forge (catálogo curated RaintDM)

── Compendio D&D 5e ──
/spells                    → Conjuros (5etools)
/classes                   → Listado de clases base
/classes/:classId          → Detalle de clase (variantes por fuente; `?subclass=SOURCE::Name` selecciona subclase y auto-carga su source brew si hace falta)
/dnd-races                 → Especies oficiales 5e
/dnd-backgrounds           → Trasfondos oficiales 5e
/dnd-feats                 → Dotes oficiales 5e
/dnd-items                 → Ítems mágicos y equipo (5etools)
/bestiary                  → Bestiario oficial
/bestiary/:creatureId      → Detalle de criatura
/xanathar-backstory        → Generador de trasfondo (XGE)
/shop-generator            → Generador de tiendas D&D 5e

*                          → Página 404 / Not Found
```

### Implementación en `App.tsx`

Al montar, `App.tsx` ejecuta `syncData()` y muestra un banner de sincronización vía `SyncProvider` hasta que termina. Tras un sync exitoso invalida cachés en memoria según qué store se actualizó (MM: monstruos/runas/conditions/diseases; GTMH: species/backgrounds/feats/monstie/material-effects/items/weapons/downtime).

Providers globales:

- **`ThemeProvider`** — temas visuales (selector en el footer del Sidebar).
- **`SyncProvider`** — estado de sincronización inicial (`syncing`).
- **`BrowserRouter`** + rutas lazy.

Providers en **`MainLayout`** (todas las rutas con layout):

- **`CartProvider`** — carrito de compras (tiendas e ítems).
- **`BuilderInventoryProvider`** — resuelve armas/armaduras equipables desde el carrito para el Builder (global: Purchase en `/shops` y `/items`). `CartPurchaseBridge` inyecta `purchaseFromCart` para que `CartDrawer` no importe el Builder.
- **`CartPurchaseBridge`** — puente layout: `BuilderInventoryContext` → `CartPurchaseContext`.

Providers **por ruta** (no globales):

- **`RuneBuildRouteLayout`** — `RuneBuildProvider` solo en `/runes` y `/builder`.
- **`BuilderRouteProviders`** — `CharacterBuilderProvider` + spellcasting + autosave + syncs de inventario, solo en `/builder`.

```tsx
<ThemeProvider>
  <SyncProvider syncing={syncing}>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout syncing={syncing} />}>
          <Route index element={<HomePage />} />
          {/* … rutas lazy con Suspense … */}
          <Route element={<RuneBuildRouteLayout />}>
            <Route path="runes" element={<RuneList />} />
            <Route
              path="builder"
              element={
                <BuilderRouteProviders>
                  <BuilderPage />
                </BuilderRouteProviders>
              }
            />
          </Route>
          <Route path="monsters" element={<MonstersOutlet />}>
            <Route index element={<MonsterList />} />
            <Route path=":monsterId" element={<MonsterDetailPage />} />
          </Route>
          <Route
            path="diseases"
            element={<Navigate to="/conditions" replace />}
          />
          {/* … */}
        </Route>
      </Routes>
    </BrowserRouter>
  </SyncProvider>
</ThemeProvider>
```

### Sidebar y navegación

El `Sidebar` agrupa links en grupos colapsables organizados bajo tres secciones: **Amellwind Homebrew**, **Amellwind (RaintDM)** y **D&D 5e Compendium**. Soporta **colapso en desktop** (solo iconos) y **drawer en mobile** con overlay. Incluye **`ThemeSelector`** en el footer. La configuración vive en `NAV_SECTIONS` (`src/shared/constants/nav-sections.ts`); cada sección tiene `id` + `label` + `groups`, y cada grupo tiene `label` + `items` (con `description` / `badge` para Home). `Sidebar` y `HomePage` consumen el mismo mapa. Hunt Planner está en **World and Exploration**.

**Amellwind (RaintDM)** agrupa el Character Builder (hub de personaje de toda la app), el Damage Calculator (también listado en Amellwind Homebrew) y las variantes de mesa de RaintDM sobre el homebrew 2014 de Amellwind (Weapon Forge, Items Forge). Si una sección tiene un solo grupo, el Sidebar renderiza los links planos bajo el título de sección (sin acordeón extra).

El equipo equipable del Builder proviene de ítems añadidos al carrito en Shops/Items (`CartContext` → `BuilderInventoryContext`). El Sidebar **no** muestra badge de inventario sobre Builder.

| Sección             | Grupo Sidebar                 | Links principales                                                           |
| ------------------- | ----------------------------- | --------------------------------------------------------------------------- |
| Amellwind Homebrew  | Character                     | Damage Calculator, Creation Guide                                           |
| Amellwind Homebrew  | Bestiary and Rules            | Monsters, Conditions & Diseases                                             |
| Amellwind Homebrew  | Species and Character Options | Species, Backgrounds, Feats                                                 |
| Amellwind Homebrew  | Weapons, Runes, and Equipment | Weapons, Runes, Material Effects, Items                                     |
| Amellwind Homebrew  | World and Exploration         | Hunt Planner, Environments, Resources, Shops, Cooking, Combo List, Downtime |
| Amellwind Homebrew  | NPCs and Companions           | Monstie Sidekick, NPC Generator                                             |
| Amellwind (RaintDM) | Character                     | Builder, Damage Calculator                                                  |
| Amellwind (RaintDM) | Weapons                       | Weapon Forge, Items Forge                                                   |
| D&D 5e Compendium   | Spells and Classes            | Spells, Classes                                                             |
| D&D 5e Compendium   | Character Options             | Races, Backgrounds, Feats                                                   |
| D&D 5e Compendium   | Bestiary                      | Bestiary                                                                    |
| D&D 5e Compendium   | Equipment                     | Items                                                                       |
| D&D 5e Compendium   | Character Tools               | Xanathar Backstory, Shop Generator                                          |

### Layout global (`MainLayout`)

`MainLayout` monta `Sidebar`, banner de sync opcional, topbar mobile y `<Outlet />`. Wrappers extra: **`RuneBuildRouteLayout`** (`/runes` + `/builder`) y **`BuilderRouteProviders`** (solo `/builder`). **No** incluye `BuildDrawer` global: el planificador de runas vive solo en **`RuneList`** (`/runes`) y el builder reutiliza `RuneBuildContext` en `/builder`.

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

| Store (tabla)   | Contenido                                                                                                                                                                                                               |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `mm_current`    | `data`: lista mezclada (PDF Patreon 2.0 gana por nombre). `github`: snapshot del feed público. `condition` / `disease`: mismas reglas (PDF gana; GitHub rellena). Snapshots GitHub: `githubCondition`, `githubDisease`. |
| `mm_previous`   | Snapshot anterior del Monster Manual (para rollback)                                                                                                                                                                    |
| `mm_meta`       | Timestamp del último fetch, versión, etc.                                                                                                                                                                               |
| `gtmh_current`  | Datos de la Guía de Caza (ver claves abajo)                                                                                                                                                                             |
| `gtmh_previous` | Snapshot anterior de la Guía de Caza                                                                                                                                                                                    |
| `gtmh_meta`     | Timestamp del último fetch, versión, etc.                                                                                                                                                                               |

#### Claves dentro de `gtmh_current`

| Clave          | Origen JSON GTMH    | Uso en la app                          |
| -------------- | ------------------- | -------------------------------------- |
| `data`         | `item[]`            | Ítems MH, armas (`type: "HW"`), etc.   |
| `optfeatures`  | `optionalfeature[]` | Optional features de armas             |
| `race`         | `race[]`            | Especies base                          |
| `subrace`      | `subrace[]`         | Subrazas (Felyne, Dragonborn elder, …) |
| `background`   | `background[]`      | Trasfondos de cazador                  |
| `feat`         | `feat[]`            | Dotes                                  |
| `variantrule`  | `variantrule[]`     | Reglas variantes (downtime, guías)     |
| `classFeature` | `classFeature[]`    | Features de Monstie Sidekick           |
| `class`        | `class[]`           | Clases MH (p. ej. Hunter)              |

Al sincronizar GTMH, `sync.service.ts` persiste cada array por separado. Si una clave no está cacheada (p. ej. tras upgrade), `ensureGtmhArrayStore()` puede hacer lazy-fetch del JSON remoto.

#### Datos 5etools (persistidos en IndexedDB)

Spells, classes, races, backgrounds, feats, items y bestiary oficiales se cargan bajo demanda desde `FIVETOOLS_DATA_BASE_URL` (`api.constants.ts`) y se **persisten en IndexedDB** (store `fivetools_cache`), que es la fuente de verdad en runtime. Spells/classes usan sus `index.json` dinámicos (no whitelists fijas). El acceso es offline-first (_stale-while-revalidate_): se sirve lo guardado y, si está viejo (TTL 24 h), se refresca en segundo plano.

**Unearthed Arcana / prerelease** se carga desde `TheGiddyLimit/unearthed-arcana` (`VITE_UA_MIRROR` / `VITE_UA_REF`) vía el mismo cache IndexedDB. **Partnered** (p. ej. D&D Beyond Drops, Tal'Dorei Reborn — el mismo set que 5etools `search/index-partnered.json`) se indexa desde `TheGiddyLimit/homebrew` (`_generated`, meta `p: 1`) y se descarga on-demand desde ese repo. En el Filter dialog, Sources se agrupan por año de publicación; por defecto solo están preseleccionadas las fuentes **oficiales**. UA, residuales tipo D&D Beyond del feed UA (p. ej. `WGE`) y partnered se pueden activar y se mergean on-demand. Las collections partnered solo aparecen en el filtro de una feature si `index-props.json` indica que el archivo trae esa entidad (p. ej. Classes solo lista brew con `class`/`subclass` — _Grim Hollow: Campaign Guide (2024)_ no tiene subclases; usar _Player's Guide (2024)_).

En desarrollo offline, copiar JSON a `public/5etools/` (y opcionalmente `public/5etools/ua/`) y usar `VITE_5ETOOLS_DATA=local`.

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
- **bonusActions** _(array)_ — Bonus actions. Misma estructura que `actions`. Viene de `raw.bonus` (5etools); si el feed aún embebe entradas `Bonus Action: …` dentro de `action`, el mapper las separa aquí y las quita de Actions.
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

#### Atributos de la entidad Rune

- **name** _(string)_ — Nombre del material (ej. `"Acidic Glavenus Scale"`).
- **monsterName** _(string)_ — Nombre del monstruo del que proviene (ej. `"Acidic Glavenus"`).
- **monsterSource** _(string)_ — Código de la fuente del monstruo (ej. `"MHMM"`).
- **carveChance** _(string)_ — Rango de d20 para obtenerlo por carve (ej. `"1-6"`). Valor `"-"` si no es carveable.
- **captureChance** _(string)_ — Rango de d20 para obtenerlo por captura (ej. `"1-4"`). Valor `"-"` si no es capturable.
- **rolls** _(int)_ — Número de tiradas de d20 al carvear o capturar al monstruo (ej. `3`). Es el mismo valor para ambos modos de obtención — viene del campo `"Carves/Capture"` del JSON.
- **slots** _(array)_ — Tipos de equipo donde se puede usar. Valores posibles: `"A"` (Armor), `"W"` (Weapon). Puede ser `["A"]`, `["W"]`, o `["A", "W"]`. Mapeado desde el string `"(A,W)"` del JSON. Filas de loot con slot **`O`** (Other: upgrade bones, crafting mats, sellables, rations…) quedan con `slots: []`; el mapper las sigue emitiendo para la tabla de carve del monstruo, pero **`getAllRunes()`** las excluye del catálogo `/runes` y del picker del Builder (`isPlaceableRune`). Tras mapear todos los monstruos, `backfillSharedOtherEffects` rellena `otherEffect` vacío en filas O copiando el texto más corto conocido para el mismo `name` o su base sin cantidad (`B.Sleep Sac x2` ↔ `B.Sleep Sac`, `2x Paddock Oil` ↔ `Paddock Oil`). El lookup de efectos A/W/O usa la misma normalización. `normalizeLootChance` unifica guiones tipográficos (`—`) a `"-"`.
- **armorEffect** _(string | null)_ — Texto del efecto cuando se coloca en armadura. Presente solo si `slots` incluye `"A"`. El texto puede contener marcado de 5etools que debe parsearse.
- **weaponEffect** _(string | null)_ — Texto del efecto cuando se coloca en un arma. Presente solo si `slots` incluye `"W"`. Ídem sobre el marcado.
- **otherEffect** _(string | null)_ — Texto de la lista `OTHER MATERIAL EFFECTS` (crafting, upgrade bones, rations, sellables, consumables, etc.). No es un efecto de equipo; se muestra en el detalle de la runa (p. ej. desde Carve / Capture) y **no** habilita Add to Build.
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
  otherList    = inset.entries.find(e => e.type === "list" && e.name === "OTHER MATERIAL EFFECTS")

  // 3. Indexar efectos por nombre de material (pueden ser undefined si no existe la lista)
  armorEffects  = indexarPorNombre(armorList?.items)   // { "Material Name" → item }
  weaponEffects = indexarPorNombre(weaponList?.items)  // { "Material Name" → item }
  otherEffects  = indexarPorNombre(otherList?.items)   // { "Material Name" → item }

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
      otherEffect:    otherEffects[row[2]]?.entries.join(" ") ?? null,
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

| Tag                                 | Regla de detección                                                                                                                                                                                                                                                                                                                                                              |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `mechanic:spell`                    | Contiene `{@spell` **o** prosa MHMM (`cast the Earth Tremor spell` / `know the ice knife spell`): se resuelve el nivel en el catálogo de conjuros → `mechanic:spell:lvlN` (1–9). Cantrip (nivel 0) → solo `mechanic:cantrip`. Si el conjuro no está en el catálogo, fallback `lvl1-2` / `lvl3+` por texto/runas. Un _upcast_ explícito (`at 2nd level`) sube el nivel efectivo. |
| `mechanic:spell:one-use`            | Concede un único uso por recarga (`once per long rest` / `once a day` / `once used… can't… again`). No aplica a `at will`, bancos de runas (`expend` + runes) ni usos múltiples (`twice` / `three times`).                                                                                                                                                                      |
| `mechanic:spell:prepared`           | Grant _always prepared_ / no cuenta contra el límite de preparación (`always have it prepared`, `doesn't count against the number of spells you can prepare`). Requiere que el efecto también conceda un conjuro/cantrip.                                                                                                                                                       |
| `mechanic:rune-charges`             | Contiene `rune` seguido de número (ej. `"3 runes"`, `"has 4 runes"`)                                                                                                                                                                                                                                                                                                            |
| `mechanic:critical`                 | Contiene `critical` / `critically` (p. ej. _Critical Status_). Ya **no** cubre un 20 natural por sí solo                                                                                                                                                                                                                                                                        |
| `mechanic:roll-20`                  | Contiene `roll a 20` o `natural 20` (el trigger es el dado, no necesariamente un crítico)                                                                                                                                                                                                                                                                                       |
| `mechanic:push`                     | Empuja al objetivo (`is/are/be pushed`, `pushed back N`, `push the creature/target`). No aplica a lockouts defensivos (`cannot/can't be pushed`)                                                                                                                                                                                                                                |
| `mechanic:area`                     | Forma de área: `N-foot cone/line/radius/sphere/cube/cylinder` (p. ej. oleada de magma en cono)                                                                                                                                                                                                                                                                                  |
| `mechanic:no-damage`                | Rider de `roll-20` cuyo payoff no es daño extra ni un ataque adicional                                                                                                                                                                                                                                                                                                          |
| `mechanic:unarmed`                  | Afecta **tus** unarmed strikes (`make an unarmed strike`, `your unarmed strikes`). No aplica a thorns de armadura                                                                                                                                                                                                                                                               |
| `mechanic:natural-weapon`           | Afecta **tus** / de raza natural weapons (`Race with natural weapons only`, `your race's natural weapon`). No aplica a thorns (`hits you with … a natural melee weapon`)                                                                                                                                                                                                        |
| `mechanic:extra-damage`             | Contiene `extra {@damage`, `extra NdX` o `extra N … damage` → se emite como `:minor` / `:major` según score                                                                                                                                                                                                                                                                     |
| `mechanic:resistance`               | Contiene `resistance to` o `resistant to` seguido de tipo de daño                                                                                                                                                                                                                                                                                                               |
| `mechanic:damage-reduction`         | Reduce daño entrante: `reduce … damage you take by N` (DR elemental plano), `reduce damage you take from … by N`, `when you take damage … reduce`, o `damage … is reduced by/to`                                                                                                                                                                                               |
| `type:defensive`                    | Menos daño recibido, AC, resistencia/inmunidad, DR, ventaja en saves defensivos, etc. (inferido por `typeTags()`)                                                                                                                                                                                                                                                             |
| `type:offensive`                    | Más daño, críticos, buffs de ataque/daño, condiciones on hit (inferido por `typeTags()`)                                                                                                                                                                                                                                                                                        |
| `type:support`                      | Ayuda a aliados / `willing creature` (inferido por `typeTags()`)                                                                                                                                                                                                                                                                                                                |
| `mechanic:immunity`                 | Contiene `immune to` / `immunity to`, **o** lockout de condición sin esa frase (`cannot be knocked prone`, `can't be stunned`, `cannot be poisoned, paralyzed, or stunned`). No incluye _can't be afflicted…_ (eso es `against-condition`) ni utilidades (`cannot be used/pushed/detected`)                                                                                     |
| `mechanic:bonus-action`             | Contiene `bonus action`                                                                                                                                                                                                                                                                                                                                                         |
| `mechanic:reaction`                 | Contiene `reaction`                                                                                                                                                                                                                                                                                                                                                             |
| `mechanic:saving-throw`             | Contiene `saving throw` (ventaja/desventaja, bonus a tus saves, o saves impuestos al objetivo)                                                                                                                                                                                                                                                                                  |
| `mechanic:save-bonus`               | `+N bonus to/on … saving throws` (Evade Extender) **o** `do so with a +N bonus` tras un saving throw (p. ej. vs knocked prone)                                                                                                                                                                                                                                                  |
| `mechanic:save-{ability}`           | Buff a un save concreto (p. ej. Dexterity → `save-dexterity`). No aplica a “must make a Dexterity saving throw”                                                                                                                                                                                                                                                                 |
| `mechanic:attack-roll`              | Menciona `attack roll(s)` (ventaja / bonus a tus tiradas de ataque)                                                                                                                                                                                                                                                                                                             |
| `mechanic:initiative`               | Buff a iniciativa (`advantage on initiative rolls`, `add a dN to your initiative`, `first in the initiative order`). No aplica a FastCharge (_when you roll for initiative, gain charges_)                                                                                                                                                                                      |
| `mechanic:initiative:major`         | Control fuerte de iniciativa: dado d8+ y / o forzar el primer puesto en el orden                                                                                                                                                                                                                                                                                                |
| `mechanic:heal-other`               | Mejora la curación que **tú** aplicas a **otras** criaturas → se emite como `:minor` / `:major` (Astalos Scissortail, Lay on Hands + THP, transferencias Malzeno). No aplica a Recovery Up / Hasten Recovery (self)                                                                                                                                                             |
| `mechanic:skill-bonus`              | Contiene `+N bonus on/to` junto a `{@skill` **o** prosa (`+2 bonus to Athletics checks` / `Climb checks`)                                                                                                                                                                                                                                                                       |
| `mechanic:skill-{name}`             | Por cada `{@skill Name}` o nombre bare de skill cerca de `checks` (p. ej. Insight → `skill-insight`). Alias MHMM: Climb → Athletics                                                                                                                                                                                                                                             |
| `mechanic:disarm`                   | Contiene `disarmed` (p. ej. _advantage on checks against being disarmed_)                                                                                                                                                                                                                                                                                                       |
| `mechanic:armor-class`              | Contiene `\bAC\b` o `armor class`                                                                                                                                                                                                                                                                                                                                               |
| `mechanic:spell-buff:save`          | Bonus / incremento al _spell save DC_ (`+N bonus to … spell save DC`, `increase the spell save DC by N`). No aplica a bancos de runas (_cast … using your spell save DC_)                                                                                                                                                                                                       |
| `mechanic:spell-buff:damage`        | Bonus / ventaja a _spell attack rolls_ / _spell attack bonus_ o daño de hechizos. Acepta `+ N`, `gain +N to spell attack`, etc.                                                                                                                                                                                                                                                 |
| `mechanic:condition`                | Contiene `{@condition`, inmunidad a una condición, o un nombre conocido (PHB + blight MH: poisoned, stunned, waterblight, frenzy virus, …)                                                                                                                                                                                                                                      |
| `mechanic:condition-{n}`            | Por cada condición nombrada (p. ej. stunned → `condition-stunned`, poisoned → `condition-poisoned`, waterblight → `condition-waterblight`). Alias: `paralysis` → `paralyzed`.                                                                                                                                                                                                   |
| `mechanic:against-condition`        | Ayuda a **evitar** adquirir una condición (advantage / save-bonus en saves vs being X / _the X condition_ / _or be knocked prone_ / paralysis, _can't be afflicted with_). **No** incluye inmunidad total a la condición                                                                                                                                                        |
| `mechanic:advantage`                | Contiene `advantage` (también junto a saving throws)                                                                                                                                                                                                                                                                                                                            |
| `mechanic:passive`                  | Efecto siempre activo (p. ej. _while you wear_ / _you have…_) sin gastar action / BA / reaction                                                                                                                                                                                                                                                                                 |
| `mechanic:active`                   | Efecto activado: `as an action`, `bonus action` o `reaction` (gana sobre passive si ambos aplicarían)                                                                                                                                                                                                                                                                           |
| `mechanic:disease`                  | Contiene `disease` / `diseases`                                                                                                                                                                                                                                                                                                                                                 |
| `mechanic:movement`                 | Speed / movement (grants o debuffs). Modos: `burrowing`, `swimming`, `flying`, `climbing`, `walking-speed`, `difficult-terrain`. `movement:major` si walk +10/doubles o fly ≥60 ft                                                                                                                                                                                              |
| `mechanic:burrowing`                | `burrowing speed`                                                                                                                                                                                                                                                                                                                                                               |
| `mechanic:swimming`                 | `swimming speed`                                                                                                                                                                                                                                                                                                                                                                |
| `mechanic:flying`                   | `flying speed`                                                                                                                                                                                                                                                                                                                                                                  |
| `mechanic:climbing`                 | `climbing speed` / Spider Climb                                                                                                                                                                                                                                                                                                                                                 |
| `mechanic:walking-speed`            | `walking speed increases/becomes/doubles` o `your speed increases`                                                                                                                                                                                                                                                                                                              |
| `mechanic:difficult-terrain`        | Contiene `difficult terrain`                                                                                                                                                                                                                                                                                                                                                    |
| `mechanic:ignore-difficult-terrain` | `ignore difficult terrain` o _doesn't cost … extra movement/moment_                                                                                                                                                                                                                                                                                                             |
| `mechanic:icy-surfaces`             | `icy surfaces` / difficult terrain de _ice or snow_                                                                                                                                                                                                                                                                                                                             |
| `mechanic:movement-climb`           | Trepar sin check en superficies (p. ej. _climb icy surfaces without … ability check_). Distinto de `climbing` (climbing speed / Spider Climb)                                                                                                                                                                                                                                   |
| `mechanic:underwater`               | Contiene `underwater`                                                                                                                                                                                                                                                                                                                                                           |
| `mechanic:hold-breath`              | Contiene `hold breath` / `hold your breath`                                                                                                                                                                                                                                                                                                                                     |
| `mechanic:long-rest`                | Contiene `long rest` (recarga **o** duración de descanso)                                                                                                                                                                                                                                                                                                                       |
| `mechanic:short-rest`               | Contiene `short rest`                                                                                                                                                                                                                                                                                                                                                           |
| `mechanic:accelerated-rest`         | Acorta la duración del descanso (_benefits of a long rest after 4 hours instead of 8_). Distinto de recargas _once / finish a long rest_                                                                                                                                                                                                                                        |
| `mechanic:mithral`                  | Paquete estilo _Mithral Armor_: armadura light/flexible, bajo ropa, sin desventaja en Stealth ni requisito de Fuerza                                                                                                                                                                                                                                                            |
| `mechanic:healing`                  | Contiene `regain` o `restore` seguido de `hit points`                                                                                                                                                                                                                                                                                                                           |
| `mechanic:end-dot`                  | Termina un efecto de daño continuo al inicio de tu turno (`damage to you at the start of your turn` + `ends the effect`; Recovery Level)                                                                                                                                                                                                                                        |
| `mechanic:spell-slot`               | Recupera un _spell slot_ (`regain` / `restore` / `recover` + `spell slot(s)`), no “without expending a spell slot”. Si el texto nombra un máximo (`up to 4th level`) → `mechanic:spell-slot:lvlN`.                                                                                                                                                                              |
| `mechanic:cantrip`                  | Contiene `cantrip`, o un conjuro del catálogo resuelto como nivel 0 (`{@spell` o prosa)                                                                                                                                                                                                                                                                                         |
| `mechanic:spellcasting-focus`       | El arma/ítem se puede usar como _spellcasting focus_ (_use this weapon as your spellcasting focus_). Distinto de `focus-points`                                                                                                                                                                                                                                                 |
| `mechanic:class-feature`            | Contiene el nombre de una feature de clase específica (ej. `wyvernfire`, `dragonpiercer`, `Guard AC`, `Mighty Weapon`)                                                                                                                                                                                                                                                          |
| `mechanic:item-related`             | Contiene `{@item` (uso / proficiency / conjuro de ítems: bombas, ammo, kits, pociones, etc.)                                                                                                                                                                                                                                                                                    |
| `mechanic:trap`                     | Subconjunto de `item-related`: pitfall/shock trap(+ ) o trap tool (trampas MH)                                                                                                                                                                                                                                                                                                  |
| `mechanic:gather-resources`         | Utilidad de recolección de campo MH (Botanist / Geologist / Fisherman / Pack Rat / Whim, …). Variantes fuertes (`1d4`, double de party, free gather) → también `mechanic:gather-resources:major`                                                                                                                                                                                |
| `mechanic:fishing`                  | `catch fish` / `fishing pole` / `sushifish` (también emite `gather-resources`)                                                                                                                                                                                                                                                                                                  |
| `mechanic:mining`                   | `mining resource` / `mine or gather` / `mineral resource` / Mineralogist / Crystallography                                                                                                                                                                                                                                                                                      |
| `mechanic:plant`                    | `plant resource` / herbalist kit / Honey Hunter                                                                                                                                                                                                                                                                                                                                 |
| `mechanic:bone`                     | `bone resource` (Archaeologist)                                                                                                                                                                                                                                                                                                                                                 |
| `mechanic:foraging`                 | `harvest mushrooms` (Forager). No aplica a Fortitude (_track, forage, or travel_)                                                                                                                                                                                                                                                                                               |
| `mechanic:insects`                  | `bug net` / Entomologist / insect resources                                                                                                                                                                                                                                                                                                                                     |
| `mechanic:class-resource`           | Pool de clase (ki, Channel Divinity, sorcery points, …). Siempre junto al tag específico del pool                                                                                                                                                                                                                                                                               |
| `mechanic:ki`                       | Contiene `ki point(s)`                                                                                                                                                                                                                                                                                                                                                          |
| `mechanic:channel-divinity`         | Contiene `channel divinity`                                                                                                                                                                                                                                                                                                                                                     |
| `mechanic:sorcery-points`           | Contiene `sorcery point(s)`                                                                                                                                                                                                                                                                                                                                                     |
| `mechanic:superiority-dice`         | Contiene `superiority dice`                                                                                                                                                                                                                                                                                                                                                     |
| `mechanic:bardic-inspiration`       | Contiene `bardic inspiration`                                                                                                                                                                                                                                                                                                                                                   |
| `mechanic:focus-points`             | Contiene `focus point(s)`                                                                                                                                                                                                                                                                                                                                                       |
| `mechanic:recover-class-resource`   | Restaura usos gastados del pool (`regain` / `restore` / `recover` + ki / sorcery / …). No cubre “+1 use between rests”                                                                                                                                                                                                                                                          |
| `mechanic:attack-range`             | Aumenta el _normal attack range_ del arma (`increased by N feet` / `doubled`). No aplica a Critical Eye (_critical hit range_) ni a bonos “outside of your normal attack range”                                                                                                                                                                                                 |
| `mechanic:attack-range:major`       | El normal attack range queda **doubled** (Deadeye+ / underwater)                                                                                                                                                                                                                                                                                                                |
| `mechanic:reach`                    | Extiende el _reach_ melee (`reach is increased` / `extend its reach by`)                                                                                                                                                                                                                                                                                                        |
| `mechanic:light`                    | Produce iluminación (`sheds … light` / `creating bright light` / `moonlight` / `dim light for an additional`) — no el entorno “in dim light or darkness”                                                                                                                                                                                                                        |
| `mechanic:darkness`                 | Menciona `darkness` (entorno, creación o visión)                                                                                                                                                                                                                                                                                                                                |
| `mechanic:nonmagical-darkness`      | Oscuridad natural / no mágica: `nonmagical darkness`, `in darkness`, `dim light or darkness`, `into darkness`, o “both magical and nonmagical”                                                                                                                                                                                                                                  |
| `mechanic:magical-darkness`         | Oscuridad mágica: `magical darkness` o “darkness, both magical and nonmagical” / _see normally in darkness, both magical…_                                                                                                                                                                                                                                                      |
| `mechanic:darkvision`               | Concede `darkvision` (no _see normally in darkness_, que usa los tags de darkness)                                                                                                                                                                                                                                                                                              |

##### Notas de implementación de tags

- Las reglas se aplican sobre el texto del efecto **ya concatenado** (`entries.join(" ")`), antes de parsear el marcado de 5etools.
- Un mismo efecto puede activar múltiples reglas simultáneamente. Ejemplo: `"{@i (Spellcaster only)} This weapon has 4 runes. Cast {@spell lightning bolt}"` → con catálogo de conjuros → `["class:spellcaster", "mechanic:rune-charges", "mechanic:spell:lvl3"]` (Lightning Bolt es nivel 3).
- Si el texto no coincide con ninguna regla, `tags` es `[]`.
- Las reglas son **case-insensitive** salvo donde se indique lo contrario.
- El listado `/runes` filtra tags en **AND sobre el mismo lado** (`runeMatchesListTagFilter`): Slot Armor + `damage:fire` + `mechanic:immunity` solo muestra runas cuyo **armorEffect** tenga fuego e inmunidad juntos. No basta con que el fuego esté en el arma y la inmunidad en la armadura.

##### Rareza de resistencia / inmunidad / daño extra inline

Si el texto del efecto **no** referencia un material effect nombrado del catálogo GTMH, `getMaterialEffectTierForText` infiere rareza desde grants en primera persona:

**Defensas** (`inline-defense-rarity.utils.ts`):

| Texto (ejemplos)                                                                         | Rareza                                                                 |
| ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `You have resistance to lightning damage, while you wear this armor.`                    | **Rare** (siempre activa)                                              |
| `You are resistant to poison damage and immune to the poisoned condition…`               | **Rare** (resistencia a daño; la inmunidad a condición no sube rareza) |
| `…use your reaction or bonus action to gain resistance to lightning…` (usos / long rest) | **Uncommon** (activada / limitada)                                     |
| `As an action, you gain resistance to … for 1 minute` (1/long rest)                      | **Uncommon**                                                           |
| `You are immune to fire damage while you wear this armor.`                               | **Very Rare** (siempre activa)                                         |
| `You are immune to poison and disease while you wear this armor.`                        | **Very Rare** (atajo clásico: `poison` = daño de veneno)               |
| Inmunidad a daño activada (action / BA / reaction + duración corta)                      | **Rare** (un escalón bajo Very Rare)                                   |

Solo cuenta inmunidad/resistencia **a un tipo de daño** (no inmunidad a condición). La detección de “limitada” busca gasto de economy (`action` / `bonus action` / `reaction`) junto al grant de resistencia/inmunidad.

**Daño de arma** (`inline-extra-damage-rarity.utils.ts`), score = dados × caras (o flat) — aplica a daño extra siempre activo y a daño que el efecto hace sufrir al objetivo (p. ej. DoT al crit, AoE `dealing 22 (4d10) fire damage`):

| Score | Ejemplo                                                | Rareza        |
| ----- | ------------------------------------------------------ | ------------- |
| ≤ 6   | `extra 1d6 … damage`, crit DoT `takes 1d4 fire damage` | **Uncommon**  |
| 7–12  | `extra 2d6 necrotic damage`                            | **Rare**      |
| 13–20 | `extra 3d6 … damage`                                   | **Very Rare** |
| ≥ 21  | `extra 4d6 … damage`                                   | **Legendary** |

Ráfagas de uso limitado (`once per long rest` / `can't use … again until … rest` / `once you use this property`) bajan **un escalón** (p. ej. cono 4d10 1/descanso → **Very Rare**, no Legendary). Acepta notación MHMM de promedio `22 (4d10)`.

Un efecto nombrado del catálogo GTMH tiene prioridad sobre esta inferencia. Los nombres extraídos de runas MHMM que **no** están en GTMH (`discovered:`) se asignan en `discovered-effect-rarity.data.ts` (p. ej. **Flexible Leathercraft** → **Common**, **Recovery Level** → **Rare**); sin entrada siguen Unknown salvo que aplique una inferencia inline. Si un mismo texto dispara varias inferencias de defensa/daño, se usa la rareza más alta.

**Rider de 20 natural sin daño + empujón** (`inline-roll-20-rarity.utils.ts`) — **solo si** tras lo anterior la rareza seguiría en Unknown, y el efecto tiene `mechanic:roll-20` + `mechanic:no-damage` + `mechanic:push` (p. ej. Tetranadon Beak: unarmed, 5 pies, ~5 %): **Common**. Un rider de 20 con daño extra (Ajarakan, 1d4 + push) sigue la tabla de daño.

**Ataque con reaction (natural weapon / unarmed)** (`inline-reaction-attack-rarity.utils.ts`) — **solo si** tras lo anterior la rareza seguiría en Unknown, y el efecto tiene `mechanic:reaction` + (`mechanic:natural-weapon` o `mechanic:unarmed`) (p. ej. Tigerstripe Zamtrios: reaction attack with race natural weapon): **Uncommon**. Si el texto también lista dados de daño (Congalala Strong Fang, 1d8), gana la rareza de daño extra.

**Hold breath underwater** (`inline-hold-breath-rarity.utils.ts`) — **solo si** tras lo anterior la rareza seguiría en Unknown, y el efecto tiene `mechanic:hold-breath` + `mechanic:underwater` (p. ej. _hold breath underwater for twice as long_): **Common**. _Breathe underwater_ (water breathing) no emite `hold-breath` y sigue Unknown salvo otra inferencia.

**Descanso acelerado** (`inline-accelerated-rest-rarity.utils.ts`) — **solo si** tras lo anterior la rareza seguiría en Unknown, y el efecto tiene `mechanic:accelerated-rest` (p. ej. _benefits of a long rest after 4 hours instead of 8_): **Uncommon**. Solo `mechanic:long-rest` (recargas _finish a long rest_) **no** basta.

**Gather resources (MH)** (`inline-gather-rarity.utils.ts`) — **solo si** tras lo anterior la rareza seguiría en Unknown:

| Tags                                       | Rareza       | Ejemplos                                                                            |
| ------------------------------------------ | ------------ | ----------------------------------------------------------------------------------- |
| `mechanic:gather-resources` (sin `:major`) | **Uncommon** | Expert Fisherman (x2 fish), Botanist / Geologist / Archaeologist (instead gather 2) |
| `mechanic:gather-resources:major`          | **Rare**     | Pro Fisherman / Botanist+ (extra 1d4), Pack Rat (party double), Speed Gatherer+     |

**Recuperación de recurso de clase** (`inline-class-resource-rarity.utils.ts`) — **solo si** tras lo anterior la rareza seguiría en Unknown, y el efecto tiene `mechanic:recover-class-resource` (p. ej. Monk: regain expended ki = half PB, 1/long rest): **Uncommon** (mismo suelo que spell-slot sin nivel). Extra use de Channel Divinity sin wording de recover sigue Unknown.

**Attack range** (`inline-attack-range-rarity.utils.ts`) — **solo si** tras lo anterior la rareza seguiría en Unknown:

| Tags                                   | Rareza       | Ejemplos                              |
| -------------------------------------- | ------------ | ------------------------------------- |
| `mechanic:attack-range` (sin `:major`) | **Common**   | Deadeye (+20 ft)                      |
| `mechanic:attack-range:major`          | **Uncommon** | Deadeye+ / underwater (range doubled) |

**Advantage on attack rolls** (`inline-attack-advantage-rarity.utils.ts`) — **solo si** tras lo anterior la rareza seguiría en Unknown, y el efecto tiene `mechanic:advantage` + `mechanic:attack-roll`:

| Activación                                                              | Rareza       | Ejemplos                                |
| ----------------------------------------------------------------------- | ------------ | --------------------------------------- |
| Limited (`active` / BA / reaction; p. ej. Aim Booster ½ PB / long rest) | **Uncommon** | Aim Booster                             |
| Always-on (`passive`)                                                   | **Rare**     | advantage on attack rolls while attuned |

**Movement / speed** (`inline-movement-rarity.utils.ts`) — **solo si** tras lo anterior la rareza seguiría en Unknown, y hay grant de modo (no basta un debuff `its speed is reduced`):

| Tags                                                                                   | Rareza        | Ejemplos                                                                                                             |
| -------------------------------------------------------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------- |
| `walking-speed` (sin major, p. ej. +5)                                                 | **Common**    | Marathon Runner                                                                                                      |
| `burrowing` / `swimming` / `climbing` / `walking-speed`+`major` (+10) / `icy-surfaces` | **Uncommon**  | burrow 10 ft, swim = walk, Spider Climb, Marathon Runner+, climb icy + ignore ice/snow DT (Boots of the Winterlands) |
| `ignore-difficult-terrain` o `movement-climb` sin paquete de hielo                     | **Common**    | ignore DT genérico                                                                                                   |
| `flying` (sin major, &lt;60 ft)                                                        | **Rare**      | flying speed 30 ft                                                                                                   |
| `flying`+`major` (≥60 ft)                                                              | **Very Rare** | flying speed 60–80 ft                                                                                                |

**Luz / darkvision / oscuridad mágica** (`inline-light-darkness-rarity.utils.ts`) — **solo si** tras lo anterior la rareza seguiría en Unknown:

| Tags                        | Rareza       | Ejemplos                                                                   |
| --------------------------- | ------------ | -------------------------------------------------------------------------- |
| `mechanic:light`            | **Common**   | Moon-touched (shed moonlight in darkness), shed bright/dim light always-on |
| `mechanic:darkvision`       | **Uncommon** | darkvision 60 ft (Goggles of Night–adjacent)                               |
| `mechanic:magical-darkness` | **Rare**     | see normally in magical + nonmagical darkness (Gaismagorm)                 |

Si hay varios, gana la rareza más alta. Solo `darkness` / `nonmagical-darkness` (Hide in dim light, snuff light) **sin** light / darkvision / magical-darkness sigue **Unknown**.

**Lanzamiento de hechizos / recuperación de slots** (`inline-spell-rarity.utils.ts`) — **solo si** tras lo anterior la rareza seguiría en Unknown, y el efecto tiene tags `mechanic:cantrip`, `mechanic:spell:lvlN` (nivel real del catálogo) o `mechanic:spell-slot` / `mechanic:spell-slot:lvlN`:

| Nivel del hechizo o slot                                             | Rareza                                                             |
| -------------------------------------------------------------------- | ------------------------------------------------------------------ |
| 0–1 (cantrip / 1st; p. ej. Earth Tremor 1/long rest)                 | **Common**                                                         |
| 2–3, o recuperación de slot sin nivel (p. ej. Arcane Recovery extra) | **Uncommon** (Pearl of Power = slot de 3rd)                        |
| 4–5                                                                  | **Rare** (p. ej. Dimension Door, o recuperar un slot de hasta 4th) |
| 6–8                                                                  | **Very Rare**                                                      |
| 9                                                                    | **Legendary**                                                      |

**Spellcasting focus** (`inline-spellcasting-focus-rarity.utils.ts`) — **solo si** tras lo anterior la rareza seguiría en Unknown, y el efecto tiene `mechanic:spellcasting-focus` (p. ej. _use this weapon as your spellcasting focus_): **Common** (como _Ruby of the War Mage_).

**Bonus plano a AC / spell attack / spell save DC** (`inline-ac-bonus-rarity.utils.ts`, `inline-spell-buff-rarity.utils.ts`) — **solo si** tras lo anterior la rareza seguiría en Unknown. Requiere `mechanic:armor-class` con un `+N` parseable, o `mechanic:spell-buff:*` con `+N` (se ignora el bump _This bonus increases to +N when…_). Bandas al estilo _Cloak of Protection_ / _Rod of the Pact Keeper_:

| +N  | Always-on (`passive`) | Limited (`active` / reaction / BA) |
| --- | --------------------- | ---------------------------------- |
| +1  | **Uncommon**          | **Common**                         |
| +2  | **Rare**              | **Uncommon**                       |
| +3  | **Very Rare**         | **Rare**                           |
| +4+ | **Legendary**         | **Very Rare**                      |

Ejemplos: Rathalos Carapace (+1 AC) → Uncommon; Shield reaction +1 AC → Common; Gravios Jewel (+2 spell attack/DC) → Rare; Amatsu Pleura (+3) → Very Rare.

**Ventaja / bonus vs condición** (`inline-condition-rarity.utils.ts`) — **solo si** tras defensa/daño/hechizo la rareza seguiría en Unknown, y el efecto tiene `mechanic:against-condition` + (`mechanic:advantage` **o** `mechanic:save-bonus`) **sin** `mechanic:immunity` (p. ej. _advantage on saving throws against the poisoned condition_, o _+2 bonus_ vs knocked prone): **Common**.

**Inmunidad a condición** (`inferRarityFromConditionImmunityTags`) — **solo si** tras lo anterior la rareza seguiría en Unknown, y el efecto tiene `mechanic:immunity` + algún `mechanic:condition-*` (p. ej. _immune to the poisoned condition_, _cannot be knocked prone_, _can't be stunned_): **Uncommon**. La inmunidad a un **tipo de daño** sigue la tabla de defensas (Rare / Very Rare); no usa esta regla.

**Fin de DoT / Recovery Level** (`inline-end-dot-rarity.utils.ts`) — **solo si** tras lo anterior la rareza seguiría en Unknown, y el efecto tiene `mechanic:end-dot` (limpia daño continuo al inicio del turno: sangrado, ácido/veneno DoT, fuego, …): **Rare**.

**Iniciativa** (`inline-initiative-rarity.utils.ts`) — **solo si** tras lo anterior la rareza seguiría en Unknown:

| Tags                                 | Rareza       | Ejemplos                                                     |
| ------------------------------------ | ------------ | ------------------------------------------------------------ |
| `mechanic:initiative` (sin `:major`) | **Uncommon** | advantage on initiative rolls (Rejuvenated Beak)             |
| `mechanic:initiative:major`          | **Rare**     | add a d8 + become first in the initiative order (Safi'jiiva) |

**Curación a otros** (`inline-heal-other-rarity.utils.ts`) — **solo si** tras lo anterior la rareza seguiría en Unknown:

| Tags                        | Rareza       | Ejemplos                                                                            |
| --------------------------- | ------------ | ----------------------------------------------------------------------------------- |
| `mechanic:heal-other:minor` | **Uncommon** | Astalos Scissortail (+spell level); Lay on Hands → THP = amount healed              |
| `mechanic:heal-other:major` | **Rare**     | Astalos Scissortail+ (double spell level); LoH shared THP; Malzeno Tail HP transfer |

**Skill / contest utility** (`inline-skill-rarity.utils.ts`) — **solo si** tras lo anterior la rareza seguiría en Unknown:

| Tags                                                          | Rareza     | Ejemplos                                          |
| ------------------------------------------------------------- | ---------- | ------------------------------------------------- |
| `mechanic:skill-bonus`                                        | **Common** | +2 Athletics / Climb / Stealth checks             |
| `mechanic:advantage` + `mechanic:skill-*` o `mechanic:disarm` | **Common** | advantage on Insight; advantage vs being disarmed |

**Mithral / flexible armor** (`inline-mithral-rarity.utils.ts`) — **solo si** tras lo anterior la rareza seguiría en Unknown, y el efecto tiene `mechanic:mithral` (p. ej. _light and flexible_ + sin desventaja en Stealth / sin requisito de Str): **Uncommon** (como _Mithral Armor_ del DMG). Solo `skill-stealth` o “10% lighter / Str reduced by 1” **no** basta.

El badge del diálogo y el filtro **Material Effect Tier** usan la misma función. En **RuneDetailDialog**, si hay filtros de efecto activos (slot, tags same-effect, material-effect tier) y solo un lado de la runa los cumple, el otro efecto se muestra atenuado (`filtered out`) y su botón de **Add to Rune Planner** (arma/armadura/trinket de ese lado) queda deshabilitado.

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

### Amellwind (RaintDM) — implementado

- [x] **Weapon Forge** — Catálogo curated RaintDM + armas custom (localStorage) y export Foundry Item; navegación en sección propia (Sidebar + Home), no bajo Amellwind Homebrew.
- [x] **Items Forge** — Catálogo curated RaintDM (`public/data/raintdm-items/`); UI tabular tipo `/items` (sin carrito ni editor); v1: Magazines de Dual Repeaters.

### Compendio D&D 5e — implementado

- [x] **Spells** — Conjuros desde 5etools con deduplicación y filtros.
- [x] **Classes** — Listado y detalle por variante de fuente.
- [x] **Races / Backgrounds / Feats** — Compendios 5e con dedupe por nombre y variantes por fuente.
- [x] **D&D Items** — Compendio de ítems con carga por fuente (+ catálogo de equipo del builder).
- [x] **Bestiary** — Criaturas oficiales con carga bajo demanda por source book.
- [x] **Xanathar Backstory** — Generador de trasfondo con tablas de XGE.

### En progreso o pendiente

- [~] **Character Builder** — ALPHA: stats, paper doll, runas, DPT, retrato/token; inventario ligado al carrito; armaduras placeholder.
- [x] **Export/Import Foundry VTT** — Actor `character` dnd5e v12 con _matching_ contra catálogos de la app. UI temporalmente deshabilitada en `StatsPanel` (`FOUNDRY_JSON_UI_ENABLED = false`) hasta mejorar el exportador; código intacto.
- [x] **Persistencia de personajes (Builder JSON nativo)** — Export/import de un JSON nativo (`amellwind-builder-character`) que round-trip el estado completo del Builder. Ver `builder/builder-json/`. No incluye portrait/token; formato distinto al actor Foundry.
- [ ] **Armaduras (datos reales)** — Sets completos desde GTMH; hoy el builder usa `armor.placeholder.ts`.
- [ ] **Vista de Combate / Encuentros activos** — Gestión de combate en tiempo real.

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

| Mapper                                             | Entrada (5etools / fuente)                                                 | Salida (entidad app)                    |
| -------------------------------------------------- | -------------------------------------------------------------------------- | --------------------------------------- |
| `MonsterMapper`                                    | objeto crudo de `getMonsterData()` (PDF Patreon 2.0 + nombres solo-GitHub) | `Monster`                               |
| `RuneMapper`                                       | fluff/inset de cada monstruo de `getMonsterData()`                         | `Rune[]` (uno por material)             |
| `WeaponMapper`                                     | ítem con `type: "HW"` en `gtmh_current`                                    | `Weapon`                                |
| `OptionalFeatureMapper`                            | entrada de `optionalfeature[]` en GTMH                                     | `OptionalFeature`                       |
| `SpeciesMapper`                                    | `race[]` + `subrace[]` en GTMH                                             | `Species`                               |
| `BackgroundMapper`                                 | `background[]` en GTMH                                                     | `Background`                            |
| `FeatMapper`                                       | `feat[]` en GTMH                                                           | `Feat`                                  |
| `DowntimeMapper`                                   | entradas de `variantrule[]` (downtime)                                     | `DowntimeActivity[]`                    |
| `MonstieClassFeatureMapper`                        | `classFeature[]` en GTMH                                                   | features de Monstie Sidekick            |
| `MaterialEffectMapper`                             | efectos de material derivados de `mm_current`                              | `MaterialEffect[]`                      |
| `ConditionMapper`                                  | condiciones homebrew en GTMH                                               | `Condition[]`                           |
| `DiseaseMapper`                                    | enfermedades homebrew en GTMH                                              | `Disease[]`                             |
| `SpellMapper`                                      | JSON de conjuros 5etools                                                   | `Spell`                                 |
| `ClassMapper`                                      | JSON de clase 5etools                                                      | `Class`                                 |
| `DndRaceMapper`                                    | `race[]` / `subrace[]` 5etools                                             | `DndRace`                               |
| `DndBackgroundMapper`                              | `background[]` 5etools                                                     | `DndBackground`                         |
| `DndFeatMapper`                                    | `feat[]` 5etools                                                           | `DndFeat`                               |
| `DndOptionalFeatureMapper`                         | `optionalfeature[]` 5etools                                                | `OptionalFeature` (sin ruta)            |
| `mapDndBaseItemToWeapon` / `mapDndBaseItemToArmor` | ítems base 5etools (`dnd-items`)                                           | `Weapon` / `ArmorItem` (equipo builder) |
| _(inline en item.service)_                         | ítems GTMH sin filtrar por tipo                                            | `MHItem`                                |
| _(bestiary / dnd-items)_                           | JSON bestiary/items 5etools                                                | `BestiaryCreature`, `DndItem`           |

> **Nota**: `RuneService.getAllRunes()` cachea el resultado en memoria hasta `clearRuneCache()` (p. ej. tras sync de MM en `App.tsx`). Los compendios 5etools cachean en memoria por servicio hasta recarga de página.

Agregar un mapper nuevo cada vez que se incorpore una entidad al esquema.

### Bootstrap de la aplicación (`App.tsx`)

Al arrancar (`App.tsx`, no `main.tsx`):

1. Se monta `ThemeProvider` y se inicia `syncData()` en un `useEffect`.
2. Mientras sync está activo, `SyncProvider` expone `syncing=true` y `MainLayout` muestra banner “Sincronizando…”.
3. Tras sync: si MM se actualizó → `clearMonsterCache()` + `clearRuneCache()` + `clearMaterialEffectCache()` + `clearConditionCache()` + `clearDiseaseCache()`; si GTMH → `clearSpeciesCache()`, `clearBackgroundCache()`, `clearFeatCache()`, `clearMonstieSidekickCache()` (y demás cachés derivadas de GTMH).
4. Las rutas lazy se montan con `<Suspense fallback={<LoadingScreen />}>` (skeletons). Los listados usan `ListAreaLoading` (`rows` / `cards` / `detail`).

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

**Fuente de datos**: `getMonsterData()` mezcla `mm_current.github` (feed público) con `public/data/mhmm-patreon-2.0/supplement.json` (PDF gratuito de Amellwind, [Loot Tables 2.0](https://www.patreon.com/amellwind/posts/monster-hunter-137502033)). **El PDF gana** por nombre normalizado; GitHub solo aporta nombres que el PDF no tiene. El resultado mezclado se escribe en IndexedDB (`mm_current.data`). Regenerar el overlay con `pnpm build:mm-supplement`.

El dump del PDF aplana listas anidadas de 5etools (p. ej. _Shifting Scales_ de Fatalis) y a veces pega el siguiente `Name (Recharge)` en el texto anterior. `sanitizeNamedEntrySection` (en `mapActorCore`) vuelve a anidar esos hijos bajo el padre y separa acciones pegadas; el JSON de GitHub, que ya trae `type: "list"`, no se toca.

#### Tabla

Mostrar todos los monstruos en una tabla con las siguientes columnas:

| Columna         | Campo fuente         | Notas                                                                                                                                                                                             |
| --------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Name**        | `name`               | Token from `public/mh-tokens` via `resolveMhTokenPath`. Prefixed/suffixed variants (Tempered, Archtempered, Young, Pup, …) reuse the original monster’s token when they have no art of their own. |
| **CR**          | `cr`                 | String: puede ser `"1/2"`, `"0"`, `"19"`, etc.                                                                                                                                                    |
| **Tier**        | calculado desde `cr` | Ver tabla de cálculo abajo.                                                                                                                                                                       |
| **Type**        | `type.type`          | Capitalizar (`"wyvern"` → `"Wyvern"`).                                                                                                                                                            |
| **Environment** | `environment`        | Array → separado por comas. Vacío si no tiene.                                                                                                                                                    |

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
- **Type**: tipos base (`type.type`) como pills planos. Si el tipo tiene subcategorías MH en `type.tags` (p. ej. `wyvern` → flying / brute / fanged), aparece como acordeón expandible con **All {Type}** y pills `Flying Wyvern`, `Fanged Wyvern`, etc. Los valores de filtro usan `type` o `type:tag` en la URL.
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
- Traits (rasgos pasivos), Actions, Bonus Actions, Reactions y Legendary Actions, cada uno en su sección.
- Tabla de loot (carve/capture) si el monstruo la tiene.

### Listado de Runas

**Fuente de datos**: `getMonsterData()` (PDF Patreon 2.0 gana; GitHub rellena nombres ausentes), procesado con `RuneMapper`. La atribución del PDF está en la lista de Runes y de Monsters.

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

- **Name**: input de texto libre, filtrado por coincidencia parcial (case-insensitive) sobre nombre, monstruo y texto de efecto ya parseado. Al cargar `/runes` se precarga un índice (`buildRuneSearchIndex`) para que teclear no vuelva a parsear markup 5etools ni cruzar el catálogo de material effects.
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

- Si `slots` incluye `"A"`: sección **Armor Effect** con el texto del efecto. Tags 5etools `{@spell}`, `{@item}`, `{@condition}`, `{@class}`, `{@race}` se renderizan como hipervínculos a las páginas de esta app (p. ej. `/spells?spell=Dimension+Door`). Además, `DndRichText` auto-enlaza nombres de hechizos en prosa sin tag (`haste spell`, `speak with dead spell`, `mending cantrip`, listas `burning hands (1 rune)`) vía `spell-phrase-links.utils.ts` + catálogo `getListSpells` (nombres de una sola palabra requieren cue `spell`/`cantrip` o un paréntesis de lista para evitar falsos positivos).
- Si `slots` incluye `"W"`: sección **Weapon Effect** con el mismo tratamiento de enlaces.
- Si el material tiene ambos slots, mostrar ambas secciones separadas.
- Sección **Other** (materiales no equipables): mismo `DndRichText` / auto-link de hechizos.

##### Tags del material

- Lista completa de todos los tags, agrupados por categoría.
- Cada tag se muestra como un badge con color diferente según su categoría: clase (azul), tipo de arma (naranja), mecánica (verde).

### Material Effects, Conditions y Diseases

Tres listados de referencia derivados del homebrew Amellwind, con caché en memoria invalidada tras sync de MM/GTMH:

| Feature               | Ruta                                   | Fuente / servicio                                                        | Contenido                                                                                                                                                                                                                                                        |
| --------------------- | -------------------------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Material Effects      | `/material-effects`                    | `material-effect.service.ts` (`MaterialEffectList`)                      | Efectos de materiales de monstruo (slots armadura/arma) consultables sin pasar por la tabla de runas. En `/runes`, la rareza del efecto también puede inferirse de resistencia (Rare) o inmunidad a daño (Very Rare) cuando el texto no cita un efecto nombrado. |
| Conditions + Diseases | `/conditions` (`/diseases` → redirect) | `condition.service.ts` + `disease.service.ts` (`ConditionsDiseasesPage`) | Condiciones, venenos y enfermedades del PDF Patreon 2.0 (el JSON de GitHub rellena nombres ausentes, p. ej. si el capítulo no trae una ficha)                                                                                                                    |

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

Las 14 armas de Monster Hunter del manual GTMH. Cada arma escala de **Common** a **Legendary** mediante una tabla de rarezas embebida en un bloque `inset` dentro de `entries[]`. La UI de armas / Weapon Forge añade una tier previa **Base** (`WEAPON_RARITY_ORDER`: Base → Common → … → Legendary) para features que aplican a todas las rarezas (Switch Mode, Melody, Loading, …). `RARITY_ORDER` (sin Base) sigue usándose en builder/runas/NPC.

**Weapon Forge — export Foundry VTT**: el botón JSON de la lista/dialog de `/weapon-forge` abre un menú: **Forge JSON** (catálogo `public/data/raintdm-weapons/`, un archivo por arma vía `weaponToRawExport`) o **Foundry VTT JSON** (Item `weapon` standalone por rareza, Core **12.331** / dnd5e **4.4.4** vía `FOUNDRY_EXPORT_TARGET`; `exportWeaponFoundryJson` → `buildWeaponFoundryExportBundle` + description/activities helpers). Nombre canónico del Item: `"{Weapon} ({Rarity})"` para **todas** las rarezas incluida Base (p. ej. `Great Sword (Rare)`, `Great Sword (Base)`); archivo siempre `fvtt-Item-{weapon}-{rarity}.json` (p. ej. `fvtt-Item-great-sword-rare.json`) vía `buildFoundryItemFilename` / `downloadFoundryJson` (fuerza el prefijo en cualquier Item). `system.identifier` / `type.baseItem` siguen el stem sin rareza (`greatsword`). Armas Amellwind/RaintDM exportan `system.attunement: "required"` (las de D&D 5e siguen `""`). El item incluye attack **activities** (una por modo de switch si aplica; Versatile PHB usa `damage.versatile`), descripción HTML enriquecida vía `toFoundryDescriptionHtml` (`shared/foundry/description.ts`), features agrupadas por **cadenas de upgrade** (`buildColumnChains`) en **cards HTML** al estilo PHB 2024, `system.description.chat` condensado, `midiProperties` por activity (dialecto Midi **nuevo**: `autoConsume` / `force*Dialog` / …), envelope Foundry (`enrichWeaponActivities`: `macroData`, `ignoreTraits`, `overTimeProperties`, …), flags de item (`dnd5e.riders`, `midi-qol`, `midiProperties`, `exportSource`), AE pasivos, y `applyItemAutomation` si existe overlay por nombre. Ejemplos de contrato en `public/data/foundry-jsons-example/weapons/<weapon-stem>/` (una subcarpeta por arma; no editar a mano como fuente de reglas — sirven de golden files; tests en `foundry-example-parity.test.ts`). `pnpm build:foundry-module` replica esas subcarpetas como Folders del pack Weapons. El catálogo Amellwind reutiliza el mismo builder (`weaponToExportCustomWeapon` → `buildWeaponFoundryItem`).

**Songbook / Melodies (Hunting Horn)**: si el export incluye activity **Recital**, **Solo Recital** o **Encore**, se aplica overlay Songbook (`weapon-forge-foundry-envelope.ts` + `hunting-horn-recital.macro.ts` / ejemplo `hunting-horn-item-macro.js`): renombra el ataque principal a `"Attack"`, embebe **Item Macro** Midi `preTargeting`, y flags `world.hh.songbook` + `world.hh.maxActiveMelodies` (1 con Recital, 2 con Encore, 3 con Magnificent Trio) + `world.hh.maxSoloMelodies` (1 con Solo Recital, 2 con Solo Recital Upgrade; independiente de Encore) + `midi-qol.onUseMacroName`. El diálogo del Songbook muestra **una lista desplegable por slot activo** (sin checkboxes); al subir upgrades que aumenten melodies simultáneas solo aparece un `<select>` extra. Con varios slots, la selección es **exclusiva y dinámica**: al elegir una Melody en un dropdown, esa opción desaparece de los demás (y vuelve a aparecer si se cambia). **Melody of Guile** pide un skill al activar (`needsSkillChoice`). El overlay también inyecta la activity **End Melodies** (`identifier: end-melodies`, activation `special`) en **cualquier rareza** con Songbook, para apagar todas las auras activas sin gastar el Bonus Action de Recital/Encore. Además se descargan **feats resource** por Melodies desbloqueadas (`weapon-forge-melody.export.ts` → `fvtt-Item-melody-of-….json`) con AE aura Active Auras desactivada (`disabled: true`) hasta que Recital/Solo Recital/Encore la active. Catálogo Foundry actual: Might, Swiftness, Precision, Guile, Warding, Focus, Harmful Acid/Cold/Fire/Lightning/Thunder, Clarity, Vigor, Fortitude, Recovery, the Wilds, Resistant Acid/Cold/Fire/Lightning/Thunder (alineado a `public/data/foundry-jsons-example/weapons-resources/melodies/`). En el preview Foundry aparecen bajo la sub-tab **Melodies**.

**Activities de features de combate (chain-first)**: `compileWeaponFeatureActivities` emite **una Activity (y/o AE) por cadena de upgrade**, no por rareza/filas sueltas — excepción: template `counter_spend` (alias legacy `charge_pool_attack`) emite **Gather** (opcional) + **×N botones** (si el rango ≤5) o **una activity con consumption scaling** (rangos anchos) sobre contadores `system.uses`. Gather restaura 1 uso (`consumption` `itemUses` value `-1`), apunta a `self`, y bloquea con Midi `useConditionText` `@item.uses.value < @item.uses.max` al llegar al máximo. Params clave: `itemUsesMax` / `ownsItemUses` / `poolStartsEmpty` / `emitGather` / `spendMin`–`spendMax` / `damageFormula` (por contador) / `advantageOnUse` (con Gather: AE de ventaja en Gather + `dae.selfTarget`; sin Gather: AE en cada ×N) / `durationValue`+`durationUnits` / `rangeUnits` / `targetAffectsType` / `activityImg` / `chatFlavor` (editables en `FeatureAutomationEditor`). Los params de `WeaponForgeFeatureDef.automation` se **mergean** raíz→hoja a la rareza exportada (`upgrade_scaler` solo aporta deltas). Identidad estable Foundry = `chainKey` (raíz); nombre mostrado = hoja activa. `automation.enabled: false` opt-out persistente. **Fuera de alcance (automation on-weapon):** unlocks con `resourceColumn` genéricos (Coatings, Ammo…) — excepciones Songbook Melodies y Switch Axe Phials (`weapon-forge-phial.export.ts`), exportadas como feats aparte. Registro global: `feature-automation.data.ts`. Oleada actual: masteries XPHB, gauges, counter_spend (Charged Slash / ZSD…), Recital Songbook, Switch Axe Phial Gauge/Discharge, mode switch, passives AC/casting, reactions/BA; coatings/ammo siguen parciales. Preview/export etiquetados **Foundry VTT v12**. UI editable en Forge (`FeatureAutomationEditor` + `FeatureActiveEffectEditor` + panel de cadenas).

**Catálogo Amellwind `/weapons`**: export Foundry por rareza desde el diálogo (`WeaponCatalogExportMenu` → mismo compilador; sin UI de edición de automation). Si la rareza emite resources (p. ej. Melodies), el menú Foundry ofrece **Weapon + resources** (arma + un JSON por feat) o **Weapon only**. Diálogos de arma (Amellwind + Forge) y el form de Forge incluyen un tab secundario **Foundry VTT** (`WeaponFoundryPreviewPanel`). El padre construye **un** `FoundryItem` (`buildAmellwindWeaponFoundryItem` en catálogo, `buildWeaponFoundryItem` en Forge) y ese mismo objeto alimenta el preview y la descarga Export (paridad payload). El panel refleja DETAILS + Activity + **Active Effects** leyendo solo campos del item; con `includeBase` el daño mostrado viene de `system.damage.base` del mismo JSON. El export escribe `range.reach` (5 ft, o 10 con `rch`) e `midiProperties.identifier: "attack"` en el ataque principal por defecto.

**Foundry preview — tabs de Weapon Resources**: dentro del tab Foundry, si el bundle emite resources (`buildWeaponFoundryResourceGroups`), aparecen sub-tabs **Weapon** + una tab por tipo (hoy: **Melodies**, **Phials**, **Magazines**). Melodies/Phials son `feat`; Magazines son `consumable` (6 Volleys, patrón Coatings). Ammo / Coatings se añaden al helper cuando tengan export. Cada resource se previsualiza como Item (DETAILS + AE + Raw JSON).

**Switch Axe (Uncommon+)**: overlay `applySwitchAxeOverlay` — AEs indicador **Axe Mode** (default) / **Sword Mode**; sin Activity Sword; golpe Sword = **Phial Discharge** (Attack `2d6` + phial, consume 1); **Fluid Morph** BA alterna modos vía ItemMacro; **Kinetic** recupera uses en hit Axe; 0 charges en Sword aborta y revierte a Axe; ZSD vacía gauge y vuelve a Axe. **Rare:** Expanded Gauge I (`uses` max 7), **ZSD Splash** Save DEX radio 5 ft (trigger desde ZSD), Phials **Exhaust** (AE −10 walk) / **Poison** (Save CON). Macro: `switch-axe-kinetic.macro.ts`. Ejemplos: `weapons/switch-axe/fvtt-Item-switch-axe-uncommon.json`, `weapons/switch-axe/fvtt-Item-switch-axe-rare.json`.

**Charge Blade (Uncommon+)**: overlay `applyChargeBladeOverlay` — AEs indicador **Sword & Shield Mode** (default) / **Axe Mode**; Attacks por modo con **`@mod`** en damage parts; **Switch Mode** BA + deshabilita Integrated Shield en Axe + swap mastery Sap/Cleave; **Elemental Attunement** utility 1/SR (diálogo Acid/Cold/Fire/Lightning; sin elemento por defecto — actualiza `flags.world.chargeBlade.elementalType` y types de Eruption/Discharge/AED); **Phial Charges** recupera 1 en hit Sword; **Guard Point** patrón Shield/Lance; **Rare:** Elemental Discharge (diálogo Yes/No tras hit Axe) + **AED** Activity única con diálogo de cargas (1…available). Macro: `charge-blade.macro.ts`. Ejemplos: `weapons/charge-blade/fvtt-Item-charge-blade-uncommon.json`, `weapons/charge-blade/fvtt-Item-charge-blade-rare.json`.

**Heavy Bowgun (Uncommon+)**: artillería vs Light Bowgun (ráfaga/movilidad). Magazine 4→6→8→10→12 (detrás de LBG; override inline, no heredar 6→8→10→12→15). Ignition máx. 3 (no escala). Uncommon: **Wyvernheart** BA (gasta 1 Ignition; +1d8 si ya impactaste), **Guard** Reaction +1d4 CA (lockout el turno de Wyvernheart), Special Ammo cap 2. Munición Uncommon: Pierce 40 ft; Spread cono 15 ft 1d10; Cluster 2d6 fire; Recover 1d4. Rare: Special 4, Guard 1d6, **Wyverncounter** (Offset: si Guard hace fallar, gasta 1 Ignition y disparas), Poison/Paralysis/Sticky/Slicing 4d6/Wyvern 2d12 (AGMH). VR: Special 6, Wyvernheart +1d10, **Wyvernpiercer** Action (2 Ignition, línea 80 ft +2d10; sin Guard hasta tu próximo turno), upgrades de ammo (Cluster 3d6). Legendary: Special 8, Wyvernpiercer 100 ft +4d10, **Ignition Mode** (PB/LR: +2 Ignition al hit, Guard/Wyverncounter off, Wyvernpiercer como BA). Ejemplos Foundry: `weapons/heavy-bowgun/fvtt-Item-heavy-bowgun-uncommon.json`, `weapons/heavy-bowgun/fvtt-Item-heavy-bowgun-rare.json`, `weapons-resources/ammo-hbg/`. VR/Legendary Forge only por ahora.

**Dual Repeaters (Uncommon+)**: Magazines son **Weapon Resources** consumibles: cada magazine llena las **Charges** del arma (`system.uses` max 6, empieza vacío — UI de Charges en la ficha). Attack gasta 1 Charge. AE `Magazine (Loaded)` marca el tipo cargado (damage type) y riders Rare (p. ej. Blaze Upgrade I → +1d6 fire en AE). Overlay `applyDualRepeatersOverlay` + macro `dual-repeaters-magazines.macro.ts` (on-hit: Cryo/Storm/Slime Upgrade I, Dawnstar, Twilight). Ejemplos: `weapons/dual-repeaters/fvtt-Item-dual-repeaters-uncommon.json`, `weapons/dual-repeaters/fvtt-Item-dual-repeaters-rare.json`, `weapons-resources/magazines/`.

**Magus Staff (Forge RaintDM)**: simple melee quarterstaff-compatible focus (`foc` + Versatile 1d6/1d10 bludgeoning). Common: **Mastery (Sap)** as an _item_ feature (not trained XPHB mastery) — overlay `applyMagusStaffOverlay` + `magus-staff.macro.ts` applies disadvantage on the target's next attack (`1Attack` + `turnStartSource`) after a melee **Attack** hit. Uncommon: **Spell Core Gauge** (max 3, starts empty; clear on SR/LR by setting Spent to max) + **Harvest Magic** (special activity; Item Macro dialog recovers 1 counter, or 2 if the cantrip target was within 15 ft) + **Arcane Discharge** (scaled damage rider, spend 1…max, `1d6` per counter of the spell's type). Rare: **Expanded Gauge** (max 5), **Improve Casting** (+1 spell attack / save DC AE while holding), **Offset Ward** (Reaction: Item Macro spends 2, applies +5 AC with `isAttacked`; on a miss caused this way, cast a Cantrip spell-attack — honor-system). Foundry examples: `weapons/magus-staff/fvtt-Item-magus-staff-common.json`, `weapons/magus-staff/fvtt-Item-magus-staff-uncommon.json`, `weapons/magus-staff/fvtt-Item-magus-staff-rare.json`. VR/Legendary Forge only for now.

**Longsword (Forge RaintDM)**: 1d10 slashing two-handed (no Heavy — the fast two-hander vs Great Sword). Common: Mastery (Sap). Uncommon: **Spirit Gauge** (max 6, starts empty, +1 on a _normal_ hit; dissipates after 1 min / Incapacitated) + **Spirit Blade** (on a normal hit, spend N spirit for +N d4 slashing; d6 at Rare). Rare: **Foresight Slash** (Reaction when hit by melee: spend 2, 1d8 to AC; on a miss caused this way, one counter-attack and regain 1 spirit). Overlay `applyLongswordOverlay` + `longsword.macro.ts`: Attack hit recovers Spirit Gain; Spirit Blade is a scaled **damage** rider (not a second attack); Foresight spends 2 in ItemMacro, applies +1d8 AC (`isAttacked`), refunds 1 on miss, and emits **Foresight Slash: Counter**. Very Rare: fill +2; **Spirit Thrust** / **Spirit Roundslash** / **Spirit Helm Breaker** each **replace one Attack-action attack** (independent; optional combo +1d6 on Helm Breaker if another Spirit technique already resolved this action). No Prone/Stun — Sap is the control. Legendary: **Foresight Slash / Spirit Thrust / Spirit Roundslash Upgrade I** (each generates 1 spirit on a successful hit — Counter hit for Foresight, primary attack hit for Thrust/Roundslash) so Helm Breaker's 5+ spirit **Spirit Release Slash** threshold can cycle; overlay flag `techniqueSpiritOnHit`. **Special Sheathe (Iai Spirit Slash)** BA stance + Reaction; **Spirit Release Slash** (Helm Breaker extra 5d6 if 5+ spirit before the spend). Column **Spirit Gain** is a rarity stat chip, not a feature list. `public/data/raintdm-weapons/longsword.json`. Foundry examples: `weapons/longsword/fvtt-Item-longsword-uncommon.json`, `weapons/longsword/fvtt-Item-longsword-rare.json`. VR/Legendary Forge only for now.

#### Entidad `Weapon`

| Campo                         | Descripción                                                                                                                                                                                                                                                                          |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `name`, `source`, `page`      | Identificación 5etools                                                                                                                                                                                                                                                               |
| `dmg1`, `dmg2`                | Notación de daño (ej. `1d8`, `2d6` en modo versatile)                                                                                                                                                                                                                                |
| `modes`                       | Modos de combate MH (Switch Axe, Charge Blade…): `{ label, damage, dmgType?, isTwoHanded?, blocksOffHand?, hasShield? }[]`. Distinto de Versatile (`V`+`dmg2`). Preferido sobre tablas hardcodeadas por nombre. `dmgType` por modo opcional; si falta, hereda el `dmgType` del arma. |
| `dmgType`                     | `S` / `P` / `B` (Slashing, Piercing, Bludgeoning)                                                                                                                                                                                                                                    |
| `properties`                  | Códigos MH/D&D: `H`, `2H`, `F`, `L`, `R`, `V`, `A`, `S`, `T`, `MHL` (`MHL` → label **Loading**, descripción en `PROPERTY_DESCRIPTIONS`)                                                                                                                                              |
| `weight`, `valueCp`           | Peso y valor en copper pieces                                                                                                                                                                                                                                                        |
| `acBonus`, `range`, `isFocus` | Campos opcionales según el arma                                                                                                                                                                                                                                                      |
| `description`                 | Texto superior parseado sin marcado 5etools                                                                                                                                                                                                                                          |
| `rarityRows`                  | Filas de la tabla inset: rareza (incl. opcional **Base**), slots de runa, columnas dinámicas (stats, features, ammo, phials, etc.)                                                                                                                                                   |
| `baseFeatureNames`            | Nombres de `{@optfeature ...}` en la descripción (features que aplican a todas las rarezas); en forge se sincronizan con la fila **Base**                                                                                                                                            |

`FEATURE_COL_KEYS` identifica columnas de tipo feature: `features`, `single features`, `splint features`, `notes`, `ammo`, `coatings`, `phials`, `available`. Longsword **Spirit Gain** is a numeric rarity stat chip (`isWeaponSpiritGainColumn`), not a feature list.

Columnas de bonus numérico (`Bonus`, `Bonus to Hit`, `Bonus to Damage`, `AC Bonus`, `Bonus AC`) no son features: van en la cabecera de rareza (`+2 to Hit and Damage | +3 to AC`). El `Bonus` / to-hit de AGMH es el bonus mágico de arma (ataque y daño).

`buildColumnChains` agrupa por rareza y anida upgrades (`Foo Upgrade I`) bajo su base. Si un upgrade vive en **Features** pero el ítem base está en otra columna (**Phials**, Ammo, Coatings…), p. ej. `Power Phial Upgrade` ↔ `Power Phial (Costs 2)`, se reparenta a esa cadena (`normalizeFeatureMatchKey`). Las listas trailing `Unlocked Ammo` / `Unlocked Coatings` / etc. se muestran como la columna recurso (tipos expandibles). Si además existe una columna feature con el mismo nombre (caso Light Bowgun: columna **Ammo** con `Ammo (LBG)` / Capacity Increase y tipos en Unlocked Ammo), esa columna feature se remapea a **Features** para no mezclar reglas con munición/recursos.

`resolveWeaponBaseFeatures` también inyecta properties MH con descripción (p. ej. **Loading** desde `MHL`) junto a las `{@optfeature}` base. Features ya listadas en columnas de rareza (p. ej. **Ammo (LBG)** en la columna Ammo) no se reinyectan en Features. En el diálogo, si no hay fila **Base**, se inyecta una con esas features (`weapon-base-rarity.utils.ts`); si ya existe, la sección legacy “Base Features” se omite y el contenido vive en esa tier. Los bloques 5etools `{ type: "abilityDc" }` (Ammo/Coating save DC) se renderizan vía `formatAbilityDcText` en `fivetools-parser.ts`.

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

| Función              | Descripción                            |
| -------------------- | -------------------------------------- |
| `getAllWeapons()`    | Filtra `HW`, mapea y cachea en memoria |
| `clearWeaponCache()` | Invalida caché tras sync               |

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

#### Weapon Resource pricing (Ammo Vendor)

Precios de venta canónicos para consumibles de `public/data/foundry-jsons-example/weapons-resources/` (Ammo LBG/HBG, Coatings, Magazines) viven en `src/features/amellwind/shops/data/weapon-resource-pricing.data.ts`. El Ammo Vendor (`shops.data.ts`) construye sus secciones con `buildAmmoVendorSections()` desde esa tabla (+ filas AGMH shop-only: Tranq, Armor/Demon, Pierce lvl 2–3, Recover lvl 2, Arrows).

| Tier                   | Precio             | Ejemplos                                           |
| ---------------------- | ------------------ | -------------------------------------------------- |
| Basic bulk ×20         | 1 gp               | Normal Ammo                                        |
| Pierce bulk ×20        | 2 gp               | Pierce Ammo                                        |
| Elemental / Spread ×20 | 3 gp               | Flaming, Freeze, Water, Thunder, Dragon, Spread    |
| Sticky / control débil | 1 gp/unidad        | Sticky, Explosive/Sticky                           |
| Status                 | 4 gp/unidad        | Paralysis, Poison                                  |
| Utility / fuerte       | 5 gp/unidad        | Sleep, Recover, Cluster, Slicing                   |
| Specialty HBG          | 10 gp/unidad       | Wyvern                                             |
| Coating utility        | 1 gp               | Power, Close Range                                 |
| Coating elemental      | 2 gp               | Fire, Cold, Lightning, Acid                        |
| Magazine               | 2 / 5 / 15 / 20 gp | Normal / elemental / Upgrade I / Dawnstar·Twilight |

Foundry `system.price` + `system.quantity` de los packs deben coincidir con esa tabla. Phials y Melodies son `feat` (no vendibles).

#### Contexto `CartContext`

Estado global del carrito (`CartEntry[]`): nombre, costo, peso, cantidad, tienda de origen. Compartido entre **ItemList** y **ShopList**.

#### Pantallas

- **`ItemList`**: tabla filtrable de todos los ítems GTMH, panel lateral de detalle, añadir al carrito.
- **`ShopList`**: pestañas por tienda, búsqueda global, tooltips con descripción cruzada desde el catálogo de ítems, añadir al carrito.
- **`CartDrawer`**: drawer del carrito accesible desde ambas pantallas.

#### Service (`item.service.ts`)

| Función           | Descripción                           |
| ----------------- | ------------------------------------- |
| `getAllItems()`   | Mapea todo el array GTMH a `MHItem[]` |
| `formatValueGp()` | Formatea `valueCp` a gp legible       |

---

### Items Forge (RaintDM)

**Ruta**: `/item-forge`
**Fuente de datos**: `public/data/raintdm-items/` (`manifest.json` + un JSON por categoría, p. ej. `magazines.json`, `traps.json`). Fetch en runtime; sin IndexedDB ni editor.

Catálogo curated de variantes RaintDM sobre ítems Amellwind. La UI combina **lista de ítems** y **Combo List**: búsqueda, tabs por `typeLabel`, tabla Name/Rarity/Cost/Weight + Ingredient 1/2/DC/Qty, panel de detalle. **Sin carrito** y **sin crear/editar**. Las recetas usan recursos e ítems Amellwind y las mismas reglas de tirada del Combo List.

#### Entidad `RaintdmItem`

Extiende `MHItem` (`name`, `source`, `type`, `typeLabel`, `rarity`, `valueCp`, `weight`, `entries[]`) con `raintdm?` (`author`, `kind`, `magazineKey`, `trapKey`, `chargesPerMagazine`, `damageType`, `baseWeapon`) mapeado desde `_raintdm`, y `crafting?` (`tool`, `item1`, `item2`, `dc`, `quantity?`) desde el campo top-level `crafting` del JSON.

- Tipo `MHMAG` → label **Magazine (Repeaters)**. Tipo `MHTRAP` → **Traps**. Tipos desconocidos → **Misc**.
- v1: 11 magazines de Dual Repeaters (rework RaintDM; rareza = unlock del arma; 0.5 lb). Precio por rareza: Normal **2 gp**, elemental Uncommon **5 gp**, Upgrade I **15 gp**, Dawnstar/Twilight **20 gp**. El export Foundry de magazines sigue saliendo de Weapon Forge (`priceGp` en `DUAL_REPEATERS_MAGAZINE_DEFS`).
- Crafting magazines: **Herbalism Kit** (igual que DR AMMO AGMH). Specialty = receta AGMH (recurso elemental + Insect Husk, DC 12, qty 1). Normal = Huskberry + Insect Husk (casing). Upgrade I = Catalyst + recurso elemental, DC 15.
- v2: 5 hunter traps (rework RaintDM de AGMH). **Trap Tool** 120 gp / 2 lb (componente, sin receta). **Pitfall Trap** 250 gp DC 14 Str (Prone + Restrained until start of next turn); **Shock Trap** 420 gp DC 14 Con (Incapacitated + Speed 0 until start of next turn). **+** versions: Uncommon, DC 16, until end of next turn; Shock+ also deals 2d8 lightning on trigger. Accustomed: after the effect ends, immune to that trap's base version until a Short Rest; a + still works, with Advantage on the repeat save at the start of the next turn. Placement is an Action, camouflaged DC 15 Perception, lasts 1 hour or until retrieved unused. Crafting takes 10 minutes with **Tinker's Tools**: Pitfall = Net + Trap Tool DC 12; Shock = Thunderbug + Trap Tool DC 12; + = base trap + Trap Tool DC 15.
- **Foundry module**: magazines already live in the **Weapon Resources** pack. Hunter traps ship in the **Items Forge** pack (`public/data/foundry-jsons-example/items-forge/`, `pnpm build:foundry-module`). Set Trap / Retrieve are Item Macros; canvas trigger, camouflage notices, and 1-hour expiry run from `scripts/hunter-traps.js`. Combo Crafting can import Trap Tool / Pitfall / Shock from that pack by name.

#### Service (`item-forge.service.ts`)

| Función                 | Descripción                                                            |
| ----------------------- | ---------------------------------------------------------------------- |
| `getAllForgeItems()`    | Fetch manifest + archivos curated → `RaintdmItem[]` (caché en memoria) |
| `clearForgeItemCache()` | Invalida la caché                                                      |

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

| Función                  | Descripción                        |
| ------------------------ | ---------------------------------- |
| `getAllResourceTables()` | Tablas por categoría con footnotes |
| `searchResources(query)` | Búsqueda cross-categoría           |

---

### Entornos (Environments)

**Ruta**: `/environments`
**Fuente de datos**: `environment.data.ts` (estático).

Biomas del sistema de cacería con reglas de exploración, clima y tablas por nivel de party.

#### Entidad `Environment`

| Campo                                            | Descripción                                                                                                                       |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `name`, `biome`                                  | Identificación y tipo                                                                                                             |
| `navigationDC`, `encounterDC`, `investigationDC` | DCs de exploración                                                                                                                |
| `totalResources`                                 | Recursos disponibles en el bioma                                                                                                  |
| `commonWeather`                                  | Clima habitual                                                                                                                    |
| `specialRules[]`                                 | Reglas especiales (`name` + `description`)                                                                                        |
| `weatherTable[]`                                 | Tabla opcional de clima (roll + resultado)                                                                                        |
| `levelTiers[]`                                   | Por rango de nivel: monstruos comunes, tabla de recursos (`ResourceColumn` + `ResourceRow`), tabla de encuentros (`EncounterRow`) |

`ENVIRONMENT_COLORS` asigna paleta visual por nombre de entorno (Ancestral Steppes, Jungle, Volcano, etc.).

#### Pantalla

- **`EnvironmentList`**: tarjetas/grid filtrable por búsqueda.
- **`EnvironmentDetailDialog`**: DCs, reglas, clima, tablas por tier de nivel.

---

### Planificador de runas (`BuildDrawer`)

**Ubicación**: montado en **`RuneList`** (`/runes`), no en `MainLayout`.
**Estado**: `RuneBuildRouteLayout` (`RuneBuildProvider`) envuelve `/runes` y `/builder`.

Permite simular un set de equipo con materiales de monstruo **sin** depender del Character Builder.

#### Slots y rareza de equipo

| Slot      | Runas según rareza del equipo        |
| --------- | ------------------------------------ |
| Weapon    | 1–5 slots (Common → Legendary)       |
| Armor     | 1–5 slots                            |
| Trinket 1 | 1 runa (material de arma o armadura) |
| Trinket 2 | 1 runa                               |

`RARITY_SLOTS`: common=1, uncommon=2, rare=3, very rare=4, legendary=5.

#### Validación (`build.validation.ts`)

Grupos de tags **mutuamente excluyentes** al colocar materiales. El match usa **prefijo** (`mechanic:extra-damage` cubre también `…:minor` / `…:major`, igual para `mechanic:spell-buff`).

- **Armadura**:
  1. resistencia / reducción / inmunidad elemental (no inmunidad a condición)
  2. ventaja o inmunidad vs una condición
  3. bonus AC
  4. efectos de runa-charges
- **Arma**:
  1. efecto al sacar 20 natural (`mechanic:roll-20` o `mechanic:critical`) — exento de la regla 2
  2. daño extra / condición on-hit / efecto al impacto (el daño extra condicionado a una condición ya presente no cuenta como “extra damage”)
  3. efectos de runa-charges
  4. bonus a spell DC / spell attack (`mechanic:spell-buff`)

`wouldViolateRule()` avisa en el diálogo al añadir (Rune Builder **permite** añadir y marca la build como inválida; Character Builder puede bloquear la asignación). El drawer muestra alertas con los materiales en conflicto.

#### UI

Drawer lateral colapsable: selectores de rareza, filas de slots, resumen de efectos parseados, botón limpiar build. Desde **RuneList** / **RuneDetailDialog** se pueden añadir runas al planificador. Con filtros de efecto activos en el catálogo, el diálogo atenúa el lado que no matchea y deshabilita su botón de añadir (sigue permitiendo quitar si ya estaba en el build).

**Export Foundry** (`BuildDrawerFooter` → `downloadAllBuildRuneJsons` / `buildRuneFoundryItem`): descarga un Item `equipment` por runa del build. **Solo descripción** (HTML enriquecido); sin activities ni Active Effects. Las automatizaciones curadas viven en `public/data/foundry-jsons-example/runes`.

---

### Character Builder (ALPHA)

**Ruta**: `/builder`
**Estado**: `BuilderInventoryProvider` global en `MainLayout` (Purchase del carrito) + `CharacterBuilderProvider` solo en `/builder` vía `BuilderRouteProviders` (spellcasting/autosave/syncs; flush de autosave al salir) + `RuneBuildProvider` vía `RuneBuildRouteLayout` (`/runes` + `/builder`). El Sidebar **no** muestra badge de inventario sobre Builder.

Herramienta experimental para equipar armas/armadura/runas y estimar **daño por turno (DPT)**.

#### Layout (`BuilderPage`)

Grid de tres columnas en desktop:

| Columna   | Componentes                                                                                                                                             |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Izquierda | `StatsPanel`, `BuilderImagePanel`, `BuilderSavingThrowsPanel`, `BuilderSkillChecksPanel`                                                                |
| Centro    | `BuilderCenterPanel` (paper doll, equipamiento + biblioteca)                                                                                            |
| Derecha   | `BuilderDerivedPanel`, `BuilderDamagePanel`, `BuilderInventoryPanel`, `BuilderOtherProficienciesPanel`, `BuilderLanguagesPanel`, `BuilderDefensesPanel` |

Encima del grid: `CharacterCreationTipsPanel` con consejos de creación.

#### Inventario del builder (`BuilderInventoryContext`)

- **Fuente de verdad**: líneas del **`CartContext`** (ítems comprados/añadidos en Shops/Items). Purchase pasa por `CartPurchaseBridge` (`CartPurchaseContext`); `CartDrawer` no importa el Builder.
- Resuelve nombres del carrito a `Weapon[]` y `ArmorItem[]` vía `cart-equipment.resolver`.
- Con Amellwind Homebrew, el catálogo de armas es `getAllForgeWeapons()` + `getAllWeapons()` (forge primero en lookups por nombre).
- Armaduras no GTMH: lista inicial desde `armor.placeholder.ts`.

#### Modelo `Character` (`builder/models/Character.ts`)

- Nivel 1–20, ability scores, proficiency bonus calculado.
- Modificadores derivados, AC base, iniciativa, ataques por turno (con override manual).

#### Equipo (`character.types.ts`)

| Tipo              | Campos clave                                               |
| ----------------- | ---------------------------------------------------------- |
| `EquippedWeapon`  | `weapon`, `rarity`, `runeSlots`, `runes[]`, `useVersatile` |
| `EquippedArmor`   | `armor`, `runes[]`                                         |
| `EquippedTrinket` | `name`, `rune`                                             |
| `ArmorItem`       | placeholder hasta datos GTMH reales                        |

Slots: `mainHand`, `offHand`, `armor`, `trinket1`, `trinket2`.

Reglas de manos: armas `2H` bloquean off-hand; armas `V` (versatile) permiten modo a una o dos manos.

Con **Amellwind Homebrew** activo, la librería de armas (`WeaponLibraryPanel`) muestra por defecto el catálogo del **Weapon Forge** (curated raintdm + custom de localStorage); el catálogo AGMH (`getAllWeapons()`) se elige desde **Filters → Catalog** (`Weapon Forge` / `Base (AGMH)`). La sección Inventory de esa librería filtra por el mismo catálogo (`isWeaponForgeWeapon`) para no mezclar badges `RAINTDM`/`AGMH` ni ocultar un catálogo por colisión de nombre con el otro. El detalle equipado (`WeaponLibraryDetail`) para armas Forge usa `customFeatures` + `includePrerequisiteMatches: false` (paridad con `WeaponForgeDialog`), sin inyectar optional features AGMH por nombre. Sin homebrew, sigue cargando armas D&D (`getDndWeapons`). Lo mismo aplica a feats (Amellwind / D&D 2014 / D&D 2024) y species/background (Amellwind / D&D): el conmutador de catálogo vive en el diálogo Filters, no como pills en el título de la library.

#### Randomizer (`useCharacterRandomizer`)

Botón dados en `StatsPanel`. Disponible en **ambos** modos (Amellwind y D&D). Conserva el nivel actual, hace `resetBuild` y rellena clase/subclase, ASI point-buy, skills, idiomas, optional features, origin feats, hechizos, dotes de nivel y starting equipment del carrito (no equipa armas/armadura en el paper doll).

Los slots de dote de nivel (`buildFeatSelectionsForLevel`) solo eligen dotes **General** / **Epic Boon** 2024 que cumplen `meetsFeatPrerequisites` para el nivel del slot y los ability scores ya asignados (p. ej. no Epic Boons bajo 19; no Fighting Styles / Origin en slots ASI). Requisitos no verificables automáticamente (proficiency, feature, race, …) excluyen esa rama OR del pool.

- **D&D**: species/backgrounds 5e con ratings RPGBOT; lineage spells; background ASI.
- **Amellwind**: species AGMH (`pickAmellwindSpecies` por saves/abilities relevantes); background preferido Hunter's Initiate (`pickAmellwindBackground`, si falta → aleatorio); skills/tools/idiomas del homebrew; Origin Feat de trasfondo AGMH (siempre choose 2024); facción la setea el slice de identity al aplicar el background.

#### Completeness / tests

Fuente de verdad: `evaluateBuildCompleteness` (`builder/utils/build-completeness*`), consumida por `BuildCompletenessContext` (highlights + bloqueo de export). Tests Vitest en `build-completeness.test.ts` (`pnpm test`). Checklist agente: `.agents/skills/builder-validation/`.#### Componentes

| Componente                                                                          | Rol                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `StatsPanel` / `AbilityScoresSection`                                               | Nivel, ability scores, AC, iniciativa, ataques/turno; menú JSON (Builder JSON activo; Foundry VTT deshabilitado temporalmente)                                                                                                                                                                                                                                                                                           |
| `BuilderImagePanel`                                                                 | Sube retrato y token (base64 data URL) que alimentan el export de Foundry                                                                                                                                                                                                                                                                                                                                                |
| `BuilderSavingThrowsPanel` / `BuilderSkillChecksPanel`                              | Saving throws y skills con competencia/expertise                                                                                                                                                                                                                                                                                                                                                                         |
| `BuilderDerivedPanel`                                                               | Stats derivados (proficiency, modifiers, etc.)                                                                                                                                                                                                                                                                                                                                                                           |
| `BuilderCenterPanel` / `PaperDoll`                                                  | Silueta con slots, paneles de detalle de arma/armadura. **Spellcasting (unificado)**: slots de clase/Pact Magic + grants de species en el mismo grid. Al abrir un slot, `SpellLibraryPanel` muestra grants bloqueados (species / subclass always-prepared / optional features) con el mismo estilo (candado + badge verde); la lista Available solo si el slot es elegible (`allowSpellPicks` / `isSpellSlotChoosable`). |
| `BuilderItemLibraryPanel`                                                           | Biblioteca de equipo desde carrito                                                                                                                                                                                                                                                                                                                                                                                       |
| `BuilderDamagePanel`                                                                | Desglose DPT, críticos, fuentes de daño                                                                                                                                                                                                                                                                                                                                                                                  |
| `BuilderInventoryPanel`                                                             | Inventario derivado del carrito (overflow de equipo)                                                                                                                                                                                                                                                                                                                                                                     |
| `BuilderOtherProficienciesPanel` / `BuilderLanguagesPanel` / `BuilderDefensesPanel` | Competencias varias, idiomas, resistencias/inmunidades. **Other Proficiencies**: grants `any` (artisan tools, gaming sets, martial/simple weapons, …) se eligen con **combo searchable** desde catálogos 5etools (`chooseable-tools-weapons.ts`), no texto libre.                                                                                                                                                        |
| `RuneAssignmentPanel`                                                               | Asignar/quitar runas por slot con validación                                                                                                                                                                                                                                                                                                                                                                             |

**Library (class / species / background / feats)**: el detalle marca features/traits/párrafos que otorgan competencias (badge _Proficiency_ + borde ámbar) y muestra un resumen estructurado (`LibraryProficiencySummary`) cuando hay grants parseados. En slots ASI / dote de nivel, `FeatLibraryPanel` lista solo categorías **General** / **Epic Boon** (`isGeneralFeatSlotCategory`); Fighting Styles (`FS` / `FS:*`) y Origin Feats van por optional-feature slots u origin-feat slot, no por el picker genérico.

#### Resolución de especie y dotes

- **`useResolvedSpecies` / `resolveSpeciesParts`** — resuelven la especie seleccionada contra los catálogos de species MH y razas D&D (con subraza opcional), con precedencia `mhSpecies ?? dndRace`, y exponen nombre de display y traits fusionados.
- **`useActiveResolvedFeats`** — resuelve las dotes activas no-ASI (origin feats de especie/trasfondo + slots elegidos) a objetos `Feat` completos; fuente única para los hooks derivados de HP/velocidad.
- **`computeEffectiveAbilityScores` / `useEffectiveAbilityScores`** — scores finales (base + Tasha/species/background ASI + feat ASI + ability increases de dotes con elección, p. ej. Piercer STR/DEX). Fuente de verdad para modificadores de AC, HP, iniciativa, skills/saves, combate/DPT, spellcasting y exports (PDF / Foundry). `character.abilities` sigue siendo solo la generación base editable.

#### Export / Import a Foundry VTT

El builder puede **exportar** el personaje a un actor `character` de **Foundry VTT (sistema dnd5e v12 / 4.4.4)** e **importar** de vuelta un JSON de actor. Botones en el `StatsPanel`.

**Contrato JSON + módulos**: el JSON embebe schema dnd5e (stats, items, activities, descriptions, AE) y **referencia** comportamiento de módulos (`midiProperties`, `flags.midi-qol.*` / `flags.dae.*`, `flags.itemacro`, nombres canónicos para CPR/GPS/AA, content links `@item[…]`). Sin esos módulos el actor importa “plano”; con el stack activo las referencias cobran vida. Núcleo compartido: `src/shared/foundry/` (`FOUNDRY_EXPORT_TARGET`, `downloadFoundryJson`, tipos, midi, Item Macro, `applyFoundryModuleCompat`, enrichers, mappings, icons). Catálogo de módulos: `shared/foundry/module-requirements.ts` + UI `FoundryModuleRequirementsNotice`.

| Capa                   | En el JSON                                                                                                                                                 | Módulo destino                                                                                                                       |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Schema / activities    | Embebido                                                                                                                                                   | dnd5e 4.4.4                                                                                                                          |
| Midi workflow          | `midiProperties`, AE midi flags, triggered activities, `[pass]ItemMacro`                                                                                   | midi-qol **12.4.27+** (verificado 12.4.64) + libWrapper + socketlib                                                                  |
| Item Macro             | `flags.itemacro.macro` + `flags.midi-qol.onUseMacroName`                                                                                                   | itemacro **2.0–2.2** (Foundry 12). Desactivar sheet-hook y override-default-execution                                                |
| DAE / expiry           | `flags.dae.*`, duration                                                                                                                                    | DAE + Times Up                                                                                                                       |
| Auras (v12)            | `flags.ActiveAuras.*` on AE                                                                                                                                | Active Auras (GPS v12 lo requiere)                                                                                                   |
| Content links en texto | `@variantrule[…]`, `@item[…]`, `@spell[…]`, `@book[…]`                                                                                                     | Plutonium 12.x                                                                                                                       |
| Rolls clickeables      | `[[/r 2d4+2]]`, enrichers dnd5e                                                                                                                            | Foundry core + dnd5e                                                                                                                 |
| Deep links             | `<a href="https://amellwind-…/spells?spell=…">` (Toolbox)                                                                                                  | Navegador                                                                                                                            |
| Premades               | Nombres EN + `system.source.rules` (2014 vs 2024 según libro) + `system.identifier`. **No** se pre-estampan flags `chris-premades` / GPS “already applied” | CPR (Medkit) **Foundry 12 / dnd5e 4.4.x**; GPS **1.0.1–1.0.56**. Tras importar: Actor Medkit. Añadir GPS como compendio extra de CPR |
| Animaciones            | Nombres EN + flags toolbox                                                                                                                                 | AA + Sequencer + JB2A                                                                                                                |

`applyFoundryModuleCompat` (actor export) completa midiProperties (conjuros: `magicEffect` / `magicDamage`), alinea `system.source.rules` para el Medkit, normaliza Item Macro 2.x y deja `flags.amellwind-toolbox.compat`. El Weapon Forge usa el mismo helper en modo `light` para no romper la paridad de los JSON de ejemplo. Homebrew MH (armas con Item Macro propio) no entra en CPR/GPS por nombre; Sentinel / War Caster / Polearm Master siguen con nombre inglés exacto para Opportunity Attack de GPS.

- **Description enrichers** (`shared/foundry/description.ts`): `toFoundryDescriptionHtml` convierte tags 5etools `{@variantrule Advantage|XPHB}` → `@variantrule[Advantage|XPHB]`, `{@dice 2d4+2}` / dados sueltos → `[[/r …]]`, `{@book …}` / `{@adventure …}` → `@book[…]` / `@adventure[…]` (Plutonium), `{@spell}` / `{@item}` / `{@condition}` / `{@class}` / `{@race}` / `{@filter …}` → `<a href>` a esta Toolbox (`/spells?spell=Dimension+Door`, `/weapons?weapon=…`, etc.; origen `VITE_PUBLIC_SITE_URL` o el deploy de Vercel). Helpers de layout: `foundryDividerHtml()` (`<hr>`), `foundryRarityTitleHtml()` (colores Foundry/WoW por rareza), `foundryFeatureCardHtml` / `foundryChatFeatureCardHtml` / `foundryUpgradeBlockHtml` (cards inline para cadenas de features de armas), `foundryActivationLeadHtml` + `formatFeatureBodyHtml` (lead PHB + listas `-`/`•`). **No** usa `parseFiveToolsMarkup` (que strippea tags para la UI de la app). Todas las descriptions de export (feats, spells, weapons, runes, …) pasan por este pipeline.
- **Identity fluff (clase / subclase / raza / trasfondo)** (`builder/foundry-export/fluff-description.ts` + `fluff-lookup.ts` + `identity-description.ts`): al exportar se arma una description estilo Plutonium: arte 5etools (lead image → lore → resto con captions) + **tabla de progresión** de la clase + features `Level N: Name` con entradas crudas (`ClassFeatureEntry.rawEntries`, tags `{@…}` intactos). Raza/especie: fluff + traits; trasfondo: fluff + features. `img` del item usa la primera ilustración.
- **Feature grouping + icons**: cada feature de clase/subclase/raza/trasfondo lleva `flags.dnd5e.advancementOrigin` apuntando al item padre (y al ItemGrant), para que la hoja Foundry las agrupe bajo Class / Species / Background en vez de **Other Features**. Iconos por categoría (`foundry-icons.ts`: class/subclass/race/background/feat). Picks de optional features (Metamagic, …) se agrupan bajo la clase.
- **Item / spell / feat images** (`foundry-icons.ts` + fluff maps en `fluff-lookup.ts`): `img` de spells/dotes usa arte 5etools cuando existe; si no, fallback por escuela (spells) o tipo. **Armas D&D** prefieren iconos core de Foundry por nombre base (p. ej. spear → `spear-flared-green.webp`) frente al fluff de libro (recorta mal en thumbnails). **Equipo nombrado por slot** (gauntlets, gloves, helm, boots, cloak, ring, amulet) usa iconos core `icons/equipment/...` (p. ej. `gauntlet-tooled-leather-brown.webp`) en el actor exportado, no mh-icons. **Inventario/loot** sin fluff resuelve por tipo/nombre (`A`/bolts/arrows → munición, quiver → carcaj, GS/gaming set → dados, packs, etc.) en vez del saco genérico. **Armas e ítems de cazador Amellwind** siguen con su icono/`mh-icons` cuando aplica.
- **Weapon Mastery (D&D 5e)** (`weapon-mastery.data.ts` + `buildWeaponItem`): en armas `contentSource: "dnd"` se rellena `system.mastery` (clave Foundry, p. ej. `sap`) y se añade a `system.description` el bloque **_Mastery: Sap._** + texto XPHB (tags `{@…}` → enrichers). Las armas Amellwind no reciben este apéndice (ya traen descripción propia). Las picks de Weapon Mastery del builder van a `traits.weaponProf.mastery.value` (baseItem slugs).
- **Feature uses / activities** (`feature-usage.utils.ts` + `buildFeatItem`): parsea la description (tags 5etools o HTML) para rellenar `system.uses` (`max` + `recovery` lr/sr/day) y, si hay activación o usos limitados, una activity `utility` con consumo `itemUses`. Patrones cubiertos: Bonus Action / Reaction / Action / Utilize action, “twice”, “Proficiency Bonus”, “Charisma modifier (minimum of once)”, “once… until Long Rest”, “has ten uses”. Recursos de clase (Sorcery Points, Ki, …) siguen en scale values, no como usos del feat.
- **Spells (prepared vs known)** (`spell-export.utils.ts`): clases que **preparan** (Cleric/Druid/Wizard/Paladin/…) exportan **toda** la lista de clase de niveles 1+ hasta el máximo de slot disponible, con `preparation.prepared: true` solo en los elegidos por el usuario (+ grants always-prepared en `mode: "always"`); cantrips solo los seleccionados. Clases **known**/pact exportan solo seleccionados + grants; Warlock usa `preparation.mode: "pact"`.
- **Inventory items** (`buildInventoryItem`): routing por tipo 5etools — tools (`T`/`AT`/`GS`/`INS`) → Foundry `tool` + activity `check`; ropa (`Costume`, `Fine Clothes`, …) → `equipment` clothing; pociones/scrolls y gear con usos limitados (p. ej. Healer's Kit) → `consumable` con activity heal/utility + `system.uses`; resto → `loot` gear. Descriptions/weight/price/rarity desde el catálogo `dnd-items` (prioriza XPHB/XDMG). Entradas `"N gp"` **no** se exportan como ítems: se suman a `system.currency.gp` vía `sumInventoryGoldGp` / `isGoldInventoryEntry`.
- **Export** (`builder/foundry-export/` + hook `useFoundryExport`): `buildFoundryActor(input)` ensambla `system` + `items[]` + `prototypeToken`. Sub-builders en `foundry-export/items/*` (feat/weapon/equipment/inventory/spell/identity), runas embebidas vía `buildRuneFoundryItem`, `advancement.builders.ts`. Infraestructura (IDs, stats, midi, enrichers, mappings, `wrapItem`, `downloadFoundryJson`) vive en `shared/foundry/`. Automatización de armas (compiler/chains/registry) en `shared/foundry/weapons/`. Retrato/token base64.
- **Automatización Midi-QoL / DAE (estilo Plutonium)** (`automation.data.ts` + `automation.builders.ts`): `applyItemAutomation` fusiona overlays por nombre; enlaza AE `transfer:false` a activities vacías (`linkNonTransferEffectsToActivities`). Requiere Midi + DAE + Times Up en el mundo. Ampliar: entradas en `AUTOMATIONS` por nombre normalizado.
- **Runas**: export standalone en `/runes` y también items `equipment` en el actor del builder (equipped). **Solo descripción** enriquecida — sin activities ni AE generados; las automatizaciones se añaden a mano (referencia: `public/data/foundry-jsons-example/runes`).
- **Import** (`foundry-import/`, hook `useFoundryImport`): sin cambios de contrato; matching + snapshot.
- **Snapshot** (`builder-snapshot.ts`): `flags["amellwind-toolbox"].builderSnapshot` para round-trip de choices/equipo/runas.

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

| Feature        | Ruta               | Fuente                             | Notas                                                                                                                                                                                                                                                    |
| -------------- | ------------------ | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Spells         | `/spells`          | `spells/index.json` + UA/partnered | Dedupe por nombre; Filter dialog (nivel/escuela/clase/flags/sources)                                                                                                                                                                                     |
| Classes        | `/classes`         | `class/index.json` + UA/partnered  | Detalle en `/classes/:classId?subclass=SOURCE::Name`; Filter dialog (caster/sources); deep-link asegura sources de clase/subclase on-demand                                                                                                                                                                                           |
| Races          | `/dnd-races`       | `race`/`subrace` + UA/partnered    | Dedupe por nombre; Filter dialog (kind/size/sources)                                                                                                                                                                                                     |
| Backgrounds    | `/dnd-backgrounds` | `background` 5etools               | Dedupe por nombre; Filter dialog (edition/sources)                                                                                                                                                                                                       |
| Feats          | `/dnd-feats`       | `feat` + UA/partnered              | Dedupe por nombre; Filter dialog (kind/category/ability/prerequisite/repeatable/sources); prerequisite + ASI badges                                                                                                                                      |
| D&D Items      | `/dnd-items`       | items.json + variants              | Precarga PHB/DMG; resto al seleccionar Sources; Filter dialog; armas/armaduras enriquecidas: Properties con templates 5etools, Mastery, Range/Ammo/AC/Stealth/Str, y textos de reglas (tipo + propiedades + mastery + type-additional) en la descripción |
| Bestiary       | `/bestiary`        | `BESTIARY_BASE_URL`                | Precarga MM/VGM/MPMM/XMM; resto al seleccionar Sources                                                                                                                                                                                                   |
| Shop Generator | `/shop-generator`  | catálogo `dnd-items` + CSV precios | Tema/tier/filtros → stock procedural; precios CSV (alias +N) → generic+base → catalog → estimado; markup cheap/normal/expensive; localStorage `mh-shop-generator`                                                                                        |

Fetch centralizado en `shared/data/fivetools-fetch.ts` (offline-first _stale-while-revalidate_: memoria → IndexedDB `fivetools_cache` → red; refresco en segundo plano si está viejo) con soporte `VITE_5ETOOLS_DATA=local`. Catálogo de sources (oficial + UA + partnered homebrew) en `shared/services/source-catalog.service.ts` (filtros de brew por feature vía `collectOnDemandBrewSourceCodesForProps` + `_generated/index-props.json`); UI compartida `ListSearchWithFilters` / `ListFiltersDialog` (Sources agrupadas por año).

**URL vs localStorage (listas):** los filtros de búsqueda/sources viven en `localStorage` vía `useListSessionFilters` (`list-filters:<listId>`; compartido entre pestañas del mismo origen; no hinchan la query string). La URL solo destaca el ítem abierto: query (`?spell=`, `?feat=`, `?item=`, `?race=`, `?background=`, `?weapon=`, `?subclass=`) o ruta de detalle (`/classes/:id`, `/bestiary/:id`). En Classes, `?subclass=SOURCE::Name` restaura la subclase y dispara `ensureClassUaSourcesLoaded` para el source de la clase y de la subclase. Hooks: `useListSessionFilters`, `useListItemUrlParam`.

---

### Xanathar Backstory

**Ruta**: `/xanathar-backstory`

Generador de trasfondo de personaje basado en las tablas aleatorias de _Xanathar's Guide to Everything_ (origen, familia, eventos de vida, etc.). Herramienta de personaje del bloque DnD 5e. Componente `XanatharBackstoryPage`.

---

### Shop Generator (D&D 5e)

**Ruta**: `/shop-generator`

Generador de tiendas del compendio 5e (no confundir con `/shops` Amellwind). Usa el catálogo `dnd-items`, temas/tiers, filtros (types, rarities, sources, class affinities) y precios desde `scripts/data/magic-item-pricing.csv` (unión **DMG 2024 + XGTE + TCoE** de la hoja _Magic Item Pricing_ de Dump Stat Adventures / VaranSL; regenerar con `pnpm pricing:build` → `magic-item-pricing.data.ts` + meta Note/Source Sheet).

**Setup dialog** (`ShopSetupDialog`): un solo diálogo concentra item count, tier, theme, magic/attunement, sources y afinidades. Esos valores son **lineamientos de generación** (pool + bias al sortear), no filtros post-roll. Fuera queda resumen/pills + Generate.

**Temas = gate duro de catálogo** (`shop-themes.data.ts` → `itemMatchesShopTheme` en `filterShopPool`): cada tema define `allowedTypes` / `excludedTypes` (y opcionalmente `keywordGatedTypes` para buckets amplios como _Wondrous Item_). Ej.: Alchemist solo Potion/Poison; Arcane Emporium scrolls/wands/staves/rods/rings/wondrous (sin armas/armaduras aunque digan “spell” en el texto); Blacksmith armas/armaduras/munición; General Store gear/tools/goods. Keywords y `preferMagic` solo reordenan dentro del pool ya filtrado.

**Filtros de catálogo** (dentro del setup): types/rarities = hard filter del pool; **class affinity** + **intended use** (Offensive/Defensive/Support/Utility/Control/Mobility) + **ability focus** (STR–CHA) = soft bias (`class-affinity.data.ts` + `item-affinity.utils.ts`). Clases enriquecidas con signature gear popular (Saga20 / community wishlists) y `reqAttune` del catálogo 5etools.

**Spell Scrolls**: las plantillas genéricas del catálogo (`Spell Scroll (3rd Level)`, etc.) se materializan al generar/reemplazar stock con hechizos concretos (`Spell Scroll (Fireball)`), distintos por nivel, tomados del catálogo de conjuros filtrado por las same sources de la tienda (`spell-scroll.utils.ts`). En temas arcane/temple/black-market los scrolls tienen boost de peso y pueden repetir la plantilla hasta agotar hechizos de ese nivel. El `itemId` sigue apuntando a la plantilla (detalle + precio CSV del nivel); `spellId`/`spellName`/`spellLevel` viajan en el stock exportable.

Cadena de precio (`resolveItemPriceGp`): CSV exacto (con alias `+N Name` ↔ `Name, +N`) → genéricos `Armor/Weapon/Ammunition +N` **más** coste mundano `baseValueCp` de la variante específica → `valueCp` del catálogo → estimación por rareza. La columna **Price** del listado y el diálogo de ítems usan esa cadena (tooltip de breakdown + atribución); el badge Basis del shop hace lo mismo. El diálogo sigue mostrando también el **Value** crudo de 5etools cuando existe.

Markup post-generación cheap/normal/expensive; precios editables a mano. Persistencia de la última tienda en `localStorage` (`mh-shop-generator`). Créditos en Home y cabecera del Shop Generator. Feature: `src/features/dnd/shop-generator/`.

---

## Estructura del proyecto

Organización por **features** bajo `src/features/` y código compartido en `src/shared/`:

```text
src/
├── App.tsx                 # Router lazy, sync al arrancar, ThemeProvider, SyncProvider
├── main.tsx                # Punto de entrada React (sin sync)
├── components/
│   ├── layout/             # MainLayout, Sidebar, BuilderRouteProviders, RuneBuildRouteLayout, LoadingScreen, NotFound, ThemeSelector
│   ├── data-table/         # Tabla reutilizable (TanStack Table)
│   └── ui/                 # shadcn: button, dialog, input, badge, …
├── features/
│   ├── home/               # Landing (replica las tres secciones del Sidebar)
│   ├── amellwind/          # Homebrew Amellwind (mismos grupos que el Sidebar)
│   │   ├── damage-calculator/
│   │   ├── character-guide/
│   │   ├── monsters/
│   │   ├── conditions/ + diseases/
│   │   ├── species/ backgrounds/ feats/
│   │   ├── weapons/ runes/ material-effects/ shops/
│   │   ├── hunt/ environments/ resources/ cooking/ combo/ downtime/
│   │   └── monstie-sidekick/ npc-generator/
│   ├── raintdm/            # RaintDM
│   │   ├── builder/        # Character Builder ALPHA (+ foundry-export/, foundry-import/)
│   │   ├── weapon-forge/
│   │   └── item-forge/
│   └── dnd/                # Compendio D&D 5e
│       ├── spells/ classes/ races/ backgrounds/ feats/ items/
│       ├── optionalfeatures/  # sin ruta; usado por builder/classes
│       ├── bestiary/
│       ├── xanathar-backstory/
│       └── shop-generator/
├── shared/
│   ├── foundry/            # Foundry VTT export core (types, id, download, midi, enrichers, mappings, icons, weapons/)
│   ├── types/              # Entidades tipadas
│   ├── context/            # ThemeContext, SyncContext
│   ├── db/                 # IndexedDB (idb), sync, database
│   ├── data/               # fivetools-fetch helper
│   ├── services/           # create-entity-service (factory)
│   ├── utils/              # cn, cr.utils, fivetools-parser, dedupe-by-name, fluff, …
│   ├── constants/          # URLs API, stores, source maps, dnd/ (abilities, skills)
│   ├── components/         # ItemRefText, DndKeywordText, StatBlockSection
│   ├── hooks/              # useDebouncedListSearch, useDebouncedValue, useBookSourceNames, …
│   └── theme/              # Definición de temas
└── index.css               # Tailwind + variables de tema
```

Convención por feature: `components/`, `services/`, `mappers/`, `data/` (estático), `context/`, `hooks/`, `utils/`, `types/`, `storage/` según necesidad. Subcarpetas comunes en builder: `components/stats/` (incl. `ability-scores/`), `components/equipment/` (library, spell-library, optional-feature-library), `foundry-export/` (actor), `foundry-import/`.

---

## Notas de Implementación

- **Amellwind (MM + GTMH)**: consultas contra **IndexedDB** o sync condicional (TTL 24 h). **Compendio 5e**: fetch bajo demanda desde mirror 5etools (opcional local con `VITE_5ETOOLS_DATA=local`).
- Contenido estático embebido en `*.data.ts`: cooking, combo, resources, environments, shops, character-guide, npc-templates.
- Stack: **React 18 + TypeScript + Vite**, **Tailwind CSS**, **shadcn/ui** (Radix), **TanStack Table**, **idb**, **react-router-dom v6** (lazy routes), **lucide-react**, **embla-carousel**.
- **Node.js 22.x** requerido (`package.json` engines + `.nvmrc`).
- Rutas lazy con `<Suspense>`; sync y temas gestionados en `App.tsx` / `ThemeProvider` / `SyncProvider`.
- `RuneBuildRouteLayout` (`RuneBuildProvider`) solo en `/runes` y `/builder`; `BuilderRouteProviders` solo en `/builder`; `BuildDrawer` solo en `RuneList`.
- Inventario del builder derivado del **carrito** (`CartContext` → `BuilderInventoryContext` vía `CartPurchaseBridge`).
- Utilidades clave: `fivetools-parser.ts`, `cr.utils.ts`, `ItemRefText`, `DndKeywordText`, `fivetools-fetch.ts`, `dedupe-by-name.utils.ts`, `fluff.utils.ts`.
- Services del compendio 5e creados con el factory `createEntityService` (`shared/services/`); constantes D&D centralizadas en `shared/constants/dnd/`.
- **Builder JSON nativo**: `builder/builder-json/` — envelope `amellwind-builder-character` (kind + version + snapshotVersion + identity + core + multiclass + snapshot). Hooks: `useBuilderCharacterExport` / `useBuilderCharacterImport`. Lógica de serialización/rehidratación compartida en `builder/storage/builder-persist.ts` (también usada por el autosave local). Sin portrait/token.
- **Export/Import Foundry VTT**: núcleo en `shared/foundry/` (+ `shared/foundry/weapons/`); actor en `builder/foundry-export/` / `foundry-import/` (dnd5e v12); items de arma en forge/weapons vía el mismo núcleo. UI deshabilitada temporalmente en `StatsPanel` (`FOUNDRY_JSON_UI_ENABLED = false`); `builderSnapshot` en flags sigue presente para cuando se reactive.
- Catálogo de equipo D&D del builder en `dnd-items/dnd-equipment.service.ts` (`getDndWeapons`, `getDndArmors`, …).
- El **Character Builder** y las **armaduras reales desde GTMH** siguen en desarrollo activo (ALPHA).
