# Amellwind Monster Hunter DnD5e Toolbox

**Language / Idioma:** **English** · [Español](./README.es.md)

Web toolkit for **Dungeon Masters** and players of the **Amellwind** homebrew, which combines **Monster Hunter** with **Dungeons & Dragons 5e**. Monsters, runes, weapons, a character builder with **Foundry VTT export/import**, a damage calculator, cooking, shops, and more — in one app, with browser-cached data so you can browse offline between sessions.

It started at my table: I play with friends who care more about D&D than Monster Hunter, and while using Amellwind’s homebrew we kept getting stuck hunting for rules and character options. The system has little centralized material — almost no wikis or handy references — so I built this tool so anyone can explore Amellwind content and prepare characters without jumping between PDFs and loose tabs.

> **Status:** v0.1.23 — the Character Builder is in **ALPHA**.

**Live app:** [https://amellwind-mh-dn-d5e-foundry-toolbox-2.vercel.app/](https://amellwind-mh-dn-d5e-foundry-toolbox-2.vercel.app/)

## Features

The sidebar has three sections (same order as `src/shared/constants/nav-sections.ts`): **RaintDM**, **Amellwind Homebrew**, and the **D&D 5e Compendium**.

### RaintDM

Play and table tools, plus RaintDM variants on Amellwind’s 2014 Monster Hunter homebrew — house-rule tweaks for my tables and campaigns:

| Group | Section | Route | Description |
| --- | --- | --- | --- |
| GM Tools | **Combat Tracker** | `/combat-tracker` | GM initiative order, HP (including multi-target damage), and death saves |
| GM Tools | **Damage & Healing Calculator** | `/damage-calculator` | Expected damage or healing per turn for comparing builds (persisted) |
| Character Tools | **Builder** _(ALPHA)_ | `/builder` | Character Builder — stats, equipment, runes, DPR, **Foundry VTT export/import** and character-sheet PDF export. Aggregates Amellwind, 5e, and RaintDM catalogs. |
| Character Tools | **Character Sheet** _(ALPHA)_ | `/sheet`, `/sheet/:characterId` | In-session play sheet: HP, actions, spells, rests, inventory, conditions. Imports Builder JSON; optimized for phone and desktop |
| Forge | **Items Forge** | `/item-forge` | Curated RaintDM items and Combo List recipes (Dual Repeaters magazines, hunter traps) |
| Forge | **Weapon Forge** | `/weapon-forge` | Curated RaintDM hunter weapons plus custom weapons you create, edit, and export |
| Forge | **Artificer Forge** | `/artificer-forge` | 2024 Artificer adapted to Amellwind: Replicate Material Effect, plan list by level, and Magic Item Tinker |

### Amellwind Homebrew

| Group | Section | Route | Description |
| --- | --- | --- | --- |
| Character | **Creation Guide** | `/character-guide` | Character creation guide from the manual (species, roles, skills, etc.) |
| Character | **Lore** | `/lore` | Myths, history, gods, and peoples of the Old World (Chapter 1) |
| Character | **Species** | `/species` | Species and subraces from the Hunting Guide |
| Character | **Backgrounds** | `/backgrounds` | Hunter backgrounds from the manual |
| Character | **Factions** | `/factions` | Guilds and organizations — membership, renown, and faction spells |
| Character | **Feats** | `/feats` | Feats from the manual |
| Bestiary and Rules | **Monsters** | `/monsters`, `/monsters/:monsterId` | MH bestiary with stat blocks, detail, and a dedicated page per monster |
| Bestiary and Rules | **Conditions & Diseases** | `/conditions` | Blight conditions, afflictions, and infectious diseases (`/diseases` redirects here) |
| Weapons, Runes, and Equipment | **Weapons** | `/weapons` | Hunter Weapons and optional features |
| Weapons, Runes, and Equipment | **Runes** | `/runes` | Monster materials and Rune Planner build drawer |
| Weapons, Runes, and Equipment | **Material Effects** | `/material-effects` | Monster material effects (armor/weapon) in a browsable list |
| Weapons, Runes, and Equipment | **Items** | `/items` | Item catalog from the Hunting Guide |
| Weapons, Runes, and Equipment | **Siege Weapons** | `/siege-weapons` | Dragonator, Dragonrazer, and other siege engines |
| World and Exploration | **Hunt Planner** | `/hunt` | Plan and simulate a monster hunt with tracking rolls and resource tables |
| World and Exploration | **Environments** | `/environments` | Biomes and encounter/resource tables |
| World and Exploration | **Resources** | `/resources` | Environment resources (plants, minerals, etc.) |
| World and Exploration | **Shops** | `/shops` | Shops with a shopping cart |
| World and Exploration | **Cooking** | `/cooking` | Artisan cooking system |
| World and Exploration | **Combo List** | `/combo` | Item crafting and combinations |
| World and Exploration | **Downtime** | `/downtime` | Downtime activities from the manual |
| NPCs and Companions | **Monstie Sidekick** | `/monstie-sidekick` | Rules and creator for Monstie sidekicks |
| NPCs and Companions | **Guardian Template** | `/guardian-template` | Rules to apply the MHMM Guardian monster template |
| NPCs and Companions | **NPC Generator** | `/npc-generator` | Humanoid NPC stat block generator |

### D&D 5e Compendium

Official reference data loaded from [5etools](https://5e.tools) (not Amellwind homebrew):

| Group | Section | Route | Description |
| --- | --- | --- | --- |
| Character Options | **Classes** | `/classes`, `/classes/:classId` | Base classes with a detail page per variant |
| Character Options | **Races** | `/dnd-races` | Official 5e species, lineages, and subraces |
| Character Options | **Backgrounds** | `/dnd-backgrounds` | Official 5e backgrounds (2014 / 2024) |
| Character Options | **Feats** | `/dnd-feats` | Official 5e feats |
| Character Options | **Multiclassing** | `/multiclass` | Multiclass rules, class prerequisites, and spell slot calculator |
| Spells and Conditions | **Spells** | `/spells` | Spells with filters by class, level, and source |
| Spells and Conditions | **Conditions & Diseases** | `/dnd-conditions` | Classic D&D conditions, statuses, and diseases (PHB / DMG / 2024) |
| Bestiary | **Bestiary** | `/bestiary`, `/bestiary/:creatureId` | Creatures from the MM and other sources, loaded on demand |
| Equipment | **Items** | `/dnd-items` | Magic items and equipment from the PHB/DMG and other sources |
| Character Tools | **Creation Guide** | `/dnd-character-guide` | Character creation walkthrough comparing PHB 2014 and PHB 2024 |
| Character Tools | **Encounter Calculator** | `/encounter-calculator` | DMG encounter difficulty: party XP budgets vs creature CR and count |
| Character Tools | **Xanathar Backstory** | `/xanathar-backstory` | Random backstory generator using Xanathar’s tables (XGE) |
| Character Tools | **Shop Generator** | `/shop-generator` | Procedural D&D 5e shops (theme, tier, editable CSV prices) |

### Foundry VTT integration

Target: Foundry core **12.331** with the **dnd5e 4.4.4** system (`src/shared/foundry/target.ts`).

The **Character Builder** can **export** the character as a Foundry `character` actor ready to import, and **import** a Foundry actor JSON back to rebuild the character inside the app. Export produces a single JSON file with class/subclass, species, background, feats, spells, weapons/armor/trinkets, advancements, and portrait/token; import _matches_ each entity against the app catalogs (classes, species, backgrounds, feats, spells, and equipment). Both flows live in `src/features/raintdm/builder/foundry-export/` and `foundry-import/`, with buttons on the builder’s `StatsPanel`. Shared Foundry helpers (ids, effects, descriptions, module requirements) live in `src/shared/foundry/`.

Export also **enriches items with Midi-QoL / DAE automation** (Active Effects with `midi-qol`/`dae` flags), mirroring what the **Plutonium** importer would add: the actor behaves as if it went through *Plutonium Addon: Automation*, as long as the destination world has the required modules enabled (**Midi QoL + Item Macro + DAE + Times Up**; the app shows a requirements notice). Automation overlays (`src/shared/foundry/weapons/automation.data.ts` and `feature-automation.data.ts`) are ported as reference data from [TheGiddyLimit](https://github.com/TheGiddyLimit) repos — see [Data sources](#data-sources).

**Content module.** `pnpm build` also generates the Foundry module `Amellwind-MH-RaintDM-module` (`build:foundry-module`, sources in `public/data/foundry-module/`): the Monster Hunter homebrew content (weapons, runes, combo crafting, Items Forge, conditions & diseases, cooking, …) bundled into installable compendium packs. It additionally requires socketlib. See [`public/data/foundry-module/README.md`](./public/data/foundry-module/README.md) for requirements and layout.

## Tech stack

| Layer           | Technology                        |
| -------------- | --------------------------------- |
| Framework      | React 18 + TypeScript             |
| Build          | Vite                              |
| Styles        | Tailwind CSS                      |
| UI components | shadcn/ui (Radix UI)              |
| Tables         | TanStack Table                    |
| Routing        | React Router v6 (lazy + Suspense) |
| Storage | IndexedDB (`idb`)                 |
| Other          | `pdf-lib` (sheet PDF export), `cmdk`, `embla-carousel-react`, `sonner` |
| Tests          | Vitest                            |
| Packages       | pnpm                              |

The app is an **SPA** with no backend of its own. Amellwind data is synced and cached in the browser; the D&D 5e compendium is fetched on demand from the 5etools mirror.

## Requirements

- [Node.js](https://nodejs.org/) **22.x** (see `.nvmrc`)
- [pnpm](https://pnpm.io/installation)

## Install and usage

```bash
# Clone the repository
git clone https://github.com/RaintL23/Amellwind-MH-DnD5e-Foundry_Toolbox_2.git
cd Amellwind-MH-DnD5e-Foundry_Toolbox_2

# Install dependencies
pnpm install

# Dev server (first regenerates the RaintDM weapon/item manifest)
pnpm dev

# Production build
pnpm build

# Preview the build
pnpm preview

# Lint (zero warnings allowed)
pnpm lint

# Unit tests (Builder completeness + utilities)
pnpm test

# Rebuild magic-item pricing lookup from scripts/data/magic-item-pricing.csv
pnpm pricing:build

# Build with bundle analysis
pnpm build:analyze
```

`pnpm build` first regenerates the RaintDM manifest, then runs `build:gtmh-supplement` and `build:foundry-module` (which validates MH tokens), then `tsc -b` and the Vite production compile. Magic-item pricing stays separate: replace `scripts/data/magic-item-pricing.csv` (CSV export from the [Magic Item Pricing](https://dumpstatadventures.com/the-gm-is-always-right/pricing-magic-items-2024-dungeon-masters-guide) Dump Stat Adventures sheet — DMG 2024 tabs + XGTE/TCoE rows) and run `pnpm pricing:build`. The app attributes those prices to VaranSL / Dump Stat Adventures; they are not original calculations from this project.

The app stores all data in **IndexedDB**, its runtime **source of truth**. GitHub is only an *update feed* (offline-first): on startup, cached data is shown immediately and, if older than 24h, refreshed in the background; only the first launch (no data yet) waits for the download. If the network fails, the app keeps working with what is already in IndexedDB.

### 5etools compendium: production vs offline development

| Environment                      | Configuration                             | Data source                                                                                          |
| ---------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| **Vercel / production**      | No env vars                  | [5etools-src](https://github.com/5etools-mirror-3/5etools-src) mirror via `raw.githubusercontent.com` |
| **Development (default)** | Same as production                      | Remote                                                                                                   |
| **Offline development**       | `VITE_5ETOOLS_DATA=local` in `.env.local` | JSON under `public/5etools/`                                                                                |

In production you **do not need** to commit `races.json`, `backgrounds.json`, `feats.json`, or the rest of the mirror: spells, classes, races, backgrounds, feats, items, and bestiary resolve at runtime from GitHub. The JSON files under `public/5etools/` that are in the repo are only a subset for testing items/bestiary offline.

**Do not set `VITE_5ETOOLS_DATA=local` on Vercel** — spells and classes need hundreds of files that are not in the repo.

For offline development, copy JSON from `backup-jsons/5etools/` (local-only, gitignored) to `public/5etools/` and create `.env.local` from [`.env.example`](./.env.example). See comments in `src/shared/constants/api.constants.ts` for exact paths.

### Deploy on Vercel

- **Production:** [https://amellwind-mh-dn-d5e-foundry-toolbox-2.vercel.app/](https://amellwind-mh-dn-d5e-foundry-toolbox-2.vercel.app/)
- **Build:** `pnpm build` (defined in `vercel.json`)
- **Output:** `dist`
- **Environment variables:** none required
- **Node:** 22.x (`.nvmrc` / `package.json`)
- **Security headers:** `vercel.json` sets CSP (allows `connect-src` to `raw.githubusercontent.com`), `X-Frame-Options`, `nosniff`, and related policies. If you override mirrors away from GitHub raw, update the CSP `connect-src` allowlist.

## Data sources

> **Data model:** the app stores everything in **IndexedDB**, its runtime source of truth. The GitHub repos below are only *update feeds*: they are polled to refresh internal stores (offline-first, 24h TTL) and are not a hard dependency on every load. Mirror/homebrew/UA slugs and their branches are configurable via env (`VITE_5ETOOLS_MIRROR`, `VITE_5ETOOLS_REF`, `VITE_HOMEBREW_MIRROR`, `VITE_HOMEBREW_REF`, `VITE_UA_MIRROR`, `VITE_UA_REF`), useful if a 5etools mirror rotates (e.g. `-3` → `-4`) or you want a fork.

### Amellwind homebrew

Primary information comes from Amellwind’s homebrew resources in the [TheGiddyLimit/homebrew](https://github.com/TheGiddyLimit/homebrew) repository:

- [Amellwind; Monster Hunter Monster Manual](https://raw.githubusercontent.com/TheGiddyLimit/homebrew/master/collection/Amellwind;%20Monster%20Hunter%20Monster%20Manual.json) (public GitHub feed; fallback for names the PDF does not cover)
- [MHMM with Loot Tables 2.0](https://www.patreon.com/amellwind/posts/monster-hunter-137502033) — Amellwind’s free Patreon PDF (stat blocks, loot tables, and runes shown in the app)
- [Amellwind; Amellwind's Guide to Monster Hunting](https://raw.githubusercontent.com/TheGiddyLimit/homebrew/master/collection/Amellwind;%20Amellwind's%20Guide%20to%20Monster%20Hunting.json)
- [GTMH GMBinder source](https://www.gmbinder.com/share/-LCk9FgQaqaXBVmLeCeT#newfeats) — staged locally as `public/data/gtmh-patreon/supplement.json` and merged at runtime (local-wins by name; GitHub fills uncovered names)

The Hunting Guide JSON also provides species, backgrounds, feats, MH classes, class features (Monstie Sidekick), weapon optional features, and variant rules (downtime).

Monster Manual sheets, runes, conditions, and diseases are loaded from the Patreon PDF overlay in `public/data/mhmm-patreon-2.0/supplement.json`. At runtime the PDF wins on normalized name; the GitHub JSON only fills names the PDF does not have. The merged lists are written to IndexedDB (`mm_current.data`, `condition`, `disease`).

**Rebuild MHMM data** after editing organized monster sheets in `public/data/mhmm-patreon-2.0/monsters/`:

```bash
pnpm build:mm-data
```

This runs two steps in order:

1. `build:mm-catalog` — `.md` → `catalog.json` + `runes.json`
2. `build:mm-supplement` — `catalog.json` → `supplement.json` (runtime overlay)

**Single sheet** (faster when you only changed one file):

```bash
node scripts/build-mm-patreon-catalog.mjs --file monsters/flying-wyverns/bazelgeuse.md
pnpm build:mm-supplement
```

**Workflow:** edit a sheet → run `pnpm build:mm-data` → reload the app in dev (force an IndexedDB re-sync if cached data does not refresh).

Overlay-only rebuild (after hand-editing `catalog.json`): `pnpm build:mm-supplement`. See [`public/data/mhmm-patreon-2.0/SCHEMA.md`](public/data/mhmm-patreon-2.0/SCHEMA.md) for the full archive schema.

**Rebuild GTMH Patreon overlay** after editing staged GTMH chapter files (also runs as part of `pnpm build`):

```bash
pnpm build:gtmh-data
```

Current extraction covers new feats and GTMH hunt-role/downtime variant rules from the local chapter markdown; the merge pipeline is wired for all GTMH keys and keeps GitHub fallback data where local arrays are empty.

### Embedded static data

Resources, environments, shops, combo, cooking, the character creation guide, and NPC generator templates live in `*.data.ts` files inside the project. RaintDM Weapon Forge and Items Forge catalogs live in `public/data/raintdm-weapons/` and `public/data/raintdm-items/`.

### D&D 5e compendium

Spells, classes, items, bestiary, races, backgrounds, and feats load from the [5etools-src](https://github.com/5etools-mirror-3/5etools-src) mirror (`raw.githubusercontent.com`), with preloading of common sources (MM, PHB, DMG, etc.) and on-demand loading of the rest via the Filter dialog (Sources grouped by year; official-only by default).

Playtest / Unearthed Arcana material comes from the [TheGiddyLimit/unearthed-arcana](https://github.com/TheGiddyLimit/unearthed-arcana) feed (`VITE_UA_MIRROR` / `VITE_UA_REF`) when the user selects those sources. Residuals similar to D&D Beyond in that feed (e.g. Wayfinder's Guide to Eberron / `WGE`) are treated the same; D&D Beyond is not scraped.

### Foundry automation (Midi-QoL / Plutonium)

The automation export injects into items (Active Effects with `midi-qol`/`dae` flags, in `src/shared/foundry/weapons/automation.data.ts`, `feature-automation.data.ts` and `automation.builders.ts`) uses the following repositories as **reference information**, so that section of the code behaves like the Plutonium importer:

- [TheGiddyLimit/plutonium-addon-automation](https://github.com/TheGiddyLimit/plutonium-addon-automation) — automation overlay format and effect data per entity (feats, features, magic items, spells). _MIT License, © TheGiddyLimit._
- [TheGiddyLimit/homebrew](https://github.com/TheGiddyLimit/homebrew) — reference 5etools homebrew format for name/source matching.
- [tposney/midi-qol](https://github.com/tposney/midi-qol) and [DAE](https://foundryvtt.com/packages/dae) — flag keys (`flags.midi-qol.*`, `flags.dae.*`) and special duration semantics consumed by the generated Active Effects.

The code **does not include** the module or its full dataset: it only reproduces the mechanical effects format for a curated set of entities, expandable by name. Requires Midi QoL + Item Macro + DAE + Times Up active in the destination world.

## Project structure

```text
src/
├── App.tsx                 # Lazy router, startup sync, global providers
├── components/
│   ├── layout/             # MainLayout, Sidebar, LoadingScreen, NotFound, ThemeSelector
│   ├── data-table/         # Reusable table (TanStack Table)
│   └── ui/                 # shadcn: button, dialog, input, badge, …
├── features/
│   ├── home/               # Landing (mirrors the three Sidebar sections)
│   ├── amellwind/          # Amellwind Homebrew (monsters, runes, hunt, lore, factions, …)
│   ├── raintdm/            # RaintDM: builder, character-sheet, combat-tracker, weapon/item forge
│   └── dnd/                # D&D 5e Compendium (spells, classes, multiclass, encounter calc, …)
└── shared/
    ├── constants/          # API URLs, IndexedDB, D&D constants (abilities, skills)
    ├── context/            # ThemeContext, SyncContext
    ├── db/                 # IndexedDB and sync
    ├── foundry/            # Foundry VTT helpers: ids, effects, Midi/automation, module requirements
    ├── theme/ hooks/ mappers/
    ├── types/              # Shared types
    ├── services/           # create-entity-service (service factory)
    ├── components/         # ItemRefText, DndKeywordText, StatBlockSection
    ├── utils/              # 5etools parser, CR, dedupe-by-name, fluff, etc.
    └── data/               # fetch helper for 5etools JSON
```

Each feature follows a similar pattern: `components/`, `services/`, `hooks/`, `mappers/`, and when applicable `data/` or `context/`.

## Developer documentation

[`docs/domain/`](./docs/domain/index.md) holds the detailed technical docs (split by topic for smaller reads): data architecture, domain entities, 5etools → Foundry mappings, business rules, and code conventions. [`instrucctions.md`](./instrucctions.md) is a short pointer to that folder.

## License

The **source code** of this project is released under the [MIT License](./LICENSE). Anyone may use it, clone it, modify it, and publish their own version, with no need to ask. The goal is for the app to be open to everyone.

The MIT license covers only the code and original work in this repository. It does **not** cover the third-party content the app bundles or loads (Amellwind’s homebrew, 5etools / Wizards of the Coast material, Monster Hunter imagery, and more), which keeps its own rights and terms. See [`THIRD_PARTY.md`](./THIRD_PARTY.md) for the full list and attributions.

## Legal notice

This project is a fan-made, non-commercial tool to make **Amellwind**’s homebrew (_Monster Hunter D&D 5e_) easier to use. All content, rules, and design of that homebrew are Amellwind’s work. The app presents it in an organized form: part is read from public feeds (such as the homebrew collection on [5etools](https://5e.tools)), and part is transcribed and restructured from Amellwind’s free Patreon PDFs so it can be searched and cross-referenced. That content is included to make the tool usable, not claimed as original work, and its rights remain with its author.

The official source and the author’s full work are on Patreon: [patreon.com/cw/amellwind](https://www.patreon.com/cw/amellwind).

**Monster Hunter** is owned by Capcom and **Dungeons & Dragons** is owned by Wizards of the Coast. This project is not affiliated with or endorsed by Capcom, Wizards of the Coast, Amellwind, or any other brand or author mentioned.

If you are a rights holder and want content credited differently, changed, or removed, please open an issue on the repository.
