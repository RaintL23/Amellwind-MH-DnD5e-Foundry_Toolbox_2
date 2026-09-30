---
name: foundry-monsters
description: >-
  Work on Amellwind Foundry hunt-boss actors and module automation (Alatreon,
  Dire Miralis, Jin Dahaad, conditions). Use when editing monster build scripts,
  module JS (alatreon.js, dire-miralis.js, jin-dahaad.js), amellwind-conditions,
  or foundry-jsons-example/monsters — never for SPA Character Builder export.
---

# Foundry hunt bosses / module monsters

## Hard rule — token budget

**Do not read** whole `fvtt-Actor-*.json` files (thousands of lines). Prefer:

1. Build script under `public/data/foundry-jsons-example/monsters/build-*.mjs`
2. Runtime automation under `public/data/foundry-module/.../scripts/`
3. Shared engines under `public/data/scripts/monsters/`
4. Targeted `Grep` on the actor JSON by `name`, `_id`, or flag key
5. Module overview sections in `public/data/foundry-module/README.md` (Monsters) — Grep headings; do not ingest the whole README unless needed

`.cursorignore` excludes example actor JSON from @codebase indexing.

## Key paths

| Role | Path |
| --- | --- |
| Module README (Monsters section) | `public/data/foundry-module/README.md` |
| Module scripts | `public/data/foundry-module/Amellwind-MH-RaintDM-module/scripts/` |
| Alatreon automation | `.../scripts/alatreon.js` |
| Dire Miralis automation | `.../scripts/dire-miralis.js` |
| Jin Dahaad automation | `.../scripts/jin-dahaad.js` |
| Conditions HUD / AE | `.../scripts/amellwind-conditions.js` |
| Alatreon engine | `public/data/scripts/monsters/alatreon-engine.js` |
| Dire Miralis engine | `public/data/scripts/monsters/dire-miralis-engine.js` |
| Jin Dahaad engine | `public/data/scripts/monsters/jin-dahaad-engine.js` |
| Build Tempered Alatreon | `public/data/foundry-jsons-example/monsters/build-tempered-alatreon-mhw-actor.mjs` |
| Build Dire Miralis | `public/data/foundry-jsons-example/monsters/build-dire-miralis-actor.mjs` |
| Build Jin Dahaad | `public/data/foundry-jsons-example/monsters/build-jin-dahaad-actor.mjs` |
| Example actors (Grep only) | `public/data/foundry-jsons-example/monsters/*.json` |

## Rebuild after edits

```bash
node public/data/foundry-jsons-example/monsters/build-dire-miralis-actor.mjs
node public/data/foundry-jsons-example/monsters/build-tempered-alatreon-mhw-actor.mjs
node public/data/foundry-jsons-example/monsters/build-jin-dahaad-actor.mjs
pnpm build:foundry-module
```

Target: Foundry **12.331**, dnd5e **4.4.4**, Midi QOL + Item Macro required.

## SPA vs module

| Concern | Where |
| --- | --- |
| Player character export/import | `src/shared/foundry/`, `src/features/raintdm/builder/foundry-*` + skill `builder-validation` |
| Hunt NPC actors + world hooks | This skill (`public/data/…`) |

Domain UI docs for Builder: `docs/domain/features-builder.md` — not this skill.
