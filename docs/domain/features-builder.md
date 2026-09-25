# Features: Character Builder

> Split from legacy `instrucctions.md`. Prefer this file over reading the whole domain corpus.

Rune planner (`BuildDrawer`): [`features-rune-planner.md`](./features-rune-planner.md).

### Character Builder (ALPHA)

**Ruta**: `/builder`
**Estado**: `BuilderInventoryProvider` global en `MainLayout` (Purchase del carrito) + `CharacterBuilderProvider` solo en `/builder` vía `BuilderRouteProviders` (spellcasting/autosave/syncs; flush de autosave al salir) + `RuneBuildProvider` vía `RuneBuildRouteLayout` (`/runes` + `/builder`). El Sidebar **no** muestra badge de inventario sobre Builder.

Herramienta experimental para equipar armas/armadura/runas y estimar **daño por turno (DPT)**.

#### Layout (`BuilderPage`)

Grid de tres columnas en desktop (`xl:grid-cols-[280px_minmax(0,1fr)_260px]`):

| Columna   | Componentes                                                                                                                                             |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Izquierda | `StatsPanel`, `BuilderImagePanel`, `BuilderSavingThrowsPanel`, `BuilderSkillChecksPanel`                                                                |
| Centro    | `BuilderCenterPanel` (grids de identity/equipment/spells + panel contextual)                                                                              |
| Derecha   | `BuilderDerivedPanel` (Combat Stats), `BuilderInventoryPanel`, `BuilderOtherProficienciesPanel`, `BuilderLanguagesPanel`, `BuilderDefensesPanel`       |

Cabecera: `HomebrewModeToggle` (Amellwind Homebrew **OFF** por defecto si no hay valor en `localStorage`) + botón **Tips** (`CharacterCreationTipsPanel`) que abre un dialog con workflow/gear según el modo homebrew. Encima del grid: **`BuilderProgressBar`** sticky (checklist en vivo con deep-links a slots/`data-builder-section`).

`BuilderSlotSelectionProvider` eleva `selectedSlot` para que la progress bar y el centro compartan selección. `BuildCompletenessProvider` expone `liveResult` / `liveSteps` (evaluación diferida con `useDeferredValue`) además del highlight de export.

Acciones destructivas (reset, randomize, homebrew OFF, clear inventory, bajar nivel, cambiar método ASI, desactivar multiclass) pasan por `ConfirmActionDialog` + toast Sonner.

#### Inventario del builder (`BuilderInventoryContext`)

- **Fuente de verdad**: líneas del **`CartContext`** (ítems comprados/añadidos en Shops/Items). Purchase pasa por `CartPurchaseBridge` (`CartPurchaseContext`); `CartDrawer` no importa el Builder.
- Resuelve nombres del carrito a `Weapon[]` y `ArmorItem[]` vía `cart-equipment.resolver`.
- Con Amellwind Homebrew, el catálogo de armas es `getAllForgeWeapons()` + `getAllWeapons()` (forge primero en lookups por nombre).
- Armaduras no GTMH: lista inicial desde `armor.placeholder.ts`.

#### Modelo `Character` (`builder/models/Character.ts`)

- Nivel 1–20, ability scores, proficiency bonus calculado.
- Modificadores derivados, AC base, iniciativa, ataques por turno (con override manual).

#### Equipo (`character.types.ts`)

| Tipo              | Campos clave                                               |
| ----------------- | ---------------------------------------------------------- |
| `EquippedWeapon`  | `weapon`, `rarity`, `runeSlots`, `runes[]`, `useVersatile` |
| `EquippedArmor`   | `armor`, `runes[]`                                         |
| `EquippedTrinket` | `name`, `rune`                                             |
| `ArmorItem`       | placeholder hasta datos GTMH reales                        |

Slots: `mainHand`, `offHand`, `armor`, `trinket1`, `trinket2`.

Reglas de manos: armas `2H` bloquean off-hand; armas `V` (versatile) permiten modo a una o dos manos.

Con **Amellwind Homebrew** activo, la librería de armas (`WeaponLibraryPanel`) muestra por defecto el catálogo del **Weapon Forge** (curated raintdm + custom de localStorage); el catálogo AGMH (`getAllWeapons()`) se elige desde **Filters → Catalog** (`Weapon Forge` / `Base (AGMH)`). La sección Inventory de esa librería filtra por el mismo catálogo (`isWeaponForgeWeapon`) para no mezclar badges `RAINTDM`/`AGMH` ni ocultar un catálogo por colisión de nombre con el otro. El detalle equipado (`WeaponLibraryDetail`) para armas Forge usa `customFeatures` + `includePrerequisiteMatches: false` (paridad con `WeaponForgeDialog`), sin inyectar optional features AGMH por nombre. Sin homebrew, sigue cargando armas D&D (`getDndWeapons`). Lo mismo aplica a feats (Amellwind / D&D 2014 / D&D 2024) y species/background (Amellwind / D&D): el conmutador de catálogo vive en el diálogo Filters, no como pills en el título de la library.

#### Randomizer (`useCharacterRandomizer`)

Botón dados en `StatsPanel`. Disponible en **ambos** modos (Amellwind y D&D). Conserva el nivel actual, hace `resetBuild` y rellena clase/subclase, ASI point-buy, skills, idiomas, optional features, origin feats, hechizos, dotes de nivel y starting equipment del carrito (no equipa armas/armadura en el paper doll).

Los slots de dote de nivel (`buildFeatSelectionsForLevel`) solo eligen dotes **General** / **Epic Boon** 2024 que cumplen `meetsFeatPrerequisites` para el nivel del slot y los ability scores ya asignados (p. ej. no Epic Boons bajo 19; no Fighting Styles / Origin en slots ASI). Requisitos no verificables automáticamente (proficiency, feature, race, …) excluyen esa rama OR del pool.

- **D&D**: species/backgrounds 5e con ratings RPGBOT; lineage spells; background ASI.
- **Amellwind**: species AGMH (`pickAmellwindSpecies` por saves/abilities relevantes); background preferido Hunter's Initiate (`pickAmellwindBackground`, si falta → aleatorio); skills/tools/idiomas del homebrew; Origin Feat de trasfondo AGMH (siempre choose 2024); facción la setea el slice de identity al aplicar el background.

#### Completeness / tests

Fuente de verdad: `evaluateBuildCompleteness` (`builder/utils/build-completeness*`), consumida por `BuildCompletenessContext` (highlights + bloqueo de export). Tests Vitest en `build-completeness.test.ts` (`pnpm test`). Checklist agente: `.agents/skills/builder-validation/`.#### Componentes

| Componente                                                                          | Rol                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `StatsPanel` / `AbilityScoresSection`                                               | Nivel, ability scores, AC, iniciativa, ataques/turno; menú JSON (Builder JSON activo; Foundry VTT deshabilitado temporalmente)                                                                                                                                                                                                                                                                                           |
| `BuilderImagePanel`                                                                 | Sube retrato y token (base64 data URL) que alimentan el export de Foundry                                                                                                                                                                                                                                                                                                                                                |
| `BuilderSavingThrowsPanel` / `BuilderSkillChecksPanel`                              | Saving throws y skills con competencia/expertise                                                                                                                                                                                                                                                                                                                                                                         |
| `BuilderDerivedPanel`                                                               | Combat stats (proficiency, HP, hit dice, AC, speed, initiative, Passive Perception, Spell Attack/DC when caster, attunement)                                                                                                                                                                                                                                                                                           |
| `BuilderCenterPanel` / `PaperDoll`                                                  | Silueta con slots, paneles de detalle de arma/armadura. **Spellcasting (unificado)**: slots de clase/Pact Magic + grants de species en el mismo grid. Al abrir un slot, `SpellLibraryPanel` muestra grants bloqueados (species / subclass always-prepared / optional features) con el mismo estilo (candado + badge verde); la lista Available solo si el slot es elegible (`allowSpellPicks` / `isSpellSlotChoosable`). |
| `BuilderItemLibraryPanel`                                                           | Biblioteca de equipo desde carrito                                                                                                                                                                                                                                                                                                                                                                                       |
| `BuilderDamagePanel`                                                                | Desglose DPT, críticos, fuentes de daño                                                                                                                                                                                                                                                                                                                                                                                  |
| `BuilderInventoryPanel`                                                             | Inventario derivado del carrito (overflow de equipo)                                                                                                                                                                                                                                                                                                                                                                     |
| `BuilderOtherProficienciesPanel` / `BuilderLanguagesPanel` / `BuilderDefensesPanel` | Competencias varias, idiomas, resistencias/inmunidades. **Other Proficiencies**: grants `any` (artisan tools, gaming sets, martial/simple weapons, …) se eligen con **combo searchable** desde catálogos 5etools (`chooseable-tools-weapons.ts`), no texto libre.                                                                                                                                                        |
| `RuneAssignmentPanel`                                                               | Asignar/quitar runas por slot con validación                                                                                                                                                                                                                                                                                                                                                                             |

**Library (class / species / background / feats)**: el detalle marca features/traits/párrafos que otorgan competencias (badge _Proficiency_ + borde ámbar) y muestra un resumen estructurado (`LibraryProficiencySummary`) cuando hay grants parseados. En slots ASI / dote de nivel, `FeatLibraryPanel` lista solo categorías **General** / **Epic Boon** (`isGeneralFeatSlotCategory`); Fighting Styles (`FS` / `FS:*`) y Origin Feats van por optional-feature slots u origin-feat slot, no por el picker genérico. El slot **Origin Feat** usa Filters → **Sources** con defaults = libros oficiales 2024+ (XPHB, FRHoF, LFL, ABH, …); UA / Partnered quedan opt-in en ese mismo diálogo. En **class / subclass**, Sources incluye libros de la clase base **y** de subclases (p. ej. `RHW` Ravenloft: The Horrors Within para Phantom Rogue), no solo el source del class JSON.

**Library — botón de detalles (unificado)**: en todas las listas de la Library (species, background, class, subclass, multiclass, feats, armas, armaduras, optional features y spells) el botón azul de info (`LibraryInfoButton`) es un **toggle acordeón**: despliega el detalle debajo de la fila sin seleccionar ni salir de la lista (varias filas pueden quedar abiertas). Las filas usan `LibraryList` / `ItemRow` con `renderDetails`; los componentes `*LibraryDetail` aceptan `inline` para omitir su título (la fila ya muestra el nombre). Species/background y feats cargan el detalle al expandir (`IdentityLibraryPreview`, `FeatLibraryPreview`). La vista completa con "Change selection" queda solo para el ítem ya seleccionado.

#### Resolución de especie y dotes

- **`useResolvedSpecies` / `resolveSpeciesParts`** — resuelven la especie seleccionada contra los catálogos de species MH y razas D&D (con subraza opcional), con precedencia `mhSpecies ?? dndRace`, y exponen nombre de display y traits fusionados.
- **`useActiveResolvedFeats`** — resuelve las dotes activas no-ASI (origin feats de especie/trasfondo + slots elegidos) a objetos `Feat` completos; fuente única para los hooks derivados de HP/velocidad.
- **`computeEffectiveAbilityScores` / `useEffectiveAbilityScores`** — scores finales (base + Tasha/species/background ASI + feat ASI + ability increases de dotes con elección, p. ej. Piercer STR/DEX). Fuente de verdad para modificadores de AC, HP, iniciativa, skills/saves, combate/DPT, spellcasting y exports (PDF / Foundry). `character.abilities` sigue siendo solo la generación base editable.

#### Builder JSON (export / import nativo)

Menú JSON del `StatsPanel` → **Download Builder JSON** / **Import → Builder JSON** (`builder-json/`, hooks `useBuilderCharacterExport` / `useBuilderCharacterImport`). Pensado para guardar y recargar player characters sin pérdida.

- **Sobre** (`BuilderCharacterJson`, `kind: "amellwind-builder-character"`, `version` 1, `snapshotVersion` 1): `identity` (refs class/subclass/species/background) + `core` (nombre, tamaño, alineamiento, nivel total, ability scores base) + `multiclass` + `snapshot` (`BuilderChoiceSnapshot`, el mismo que usan el autosave y el flag Foundry) + `art` opcional (retrato/token data URL) + `exportedAt`.
- **Snapshot**: todas las decisiones — homebrew, método ASI, facción, personalidad, **backstory**, feats (con `asiChoices` / `abilityIncreaseChoices` / `spellListClassChoice`), origin feats, optional features por progresión, Tasha / species / background ASI, skills / expertise / tools / **armas de especie** / idiomas / defensas elegidas, hechizos por pool, equipo exacto (rareza, modo de arma, runas) e inventario.
- **`provenance`** (solo lectura, se regenera en cada export y se **ignora** al importar): explica por qué el personaje tiene cada cosa — clases con features por nivel (`from` clase/subclase), feats con su slot (`Level 4 … feat slot`, `Origin feat from background (…)`, `Origin feat granted by <optional feature>`), optional features (`Fighter: Fighting Style`), skills/tools/idiomas/armaduras/armas/defensas con sus fuentes (`Class: Fighter`, `Species: Elf`, …), saves, hechizos con su pool (clase, pacto, linaje de especie, pool de dote), hechizos otorgados, bonos de origen, scores base vs finales y equipo.
- **Import**: `parseBuilderCharacter` valida `kind`/versiones y **normaliza** (`normalizeBuilderPersistedBuild` + `normalizeBuilderSnapshot`): campos ausentes de exports antiguos toman defaults vacíos; `backstoryNotes` ausente no pisa las notas locales; `art` solo acepta `data:image/…`. Si el build actual ya empezó, pide confirmación (`ConfirmActionDialog`).
- **Orden de restauración**: `flushSync(resetBuild + homebrew)` y luego `rehydrateBuilderState` con los setters del render post-reset. El reset debe commitearse antes porque los loaders de identidad/grants están keyed por id: si el personaje importado comparte clase/especie/trasfondo con el build actual, un reset batcheado no recargaría `classData` / `speciesData` / grants.

#### Export / Import a Foundry VTT

El builder puede **exportar** el personaje a un actor `character` de **Foundry VTT (sistema dnd5e v12 / 4.4.4)** e **importar** de vuelta un JSON de actor. Botones en el `StatsPanel`.

**Contrato JSON + módulos**: el JSON embebe schema dnd5e (stats, items, activities, descriptions, AE) y **referencia** comportamiento de módulos (`midiProperties`, `flags.midi-qol.*` / `flags.dae.*`, `flags.itemacro`, nombres canónicos para CPR/GPS/AA, content links `@item[…]`). Sin esos módulos el actor importa “plano”; con el stack activo las referencias cobran vida. Núcleo compartido: `src/shared/foundry/` (`FOUNDRY_EXPORT_TARGET`, `downloadFoundryJson`, tipos, midi, Item Macro, `applyFoundryModuleCompat`, enrichers, mappings, icons). Catálogo de módulos: `shared/foundry/module-requirements.ts` + UI `FoundryModuleRequirementsNotice`.

| Capa                   | En el JSON                                                                                                                                                 | Módulo destino                                                                                                                       |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Schema / activities    | Embebido                                                                                                                                                   | dnd5e 4.4.4                                                                                                                          |
| Midi workflow          | `midiProperties`, AE midi flags, triggered activities, `[pass]ItemMacro`                                                                                   | midi-qol **12.4.27+** (verificado 12.4.64) + libWrapper + socketlib                                                                  |
| Item Macro             | `flags.itemacro.macro` + `flags.midi-qol.onUseMacroName`                                                                                                   | itemacro **2.0–2.2** (Foundry 12). Desactivar sheet-hook y override-default-execution                                                |
| DAE / expiry           | `flags.dae.*`, duration                                                                                                                                    | DAE + Times Up                                                                                                                       |
| Auras (v12)            | `flags.ActiveAuras.*` on AE                                                                                                                                | Active Auras (GPS v12 lo requiere)                                                                                                   |
| Content links en texto | `@variantrule[…]`, `@item[…]`, `@spell[…]`, `@book[…]`                                                                                                     | Plutonium 12.x                                                                                                                       |
| Rolls clickeables      | `[[/r 2d4+2]]`, enrichers dnd5e                                                                                                                            | Foundry core + dnd5e                                                                                                                 |
| Deep links             | `<a href="https://amellwind-…/spells?spell=…">` (Toolbox)                                                                                                  | Navegador                                                                                                                            |
| Premades               | Nombres EN + `system.source.rules` (2014 vs 2024 según libro) + `system.identifier`. **No** se pre-estampan flags `chris-premades` / GPS “already applied” | CPR (Medkit) **Foundry 12 / dnd5e 4.4.x**; GPS **1.0.1–1.0.56**. Tras importar: Actor Medkit. Añadir GPS como compendio extra de CPR |
| Animaciones            | Nombres EN + flags toolbox                                                                                                                                 | AA + Sequencer + JB2A                                                                                                                |

`applyFoundryModuleCompat` (actor export) completa midiProperties (conjuros: `magicEffect` / `magicDamage`), alinea `system.source.rules` para el Medkit, normaliza Item Macro 2.x y deja `flags.amellwind-toolbox.compat`. El Weapon Forge usa el mismo helper en modo `light` para no romper la paridad de los JSON de ejemplo. Homebrew MH (armas con Item Macro propio) no entra en CPR/GPS por nombre; Sentinel / War Caster / Polearm Master siguen con nombre inglés exacto para Opportunity Attack de GPS.

- **Description enrichers** (`shared/foundry/description.ts`): `toFoundryDescriptionHtml` convierte tags 5etools `{@variantrule Advantage|XPHB}` → `@variantrule[Advantage|XPHB]`, `{@dice 2d4+2}` / dados sueltos → `[[/r …]]`, `{@book …}` / `{@adventure …}` → `@book[…]` / `@adventure[…]` (Plutonium), `{@spell}` / `{@item}` / `{@condition}` / `{@class}` / `{@race}` / `{@filter …}` → `<a href>` a esta Toolbox (`/spells?spell=Dimension+Door`, `/weapons?weapon=…`, etc.; origen `VITE_PUBLIC_SITE_URL` o el deploy de Vercel). Helpers de layout: `foundryDividerHtml()` (`<hr>`), `foundryRarityTitleHtml()` (colores Foundry/WoW por rareza), `foundryFeatureCardHtml` / `foundryChatFeatureCardHtml` / `foundryUpgradeBlockHtml` (cards inline para cadenas de features de armas), `foundryActivationLeadHtml` + `formatFeatureBodyHtml` (lead PHB + listas `-`/`•`). **No** usa `parseFiveToolsMarkup` (que strippea tags para la UI de la app). Todas las descriptions de export (feats, spells, weapons, runes, …) pasan por este pipeline.
- **Identity fluff (clase / subclase / raza / trasfondo)** (`builder/foundry-export/fluff-description.ts` + `fluff-lookup.ts` + `identity-description.ts`): al exportar se arma una description estilo Plutonium: arte 5etools (lead image → lore → resto con captions) + **tabla de progresión** de la clase + features `Level N: Name` con entradas crudas (`ClassFeatureEntry.rawEntries`, tags `{@…}` intactos). Raza/especie: fluff + traits; trasfondo: fluff + features. `img` del item usa la primera ilustración.
- **Feature grouping + icons**: cada feature de clase/subclase/raza/trasfondo lleva `flags.dnd5e.advancementOrigin` apuntando al item padre (y al ItemGrant), para que la hoja Foundry las agrupe bajo Class / Species / Background en vez de **Other Features**. Iconos por categoría (`foundry-icons.ts`: class/subclass/race/background/feat). Picks de optional features (Metamagic, …) se agrupan bajo la clase.
- **Item / spell / feat images** (`foundry-icons.ts` + fluff maps en `fluff-lookup.ts`): `img` de spells/dotes usa arte 5etools cuando existe; si no, fallback por escuela (spells) o tipo. **Armas D&D** prefieren iconos core de Foundry por nombre base (p. ej. spear → `spear-flared-green.webp`) frente al fluff de libro (recorta mal en thumbnails). **Equipo nombrado por slot** (gauntlets, gloves, helm, boots, cloak, ring, amulet) usa iconos core `icons/equipment/...` (p. ej. `gauntlet-tooled-leather-brown.webp`) en el actor exportado, no mh-icons. **Inventario/loot** sin fluff resuelve por tipo/nombre (`A`/bolts/arrows → munición, quiver → carcaj, GS/gaming set → dados, packs, etc.) en vez del saco genérico. **Armas e ítems de cazador Amellwind** siguen con su icono/`mh-icons` cuando aplica.
- **Weapon Mastery (D&D 5e)** (`weapon-mastery.data.ts` + `buildWeaponItem`): en armas `contentSource: "dnd"` se rellena `system.mastery` (clave Foundry, p. ej. `sap`) y se añade a `system.description` el bloque **_Mastery: Sap._** + texto XPHB (tags `{@…}` → enrichers). Las armas Amellwind no reciben este apéndice (ya traen descripción propia). Las picks de Weapon Mastery del builder van a `traits.weaponProf.mastery.value` (baseItem slugs).
- **Feature uses / activities** (`feature-usage.utils.ts` + `buildFeatItem`): parsea la description (tags 5etools o HTML) para rellenar `system.uses` (`max` + `recovery` lr/sr/day) y, si hay activación o usos limitados, una activity `utility` con consumo `itemUses`. Patrones cubiertos: Bonus Action / Reaction / Action / Utilize action, “twice”, “Proficiency Bonus”, “Charisma modifier (minimum of once)”, “once… until Long Rest”, “has ten uses”. Recursos de clase (Sorcery Points, Ki, …) siguen en scale values, no como usos del feat.
- **Spells (prepared vs known)** (`spell-export.utils.ts`): clases que **preparan** (Cleric/Druid/Wizard/Paladin/…) exportan **toda** la lista de clase de niveles 1+ hasta el máximo de slot disponible, con `preparation.prepared: true` solo en los elegidos por el usuario (+ grants always-prepared en `mode: "always"`); cantrips solo los seleccionados. Clases **known**/pact exportan solo seleccionados + grants; Warlock usa `preparation.mode: "pact"`.
- **Inventory items** (`buildInventoryItem`): routing por tipo 5etools — tools (`T`/`AT`/`GS`/`INS`) → Foundry `tool` + activity `check`; ropa (`Costume`, `Fine Clothes`, …) → `equipment` clothing; pociones/scrolls y gear con usos limitados (p. ej. Healer's Kit) → `consumable` con activity heal/utility + `system.uses`; resto → `loot` gear. Descriptions/weight/price/rarity desde el catálogo `dnd-items` (prioriza XPHB/XDMG). Entradas `"N gp"` **no** se exportan como ítems: se suman a `system.currency.gp` vía `sumInventoryGoldGp` / `isGoldInventoryEntry`.
- **Export** (`builder/foundry-export/` + hook `useFoundryExport`): `buildFoundryActor(input)` ensambla `system` + `items[]` + `prototypeToken`. Sub-builders en `foundry-export/items/*` (feat/weapon/equipment/inventory/spell/identity), runas embebidas vía `buildRuneFoundryItem`, `advancement.builders.ts`. Infraestructura (IDs, stats, midi, enrichers, mappings, `wrapItem`, `downloadFoundryJson`) vive en `shared/foundry/`. Automatización de armas (compiler/chains/registry) en `shared/foundry/weapons/`. Retrato/token base64.
- **Automatización Midi-QoL / DAE (estilo Plutonium)** (`automation.data.ts` + `automation.builders.ts`): `applyItemAutomation` fusiona overlays por nombre; enlaza AE `transfer:false` a activities vacías (`linkNonTransferEffectsToActivities`). Requiere Midi + DAE + Times Up en el mundo. Ampliar: entradas en `AUTOMATIONS` por nombre normalizado.
- **Runas**: export standalone en `/runes` y también items `equipment` en el actor del builder (equipped). **Solo descripción** enriquecida — sin activities ni AE generados; las automatizaciones curadas son Items en `foundry-jsons-example/runes` con controlador compartido en `public/data/scripts/runes/`.
- **Import** (`foundry-import/`, hook `useFoundryImport`): sin cambios de contrato; matching + snapshot.
- **Snapshot** (`builder-snapshot.ts`): `flags["amellwind-toolbox"].builderSnapshot` para round-trip de choices/equipo/runas.

#### Cálculo de combate (`combat.calculator.ts`)

Produce `CombatCalculation` con `DamageBreakdown` por mano:

- Parseo de dados del arma (`dmg1` / `dmg2` versatile).
- Modificador de atributo (STR/DEX según propiedades).
- Dados extra extraídos de `weaponEffect` de runas (`+NdM` en el texto).
- `critRange` y `critRunes` (expansión permanente o Critical Draw condicional).
- `totalDPT` = suma main + off × ataques por turno.

Reutiliza `wouldViolateRule` al asignar runas en el builder.

---

