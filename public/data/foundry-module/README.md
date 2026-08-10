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
type must live in its own compendium, so the content is split across multiple packs.
Sub-folders from the source tree are recreated as **compendium folders** inside each pack.

Sidebar layout under **Amellwind MH** (nested `packFolders` in `module.json`):

```text
Amellwind MH/
├── Weapons
├── Weapon Resources
├── Runes
├── Combo Crafting
├── Felyne Kitchen/
│   ├── Cooking Items
│   ├── Felyne Cook
│   └── Kitchen Sync
├── Hidden Detection/
│   ├── Hidden Detection
│   └── Hidden Detection Sync
└── Resource Nodes/
    ├── Resource Node
    └── Resource Node Sync
```

| Pack (compendium)        | Folder            | Type  | Source folder                         | Contents |
| ------------------------ | ----------------- | ----- | ------------------------------------- | -------- |
| Weapons                  | Amellwind MH      | Item  | `weapons/`                            | 27 weapons |
| Weapon Resources         | Amellwind MH      | Item  | `weapons-resources/`                  | ammo, coatings, magazines, melodies, phials |
| Runes                    | Amellwind MH      | Item  | `runes/<Monster>/`                    | 16 unified runes (one folder per source monster; equip dialog picks Weapon/Armor) |
| Combo Crafting           | Amellwind MH      | Item  | `combo-crafting/`                     | Combo Crafting feature (drop on any actor) |
| Cooking Items            | Felyne Kitchen    | Item  | `cooking-features/` (rank-1, daily-skills) | food + daily skills |
| Felyne Cook              | Felyne Kitchen    | Actor | `cooking-features/`                   | Felyne Cook (embeds its 46 items) |
| Kitchen Sync             | Felyne Kitchen    | Macro | `cooking-features/`                   | Felyne Cook — Kitchen Sync |
| Hidden Detection         | Hidden Detection  | Item  | `hidden-detect/`                      | Hidden Detection feature (drop on the hidden object actor) |
| Hidden Detection Sync    | Hidden Detection  | Macro | `hidden-detect/`                      | Hidden Detection Sync (proximity hooks) |
| Resource Node            | Resource Nodes    | Item  | `resource-node/`                      | Resource Node feature (drop on map gather actors) |
| Resource Node Sync       | Resource Nodes    | Macro | `resource-node/`                      | Resource Node Sync (token interaction hooks) |

Item icons that referenced `mh-icons/...` are bundled under
`Amellwind-MH-RaintDM-module/assets/mh-icons/` and their paths are rewritten to
`modules/Amellwind-MH-RaintDM-module/assets/mh-icons/...`, so the module is
self-contained (no need to drop `mh-icons/` at your Foundry data root).

## Build the module

The compendium packs are LevelDB databases (required since Foundry v11+), so they
must be compiled from the source JSON. From the Toolbox repo root:

First time only (installs `@foundryvtt/foundryvtt-cli`):

```bash
pnpm install
```

Then build the module packs and assets:

```bash
pnpm build:foundry-module
```

This regenerates `Amellwind-MH-RaintDM-module/packs/` and copies the icons into
`Amellwind-MH-RaintDM-module/assets/`. Those two folders are git-ignored because
they are fully derived from the source JSON.

> The generated module folder to ship/install is:
> `public/data/foundry-module/Amellwind-MH-RaintDM-module/`

## Install into a world

1. Build the module:

```bash
pnpm build:foundry-module
```

2. Copy the whole folder
   `public/data/foundry-module/Amellwind-MH-RaintDM-module/`
   into your Foundry data folder, under:
   `…/FoundryVTT/Data/modules/Amellwind-MH-RaintDM-module/`
   (The folder name must stay exactly `Amellwind-MH-RaintDM-module` — it matches
   the module `id`.)
3. Restart Foundry (or "Return to Setup" and relaunch) so it detects the module.
4. Launch your world, open **Game Settings → Manage Modules**, enable
   **Amellwind MH — RaintDM Content**, and save.
5. Open the **Compendium Packs** sidebar tab. Packs appear under **Amellwind MH**,
   with feature bundles nested in **Felyne Kitchen**, **Hidden Detection**, and
   **Resource Nodes**. Drag items/actors onto sheets or the sidebar, or
   right-click a pack → **Import All** to pull everything into the world.

> **Existing worlds:** Foundry applies `packFolders` when the module is first
> enabled in that world. If you already had the flat list, either drag packs
> into the new folders manually, or disable the module, delete the old
> "Amellwind MH" folder in the Compendium sidebar, re-enable the module, and
> reload the world so Foundry recreates the nested layout.

Note: Midi QOL and Item Macro are **required**. Install and enable them first;
Foundry blocks enabling this module until its required dependencies are present.

## Update the module

Whenever you add or change content in
[`public/data/foundry-jsons-example`](../foundry-jsons-example):

1. Edit / add the `fvtt-*.json` files there (keep the folder layout).
2. If you changed the Combo List recipes (`src/features/combo/data/combo.data.ts`)
   or the crafting macro/UI, regenerate the Combo Crafting item first so the
   embedded recipe table and Item Macro stay in sync:

```bash
node public/data/foundry-jsons-example/combo-crafting/build-combo-craft-item.mjs
```

   If you changed Hidden Detection macros / config UI:

```bash
node public/data/foundry-jsons-example/hidden-detect/build-hidden-detection.mjs
```

   If you changed Resource Node macros / config UI:

```bash
node public/data/foundry-jsons-example/resource-node/build-resource-node.mjs
```

3. Rebuild the packs:

```bash
pnpm build:foundry-module
```

4. Bump the `version` in
   `Amellwind-MH-RaintDM-module/module.json` (e.g. `1.0.0` → `1.1.0`).
5. Replace the `Amellwind-MH-RaintDM-module` folder in your Foundry
   `Data/modules/` with the freshly built one (or re-zip and reinstall).
6. In Foundry, existing compendium entries update **in place** (see note on IDs)
   the next time the world loads the packs.

Document `_id`s are **stable** (reused from the source when present, otherwise
derived deterministically from the file path), so rebuilding updates entries
in place instead of creating duplicates. Deleting a source JSON removes it from
the rebuilt pack.

## Hidden Detection (BG3-style)

Proximity discovery for loot / secrets on the canvas. World hooks cannot travel
inside an Item alone, so this ships as a **Feature Item** + a **Sync Macro**.

### Setup (GM)

1. Create or pick an Actor for the hidden object (NPC prop, loot pile, etc.).
2. From **Amellwind MH → Hidden Detection → Hidden Detection**, drag the feature
   onto that Actor (re-import the item if you used an older copy).
3. Place the Actor's token on the scene and **hide** it (Foundry eye / `hidden`).
4. Use **Configure Hidden Detection** (GM). Saving **arms proximity hooks** for the
   session and runs a sync pass — you do not need the Sync macro first.
5. Optional: run **Hidden Detection Sync** on world load (Advanced Macros) so hooks
   are armed without opening Configure.

Configure fields:

- Detection range (ft)
- Mode: skill check **or** Passive Perception
- Skill (skill-check mode), DC, walls block
- Allow retry after fail
- Reveal to whole party on first success
- Whisper skill checks to GM

### Behaviour

- Resolves only when a **character** (or player-owned) token **enters** the aura.
- Configure usage does **not** leave a public chat card (card is deleted).
- **Passive Perception** attempts whisper to the **GM only**. Players receive a chat
  whisper **only on success** (“you noticed something… thanks to Passive Perception”).
- On failure, that PC is locked out unless **Allow retry after fail** is on (then
  they must leave and re-enter).
- On first success the object is marked revealed and **no further checks** run
  until you use **Reset reveal** in Configure.
- Visibility: Foundry unhides the token and restricts it to the discoverer's
  player(s), or to every party player when **Reveal to whole party** is enabled.

### Rebuild sources

After editing `hidden-detect/*.js`:

```bash
node public/data/foundry-jsons-example/hidden-detect/build-hidden-detection.mjs
pnpm build:foundry-module
```

## Resource Node (field gathering)

Items Pile–style interaction for Amellwind resource nodes on the map. World hooks
cannot travel inside an Item alone, so this ships as a **Feature Item** + a
**Sync Macro**.

### Setup (GM)

1. Create or pick an Actor for the node (plant, mineral outcrop, fishing spot, etc.).
2. From **Amellwind MH → Resource Nodes → Resource Node**, drag the feature onto
   that Actor.
3. Put possible loot items in the Actor's **inventory** (each stack is one entry in the loot pool).
4. Place the token on the scene.
5. Use **Configure Resource Node** (GM) to set category/DC/tools. Optional: run
   **Resource Node Sync** if you need to re-arm hooks mid-session.
6. Players double-click the resource token to gather (see interactions below).

The module ships `scripts/resource-node.js`, which arms token double-click hooks on
**every client** (GM and players) at world `ready`. A Sync/Configure macro alone is
not enough for players — those only run on the client that executes them.

### Token interactions

| Who | Action | Result |
| --- | --- | --- |
| Player | Double-click resource token | Open Gather (intercepts sheet; uses PC token on scene) |
| GM | Double-click (no PC / setup) | Open **Configure** |
| GM | Shift+double-click | Open **Configure** |
| Anyone | Alt+double-click | Open the normal **actor sheet** (edit loot inventory) |
| GM | Configure → **Open sheet** | Persist current form values and open the actor sheet (dialog stays open) |

**Player gather (Item Piles–style):** players do **not** need OWNER on the resource
node. On Configure save (and automatically for the GM on world ready), the module
publishes a marker on the **Token/Actor** and sets the actor's default ownership to
**LIMITED** so players can resolve loot without opening the sheet. Double-click opens
Gather — never the Actor sheet. No prior token selection / User Character required.
If you own several PC tokens, the closest one to the node is used.

**GM testing Gather:** place a character token you own on the scene (or assign a User Character),
then double-click the resource node.

Configure fields:

- Enabled
- Category (Plants, Mushrooms, Fish, Insects, Minerals, Bonepiles) → Amellwind skills/tools
- Resource DC
- Require tool rules
- Interaction distance (ft)
- Attempts list with per-player reset + **Reset all attempts**

### Behaviour

- Harvest: category skill check vs DC. Tool rules match Amellwind (e.g. herbalism
  kit; plants/mushrooms without kit roll with disadvantage; fish/insects/minerals
  require their tool).
- On success: roll **1dN** over inventory stacks (N = number of stacks, excluding
  the Resource Node feature) and **copy** that item (`quantity: 1`) to the PC.
  The node's inventory is not depleted.
- One attempt per character (success or fail). Further clicks are blocked until
  the GM resets that player (or all) in Configure.
- Configure / Gather activity use does **not** leave a public chat card.

### Rebuild sources

After editing `resource-node/*.js`:

```bash
node public/data/foundry-jsons-example/resource-node/build-resource-node.mjs
pnpm build:foundry-module
```

## Notes and limitations

- **Cook aura:** the world-level aura logic (the hooks that grant "Ask for a Meal"
  to nearby PCs) is not something a compendium can carry. That's fine — the
  **Felyne Cook actor already embeds its items and templates internally**, and the
  **Kitchen Sync** macro ships in the Cooking Macros pack to drive the aura at
  runtime.
- **Hidden Detection sync:** same pattern as Kitchen Sync — run the Sync macro as
  GM each session (or auto-run on load) so proximity hooks stay registered.
- **Resource Node sync:** token double-click hooks load automatically from the
  module script on every client. The Sync macro / Configure dialog can still re-arm
  them mid-session if needed.
- **Sidecar scripts:** the loose `.js` / `.mjs` / `.fragment.js` files in the source
  folders are development references and are **not** packed. Item-level automation
  already travels embedded in each item's `flags.itemacro`.
- **Assets:** all 82 `mh-icons` are bundled. If you add items that reference new
  icons, drop the `.webp` in `public/mh-icons/` before building.
