# Data Architecture

> Split from legacy `instrucctions.md`. Prefer this file over reading the whole domain corpus.

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
| `gtmh_current`  | `data`: lista mezclada GTMH (overlay local GMBinder/Patreon gana por nombre). Snapshots GitHub por clave: `github`, `githubOptionalfeature`, `githubRace`, `githubSubrace`, `githubBackground`, `githubFeat`, `githubVariantrule`, `githubClassFeature`, `githubClass`, `githubObject`, `githubBookData`. |
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
| `object`       | `object[]`          | Siege weapons AGMH (`objectType: SW`)  |

Al sincronizar GTMH, `sync.service.ts` guarda primero snapshots crudos GitHub (`github*`) y luego aplica merge local-wins con `public/data/gtmh-patreon/supplement.json` para poblar `data`, `feat`, `race`, `optfeatures`, `bookData`, etc. Si una clave local está vacía, se mantiene la lista GitHub/caché como fallback. `bookData` local (Material Effects del dump Patreon) reemplaza el `bookData` de GitHub cuando el overlay lo trae no vacío.

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

