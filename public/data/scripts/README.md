# Foundry macros & engines

Canonical **Foundry VTT** Item Macros, sync macros, fragment sources, and client
engines used by Amellwind / RaintDM content. Folder names mirror
`../foundry-jsons-example/` so you can jump from a JSON example to its script.

| Folder | What lives here |
| --- | --- |
| `weapons-resources/` | Item Macros for ammo, coatings, magazines, melodies, gunlance, lance, dual blades |
| `cooking-features/` | Felyne Cook Item Macros, aura fragments, player flow, sync engine |
| `hidden-detect/` | Hidden Detection configure + sync macro/engine |
| `resource-node/` | Resource Node configure + sync macro/engine |
| `items-forge/` | Hunter traps Item Macro + canvas engine |
| `conditions/` | Amellwind conditions & diseases registry + HUD/Active Effect engine |
| `monsters/` | Dire Miralis + Tempered Alatreon (MHW) combat automation engines |
| `combo-crafting/` | Combo Crafting Item Macro (recipes injected at build time) |
| `runes/` | Shared unified rune Item Macro controller + Partbreaker+1 fragment |

## Runes (`runes/`)

Rune automation stays **self-contained on each Item** (no module client engine / world
hooks). The shared Item Macro used by every curated rune lives here and is injected
into `foundry-jsons-example/runes/**/fvtt-Item-*-rune.json`.

| File | Role |
| --- | --- |
| `unified-rune-controller.js` | Equip dialog, side apply/cleanup, DAE on/off, Midi `pass` plumbing |
| `partbreaker-plus-one.fragment.js` | Shared Partbreaker+1 combat-pass fragment (Coral Pukei / Duramboros / Uragaan) |
| `compose-rune-itemacro.mjs` | Helper: controller + optional combat passes → full `flags.itemacro` command |

**Per-rune** Midi / on-equip code still lives with each Item (or as `macroTail` in the
`_build-*-runes.mjs` generators). AE blueprints and `sides` flags stay on the JSON.

Rebuild / sync:

```bash
# Generators (write full items, including macro via composeRuneItemMacroCommand)
node public/data/foundry-jsons-example/runes/_build-requested-runes.mjs
node public/data/foundry-jsons-example/runes/_build-alatreon-oneshot-runes.mjs
node public/data/foundry-jsons-example/runes/_build-missing-runes.mjs

# Re-inject shared controller into every rune JSON (preserves per-rune combat passes)
node public/data/foundry-jsons-example/runes/build-runes-itemacro.mjs
```

App `/runes` and Character Builder Foundry export remain **description-only**; curated
automated copies are the JSON examples above.

## How these are used

1. **Embedded in JSON** — `build-*.mjs` under `foundry-jsons-example/` read these
   files and inject them into `flags.itemacro` / Macro `command` fields.
2. **Module client scripts** — `pnpm build:foundry-module` copies engines into
   `foundry-module/Amellwind-MH-RaintDM-module/scripts/` (auto-generated; do not
   edit those copies by hand). Rune Item Macros are **not** copied as module
   scripts; they travel inside each Item.
3. **App export** — some Weapon Forge TypeScript macros in `src/` are kept in
   sync with the reference `.js` here (see file headers).

JSON actors/items stay in `foundry-jsons-example/`. Node one-shot builders
(`build-*.mjs`, `generate-*.mjs`) stay next to those JSON files.
