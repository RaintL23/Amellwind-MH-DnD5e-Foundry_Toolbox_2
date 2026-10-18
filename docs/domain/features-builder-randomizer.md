# Features: Builder Randomizer

> Reglas que sigue el randomizador del Character Builder. Si cambias su comportamiento, actualiza este archivo. Contexto general del Builder: [`features-builder.md`](./features-builder.md).

**Código**: `src/features/raintdm/builder/utils/randomizer/` (hook `hooks/useCharacterRandomizer.ts`). Pipeline: `randomize-character.pipeline.ts`.
**Entradas**: botón dados del menú de progreso (`BuilderProgressBar`), `NextStepCard` y `BuilderCharacterActionsContext` (confirmación). Funciona en **ambos** modos (D&D y Amellwind).

## Objetivo

Todo parte de la **clase**. Cada decisión posterior (características, trasfondo, dotes, Fighting Style, armas, Weapon Mastery, hechizos) tiene que encajar con la clase, la subclase y el arquetipo de build elegido, y dejar un personaje **completo** (`evaluateBuildCompleteness` sin issues) y razonablemente optimizado.

## Orden del pipeline

```text
leer candado → resetBuild (conserva nivel) → alineamiento
→ cargar catálogos + catálogo de fuentes → filtrar a 2024+          (R1)
→ clase (candado o bolsa) → subclase                                 (R2, R3)
→ arquetipo de build                                                 (R4)
→ características (point buy por prioridad del arquetipo)           (R5)
→ especie y trasfondo (+ ASI de trasfondo, origin feats)             (R5, R6)
→ optional features sin Weapon Mastery                               (R9)
→ plan de loadout (+ paquetes de starting equipment)                 (R8)
→ Weapon Mastery (segunda pasada, sigue el loadout)                  (R9)
→ origin feats de invocaciones → nombre → competencias
→ dotes de nivel → pools de hechizos (incluye dotes) → hechizos      (R7, R10)
→ expertise → starting equipment al carrito + equipar (D&D) → backstory
```

## R1. Solo contenido D&D 2024+

- Nunca elige contenido de 2014. Una fuente vale si es un **libro oficial publicado en 2024 o después** (`isOfficialSourceSince`, `src/shared/services/source-catalog.service.ts`, la misma regla que los Sources por defecto de la Library). No valen UA, Partnered ni D&D Beyond.
- Todos los catálogos D&D se filtran antes de elegir (`filterRandomizerCatalogs`, `randomizer-sources.utils.ts`): clases, subclases, especies, trasfondos, dotes, Fighting Styles, optional features, hechizos, armas y armaduras. **Sin fallback** a 2014: si un pool 2024+ queda vacío, ese paso se salta.
- **Sin conexión** (el catálogo de fuentes no carga): se aceptan los libros 2024+ guardados en `localStorage` en la última carga correcta, más la lista estática `KNOWN_2024_RULES_SOURCES` (XPHB, XDMG, XMM, XSAC, ABH, FRAiF, FRHoF, NF, LFL, EFA, RHW, AU, HotB). El Artificer 2024 (EFA) sigue disponible. Al salir un libro nuevo, añádelo a esa lista.
- **Modo Amellwind**: especies y trasfondos AGMH son homebrew y no se filtran; clase, subclase, dotes, hechizos y optional features sí (solo 2024+).
- Elegir a mano en la Library **no** tiene esta restricción.

## R2. Candado de clase

- Botón candado en el slot **Class** (`IdentityGridPanel` → `GridElementSlot` prop `lock`). Estado `classLocked` en `useIdentitySlice`; se limpia al quitar la clase o con `resetBuild`.
- Con candado, el randomizer conserva la clase (aunque sea de 2014, elegida a mano) y **siempre vuelve a randomizar la subclase** (solo 2024+; vacía si no hay ninguna).
- El diálogo de confirmación avisa: "Class X stays locked". Con candado la bolsa de clases no se consume.

## R3. Variedad

`randomizer-variety.utils.ts`, guardado en `sessionStorage` (fallback en memoria):

- **Clase**: bolsa barajada. Salen todas las clases jugables antes de repetir ninguna; nunca la misma dos veces seguidas (también al rellenar la bolsa). Una entrada por nombre (XPHB primero).
- **Subclase** (por clase), **especie** y **trasfondo**: se excluye la elección anterior si queda otra opción.
- Dentro de cada pool sigue habiendo azar ponderado por RPGBOT (`pickByRpgbot`).

## R4. Arquetipo de build

`build-archetype.utils.ts`. Se elige tras clase y subclase con pesos por clase (`CLASS_ARCHETYPE_OPTIONS`):

| Arquetipo | Clases típicas |
| --- | --- |
| `great-weapon` | Barbarian, Fighter STR, Paladin |
| `sword-board` | Paladin, Cleric, Fighter STR, Druid, Artificer |
| `dex-melee` | Rogue, Monk, Fighter/Ranger DEX |
| `dex-ranged` | Ranger, Fighter DEX, Rogue |
| `dual-wield` | Ranger, Rogue, Fighter, Barbarian |
| `caster` | Wizard, Sorcerer, Bard, Druid, Cleric, Warlock, Artificer |
| `gish` | Warlock (Pact of the Blade), Bladesinger, College of Valor / Swords |

- Subclases que fijan el arquetipo: Bladesinger, College of Valor/Swords → `gish`; War Domain, Battle Smith, Armorer → `sword-board`.
- El arquetipo define: orden de características, Fighting Style, dotes firma/incompatibles, armas, escudo, Divine/Primal Order e invocaciones.

## R5. Características y trasfondo

- Point buy 15/14/13/12/10/8 por prioridad. El arquetipo antepone su orden (Fighter DEX → DEX/CON/WIS; Cleric `sword-board` → WIS/CON/STR; Bladesinger → INT/DEX/CON).
- Trasfondo 2024: su ASI debe incluir la **principal y la secundaria**; si no hay ninguno, basta la principal. Luego desempata RPGBOT. Se aplica +2 principal / +1 secundaria (la principal suele quedar en 17).
- Especie: los bonos "choose" van a la característica de mayor prioridad posible.
- **D&D**: especie y trasfondo 5e con ratings RPGBOT de la clase; lineage spells; ASI de trasfondo.
- **Amellwind**: especie AGMH por bonos a las características prioritarias (`pickAmellwindSpecies`), subespecie obligatoria si la especie la tiene (`pickAmellwindSubspecies`); trasfondo preferido Hunter's Initiate (`pickAmellwindBackground`); Origin Feat de trasfondo siempre choose 2024; la facción la fija el trasfondo.

## R6. Origin feats

- Una sola exclusión compartida especie → trasfondo → invocaciones: no se repite una dote de origen no repetible.
- Preferencia por arquetipo antes de RPGBOT (`preferredOriginFeatNames`): `caster` → Magic Initiate, Alert, Lucky, Skilled; `gish` → Magic Initiate, Alert, Tough, Lucky; marciales → Alert, Tough, Savage Attacker, Lucky. Solo se usa si alguna preferida tiene RPGBOT ≥ 3 para la clase.

## R7. Dotes de nivel (ASI slots)

`buildFeatSelectionsForLevel` (`feat-randomizer.utils.ts`). Usa las **puntuaciones en curso** (base + especie + trasfondo + dotes anteriores) para requisitos y decisiones:

1. **Nivel 19**: Epic Boon (RPGBOT ≥ 3 si hay) cuyo +1 pueda subir la principal (tope 30).
2. **Principal < 20 e impar**: half-feat del arquetipo con RPGBOT ≥ 3 que suba la principal (dote firma primero); si no hay, **ASI +1 principal / +1 secundaria**.
3. **Principal < 20 y par**: dote firma pendiente (`ARCHETYPE_SIGNATURE_FEATS`, p. ej. GWM, Sharpshooter, Dual Wielder, War Caster); si no, **ASI +2 principal**.
4. **Principal en 20**: mejor dote compatible (firma primero); su +1 va a la siguiente característica.

Reglas comunes:

- Nunca dotes incompatibles con el arquetipo (`ARCHETYPE_BLOCKED_FEATS`; p. ej. Sharpshooter con arma a dos manos, GWM en caster). Polearm Master solo si el arma principal es de asta.
- Nunca un +1 que pase de 20 (30 en Epic Boons); nunca repetir dotes no repetibles.
- Los +1 van a la característica de mayor prioridad bajo el tope, prefiriendo completar un número par. Resilient elige la primera salvación no competente entre CON → WIS → DEX.
- Solo dotes **General** / **Epic Boon** 2024 (`isRandomizerEligibleGeneralFeat`): requisitos estrictos más ramas cuyo único extra es Spellcasting o competencia en armadura/escudo, que el randomizer verifica. Otros requisitos no verificables (feature, race, …) excluyen la rama.
- El ASI 2024 se guarda con `asiChoices` completos.

## R8. Loadout: armas y armaduras (equipa solo en modo D&D)

`loadout-randomizer.utils.ts` + `randomize-loadout.phase.ts`. Se planifica después de optional features (cuentan las competencias de Divine/Primal Order). En Amellwind no se equipa nada: el plan solo guía Weapon Mastery y la elección de paquetes.

- **Solo equipo básico**: mundano, fuente 2024+, sin armas de fuego, sin Half Plate / Splint / Plate.
- **Armas** por arquetipo (y overrides por clase: Monk, Barbarian, casters), filtradas por competencia; los builds DEX prueban primero armas Finesse. Se elige con RPGBOT `weapon` de la clase, y **gana un arma que ya venga en el starting equipment**.
- `dual-wield` → dos armas Light. `great-weapon` / arcos → sin escudo. Escudo solo si el arquetipo lo usa, hay competencia y la mano secundaria está libre (nunca Bladesinger).
- **Armadura**: la del starting equipment si se puede llevar; si no, la mejor básica por CA. Chain Mail exige FUE 13. Los builds DEX evitan desventaja en sigilo. En empate de CA gana la que no da desventaja en sigilo y luego la más ligera.
- **Monk**: sin armadura ni escudo. **Barbarian**: armadura solo si su CA supera Unarmored Defense (10 + DES + CON). Sin competencia → sin armadura.
- **Starting equipment**: en cada grupo con opciones se elige el paquete que mejor encaja (armas del loadout, armadura que puede llevar, escudo); el paquete de **solo oro queda último**. Las armas/armaduras equipadas que no venían en el paquete se añaden al inventario.

## R9. Optional features

- **Fighting Style**: primero el preferido del arquetipo (GWF, Archery, Dueling/Defense, Two-Weapon Fighting); los incompatibles quedan fuera (`ARCHETYPE_FIGHTING_STYLES`).
- **Divine Order / Primal Order** (feature-choice): Protector / Warden para arquetipos de primera línea, Thaumaturge / Magician para `caster`.
- **Invocaciones**: Warlock `gish` → Pact of the Blade (+ Thirsting Blade); `caster` → Agonizing Blast, que fuerza **Eldritch Blast** entre los cantrips.
- **Weapon Mastery**: segunda pasada tras el loadout. Primero las armas equipadas/de respaldo, luego otras del arquetipo. Respeta competencia y la regla melee-only (Barbarian).

## R10. Hechizos

- Pools de clase con RPGBOT y al menos un hechizo de daño (comportamiento existente).
- **Dotes con lista de hechizos** (Magic Initiate y similares): el randomizer elige la lista (`spellListClassChoice`), una **distinta de la clase del personaje** si es posible (más hechizos nuevos). Si la dote fija ya trae la lista en el nombre ("Magic Initiate (Wizard)"), se respeta.
- Las pools de bonus (dotes de origen, dotes de nivel, optional features) se calculan **después** de elegir las dotes de nivel y se rellenan primero; los hechizos de clase no repiten los ya elegidos por esas pools.
- Hechizos de linaje de especie: los fija la especie.

## Tests

`src/features/raintdm/builder/utils/randomizer/*.test.ts`: fuentes 2024+ (incluido modo offline), bolsa de variedad, arquetipos, loadout, política de dotes, lista de Magic Initiate y Weapon Mastery. Checklist del Builder: skill `.agents/skills/builder-validation/`.
