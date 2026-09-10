# Features: Catalog Lists (Monsters, Runes, Conditions)

> Split from legacy `instrucctions.md`. Prefer this file over reading the whole domain corpus.

## Pantallas / Features de la Aplicación

### Listado de Monstruos

**Fuente de datos**: `getMonsterData()` mezcla `mm_current.github` (feed público) con `public/data/mhmm-patreon-2.0/supplement.json` (PDF gratuito de Amellwind, [Loot Tables 2.0](https://www.patreon.com/amellwind/posts/monster-hunter-137502033)). **El PDF gana** por nombre normalizado; GitHub solo aporta nombres que el PDF no tiene. El resultado mezclado se escribe en IndexedDB (`mm_current.data`). Tras editar fichas en `public/data/mhmm-patreon-2.0/monsters/**/*.md`, regenerar con `pnpm build:mm-data` (`.md` → `catalog.json`/`runes.json` → `supplement.json`). Solo overlay: `pnpm build:mm-supplement`.

El dump del PDF aplana listas anidadas de 5etools (p. ej. _Shifting Scales_ de Fatalis) y a veces pega el siguiente `Name (Recharge)` en el texto anterior. `sanitizeNamedEntrySection` (en `mapActorCore`) vuelve a anidar esos hijos bajo el padre y separa acciones pegadas; el JSON de GitHub, que ya trae `type: "list"`, no se toca.

#### Tabla

Mostrar todos los monstruos en una tabla con las siguientes columnas:

| Columna         | Campo fuente         | Notas                                                                                                                                                                                             |
| --------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Name**        | `name`               | Token from `public/mh-tokens` via `resolveMhTokenPath`. Prefixed/suffixed variants (Tempered, Archtempered, Young, Pup, …) reuse the original monster’s token when they have no art of their own. |
| **CR**          | `cr`                 | String: puede ser `"1/2"`, `"0"`, `"19"`, etc.                                                                                                                                                    |
| **Tier**        | calculado desde `cr` | Ver tabla de cálculo abajo.                                                                                                                                                                       |
| **Type**        | `type.type`          | Capitalizar (`"wyvern"` → `"Wyvern"`).                                                                                                                                                            |
| **Environment** | `environment`        | Array → separado por comas. Vacío si no tiene.                                                                                                                                                    |

**Cálculo de Tier** a partir del CR:

| Tier   | Rango de CR          | Valores posibles en el JSON      |
| ------ | -------------------- | -------------------------------- |
| Tier 0 | CR < 1               | `"0"`, `"1/8"`, `"1/4"`, `"1/2"` |
| Tier 1 | CR 1 – 8 (inclusive) | `"1"` … `"8"`                    |
| Tier 2 | CR 9 – 16            | `"9"` … `"16"`                   |
| Tier 3 | CR 17 – 24           | `"17"` … `"24"`                  |
| Tier 4 | CR 25 – 30           | `"25"` … `"30"`                  |

**Implementación del parser de CR:**

El campo `cr` es siempre un `string`. Para calcular el Tier hay que convertirlo a número primero:

```ts
function parseCR(cr: string): number {
  if (cr.includes("/")) {
    const [num, den] = cr.split("/").map(Number);
    return num / den; // "1/2" → 0.5, "1/4" → 0.25
  }
  return Number(cr);
}

function getTier(cr: string): number {
  const value = parseCR(cr);
  if (value < 1) return 0;
  if (value <= 8) return 1;
  if (value <= 16) return 2;
  if (value <= 24) return 3;
  return 4;
}
```

#### Filtros

Cada columna debe ser filtrable de forma independiente:

- **Name**: input de texto libre, filtrado por coincidencia parcial (case-insensitive).
- **CR**: selector de valores únicos presentes en los datos.
- **Tier**: selector múltiple (Tier 0 – Tier 4).
- **Type**: tipos base (`type.type`) como pills planos. Si el tipo tiene subcategorías MH en `type.tags` (p. ej. `wyvern` → flying / brute / fanged), aparece como acordeón expandible con **All {Type}** y pills `Flying Wyvern`, `Fanged Wyvern`, etc. Los valores de filtro usan `type` o `type:tag` en la URL.
- **Environment**: selector de valores únicos (expandiendo los arrays).

#### Detalle del monstruo

Al hacer clic en cualquier fila, se navega a **`/monsters/:monsterId`** (`MonsterDetailPage`) con el stat block completo en formato visual D&D 5e:

- Encabezado: nombre, tamaño, tipo, alineamiento.
- AC, HP (con fórmula), velocidades.
- Tabla de los 6 atributos con sus valores y modificadores calculados.
- Saving throws con competencia.
- Skills con competencia.
- Resistencias, inmunidades y vulnerabilidades a daño.
- Inmunidades a condiciones.
- Sentidos y passive Perception.
- Idiomas y CR.
- Traits (rasgos pasivos), Actions, Bonus Actions, Reactions y Legendary Actions, cada uno en su sección.
- Tabla de loot (carve/capture) si el monstruo la tiene.

### Listado de Runas

**Fuente de datos**: `getMonsterData()` (PDF Patreon 2.0 gana; GitHub rellena nombres ausentes), procesado con `RuneMapper`. La atribución del PDF está en la lista de Runes y de Monsters.

#### Columnas de la tabla

Mostrar todos los materiales de todos los monstruos en una tabla con las siguientes columnas:

| Columna     | Campo fuente    | Notas                                                                    |
| ----------- | --------------- | ------------------------------------------------------------------------ |
| **Name**    | `name`          |                                                                          |
| **Monster** | `monsterName`   | Nombre del monstruo de origen.                                           |
| **Slots**   | `slots`         | Mostrar como badges: `A` (Armor) y/o `W` (Weapon).                       |
| **Carve**   | `carveChance`   | Mostrar `—` si el valor es `"-"`.                                        |
| **Capture** | `captureChance` | Mostrar `—` si el valor es `"-"`.                                        |
| **Tags**    | `tags`          | Mostrar los primeros 2–3 tags como badges. El resto se ve en el detalle. |

#### Filtros disponibles

Cada columna debe ser filtrable de forma independiente:

- **Name**: input de texto libre, filtrado por coincidencia parcial (case-insensitive) sobre nombre, monstruo y texto de efecto ya parseado. Al cargar `/runes` se precarga un índice (`buildRuneSearchIndex`) para que teclear no vuelva a parsear markup 5etools ni cruzar el catálogo de material effects.
- **Slots**: selector múltiple con opciones `Armor` y `Weapon`.
- **Tags**: selector múltiple con todos los valores únicos de tags presentes en los datos, agrupados por categoría (`class:`, `weapon-type:`, `mechanic:`).
- **Tier**: selector por tier de material (1–4), alineado con el CR del monstruo de origen.
- **Obtención**: selector con opciones `Carveable`, `Capturable`, `Ambas` (para filtrar si `carveChance` o `captureChance` no es `"-"`).

La pantalla incluye **paginación** configurable, panel colapsable **`RulesPanel`** con las reglas oficiales de materiales en armadura, arma y trinkets, e integración con **`RuneBuildContext`**: las runas ya colocadas en el planificador se resaltan en la tabla y se pueden añadir desde el detalle.

#### Detalle de la Runa (dialog)

Al hacer clic en cualquier fila, se abre un **dialog** con la información completa del material.

##### Encabezado del dialog

- Nombre del material.
- Nombre del monstruo de origen (con link o referencia al detalle del monstruo si aplica).
- Badges de slots (`Armor`, `Weapon`).

##### Obtención

- Fila: `Carve` — chance en dado d20 (ej. `1–6`) o `No carveable`.
- Fila: `Capture` — chance en dado d20 o `No capturable`.

##### Efectos del material

- Si `slots` incluye `"A"`: sección **Armor Effect** con el texto del efecto. Tags 5etools `{@spell}`, `{@item}`, `{@condition}`, `{@disease}`, `{@class}`, `{@race}` se renderizan como hipervínculos en la UI. Hechizos/ítems/etc. navegan a su lista (`/spells?spell=Dimension+Door`, …). **Conditions/diseases** abren un dialog de detalle *en el sitio* (sin salir de la página) vía `ConditionDiseasePreviewProvider` (catálogo MH + D&D 5e). Además, `DndRichText` auto-enlaza nombres de hechizos en prosa sin tag (`haste spell`, `speak with dead spell`, `mending cantrip`, listas `burning hands (1 rune)`) vía `spell-phrase-links.utils.ts` + catálogo `getListSpells` (nombres de una sola palabra requieren cue `spell`/`cantrip` o un paréntesis de lista para evitar falsos positivos), y nombres de conditions/diseases (MH + D&D) vía `condition-phrase-links.utils.ts`.
- Si `slots` incluye `"W"`: sección **Weapon Effect** con el mismo tratamiento de enlaces.
- Si el material tiene ambos slots, mostrar ambas secciones separadas.
- Sección **Other** (materiales no equipables): mismo `DndRichText` / auto-link de hechizos.

##### Tags del material

- Lista completa de todos los tags, agrupados por categoría.
- Cada tag se muestra como un badge con color diferente según su categoría: clase (azul), tipo de arma (naranja), mecánica (verde).

### Material Effects, Conditions y Diseases

Tres listados de referencia derivados del homebrew Amellwind, con caché en memoria invalidada tras sync de MM/GTMH:

| Feature               | Ruta                                   | Fuente / servicio                                                        | Contenido                                                                                                                                                                                                                                                        |
| --------------------- | -------------------------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Material Effects      | `/material-effects`                    | `material-effect.service.ts` (`MaterialEffectList`) desde `bookData` GTMH (overlay Patreon en `supplement.json` gana si está presente) | Efectos de materiales de monstruo (slots armadura/arma) consultables sin pasar por la tabla de runas. En `/runes`, la rareza del efecto también puede inferirse de resistencia (Rare), inmunidad a daño / bypass de inmunidad (Legendary) cuando el texto no cita un efecto nombrado. |
| Conditions + Diseases (MH) | `/conditions` (`/diseases` → redirect) | `condition.service.ts` + `disease.service.ts` (`ConditionsDiseasesPage`) | Condiciones blight, venenos y enfermedades del PDF Patreon 2.0 (el JSON de GitHub rellena nombres ausentes) |
| Conditions + Diseases (D&D) | `/dnd-conditions` | `dnd-condition.service.ts` (`DndConditionsDiseasesPage`) | Condiciones, statuses y enfermedades oficiales 5e desde `conditionsdiseases.json` (PHB/XPHB/DMG/aventuras) |

Sus cachés se limpian en el bootstrap (`clearMaterialEffectCache`, `clearConditionCache`, `clearDiseaseCache`).

