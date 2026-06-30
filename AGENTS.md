# AGENTS.md

Guía operativa para agentes de IA que trabajan en **Amellwind MH DnD5e Toolbox**. Léela antes de tocar código. Es complementaria, no sustituta, de la documentación humana.

## Mapa de documentación (qué leer y cuándo)

| Documento | Cuándo consultarlo |
| --- | --- |
| `README.md` | Visión de producto, rutas/features, deploy en Vercel, fuentes de datos. |
| `instrucctions.md` | **Fuente de verdad técnica** (91 KB): arquitectura de datos, entidades de dominio, mapeos 5etools → Foundry, reglas de negocio y convenciones. Búscalo con `grep` por encabezado, no lo leas entero. |
| Este `AGENTS.md` | Comandos, convenciones de trabajo y mapa de zonas complejas. |

> Antes de implementar algo no trivial, haz `grep` por su sección en `instrucctions.md` (encabezados `##`/`###`). Casi todo el dominio ya está documentado ahí.

## Stack y datos en una línea

SPA **React 18 + TypeScript + Vite + Tailwind + shadcn/ui (Radix)**, routing con **React Router v6 lazy**, paquetes con **pnpm**, Node **22.x**. Sin backend: datos de Amellwind cacheados en **IndexedDB** (`idb`); compendio D&D 5e cargado bajo demanda desde el mirror de 5etools.

## Comandos

Usa siempre **pnpm** (no npm/yarn). Verificados en `package.json`:

```bash
pnpm install          # dependencias
pnpm dev              # servidor de desarrollo (Vite)
pnpm build            # tsc -b && vite build  → valida tipos + compila
pnpm lint             # eslint estricto: --max-warnings 0 (cero warnings permitidos)
pnpm preview          # vista previa del build
pnpm build:analyze    # build con visualizer del bundle
```

- **Antes de dar por terminado un cambio de código**, corre `pnpm lint` y `pnpm build`. El lint falla con cualquier warning; el build hace type-check completo (`tsc -b`) además de compilar.
- TypeScript está en modo `strict` con `noUnusedLocals` y `noUnusedParameters`: no dejes imports, variables ni parámetros sin usar.

## Convenciones de código

- **Alias de import:** usa `@/...` para todo dentro de `src/` (configurado en `tsconfig.app.json` → `paths`). Evita rutas relativas largas (`../../..`).
- **TypeScript estricto:** sin `any` salvo justificación; tipa props, services y mappers.
- **Estilos:** Tailwind + componentes de `src/components/ui/` (shadcn). No añadas librerías de UI nuevas; reutiliza Radix/shadcn ya presentes.
- **Idioma:** la UI y la documentación están en español; mantén ese idioma en textos visibles y comentarios de dominio. Identificadores de código en inglés.
- **Comentarios:** solo donde aclaran lógica no obvia (mira el header de `create-entity-service.ts` como referencia de estilo).

## Arquitectura por features

El código vive en `src/`:

```text
src/
├── App.tsx              # Router lazy + sync inicial + providers globales
├── components/          # layout/, data-table/ (TanStack Table), ui/ (shadcn)
├── features/<feature>/  # una carpeta por pantalla/dominio
└── shared/              # constants, context, db, services, types, utils, mappers, components
```

**Patrón de feature** (no todas tienen todas las carpetas — copia el patrón de una vecina similar):

```text
features/<x>/
├── components/   # UI de la feature
├── services/     # acceso a datos (ver factory abajo)
├── mappers/      # raw (5etools/IndexedDB) → modelo de dominio
├── hooks/        # lógica de estado/datos
├── data/         # datos estáticos *.data.ts (cuando aplica)
└── context/      # estado local de la feature (cuando aplica)
```

### Capa de datos (clave para no romper nada)

- **Services se construyen con `createEntityService`** (`src/shared/services/create-entity-service.ts`): provee `getAll/getList/getById/getByName/clearCache`, con caché en memoria, dedupe e índices. Para una nueva entidad, **declara un service con esa factory** en vez de hand-rollear caché. Vistas extra (`getXByType`, filtros) son wrappers finos sobre `getAll`.
- **IndexedDB** (`src/shared/db/database.ts` + `sync.service.ts`): stores `mm_*` (Monster Manual) y `gtmh_*` (Guía de Caza), con esquema current/previous/meta. La sincronización corre al arrancar en `App.tsx`; tras un sync exitoso se invalidan cachés en memoria. No accedas a IndexedDB directamente desde componentes: pasa por services.
- **Flujo:** raw JSON (5etools / IndexedDB) → `mapper` → modelo de dominio → `service` (cachea) → `hook` → `component`.

## Zonas complejas (extrema cautela)

Estas áreas tienen reglas de negocio densas. Lee su sección en `instrucctions.md` y los tipos involucrados **antes** de editar.

1. **Character Builder (ALPHA)** — `src/features/builder/`
   - Estado compuesto por **slices de hooks** (`context/slices/`: identity, proficiency, equipment, spell) orquestados por `CharacterBuilderContext`. Hay contextos satélite: `BuilderInventoryContext`, `BuildCompletenessContext`, `RpgbotRatingsContext`.
   - Persistencia propia en `storage/builder.storage.ts`.
   - Depende de varios catálogos (clases, especies, trasfondos, dotes, conjuros, equipo) y del planificador de runas (`RuneBuildProvider`, compartido con `/runes`).

2. **Export Foundry VTT** — `src/features/builder/foundry-export/`
   - Genera un actor `character` de **Foundry dnd5e v12**. Builders separados: `actor.builder.ts`, `item.builders.ts`, `advancement.builders.ts`, `effect.builders.ts`. IDs vía `foundry-id.utils.ts`, tipos en `foundry.types.ts`, tablas de equivalencia en `mappings.ts`.
   - Cambiar un mapeo aquí puede romper la importación en Foundry: respeta la forma exacta del schema dnd5e.

3. **Import Foundry VTT** — `src/features/builder/foundry-import/`
   - `parse-foundry-actor.ts` reconstruye el build haciendo *matching* de cada entidad contra los catálogos de la app. Cambios en nombres/IDs de catálogos pueden romper el matching.

4. **Parsing de 5etools** — `src/shared/utils/` y `src/shared/data/`
   - Parser de tags 5etools (`{@spell ...}`, `{@item ...}`, etc.), cálculo de CR, dedupe-by-name, fluff. La estructura JSON de 5etools es irregular; preserva el manejo de casos límite existente.

5. **Sincronización / IndexedDB** — `src/shared/db/`
   - Tocar `DB_VERSION`, stores o el esquema afecta a la caché offline de todos los usuarios. Cambia con cuidado y considera migraciones.

## Reglas de alcance y seguridad

- **No commitees** el mirror completo de 5etools ni datos masivos a `public/5etools/` (ver README: en producción se resuelve en runtime desde GitHub). `backup_jsons/` es solo respaldo local.
- No introduzcas un backend ni dependencias pesadas sin que se pida: la app es SPA estática desplegada en Vercel (`vercel.json`, output `dist`).
- Cambios quirúrgicos: no reformatees archivos enteros ni toques features ajenas a la tarea.
- Respeta el aviso legal del README: este repo **organiza** contenido ya publicado; no generes ni alteres reglas homebrew.

## Checklist antes de terminar

1. `pnpm lint` sin warnings.
2. `pnpm build` (type-check + compilación) en verde.
3. Cambios acotados a la feature objetivo; imports con alias `@/`; sin código muerto.
4. Si tocaste dominio documentado, actualiza la sección correspondiente de `instrucctions.md`/`README.md`.
