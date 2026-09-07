# Features: Rune Planner (BuildDrawer)

> Split from legacy `instrucctions.md`. Prefer this file over reading the whole domain corpus.

Character Builder: [`features-builder.md`](./features-builder.md).

### Planificador de runas (`BuildDrawer`)

**Ubicación**: montado en **`RuneList`** (`/runes`), no en `MainLayout`.
**Estado**: `RuneBuildRouteLayout` (`RuneBuildProvider`) envuelve `/runes` y `/builder`.

Permite simular un set de equipo con materiales de monstruo **sin** depender del Character Builder.

#### Slots y rareza de equipo

| Slot      | Runas según rareza del equipo        |
| --------- | ------------------------------------ |
| Weapon    | 1–5 slots (Common → Legendary)       |
| Armor     | 1–5 slots                            |
| Trinket 1 | 1 runa (material de arma o armadura) |
| Trinket 2 | 1 runa                               |

`RARITY_SLOTS`: common=1, uncommon=2, rare=3, very rare=4, legendary=5.

#### Validación (`build.validation.ts`)

Grupos de tags **mutuamente excluyentes** al colocar materiales. El match usa **prefijo** (`mechanic:extra-damage` cubre también `…:minor` / `…:major`, igual para `mechanic:spell-buff`).

- **Armadura**:
  1. resistencia / reducción / inmunidad elemental (no inmunidad a condición)
  2. ventaja o inmunidad vs una condición
  3. bonus AC
  4. efectos de runa-charges
- **Arma**:
  1. efecto al sacar 20 natural (`mechanic:roll-20` o `mechanic:critical`) — exento de la regla 2
  2. daño extra / condición on-hit / efecto al impacto (el daño extra condicionado a una condición ya presente no cuenta como “extra damage”)
  3. efectos de runa-charges
  4. bonus a spell DC / spell attack (`mechanic:spell-buff`)

`wouldViolateRule()` avisa en el diálogo al añadir (Rune Builder **permite** añadir y marca la build como inválida; Character Builder puede bloquear la asignación). El drawer muestra alertas con los materiales en conflicto.

#### UI

Drawer lateral colapsable: selectores de rareza, filas de slots, resumen de efectos parseados, botón limpiar build. Desde **RuneList** / **RuneDetailDialog** se pueden añadir runas al planificador. Con filtros de efecto activos en el catálogo, el diálogo atenúa el lado que no matchea y deshabilita su botón de añadir (sigue permitiendo quitar si ya estaba en el build).

**Export Foundry** (`BuildDrawerFooter` → `downloadAllBuildRuneJsons` / `buildRuneFoundryItem`): descarga un Item `equipment` por runa del build. **Solo descripción** (HTML enriquecido); sin activities ni Active Effects. Las automatizaciones curadas viven en `public/data/foundry-jsons-example/runes` (Item Macro compartido: `public/data/scripts/runes/unified-rune-controller.js`, sync con `build-runes-itemacro.mjs`).

---

