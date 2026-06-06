# Amellwind Monster Hunter DnD5e Toolbox

Toolkit web para Dungeon Masters que usan el homebrew de **Amellwind**, que combina **Monster Hunter** con **Dungeons & Dragons 5e**. Consulta monstruos, runas, armas, personajes, cocina, tiendas y más desde una sola aplicación, con datos cacheados localmente para uso offline entre sesiones.

> **Estado:** v0.1.0 — el Character Builder está en fase **ALPHA**.

## Características

### Amellwind Homebrew

| Sección              | Ruta                 | Descripción                                                                 |
| -------------------- | -------------------- | --------------------------------------------------------------------------- |
| **Builder**          | `/builder`           | Character Builder — equipamiento, runas y cálculo de daño por turno _(ALPHA)_ |
| **Creation Guide**   | `/character-guide`   | Guía de creación de personajes del manual (species, roles, skills, etc.)    |
| **Monstie Sidekick** | `/monstie-sidekick`  | Reglas y creador de sidekicks Monstie                                       |
| **NPC Generator**    | `/npc-generator`     | Generador de stat blocks para NPCs humanoides                               |
| **Species**          | `/species`           | Especies y subrazas de la Guía de Caza                                      |
| **Backgrounds**      | `/backgrounds`       | Trasfondos de cazador del manual                                            |
| **Feats**            | `/feats`             | Dotes (feats) del manual                                                    |
| **Monsters**         | `/monsters`          | Bestiario MH con stat blocks, detalle y página dedicada por monstruo        |
| **Runes**            | `/runes`             | Materiales de monstruo y planificador de builds (drawer lateral)            |
| **Weapons**          | `/weapons`           | Armas de cazador (Hunter Weapons) y optional features                       |
| **Items**            | `/items`             | Catálogo de ítems de la Guía de Caza                                        |
| **Shops**            | `/shops`             | Tiendas con carrito de compra                                               |
| **Cooking**          | `/cooking`           | Sistema de cocina artesana                                                  |
| **Combo List**       | `/combo`             | Crafteo y combinaciones de objetos                                          |
| **Environments**     | `/environments`      | Biomas y tablas de encuentro/recursos                                       |
| **Resources**        | `/resources`         | Recursos de entorno (plantas, minerales, etc.)                              |
| **Downtime**         | `/downtime`          | Actividades de tiempo libre del manual                                      |

### Compendio D&D 5e

Datos oficiales de referencia cargados desde [5etools](https://5e.tools) (no son homebrew de Amellwind):

| Sección      | Ruta                          | Descripción                                      |
| ------------ | ----------------------------- | ------------------------------------------------ |
| **Spells**   | `/spells`                     | Conjuros con filtros por clase, nivel y fuente   |
| **Classes**  | `/classes`, `/classes/:id`    | Clases base con página de detalle por variante   |
| **Items**    | `/dnd-items`                  | Ítems mágicos y equipo del PHB/DMG y otras fuentes |
| **Bestiary** | `/bestiary`, `/bestiary/:id`  | Criaturas del MM y otras fuentes, con carga bajo demanda |

## Stack tecnológico

| Capa           | Tecnología                          |
| -------------- | ----------------------------------- |
| Framework      | React 18 + TypeScript               |
| Build          | Vite                                |
| Estilos        | Tailwind CSS                        |
| Componentes UI | shadcn/ui (Radix UI)                |
| Tablas         | TanStack Table                      |
| Routing        | React Router v6 (lazy + Suspense)   |
| Almacenamiento | IndexedDB (`idb`)                   |
| Paquetes       | pnpm                                |

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

### Datos 5etools en local (opcional)

Para desarrollo offline del compendio D&D 5e (spells, classes, items, bestiary), copia los JSON de respaldo a `public/5etools/` y define:

```bash
VITE_5ETOOLS_DATA=local
```

Ver comentarios en `src/shared/constants/api.constants.ts` para las rutas exactas.

## Fuentes de datos

### Homebrew Amellwind

La información principal proviene de los recursos homebrew de Amellwind en el repositorio de [TheGiddyLimit/homebrew](https://github.com/TheGiddyLimit/homebrew):

- [Amellwind; Monster Hunter Monster Manual](https://raw.githubusercontent.com/TheGiddyLimit/homebrew/master/collection/Amellwind;%20Monster%20Hunter%20Monster%20Manual.json)
- [Amellwind; Amellwind's Guide to Monster Hunting](https://raw.githubusercontent.com/TheGiddyLimit/homebrew/master/collection/Amellwind;%20Amellwind's%20Guide%20to%20Monster%20Hunting.json)

El JSON de la Guía de Caza también aporta species, backgrounds, feats, clases MH, class features (Monstie Sidekick), optional features de armas y reglas variantes (downtime).

### Datos estáticos embebidos

Recursos, entornos, tiendas, combo, cocina, guía de creación de personajes y plantillas del generador de NPCs viven en archivos `*.data.ts` dentro del proyecto.

### Compendio D&D 5e

Spells, classes, items y bestiary se cargan desde el mirror de [5etools-src](https://github.com/5etools-mirror-3/5etools-src) (`raw.githubusercontent.com`), con precarga de fuentes habituales (MM, PHB, DMG, etc.) y carga bajo demanda del resto.

## Estructura del proyecto

```text
src/
├── App.tsx                 # Router lazy, sync al arrancar, providers globales
├── components/
│   ├── layout/             # MainLayout, Sidebar, LoadingScreen, NotFound, ThemeSelector
│   ├── data-table/         # Tabla reutilizable (TanStack Table)
│   └── ui/                 # shadcn: button, dialog, input, badge, …
├── features/
│   ├── builder/            # Character Builder (ALPHA)
│   ├── monsters/           # Listado + detalle de monstruos MH
│   ├── runes/              # Materiales + planificador (BuildDrawer)
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
│   ├── dnd-items/          # Compendio de ítems 5e
│   └── bestiary/           # Bestiario 5e
└── shared/
    ├── constants/          # URLs de API e IndexedDB
    ├── context/            # ThemeContext, SyncContext
    ├── db/                 # IndexedDB y sincronización
    ├── types/              # Tipos compartidos
    ├── utils/              # Parser 5etools, CR, etc.
    └── data/               # fetch helper para JSON 5etools
```

Cada feature sigue un patrón similar: `components/`, `services/`, `hooks/`, `mappers/` y, cuando aplica, `data/` o `context/`.

## Documentación para desarrolladores

El archivo [`instrucctions.md`](./instrucctions.md) contiene la documentación técnica detallada: arquitectura de datos, entidades de dominio, mapeos 5etools → Foundry, reglas de negocio y convenciones del código.

## Aviso legal

Este proyecto es una herramienta fan-made para facilitar el uso del homebrew de Amellwind. **Monster Hunter** es propiedad de Capcom y **Dungeons & Dragons** es propiedad de Wizards of the Coast. No está afiliado ni respaldado por ninguna de estas marcas ni por el autor del homebrew.

Los derechos del contenido homebrew corresponden a sus respectivos autores. Consulta las licencias originales en [5etools](https://5e.tools) y en los repositorios fuente.
