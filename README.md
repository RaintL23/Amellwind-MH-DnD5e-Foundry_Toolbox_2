# Amellwind Monster Hunter DnD5e Toolbox

Toolkit web para Dungeon Masters que usan el homebrew de **Amellwind**, que combina **Monster Hunter** con **Dungeons & Dragons 5e**. Consulta monstruos, runas, armas, cocina, tiendas y más desde una sola aplicación, con datos cacheados localmente para uso offline entre sesiones.

> **Estado:** v0.0.1 — el Character Builder está en fase **ALPHA**.

## Características

| Sección          | Ruta            | Descripción                                                            |
| ---------------- | --------------- | ---------------------------------------------------------------------- |
| **Monsters**     | `/monsters`     | Bestiario del Monster Manual de Amellwind con stat blocks y detalle    |
| **Runes**        | `/runes`        | Materiales de monstruo y planificador de builds (drawer lateral)       |
| **Weapons**      | `/weapons`      | Armas de cazador (Hunter Weapons) y optional features                  |
| **Cooking**      | `/cooking`      | Sistema de cocina artesana                                             |
| **Combo List**   | `/combo`        | Crafteo y combinaciones de objetos                                     |
| **Items**        | `/items`        | Catálogo de ítems de la Guía de Caza                                   |
| **Shops**        | `/shops`        | Tiendas con carrito de compra                                          |
| **Resources**    | `/resources`    | Recursos de entorno (plantas, minerales, etc.)                         |
| **Environments** | `/environments` | Biomas y tablas de encuentro/recursos                                  |
| **Builder**      | `/builder`      | Character Builder — equipamiento, runas y cálculo de combate _(ALPHA)_ |

## Stack tecnológico

| Capa           | Tecnología            |
| -------------- | --------------------- |
| Framework      | React 18 + TypeScript |
| Build          | Vite                  |
| Estilos        | Tailwind CSS          |
| Componentes UI | shadcn/ui (Radix UI)  |
| Routing        | React Router v6       |
| Almacenamiento | IndexedDB (`idb`)     |
| Paquetes       | pnpm                  |

La app es una **SPA** sin backend propio: los datos provienen de JSONs externos y se guardan en el navegador.

## Requisitos

- [Node.js](https://nodejs.org/) 18 o superior
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
```

Al abrir la app por primera vez (o cuando la caché tiene más de 24 horas), se sincronizan automáticamente los JSONs de Amellwind desde 5etools. Si la red falla, la app sigue funcionando con los datos ya guardados en IndexedDB.

## Fuentes de datos

La información proviene de los recursos homebrew de Amellwind en el repositorio de [TheGiddyLimit/homebrew](https://github.com/TheGiddyLimit/homebrew):

- [Amellwind; Monster Hunter Monster Manual](https://raw.githubusercontent.com/TheGiddyLimit/homebrew/master/collection/Amellwind;%20Monster%20Hunter%20Monster%20Manual.json)
- [Amellwind; Amellwind's Guide to Monster Hunting](https://raw.githubusercontent.com/TheGiddyLimit/homebrew/master/collection/Amellwind;%20Amellwind's%20Guide%20to%20Monster%20Hunting.json)

Algunos contenidos (recursos, entornos, tiendas, combo, cocina) usan datos estáticos embebidos en el proyecto.

## Estructura del proyecto

```text
src/
├── components/          # Layout y componentes UI compartidos
├── features/            # Módulos por dominio (monsters, runes, weapons, …)
├── shared/
│   ├── constants/       # URLs de API y configuración de IndexedDB
│   ├── db/              # Base de datos local y sincronización
│   ├── types/           # Tipos compartidos
│   └── utils/           # Utilidades (parser 5etools, CR, etc.)
└── App.tsx              # Rutas y providers globales
```

Cada feature sigue un patrón similar: `components/`, `services/`, `hooks/`, `mappers/` y, cuando aplica, `data/` o `context/`.

## Documentación para desarrolladores

El archivo [`instrucctions.md`](./instrucctions.md) contiene la documentación técnica detallada: arquitectura de datos, entidades de dominio, mapeos 5etools → Foundry, reglas de negocio y convenciones del código.

## Aviso legal

Este proyecto es una herramienta fan-made para facilitar el uso del homebrew de Amellwind. **Monster Hunter** es propiedad de Capcom y **Dungeons & Dragons** es propiedad de Wizards of the Coast. No está afiliado ni respaldado por ninguna de estas marcas ni por el autor del homebrew.

Los derechos del contenido homebrew corresponden a sus respectivos autores. Consulta las licencias originales en [5etools](https://5e.tools) y en los repositorios fuente.
