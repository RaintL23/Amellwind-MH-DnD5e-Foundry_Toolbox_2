# Amellwind Monster Hunter DnD5e Toolbox

**Language / Idioma:** **English** · [Español](./README.es.md)

Web toolkit for **Dungeon Masters** and players of the **Amellwind** homebrew, which combines **Monster Hunter** with **Dungeons & Dragons 5e**. Monsters, runes, weapons, a character builder with **Foundry VTT export/import**, a damage calculator, cooking, shops, and more — in one app, with browser-cached data so you can browse offline between sessions.

It started at my table: I play with friends who care more about D&D than Monster Hunter, and while using Amellwind’s homebrew we kept getting stuck hunting for rules and character options. The system has little centralized material — almost no wikis or handy references — so I built this tool so anyone can explore Amellwind content and prepare characters without jumping between PDFs and loose tabs.

> **Status:** v0.1.23 — the Character Builder is in **ALPHA**.

**Live app:** [https://amellwind-mh-dn-d5e-foundry-toolbox-2.vercel.app/](https://amellwind-mh-dn-d5e-foundry-toolbox-2.vercel.app/)

## Features

### Amellwind Homebrew

| Section              | Route               | Description                                                                   |
| -------------------- | ------------------- | ----------------------------------------------------------------------------- |
| **Builder**          | `/builder`          | Character Builder — stats, equipment, runes, DPR, and **Foundry VTT export/import** _(ALPHA)_ |
| **Damage Calculator**| `/damage-calculator`| Expected damage-per-turn calculator for comparing weapon builds (persisted) |
| **Creation Guide**   | `/character-guide`  | Character creation guide from the manual (species, roles, skills, etc.)      |
| **Monstie Sidekick** | `/monstie-sidekick` | Rules and creator for Monstie sidekicks                                         |
| **NPC Generator**    | `/npc-generator`    | Humanoid NPC stat block generator                                 |
| **Species**          | `/species`          | Species and subraces from the Hunting Guide                                        |
| **Backgrounds**      | `/backgrounds`      | Hunter backgrounds from the manual                                              |
| **Feats**            | `/feats`            | Feats from the manual                                                      |
| **Monsters**         | `/monsters`         | MH bestiary with stat blocks, detail, and a dedicated page per monster          |
| **Runes**            | `/runes`            | Monster materials and build planner (side drawer)              |
| **Material Effects** | `/material-effects` | Monster material effects (armor/weapon) in a browsable list      |
| **Conditions**       | `/conditions`       | Amellwind homebrew conditions                                            |
| **Diseases**         | `/diseases`         | Amellwind homebrew diseases                                           |
| **Weapons**          | `/weapons`          | Hunter Weapons and optional features                         |
| **Items**            | `/items`            | Item catalog from the Hunting Guide                                          |
| **Shops**            | `/shops`            | Shops with a shopping cart                                                 |
| **Cooking**          | `/cooking`          | Artisan cooking system                                                    |
| **Combo List**       | `/combo`            | Item crafting and combinations                                            |
| **Environments**     | `/environments`     | Biomes and encounter/resource tables                                         |
| **Resources**        | `/resources`        | Environment resources (plants, minerals, etc.)                                |
| **Downtime**         | `/downtime`         | Downtime activities from the manual                                        |

### Amellwind (RaintDM)

RaintDM variants on Amellwind’s 2014 Monster Hunter homebrew — house-rule tweaks for my tables and campaigns:

| Section         | Route           | Description                                                                 |
| --------------- | --------------- | --------------------------------------------------------------------------- |
| **Weapon Forge** | `/weapon-forge` | Curated RaintDM hunter weapons plus custom weapons you create and export |
| **Items Forge**  | `/item-forge`   | Curated RaintDM items and Combo List recipes (Dual Repeaters magazines and more to come) |

### D&D 5e Compendium

Official reference data loaded from [5etools](https://5e.tools) (not Amellwind homebrew):

| Section         | Route                         | Description                                              |
| --------------- | ---------------------------- | -------------------------------------------------------- |
| **Spells**      | `/spells`                    | Spells with filters by class, level, and source           |
| **Classes**     | `/classes`, `/classes/:id`   | Base classes with a detail page per variant           |
| **Items**       | `/dnd-items`                 | Magic items and equipment from the PHB/DMG and other sources       |
| **Bestiary**    | `/bestiary`, `/bestiary/:id` | Creatures from the MM and other sources, loaded on demand |
| **Races**       | `/dnd-races`                 | Official 5e species, lineages, and subraces                |
| **Backgrounds** | `/dnd-backgrounds`           | Official 5e backgrounds (2014 / 2024)                    |
| **Feats**       | `/dnd-feats`                 | Official 5e feats                                       |
| **Xanathar Backstory** | `/xanathar-backstory` | Random backstory generator using Xanathar’s tables (XGE) |
| **Shop Generator** | `/shop-generator` | Procedural D&D 5e shops (theme, tier, editable CSV prices) |

### Foundry VTT integration

The **Character Builder** can **export** the character as a **Foundry VTT (dnd5e v12)** `character` actor ready to import, and **import** a Foundry actor JSON back to rebuild the character inside the app. Export produces a single JSON file with class/subclass, species, background, feats, spells, weapons/armor/trinkets, advancements, and portrait/token; import _matches_ each entity against the app catalogs (classes, species, backgrounds, feats, spells, and equipment). Both flows live in `src/features/builder/foundry-export/` and `foundry-import/`, with buttons on the builder’s `StatsPanel`.

Export also **enriches items with Midi-QoL / DAE automation** (Active Effects with `midi-qol`/`dae` flags), mirroring what the **Plutonium** importer would add: the actor behaves as if it went through *Plutonium Addon: Automation*, as long as the destination world has **Midi QoL + DAE + Times Up** enabled. Automation overlays (`foundry-export/automation.data.ts`) are ported as reference data from [TheGiddyLimit](https://github.com/TheGiddyLimit) repos — see [Data sources](#data-sources).

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

# Dev server
pnpm dev

# Production build
pnpm build

# Preview the build
pnpm preview

# Lint
pnpm lint

# Rebuild magic-item pricing lookup from scripts/data/magic-item-pricing.csv
pnpm pricing:build

# Build with bundle analysis
pnpm build:analyze
```

`pnpm build` and `pnpm dev` also run `pricing:build` automatically. To update prices: replace `scripts/data/magic-item-pricing.csv` (CSV export from the [Magic Item Pricing](https://dumpstatadventures.com/the-gm-is-always-right/pricing-magic-items-2024-dungeon-masters-guide) Dump Stat Adventures sheet — DMG 2024 tabs + XGTE/TCoE rows) and run `pnpm pricing:build` (or any build/dev). The app attributes those prices to VaranSL / Dump Stat Adventures; they are not original calculations from this project.

The app stores all data in **IndexedDB**, its runtime **source of truth**. GitHub is only an *update feed* (offline-first): on startup, cached data is shown immediately and, if older than 24h, refreshed in the background; only the first launch (no data yet) waits for the download. If the network fails, the app keeps working with what is already in IndexedDB.

### 5etools compendium: production vs offline development

| Environment                      | Configuration                             | Data source                                                                                          |
| ---------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| **Vercel / production**      | No env vars                  | [5etools-src](https://github.com/5etools-mirror-3/5etools-src) mirror via `raw.githubusercontent.com` |
| **Development (default)** | Same as production                      | Remote                                                                                                   |
| **Offline development**       | `VITE_5ETOOLS_DATA=local` in `.env.local` | JSON under `public/5etools/`                                                                                |

In production you **do not need** to commit `races.json`, `backgrounds.json`, `feats.json`, or the rest of the mirror: spells, classes, races, backgrounds, feats, items, and bestiary resolve at runtime from GitHub. The JSON files under `public/5etools/` that are in the repo are only a subset for testing items/bestiary offline.

**Do not set `VITE_5ETOOLS_DATA=local` on Vercel** — spells and classes need hundreds of files that are not in the repo.

For offline development, copy JSON from `backup-jsons/5etools/` to `public/5etools/` and create `.env.local` from [`.env.example`](./.env.example). See comments in `src/shared/constants/api.constants.ts` for exact paths.

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

- [Amellwind; Monster Hunter Monster Manual](https://raw.githubusercontent.com/TheGiddyLimit/homebrew/master/collection/Amellwind;%20Monster%20Hunter%20Monster%20Manual.json)
- [Amellwind; Amellwind's Guide to Monster Hunting](https://raw.githubusercontent.com/TheGiddyLimit/homebrew/master/collection/Amellwind;%20Amellwind's%20Guide%20to%20Monster%20Hunting.json)

The Hunting Guide JSON also provides species, backgrounds, feats, MH classes, class features (Monstie Sidekick), weapon optional features, and variant rules (downtime).

### Embedded static data

Resources, environments, shops, combo, cooking, the character creation guide, and NPC generator templates live in `*.data.ts` files inside the project. RaintDM Weapon Forge and Items Forge catalogs live in `public/data/raintdm-weapons/` and `public/data/raintdm-items/`.

### D&D 5e compendium

Spells, classes, items, bestiary, races, backgrounds, and feats load from the [5etools-src](https://github.com/5etools-mirror-3/5etools-src) mirror (`raw.githubusercontent.com`), with preloading of common sources (MM, PHB, DMG, etc.) and on-demand loading of the rest via the Filter dialog (Sources grouped by year; official-only by default).

Playtest / Unearthed Arcana material comes from the [TheGiddyLimit/unearthed-arcana](https://github.com/TheGiddyLimit/unearthed-arcana) feed (`VITE_UA_MIRROR` / `VITE_UA_REF`) when the user selects those sources. Residuals similar to D&D Beyond in that feed (e.g. Wayfinder's Guide to Eberron / `WGE`) are treated the same; D&D Beyond is not scraped.

### Foundry automation (Midi-QoL / Plutonium)

The automation export injects into items (Active Effects with `midi-qol`/`dae` flags, in `src/features/builder/foundry-export/automation.data.ts` and `automation.builders.ts`) uses the following repositories as **reference information**, so that section of the code behaves like the Plutonium importer:

- [TheGiddyLimit/plutonium-addon-automation](https://github.com/TheGiddyLimit/plutonium-addon-automation) — automation overlay format and effect data per entity (feats, features, magic items, spells). _MIT License, © TheGiddyLimit._
- [TheGiddyLimit/homebrew](https://github.com/TheGiddyLimit/homebrew) — reference 5etools homebrew format for name/source matching.
- [tposney/midi-qol](https://github.com/tposney/midi-qol) and [DAE](https://foundryvtt.com/packages/dae) — flag keys (`flags.midi-qol.*`, `flags.dae.*`) and special duration semantics consumed by the generated Active Effects.

The code **does not include** the module or its full dataset: it only reproduces the mechanical effects format for a curated set of entities, expandable by name. Requires Midi QoL + DAE + Times Up active in the destination world.

## Project structure

```text
src/
├── App.tsx                 # Lazy router, startup sync, global providers
├── components/
│   ├── layout/             # MainLayout, Sidebar, LoadingScreen, NotFound, ThemeSelector
│   ├── data-table/         # Reusable table (TanStack Table)
│   └── ui/                 # shadcn: button, dialog, input, badge, …
├── features/
│   ├── builder/            # Character Builder (ALPHA) + Foundry VTT export/import
│   ├── damage-calculator/  # Damage-per-turn calculator (persisted in localStorage)
│   ├── monsters/           # MH monster list + detail
│   ├── runes/              # Materials + planner (BuildDrawer)
│   ├── material-effects/   # Material effects (armor/weapon)
│   ├── conditions/         # Amellwind conditions
│   ├── diseases/           # Amellwind diseases
│   ├── weapons/            # Hunter Weapons
│   ├── shops/              # Items, shops, cart
│   ├── item-forge/         # RaintDM items catalog (curated JSON)
│   ├── species/            # GTMH species
│   ├── backgrounds/        # GTMH backgrounds
│   ├── feats/              # GTMH feats
│   ├── character-guide/    # Creation guide (static)
│   ├── monstie-sidekick/   # Monstie sidekicks
│   ├── npc-generator/      # NPC generator
│   ├── downtime/           # Downtime activities
│   ├── cooking/            # Artisan cooking
│   ├── combo/              # Combo List
│   ├── resources/          # Field resources
│   ├── environments/       # Biomes
│   ├── spells/             # 5e spell compendium
│   ├── classes/            # 5e class compendium
│   ├── dnd-items/          # 5e item compendium (+ builder equipment catalog)
│   ├── dnd-races/          # Official 5e species
│   ├── dnd-backgrounds/    # Official 5e backgrounds
│   ├── dnd-feats/          # Official 5e feats
│   ├── dnd-optionalfeatures/ # 5e optional features (no route; used by the builder)
│   ├── xanathar-backstory/ # Backstory generator (XGE)
│   ├── shop-generator/     # D&D 5e shop generator
│   └── bestiary/           # 5e bestiary
└── shared/
    ├── constants/          # API URLs, IndexedDB, D&D constants (abilities, skills)
    ├── context/            # ThemeContext, SyncContext
    ├── db/                 # IndexedDB and sync
    ├── types/              # Shared types
    ├── services/           # create-entity-service (service factory)
    ├── components/         # ItemRefText, DndKeywordText, StatBlockSection
    ├── utils/              # 5etools parser, CR, dedupe-by-name, fluff, etc.
    └── data/               # fetch helper for 5etools JSON
```

Each feature follows a similar pattern: `components/`, `services/`, `hooks/`, `mappers/`, and when applicable `data/` or `context/`.

## Developer documentation

[`instrucctions.md`](./instrucctions.md) holds the detailed technical docs: data architecture, domain entities, 5etools → Foundry mappings, business rules, and code conventions.

## Legal notice

This project is a fan-made tool to make **Amellwind**’s homebrew (_Monster Hunter D&D 5e_) easier to use. All content, rules, and design of that homebrew are Amellwind’s work; this repository **does not create or modify** that material — it only organizes and presents information that is already **published on the internet** (for example on [5etools](https://5e.tools) and related sources).

The official source and the author’s full work are on Patreon: [patreon.com/cw/amellwind](https://www.patreon.com/cw/amellwind).

**Monster Hunter** is owned by Capcom and **Dungeons & Dragons** is owned by Wizards of the Coast. This project is not affiliated with or endorsed by Capcom, Wizards of the Coast, Amellwind, or any other brand or author mentioned.

Rights to homebrew content belong to their respective authors. See the original licenses on [5etools](https://5e.tools) and the source repositories.
