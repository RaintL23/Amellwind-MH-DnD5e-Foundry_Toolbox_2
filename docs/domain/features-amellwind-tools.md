# Features: Amellwind Tools

> Split from legacy `instrucctions.md`. Prefer this file over reading the whole domain corpus.

### Damage & Healing Calculator

**Ruta**: `/damage-calculator`
**Estado**: persistido en `localStorage` (`"damage-calculator-state"`).

Calculadora independiente del builder para estimar el **daño o healing esperado por turno** comparando varias builds (ataques extra, dados de bonificación, críticos y efectos con tirada de salvación).

- **Modo por build** (`WeaponSetup.mode`): `damage` | `healing`. En healing: labels de curación, sin resistencias/inmunidades ni doblar dados por crítico.
- **Componentes**: `DamageCalculatorPage` con paneles `WeaponList`, `AttacksPanel`, `WeaponSettingsPanel`, `DiceEditor`; labels vía `utils/calculator-labels.ts`.
- **Hook**: `useDamageCalculator` (CRUD de builds/ataques/grupos de dados/bonos planos + normalización de estado legacy, incl. `halfDamageOnSave` → `saveSuccessEffect`).
- **Matemática** (`utils/damage-math.utils.ts`): `calcWeaponDamage`, `calcHitChance` (nat 1 miss / nat 20 hit), `calcCritChance`, `calcSaveSuccessChance` (con adv/disadv; sin auto éxito en nat 20), `resolveSaveSuccessEffect` (`half` | `none` | `full`), `calcTurnHitChance`.
- **Tipos**: `WeaponSetup`, `AttackDamageConfig`, `CalculatorMode`, `SaveSuccessEffect`, `DiceGroup`, `FlatBonus`, `RollMode`, `AttackResolution`, `DamageCalculatorState`.

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

Pestañas: Creating a Character, Higher Level, Equipment, Skills, Hunt Roles. **Equipment** reúne las reglas de equipo del capítulo 3: Starting Equipment (nivel 1), Wealth, Selling Treasure, Magical Items (Limited Use, Attunement), Armor/Weapons (rarity, reglas de materiales, upgrades), Shields, Unarmed Strikes, Trinkets, Cosmetic Material Slot, Armor & Weapon Pricing y el ejemplo de la Great Jagras. Renderiza secciones, tablas (`GuideTable`) e insets del manual para orientar la creación de personajes MH.

---

### Monstie Sidekick

**Ruta**: `/monstie-sidekick`
**Fuente**: curado estático desde Appendix C Patreon (`monstie-appendix.data.ts`) + `classFeature[]` / `variantrule[]` (GTMH sync).

Pestañas **Rules** (overview Appendix C, progresión sync, class features) y **Monstie Creator** (contexto interactivo para armar un sidekick). Servicio: `monstie-sidekick.service.ts`.

Creator (`utils/build-monstie.ts` → `resolveMonstieChoices` + `buildMonstieFromDraft`; reescritura de texto en `utils/monstie-scaling.ts`):

- **Elegibles**: excluye Elder Dragons (grupo o tag de tipo `elder`), Paragon, versiones Tempered/Arch-tempered/Risen y el grupo `Monster Templates`.
- **Plantilla**: array 15/14/13/12/10/8 según el orden del original; AC 10 + Dex + PB; HP 10 + Con, +1d8 + Con por nivel, +15 a 15º y +1/nivel después; velocidades/sentidos con los topes del apéndice. Sin resistencias/inmunidades heredadas.
- **Skills**: claves crudas de 5etools (`perception`) → `SkillKey`; 2 a nivel 1 y +1 en 4/8/12/14/16/19.
- **Ataque de plantilla**: un ataque del original → +hit = mod + PB, `1d#` (+ dados extra), alcance 5 ft.
- **Signature Attack**: usos = PB (Recharge 5–6) o PB/2 (Recharge 6) por descanso largo; dados = PB (+1 si un solo objetivo) repartidos entre tipos; cono/línea/rango según nivel; DC = 8 + PB + mod (CON aliento/veneno/rugido, STR derribo/carga, CHA Frightful Presence).
- **Trait / Creature**: Trait sin daño (excepto Legendary/Magic Resistance); Creature ≠ multiattack/recarga/uso limitado, sin repetir lo ya elegido; ataques siguen la plantilla, daño ≤ Signature, auras −1 tamaño de dado, bonos de AC/skill = PB.
- **ASI y fallbacks**: puntos (+2 por ASI, +1 por Monstie Trait sin opciones, +2 en 7º si el original no tiene salvaciones y no se elige inmunidad), máx. 20. Salvaciones del original desde 7º. **Extra Attack or Damage** (6º/15º) limitado al Multiattack del original; si no, +1 dado.
- Bajar de nivel poda skills/traits/creature/puntos que ya no caben.

---

### Guardian Template

**Ruta**: `/guardian-template`
**Fuente**: estática desde MHMM Patreon (`guardian-template.data.ts` ← `21-monster-templates.md` / `guardian-template.md`).

Reglas para aplicar el template Guardian a un monstruo (tipo Construct, resistencias/inmunidades, Synthetic Suppression, Wylk Explosion + tabla por CR, Wylk Crystals). Enlace al bestiary para elegir la base.

---

### Guild Knights

**Ruta**: `/guild-knights`
**Fuente**: estática desde GTMH Appendix C (`guild-knights.data.ts` ← `gtmh-patreon-appendixC.md`).

Stat blocks de los cuatro rangos (Apprentice CR 3, Guild Knight CR 7, Captain CR 10, Commander CR 16) guardados como JSON estilo 5etools y renderizados con `mapMonster` + `MonsterStatBlock`. No forman parte del feed MHMM del bestiario.

---

### NPC Generator

**Ruta**: `/npc-generator`
**Fuente**: plantillas estáticas (`npc-templates.data.ts`, `npc-power-scaling.data.ts`) + species/backgrounds GTMH.

Genera stat blocks humanoides combinando especie MH, trasfondo de gremio y template de combate escalado por hit dice. Estado en `NpcCreatorContext`.

- Las puntuaciones más altas del array van a `abilityPriority` del template (determinista; no se re-baraja al editar otros campos).
- Promedios estilo MM: `floor(N × (dado + 1) / 2)` para HP y daño.
- Armas MH: rango con `ft.`, propiedad `R` → alcance 10 ft., finesse usa el mayor de Str/Dex. El escudo MH sustituye el escudo genérico del template (no se suma dos veces). AC de armaduras nombradas (leather, studded, hide, chain shirt) con su fórmula PHB.
- Género "Random" se tira una vez (y al randomizar/resetear); nombre y descriptor coinciden.
- Texto de especie/trasfondo/armas reescrito a tercera persona en `entries` y `content` (concordancia verbal incluida); los rasgos "Skill Proficiency" de especie se aplican a Skills.
- Hit die d4/d12/d20 → Tiny/Huge/Gargantuan (acotado a los tamaños de la especie).

---

### Downtime

**Ruta**: `/downtime`
**Fuente**: entradas de downtime en `variantrule[]` (GTMH) vía `downtime.mapper.ts`.

Listado lateral de actividades con contenido parseado (pasos, tablas, reglas). Servicio: `downtime.service.ts`.

---

