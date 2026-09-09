# Routing and Navigation

> Split from legacy `instrucctions.md`. Prefer this file over reading the whole domain corpus.

## Routing y Navegación

La app usa **React Router v6** con rutas declarativas montadas en `App.tsx`. El layout general (Sidebar + área de contenido) se aplica mediante un componente `MainLayout` que envuelve todas las rutas con contenido.

### Estructura de rutas

Todas las rutas de página se cargan con **`React.lazy`** y `<Suspense>` (fallback `LoadingScreen` con skeletons).

```text
/                          → Home (landing; replica las 3 secciones del Sidebar)

── Amellwind Homebrew ──
/damage-calculator         → Calculadora de daño por turno
/character-guide           → Guía de creación de personajes
/monstie-sidekick          → Reglas y creador de Monstie Sidekick
/npc-generator             → Generador de NPCs humanoides
/species                   → Especies y subrazas (GTMH)
/backgrounds               → Trasfondos (GTMH)
/feats                     → Dotes (GTMH)
/monsters                  → Listado de monstruos MH
/monsters/:monsterId       → Detalle de monstruo (página dedicada)
/runes                     → Materiales de monstruo + planificador
/material-effects          → Efectos de materiales (armadura/arma)
/conditions                → Condiciones y enfermedades (MHMM / Amellwind; UI combinada)
/diseases                  → Redirect a /conditions
/dnd-conditions            → Condiciones, statuses y enfermedades clásicas D&D 5e (5etools)
/weapons                   → Hunter Weapons
/items                     → Catálogo de ítems GTMH (`amellwind/shops` ItemList)
/shops                     → Tiendas y carrito
/cooking                   → Cocina artesana
/combo                     → Combo List
/hunt                      → Hunt Planner
/environments              → Biomas y tablas de cacería
/resources                 → Recursos de campo
/downtime                  → Actividades de downtime (GTMH)

── Amellwind (RaintDM) ──
/builder                   → Character Builder (ALPHA, export/import Foundry VTT)
/weapon-forge              → Weapon Forge (variantes RaintDM + armas custom)
/weapon-forge/new          → Crear arma custom
/weapon-forge/edit/:id     → Editar arma custom
/item-forge                → Items Forge (catálogo curated RaintDM)

── Compendio D&D 5e ──
/dnd-character-guide       → Guía de creación de personaje (PHB 2014 / 2024)
/spells                    → Conjuros (5etools)
/classes                   → Listado de clases base
/classes/:classId          → Detalle de clase (variantes por fuente; `?subclass=SOURCE::Name` selecciona subclase y auto-carga su source brew si hace falta)
/dnd-races                 → Especies oficiales 5e
/dnd-backgrounds           → Trasfondos oficiales 5e
/dnd-feats                 → Dotes oficiales 5e
/dnd-items                 → Ítems mágicos y equipo (5etools)
/bestiary                  → Bestiario oficial
/bestiary/:creatureId      → Detalle de criatura
/xanathar-backstory        → Generador de trasfondo (XGE)
/shop-generator            → Generador de tiendas D&D 5e

*                          → Página 404 / Not Found
```

### Implementación en `App.tsx`

Al montar, `App.tsx` ejecuta `syncData()` y muestra un banner de sincronización vía `SyncProvider` hasta que termina. Tras un sync exitoso invalida cachés en memoria según qué store se actualizó (MM: monstruos/runas/conditions/diseases; GTMH: species/backgrounds/feats/monstie/material-effects/items/weapons/downtime).

Providers globales:

- **`ThemeProvider`** — temas visuales (selector en el footer del Sidebar).
- **`SyncProvider`** — estado de sincronización inicial (`syncing`).
- **`BrowserRouter`** + rutas lazy.

Providers en **`MainLayout`** (todas las rutas con layout):

- **`CartProvider`** — carrito de compras (tiendas e ítems).
- **`BuilderInventoryProvider`** — resuelve armas/armaduras equipables desde el carrito para el Builder (global: Purchase en `/shops` y `/items`). `CartPurchaseBridge` inyecta `purchaseFromCart` para que `CartDrawer` no importe el Builder.
- **`CartPurchaseBridge`** — puente layout: `BuilderInventoryContext` → `CartPurchaseContext`.

Providers **por ruta** (no globales):

- **`RuneBuildRouteLayout`** — `RuneBuildProvider` solo en `/runes` y `/builder`.
- **`BuilderRouteProviders`** — `CharacterBuilderProvider` + spellcasting + autosave + syncs de inventario, solo en `/builder`.

```tsx
<ThemeProvider>
  <SyncProvider syncing={syncing}>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout syncing={syncing} />}>
          <Route index element={<HomePage />} />
          {/* … rutas lazy con Suspense … */}
          <Route element={<RuneBuildRouteLayout />}>
            <Route path="runes" element={<RuneList />} />
            <Route
              path="builder"
              element={
                <BuilderRouteProviders>
                  <BuilderPage />
                </BuilderRouteProviders>
              }
            />
          </Route>
          <Route path="monsters" element={<MonstersOutlet />}>
            <Route index element={<MonsterList />} />
            <Route path=":monsterId" element={<MonsterDetailPage />} />
          </Route>
          <Route
            path="diseases"
            element={<Navigate to="/conditions" replace />}
          />
          {/* … */}
        </Route>
      </Routes>
    </BrowserRouter>
  </SyncProvider>
</ThemeProvider>
```

### Sidebar y navegación

El `Sidebar` agrupa links en grupos colapsables organizados bajo tres secciones: **Amellwind Homebrew**, **Amellwind (RaintDM)** y **D&D 5e Compendium**. Soporta **colapso en desktop** (solo iconos) y **drawer en mobile** con overlay. Incluye **`ThemeSelector`** en el footer. La configuración vive en `NAV_SECTIONS` (`src/shared/constants/nav-sections.ts`); cada sección tiene `id` + `label` + `groups`, y cada grupo tiene `label` + `items` (con `description` / `badge` para Home). `Sidebar` y `HomePage` consumen el mismo mapa. Hunt Planner está en **World and Exploration**.

**Amellwind (RaintDM)** agrupa el Character Builder (hub de personaje de toda la app), el Damage Calculator (también listado en Amellwind Homebrew) y las variantes de mesa de RaintDM sobre el homebrew 2014 de Amellwind (Weapon Forge, Items Forge). Si una sección tiene un solo grupo, el Sidebar renderiza los links planos bajo el título de sección (sin acordeón extra).

El equipo equipable del Builder proviene de ítems añadidos al carrito en Shops/Items (`CartContext` → `BuilderInventoryContext`). El Sidebar **no** muestra badge de inventario sobre Builder.

| Sección             | Grupo Sidebar                 | Links principales                                                           |
| ------------------- | ----------------------------- | --------------------------------------------------------------------------- |
| Amellwind Homebrew  | Character                     | Damage Calculator, Creation Guide                                           |
| Amellwind Homebrew  | Bestiary and Rules            | Monsters, Conditions & Diseases                                             |
| Amellwind Homebrew  | Species and Character Options | Species, Backgrounds, Feats                                                 |
| Amellwind Homebrew  | Weapons, Runes, and Equipment | Weapons, Runes, Material Effects, Items                                     |
| Amellwind Homebrew  | World and Exploration         | Hunt Planner, Environments, Resources, Shops, Cooking, Combo List, Downtime |
| Amellwind Homebrew  | NPCs and Companions           | Monstie Sidekick, NPC Generator                                             |
| Amellwind (RaintDM) | Character                     | Builder, Damage Calculator                                                  |
| Amellwind (RaintDM) | Weapons                       | Weapon Forge, Items Forge                                                   |
| D&D 5e Compendium   | Spells and Classes            | Spells, Classes                                                             |
| D&D 5e Compendium   | Character Options             | Races, Backgrounds, Feats                                                   |
| D&D 5e Compendium   | Bestiary                      | Bestiary                                                                    |
| D&D 5e Compendium   | Equipment                     | Items                                                                       |
| D&D 5e Compendium   | Character Tools               | Creation Guide, Encounter Calculator, Xanathar Backstory, Shop Generator |

### Layout global (`MainLayout`)

`MainLayout` monta `Sidebar`, banner de sync opcional, topbar mobile y `<Outlet />`. Wrappers extra: **`RuneBuildRouteLayout`** (`/runes` + `/builder`) y **`BuilderRouteProviders`** (solo `/builder`). **No** incluye `BuildDrawer` global: el planificador de runas vive solo en **`RuneList`** (`/runes`) y el builder reutiliza `RuneBuildContext` en `/builder`.

---

