# Weapon Rules and Information

Source: `public/data/gtmh-patreon/gtmh-patreon-appendixB.md` (one `## Weapon`
heading per weapon, `#### Rarity` tiers, `### Feature` entries). Cost and
weight come from the "Armor & Weapon Pricing" table in
`public/data/gtmh-patreon/gtmh-patreon-chapter3.md`.

Parsed by `scripts/gtmh/weapon-appendix.mjs` into:

- `item[]` HW rows (`scripts/gtmh/weapons.mjs`)
- `optionalfeature[]` rows (`scripts/gtmh/optional-features.mjs`)

Local overlay wins by name over the GitHub GTMH feed.
