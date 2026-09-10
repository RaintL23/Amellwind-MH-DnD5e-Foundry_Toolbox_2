# Features: D&D 5e Compendium and Generators

> Split from legacy `instrucctions.md`. Prefer this file over reading the whole domain corpus.

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

### Creation Guide (D&D 5e)

**Ruta**: `/dnd-character-guide`
**Fuente**: `dnd-character-guide.data.ts` (estático).

Guía de creación de personaje comparando **PHB 2014** y **PHB 2024** (XPHB). Switch de edición arriba a la derecha (por defecto **2024**; query `?edition=2014`). Pestañas: Creating a Character, Ability Scores, Describe Your Character, Equipment & Higher Level, Tips & Party Roles. Incluye la tabla de starting equipment a niveles altos y enlaces al Builder / catálogos oficiales. El panel de tips del Builder (modo D&D) enlaza aquí.

---

### Xanathar Backstory

**Ruta**: `/xanathar-backstory`

Generador de trasfondo de personaje basado en las tablas aleatorias de _Xanathar's Guide to Everything_ (origen, familia, eventos de vida, etc.). Herramienta de personaje del bloque DnD 5e. Componente `XanatharBackstoryPage`.

---

### Shop Generator (D&D 5e)

**Ruta**: `/shop-generator`

Generador de tiendas del compendio 5e (no confundir con `/shops` Amellwind). Usa el catálogo `dnd-items`, temas/tiers, filtros (types, rarities, sources, class affinities) y precios desde `scripts/data/magic-item-pricing.csv` (unión **DMG 2024 + XGTE + TCoE** de la hoja _Magic Item Pricing_ de Dump Stat Adventures / VaranSL; regenerar a mano con `pnpm pricing:build` → `magic-item-pricing.data.ts` + meta Note/Source Sheet; no forma parte de `pnpm build` / `pnpm dev`).

**Setup dialog** (`ShopSetupDialog`): un solo diálogo concentra item count, tier, theme, magic/attunement, sources y afinidades. Esos valores son **lineamientos de generación** (pool + bias al sortear), no filtros post-roll. Fuera queda resumen/pills + Generate.

**Temas = gate duro de catálogo** (`shop-themes.data.ts` → `itemMatchesShopTheme` en `filterShopPool`): cada tema define `allowedTypes` / `excludedTypes` (y opcionalmente `keywordGatedTypes` para buckets amplios como _Wondrous Item_). Ej.: Alchemist solo Potion/Poison; Arcane Emporium scrolls/wands/staves/rods/rings/wondrous (sin armas/armaduras aunque digan “spell” en el texto); Blacksmith armas/armaduras/munición; General Store gear/tools/goods. Keywords y `preferMagic` solo reordenan dentro del pool ya filtrado.

**Filtros de catálogo** (dentro del setup): types/rarities = hard filter del pool; **class affinity** + **intended use** (Offensive/Defensive/Support/Utility/Control/Mobility) + **ability focus** (STR–CHA) = soft bias (`class-affinity.data.ts` + `item-affinity.utils.ts`). Clases enriquecidas con signature gear popular (Saga20 / community wishlists) y `reqAttune` del catálogo 5etools.

**Spell Scrolls**: las plantillas genéricas del catálogo (`Spell Scroll (3rd Level)`, etc.) se materializan al generar/reemplazar stock con hechizos concretos (`Spell Scroll (Fireball)`), distintos por nivel, tomados del catálogo de conjuros filtrado por las same sources de la tienda (`spell-scroll.utils.ts`). En temas arcane/temple/black-market los scrolls tienen boost de peso y pueden repetir la plantilla hasta agotar hechizos de ese nivel. El `itemId` sigue apuntando a la plantilla (detalle + precio CSV del nivel); `spellId`/`spellName`/`spellLevel` viajan en el stock exportable.

Cadena de precio (`resolveItemPriceGp`): CSV exacto (con alias `+N Name` ↔ `Name, +N`) → genéricos `Armor/Weapon/Ammunition +N` **más** coste mundano `baseValueCp` de la variante específica → `valueCp` del catálogo → estimación por rareza. La columna **Price** del listado y el diálogo de ítems usan esa cadena (tooltip de breakdown + atribución); el badge Basis del shop hace lo mismo. El diálogo sigue mostrando también el **Value** crudo de 5etools cuando existe.

Markup post-generación cheap/normal/expensive; precios editables a mano. Persistencia de la última tienda en `localStorage` (`mh-shop-generator`). Créditos en Home y cabecera del Shop Generator. Feature: `src/features/dnd/shop-generator/`.

---

