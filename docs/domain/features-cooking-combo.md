# Features: Cooking and Combo Crafting

> Split from legacy `instrucctions.md`. Prefer this file over reading the whole domain corpus.

Weapons / shops / Items Forge: [`features-gear.md`](./features-gear.md).

### Cooking System (Artisan Cooking)

**Ruta**: `/cooking`
**Fuente de datos**: datos estáticos embebidos en la app (`cooking.data.ts`). No requiere IndexedDB.

El sistema de cocina artesana permite al DM y a los jugadores gestionar las comidas que otorgan boons a la party durante una cacería. Está modelado sobre las reglas de cocina de la Guía de Caza de Amellwind.

#### Estructura de datos

##### Tipos principales

- **`CookingRank`** — `1 | 2 | 3 | 4`. Los rangos de comida disponibles.
- **`Meal`** — Representa una comida individual:
  - `rank` _(CookingRank)_ — Rango al que pertenece.
  - `name` _(string)_ — Nombre de la comida (ej. `"Wild Bacon"`).
  - `dc` _(number)_ — DC mínimo de la tirada de cocina para preparar el plato.
  - `boon` _(string)_ — Efecto/beneficio que otorga al comerla.
- **`MealTable`** — Tabla de comidas de un rango:
  - `rank` _(CookingRank)_
  - `caption` _(string)_
  - `footnote` _(string)_ — Nota sobre el incremento del DC por más de 4 raciones.
  - `levelRequirement` _(string)_ — Nivel mínimo del personaje (ej. `"5th level"`).
  - `meals` _(Meal[])_
- **`DailySkill`** — Habilidad felyne del día:
  - `index` _(number, 1–25)_ — Resultado en el dado.
  - `name` _(string)_ — Nombre de la habilidad felyne (ej. `"Felyne Sprinter"`).
  - `effect` _(string)_ — Descripción del efecto.
- **`CookingRule`** — Regla de pasos para cocinar:
  - `name` _(string)_
  - `content` _(string[])_

##### Tablas de comidas

| Rango  | DC base | Nivel requerido | Costo por ración | # de platos |
| ------ | ------- | --------------- | ---------------- | ----------- |
| Rank 1 | 10      | Cualquier nivel | 1 sp             | 18          |
| Rank 2 | 13      | 5to nivel       | 1 gp             | 18          |
| Rank 3 | 14      | 10mo nivel      | 5 gp             | 18          |
| Rank 4 | 16      | 15to nivel      | 10 gp            | 16          |

> El DC se incrementa por cada ración adicional sobre 4 (Rank 1: +1; Ranks 2–4: +2).

##### Daily Skills

25 habilidades felyne (índices 1–25). Se obtienen tirando `1d20 + 1d6 − 1`. Si el resultado no especifica duración, el efecto dura 24 horas, hasta terminar un descanso largo, o hasta comer otra comida.

#### Reglas del sistema de cocina (Steps)

1. **Step 1** — Decidir la receta y conseguir los ingredientes. Los ingredientes básicos son fáciles de obtener (menos de 1 sp para 4 personas).
2. **Step 2** — Elegir 3 pasos del proceso culinario (decidir receta, recolectar, preparar ingredientes, cocinar, emplatar) y asignar un ability score diferente a cada uno. Luego hacer las 3 tiradas de ability check. Quien tenga competencia con cooking utensils puede añadir el proficiency bonus a una de las tres tiradas.
3. **Step 3** — Promediar las 3 tiradas y comparar con el DC de la comida:
   - **Éxito**: cuenta como ración del día y otorga el boon.
   - **Éxito por 4+**: tirar una vez en la tabla de Daily Skills.
   - **Éxito por 8+**: tirar dos veces en la tabla de Daily Skills.
   - **Fallo**: comida insípida, cuenta como ración pero sin boon.
   - **Fallo por 5+**: no cuenta como ración; quienes la comen hacen una tirada de Constitución (DC = DC de la comida) o quedan envenenados 1 hora.

#### Pantalla (`CookingPage`)

La pantalla tiene un sistema de pestañas:

| Pestaña      | Contenido                                                                                    |
| ------------ | -------------------------------------------------------------------------------------------- |
| How to Cook  | Tarjetas con las reglas de los 3 pasos + cuadro de resumen de rangos (clickeable).           |
| Rank 1–4     | Panel con nombre, requisito de nivel, costo, nota al pie + tabla de comidas + botón de roll. |
| Daily Skills | Panel explicativo + tabla con las 25 habilidades felyne + botón de roll `1d20 + 1d6 − 1`.    |

- **Botón "Roll Random Meal"**: elige una comida al azar del rango activo. Resalta la fila correspondiente en la tabla y muestra una tarjeta de resultado con el nombre, DC, boon y el número obtenido.
- **Botón "Roll 1d20 + 1d6 − 1"**: calcula un resultado entre 1 y 25, resalta la habilidad en la tabla y muestra una tarjeta de resultado con los dados individuales y el total.
- Cada rango tiene color propio: azul (Rank 1), verde (Rank 2), naranja (Rank 3), rojo (Rank 4).

#### Service (`cooking.service.ts`)

| Función                    | Descripción                                                                         |
| -------------------------- | ----------------------------------------------------------------------------------- |
| `getAllMealTables()`       | Devuelve todas las tablas de comidas (`MealTable[]`).                               |
| `getMealTableByRank(rank)` | Devuelve la tabla de un rango concreto.                                             |
| `getAllMeals()`            | Devuelve todas las comidas de todos los rangos (`Meal[]`).                          |
| `getMealsByRank(rank)`     | Devuelve las comidas de un rango específico.                                        |
| `getAllDailySkills()`      | Devuelve las 25 habilidades felyne del día.                                         |
| `rollRandomMeal(rank)`     | Elige aleatoriamente una comida del rango dado. Devuelve `{ meal, roll }`.          |
| `rollDailySkill()`         | Tira `1d20 + 1d6 − 1` y devuelve la skill correspondiente + los dados individuales. |

---

### Combo List

**Ruta**: `/combo`
**Fuente de datos**: datos estáticos embebidos en la app (`combo.data.ts`). No requiere IndexedDB.

El Combo List es un sistema de crafteo de objetos (pociones, munición, trampas, etc.) típico del universo Monster Hunter. Cada receta indica dos ingredientes a combinar, la herramienta necesaria, el DC de la tirada de crafteo y la cantidad producida.

#### Estructura de datos

##### Tipos principales

- **`ComboRow`** — Fila de receta:
  - `category` _(string)_ — Subcategoría visual dentro de la tabla (ej. `"HEALING"`, `"BUFFS"`, `"TRAPS"`). Puede ser vacío.
  - `name` _(string)_ — Nombre del objeto resultante.
  - `item1` _(string)_ — Primer ingrediente.
  - `item2` _(string | undefined)_ — Segundo ingrediente (opcional; se muestra `—` si no aplica).
  - `dc` _(string | undefined)_ — DC de la tirada de crafteo.
  - `quantity` _(string | undefined)_ — Cantidad producida (ej. `"1"`, `"1d4"`, `"--"`).
- **`ComboToolTable`** — Tabla de recetas de una herramienta:
  - `id` _(string)_ — Identificador interno (ej. `"alchemist"`, `"cook"`, `"smith"`).
  - `toolName` _(string)_ — Nombre legible de la herramienta (ej. `"Alchemist's Supplies"`).
  - `hasCategory` _(boolean)_ — Si la tabla muestra la columna de categoría.
  - `rows` _(ComboRow[])_
- **`ComboRuleSection`** — Sección de reglas:
  - `name` _(string)_
  - `content` _(string[])_
  - `isInset` _(boolean | undefined)_ — Si es verdadero, se renderiza como un bloque destacado (Combo Books).

##### Herramientas disponibles

| ID            | Herramienta          | Tiene categorías |
| ------------- | -------------------- | ---------------- |
| `alchemist`   | Alchemist's Supplies | Sí               |
| `brewer`      | Brewer's Supplies    | No               |
| `cook`        | Cook's Utensils      | No               |
| `glassblower` | Glassblower's Tools  | Sí               |
| `herbalism`   | Herbalism Kit        | No               |
| `poisoner`    | Poisoner's Kit       | No               |
| `smith`       | Smith's Tools        | Sí               |
| `tinker`      | Tinker's Tools       | No               |
| `woodcarver`  | Woodcarver's Tools   | Sí               |

##### Categorías de objetos

Las categorías se usan para agrupar visualmente las filas dentro de una tabla. Cada categoría tiene un color badge propio:

| Categoría              | Color    |
| ---------------------- | -------- |
| HEALING                | verde    |
| BUFFS                  | azul     |
| COATINGS               | morado   |
| DR AMMO / Bowgun Ammo  | naranja  |
| Light Bowgun only ammo | amarillo |
| Heavy Bowgun only ammo | rojo     |
| HORNS                  | teal     |
| BOMBS                  | ámbar    |
| BARREL BOMBS           | rojo     |
| TRAPS                  | cyan     |
| LURES                  | sky      |

#### Reglas del Combo List

- **Cualquier PC** puede craftear cualquier objeto del Combo List siempre que tenga la herramienta requerida. No necesita tener competencia con ella.
- **Proceso**: el jugador declara el objeto que desea fabricar, presenta la herramienta y los ingredientes, y hace una **tirada de crafteo**: `1d20 + modificador de ability score + proficiency bonus` (si es competente con la herramienta).
- **Resultado de la tirada**:
  - **Éxito**: los ingredientes se consumen y el objeto es creado.
  - **Fallo por 5 o menos**: solo 1 ingrediente (a elección del jugador) se consume.
  - **Fallo por 6 o más**: ambos ingredientes se consumen.
- **Ability score**: no está ligado a una herramienta específica. El jugador puede argumentar al DM qué atributo usar. Si hay duda, tanto Wisdom (experiencia/talento natural) como Intelligence (conocimiento/seguir instrucciones) son opciones válidas.
- **Combo Books**: 5 volúmenes de una colección antigua. Mientras el cazador los posea, gana +1 a las tiradas de crafteo acumulativo por cada volumen distinto (máximo +5 con los 5 tomos).

#### Pantalla (`ComboPage`)

La pantalla tiene dos modos de funcionamiento:

**Modo normal (sin búsqueda activa)**:

- Pestañas: una pestaña "Reglas" + una pestaña por cada herramienta disponible.
- **Tab Reglas**: tarjetas con las 3 secciones de reglas + bloque destacado de Combo Books + panel de resumen de herramientas disponibles (clickeable para ir directamente a esa herramienta).
- **Tab de herramienta**: muestra encabezado con nombre de la herramienta y número de recetas, un buscador local para filtrar dentro de la tabla, y la tabla de recetas (columnas: categoría si aplica, objeto, ingrediente 1, ingrediente 2, DC, cantidad).

**Modo búsqueda (cuando el usuario escribe en el buscador global)**:

- Las pestañas se ocultan y se muestra un panel de resultados agrupados por herramienta.
- Muestra el número total de resultados y en cuántas herramientas se encontraron.
- Cada grupo tiene su encabezado con el nombre de la herramienta y el número de resultados dentro de ese grupo.
- Un botón `×` limpia la búsqueda y vuelve al modo normal.

La búsqueda global filtra simultáneamente por nombre del objeto, ingredientes y categoría (case-insensitive).

#### Service (`combo.service.ts`)

| Función                     | Descripción                                                                                |
| --------------------------- | ------------------------------------------------------------------------------------------ |
| `getAllComboTables()`       | Devuelve todas las tablas de herramientas (`ComboToolTable[]`).                            |
| `searchAllComboRows(query)` | Busca en todas las tablas por nombre, ingredientes o categoría. Devuelve `SearchResult[]`. |
| `filterRows(rows, query)`   | Filtra las filas de una tabla concreta por nombre, ingredientes o categoría.               |

`SearchResult` tiene la forma `{ toolId, toolName, row }`.

---

