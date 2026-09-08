# Domain documentation (index)

Technical source of truth for Amellwind / 5etools / Foundry domain rules, split for agent token budgets.

**Never read this whole folder.** Open only the one file that matches the task (or `grep` a heading inside it).

| File | ~Size | When to open |
| --- | --- | --- |
| [`overview.md`](./overview.md) | small | Product description, stack, feature status, project tree |
| [`routing.md`](./routing.md) | small | Routes, `App.tsx` lazy loading, Sidebar, `MainLayout` |
| [`data-architecture.md`](./data-architecture.md) | small | IndexedDB sync, stores, offline cache goals |
| [`data-layer.md`](./data-layer.md) | small | Mappers, `createEntityService`, bootstrap |
| [`entities-actor-monster.md`](./entities-actor-monster.md) | medium | Actor base + Monster fields |
| [`entities-rune.md`](./entities-rune.md) | small | Rune model, fluff origin, mapper |
| [`entities-rune-tags.md`](./entities-rune-tags.md) | **large** | Rune tag taxonomy only |
| [`entities-player.md`](./entities-player.md) | small | Player entity |
| [`features-catalog.md`](./features-catalog.md) | medium | Monster/Rune/condition list UIs |
| [`features-cooking-combo.md`](./features-cooking-combo.md) | medium | Artisan Cooking, Combo List |
| [`features-gear.md`](./features-gear.md) | medium | Hunter weapons, siege weapons, shops, Items Forge |
| [`features-world.md`](./features-world.md) | small | Resources, Environments |
| [`features-rune-planner.md`](./features-rune-planner.md) | small | Rune `BuildDrawer` |
| [`features-builder.md`](./features-builder.md) | medium | Character Builder (ALPHA) |
| [`features-amellwind-tools.md`](./features-amellwind-tools.md) | small | Damage calc, species, guide, Monstie, NPC, Downtime |
| [`features-dnd.md`](./features-dnd.md) | small | 5e compendium, Xanathar, shop generator |

## Quick map by task

| Task | Open |
| --- | --- |
| Character Builder / completeness / export gates | `features-builder.md` + skill `builder-validation` |
| Foundry character export/import (SPA) | `features-builder.md` + `src/shared/foundry/` |
| Foundry NPC/monster module (Alatreon, packs) | skill `foundry-monsters` — **not** actor JSON dumps |
| New list/feature service | `data-layer.md` + `data-architecture.md` |
| Rune model / mapper | `entities-rune.md` |
| Rune tags | `entities-rune-tags.md` only |
| Rune planner UI | `features-rune-planner.md` |
| Routing / nav | `routing.md` |

## Legacy

Root `instrucctions.md` is a short pointer to this folder. Prefer `docs/domain/<file>.md`.
