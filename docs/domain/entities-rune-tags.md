# Entities: Rune tags

> Split from legacy `instrucctions.md`. Prefer this file over reading the whole domain corpus.

Core rune model / mapper: [`entities-rune.md`](./entities-rune.md).

#### Atributos de la entidad Rune

- **name** _(string)_ — Nombre del material (ej. `"Acidic Glavenus Scale"`).
- **monsterName** _(string)_ — Nombre del monstruo del que proviene (ej. `"Acidic Glavenus"`).
- **monsterSource** _(string)_ — Código de la fuente del monstruo (ej. `"MHMM"`).
- **carveChance** _(string)_ — Rango de d20 para obtenerlo por carve (ej. `"1-6"`). Valor `"-"` si no es carveable.
- **captureChance** _(string)_ — Rango de d20 para obtenerlo por captura (ej. `"1-4"`). Valor `"-"` si no es capturable.
- **rolls** _(int)_ — Número de tiradas de d20 al carvear o capturar al monstruo (ej. `3`). Es el mismo valor para ambos modos de obtención — viene del campo `"Carves/Capture"` del JSON.
- **slots** _(array)_ — Tipos de equipo donde se puede usar. Valores posibles: `"A"` (Armor), `"W"` (Weapon). Puede ser `["A"]`, `["W"]`, o `["A", "W"]`. Mapeado desde el string `"(A,W)"` del JSON. Filas de loot con slot **`O`** (Other: upgrade bones, crafting mats, sellables, rations…) quedan con `slots: []`; el mapper las sigue emitiendo para la tabla de carve del monstruo, pero **`getAllRunes()`** las excluye del catálogo `/runes` y del picker del Builder (`isPlaceableRune`). Tras mapear todos los monstruos, `backfillSharedOtherEffects` rellena `otherEffect` vacío en filas O copiando el texto más corto conocido para el mismo `name` o su base sin cantidad (`B.Sleep Sac x2` ↔ `B.Sleep Sac`, `2x Paddock Oil` ↔ `Paddock Oil`). El lookup de efectos A/W/O usa la misma normalización. `normalizeLootChance` unifica guiones tipográficos (`—`) a `"-"`.
- **armorEffect** _(string | null)_ — Texto del efecto cuando se coloca en armadura. Presente solo si `slots` incluye `"A"`. El texto puede contener marcado de 5etools que debe parsearse.
- **weaponEffect** _(string | null)_ — Texto del efecto cuando se coloca en un arma. Presente solo si `slots` incluye `"W"`. Ídem sobre el marcado.
- **otherEffect** _(string | null)_ — Texto de la lista `OTHER MATERIAL EFFECTS` (crafting, upgrade bones, rations, sellables, consumables, etc.). No es un efecto de equipo; se muestra en el detalle de la runa (p. ej. desde Carve / Capture) y **no** habilita Add to Build.
- **monsterCr** _(string)_ — CR del monstruo de origen (para referencia y filtros).
- **tier** _(1 | 2 | 3 | 4)_ — Rareza del material derivada del CR del monstruo (no confundir con el Tier de monstruos en la tabla de Monsters):

  | Tier | CR del monstruo |
  | ---- | --------------- |
  | 1    | 1 – 4           |
  | 2    | 5 – 10          |
  | 3    | 11 – 16         |
  | 4    | 17+             |

- **tags** _(string[])_ — Tags combinados de `armorEffect` y `weaponEffect` (ver taxonomía más abajo).
- **weaponTags** _(string[])_ — Tags extraídos solo del `weaponEffect` (validación de reglas de arma).
- **armorTags** _(string[])_ — Tags extraídos solo del `armorEffect` (validación de reglas de armadura).

#### Lógica del mapper (pseudocódigo)

```text
por cada monster en mm_current:

  // 1. Encontrar el inset dentro de fluff.entries
  inset = monster.fluff?.entries?.find(e => e.type === "inset")
  si no existe inset → saltar este monstruo (no tiene datos de loot)

  // 2. Extraer tablas y listas del inset
  lootTable    = inset.entries.find(e => e.type === "table" && e.colLabels?.[0] === "Carve Chance")
  headerTable  = inset.entries.find(e => e.type === "table" && !e.colLabels)
  armorList    = inset.entries.find(e => e.type === "list" && e.name === "ARMOR MATERIAL EFFECTS")
  weaponList   = inset.entries.find(e => e.type === "list" && e.name === "WEAPON MATERIAL EFFECTS")
  otherList    = inset.entries.find(e => e.type === "list" && e.name === "OTHER MATERIAL EFFECTS")

  // 3. Indexar efectos por nombre de material (pueden ser undefined si no existe la lista)
  armorEffects  = indexarPorNombre(armorList?.items)   // { "Material Name" → item }
  weaponEffects = indexarPorNombre(weaponList?.items)  // { "Material Name" → item }
  otherEffects  = indexarPorNombre(otherList?.items)   // { "Material Name" → item }

  // 4. Leer número de tiradas de la tabla de cabecera
  rolls = parseInt(headerTable?.rows[0][3]) ?? 0       // "3" → 3

  // 5. Emitir una Rune por cada fila de la tabla de loot
  por cada row en lootTable.rows:
    emitir Rune {
      name:           row[2],
      monsterName:    monster.name,
      monsterSource:  monster.source,
      carveChance:    row[0],                                    // "1-6" o "-"
      captureChance:  row[1],                                    // "1-4" o "-"
      rolls:          rolls,                                     // mismo valor para carve y capture
      slots:          parsearSlots(row[3]),                      // "(A,W)" → ["A", "W"]
      armorEffect:    armorEffects[row[2]]?.entries.join(" ") ?? null,
      weaponEffect:   weaponEffects[row[2]]?.entries.join(" ") ?? null,
      otherEffect:    otherEffects[row[2]]?.entries.join(" ") ?? null,
    }
```

#### Notas del mapper

- `armorList` y `weaponList` pueden no existir si todos los materiales del monstruo son de un solo tipo de slot. El mapper debe tolerar la ausencia de cualquiera de las dos listas sin romper.
- Un material con `slots: ["A", "W"]` tendrá entrada en **ambas** listas de efectos, con el mismo nombre pero descripciones distintas.
- Un material con `carveChance: "-"` solo se obtiene por captura, y viceversa.
- Las listas de efectos pueden contener nombres de materiales que **no aparecen en la tabla de loot** (datos huérfanos). Se ignoran — solo se procesan los materiales presentes en `lootTable.rows`.
- El campo `rolls` es un entero único que aplica tanto para las tiradas de carve como de captura (es así en el JSON fuente: `"Carves/Capture": "3"`).

---

#### Atributo `tags`

- **tags** _(string[])_ — Array de etiquetas derivadas **automáticamente** del texto del efecto (`armorEffect` y/o `weaponEffect`). Una runa puede tener múltiples tags. El array puede estar vacío si el texto no coincide con ningún patrón conocido.

Los tags se extraen aplicando las reglas de detección sobre el texto del efecto **antes** de parsear el marcado de 5etools.

##### Taxonomía de tags

Los tags se agrupan en tres categorías. Los prefijos de categoría son parte del valor del tag:

**1. Restricción de clase** (`class:X`)

Se detectan a partir del patrón `{@i (NombreClase only)}` al inicio del texto del efecto. Un efecto puede restringirse a varias clases a la vez (ej. `(Druid, Sorcerer, Warlock, & Wizard only)`) — en ese caso se emite un tag por cada clase listada.

| Tag                 | Detectado cuando el texto contiene   |
| ------------------- | ------------------------------------ |
| `class:spellcaster` | `spellcaster only`                   |
| `class:monk`        | `Monk only`                          |
| `class:druid`       | `Druid` dentro del patrón `only`     |
| `class:sorcerer`    | `Sorcerer` dentro del patrón `only`  |
| `class:warlock`     | `Warlock` dentro del patrón `only`   |
| `class:wizard`      | `Wizard` dentro del patrón `only`    |
| `class:cleric`      | `Cleric` dentro del patrón `only`    |
| `class:paladin`     | `Paladin` dentro del patrón `only`   |
| `class:ranger`      | `Ranger` dentro del patrón `only`    |
| `class:artificer`   | `artificer` dentro del patrón `only` |
| `class:bard`        | `Bard` dentro del patrón `only`      |
| `class:barbarian`   | `Barbarian` dentro del patrón `only` |
| `class:fighter`     | `Fighter` dentro del patrón `only`   |
| `class:rogue`       | `Rogue` dentro del patrón `only`     |

**2. Restricción de tipo de arma** (`weapon-type:X`)

Misma regla que las clases pero con nombres de armas. Patrón: `{@i (TipoArma only)}`.

| Tag                         | Detectado cuando el texto contiene                       |
| --------------------------- | -------------------------------------------------------- |
| `weapon-type:bladed`        | `Bladed Weapon only`                                     |
| `weapon-type:melee`         | `Melee Weapon only`                                      |
| `weapon-type:ranged`        | `Ranged weapon only`                                     |
| `weapon-type:insect-glaive` | `Insect Glaive only`                                     |
| `weapon-type:greatsword`    | `Greatsword` dentro del patrón `only`                    |
| `weapon-type:lance`         | `Lance` dentro del patrón `only`                         |
| `weapon-type:bow`           | `Bow only`                                               |
| `weapon-type:gunlance`      | `Gunlance only`                                          |
| `weapon-type:hammer`        | `Hammer` dentro del patrón `only`                        |
| `weapon-type:charge-blade`  | `Charge blade` o `Charge Blade` dentro del patrón `only` |
| `weapon-type:switchaxe`     | `switchaxe` dentro del patrón `only`                     |

**3. Mecánica del efecto** (`mechanic:X`)

Se detectan buscando palabras clave o marcado de 5etools en el cuerpo del texto del efecto.

| Tag                                 | Regla de detección                                                                                                                                                                                                                                                                                                                                                              |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `mechanic:spell`                    | Contiene `{@spell` **o** prosa MHMM (`cast the Earth Tremor spell` / `know the ice knife spell`): se resuelve el nivel en el catálogo de conjuros → `mechanic:spell:lvlN` (1–9). Cantrip (nivel 0) → solo `mechanic:cantrip`. Si el conjuro no está en el catálogo, fallback `lvl1-2` / `lvl3+` por texto/runas. Un _upcast_ explícito (`at 2nd level`) sube el nivel efectivo. |
| `mechanic:spell:one-use`            | Concede un único uso por recarga (`once per long rest` / `once a day` / `once used… can't… again`). No aplica a `at will`, bancos de runas (`expend` + runes) ni usos múltiples (`twice` / `three times`).                                                                                                                                                                      |
| `mechanic:spell:prepared`           | Grant _always prepared_ / no cuenta contra el límite de preparación (`always have it prepared`, `doesn't count against the number of spells you can prepare`). Requiere que el efecto también conceda un conjuro/cantrip.                                                                                                                                                       |
| `mechanic:rune-charges`             | Contiene `rune` seguido de número (ej. `"3 runes"`, `"has 4 runes"`)                                                                                                                                                                                                                                                                                                            |
| `mechanic:critical`                 | Contiene `critical` / `critically` (p. ej. _Critical Status_). Ya **no** cubre un 20 natural por sí solo                                                                                                                                                                                                                                                                        |
| `mechanic:roll-20`                  | Contiene `roll a 20` o `natural 20` (el trigger es el dado, no necesariamente un crítico)                                                                                                                                                                                                                                                                                       |
| `mechanic:push`                     | Empuja al objetivo (`is/are/be pushed`, `pushed back N`, `push the creature/target`). No aplica a lockouts defensivos (`cannot/can't be pushed`)                                                                                                                                                                                                                                |
| `mechanic:area`                     | Forma de área: `N-foot cone/line/radius/sphere/cube/cylinder` (p. ej. oleada de magma en cono)                                                                                                                                                                                                                                                                                  |
| `mechanic:no-damage`                | Rider de `roll-20` cuyo payoff no es daño extra ni un ataque adicional                                                                                                                                                                                                                                                                                                          |
| `mechanic:unarmed`                  | Afecta **tus** unarmed strikes (`make an unarmed strike`, `your unarmed strikes`). No aplica a thorns de armadura                                                                                                                                                                                                                                                               |
| `mechanic:natural-weapon`           | Afecta **tus** / de raza natural weapons (`Race with natural weapons only`, `your race's natural weapon`). No aplica a thorns (`hits you with … a natural melee weapon`)                                                                                                                                                                                                        |
| `mechanic:extra-damage`             | Contiene `extra {@damage`, `extra NdX` o `extra N … damage` → se emite como `:minor` / `:major` según score                                                                                                                                                                                                                                                                     |
| `mechanic:resistance`               | Contiene `resistance to` o `resistant to` seguido de tipo de daño                                                                                                                                                                                                                                                                                                               |
| `mechanic:damage-reduction`         | Reduce daño entrante: `reduce … damage you take by N` (DR elemental plano), `reduce damage you take from … by N`, `when you take damage … reduce`, o `damage … is reduced by/to`                                                                                                                                                                                               |
| `type:defensive`                    | Menos daño recibido, AC, resistencia/inmunidad, DR, ventaja en saves defensivos, etc. (inferido por `typeTags()`)                                                                                                                                                                                                                                                             |
| `type:offensive`                    | Más daño, críticos, buffs de ataque/daño, condiciones on hit (inferido por `typeTags()`)                                                                                                                                                                                                                                                                                        |
| `type:support`                      | Ayuda a aliados / `willing creature` (inferido por `typeTags()`)                                                                                                                                                                                                                                                                                                                |
| `mechanic:immunity`                 | Contiene `immune to` / `immunity to`, **o** lockout de condición sin esa frase (`cannot be knocked prone`, `can't be stunned`, `cannot be poisoned, paralyzed, or stunned`). No incluye _can't be afflicted…_ (eso es `against-condition`) ni utilidades (`cannot be used/pushed/detected`)                                                                                     |
| `mechanic:bonus-action`             | Contiene `bonus action`                                                                                                                                                                                                                                                                                                                                                         |
| `mechanic:reaction`                 | Contiene `reaction`                                                                                                                                                                                                                                                                                                                                                             |
| `mechanic:saving-throw`             | Contiene `saving throw` (ventaja/desventaja, bonus a tus saves, o saves impuestos al objetivo)                                                                                                                                                                                                                                                                                  |
| `mechanic:save-bonus`               | `+N bonus to/on … saving throws` (Evade Extender) **o** `do so with a +N bonus` tras un saving throw (p. ej. vs knocked prone)                                                                                                                                                                                                                                                  |
| `mechanic:save-{ability}`           | Buff a un save concreto (p. ej. Dexterity → `save-dexterity`). No aplica a “must make a Dexterity saving throw”                                                                                                                                                                                                                                                                 |
| `mechanic:attack-roll`              | Menciona `attack roll(s)` (ventaja / bonus a tus tiradas de ataque)                                                                                                                                                                                                                                                                                                             |
| `mechanic:initiative`               | Buff a iniciativa (`advantage on initiative rolls`, `add a dN to your initiative`, `first in the initiative order`). No aplica a FastCharge (_when you roll for initiative, gain charges_)                                                                                                                                                                                      |
| `mechanic:initiative:major`         | Control fuerte de iniciativa: dado d8+ y / o forzar el primer puesto en el orden                                                                                                                                                                                                                                                                                                |
| `mechanic:heal-other`               | Mejora la curación que **tú** aplicas a **otras** criaturas → se emite como `:minor` / `:major` (Astalos Scissortail, Lay on Hands + THP, transferencias Malzeno). No aplica a Recovery Up / Hasten Recovery (self)                                                                                                                                                             |
| `mechanic:skill-bonus`              | Contiene `+N bonus on/to` junto a `{@skill` **o** prosa (`+2 bonus to Athletics checks` / `Climb checks`)                                                                                                                                                                                                                                                                       |
| `mechanic:skill-{name}`             | Por cada `{@skill Name}` o nombre bare de skill cerca de `checks` (p. ej. Insight → `skill-insight`). Alias MHMM: Climb → Athletics                                                                                                                                                                                                                                             |
| `mechanic:disarm`                   | Contiene `disarmed` (p. ej. _advantage on checks against being disarmed_)                                                                                                                                                                                                                                                                                                       |
| `mechanic:armor-class`              | Contiene `\bAC\b` o `armor class`                                                                                                                                                                                                                                                                                                                                               |
| `mechanic:spell-buff:save`          | Bonus / incremento al _spell save DC_ (`+N bonus to … spell save DC`, `increase the spell save DC by N`). No aplica a bancos de runas (_cast … using your spell save DC_)                                                                                                                                                                                                       |
| `mechanic:spell-buff:damage`        | Bonus / ventaja a _spell attack rolls_ / _spell attack bonus_ o daño de hechizos. Acepta `+ N`, `gain +N to spell attack`, etc.                                                                                                                                                                                                                                                 |
| `mechanic:condition`                | Contiene `{@condition`, inmunidad a una condición, o un nombre conocido (PHB + blight MH: poisoned, stunned, waterblight, frenzy virus, …)                                                                                                                                                                                                                                      |
| `mechanic:condition-{n}`            | Por cada condición nombrada (p. ej. stunned → `condition-stunned`, poisoned → `condition-poisoned`, waterblight → `condition-waterblight`). Alias: `paralysis` → `paralyzed`.                                                                                                                                                                                                   |
| `mechanic:against-condition`        | Ayuda a **evitar** adquirir una condición (advantage / save-bonus en saves vs being X / _the X condition_ / _or be knocked prone_ / paralysis, _can't be afflicted with_). **No** incluye inmunidad total a la condición                                                                                                                                                        |
| `mechanic:advantage`                | Contiene `advantage` (también junto a saving throws)                                                                                                                                                                                                                                                                                                                            |
| `mechanic:passive`                  | Efecto siempre activo (p. ej. _while you wear_ / _you have…_) sin gastar action / BA / reaction                                                                                                                                                                                                                                                                                 |
| `mechanic:active`                   | Efecto activado: `as an action`, `bonus action` o `reaction` (gana sobre passive si ambos aplicarían)                                                                                                                                                                                                                                                                           |
| `mechanic:disease`                  | Contiene `disease` / `diseases`                                                                                                                                                                                                                                                                                                                                                 |
| `mechanic:movement`                 | Speed / movement (grants o debuffs). Modos: `burrowing`, `swimming`, `flying`, `climbing`, `walking-speed`, `difficult-terrain`. `movement:major` si walk +10/doubles o fly ≥60 ft                                                                                                                                                                                              |
| `mechanic:burrowing`                | `burrowing speed`                                                                                                                                                                                                                                                                                                                                                               |
| `mechanic:swimming`                 | `swimming speed`                                                                                                                                                                                                                                                                                                                                                                |
| `mechanic:flying`                   | `flying speed`                                                                                                                                                                                                                                                                                                                                                                  |
| `mechanic:climbing`                 | `climbing speed` / Spider Climb                                                                                                                                                                                                                                                                                                                                                 |
| `mechanic:walking-speed`            | `walking speed increases/becomes/doubles` o `your speed increases`                                                                                                                                                                                                                                                                                                              |
| `mechanic:difficult-terrain`        | Contiene `difficult terrain`                                                                                                                                                                                                                                                                                                                                                    |
| `mechanic:ignore-difficult-terrain` | `ignore difficult terrain` o _doesn't cost … extra movement/moment_                                                                                                                                                                                                                                                                                                             |
| `mechanic:icy-surfaces`             | `icy surfaces` / difficult terrain de _ice or snow_                                                                                                                                                                                                                                                                                                                             |
| `mechanic:movement-climb`           | Trepar sin check en superficies (p. ej. _climb icy surfaces without … ability check_). Distinto de `climbing` (climbing speed / Spider Climb)                                                                                                                                                                                                                                   |
| `mechanic:underwater`               | Contiene `underwater`                                                                                                                                                                                                                                                                                                                                                           |
| `mechanic:hold-breath`              | Contiene `hold breath` / `hold your breath`                                                                                                                                                                                                                                                                                                                                     |
| `mechanic:long-rest`                | Contiene `long rest` (recarga **o** duración de descanso)                                                                                                                                                                                                                                                                                                                       |
| `mechanic:short-rest`               | Contiene `short rest`                                                                                                                                                                                                                                                                                                                                                           |
| `mechanic:accelerated-rest`         | Acorta la duración del descanso (_benefits of a long rest after 4 hours instead of 8_). Distinto de recargas _once / finish a long rest_                                                                                                                                                                                                                                        |
| `mechanic:mithral`                  | Paquete estilo _Mithral Armor_: armadura light/flexible, bajo ropa, sin desventaja en Stealth ni requisito de Fuerza                                                                                                                                                                                                                                                            |
| `mechanic:healing`                  | Contiene `regain` o `restore` seguido de `hit points`                                                                                                                                                                                                                                                                                                                           |
| `mechanic:end-dot`                  | Termina un efecto de daño continuo al inicio de tu turno (`damage to you at the start of your turn` + `ends the effect`; Recovery Level)                                                                                                                                                                                                                                        |
| `mechanic:spell-slot`               | Recupera un _spell slot_ (`regain` / `restore` / `recover` + `spell slot(s)`), no “without expending a spell slot”. Si el texto nombra un máximo (`up to 4th level`) → `mechanic:spell-slot:lvlN`.                                                                                                                                                                              |
| `mechanic:cantrip`                  | Contiene `cantrip`, o un conjuro del catálogo resuelto como nivel 0 (`{@spell` o prosa)                                                                                                                                                                                                                                                                                         |
| `mechanic:spellcasting-focus`       | El arma/ítem se puede usar como _spellcasting focus_ (_use this weapon as your spellcasting focus_). Distinto de `focus-points`                                                                                                                                                                                                                                                 |
| `mechanic:class-feature`            | Contiene el nombre de una feature de clase específica (ej. `wyvernfire`, `dragonpiercer`, `Guard AC`, `Mighty Weapon`)                                                                                                                                                                                                                                                          |
| `mechanic:item-related`             | Contiene `{@item` (uso / proficiency / conjuro de ítems: bombas, ammo, kits, pociones, etc.)                                                                                                                                                                                                                                                                                    |
| `mechanic:trap`                     | Subconjunto de `item-related`: pitfall/shock trap(+ ) o trap tool (trampas MH)                                                                                                                                                                                                                                                                                                  |
| `mechanic:gather-resources`         | Utilidad de recolección de campo MH (Botanist / Geologist / Fisherman / Pack Rat / Whim, …). Variantes fuertes (`1d4`, double de party, free gather) → también `mechanic:gather-resources:major`                                                                                                                                                                                |
| `mechanic:fishing`                  | `catch fish` / `fishing pole` / `sushifish` (también emite `gather-resources`)                                                                                                                                                                                                                                                                                                  |
| `mechanic:mining`                   | `mining resource` / `mine or gather` / `mineral resource` / Mineralogist / Crystallography                                                                                                                                                                                                                                                                                      |
| `mechanic:plant`                    | `plant resource` / herbalist kit / Honey Hunter                                                                                                                                                                                                                                                                                                                                 |
| `mechanic:bone`                     | `bone resource` (Archaeologist)                                                                                                                                                                                                                                                                                                                                                 |
| `mechanic:foraging`                 | `harvest mushrooms` (Forager). No aplica a Fortitude (_track, forage, or travel_)                                                                                                                                                                                                                                                                                               |
| `mechanic:insects`                  | `bug net` / Entomologist / insect resources                                                                                                                                                                                                                                                                                                                                     |
| `mechanic:class-resource`           | Pool de clase (ki, Channel Divinity, sorcery points, …). Siempre junto al tag específico del pool                                                                                                                                                                                                                                                                               |
| `mechanic:ki`                       | Contiene `ki point(s)`                                                                                                                                                                                                                                                                                                                                                          |
| `mechanic:channel-divinity`         | Contiene `channel divinity`                                                                                                                                                                                                                                                                                                                                                     |
| `mechanic:sorcery-points`           | Contiene `sorcery point(s)`                                                                                                                                                                                                                                                                                                                                                     |
| `mechanic:superiority-dice`         | Contiene `superiority dice`                                                                                                                                                                                                                                                                                                                                                     |
| `mechanic:bardic-inspiration`       | Contiene `bardic inspiration`                                                                                                                                                                                                                                                                                                                                                   |
| `mechanic:focus-points`             | Contiene `focus point(s)`                                                                                                                                                                                                                                                                                                                                                       |
| `mechanic:recover-class-resource`   | Restaura usos gastados del pool (`regain` / `restore` / `recover` + ki / sorcery / …). No cubre “+1 use between rests”                                                                                                                                                                                                                                                          |
| `mechanic:attack-range`             | Aumenta el _normal attack range_ del arma (`increased by N feet` / `doubled`). No aplica a Critical Eye (_critical hit range_) ni a bonos “outside of your normal attack range”                                                                                                                                                                                                 |
| `mechanic:attack-range:major`       | El normal attack range queda **doubled** (Deadeye+ / underwater)                                                                                                                                                                                                                                                                                                                |
| `mechanic:reach`                    | Extiende el _reach_ melee (`reach is increased` / `extend its reach by`)                                                                                                                                                                                                                                                                                                        |
| `mechanic:light`                    | Produce iluminación (`sheds … light` / `creating bright light` / `moonlight` / `dim light for an additional`) — no el entorno “in dim light or darkness”                                                                                                                                                                                                                        |
| `mechanic:darkness`                 | Menciona `darkness` (entorno, creación o visión)                                                                                                                                                                                                                                                                                                                                |
| `mechanic:nonmagical-darkness`      | Oscuridad natural / no mágica: `nonmagical darkness`, `in darkness`, `dim light or darkness`, `into darkness`, o “both magical and nonmagical”                                                                                                                                                                                                                                  |
| `mechanic:magical-darkness`         | Oscuridad mágica: `magical darkness` o “darkness, both magical and nonmagical” / _see normally in darkness, both magical…_                                                                                                                                                                                                                                                      |
| `mechanic:darkvision`               | Concede `darkvision` (no _see normally in darkness_, que usa los tags de darkness)                                                                                                                                                                                                                                                                                              |

##### Notas de implementación de tags

- Las reglas se aplican sobre el texto del efecto **ya concatenado** (`entries.join(" ")`), antes de parsear el marcado de 5etools.
- Un mismo efecto puede activar múltiples reglas simultáneamente. Ejemplo: `"{@i (Spellcaster only)} This weapon has 4 runes. Cast {@spell lightning bolt}"` → con catálogo de conjuros → `["class:spellcaster", "mechanic:rune-charges", "mechanic:spell:lvl3"]` (Lightning Bolt es nivel 3).
- Si el texto no coincide con ninguna regla, `tags` es `[]`.
- Las reglas son **case-insensitive** salvo donde se indique lo contrario.
- El listado `/runes` filtra tags en **AND sobre el mismo lado** (`runeMatchesListTagFilter`): Slot Armor + `damage:fire` + `mechanic:immunity` solo muestra runas cuyo **armorEffect** tenga fuego e inmunidad juntos. No basta con que el fuego esté en el arma y la inmunidad en la armadura.

##### Rareza de resistencia / inmunidad / daño extra inline

Si el texto del efecto **no** referencia un material effect nombrado del catálogo GTMH, `getMaterialEffectTierForText` infiere rareza desde grants en primera persona:

**Defensas** (`inline-defense-rarity.utils.ts`):

| Texto (ejemplos)                                                                         | Rareza                                                                 |
| ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `You have resistance to lightning damage, while you wear this armor.`                    | **Rare** (siempre activa)                                              |
| `You are resistant to poison damage and immune to the poisoned condition…`               | **Rare** (resistencia a daño; la inmunidad a condición no sube rareza) |
| `…use your reaction or bonus action to gain resistance to lightning…` (usos / long rest) | **Uncommon** (activada / limitada)                                     |
| `As an action, you gain resistance to … for 1 minute` (1/long rest)                      | **Uncommon**                                                           |
| `You are immune to fire damage while you wear this armor.`                               | **Legendary** (siempre activa)                                         |
| `You are immune to poison and disease while you wear this armor.`                        | **Legendary** (atajo clásico: `poison` = daño de veneno)               |
| Inmunidad a daño activada (action / BA / reaction + duración corta)                      | **Very Rare** (un escalón bajo Legendary)                              |

Solo cuenta inmunidad/resistencia **a un tipo de daño** (no inmunidad a condición). La detección de “limitada” busca gasto de economy (`action` / `bonus action` / `reaction`) junto al grant de resistencia/inmunidad.

**Bypass de resistencia / inmunidad** (`inferRarityFromResistanceBypassTags` en `inline-special-effect-rarity.utils.ts`) — **solo si** tras defensa/daño la rareza seguiría en Unknown:

| Tags / texto (ejemplos)                                                                 | Rareza          |
| --------------------------------------------------------------------------------------- | --------------- |
| `mechanic:resistance-bypass` (Mind's Eye, Heavy Polish)                                 | **Rare** (ataques) / **Uncommon** (hechizos) |
| `mechanic:immunity-bypass` (Mind's Eye+, Heavy Polish+, half damage vs immunity)        | **Legendary**   |

**Daño de arma** (`inline-extra-damage-rarity.utils.ts`), score = dados × caras (o flat) — aplica a daño extra siempre activo y a daño que el efecto hace sufrir al objetivo (p. ej. DoT al crit, AoE `dealing 22 (4d10) fire damage`):

| Score | Ejemplo                                                | Rareza        |
| ----- | ------------------------------------------------------ | ------------- |
| ≤ 6   | `extra 1d6 … damage`, crit DoT `takes 1d4 fire damage` | **Uncommon**  |
| 7–12  | `extra 2d6 necrotic damage`                            | **Rare**      |
| 13–20 | `extra 3d6 … damage`                                   | **Very Rare** |
| ≥ 21  | `extra 4d6 … damage`                                   | **Legendary** |

Ráfagas de uso limitado (`once per long rest` / `can't use … again until … rest` / `once you use this property`) bajan **un escalón** (p. ej. cono 4d10 1/descanso → **Very Rare**, no Legendary). Acepta notación MHMM de promedio `22 (4d10)`.

Un efecto nombrado del catálogo GTMH tiene prioridad sobre esta inferencia. Los nombres extraídos de runas MHMM que **no** están en GTMH (`discovered:`) se asignan en `discovered-effect-rarity.data.ts` (p. ej. **Flexible Leathercraft** → **Common**, **Recovery Level** → **Rare**); sin entrada siguen Unknown salvo que aplique una inferencia inline. Si un mismo texto dispara varias inferencias de defensa/daño, se usa la rareza más alta.

**Rider de 20 natural sin daño + empujón** (`inline-roll-20-rarity.utils.ts`) — **solo si** tras lo anterior la rareza seguiría en Unknown, y el efecto tiene `mechanic:roll-20` + `mechanic:no-damage` + `mechanic:push` (p. ej. Tetranadon Beak: unarmed, 5 pies, ~5 %): **Common**. Un rider de 20 con daño extra (Ajarakan, 1d4 + push) sigue la tabla de daño.

**Ataque con reaction (natural weapon / unarmed)** (`inline-reaction-attack-rarity.utils.ts`) — **solo si** tras lo anterior la rareza seguiría en Unknown, y el efecto tiene `mechanic:reaction` + (`mechanic:natural-weapon` o `mechanic:unarmed`) (p. ej. Tigerstripe Zamtrios: reaction attack with race natural weapon): **Uncommon**. Si el texto también lista dados de daño (Congalala Strong Fang, 1d8), gana la rareza de daño extra.

**Hold breath underwater** (`inline-hold-breath-rarity.utils.ts`) — **solo si** tras lo anterior la rareza seguiría en Unknown, y el efecto tiene `mechanic:hold-breath` + `mechanic:underwater` (p. ej. _hold breath underwater for twice as long_): **Common**. _Breathe underwater_ (water breathing) no emite `hold-breath` y sigue Unknown salvo otra inferencia.

**Descanso acelerado** (`inline-accelerated-rest-rarity.utils.ts`) — **solo si** tras lo anterior la rareza seguiría en Unknown, y el efecto tiene `mechanic:accelerated-rest` (p. ej. _benefits of a long rest after 4 hours instead of 8_): **Uncommon**. Solo `mechanic:long-rest` (recargas _finish a long rest_) **no** basta.

**Gather resources (MH)** (`inline-gather-rarity.utils.ts`) — **solo si** tras lo anterior la rareza seguiría en Unknown:

| Tags                                       | Rareza       | Ejemplos                                                                            |
| ------------------------------------------ | ------------ | ----------------------------------------------------------------------------------- |
| `mechanic:gather-resources` (sin `:major`) | **Uncommon** | Expert Fisherman (x2 fish), Botanist / Geologist / Archaeologist (instead gather 2) |
| `mechanic:gather-resources:major`          | **Rare**     | Pro Fisherman / Botanist+ (extra 1d4), Pack Rat (party double), Speed Gatherer+     |

**Recuperación de recurso de clase** (`inline-class-resource-rarity.utils.ts`) — **solo si** tras lo anterior la rareza seguiría en Unknown, y el efecto tiene `mechanic:recover-class-resource` (p. ej. Monk: regain expended ki = half PB, 1/long rest): **Uncommon** (mismo suelo que spell-slot sin nivel). Extra use de Channel Divinity sin wording de recover sigue Unknown.

**Attack range** (`inline-attack-range-rarity.utils.ts`) — **solo si** tras lo anterior la rareza seguiría en Unknown:

| Tags                                   | Rareza       | Ejemplos                              |
| -------------------------------------- | ------------ | ------------------------------------- |
| `mechanic:attack-range` (sin `:major`) | **Common**   | Deadeye (+20 ft)                      |
| `mechanic:attack-range:major`          | **Uncommon** | Deadeye+ / underwater (range doubled) |

**Advantage on attack rolls** (`inline-attack-advantage-rarity.utils.ts`) — **solo si** tras lo anterior la rareza seguiría en Unknown, y el efecto tiene `mechanic:advantage` + `mechanic:attack-roll`:

| Activación                                                              | Rareza       | Ejemplos                                |
| ----------------------------------------------------------------------- | ------------ | --------------------------------------- |
| Limited (`active` / BA / reaction; p. ej. Aim Booster ½ PB / long rest) | **Uncommon** | Aim Booster                             |
| Always-on (`passive`)                                                   | **Rare**     | advantage on attack rolls while attuned |

**Movement / speed** (`inline-movement-rarity.utils.ts`) — **solo si** tras lo anterior la rareza seguiría en Unknown, y hay grant de modo (no basta un debuff `its speed is reduced`):

| Tags                                                                                   | Rareza        | Ejemplos                                                                                                             |
| -------------------------------------------------------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------- |
| `walking-speed` (sin major, p. ej. +5)                                                 | **Common**    | Marathon Runner                                                                                                      |
| `burrowing` / `swimming` / `climbing` / `walking-speed`+`major` (+10) / `icy-surfaces` | **Uncommon**  | burrow 10 ft, swim = walk, Spider Climb, Marathon Runner+, climb icy + ignore ice/snow DT (Boots of the Winterlands) |
| `ignore-difficult-terrain` o `movement-climb` sin paquete de hielo                     | **Common**    | ignore DT genérico                                                                                                   |
| `flying` (sin major, &lt;60 ft)                                                        | **Rare**      | flying speed 30 ft                                                                                                   |
| `flying`+`major` (≥60 ft)                                                              | **Very Rare** | flying speed 60–80 ft                                                                                                |

**Luz / darkvision / oscuridad mágica** (`inline-light-darkness-rarity.utils.ts`) — **solo si** tras lo anterior la rareza seguiría en Unknown:

| Tags                        | Rareza       | Ejemplos                                                                   |
| --------------------------- | ------------ | -------------------------------------------------------------------------- |
| `mechanic:light`            | **Common**   | Moon-touched (shed moonlight in darkness), shed bright/dim light always-on |
| `mechanic:darkvision`       | **Uncommon** | darkvision 60 ft (Goggles of Night–adjacent)                               |
| `mechanic:magical-darkness` | **Rare**     | see normally in magical + nonmagical darkness (Gaismagorm)                 |

Si hay varios, gana la rareza más alta. Solo `darkness` / `nonmagical-darkness` (Hide in dim light, snuff light) **sin** light / darkvision / magical-darkness sigue **Unknown**.

**Lanzamiento de hechizos / recuperación de slots** (`inline-spell-rarity.utils.ts`) — **solo si** tras lo anterior la rareza seguiría en Unknown, y el efecto tiene tags `mechanic:cantrip`, `mechanic:spell:lvlN` (nivel real del catálogo) o `mechanic:spell-slot` / `mechanic:spell-slot:lvlN`:

| Nivel del hechizo o slot                                             | Rareza                                                             |
| -------------------------------------------------------------------- | ------------------------------------------------------------------ |
| 0–1 (cantrip / 1st; p. ej. Earth Tremor 1/long rest)                 | **Common**                                                         |
| 2–3, o recuperación de slot sin nivel (p. ej. Arcane Recovery extra) | **Uncommon** (Pearl of Power = slot de 3rd)                        |
| 4–5                                                                  | **Rare** (p. ej. Dimension Door, o recuperar un slot de hasta 4th) |
| 6–8                                                                  | **Very Rare**                                                      |
| 9                                                                    | **Legendary**                                                      |

**Spellcasting focus** (`inline-spellcasting-focus-rarity.utils.ts`) — **solo si** tras lo anterior la rareza seguiría en Unknown, y el efecto tiene `mechanic:spellcasting-focus` (p. ej. _use this weapon as your spellcasting focus_): **Common** (como _Ruby of the War Mage_).

**Bonus plano a AC / spell attack / spell save DC** (`inline-ac-bonus-rarity.utils.ts`, `inline-spell-buff-rarity.utils.ts`) — **solo si** tras lo anterior la rareza seguiría en Unknown. Requiere `mechanic:armor-class` con un `+N` parseable, o `mechanic:spell-buff:*` con `+N` (se ignora el bump _This bonus increases to +N when…_). Bandas al estilo _Cloak of Protection_ / _Rod of the Pact Keeper_:

| +N  | Always-on (`passive`) | Limited (`active` / reaction / BA) |
| --- | --------------------- | ---------------------------------- |
| +1  | **Uncommon**          | **Common**                         |
| +2  | **Rare**              | **Uncommon**                       |
| +3  | **Very Rare**         | **Rare**                           |
| +4+ | **Legendary**         | **Very Rare**                      |

Ejemplos: Rathalos Carapace (+1 AC) → Uncommon; Shield reaction +1 AC → Common; Gravios Jewel (+2 spell attack/DC) → Rare; Amatsu Pleura (+3) → Very Rare.

**Ventaja / bonus vs condición** (`inline-condition-rarity.utils.ts`) — **solo si** tras defensa/daño/hechizo la rareza seguiría en Unknown, y el efecto tiene `mechanic:against-condition` + (`mechanic:advantage` **o** `mechanic:save-bonus`) **sin** `mechanic:immunity` (p. ej. _advantage on saving throws against the poisoned condition_, o _+2 bonus_ vs knocked prone): **Common**.

**Inmunidad a condición** (`inferRarityFromConditionImmunityTags`) — **solo si** tras lo anterior la rareza seguiría en Unknown, y el efecto tiene `mechanic:immunity` + algún `mechanic:condition-*` (p. ej. _immune to the poisoned condition_, _cannot be knocked prone_, _can't be stunned_): **Uncommon**. La inmunidad a un **tipo de daño** sigue la tabla de defensas (Rare / Legendary); no usa esta regla.

**Fin de DoT / Recovery Level** (`inline-end-dot-rarity.utils.ts`) — **solo si** tras lo anterior la rareza seguiría en Unknown, y el efecto tiene `mechanic:end-dot` (limpia daño continuo al inicio del turno: sangrado, ácido/veneno DoT, fuego, …): **Rare**.

**Iniciativa** (`inline-initiative-rarity.utils.ts`) — **solo si** tras lo anterior la rareza seguiría en Unknown:

| Tags                                 | Rareza       | Ejemplos                                                     |
| ------------------------------------ | ------------ | ------------------------------------------------------------ |
| `mechanic:initiative` (sin `:major`) | **Uncommon** | advantage on initiative rolls (Rejuvenated Beak)             |
| `mechanic:initiative:major`          | **Rare**     | add a d8 + become first in the initiative order (Safi'jiiva) |

**Curación a otros** (`inline-heal-other-rarity.utils.ts`) — **solo si** tras lo anterior la rareza seguiría en Unknown:

| Tags                        | Rareza       | Ejemplos                                                                            |
| --------------------------- | ------------ | ----------------------------------------------------------------------------------- |
| `mechanic:heal-other:minor` | **Uncommon** | Astalos Scissortail (+spell level); Lay on Hands → THP = amount healed              |
| `mechanic:heal-other:major` | **Rare**     | Astalos Scissortail+ (double spell level); LoH shared THP; Malzeno Tail HP transfer |

**Skill / contest utility** (`inline-skill-rarity.utils.ts`) — **solo si** tras lo anterior la rareza seguiría en Unknown:

| Tags                                                          | Rareza     | Ejemplos                                          |
| ------------------------------------------------------------- | ---------- | ------------------------------------------------- |
| `mechanic:skill-bonus`                                        | **Common** | +2 Athletics / Climb / Stealth checks             |
| `mechanic:advantage` + `mechanic:skill-*` o `mechanic:disarm` | **Common** | advantage on Insight; advantage vs being disarmed |

**Mithral / flexible armor** (`inline-mithral-rarity.utils.ts`) — **solo si** tras lo anterior la rareza seguiría en Unknown, y el efecto tiene `mechanic:mithral` (p. ej. _light and flexible_ + sin desventaja en Stealth / sin requisito de Str): **Uncommon** (como _Mithral Armor_ del DMG). Solo `skill-stealth` o “10% lighter / Str reduced by 1” **no** basta.

El badge del diálogo y el filtro **Material Effect Tier** usan la misma función. En **RuneDetailDialog**, si hay filtros de efecto activos (slot, tags same-effect, material-effect tier) y solo un lado de la runa los cumple, el otro efecto se muestra atenuado (`filtered out`) y su botón de **Add to Rune Planner** (arma/armadura/trinket de ese lado) queda deshabilitado.

---

