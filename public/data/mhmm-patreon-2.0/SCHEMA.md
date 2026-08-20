# Staging schema + runtime overlay

`catalog.json` is **not** loaded as-is. `supplement.json` is the 5etools-shaped
overlay the app merges in `getMonsterData()`. Organized markdown lives under
`monsters/`.

Source: Amellwind’s free [MHMM with Loot Tables 2.0](https://www.patreon.com/amellwind/posts/monster-hunter-137502033) Patreon PDF.

## Local-wins policy

1. Keep organized archive files (`monsters/`, `catalog.json`, `runes.json`,
   family indexes).
2. `supplement.json` contains every catalog monster, plus `condition[]` and
   `disease[]` from `01-conditions-poisons-diseases.md` (Frenzy Virus is taken
   from the Shagaru Magala sheet when the chapter omits it).
3. At runtime, local sheets win on normalized name. GitHub `mm_current.github`
   is appended only for names the PDF does not have. The merged list is written
   to IndexedDB as `mm_current.data`.
4. The unordered PDF dump is not shipped. Rebuild catalog from a local dump
   with `python scripts/organize-mhmm-dump.py` if you have it.

Regenerate the overlay after editing `catalog.json`:

```bash
pnpm build:mm-supplement
```

## Files

| File | Role |
| --- | --- |
| `catalog.json` | One object per monster, mapper-shaped fields (archive) |
| `runes.json` | One object per material, shaped like `Rune` (archive) |
| `supplement.json` | 5etools `monster[]`, `condition[]`, `disease[]` overlay (runtime) |
| `supplement-manifest.json` | Local vs GitHub-overlap name lists |
| `monsters/<family>/<slug>.md` | Human-readable source of truth per creature |
| `0x-*.md` | Family indexes (links only) |
| `QA.md` | Parse flags to review |

## `catalog.json` monster object

Maps toward `instrucctions.md` → Monster + Rune:

| JSON field | App target |
| --- | --- |
| `name`, `group`, `cr`, `pdfPage` | `Monster.name`, `group`, `cr`, `page` |
| `size`, `creatureType`, `alignment` | Actor size/type/alignment |
| `ac`, `hp`, `speed`, `abilities` | Actor core |
| `bio[]` | `fluff.entries` strings |
| `traits` / `actions` / `bonusActions` / `legendaryActions` / `reactions` | `{ name, entries }` |
| `lootRolls` | `Monster.loot.rolls` |
| `loot[]` | inset loot table rows |
| `materials[]` | `Rune` rows (`armorEffect` / `weaponEffect`) |

`slots` uses `A` (armor), `W` (weapon), `O` (other / trinket / consumable).
The live `Rune` type only stores `A` and `W`; keep `O` in `otherEffect` until
the app grows an other-material channel.

GM Binder two-column layout still leaks into a minority of files (see `QA.md`):
a following subspecies' actions may appear after the first stat block. Core
fields (`ac`, `hp`, `loot[]`) keep the **first** block.

Nested 5etools lists (form variants, “one of the following” attacks) were
flattened into sibling `###` headings. The runtime mapper
(`sanitizeNamedEntrySection`) folds those children back under the parent and
splits glued `Name (Recharge)` abilities; it does not rewrite this archive.

## Ingestion notes

`scripts/build-mm-patreon-supplement.mjs` converts catalog rows into inset loot
tables (`Carve Chance` header + ARMOR/WEAPON lists) that `RuneMapper` can read.
Review `QA.md` before treating a local sheet as canon.
