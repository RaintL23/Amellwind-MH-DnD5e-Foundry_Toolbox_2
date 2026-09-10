# GTMH Patreon supplement schema

The runtime overlay is a 5etools-shaped object keyed like the GTMH feed:

```json
{
  "source": "GTMH-Patreon",
  "generatedFrom": "public/data/gtmh-patreon/gtmh-patreon.md",
  "policy": "local-wins-by-name",
  "item": [],
  "optionalfeature": [],
  "race": [],
  "subrace": [],
  "background": [],
  "feat": [],
  "variantrule": [],
  "classFeature": [],
  "class": [],
  "object": [],
  "bookData": {}
}
```

## Merge policy

- `local` entries come first.
- GitHub entries are appended only when their name is not covered by local.
- For missing/empty local arrays, the app keeps GitHub/current merged cache.
- `bookData` uses local object when present; otherwise GitHub/current cache.

## Notes

- The local parser is conservative: it only emits structured rows when parsing is reliable.
- `feat` and selected `variantrule` content is extracted from curated chapter markdown.
- `background` is parsed from `gtmh-patreon-chapter1.md` (Factions & PC Backgrounds).
- Factions / Lore guide UI data and Dragonship rules are regenerated alongside the supplement into:
  - `src/features/amellwind/factions/data/factions.generated.json`
  - `src/features/amellwind/lore/data/lore.generated.json`
  - `src/features/amellwind/siege-weapons/data/dragonship.generated.json`
- `item` (HW weapons) and `optionalfeature` are parsed from Appendix B in `public/data/gtmh-patreon/gtmh-patreon.md`.
- `bookData` carries the Patreon Material Effects lists (Chapter 4 loot-table material list) for `/material-effects`.
- Other keys are wired for local-wins merge and can be incrementally expanded.
