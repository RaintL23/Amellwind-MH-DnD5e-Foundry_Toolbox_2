# Amellwind Monster Hunter DnD5e Toolbox

**Idioma / Language:** [English](./README.md) · **Español**

Toolkit web para **Dungeon Masters** y jugadores del homebrew de **Amellwind**, que combina **Monster Hunter** con **Dungeons & Dragons 5e**. Monstruos, runas, armas, character builder con **export/import a Foundry VTT**, calculadora de daño, cocina, tiendas y más en una sola aplicación, con datos cacheados en el navegador para consultar offline entre sesiones.

Nació en mi mesa de rol: juego con amigos más entusiasmados con D&D que con Monster Hunter, y al usar el homebrew de Amellwind tropezamos una y otra vez buscando reglas y opciones de personaje. Es un sistema con poco material centralizado — casi sin wikis ni referencias cómodas — así que armé esta herramienta para que cualquiera pueda explorar el contenido de Amellwind y preparar personajes sin saltar entre PDFs y pestañas sueltas.

> **Estado:** v0.1.23 — el Character Builder está en fase **ALPHA**.

**App en vivo:** [https://amellwind-mh-dn-d5e-foundry-toolbox-2.vercel.app/](https://amellwind-mh-dn-d5e-foundry-toolbox-2.vercel.app/)

## Características

El sidebar tiene tres secciones (mismo orden que `src/shared/constants/nav-sections.ts`): **RaintDM**, **Amellwind Homebrew** y el **Compendio D&D 5e**.

### RaintDM

Herramientas de juego y de mesa, más variantes de RaintDM sobre el homebrew 2014 de Amellwind — toques de house rule para mis mesas y campañas:

| Grupo | Sección | Ruta | Descripción |
| --- | --- | --- | --- |
| GM Tools | **Combat Tracker** | `/combat-tracker` | Orden de iniciativa, HP (incluido daño multi-objetivo) y death saves para el GM |
| GM Tools | **Damage & Healing Calculator** | `/damage-calculator` | Calculadora de daño o healing esperado por turno comparando builds (persistida) |
| Character Tools | **Builder** _(ALPHA)_ | `/builder` | Character Builder — stats, equipamiento, runas, DPT, **export/import Foundry VTT** y export de la hoja a PDF. Junta catálogos Amellwind, 5e y RaintDM. |
| Character Tools | **Character Sheet** _(ALPHA)_ | `/sheet`, `/sheet/:characterId` | Hoja de juego en sesión: HP, acciones, conjuros, descansos, inventario y condiciones. Importa el JSON del Builder; optimizada para móvil y escritorio |
| Forge | **Items Forge** | `/item-forge` | Ítems curated de RaintDM y recetas tipo Combo List (magazines de Dual Repeaters, trampas de caza) |
| Forge | **Weapon Forge** | `/weapon-forge` | Armas de cazador curated de RaintDM más armas custom que creas, editas y exportas |
| Forge | **Artificer Forge** | `/artificer-forge` | Artificiero 2024 adaptado a Amellwind: Replicate Material Effect, lista de planos por nivel y Magic Item Tinker |

### Amellwind Homebrew

| Grupo | Sección | Ruta | Descripción |
| --- | --- | --- | --- |
| Character | **Creation Guide** | `/character-guide` | Guía de creación de personajes del manual (species, roles, skills, etc.) |
| Character | **Lore** | `/lore` | Mitos, historia, dioses y pueblos del Viejo Mundo (Capítulo 1) |
| Character | **Species** | `/species` | Especies y subrazas de la Guía de Caza |
| Character | **Backgrounds** | `/backgrounds` | Trasfondos de cazador del manual |
| Character | **Factions** | `/factions` | Gremios y organizaciones — membresía, renombre y conjuros de facción |
| Character | **Feats** | `/feats` | Dotes (feats) del manual |
| Bestiary and Rules | **Monsters** | `/monsters`, `/monsters/:monsterId` | Bestiario MH con stat blocks, detalle y página dedicada por monstruo |
| Bestiary and Rules | **Conditions & Diseases** | `/conditions` | Condiciones Blight, aflicciones y enfermedades infecciosas (`/diseases` redirige aquí) |
| Weapons, Runes, and Equipment | **Weapons** | `/weapons` | Armas de cazador (Hunter Weapons) y optional features |
| Weapons, Runes, and Equipment | **Runes** | `/runes` | Materiales de monstruo y planificador de builds (drawer lateral) |
| Weapons, Runes, and Equipment | **Material Effects** | `/material-effects` | Efectos de materiales de monstruo (armadura/arma) en listado consultable |
| Weapons, Runes, and Equipment | **Items** | `/items` | Catálogo de ítems de la Guía de Caza |
| Weapons, Runes, and Equipment | **Siege Weapons** | `/siege-weapons` | Dragonator, Dragonrazer y otros ingenios de asedio |
| World and Exploration | **Hunt Planner** | `/hunt` | Planifica y simula una cacería con tiradas de rastreo y tablas de recursos |
| World and Exploration | **Environments** | `/environments` | Biomas y tablas de encuentro/recursos |
| World and Exploration | **Resources** | `/resources` | Recursos de entorno (plantas, minerales, etc.) |
| World and Exploration | **Shops** | `/shops` | Tiendas con carrito de compra |
| World and Exploration | **Cooking** | `/cooking` | Sistema de cocina artesana |
| World and Exploration | **Combo List** | `/combo` | Crafteo y combinaciones de objetos |
| World and Exploration | **Downtime** | `/downtime` | Actividades de tiempo libre del manual |
| NPCs and Companions | **Monstie Sidekick** | `/monstie-sidekick` | Reglas y creador de sidekicks Monstie |
| NPCs and Companions | **Guardian Template** | `/guardian-template` | Reglas para aplicar la plantilla de monstruo Guardian del MHMM |
| NPCs and Companions | **NPC Generator** | `/npc-generator` | Generador de stat blocks para NPCs humanoides |

### Compendio D&D 5e

Datos oficiales de referencia cargados desde [5etools](https://5e.tools) (no son homebrew de Amellwind):

| Grupo | Sección | Ruta | Descripción |
| --- | --- | --- | --- |
| Character Options | **Classes** | `/classes`, `/classes/:classId` | Clases base con página de detalle por variante |
| Character Options | **Races** | `/dnd-races` | Especies, linajes y subrazas oficiales 5e |
| Character Options | **Backgrounds** | `/dnd-backgrounds` | Trasfondos oficiales 5e (2014 / 2024) |
| Character Options | **Feats** | `/dnd-feats` | Dotes oficiales 5e |
| Character Options | **Multiclassing** | `/multiclass` | Reglas de multiclase, prerrequisitos y calculadora de spell slots |
| Spells and Conditions | **Spells** | `/spells` | Conjuros con filtros por clase, nivel y fuente |
| Spells and Conditions | **Conditions & Diseases** | `/dnd-conditions` | Condiciones, estados y enfermedades clásicas de D&D (PHB / DMG / 2024) |
| Bestiary | **Bestiary** | `/bestiary`, `/bestiary/:creatureId` | Criaturas del MM y otras fuentes, con carga bajo demanda |
| Equipment | **Items** | `/dnd-items` | Ítems mágicos y equipo del PHB/DMG y otras fuentes |
| Character Tools | **Creation Guide** | `/dnd-character-guide` | Guía de creación de personaje comparando PHB 2014 y PHB 2024 |
| Character Tools | **Encounter Calculator** | `/encounter-calculator` | Dificultad de encuentros DMG: presupuesto de XP del grupo vs CR y cantidad de criaturas |
| Character Tools | **Xanathar Backstory** | `/xanathar-backstory` | Generador de trasfondo aleatorio con las tablas de Xanathar (XGE) |
| Character Tools | **Shop Generator** | `/shop-generator` | Tiendas D&D 5e procedurales (tema, tier, precios CSV editables) |

### Integración con Foundry VTT

Objetivo: Foundry core **12.331** con el sistema **dnd5e 4.4.4** (`src/shared/foundry/target.ts`).

El **Character Builder** puede **exportar** el personaje a un actor `character` de Foundry listo para importar, e **importar** de vuelta un JSON de actor de Foundry para reconstruir el build dentro de la app. El export genera un único archivo JSON con clase/subclase, especie, trasfondo, dotes, conjuros, armas/armadura/trinkets, advancements y retrato/token; el import hace _matching_ de cada entidad contra los catálogos de la app (clases, especies, trasfondos, dotes, conjuros y equipo). Ambos flujos viven en `src/features/raintdm/builder/foundry-export/` y `foundry-import/`, con botones en el `StatsPanel` del builder. Los helpers compartidos de Foundry (ids, effects, descripciones, requisitos de módulos) viven en `src/shared/foundry/`.

El export además **enriquece los items con automatización Midi-QoL / DAE** (Active Effects con flags de `midi-qol`/`dae`), replicando el comportamiento que añadiría el importador de **Plutonium**: el actor se comporta como si hubiera pasado por *Plutonium Addon: Automation*, siempre que el mundo destino tenga los módulos requeridos activos (**Midi QoL + Item Macro + DAE + Times Up**; la app muestra un aviso de requisitos). Los overlays de automatización (`src/shared/foundry/weapons/automation.data.ts` y `feature-automation.data.ts`) están portados como datos de referencia desde los repos de [TheGiddyLimit](https://github.com/TheGiddyLimit) — ver [Fuentes de datos](#fuentes-de-datos).

**Módulo de contenido.** `pnpm build` también genera el módulo de Foundry `Amellwind-MH-RaintDM-module` (`build:foundry-module`, fuentes en `public/data/foundry-module/`): el contenido del homebrew Monster Hunter (armas, runas, combo crafting, Items Forge, condiciones y enfermedades, cocina, …) empaquetado en compendium packs instalables. Requiere además socketlib. Ver [`public/data/foundry-module/README.md`](./public/data/foundry-module/README.md) para requisitos y estructura.

## Stack tecnológico

| Capa           | Tecnología                        |
| -------------- | --------------------------------- |
| Framework      | React 18 + TypeScript             |
| Build          | Vite                              |
| Estilos        | Tailwind CSS                      |
| Componentes UI | shadcn/ui (Radix UI)              |
| Tablas         | TanStack Table                    |
| Routing        | React Router v6 (lazy + Suspense) |
| Almacenamiento | IndexedDB (`idb`)                 |
| Otros          | `pdf-lib` (export PDF de la hoja), `cmdk`, `embla-carousel-react`, `sonner` |
| Tests          | Vitest                            |
| Paquetes       | pnpm                              |

La app es una **SPA** sin backend propio. Los datos de Amellwind se sincronizan y cachean en el navegador; el compendio D&D 5e se obtiene bajo demanda desde el mirror de 5etools.

## Requisitos

- [Node.js](https://nodejs.org/) **22.x** (ver `.nvmrc`)
- [pnpm](https://pnpm.io/installation)

## Instalación y uso

```bash
# Clonar el repositorio
git clone https://github.com/RaintL23/Amellwind-MH-DnD5e-Foundry_Toolbox_2.git
cd Amellwind-MH-DnD5e-Foundry_Toolbox_2

# Instalar dependencias
pnpm install

# Servidor de desarrollo (antes regenera el manifest de armas/ítems RaintDM)
pnpm dev

# Build de producción
pnpm build

# Vista previa del build
pnpm preview

# Lint (cero warnings)
pnpm lint

# Tests unitarios (completitud del Builder + utilidades)
pnpm test

# Rebuild magic-item pricing lookup from scripts/data/magic-item-pricing.csv
pnpm pricing:build

# Build con análisis de bundle
pnpm build:analyze
```

`pnpm build` primero regenera el manifest de RaintDM, luego ejecuta `build:gtmh-supplement` y `build:foundry-module` (que valida los tokens MH), y después `tsc -b` y la compilación de Vite. El pricing de ítems mágicos es aparte (no forma parte de build/dev): sustituye `scripts/data/magic-item-pricing.csv` (export CSV de la hoja [Magic Item Pricing](https://dumpstatadventures.com/the-gm-is-always-right/pricing-magic-items-2024-dungeon-masters-guide) de Dump Stat Adventures — pestañas DMG 2024 + filas XGTE/TCoE) y corre `pnpm pricing:build`. La app atribuye esos precios a VaranSL / Dump Stat Adventures; no son cálculos originales de este proyecto.

La app almacena todos los datos en **IndexedDB**, que es su **fuente de verdad** en runtime. GitHub actúa solo como *feed de actualización* (modelo offline-first): al arrancar, si ya hay datos guardados se muestran de inmediato y, si superan las 24 h, se refrescan en segundo plano; solo el primer arranque (sin datos aún) espera a la descarga. Si la red falla, la app sigue funcionando con lo ya guardado en IndexedDB.

### Compendio 5etools: producción vs. desarrollo offline

| Entorno                      | Configuración                             | Origen de datos                                                                                          |
| ---------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| **Vercel / producción**      | Sin variables de entorno                  | Mirror de [5etools-src](https://github.com/5etools-mirror-3/5etools-src) vía `raw.githubusercontent.com` |
| **Desarrollo (por defecto)** | Igual que producción                      | Remoto                                                                                                   |
| **Desarrollo offline**       | `VITE_5ETOOLS_DATA=local` en `.env.local` | JSON en `public/5etools/`                                                                                |

En producción **no hace falta** commitear `races.json`, `backgrounds.json`, `feats.json` ni el resto del mirror: spells, classes, races, backgrounds, feats, items y bestiary se resuelven en runtime desde GitHub. Los JSON en `public/5etools/` que sí están en el repo son solo un subset para probar items/bestiary sin red.

**No configures `VITE_5ETOOLS_DATA=local` en Vercel** — spells y classes requieren cientos de archivos que no van en el repo.

Para desarrollo offline, copia los JSON desde `backup-jsons/5etools/` (solo local, ignorado por git) a `public/5etools/` y crea `.env.local` a partir de [`.env.example`](./.env.example). Ver comentarios en `src/shared/constants/api.constants.ts` para las rutas exactas.

### Deploy en Vercel

- **Producción:** [https://amellwind-mh-dn-d5e-foundry-toolbox-2.vercel.app/](https://amellwind-mh-dn-d5e-foundry-toolbox-2.vercel.app/)
- **Build:** `pnpm build` (definido en `vercel.json`)
- **Output:** `dist`
- **Variables de entorno:** ninguna obligatoria
- **Node:** 22.x (`.nvmrc` / `package.json`)
- **Security headers:** `vercel.json` define CSP (permite `connect-src` a `raw.githubusercontent.com`), `X-Frame-Options`, `nosniff` y políticas relacionadas. Si cambias los mirrors fuera de GitHub raw, actualiza la allowlist `connect-src` del CSP.

## Fuentes de datos

> **Modelo de datos:** la app guarda todo en **IndexedDB**, su fuente de verdad en runtime. Los repositorios de GitHub de abajo son solo *feeds de actualización*: se consultan para refrescar las bases internas (offline-first, con TTL de 24 h) y no son una dependencia dura en cada carga. Los slugs de mirror/homebrew/UA y su rama son configurables por entorno (`VITE_5ETOOLS_MIRROR`, `VITE_5ETOOLS_REF`, `VITE_HOMEBREW_MIRROR`, `VITE_HOMEBREW_REF`, `VITE_UA_MIRROR`, `VITE_UA_REF`), útil si un mirror de 5etools rota (p. ej. `-3` → `-4`) o para usar un fork.

### Homebrew Amellwind

La información principal proviene de los recursos homebrew de Amellwind en el repositorio de [TheGiddyLimit/homebrew](https://github.com/TheGiddyLimit/homebrew):

- [Amellwind; Monster Hunter Monster Manual](https://raw.githubusercontent.com/TheGiddyLimit/homebrew/master/collection/Amellwind;%20Monster%20Hunter%20Monster%20Manual.json) (feed público; respaldo para nombres que el PDF no cubre)
- [MHMM with Loot Tables 2.0](https://www.patreon.com/amellwind/posts/monster-hunter-137502033) — PDF gratuito del Patreon de Amellwind (fichas, loot y runas que muestra la app)
- [Amellwind; Amellwind's Guide to Monster Hunting](https://raw.githubusercontent.com/TheGiddyLimit/homebrew/master/collection/Amellwind;%20Amellwind's%20Guide%20to%20Monster%20Hunting.json)
- [GTMH GMBinder source](https://www.gmbinder.com/share/-LCk9FgQaqaXBVmLeCeT#newfeats) — preparado en local como `public/data/gtmh-patreon/supplement.json`

El JSON de la Guía de Caza también aporta species, backgrounds, feats, clases MH, class features (Monstie Sidekick), optional features de armas y reglas variantes (downtime).

Las fichas del Monster Manual, las runas, condiciones y enfermedades se cargan del overlay del PDF en `public/data/mhmm-patreon-2.0/supplement.json`. En runtime el PDF gana por nombre normalizado; el JSON de GitHub solo rellena nombres que el PDF no tiene. Las listas mezcladas se escriben en IndexedDB (`mm_current.data`, `condition`, `disease`). Tras editar las fichas organizadas en `public/data/mhmm-patreon-2.0/monsters/`, regenera con `pnpm build:mm-data` (`build:mm-catalog` → `build:mm-supplement`); para regenerar solo el overlay: `pnpm build:mm-supplement`. Esquema completo en [`public/data/mhmm-patreon-2.0/SCHEMA.md`](public/data/mhmm-patreon-2.0/SCHEMA.md). El overlay GTMH (`public/data/gtmh-patreon/supplement.json`, GMBinder) se regenera con `pnpm build:gtmh-data` (también corre en `pnpm build`) y se mezcla en runtime (gana el local por nombre; GitHub rellena lo no cubierto).

### Datos estáticos embebidos

Recursos, entornos, tiendas, combo, cocina, guía de creación de personajes y plantillas del generador de NPCs viven en archivos `*.data.ts` dentro del proyecto. Los catálogos RaintDM de Weapon Forge e Items Forge viven en `public/data/raintdm-weapons/` y `public/data/raintdm-items/`.

### Compendio D&D 5e

Spells, classes, items, bestiary, races, backgrounds y feats se cargan desde el mirror de [5etools-src](https://github.com/5etools-mirror-3/5etools-src) (`raw.githubusercontent.com`), con precarga de fuentes habituales (MM, PHB, DMG, etc.) y carga bajo demanda del resto vía el Filter dialog (Sources agrupadas por año; por defecto solo oficiales).

Material de playtest / Unearthed Arcana se obtiene del feed [TheGiddyLimit/unearthed-arcana](https://github.com/TheGiddyLimit/unearthed-arcana) (`VITE_UA_MIRROR` / `VITE_UA_REF`) cuando el usuario selecciona esas sources. Residuales tipo D&D Beyond presentes en ese feed (p. ej. Wayfinder's Guide to Eberron / `WGE`) se tratan igual; no se scrapea D&D Beyond.

### Automatización Foundry (Midi-QoL / Plutonium)

La automatización que el export inyecta en los items (Active Effects con flags de `midi-qol`/`dae`, en `src/shared/foundry/weapons/automation.data.ts`, `feature-automation.data.ts` y `automation.builders.ts`) usa como **información de referencia** los siguientes repositorios, para operar esa sección del código igual que lo haría el importador de Plutonium:

- [TheGiddyLimit/plutonium-addon-automation](https://github.com/TheGiddyLimit/plutonium-addon-automation) — formato de overlays de automatización y datos de effects por entidad (dotes, features, items mágicos, conjuros). _MIT License, © TheGiddyLimit._
- [TheGiddyLimit/homebrew](https://github.com/TheGiddyLimit/homebrew) — formato de homebrew 5etools de referencia para el matching por nombre/fuente.
- [tposney/midi-qol](https://github.com/tposney/midi-qol) y [DAE](https://foundryvtt.com/packages/dae) — claves de flags (`flags.midi-qol.*`, `flags.dae.*`) y semántica de duraciones especiales que consumen los Active Effects generados.

El código **no incluye** el módulo ni sus datos completos: solo reproduce el formato mecánico de los effects para un set curado de entidades, ampliable por nombre. Requiere Midi QoL + Item Macro + DAE + Times Up activos en el mundo destino.

## Estructura del proyecto

```text
src/
├── App.tsx                 # Router lazy, sync al arrancar, providers globales
├── components/
│   ├── layout/             # MainLayout, Sidebar, LoadingScreen, NotFound, ThemeSelector
│   ├── data-table/         # Tabla reutilizable (TanStack Table)
│   └── ui/                 # shadcn: button, dialog, input, badge, …
├── features/
│   ├── home/               # Landing (replica las tres secciones del Sidebar)
│   ├── amellwind/          # Amellwind Homebrew (monsters, runes, hunt, lore, factions, …)
│   ├── raintdm/            # RaintDM: builder, character-sheet, combat-tracker, weapon/item forge
│   └── dnd/                # Compendio D&D 5e (spells, classes, multiclass, encounter calc, …)
└── shared/
    ├── constants/          # URLs de API, IndexedDB y constantes D&D (abilities, skills)
    ├── context/            # ThemeContext, SyncContext
    ├── db/                 # IndexedDB y sincronización
    ├── foundry/            # Foundry VTT helpers: ids, effects, Midi/automation, module requirements
    ├── theme/ hooks/ mappers/
    ├── types/              # Tipos compartidos
    ├── services/           # create-entity-service (factory de services)
    ├── components/         # ItemRefText, DndKeywordText, StatBlockSection
    ├── utils/              # Parser 5etools, CR, dedupe-by-name, fluff, etc.
    └── data/               # fetch helper para JSON 5etools
```

Cada feature sigue un patrón similar: `components/`, `services/`, `hooks/`, `mappers/` y, cuando aplica, `data/` o `context/`.

## Documentación para desarrolladores

La carpeta [`docs/domain/`](./docs/domain/index.md) contiene la documentación técnica detallada (partida por tema para lecturas más cortas): arquitectura de datos, entidades de dominio, mapeos 5etools → Foundry, reglas de negocio y convenciones del código. [`instrucctions.md`](./instrucctions.md) es solo un puntero a esa carpeta.

## Licencia

El **código fuente** de este proyecto se publica bajo la [Licencia MIT](./LICENSE). Cualquiera puede usarlo, clonarlo, modificarlo y publicar su propia versión, sin necesidad de pedir permiso. La idea es que la aplicación esté abierta a todo el mundo.

La licencia MIT cubre únicamente el código y el trabajo original de este repositorio. **No** cubre el contenido de terceros que la app incluye o carga (homebrew de Amellwind, material de 5etools / Wizards of the Coast, imágenes de Monster Hunter y más), que conserva sus propios derechos y términos. Consulta [`THIRD_PARTY.md`](./THIRD_PARTY.md) para la lista completa y las atribuciones.

## Aviso legal

Este proyecto es una herramienta fan-made y sin fines de lucro para facilitar el uso del homebrew de **Amellwind** (_Monster Hunter D&D 5e_). Todo el contenido, reglas y diseño de ese homebrew son obra de Amellwind. La app lo presenta de forma organizada: una parte se lee de feeds públicos (como la colección de homebrew en [5etools](https://5e.tools)) y otra parte está transcrita y reestructurada a partir de los PDFs gratuitos de su Patreon para poder buscarla y cruzar referencias. Ese contenido se incluye para que la herramienta sea utilizable, no se reclama como trabajo propio y sus derechos siguen siendo de su autor.

La fuente oficial y el trabajo completo del autor están en su Patreon: [patreon.com/cw/amellwind](https://www.patreon.com/cw/amellwind).

**Monster Hunter** es propiedad de Capcom y **Dungeons & Dragons** es propiedad de Wizards of the Coast. Este proyecto no está afiliado ni respaldado por Capcom, Wizards of the Coast, Amellwind ni por ninguna otra marca o autor mencionado.

Si eres titular de derechos y quieres que algún contenido se acredite de otra forma, se modifique o se retire, abre un issue en el repositorio.
