# Rune weapon-effect audit (2026-08-22)

Audit of local PDF runes (`inGithubJson: false`) with slot **W** but no `weaponEffect` in
`catalog.json` / `runes.json`.

## Summary

| Metric | Before | After |
| --- | ---: | ---: |
| Local runes with W slot, no weapon effect | 81 | **0** |
| Recoverable from bio / WEAPON MATERIAL EFFECTS leaks | 57 | applied |
| Recoverable from base-monster inherit (prefix/exact name) | 11 | applied |
| Curated cross-sheet recovery (deviant ↔ base) | 13 | applied |

## Root cause

GM Binder two-column PDF parsing often:

1. **Drops weapon effects** from the Materials section while keeping armor effects and loot slots.
2. **Leaks** `WEAPON MATERIAL EFFECTS` text into another monster's `## Bio` block (e.g. Berserk
   Tetsucabra effects in Drilltusk bio; Tempered Gypceros effects in Purple Gypceros bio).
3. **Concatenates** adjacent rune lines (e.g. Zinogre Jasper + Zinogre Plate — fixed earlier).

The UI shows the **Weapon** badge from loot-table slots (`A, W`), not from whether
`weaponEffect` exists — so missing parsed data looked like a UI bug.

## Files changed

- `public/data/mhmm-patreon-2.0/rune-weapon-fixes.json` — curated recovery map (81 entries)
- `catalog.json`, `runes.json`, `supplement.json` — runtime data
- `monsters/**/*.md` — materials sections updated with `- **Weapon effect:**`
- `scripts/audit-rune-weapon-effects.mjs` — quick audit
- `scripts/audit-rune-weapon-deep.mjs` — deep scan + JSON report
- `scripts/apply-rune-weapon-fixes.mjs` — apply curated fixes

## Monsters fully recovered (81 materials)

- Tempered Gypceros (5)
- Nightcloak Malfestio (4)
- Rust Duramboros (5)
- Elderfrost Gammoth (4)
- Ash Kecha Wacha (4)
- Tempered Ebony Odogaron (2)
- Juvenile Astalos (1)
- Young Barioth (7)
- Sand Barioth (6)
- Black Diablos (9)
- Tempered Gravios (9)
- Silver Rathalos (8)
- Pink Rathian (6)
- Hirabami + Young Hirabami (8)
- Purple Ludroth (3)

## Re-run audit

```bash
node scripts/audit-rune-weapon-deep.mjs
node scripts/apply-rune-weapon-fixes.mjs   # idempotent
pnpm build:mm-supplement
```

## Remaining global notes

- ~102 runes with W slot still lack weapon effect in **github** sheets (`inGithubJson: true`) —
  mostly correct (armor-only materials, upgrade gems, or github JSON already complete).
- Bio contamination elsewhere: run `grep -r "WEAPON MATERIAL EFFECTS" monsters/` to find
  sheets that still leak effects into bios (cleanup optional; does not block runtime once
  materials sections are correct).

## Concatenated effects (fixed 2026-08-22)

Multiple material effects merged into a single field (PDF column bleed):

| Material | Monster | Fix |
| --- | --- | --- |
| V.Deadly Poison Sac | Viper Tobi-Kadachi | Trimmed; hold person moved to V.Ultraplegia Sac |
| Pyre-Kadaki Silk | Pyre Rakna-Kadaki | Trimmed; Maximum Might / spell bonus moved to Dull Glowgut / Hardclaw |
| Kadaki Queen Substance | Pyre Rakna-Kadaki | Armor split; web / entomologist moved to Dull Glowgut / Hardclaw |
| Gore Magala Carapace | Chaotic Gore Magala | Split from S.Magala Cortex (matches base Gore Magala carapace) |
| S. Magala Cortex | Chaotic Gore Magala | Recovered Gourmand (armor) + Quick Load (weapon) |
| Hirabami Webbing | Hirabami / Young Hirabami | Freezer Sac armor moved to Freezer Sac+ |
| Magmadron Tail | Magma Almudron | Inferno Lava Muck effects moved to Inferno Lava Mud |
| Juv.Astalos Shell / Wingtalon | Juvenile Astalos | Membrane / Electroscale effects restored to those materials |
| Black Diablos Carapace | Black Diablos | Divine Blessing+3 moved to Black Diablos Fang |
| Green Congalala Claw | Emerald Congalala | Belly reaction moved to Congalala Strong Fang |
| Fulgur Anjanath Hardfang | Fulgur Anjanath | Nosebone effects restored; loot name/slots cleaned |
| Garangolm Fist | Garangolm | Cold immunity / Stamina Thief moved to Golm Ploughtail |
| Teostra Carapace | Teostra | Archaeologist+ / fire damage moved to Teostra Claw |
| J.Uragaan Scute | Juvenile Uragaan | Load Up moved to J.Uragaan Marrow |
| Vespoid Abdomen | Vespoid Queen | Entomologist moved to QueenVespoidShl |
| Rakna-Kadaki Glowgut | Rakna-Kadaki | Spider Climb / fire damage moved to Sharpclaw |

Curated map: `rune-concat-fixes.json` — apply with `node scripts/apply-rune-concat-fixes.mjs`, then `pnpm build:mm-supplement`.
