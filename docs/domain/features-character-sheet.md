# Character Sheet (RaintDM — session play)

> In-session player character sheet. Feature code: `src/features/raintdm/character-sheet/`.

## Purpose

Manage a player character during a live session: HP, death saves, actions / bonus actions / reactions (with condition locks), spells, rests, inventory/weight, and conditions/diseases/status. Optimized for phone (bottom nav + sheets) and desktop (multi-column layout).

## Routes and nav

- `/sheet` — roster (import Builder JSON, open sheets)
- `/sheet/:characterId` — live sheet (`?tab=` preserves the active tab)
- Sidebar: **RaintDM → Character Tools → Character Sheet**

## Layout by breakpoint

| Breakpoint | Layout |
| --- | --- |
| below lg | Compact sticky header + bottom nav (Actions / Spells / Features / Inventory / Stats / Roll Log). Stats tab includes Resources + Hit Dice. |
| lg+ | Same header (aligned in `max-w-7xl`), tabs **above** the body, left rail (`w-72`) with Stats (mounted only at lg+). Stats tab hidden. |
| xl+ | Adds right rail (`w-72`): Resources, Hit Dice, live Roll Log (mounted only at xl+). Roll Log tab also hidden. |

Header: name + inspiration toggle + overflow menu (Short / Long Rest, **Edit in Builder**); horizontal **stat boxes** (AC, Init tappable, Speed, PB, Passive); taller HP bar (opens HP sheet); compact **Status** chips (conditions, Exhaustion, concentration).

**Edit in Builder** writes the sheet’s `builderJson` into Builder autosave (with confirm if the Builder has a different character), sets the linked sheet id, then navigates to `/builder`. Opening a sheet does **not** overwrite the linked id — only Edit / Send / Import / Load do.

## Data model

`PlayCharacterRecord` in IndexedDB store `play_characters` (DB v3):

| Field | Role |
| --- | --- |
| `compiled` | Frozen build snapshot (stats, features, attacks, spells, resources) |
| `compileVersion` | Bumped when compile rules change; sheet recompiles once in the background on open |
| `builderJson` | Full `BuilderCharacterJson` for Edit in Builder / re-sync |
| `session` | Mutable play state (HP, slots, uses, conditions, inventory, notes, …) |

Roll log entries (`PlayRollEntry`, optional `natural`) persist in `localStorage` per character (`roll-log.storage.ts`, max 30). Session notes use `session.notes` + `SET_NOTES` (Notes textarea debounced ~500 ms + flush on blur).

Autosave (400 ms debounce) also flushes on `visibilitychange` (hidden) and `pagehide`.

## Entry paths

1. **Builder** → Download JSON / Import menu → **Send to Character Sheet** / **Update linked Sheet** (blocked until creation checks pass — same gate as PDF export). Update confirms when Builder identity does not match the linked sheet.
2. **Roster** → **Load from Builder** (reads Builder autosave; requires the same completeness gate)
3. **Roster** → **Import Builder JSON** (no need to open `/builder`)

Compilation: `compilePlayCharacterFromBuilderJson` loads catalogs by refs and builds `PlayCharacterCompiled` without mounting `CharacterBuilderProvider`. Weapon attack ability uses STR / DEX / Finesse / ranged properties; `compiled.armorClass` is shield-free (runtime adds equipped shield once). Multiclass spell slots and hit dice are compiled when multiclass entries exist.

## Conditions / Status

Header chips open the Status sheet (they do **not** remove on tap). Removal happens inside Status. Concentration clear uses a confirm dialog.

The Status UI is a **single** Sheet with internal steps (`main` → `picker` → `detail`) — never stack a second Sheet/Dialog on top. Status catalog is cached at module level (shared by chips + sheet). Exhaustion is **only** `session.exhaustion` (stepper / picker increments it); legacy Exhaustion condition instances are migrated away on load. Duplicate named conditions are rejected.

Curated map `CONDITION_EFFECTS` + `deriveActionLocks` greys out Action / Bonus / Reaction / attacks when conditions like Incapacitated apply. Exhaustion uses 2014 vs 2024 tables via `rulesEdition`:

- **2024:** every level counts — `−2 × level` to D20 Tests and `−5 × level` ft Speed; level 6 is death. Rolls subtract `d20TestPenalty`.
- **2014:** discrete stacked levels (ability-check disadvantage → half speed → attack/save disadvantage → HP max halved → speed 0 → death). Ability-check disadvantage does **not** apply to saving throws / death saves.

## Center panels (Actions / Features / Spells)

**Actions** tab: **Quick attacks** strip (equipped / compiled weapons with Attack / Dmg / Crit / Ver when versatile). Then **Card + Accordion** per economy bucket. Magic Action lists **attuned** items only. Light off-hand attacks omit the ability mod from damage. Cast uses shared `castPlaySpell` (prompt/roll first; cancel Adv/Dis does not spend slots).

**Features** tab: all character features grouped by source; sticky deferred search; Notes at the bottom.

**Spells**: slot pips (`SET_SLOTS_SPENT` / `SET_PACT_SPENT` atomic). Cast checks prepared; ritual spells offer “Cast with slot” / “As ritual (no slot)”. Slot spend happens only after a successful cast resolution.

**Roll Log**: toast on each roll; persisted per character.

**Resources**: atomic `SET_FEATURE_USES_SPENT` / `SET_RESOURCE_SPENT` via shared `UsesPips` (filled = remaining).

## Inventory

Summary card (weight bar, attunement pips, currency). Catalog loads are module-cached. Add stacks by `catalogId`/name when possible. Quantity → 0 confirms remove. Catalog picker shows “Showing 100 of N — search to narrow”. Use/Drink respects action locks.

**AC (header):** `getEffectiveArmorClass` from `compiled.armorClass` (shield-free) + equipped shield + `session.acAdjust`. Clothing is not armor.

## Overlay / pointer-events (Radix)

Do **not** open a Sheet/Dialog from a modal `DropdownMenu` without `modal={false}` + `setTimeout(0)` before opening. Do **not** stack two Sheets or a Dialog on an open Sheet for browse→detail flows — use internal steps. `SheetContent` / `DialogContent` call `clearStaleBodyPointerLock` on close as a safety net.

## Session rules (summary)

- HP sheet: Damage / Heal / Set Temp (can clear temp); quick ±1/5/10; Full HP; death saves use the **natural** d20 for Nat 20 / Nat 1
- Short / Long rest: hit-die recovery prefers largest dice first; finish rest writes a Roll Log summary
- Dice: `useSheetRoller` + `rollModeForKind` (forced disadvantage by roll kind, Adv+Dis cancel to normal)
- Confirmations: `useConfirmDialog` for concentration, delete sheet, remove item, Edit/Update identity mismatches

## Docs map

Linked from `docs/domain/index.md` and `routing.md`.
