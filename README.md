# Amellwind Monster Hunter DnD5e Toolbox

Toolkit web para **Dungeon Masters** y jugadores del homebrew de **Amellwind**, que combina **Monster Hunter** con **Dungeons & Dragons 5e**. Monstruos, runas, armas, character builder con **export/import a Foundry VTT**, calculadora de daño, cocina, tiendas y más en una sola aplicación, con datos cacheados en el navegador para consultar offline entre sesiones.

Nació en mi mesa de rol: juego con amigos más entusiasmados con D&D que con Monster Hunter, y al usar el homebrew de Amellwind tropezamos una y otra vez buscando reglas y opciones de personaje. Es un sistema con poco material centralizado — casi sin wikis ni referencias cómodas — así que armé esta herramienta para que cualquiera pueda explorar el contenido de Amellwind y preparar personajes sin saltar entre PDFs y pestañas sueltas.

> **Estado:** v0.1.23 — el Character Builder está en fase **ALPHA**.

## Características

### Amellwind Homebrew

| Sección              | Ruta                | Descripción                                                                   |
| -------------------- | ------------------- | ----------------------------------------------------------------------------- |
| **Builder**          | `/builder`          | Character Builder — stats, equipamiento, runas, DPT y **export/import Foundry VTT** _(ALPHA)_ |
| **Damage Calculator**| `/damage-calculator`| Calculadora de daño esperado por turno comparando builds de armas (persistida) |
| **Creation Guide**   | `/character-guide`  | Guía de creación de personajes del manual (species, roles, skills, etc.)      |
| **Monstie Sidekick** | `/monstie-sidekick` | Reglas y creador de sidekicks Monstie                                         |
| **NPC Generator**    | `/npc-generator`    | Generador de stat blocks para NPCs humanoides                                 |
| **Species**          | `/species`          | Especies y subrazas de la Guía de Caza                                        |
| **Backgrounds**      | `/backgrounds`      | Trasfondos de cazador del manual                                              |
| **Feats**            | `/feats`            | Dotes (feats) del manual                                                      |
| **Monsters**         | `/monsters`         | Bestiario MH con stat blocks, detalle y página dedicada por monstruo          |
| **Runes**            | `/runes`            | Materiales de monstruo y planificador de builds (drawer lateral)              |
| **Material Effects** | `/material-effects` | Efectos de materiales de monstruo (armadura/arma) en listado consultable      |
| **Conditions**       | `/conditions`       | Condiciones del homebrew Amellwind                                            |
| **Diseases**         | `/diseases`         | Enfermedades del homebrew Amellwind                                           |
| **Weapons**          | `/weapons`          | Armas de cazador (Hunter Weapons) y optional features                         |
| **Items**            | `/items`            | Catálogo de ítems de la Guía de Caza                                          |
| **Shops**            | `/shops`            | Tiendas con carrito de compra                                                 |
| **Cooking**          | `/cooking`          | Sistema de cocina artesana                                                    |
| **Combo List**       | `/combo`            | Crafteo y combinaciones de objetos                                            |
| **Environments**     | `/environments`     | Biomas y tablas de encuentro/recursos                                         |
| **Resources**        | `/resources`        | Recursos de entorno (plantas, minerales, etc.)                                |
| **Downtime**         | `/downtime`         | Actividades de tiempo libre del manual                                        |

### Compendio D&D 5e

Datos oficiales de referencia cargados desde [5etools](https://5e.tools) (no son homebrew de Amellwind):

| Sección         | Ruta                         | Descripción                                              |
| --------------- | ---------------------------- | -------------------------------------------------------- |
| **Spells**      | `/spells`                    | Conjuros con filtros por clase, nivel y fuente           |
| **Classes**     | `/classes`, `/classes/:id`   | Clases base con página de detalle por variante           |
| **Items**       | `/dnd-items`                 | Ítems mágicos y equipo del PHB/DMG y otras fuentes       |
| **Bestiary**    | `/bestiary`, `/bestiary/:id` | Criaturas del MM y otras fuentes, con carga bajo demanda |
| **Races**       | `/dnd-races`                 | Especies, linajes y subrazas oficiales 5e                |
| **Backgrounds** | `/dnd-backgrounds`           | Trasfondos oficiales 5e (2014 / 2024)                    |
| **Feats**       | `/dnd-feats`                 | Dotes oficiales 5e                                       |
| **Xanathar Backstory** | `/xanathar-backstory` | Generador de trasfondo aleatorio con las tablas de Xanathar (XGE) |

### Integración con Foundry VTT

El **Character Builder** puede **exportar** el personaje a un actor `character` de **Foundry VTT (sistema dnd5e v12)** listo para importar, e **importar** de vuelta un JSON de actor de Foundry para reconstruir el build dentro de la app. El export genera un único archivo JSON con clase/subclase, especie, trasfondo, dotes, conjuros, armas/armadura/trinkets, advancements y retrato/token; el import hace _matching_ de cada entidad contra los catálogos de la app (clases, especies, trasfondos, dotes, conjuros y equipo). Ambos flujos viven en `src/features/builder/foundry-export/` y `foundry-import/`, con botones en el `StatsPanel` del builder.

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

# Servidor de desarrollo
pnpm dev

# Build de producción
pnpm build

# Vista previa del build
pnpm preview

# Lint
pnpm lint

# Build con análisis de bundle
pnpm build:analyze
```

Al abrir la app por primera vez (o cuando la caché tiene más de 24 horas), se sincronizan automáticamente los JSONs de Amellwind desde 5etools. Si la red falla, la app sigue funcionando con los datos ya guardados en IndexedDB.

### Compendio 5etools: producción vs. desarrollo offline

| Entorno                      | Configuración                             | Origen de datos                                                                                          |
| ---------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| **Vercel / producción**      | Sin variables de entorno                  | Mirror de [5etools-src](https://github.com/5etools-mirror-3/5etools-src) vía `raw.githubusercontent.com` |
| **Desarrollo (por defecto)** | Igual que producción                      | Remoto                                                                                                   |
| **Desarrollo offline**       | `VITE_5ETOOLS_DATA=local` en `.env.local` | JSON en `public/5etools/`                                                                                |

En producción **no hace falta** commitear `races.json`, `backgrounds.json`, `feats.json` ni el resto del mirror: spells, classes, races, backgrounds, feats, items y bestiary se resuelven en runtime desde GitHub. Los JSON en `public/5etools/` que sí están en el repo son solo un subset para probar items/bestiary sin red.

**No configures `VITE_5ETOOLS_DATA=local` en Vercel** — spells y classes requieren cientos de archivos que no van en el repo.

Para desarrollo offline, copia los JSON desde `backup-jsons/5etools/` a `public/5etools/` y crea `.env.local` a partir de [`.env.example`](./.env.example). Ver comentarios en `src/shared/constants/api.constants.ts` para las rutas exactas.

### Deploy en Vercel

- **Build:** `pnpm build` (definido en `vercel.json`)
- **Output:** `dist`
- **Variables de entorno:** ninguna obligatoria
- **Node:** 22.x (`.nvmrc` / `package.json`)

## Fuentes de datos

### Homebrew Amellwind

La información principal proviene de los recursos homebrew de Amellwind en el repositorio de [TheGiddyLimit/homebrew](https://github.com/TheGiddyLimit/homebrew):

- [Amellwind; Monster Hunter Monster Manual](https://raw.githubusercontent.com/TheGiddyLimit/homebrew/master/collection/Amellwind;%20Monster%20Hunter%20Monster%20Manual.json)
- [Amellwind; Amellwind's Guide to Monster Hunting](https://raw.githubusercontent.com/TheGiddyLimit/homebrew/master/collection/Amellwind;%20Amellwind's%20Guide%20to%20Monster%20Hunting.json)

El JSON de la Guía de Caza también aporta species, backgrounds, feats, clases MH, class features (Monstie Sidekick), optional features de armas y reglas variantes (downtime).

### Datos estáticos embebidos

Recursos, entornos, tiendas, combo, cocina, guía de creación de personajes y plantillas del generador de NPCs viven en archivos `*.data.ts` dentro del proyecto.

### Compendio D&D 5e

Spells, classes, items, bestiary, races, backgrounds y feats se cargan desde el mirror de [5etools-src](https://github.com/5etools-mirror-3/5etools-src) (`raw.githubusercontent.com`), con precarga de fuentes habituales (MM, PHB, DMG, etc.) y carga bajo demanda del resto.

## Estructura del proyecto

```text
src/
├── App.tsx                 # Router lazy, sync al arrancar, providers globales
├── components/
│   ├── layout/             # MainLayout, Sidebar, LoadingScreen, NotFound, ThemeSelector
│   ├── data-table/         # Tabla reutilizable (TanStack Table)
│   └── ui/                 # shadcn: button, dialog, input, badge, …
├── features/
│   ├── builder/            # Character Builder (ALPHA) + export/import Foundry VTT
│   ├── damage-calculator/  # Calculadora de daño por turno (persistida en localStorage)
│   ├── monsters/           # Listado + detalle de monstruos MH
│   ├── runes/              # Materiales + planificador (BuildDrawer)
│   ├── material-effects/   # Efectos de materiales (armadura/arma)
│   ├── conditions/         # Condiciones Amellwind
│   ├── diseases/           # Enfermedades Amellwind
│   ├── weapons/            # Hunter Weapons
│   ├── shops/              # Items, tiendas, carrito
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
│   ├── spells/             # Compendio de conjuros 5e
│   ├── classes/            # Compendio de clases 5e
│   ├── dnd-items/          # Compendio de ítems 5e (+ catálogo de equipo del builder)
│   ├── dnd-races/          # Especies oficiales 5e
│   ├── dnd-backgrounds/    # Trasfondos oficiales 5e
│   ├── dnd-feats/          # Dotes oficiales 5e
│   ├── dnd-optionalfeatures/ # Optional features 5e (sin ruta; consumido por el builder)
│   ├── xanathar-backstory/ # Generador de trasfondo (XGE)
│   └── bestiary/           # Bestiario 5e
└── shared/
    ├── constants/          # URLs de API, IndexedDB y constantes D&D (abilities, skills)
    ├── context/            # ThemeContext, SyncContext
    ├── db/                 # IndexedDB y sincronización
    ├── types/              # Tipos compartidos
    ├── services/           # create-entity-service (factory de services)
    ├── components/         # ItemRefText, DndKeywordText, StatBlockSection
    ├── utils/              # Parser 5etools, CR, dedupe-by-name, fluff, etc.
    └── data/               # fetch helper para JSON 5etools
```

Cada feature sigue un patrón similar: `components/`, `services/`, `hooks/`, `mappers/` y, cuando aplica, `data/` o `context/`.

## Documentación para desarrolladores

El archivo [`instrucctions.md`](./instrucctions.md) contiene la documentación técnica detallada: arquitectura de datos, entidades de dominio, mapeos 5etools → Foundry, reglas de negocio y convenciones del código.

## Aviso legal

Este proyecto es una herramienta fan-made para facilitar el uso del homebrew de **Amellwind** (_Monster Hunter D&D 5e_). Todo el contenido, reglas y diseño de ese homebrew son obra de Amellwind; este repositorio **no crea ni modifica** ese material: solo organiza y presenta información que ya está **publicada en internet** (por ejemplo en [5etools](https://5e.tools) y fuentes relacionadas).

La fuente oficial y el trabajo completo del autor están en su Patreon: [patreon.com/cw/amellwind](https://www.patreon.com/cw/amellwind).

**Monster Hunter** es propiedad de Capcom y **Dungeons & Dragons** es propiedad de Wizards of the Coast. Este proyecto no está afiliado ni respaldado por Capcom, Wizards of the Coast, Amellwind ni por ninguna otra marca o autor mencionado.

Los derechos del contenido homebrew corresponden a sus respectivos autores. Consulta las licencias originales en [5etools](https://5e.tools) y en los repositorios fuente.
