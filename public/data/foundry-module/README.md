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
- **Recommended (Foundry 12 / dnd5e 4.4.x):** [Plutonium](https://foundryvtt.com/packages/plutonium)
  (content links), [Cauldron of Plentiful Resources](https://foundryvtt.com/packages/chris-premades)
  (Actor Medkit on PHB/XPHB names), [Gambit's Premades](https://foundryvtt.com/packages/gambits-premades)
  **v1.0.1–1.0.56** (not the v13 line), Active Auras, Times Up. After import, run the
  CPR Actor Medkit and add GPS as an additional Medkit compendium.

## What's inside

The module is generated automatically from the source JSON. Each Foundry document
type must live in its own compendium, so the content is split across multiple packs.
Sub-folders from the source tree are recreated as **compendium folders** inside each pack.

Sidebar layout under **Amellwind MH (RaintDM)** (nested `packFolders` in `module.json`):

```text
Amellwind MH (RaintDM)/
├── Weapons
├── Weapon Resources
├── Runes
├── Combo Crafting
├── Items Forge
├── Felyne Kitchen/
│   ├── Cooking Items
│   ├── Felyne Cook
│   └── Kitchen Sync
├── Hidden Detection/
│   ├── Hidden Detection
│   └── Hidden Detection Sync
├── Resource Nodes/
│   ├── Resource Node
│   ├── Resource Node Sync
│   └── Resource Node Actors
└── Monsters/
    └── Monsters
```

| Pack (compendium)        | Folder                    | Type  | Source folder                         | Contents |
| ------------------------ | ------------------------- | ----- | ------------------------------------- | -------- |
| Weapons                  | Amellwind MH (RaintDM)    | Item  | `weapons/`                            | 29 weapons |
| Weapon Resources         | Amellwind MH (RaintDM)    | Item  | `weapons-resources/`                  | ammo, coatings, magazines, melodies, phials |
| Runes                    | Amellwind MH (RaintDM)    | Item  | `runes/<Monster>/`                    | 44 unified runes (one folder per source monster; equip dialog picks Weapon/Armor) |
| Combo Crafting           | Amellwind MH (RaintDM)    | Item  | `combo-crafting/`                     | Combo Crafting feature (drop on any actor) |
| Items Forge              | Amellwind MH (RaintDM)    | Item  | `items-forge/traps/`                  | Hunter traps (Trap Tool, Pitfall, Shock, +) |
| Cooking Items            | Felyne Kitchen    | Item  | `cooking-features/` (rank-1, daily-skills) | food + daily skills |
| Felyne Cook              | Felyne Kitchen    | Actor | `cooking-features/`                   | Felyne Cook (embeds its 46 items) |
| Kitchen Sync             | Felyne Kitchen    | Macro | `cooking-features/`                   | Felyne Cook — Kitchen Sync |
| Hidden Detection         | Hidden Detection  | Item  | `hidden-detect/`                      | Hidden Detection feature (drop on the hidden object actor) |
| Hidden Detection Sync    | Hidden Detection  | Macro | `hidden-detect/`                      | Hidden Detection Sync (proximity hooks) |
| Resource Node            | Resource Nodes    | Item  | `resource-node/`                      | Resource Node feature (drop on map gather actors) |
| Resource Node Sync       | Resource Nodes    | Macro | `resource-node/`                      | Resource Node Sync (token interaction hooks) |
| Resource Node Actors     | Resource Nodes    | Actor | `resource-node/actors/`               | Prebuilt gather nodes (Environment × Tier × Category) |
| Monsters                 | Monsters          | Actor | `monsters/`                           | Hunt bosses (Dire Miralis) |

Item icons that referenced `mh-icons/...` are bundled under
`Amellwind-MH-RaintDM-module/assets/mh-icons/` and their paths are rewritten to
`modules/Amellwind-MH-RaintDM-module/assets/mh-icons/...`, so the module is
self-contained (no need to drop `mh-icons/` at your Foundry data root).

Hunter weapons, runes, coatings, ammo, and hunter traps keep those mh-icons. Everything else
(resource-node actors, Felyne Cook, Hidden Detection, Combo Crafting, Dire
Miralis, gather loot) prefers Foundry core paths such as
`icons/equipment/hand/gauntlet-tooled-leather-brown.webp` or
`icons/consumables/plants/herb-tied-bundle-green.webp` when a core icon fits
better — those resolve from Foundry's own `icons/` folder, so they are not
copied into the module.

Validate core `icons/...` paths against your local Foundry install before building
(default: `C:/Program Files/Foundry Virtual Tabletop/resources/app/public` on Windows):

```bash
pnpm validate:foundry-icons
# or: FOUNDRY_PUBLIC="/path/to/resources/app/public" pnpm validate:foundry-icons
```

The script reports missing paths and suggests nearest matches from Foundry's 6300+ icon files.
`mh-icons/` and `systems/dnd5e/icons/` paths are excluded (module / system assets).

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
   **Amellwind MH (RaintDM)**, and save.
5. Open the **Compendium Packs** sidebar tab. Packs appear under **Amellwind MH (RaintDM)**,
   with feature bundles nested in **Felyne Kitchen**, **Hidden Detection**, and
   **Resource Nodes**. Drag items/actors onto sheets or the sidebar, or
   right-click a pack → **Import All** to pull everything into the world.

> **Existing worlds:** Foundry applies `packFolders` when the module is first
> enabled in that world. If you already had the flat list, either drag packs
> into the new folders manually, or disable the module, delete the old
> "Amellwind MH" / "Amellwind MH (RaintDM)" folder in the Compendium sidebar,
> re-enable the module, and reload the world so Foundry recreates the nested layout.

Note: Midi QOL and Item Macro are **required**. Install and enable them first;
Foundry blocks enabling this module until its required dependencies are present.

## Update the module

Whenever you add or change content in
[`public/data/foundry-jsons-example`](../foundry-jsons-example):

1. Edit / add the `fvtt-*.json` files there (keep the folder layout).
2. If you changed the Combo List recipes (`src/features/amellwind/combo/data/combo.data.ts`)
   or the crafting macro/UI, regenerate the Combo Crafting item first so the
   embedded recipe table and Item Macro stay in sync:

```bash
node public/data/foundry-jsons-example/combo-crafting/build-combo-craft-item.mjs
```

   If you changed Felyne Cook macros / token UI:

```bash
node public/data/foundry-jsons-example/cooking-features/build-felyne-cook-actor.mjs
```

   If you changed Hidden Detection macros / config UI:

```bash
node public/data/foundry-jsons-example/hidden-detect/build-hidden-detection.mjs
```

   If you changed Resource Node macros / config UI:

```bash
node public/data/foundry-jsons-example/resource-node/build-resource-node.mjs
```

   If environment / resource tables changed, regenerate the prebuilt actors:

```bash
node public/data/foundry-jsons-example/resource-node/build-resource-node-actors.mjs
```

   If you changed Items Forge hunter traps (`public/data/raintdm-items/traps.json`):

```bash
node public/data/foundry-jsons-example/items-forge/build-items-forge.mjs
```

   If you changed Dire Miralis (or added another hunt monster actor):

```bash
node public/data/foundry-jsons-example/monsters/build-dire-miralis-actor.mjs
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

## Felyne Kitchen (camp cook)

Token interaction for Rank 1 artisan meals. World hooks cannot travel inside an
Actor alone, so this ships as the **Felyne Cook** actor + a **Kitchen Sync** macro,
with token double-click armed from `scripts/felyne-cook.js` on every client.

### Setup (GM)

1. From **Amellwind MH (RaintDM) → Felyne Kitchen → Felyne Cook**, drag the actor onto the scene.
2. Optional: run **Kitchen Sync** once (or rely on the module script at world ready).
3. Players double-click the cook token while within **10 ft** to open the kitchen menu.
4. **Ask for a Meal (Rank 1)** still grants via the Camp Kitchen Aura as a backup.

### Token interactions

| Who | Action | Result |
| --- | --- | --- |
| Player | Double-click Felyne Cook token | Open camp kitchen menu (pick meal → pay → cook checks) |
| GM | Double-click (with a PC token on scene) | Open kitchen menu as that hunter (testing) |
| GM | Double-click (no PC) or Shift+double-click | Open the cook **actor sheet** |
| Anyone (GM) | Alt+double-click | Open the normal **actor sheet** |

Players do **not** need OWNER on the cook. On world ready (GM), the module publishes
a cook marker and sets default ownership to **LIMITED** so double-click works
Item Piles–style. Range is **10 ft** (same as the kitchen aura).

### Rebuild sources

After editing `cooking-features/*.js`:

```bash
node public/data/foundry-jsons-example/cooking-features/build-felyne-cook-actor.mjs
pnpm build:foundry-module
```

## Hidden Detection (BG3-style)

Proximity discovery for loot / secrets on the canvas. World hooks cannot travel
inside an Item alone, so this ships as a **Feature Item** + a **Sync Macro**.

### Setup (GM)

1. Create or pick an Actor for the hidden object (NPC prop, loot pile, etc.).
2. From **Amellwind MH (RaintDM) → Hidden Detection → Hidden Detection**, drag the feature
   onto that Actor (re-import the item if you used an older copy).
3. Place the Actor's token on the scene and **hide** it (Foundry eye / `hidden`).
4. Use **Configure Hidden Detection** (GM). Saving **arms proximity hooks** for the
   session and runs a sync pass — you do not need the Sync macro first.
   On Resource Node actors the embedded feature has no Item Macro (pack size); the
   module still intercepts the Configure activity, and **Configure Resource Node**
   includes a **Hidden Detection** button.
5. Optional: run **Hidden Detection Sync** mid-session if you need to re-arm hooks
   without reloading (hooks also arm automatically from the module script on world
   ready).

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
2. From **Amellwind MH (RaintDM) → Resource Nodes → Resource Node**, drag the feature onto
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
  the Resource Node / Hidden Detection features) and **copy** that item to the PC
  (quantity preserved from the stack, so table entries like `Honey x3` grant 3).
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

## Resource Node Actors (environment gather props)

Prebuilt NPC props — **one actor per Environment × Level Tier × Resource Category**
(e.g. `Ancestral Steppes — Plants (Tier 1-5)`). Each actor embeds:

1. **Resource Node** — category + harvest DC from that environment tier table
2. **Hidden Detection** — Passive Perception mode with a **tier-scaled DC**:
   - levels mid ≤ 5 → DC 12
   - mid ≤ 10 → DC 15
   - mid ≤ 16 → DC 18
   - otherwise → DC 21
3. **Loot inventory** — one stack per table-row entry for that category (preserves
   `1dN` odds). Icons use Foundry core art by category (herbs, mushrooms, ore,
   fish, beetles, bone piles; Honey uses the beehive icon).

### Setup (GM)

1. From **Amellwind MH (RaintDM) → Resource Nodes → Resource Node Actors**, open the
   environment / tier folder and drag the actor onto the scene.
2. Keep the token **hidden** (prototype already sets `hidden: true`).
3. Players who beat Passive Perception see the node; double-click gathers as usual.
4. **Configure Hidden Detection** on these actors (Item Macro is stripped to keep
   packs small): use **Configure Resource Node → Hidden Detection**, or run the
   **Configure Hidden Detection** activity on the feature (module script intercepts
   it). Reset attempts / reveal from that dialog if a PC gets locked out.

Regenerate after editing `environment.data.ts` / `resource.data.ts`:

```bash
node public/data/foundry-jsons-example/resource-node/build-resource-node.mjs
node public/data/foundry-jsons-example/resource-node/build-resource-node-actors.mjs
pnpm build:foundry-module
```

## Items Forge (hunter traps)

Consumable hunter traps from `/item-forge` (`public/data/raintdm-items/traps.json`).
Dual Repeaters **magazines** stay in **Weapon Resources** (they already ship with
Load Magazine automation). Drag traps from
**Amellwind MH (RaintDM) → Items Forge**.

World hooks cannot travel inside an Item pack alone, so canvas trigger / expiry
ship as `scripts/hunter-traps.js` (armed on world ready).

**Items:** Trap Tool (crafting component), Pitfall Trap / Pitfall Trap+, Shock Trap /
Shock Trap+.

**Automated (module script + Midi QOL + Item Macro):**

- **Set Trap** (Action): place a camouflaged 10-ft square within 5 ft (hidden from
  players). Spends 1 from the stack.
- Trigger when a matching-size creature on the ground enters the square
  (Pitfall: Huge or smaller; Shock: Large or larger).
- Saves DC 14 / 16; Pitfall → prone + restrained; Shock → incapacitated + Speed 0.
  Shock+ also deals 2d8 lightning on trigger.
- Accustomed: after a failed save, immune to the **base** version until a Short Rest;
  a + still works, with Advantage on the repeat save at the start of the next turn.
- **Retrieve Trap** (Action): unused trap within 5 ft returns to the stack.
- 1-hour world-time expiry ruins the trap (cannot retrieve).

### Rebuild sources

```bash
node public/data/foundry-jsons-example/items-forge/build-items-forge.mjs
pnpm build:foundry-module
```

## Monsters (hunt bosses)

NPC actors for table bosses. World hooks cannot travel inside an Actor pack
alone, so combat automation ships as `scripts/dire-miralis.js` (armed on world
ready).

### Dire Miralis (CR 11 Boss)

Gargantuan Elder Dragon for the Tainted Sea Cove. Drag from
**Amellwind MH (RaintDM) → Monsters → Monsters**. Token is 4×4 (Gargantuan)
with furnace light and blindsight 120 ft.

**Automated (module script + Midi QOL):**

- Boiling Presence (1d10 fire to creatures within 10 ft at the start of its turn)
- Magma Armor at &lt;70% HP (AC 22 + B/P/S resistance); cracks on cold damage or
  interrupted Calamity Rain; shatters after 6 cracks
- Stance: Biped (15-ft Claw, Crush) / Quadruped (10-ft Claw, Tail Sweep, advantage
  vs prone) via **Shift Stance**
- Magma Glob / Volcanic Vents / Vent Barrage lava templates (2d10 fire on enter
  or start of turn)
- Calamity Rain charge → interrupt at 40+ damage in one turn, or Greater Fireball
  on each marker at the start of its next turn
- Scorching Hide (2d8 fire when hit by a melee attack)
- Lair-action cooldown (cannot repeat the same effect two rounds in a row)

**Use from the sheet:** Multiattack, Claw, Crush, Tail Sweep, Greater Fireball
(Recharge 5–6), Lumbering Advance, legendary actions, optional lair actions.

### Rebuild sources

After editing `monsters/*.js` / the build script:

```bash
node public/data/foundry-jsons-example/monsters/build-dire-miralis-actor.mjs
pnpm build:foundry-module
```

## Notes and limitations

- **Cook aura / token UI:** kitchen aura hooks and double-click interaction load
  automatically from `scripts/felyne-cook.js` on every client. The Kitchen Sync
  macro can still re-arm mid-session. Nearby PCs still receive **Ask for a Meal**
  as a backup while in the 10 ft aura.
- **Hidden Detection sync:** proximity hooks load automatically from the module
  script on every client. The Sync macro / Configure dialog can still re-arm them
  mid-session if needed.
- **Resource Node sync:** token double-click hooks load automatically from the
  module script on every client. The Sync macro / Configure dialog can still re-arm
  them mid-session if needed.
- **Dire Miralis:** Magma Armor, lava templates, Calamity Rain, Boiling Presence,
  and Scorching Hide load from `scripts/dire-miralis.js` on world ready (GM
  mutations run on the active GM). Item Macros call that API; they warn if the
  module script is not armed.
- **Hunter traps:** Set / retrieve Item Macros call `scripts/hunter-traps.js`.
  Canvas trigger, camouflage notices, and 1-hour expiry run on the active GM.
- **Sidecar scripts:** the loose `.js` / `.mjs` / `.fragment.js` files in the source
  folders are development references and are **not** packed. Item-level automation
  already travels embedded in each item's `flags.itemacro`.
- **Assets:** hunter `mh-icons` still used by weapons/runes/ammo are bundled.
  Generic actors and loot use Foundry core `icons/...` paths (no extra files).
  If you add hunter items that reference new mh-icons, drop the `.webp` in
  `public/mh-icons/` before building.
