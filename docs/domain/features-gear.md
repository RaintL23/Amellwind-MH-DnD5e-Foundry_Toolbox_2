# Features: Weapons, Shops, and Items Forge

> Split from legacy `instrucctions.md`. Prefer this file over reading the whole domain corpus.

Cooking / Combo: [`features-cooking-combo.md`](./features-cooking-combo.md).

### Hunter Weapons (Armas)

**Ruta**: `/weapons`
**Fuente de datos**: store `gtmh_current` → ítems con `type === "HW"` → `WeaponMapper`.

Las 14 armas de Monster Hunter del manual GTMH. Cada arma escala de **Common** a **Legendary** mediante una tabla de rarezas embebida en un bloque `inset` dentro de `entries[]`. La UI de armas / Weapon Forge añade una tier previa **Base** (`WEAPON_RARITY_ORDER`: Base → Common → … → Legendary) para features que aplican a todas las rarezas (Switch Mode, Melody, Loading, …). `RARITY_ORDER` (sin Base) sigue usándose en builder/runas/NPC.

**Weapon Forge — export Foundry VTT**: el botón JSON de la lista/dialog de `/weapon-forge` abre un menú: **Forge JSON** (catálogo `public/data/raintdm-weapons/`, un archivo por arma vía `weaponToRawExport`) o **Foundry VTT JSON** (Item `weapon` standalone por rareza, Core **12.331** / dnd5e **4.4.4** vía `FOUNDRY_EXPORT_TARGET`; `exportWeaponFoundryJson` → `buildWeaponFoundryExportBundle` + description/activities helpers). Nombre canónico del Item: `"{Weapon} ({Rarity})"` para **todas** las rarezas incluida Base (p. ej. `Great Sword (Rare)`, `Great Sword (Base)`); archivo siempre `fvtt-Item-{weapon}-{rarity}.json` (p. ej. `fvtt-Item-great-sword-rare.json`) vía `buildFoundryItemFilename` / `downloadFoundryJson` (fuerza el prefijo en cualquier Item). `system.identifier` / `type.baseItem` siguen el stem sin rareza (`greatsword`). Armas Amellwind/RaintDM exportan `system.attunement: "required"` (las de D&D 5e siguen `""`). El item incluye attack **activities** (una por modo de switch si aplica; Versatile PHB usa `damage.versatile`), descripción HTML enriquecida vía `toFoundryDescriptionHtml` (`shared/foundry/description.ts`), features agrupadas por **cadenas de upgrade** (`buildColumnChains`) en **cards HTML** al estilo PHB 2024, `system.description.chat` condensado, `midiProperties` por activity (dialecto Midi **nuevo**: `autoConsume` / `force*Dialog` / …), envelope Foundry (`enrichWeaponActivities`: `macroData`, `ignoreTraits`, `overTimeProperties`, …), flags de item (`dnd5e.riders`, `midi-qol`, `midiProperties`, `exportSource`), AE pasivos, y `applyItemAutomation` si existe overlay por nombre. Ejemplos de contrato en `public/data/foundry-jsons-example/weapons/<weapon-stem>/` (una subcarpeta por arma; no editar a mano como fuente de reglas — sirven de golden files; tests en `foundry-example-parity.test.ts`). `pnpm build:foundry-module` replica esas subcarpetas como Folders del pack Weapons. El catálogo Amellwind reutiliza el mismo builder (`weaponToExportCustomWeapon` → `buildWeaponFoundryItem`).

**Foundry macros / engines**: fuentes canónicas de Item Macros, sync macros y client engines en `public/data/scripts/` (espejo por feature de `foundry-jsons-example/`; ver `public/data/scripts/README.md`). Los JSON de ejemplo solo embeben esas macros; `pnpm build:foundry-module` genera los `scripts/*.js` del módulo desde esos engines. **Conditions & Diseases Amellwind**: registry + engine en `public/data/scripts/conditions/`; Items en `foundry-jsons-example/conditions/` (`build-conditions.mjs`); el módulo registra `CONFIG.DND5E.conditionTypes` y Active Effects con icono de status en el token HUD.
**Songbook / Melodies (Hunting Horn)**: si el export incluye activity **Recital**, **Solo Recital** o **Encore**, se aplica overlay Songbook (`weapon-forge-foundry-envelope.ts` + `hunting-horn-recital.macro.ts` / ejemplo `public/data/scripts/weapons-resources/melodies/hunting-horn-item-macro.js`): renombra el ataque principal a `"Attack"`, embebe **Item Macro** Midi `preTargeting`, y flags `world.hh.songbook` + `world.hh.maxActiveMelodies` (1 con Recital, 2 con Encore, 3 con Magnificent Trio) + `world.hh.maxSoloMelodies` (1 con Solo Recital, 2 con Solo Recital Upgrade; independiente de Encore) + `midi-qol.onUseMacroName`. El diálogo del Songbook muestra **una lista desplegable por slot activo** (sin checkboxes); al subir upgrades que aumenten melodies simultáneas solo aparece un `<select>` extra. Con varios slots, la selección es **exclusiva y dinámica**: al elegir una Melody en un dropdown, esa opción desaparece de los demás (y vuelve a aparecer si se cambia). **Melody of Guile** pide un skill al activar (`needsSkillChoice`). El overlay también inyecta la activity **End Melodies** (`identifier: end-melodies`, activation `special`) en **cualquier rareza** con Songbook, para apagar todas las auras activas sin gastar el Bonus Action de Recital/Encore. Además se descargan **feats resource** por Melodies desbloqueadas (`weapon-forge-melody.export.ts` → `fvtt-Item-melody-of-….json`) con AE aura Active Auras desactivada (`disabled: true`) hasta que Recital/Solo Recital/Encore la active. Catálogo Foundry actual: Might, Swiftness, Precision, Guile, Warding, Focus, Harmful Acid/Cold/Fire/Lightning/Thunder, Clarity, Vigor, Fortitude, Recovery, the Wilds, Resistant Acid/Cold/Fire/Lightning/Thunder (alineado a `public/data/foundry-jsons-example/weapons-resources/melodies/`). En el preview Foundry aparecen bajo la sub-tab **Melodies**.

**Activities de features de combate (chain-first)**: `compileWeaponFeatureActivities` emite **una Activity (y/o AE) por cadena de upgrade**, no por rareza/filas sueltas — excepción: template `counter_spend` (alias legacy `charge_pool_attack`) emite **Gather** (opcional) + **×N botones** (si el rango ≤5) o **una activity con consumption scaling** (rangos anchos) sobre contadores `system.uses`. Gather restaura 1 uso (`consumption` `itemUses` value `-1`), apunta a `self`, y bloquea con Midi `useConditionText` `@item.uses.value < @item.uses.max` al llegar al máximo. Params clave: `itemUsesMax` / `ownsItemUses` / `poolStartsEmpty` / `emitGather` / `spendMin`–`spendMax` / `damageFormula` (por contador) / `advantageOnUse` (con Gather: AE de ventaja en Gather + `dae.selfTarget`; sin Gather: AE en cada ×N) / `durationValue`+`durationUnits` / `rangeUnits` / `targetAffectsType` / `activityImg` / `chatFlavor` (editables en `FeatureAutomationEditor`). Los params de `WeaponForgeFeatureDef.automation` se **mergean** raíz→hoja a la rareza exportada (`upgrade_scaler` solo aporta deltas). Identidad estable Foundry = `chainKey` (raíz); nombre mostrado = hoja activa. `automation.enabled: false` opt-out persistente. **Fuera de alcance (automation on-weapon):** unlocks con `resourceColumn` genéricos (Coatings, Ammo…) — excepciones Songbook Melodies y Switch Axe Phials (`weapon-forge-phial.export.ts`), exportadas como feats aparte. Registro global: `feature-automation.data.ts`. Oleada actual: masteries XPHB, gauges, counter_spend (Charged Slash / ZSD…), Recital Songbook, Switch Axe Phial Gauge/Discharge, mode switch, passives AC/casting, reactions/BA; coatings/ammo siguen parciales. Preview/export etiquetados **Foundry VTT v12**. UI editable en Forge (`FeatureAutomationEditor` + `FeatureActiveEffectEditor` + panel de cadenas).

**Catálogo Amellwind `/weapons`**: export Foundry por rareza desde el diálogo (`WeaponCatalogExportMenu` → mismo compilador; sin UI de edición de automation). Si la rareza emite resources (p. ej. Melodies), el menú Foundry ofrece **Weapon + resources** (arma + un JSON por feat) o **Weapon only**. Diálogos de arma (Amellwind + Forge) y el form de Forge incluyen un tab secundario **Foundry VTT** (`WeaponFoundryPreviewPanel`). El padre construye **un** `FoundryItem` (`buildAmellwindWeaponFoundryItem` en catálogo, `buildWeaponFoundryItem` en Forge) y ese mismo objeto alimenta el preview y la descarga Export (paridad payload). El panel refleja DETAILS + Activity + **Active Effects** leyendo solo campos del item; con `includeBase` el daño mostrado viene de `system.damage.base` del mismo JSON. El export escribe `range.reach` (5 ft, o 10 con `rch`) e `midiProperties.identifier: "attack"` en el ataque principal por defecto.

**Foundry preview — tabs de Weapon Resources**: dentro del tab Foundry, si el bundle emite resources (`buildWeaponFoundryResourceGroups`), aparecen sub-tabs **Weapon** + una tab por tipo (hoy: **Melodies**, **Phials**, **Magazines**). Melodies/Phials son `feat`; Magazines son `consumable` (6 Volleys, patrón Coatings). Ammo / Coatings se añaden al helper cuando tengan export. Cada resource se previsualiza como Item (DETAILS + AE + Raw JSON).

**Switch Axe (Uncommon+)**: overlay `applySwitchAxeOverlay` — AEs indicador **Axe Mode** (default) / **Sword Mode**; sin Activity Sword; golpe Sword = **Phial Discharge** (Attack `2d6` + phial, consume 1); **Fluid Morph** BA alterna modos vía ItemMacro; **Kinetic** recupera uses en hit Axe; 0 charges en Sword aborta y revierte a Axe; ZSD vacía gauge y vuelve a Axe. **Rare:** Expanded Gauge I (`uses` max 7), **ZSD Splash** Save DEX radio 5 ft (trigger desde ZSD), Phials **Exhaust** (AE −10 walk) / **Poison** (Save CON). Macro: `switch-axe-kinetic.macro.ts`. Ejemplos: `weapons/switch-axe/fvtt-Item-switch-axe-uncommon.json`, `weapons/switch-axe/fvtt-Item-switch-axe-rare.json`.

**Charge Blade (Uncommon+)**: overlay `applyChargeBladeOverlay` — AEs indicador **Sword & Shield Mode** (default) / **Axe Mode**; Attacks por modo con **`@mod`** en damage parts; **Switch Mode** BA + deshabilita Integrated Shield en Axe + swap mastery Sap/Cleave; **Elemental Attunement** utility 1/SR (diálogo Acid/Cold/Fire/Lightning; sin elemento por defecto — actualiza `flags.world.chargeBlade.elementalType` y types de Eruption/Discharge/AED); **Phial Charges** recupera 1 en hit Sword; **Guard Point** patrón Shield/Lance; **Rare:** Elemental Discharge (diálogo Yes/No tras hit Axe) + **AED** Activity única con diálogo de cargas (1…available). Macro: `charge-blade.macro.ts`. Ejemplos: `weapons/charge-blade/fvtt-Item-charge-blade-uncommon.json`, `weapons/charge-blade/fvtt-Item-charge-blade-rare.json`.

**Heavy Bowgun (Uncommon+)**: artillería vs Light Bowgun (ráfaga/movilidad). Magazine 4→6→8→10→12 (detrás de LBG; override inline, no heredar 6→8→10→12→15). Ignition máx. 3 (no escala). Uncommon: **Wyvernheart** BA (gasta 1 Ignition; +1d8 si ya impactaste), **Guard** Reaction +1d4 CA (lockout el turno de Wyvernheart), Special Ammo cap 2. Munición Uncommon: Pierce 40 ft; Spread cono 15 ft 1d10; Cluster 2d6 fire; Recover 1d4. Rare: Special 4, Guard 1d6, **Wyverncounter** (Offset: si Guard hace fallar, gasta 1 Ignition y disparas), Poison/Paralysis/Sticky/Slicing 4d6/Wyvern 2d12 (AGMH). VR: Special 6, Wyvernheart +1d10, **Wyvernpiercer** Action (2 Ignition, línea 80 ft +2d10; sin Guard hasta tu próximo turno), upgrades de ammo (Cluster 3d6). Legendary: Special 8, Wyvernpiercer 100 ft +4d10, **Ignition Mode** (PB/LR: +2 Ignition al hit, Guard/Wyverncounter off, Wyvernpiercer como BA). Ejemplos Foundry: `weapons/heavy-bowgun/fvtt-Item-heavy-bowgun-uncommon.json`, `weapons/heavy-bowgun/fvtt-Item-heavy-bowgun-rare.json`, `weapons-resources/ammo-hbg/`. VR/Legendary Forge only por ahora.

**Dual Repeaters (Uncommon+)**: Magazines son **Weapon Resources** consumibles: cada magazine llena las **Charges** del arma (`system.uses` max 6, empieza vacío — UI de Charges en la ficha). Attack gasta 1 Charge. AE `Magazine (Loaded)` marca el tipo cargado (damage type) y riders Rare (p. ej. Blaze Upgrade I → +1d6 fire en AE). Overlay `applyDualRepeatersOverlay` + macro `dual-repeaters-magazines.macro.ts` (on-hit: Cryo/Storm/Slime Upgrade I, Dawnstar, Twilight). Ejemplos: `weapons/dual-repeaters/fvtt-Item-dual-repeaters-uncommon.json`, `weapons/dual-repeaters/fvtt-Item-dual-repeaters-rare.json`, `weapons-resources/magazines/`.

**Magus Staff (Forge RaintDM)**: simple melee quarterstaff-compatible focus (`foc` + Versatile 1d6/1d10 bludgeoning). Common: **Mastery (Sap)** as an _item_ feature (not trained XPHB mastery) — overlay `applyMagusStaffOverlay` + `magus-staff.macro.ts` applies disadvantage on the target's next attack (`1Attack` + `turnStartSource`) after a melee **Attack** hit. Uncommon: **Spell Core Gauge** (max 3, starts empty; clear on SR/LR by setting Spent to max) + **Harvest Magic** (special activity; Item Macro dialog recovers 1 counter, or 2 if the cantrip target was within 15 ft) + **Arcane Discharge** (scaled damage rider, spend 1…max, `1d6` per counter of the spell's type). Rare: **Expanded Gauge** (max 5), **Improve Casting** (+1 spell attack / save DC AE while holding), **Offset Ward** (Reaction: Item Macro spends 2, applies +5 AC with `isAttacked`; on a miss caused this way, cast a Cantrip spell-attack — honor-system). Foundry examples: `weapons/magus-staff/fvtt-Item-magus-staff-common.json`, `weapons/magus-staff/fvtt-Item-magus-staff-uncommon.json`, `weapons/magus-staff/fvtt-Item-magus-staff-rare.json`. VR/Legendary Forge only for now.

**Longsword (Forge RaintDM)**: 1d10 slashing two-handed (no Heavy — the fast two-hander vs Great Sword). Common: Mastery (Sap). Uncommon: **Spirit Gauge** (max 6, starts empty, +1 on a _normal_ hit; dissipates after 1 min / Incapacitated) + **Spirit Blade** (on a normal hit, spend N spirit for +N d4 slashing; d6 at Rare). Rare: **Foresight Slash** (Reaction when hit by melee: spend 2, 1d8 to AC; on a miss caused this way, one counter-attack and regain 1 spirit). Overlay `applyLongswordOverlay` + `longsword.macro.ts`: Attack hit recovers Spirit Gain; Spirit Blade is a scaled **damage** rider (not a second attack); Foresight spends 2 in ItemMacro, applies +1d8 AC (`isAttacked`), refunds 1 on miss, and emits **Foresight Slash: Counter**. Very Rare: fill +2; **Spirit Thrust** / **Spirit Roundslash** / **Spirit Helm Breaker** each **replace one Attack-action attack** (independent; optional combo +1d6 on Helm Breaker if another Spirit technique already resolved this action). No Prone/Stun — Sap is the control. Legendary: **Foresight Slash / Spirit Thrust / Spirit Roundslash Upgrade I** (each generates 1 spirit on a successful hit — Counter hit for Foresight, primary attack hit for Thrust/Roundslash) so Helm Breaker's 5+ spirit **Spirit Release Slash** threshold can cycle; overlay flag `techniqueSpiritOnHit`. **Special Sheathe (Iai Spirit Slash)** BA stance + Reaction; **Spirit Release Slash** (Helm Breaker extra 5d6 if 5+ spirit before the spend). Column **Spirit Gain** is a rarity stat chip, not a feature list. `public/data/raintdm-weapons/longsword.json`. Foundry examples: `weapons/longsword/fvtt-Item-longsword-uncommon.json`, `weapons/longsword/fvtt-Item-longsword-rare.json`. VR/Legendary Forge only for now.

#### Entidad `Weapon`

| Campo                         | Descripción                                                                                                                                                                                                                                                                          |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `name`, `source`, `page`      | Identificación 5etools                                                                                                                                                                                                                                                               |
| `dmg1`, `dmg2`                | Notación de daño (ej. `1d8`, `2d6` en modo versatile)                                                                                                                                                                                                                                |
| `modes`                       | Modos de combate MH (Switch Axe, Charge Blade…): `{ label, damage, dmgType?, isTwoHanded?, blocksOffHand?, hasShield? }[]`. Distinto de Versatile (`V`+`dmg2`). Preferido sobre tablas hardcodeadas por nombre. `dmgType` por modo opcional; si falta, hereda el `dmgType` del arma. |
| `dmgType`                     | `S` / `P` / `B` (Slashing, Piercing, Bludgeoning)                                                                                                                                                                                                                                    |
| `properties`                  | Códigos MH/D&D: `H`, `2H`, `F`, `L`, `R`, `V`, `A`, `S`, `T`, `MHL` (`MHL` → label **Loading**, descripción en `PROPERTY_DESCRIPTIONS`)                                                                                                                                              |
| `weight`, `valueCp`           | Peso y valor en copper pieces                                                                                                                                                                                                                                                        |
| `acBonus`, `range`, `isFocus` | Campos opcionales según el arma                                                                                                                                                                                                                                                      |
| `description`                 | Texto superior parseado sin marcado 5etools                                                                                                                                                                                                                                          |
| `rarityRows`                  | Filas de la tabla inset: rareza (incl. opcional **Base**), slots de runa, columnas dinámicas (stats, features, ammo, phials, etc.)                                                                                                                                                   |
| `baseFeatureNames`            | Nombres de `{@optfeature ...}` en la descripción (features que aplican a todas las rarezas); en forge se sincronizan con la fila **Base**                                                                                                                                            |

`FEATURE_COL_KEYS` identifica columnas de tipo feature: `features`, `single features`, `splint features`, `notes`, `ammo`, `coatings`, `phials`, `available`. Longsword **Spirit Gain** is a numeric rarity stat chip (`isWeaponSpiritGainColumn`), not a feature list.

Columnas de bonus numérico (`Bonus`, `Bonus to Hit`, `Bonus to Damage`, `AC Bonus`, `Bonus AC`) no son features: van en la cabecera de rareza (`+2 to Hit and Damage | +3 to AC`). El `Bonus` / to-hit de AGMH es el bonus mágico de arma (ataque y daño).

`buildColumnChains` agrupa por rareza y anida upgrades (`Foo Upgrade I`) bajo su base. Si un upgrade vive en **Features** pero el ítem base está en otra columna (**Phials**, Ammo, Coatings…), p. ej. `Power Phial Upgrade` ↔ `Power Phial (Costs 2)`, se reparenta a esa cadena (`normalizeFeatureMatchKey`). Las listas trailing `Unlocked Ammo` / `Unlocked Coatings` / etc. se muestran como la columna recurso (tipos expandibles). Si además existe una columna feature con el mismo nombre (caso Light Bowgun: columna **Ammo** con `Ammo (LBG)` / Capacity Increase y tipos en Unlocked Ammo), esa columna feature se remapea a **Features** para no mezclar reglas con munición/recursos.

`resolveWeaponBaseFeatures` también inyecta properties MH con descripción (p. ej. **Loading** desde `MHL`) junto a las `{@optfeature}` base. Features ya listadas en columnas de rareza (p. ej. **Ammo (LBG)** en la columna Ammo) no se reinyectan en Features. En el diálogo, si no hay fila **Base**, se inyecta una con esas features (`weapon-base-rarity.utils.ts`); si ya existe, la sección legacy “Base Features” se omite y el contenido vive en esa tier. Los bloques 5etools `{ type: "abilityDc" }` (Ammo/Coating save DC) se renderizan vía `formatAbilityDcText` en `fivetools-parser.ts`.

#### Entidad `OptionalFeature`

Features opcionales de armas (Melody, Phials, etc.) almacenadas en `gtmh_current` / clave `optfeatures`:

- `name`, `source`, `page`, `featureType[]`
- `weaponName` — arma base parseada del prerequisite
- `prerequisiteRarity` — rareza mínima si aplica
- `paragraphs[]` — texto listo para UI

`optionalfeature.service.ts` expone un `Map` por nombre (lowercase) para resolver features en el diálogo de arma.

#### Pantalla (`WeaponList`)

- Grid de **`WeaponCard`** con color por tipo de daño.
- Filtros: búsqueda por nombre, tipo de daño, propiedad.
- **`WeaponDialog`**: carousel de rarezas, stats por tier, lista de features con tooltips/resolución de optional features.

#### Service (`weapon.service.ts`)

| Función              | Descripción                            |
| -------------------- | -------------------------------------- |
| `getAllWeapons()`    | Filtra `HW`, mapea y cachea en memoria |
| `clearWeaponCache()` | Invalida caché tras sync               |

---

### Ítems y Tiendas

**Rutas**: `/items` (catálogo), `/shops` (tiendas)
**Fuentes**: ítems desde `gtmh_current` (GTMH); tiendas desde `shops.data.ts` (estático).

#### Entidad `MHItem`

Ítems generales del manual (pociones, munición, phials, coatings, gear, etc.):

- `name`, `source`, `type`, `typeLabel` (mapeo de códigos: `HW`, `MHPSA`, `MHCB`, `P`, `G`, …)
- `rarity`, `valueCp`, `weight`, `page`, `entries[]`

#### Entidad `Shop` / `ShopEntry`

Tiendas definidas estáticamente con secciones, entradas (nombre, costo, peso, categoría, `craftOnly`, `extra`).

#### Weapon Resource pricing (Ammo Vendor)

Precios de venta canónicos para consumibles de `public/data/foundry-jsons-example/weapons-resources/` (Ammo LBG/HBG, Coatings, Magazines) viven en `src/features/amellwind/shops/data/weapon-resource-pricing.data.ts`. El Ammo Vendor (`shops.data.ts`) construye sus secciones con `buildAmmoVendorSections()` desde esa tabla (+ filas AGMH shop-only: Tranq, Armor/Demon, Pierce lvl 2–3, Recover lvl 2, Arrows).

| Tier                   | Precio             | Ejemplos                                           |
| ---------------------- | ------------------ | -------------------------------------------------- |
| Basic bulk ×20         | 1 gp               | Normal Ammo                                        |
| Pierce bulk ×20        | 2 gp               | Pierce Ammo                                        |
| Elemental / Spread ×20 | 3 gp               | Flaming, Freeze, Water, Thunder, Dragon, Spread    |
| Sticky / control débil | 1 gp/unidad        | Sticky, Explosive/Sticky                           |
| Status                 | 4 gp/unidad        | Paralysis, Poison                                  |
| Utility / fuerte       | 5 gp/unidad        | Sleep, Recover, Cluster, Slicing                   |
| Specialty HBG          | 10 gp/unidad       | Wyvern                                             |
| Coating utility        | 1 gp               | Power, Close Range                                 |
| Coating elemental      | 2 gp               | Fire, Cold, Lightning, Acid                        |
| Magazine               | 2 / 5 / 15 / 20 gp | Normal / elemental / Upgrade I / Dawnstar·Twilight |

Foundry `system.price` + `system.quantity` de los packs deben coincidir con esa tabla. Phials y Melodies son `feat` (no vendibles).

#### Contexto `CartContext`

Estado global del carrito (`CartEntry[]`): nombre, costo, peso, cantidad, tienda de origen. Compartido entre **ItemList** y **ShopList**.

#### Pantallas

- **`ItemList`**: tabla filtrable de todos los ítems GTMH, panel lateral de detalle, añadir al carrito.
- **`ShopList`**: pestañas por tienda, búsqueda global, tooltips con descripción cruzada desde el catálogo de ítems, añadir al carrito.
- **`CartDrawer`**: drawer del carrito accesible desde ambas pantallas.

#### Service (`item.service.ts`)

| Función           | Descripción                           |
| ----------------- | ------------------------------------- |
| `getAllItems()`   | Mapea todo el array GTMH a `MHItem[]` |
| `formatValueGp()` | Formatea `valueCp` a gp legible       |

---

### Items Forge (RaintDM)

**Ruta**: `/item-forge`
**Fuente de datos**: `public/data/raintdm-items/` (`manifest.json` + un JSON por categoría, p. ej. `magazines.json`, `traps.json`). Fetch en runtime; sin IndexedDB ni editor.

Catálogo curated de variantes RaintDM sobre ítems Amellwind. La UI combina **lista de ítems** y **Combo List**: búsqueda, tabs por `typeLabel`, tabla Name/Rarity/Cost/Weight + Ingredient 1/2/DC/Qty, panel de detalle. **Sin carrito** y **sin crear/editar**. Las recetas usan recursos e ítems Amellwind y las mismas reglas de tirada del Combo List.

#### Entidad `RaintdmItem`

Extiende `MHItem` (`name`, `source`, `type`, `typeLabel`, `rarity`, `valueCp`, `weight`, `entries[]`) con `raintdm?` (`author`, `kind`, `magazineKey`, `trapKey`, `chargesPerMagazine`, `damageType`, `baseWeapon`) mapeado desde `_raintdm`, y `crafting?` (`tool`, `item1`, `item2`, `dc`, `quantity?`) desde el campo top-level `crafting` del JSON.

- Tipo `MHMAG` → label **Magazine (Repeaters)**. Tipo `MHTRAP` → **Traps**. Tipos desconocidos → **Misc**.
- v1: 11 magazines de Dual Repeaters (rework RaintDM; rareza = unlock del arma; 0.5 lb). Precio por rareza: Normal **2 gp**, elemental Uncommon **5 gp**, Upgrade I **15 gp**, Dawnstar/Twilight **20 gp**. El export Foundry de magazines sigue saliendo de Weapon Forge (`priceGp` en `DUAL_REPEATERS_MAGAZINE_DEFS`).
- Crafting magazines: **Herbalism Kit** (igual que DR AMMO AGMH). Specialty = receta AGMH (recurso elemental + Insect Husk, DC 12, qty 1). Normal = Huskberry + Insect Husk (casing). Upgrade I = Catalyst + recurso elemental, DC 15.
- v2: 5 hunter traps (rework RaintDM de AGMH). **Trap Tool** 120 gp / 2 lb (componente, sin receta). **Pitfall Trap** 250 gp DC 14 Str (Prone + Restrained until start of next turn); **Shock Trap** 420 gp DC 14 Con (Incapacitated + Speed 0 until start of next turn). **+** versions: Uncommon, DC 16, until end of next turn; Shock+ also deals 2d8 lightning on trigger. Accustomed: after the effect ends, immune to that trap's base version until a Short Rest; a + still works, with Advantage on the repeat save at the start of the next turn. Placement is an Action, camouflaged DC 15 Perception, lasts 1 hour or until retrieved unused. Crafting takes 10 minutes with **Tinker's Tools**: Pitfall = Net + Trap Tool DC 12; Shock = Thunderbug + Trap Tool DC 12; + = base trap + Trap Tool DC 15.
- **Foundry module**: magazines already live in the **Weapon Resources** pack. Hunter traps ship in the **Items Forge** pack (`public/data/foundry-jsons-example/items-forge/`, `pnpm build:foundry-module`). Set Trap / Retrieve are Item Macros; canvas trigger, camouflage notices, and 1-hour expiry run from `scripts/hunter-traps.js`. Combo Crafting can import Trap Tool / Pitfall / Shock from that pack by name. **Conditions & Diseases** pack (`foundry-jsons-example/conditions/`) registers Amellwind blights/diseases as token HUD statuses with Active Effect automation via `scripts/amellwind-conditions.js`.

#### Service (`item-forge.service.ts`)

| Función                 | Descripción                                                            |
| ----------------------- | ---------------------------------------------------------------------- |
| `getAllForgeItems()`    | Fetch manifest + archivos curated → `RaintdmItem[]` (caché en memoria) |
| `clearForgeItemCache()` | Invalida la caché                                                      |

---

