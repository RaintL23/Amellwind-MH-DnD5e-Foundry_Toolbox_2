# Combat Tracker (RaintDM GM Tools)

> GM initiative / HP / death-saves tracker. Feature code: `src/features/raintdm/combat-tracker/`.

## Purpose

Provide a fluid tabletop UI for the GM to manage initiative order, hit points (including multi-target damage), and death saving throws during a D&D 5e combat.

## Route and nav

- Route: `/combat-tracker` (lazy in `App.tsx`)
- Sidebar: **RaintDM → GM Tools → Combat Tracker** (`nav-sections.ts`)

## Data model

Combatants are runtime session actors (not the shared `Actor` entity). Status is **derived**, never stored:

| Field | Notes |
| --- | --- |
| `kind` | `"pc"` \| `"npc"` |
| `name` | Character / creature name |
| `playerName` | Optional (PCs); shown under the name in the tracker |
| `hp` | `{ current, max, temp }` |
| `levelOrCr` | `"Lv N"` for PCs (numeric level input); numeric CR for custom NPCs |
| `initiative` | number with 2 decimals (Foundry-style Dex/100 tiebreaker) or `null` |
| `deathSaves` | `{ successes, failures }` 0–3 |
| `sourceRef` | optional link back to bestiary / Amellwind monster |

`CombatState`: `{ version: 1, combatants, started, round, activeId }` — persisted under `localStorage` key `raintdm-combat-tracker`.

Derived status via `getCombatantStatus()`:

- NPC at 0 HP → `defeated` (skipped in turn order, greyed out)
- PC at 0 with &lt;3 successes/failures → `dying` (still takes turns)
- PC with 3 successes → `stable`
- PC with 3 failures (or massive damage) → `dead` (skipped)

## Initiative

- Sort descending; `null` initiative sorts last.
- Tiebreaker: `total + dexScore / 100`, rounded to 2 decimals (Foundry VTT style).
- Compendium monsters auto-roll initiative on add.
- **Roll Init** menu: **Roll for All** / **Roll for NPCs**. Missing initiative shows a dice button on the row.
- During setup, initiative is editable. After **Start Combat**, initiative is locked (read-only).
- **Edit Init** / **Lock Init** toggles editing again mid-combat; **Roll Init** is disabled while locked.

## Turn flow

- **Start Combat** sets `started`, `round = 1`, `activeId` to highest actable initiative.
- **Next Turn** advances to the next non-skipped combatant; wrapping increments `round`.
- Defeated NPCs and dead PCs are skipped; dying PCs are not.
- Keyboard: `N` next, `Shift+N` previous (ignored while typing / dialog open).

## HP rules (RAW-inspired)

- Damage consumes temp HP first, then current (floor 0).
- Healing caps at max; healing a PC from 0 clears death saves.
- Temp HP: keep the higher value (no stacking).
- PC damage while already at 0: +1 death failure (+2 if marked critical).
- Overflow damage ≥ max HP when dropping to 0: instant death (3 failures).

## Death saves

- Manual checkboxes (0–3 success / failure) or **Roll Save (d20)**.
- Nat 20 → regain 1 HP, reset saves.
- Nat 1 → two failures.
- ≥10 success, &lt;10 failure.

## Adding combatants

1. Manual PC form
2. Manual custom NPC form
3. Compendium picker (D&D 5e bestiary via `getAllBestiaryCreatures`, Amellwind via `getAllMonsters`) with quantity stepper; duplicate names become `Name 1`, `Name 2`, …

## Multi-target HP

Checkboxes on rows + toolbar “Apply HP to N” open the same `HpAdjustDialog` used for single-target HP buttons (`+1/+5/+10`, `−1/−5/−10`, free input, optional temp HP, critical toggle when any PC is at 0).
