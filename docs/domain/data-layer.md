# Data Layer: Services and Mappers

> Split from legacy `instrucctions.md`. Prefer this file over reading the whole domain corpus.

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

