# AGENTS.md

Operational guide for AI agents working on **Amellwind MH DnD5e Toolbox**. Read this before changing code. It complements human docs; it does not replace them.

## Documentation map (what to read, when)

| Document | When to open it |
| --- | --- |
| `README.md` | Product vision, routes/features, Vercel deploy, data sources. |
| [`docs/domain/index.md`](./docs/domain/index.md) | **Technical source of truth** (split files). Open **one** matching file — never the whole folder. |
| This `AGENTS.md` | Commands, work conventions, complex-zone map, low-token prompt habit. |
| `graphify-out/` | Code AST graph for structural orientation. Complements domain docs; not a rules source. |

> Before non-trivial work: open `docs/domain/index.md`, then **one** file (or `grep` a heading inside it). Legacy `instrucctions.md` is only a pointer.

## Low-token workflow (do this first)

```text
1. graphify query "…" --budget 1500   (or path / explain)
2. Open ONE docs/domain/<file>.md from the index
3. Read/Grep only the source files you will edit (prefer ±100 lines)
4. Surgical change → pnpm lint / build (/ test if Builder)
```

**Never** read whole actor JSON dumps (`fvtt-Actor-*.json`), `GRAPH_REPORT.md` (unless broad architecture review), or every file under `docs/domain/`.

### Prompt template (humans → agents)

```text
Zone: <feature path under src/features/… or public/data/…>
Files: <exact paths>
Goal: <one concrete outcome>
Do not read: actor JSON dumps, GRAPH_REPORT, whole docs/domain/
Docs: docs/domain/<one-file>.md
```

## Graphify (structural map)

Local knowledge graph from [Graphify](https://github.com/Graphify-Labs/graphify). Indexes `src/` (see `.graphifyignore`). Not an app dependency.

```bash
# Rebuild (AST only, no API key)
graphify extract . --code-only
# Optional HTML viz
graphify cluster-only . --no-label

# Prefer budgeted queries
graphify query "what connects foundry export to character builder?" --budget 1500
graphify path "parse-foundry-actor" "createEntityService"
graphify explain "CharacterBuilderContext"
```

- Skills: `.agents/skills/graphify/`, `.agents/skills/builder-validation/`, `.agents/skills/foundry-monsters/`
- Cursor rule: `.cursor/rules/graphify.mdc` (`.cursor/` is gitignored)
- `graphify-out/` is gitignored (regenerable; no API key with `--code-only`)
- Domain Amellwind / 5etools / Foundry schema → `docs/domain/`

## Stack and data in one line

SPA **React 18 + TypeScript + Vite + Tailwind + shadcn/ui (Radix)**, routing with **React Router v6 lazy**, packages with **pnpm**, Node **22.x**. No backend: Amellwind data cached in **IndexedDB** (`idb`); D&D 5e compendium loaded on demand from the 5etools mirror.

## Commands

Always use **pnpm** (not npm/yarn). From `package.json`:

```bash
pnpm install          # dependencies
pnpm dev              # Vite dev server
pnpm build            # tsc -b && vite build  → typecheck + compile
pnpm lint             # eslint --max-warnings 0
pnpm test             # Vitest (Builder completeness + unit tests)
pnpm preview          # preview production build
pnpm build:analyze    # bundle visualizer
```

- Before finishing code changes, run `pnpm lint` and `pnpm build`.
- Character Builder changes (identity, feats, spells, randomizer, export gates): also `pnpm test` and `.agents/skills/builder-validation/`.
- Foundry hunt-boss / module scripts: `.agents/skills/foundry-monsters/`.
- TypeScript is `strict` with `noUnusedLocals` / `noUnusedParameters`: no unused imports, vars, or params.

## Code conventions

- **Import alias:** `@/...` for everything under `src/` (`tsconfig.app.json` → `paths`). Avoid deep `../../..`.
- **Strict TypeScript:** no `any` without justification; type props, services, mappers.
- **Styles:** Tailwind + `src/components/ui/` (shadcn). No new UI libraries; reuse Radix/shadcn.
- **UI preference:** before custom UI, check whether shadcn already covers it in `src/components/ui/`.
- **Language:** English for UI, visible copy, domain comments, docs, and identifiers.
- **Comments:** only for non-obvious logic (see `create-entity-service.ts` header). File headers (3–8 lines) and section banners (`// ─── Name ───`) are OK in dense wiring.

## Feature architecture

Code lives under `src/`:

```text
src/
├── App.tsx              # Lazy router + initial sync + global providers
├── components/          # layout/, data-table/, ui/
├── features/
│   ├── home/
│   ├── amellwind/<x>/
│   ├── raintdm/<x>/
│   └── dnd/<x>/
└── shared/
```

On disk only `amellwind/`, `raintdm/`, `dnd/`, and `home/` exist under `src/features/`. Do not recreate old flat trees.

Nav map: `src/shared/constants/nav-sections.ts`.

**Feature pattern** (copy a similar neighbor):

```text
features/<section>/<x>/
├── components/
├── services/
├── mappers/
├── hooks/
├── data/
└── context/
```

Placement: **same Sidebar section**. Character Builder is RaintDM. Features without a route (e.g. `dnd/optionalfeatures`) stay with the 5e compendium.

### Data layer (do not break)

- Build services with `createEntityService` (`src/shared/services/create-entity-service.ts`).
- List filters: `useListSessionFilters`; open item: `useListItemUrlParam` or a detail route.
- IndexedDB: `src/shared/db/database.ts` + `sync.service.ts`. Invalidate memory caches after successful sync. No direct IndexedDB from components.
- Flow: raw JSON → mapper → domain model → service → hook → component.

## Complex zones (extreme care)

Read the matching `docs/domain/` file and types **before** editing.

1. **Character Builder (ALPHA)** — `src/features/raintdm/builder/` → `docs/domain/features-builder.md`
2. **Export Foundry VTT (SPA character)** — `src/shared/foundry/` + `builder/foundry-export/` → `features-builder.md`
3. **Import Foundry VTT** — `builder/foundry-import/` → `features-builder.md`
4. **Foundry hunt bosses / module** — `public/data/foundry-*` → skill `foundry-monsters` (not actor JSON dumps)
5. **5etools parsing** — `src/shared/utils/`, `src/shared/data/`
6. **IndexedDB sync** — `src/shared/db/` → `docs/domain/data-architecture.md`

## Scope and safety

- Do not commit the full 5etools mirror or bulk data under `public/5etools/`. `backup_jsons/` is local backup only.
- No backend or heavy dependencies unless asked: static SPA on Vercel.
- Surgical diffs only; do not reformat unrelated files.
- Legal: this repo **organizes** published content; do not invent or alter homebrew rules.

## Checklist before finishing

1. `pnpm lint` with zero warnings.
2. `pnpm build` green (typecheck + compile).
3. Scoped to the target feature; `@/` imports; no dead code.
4. If you changed documented domain rules, update the matching `docs/domain/<file>.md` (and `README.md` if product-facing).
