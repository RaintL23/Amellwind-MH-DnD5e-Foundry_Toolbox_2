# Features: Amellwind Tools

> Split from legacy `instrucctions.md`. Prefer this file over reading the whole domain corpus.

### Damage Calculator

**Ruta**: `/damage-calculator`
**Estado**: persistido en `localStorage` (`"damage-calculator-state"`).

Calculadora independiente del builder para estimar el **daño esperado por turno** comparando varias builds de armas (ataques extra, dados de bonificación, críticos y efectos con tirada de salvación).

- **Componentes**: `DamageCalculatorPage` con paneles `WeaponList`, `AttacksPanel`, `WeaponSettingsPanel`, `DiceEditor`.
- **Hook**: `useDamageCalculator` (CRUD de armas/ataques/grupos de dados/bonos planos + normalización de estado legacy).
- **Matemática** (`utils/damage-math.utils.ts`): `calcWeaponDamage`, `calcHitChance`, `calcCritChance`, `calcSaveSuccessChance`, `calcTurnHitChance`, medias de dados y `ALL_DAMAGE_TYPES`.
- **Tipos** (`types/damage-calculator.types.ts`): `WeaponSetup`, `AttackDamageConfig`, `DiceGroup`, `FlatBonus`, `RollMode`, `AttackResolution`, `DamageCalculatorState`.

---

### Species, Backgrounds, Feats y Lore

**Rutas**: `/species`, `/backgrounds`, `/feats`, `/lore`, `/factions`
**Fuente**: claves `race`, `subrace`, `background`, `feat` en `gtmh_current` (merge local-wins desde `public/data/gtmh-patreon/supplement.json` + fallback GitHub). Lore/Factions son guías estáticas regeneradas desde el capítulo 1 (`lore.generated.json`, `factions.generated.json`).

- **Species**: grid de species raíz locales + subspecies huérfanas (p. ej. Elder Dragonborn sin base AGMH). Detalle en dialog con switcher Base / Subspecies que acumula traits e info de la subespecie sobre la base. Overlay Patreon de razas aún stub (fallback GitHub).
- **Backgrounds**: listado con búsqueda y detalle parseado (traits, features, equipment). Overlay local desde el capítulo 1 Patreon (`Helix`, `Hunter's Guild`, `Scriveners`, `Talon`, `Wycademy`).
- **Factions** (`/factions`): guía estática regenerada desde el mismo capítulo (`pnpm build:gtmh-supplement` → `factions.generated.json`).
- **Lore** (`/lore`): Tale of the Five, History & Myths, Gods, Races narrativas (`lore.generated.json`).
- **Feats**: listado filtrable con detalle. Texto curado desde el capítulo 2 (`new-feats.md`) con párrafos y listas de beneficios al estilo del PDF; parser en `scripts/gtmh/feats.mjs`.

Servicios: `species.service.ts`, `background.service.ts`, `feat.service.ts` con caché en memoria invalidada tras sync GTMH.

---

### Character Guide

**Ruta**: `/character-guide`
**Fuente**: `character-guide.data.ts` (estático).

Pestañas: Creating a Character, Higher Level, Skills, Hunt Roles. Renderiza secciones, tablas (`GuideTable`) e insets del manual para orientar la creación de personajes MH.

---

### Monstie Sidekick

**Ruta**: `/monstie-sidekick`
**Fuente**: `classFeature[]` y reglas en `variantrule[]` (GTMH).

Pestañas **Rules** (progresión, class features) y **Monstie Creator** (contexto interactivo para armar un sidekick). Servicio: `monstie-sidekick.service.ts`.

---

### NPC Generator

**Ruta**: `/npc-generator`
**Fuente**: plantillas estáticas (`npc-templates.data.ts`, `npc-power-scaling.data.ts`) + species/backgrounds GTMH.

Genera stat blocks humanoides combinando especie MH, trasfondo de gremio y template de combate escalado por hit dice. Estado en `NpcCreatorContext`.

---

### Downtime

**Ruta**: `/downtime`
**Fuente**: entradas de downtime en `variantrule[]` (GTMH) vía `downtime.mapper.ts`.

Listado lateral de actividades con contenido parseado (pasos, tablas, reglas). Servicio: `downtime.service.ts`.

---

