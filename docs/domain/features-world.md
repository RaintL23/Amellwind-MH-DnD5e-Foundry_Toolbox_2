# Features: World (Resources, Environments)

> Split from legacy `instrucctions.md`. Prefer this file over reading the whole domain corpus.

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

### Hunt Planner (habitat filter)

**Ruta**: `/hunt`

Compatible monsters/environments use `HUNT_ENVIRONMENT_MAPPINGS` (location → 5etools `environment` tags) in `hunt-roll.utils.ts`:

- Direct tag overlap with the selected map, **or**
- **Wide-habitat** quarry (≥ 5 mapped hunt biomes, e.g. Rathalos / Rathian) stays available in every hunt environment, **or**
- Monsters with no `environment` tags are treated as unrestricted (same as before for setup validation).

**Hunt Parameters**:

- **Party level tier** can auto-follow APL (`autoTierFromApl`, default on) via `findTierIndexForApl`.
- **Common large** monsters are toggleable chips; you can also **add** extra monsters beyond the tier list. The selected subset feeds prep-table generation.
- Prep tables generate die-sized counts: Signs/Minor Challenges **8 (d8)**, Major Challenges/Benefits **4 (d4)**.

---

