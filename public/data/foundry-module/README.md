# Amellwind MH — RaintDM Foundry module

A Foundry VTT **content module** (`Amellwind-MH-RaintDM-module`) that bundles all the
importable Monster Hunter homebrew content from
[`public/data/foundry-jsons-example`](../foundry-jsons-example) into installable
compendium packs, so you can import everything at once instead of dragging JSON
files one by one.

- **Target:** Foundry VTT core **12.331**, system **dnd5e 4.4.4**.
- **Required modules:** [Midi QOL](https://foundryvtt.com/packages/midi-qol) and
  [Item Macro](https://foundryvtt.com/packages/itemacro). They are declared as hard
  dependencies in `module.json` (`relationships.requires`), so **Foundry will not let
  you enable this module unless both are installed and enabled** (Foundry also pulls in
  Midi QOL's own dependencies such as socketlib, libWrapper and DAE).

## What's inside

The module is generated automatically from the source JSON. Each Foundry document
type must live in its own compendium, so the content is split into six packs.
Sub-folders from the source tree are recreated as **compendium folders** inside each pack.

| Pack (compendium)              | Type  | Source folder                         | Contents |
| ------------------------------ | ----- | ------------------------------------- | -------- |
| Amellwind Weapons              | Item  | `weapons/`                            | 27 weapons |
| Amellwind Weapon Resources     | Item  | `weapons-resources/`                  | ammo, coatings, magazines, melodies, phials |
| Amellwind Runes                | Item  | `runes/<Monster>/`                    | 13 unified runes (one folder per source monster; equip dialog picks Weapon/Armor) |
| Amellwind Cooking Items        | Item  | `cooking-features/` (rank-1, daily-skills) | food + daily skills |
| Amellwind Cooking Actors       | Actor | `cooking-features/`                   | Felyne Cook (embeds its 46 items) |
| Amellwind Cooking Macros       | Macro | `cooking-features/`                   | Felyne Cook — Kitchen Sync |

Item icons that referenced `mh-icons/...` are bundled under
`Amellwind-MH-RaintDM-module/assets/mh-icons/` and their paths are rewritten to
`modules/Amellwind-MH-RaintDM-module/assets/mh-icons/...`, so the module is
self-contained (no need to drop `mh-icons/` at your Foundry data root).

## Build the module

The compendium packs are LevelDB databases (required since Foundry v11+), so they
must be compiled from the source JSON. From the Toolbox repo root:

```bash
pnpm install            # first time only (installs @foundryvtt/foundryvtt-cli)
pnpm build:foundry-module
```

This regenerates `Amellwind-MH-RaintDM-module/packs/` and copies the icons into
`Amellwind-MH-RaintDM-module/assets/`. Those two folders are git-ignored because
they are fully derived from the source JSON.

> The generated module folder to ship/install is:
> `public/data/foundry-module/Amellwind-MH-RaintDM-module/`

## Install into a world

1. Run `pnpm build:foundry-module` (see above).
2. Copy the whole folder
   `public/data/foundry-module/Amellwind-MH-RaintDM-module/`
   into your Foundry data folder, under:
   `…/FoundryVTT/Data/modules/Amellwind-MH-RaintDM-module/`
   (The folder name must stay exactly `Amellwind-MH-RaintDM-module` — it matches
   the module `id`.)
3. Restart Foundry (or "Return to Setup" and relaunch) so it detects the module.
4. Launch your world, open **Game Settings → Manage Modules**, enable
   **Amellwind MH — RaintDM Content**, and save.
5. Open the **Compendium Packs** sidebar tab. The six packs appear under the
   "Amellwind MH" group. Drag items/actors onto sheets or the sidebar, or
   right-click a pack → **Import All** to pull everything into the world.

Note: Midi QOL and Item Macro are **required**. Install and enable them first;
Foundry blocks enabling this module until its required dependencies are present.

## Update the module

Whenever you add or change content in
[`public/data/foundry-jsons-example`](../foundry-jsons-example):

1. Edit / add the `fvtt-*.json` files there (keep the folder layout).
2. Rebuild: `pnpm build:foundry-module`.
3. Bump the `version` in
   `Amellwind-MH-RaintDM-module/module.json` (e.g. `1.0.0` → `1.1.0`).
4. Replace the `Amellwind-MH-RaintDM-module` folder in your Foundry
   `Data/modules/` with the freshly built one (or re-zip and reinstall).
5. In Foundry, existing compendium entries update **in place** (see note on IDs)
   the next time the world loads the packs.

Document `_id`s are **stable** (reused from the source when present, otherwise
derived deterministically from the file path), so rebuilding updates entries
in place instead of creating duplicates. Deleting a source JSON removes it from
the rebuilt pack.

## Notes and limitations

- **Cook aura:** the world-level aura logic (the hooks that grant "Ask for a Meal"
  to nearby PCs) is not something a compendium can carry. That's fine — the
  **Felyne Cook actor already embeds its items and templates internally**, and the
  **Kitchen Sync** macro ships in the Cooking Macros pack to drive the aura at
  runtime.
- **Sidecar scripts:** the loose `.js` / `.mjs` / `.fragment.js` files in the source
  folders are development references and are **not** packed. Item-level automation
  already travels embedded in each item's `flags.itemacro`.
- **Assets:** all 82 `mh-icons` are bundled. If you add items that reference new
  icons, drop the `.webp` in `public/mh-icons/` before building.
