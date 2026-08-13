---
name: builder-validation
description: >-
  Validates Character Builder completeness for D&D and Amellwind modes using
  evaluateBuildCompleteness and Vitest. Use when changing builder identity,
  feats, proficiencies, spells, starting equipment, randomizer, export gates,
  or when the user asks to verify a character build covers every required step.
---

# Builder Validation

## Source of truth

In-app completeness lives in:

- `evaluateBuildCompleteness()` — `src/features/raintdm/builder/utils/build-completeness.utils.ts`
- Wired to UI/export via `BuildCompletenessContext`
- Export is blocked when `shouldBlockExport` is true (`hasStarted && issues.length > 0`)

Do **not** invent a parallel checklist. Extend the evaluators under
`src/features/raintdm/builder/utils/build-completeness/` and cover new rules with Vitest.

## Character creation steps (what must be valid)

These map to `BuildCompletenessSection` / issue ids:

| Step | Section(s) | Typical issue ids |
| --- | --- | --- |
| Species / background / class / subclass | `identity` | `identity-species`, `identity-background`, `identity-class`, `identity-subclass` |
| Origin feat (D&D choose grant **or** Amellwind background) | `feats` | `origin-feat` |
| Level feat / ASI slots | `feats` | `feat-slot-*`, `feat-asi-*` |
| Optional features (fighting styles, invocations, …) | `optional-features` | progression shortfalls |
| Ability choices (species choose, background ASI, Tasha) | `ability-scores` | ability / ASI issues |
| Skills / expertise | `skills` | skill picker incomplete |
| Tools / languages / defenses | `tools`, `languages`, `defenses` | named / defense pickers |
| Class (and D&D background) starting equipment in inventory | `starting-equipment` | `starting-equipment-*` |
| Cantrips / prepared-or-known spells | `spells` | `spells-cantrips-*`, `spells-prepared` |

Notes:

- Equipping MH/Forge weapons on the paper doll is a **workflow** tip (`BUILDER_WORKFLOW_STEPS`), not currently a hard completeness gate.
- Amellwind backgrounds always grant a choose Origin Feat (`AMELLWIND_BACKGROUND_ORIGIN_FEAT_GRANT` in `amellwind/backgrounds/constants/origin-feat.constants.ts`; Builder re-exports it).
- Randomizer must leave `evaluateBuildCompleteness(...).issues` empty for the resulting snapshot (no weapons required).

## When changing Builder code

1. Read the matching evaluator file before editing.
2. Add/adjust a Vitest case in
   `src/features/raintdm/builder/utils/build-completeness/build-completeness.test.ts`
   (use `createEmptyCompletenessInput` from `completeness-input.fixture.ts`).
3. Run:

```bash
pnpm test
```

4. For broader regressions after identity/randomizer/export changes, also run:

```bash
pnpm lint
pnpm build
```

5. Manually smoke (when UI wiring changed): `/builder` in both **Amellwind Homebrew ON** and **OFF** — start a class, confirm red completeness highlights match new issues, confirm Foundry export stays blocked until clear.

## Expected test posture (grow over time)

**Now (unit):** pure snapshots into `evaluateBuildCompleteness`.

**Next (optional):** integration — run `useCharacterRandomizer` (or a headless harness) for D&D + Amellwind at levels 1 and 5, build a `BuildCompletenessInput` from the resulting state, assert `issues.length === 0`.

**Later (optional):** Playwright smoke that clicks through species → class → export gate.

## Definition of done for Builder PRs

- [ ] Completeness rules updated if new mandatory choices were introduced
- [ ] Vitest covers the new/changed issue id(s)
- [ ] `pnpm test` green
- [ ] Amellwind origin-feat path still covered if identity/background touched
- [ ] No export allowed while known incompleteness remains (`shouldBlockExport`)
