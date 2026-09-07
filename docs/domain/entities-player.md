# Entities: Player

> Split from legacy `instrucctions.md`. Prefer this file over reading the whole domain corpus.

### Player (hereda de Actor)

Añade los siguientes campos sobre la base del Actor. Basado en el formato de exportación de Foundry VTT dnd5e system:

#### Identificación del personaje

- **race** — Raza del personaje.
- **background** — Trasfondo (ej. Hunter Initiate).
- **class** — Clase y nivel. En Foundry se almacena como item separado, pero a nivel de resumen:
  - `name` — Nombre de la clase (ej. `"Hunter"`).
  - `level` _(int)_ — Nivel actual (1–20).
  - `subclass` — Subclase elegida (ej. Weapon Style).
- **xp** _(int)_ — Puntos de experiencia acumulados.
- **alignment** — En personajes es un string legible (ej. `"Neutral Good"`), a diferencia del código de monstruos.

#### HP del personaje

A diferencia de los monstruos (que solo tienen `formula` y `average`), los personajes tienen:

- `hp.max` _(int)_ — HP máximo calculado.
- `hp.current` _(int)_ — HP actual.
- `hp.temp` _(int)_ — HP temporales.
- `hp.tempMax` _(int)_ — Incremento temporal al máximo.

#### Estados especiales

- **inspiration** _(boolean)_ — Si el personaje tiene inspiración activa.
- **exhaustion** _(int, 0–6)_ — Nivel de agotamiento actual.
- **deathSaves**
  - `success` _(int, 0–3)_ — Tiradas de muerte exitosas acumuladas.
  - `failure` _(int, 0–3)_ — Tiradas de muerte fallidas acumuladas.

#### Equipo y recursos

- **currency** — Monedas:
  - `pp` _(int)_ — Platinum pieces.
  - `gp` _(int)_ — Gold pieces.
  - `ep` _(int)_ — Electrum pieces.
  - `sp` _(int)_ — Silver pieces.
  - `cp` _(int)_ — Copper pieces.
- **attunement** — Slots de sintonización (máximo generalmente 3).
- **tools** _(array)_ — Herramientas con competencia. Cada entrada: `{ name, ability, value }`.
- **weaponProficiencies** _(array)_ — Armas con competencia.
- **armorProficiencies** _(array)_ — Tipos de armadura con competencia.
- **resources** — Recursos de clase que se recargan (ej. usos de Rage, Ki points):
  - `primary`, `secondary`, `tertiary`: `{ value, max, rechargeOn: "sr" | "lr", label }`.

#### Magia

- **spellcasting** _(string)_ — Atributo usado para el lanzamiento de conjuros (ej. `"wis"`, `"int"`). Vacío si no lanza conjuros.
- **spellSlots** — Slots de conjuros por nivel (1–9) + pacto (`pact`): `{ value, max }`.

#### Características de clase y raza (Features)

A diferencia de los monstruos, los personajes tienen features como items separados (ej. Rage, Second Wind, Hunter Arts):

- **features** _(array)_
  - `name` _(string)_
  - `source` _(string)_ — Origen (clase, raza, trasfondo).
  - `description` _(string)_ — Texto del efecto.
  - `uses` — Si tiene usos limitados: `{ value, max, rechargeOn: "sr" | "lr" }`.

#### Trasfondo y aspecto físico

- **details**
  - `biography` _(string)_ — Historia del personaje.
  - `ideal`, `bond`, `flaw`, `trait` _(strings)_ — Rasgos de personalidad.
  - `age`, `height`, `weight`, `eyes`, `hair`, `skin`, `gender`, `appearance` _(strings)_.

---

