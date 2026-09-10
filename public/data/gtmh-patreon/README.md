# GTMH (Patreon/GMBinder) staging + runtime overlay

Source document:
[Amellwind's Guide to Monster Hunting (GMBinder)](https://www.gmbinder.com/share/-LCk9FgQaqaXBVmLeCeT)

This folder mirrors the MHMM Patreon pipeline:

- Human-readable **formatted slices** (`gtmh-patreon-*.md`) for agent/parser work
- Curated entity extracts in `chapters/`
- Machine overlay in `supplement.json`
- Merge policy: local-wins by normalized name, GitHub fills uncovered names

## Commands

```bash
pnpm build:gtmh-supplement
pnpm build:gtmh-data
# re-split + format staging slices from the raw dump:
python scripts/gtmh/format-raw-slices.py
```

`build:gtmh-data` currently aliases `build:gtmh-supplement`.

## Files

| File | Role |
| --- | --- |
| `gtmh-patreon.md` | Canonical raw dump (build scripts still read this) |
| `gtmh-patreon-intro.md` | Front matter + TOC (formatted) |
| `gtmh-patreon-chapter{1-5}.md` | Chapters 1–5 (formatted headings/tables) |
| `gtmh-patreon-appendix{A,B,C}.md` | Appendices A–C (formatted) |
| `source/source-reference.md` | Pointer to the original dump source file |
| `chapters/` | Curated chapter/entity source markdown |
| `supplement.json` | Runtime overlay consumed by IndexedDB sync |
| `supplement-manifest.json` | Local names + overlap report per GTMH key |
| `SCHEMA.md` | Expected data shape and merge behavior |

## Slice map

| Slice | Content |
| --- | --- |
| intro | Welcome, carving/capturing rules, table of contents |
| chapter1 | Campaigns, lore, gods, races, factions/backgrounds |
| chapter2 | Character options, skills, races, feats, hunt roles, downtime |
| chapter3 | Equipment, items, shops, combo list, resources |
| chapter4 | Hunt creation, travel, siege, loot/materials, runes |
| chapter5 | Old World gazetteer |
| appendixA | Location stat blocks |
| appendixB | Monster Hunter weapons |
| appendixC | Old World bestiary / Monstie sidekick |
