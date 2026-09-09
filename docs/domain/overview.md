# Overview

> Split from legacy `instrucctions.md`. Prefer this file over reading the whole domain corpus.

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
- [x] **Creation Guide** — Guía de creación PHB 2014 / 2024 (`/dnd-character-guide`).

### En progreso o pendiente

- [~] **Character Builder** — ALPHA: stats, paper doll, runas, DPT, retrato/token; inventario ligado al carrito; armaduras placeholder.
- [x] **Export/Import Foundry VTT** — Actor `character` dnd5e v12 con _matching_ contra catálogos de la app. UI temporalmente deshabilitada en `StatsPanel` (`FOUNDRY_JSON_UI_ENABLED = false`) hasta mejorar el exportador; código intacto.
- [x] **Persistencia de personajes (Builder JSON nativo)** — Export/import de un JSON nativo (`amellwind-builder-character`) que round-trip el estado completo del Builder. Ver `builder/builder-json/`. No incluye portrait/token; formato distinto al actor Foundry.
- [ ] **Armaduras (datos reales)** — Sets completos desde GTMH; hoy el builder usa `armor.placeholder.ts`.
- [ ] **Vista de Combate / Encuentros activos** — Gestión de combate en tiempo real.

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
│       ├── character-guide/   # Creation Guide PHB 2014/2024
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
