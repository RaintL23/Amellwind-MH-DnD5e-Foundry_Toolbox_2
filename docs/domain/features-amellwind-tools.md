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

### Species, Backgrounds y Feats

**Rutas**: `/species`, `/backgrounds`, `/feats`
**Fuente**: claves `race`, `subrace`, `background`, `feat` en `gtmh_current` (sync o lazy-fetch).

- **Species**: grid de tarjetas con filtros por categoría (ancestry, folk, elder-dragon, subrace, lineage) y modo Roots/Subraces. Detalle en dialog.
- **Backgrounds**: listado con búsqueda y detalle parseado (traits, features, equipment).
- **Feats**: listado filtrable con detalle y referencias cruzadas parseadas.

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

