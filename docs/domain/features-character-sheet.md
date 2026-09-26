# Character Sheet (RaintDM — session play)

> In-session player character sheet. Feature code: `src/features/raintdm/character-sheet/`.

## Purpose

Manage a player character during a live session: HP, death saves, actions / bonus actions / reactions (with condition locks), spells, rests, inventory/weight, and conditions/diseases/status. Optimized for phone (bottom nav + sheets) and desktop (multi-column layout).

## Routes and nav

- `/sheet` — roster (import Builder JSON, open sheets)
- `/sheet/:characterId` — live sheet
- Sidebar: **RaintDM → Character Tools → Character Sheet**

## Layout by breakpoint

| Breakpoint | Layout |
| --- | --- |
| below lg | Compact sticky header + bottom nav (Actions / Spells / Features / Inventory / Stats / Roll Log). Stats tab includes Resources + Hit Dice. |
| lg+ | Same header (aligned in `max-w-7xl`), tabs **above** the body, left rail (`w-72`) with Stats. Stats tab hidden. |
| xl+ | Adds right rail (`w-72`): Resources, Hit Dice, live Roll Log. Roll Log tab also hidden. |

Header: name + inspiration toggle + overflow menu (Short / Long Rest, Edit in Builder); horizontal **stat boxes** (AC, Init tappable, Speed, PB, Passive); taller HP bar (opens HP sheet); compact **Status** chips (conditions, Exhaustion, concentration) that open a Status sheet.

## Data model

`PlayCharacterRecord` in IndexedDB store `play_characters` (DB v3):

| Field | Role |
| --- | --- |
| `compiled` | Frozen build snapshot (stats, features, attacks, spells, resources) |
| `builderJson` | Full `BuilderCharacterJson` for Edit in Builder / re-sync |
| `session` | Mutable play state (HP, slots, uses, conditions, inventory, notes, …) |

Roll log entries (`PlayRollEntry`, optional `natural`) persist in `localStorage` per character (`roll-log.storage.ts`, max 30). Session notes use `session.notes` + `SET_NOTES` (Notes textarea at the end of Features).

## Entry paths

1. **Builder** → Download JSON / Import menu → **Send to Character Sheet** / **Update linked Sheet** (blocked until creation checks pass — same gate as PDF export)
2. **Roster** → **Load from Builder** (reads Builder autosave; requires the same completeness gate)
3. **Roster** → **Import Builder JSON** (no need to open `/builder`)

Compilation: `compilePlayCharacterFromBuilderJson` loads catalogs by refs and builds `PlayCharacterCompiled` without mounting `CharacterBuilderProvider`.

## Conditions / Status

Header chips + **Status** sheet (stepper for Exhaustion, Add condition picker). The Status UI is a **single** Sheet with internal steps (`main` → `picker` → `detail`) — never stack a second Sheet/Dialog on top (Radix leaves `body { pointer-events: none }` and freezes the app). Picker loads the **deduped** D&D list (`getListDndConditions` / `getListDndDiseases`) so PHB vs XPHB printings of the same name appear once; Amellwind entries stay under their tab. Detail view uses full `StatBlockContent`. Concentration clear and breaking concentration use a confirm dialog (not `window.confirm`).

Catalog entries are prose-only. Curated map `CONDITION_EFFECTS` + `deriveActionLocks` greys out Action / Bonus / Reaction / attacks when conditions like Incapacitated apply. Exhaustion uses 2014 vs 2024 tables via `rulesEdition`:

- **2024:** every level counts — `−2 × level` to D20 Tests and `−5 × level` ft Speed; level 6 is death. Rolls subtract `d20TestPenalty`.
- **2014:** discrete stacked levels (ability-check disadvantage → half speed → attack/save disadvantage → HP max halved → speed 0 → death).

## Center panels (Actions / Features / Spells)

**Actions** tab: **Quick attacks** strip (equipped / compiled weapons with Attack / Dmg / Crit, no accordion). Then **Card + Accordion** per economy bucket (**Actions** open by default; Bonus / Reactions / Other closed). Empty buckets hidden. Always-present **Free Actions** info card. Nested Magical Action / Utilize / Attack lists behave as before. **Bonus Action spells** nest under a **Magic Action** host in the Bonus Actions bucket (same economy as casting via Magic). **Light off-hand / bonus weapon attacks** omit the ability modifier from damage (Two-Weapon Fighting / Light property) and show a short rule note. Spell level labels use **Level N** (not `L1`). Feature / spell / action descriptions render via `DescriptionLines` (bullets and option titles split for readability). Links jump to Spells / Inventory.

**Features** tab: all character features (every activation bucket), grouped by source with counts; sticky search; Action/Bonus/Reaction badges when applicable; Notes at the bottom. Standard PHB actions stay on Actions only. Actionable features also remain on the **Actions** tab for play.

**Spells**: Ability / Spell Atk / Save DC boxes + concentration chip; slot tracker as a card with per-level pips and `left/max` (**filled = remaining / available**, empty = spent — same for Resources and feature uses); search + level chips + Prepared; list grouped by level. **Cast**: DropdownMenu for upcast when higher slots are free; **only prompts Adv/Dis and rolls d20 when the spell has an attack roll** (`spellHasAttackRoll`); otherwise logs cast + slot + DC. Compile resolves descriptions from the 5etools catalog.

**Roll Log**: toast feedback on each roll (sonner, ~3s, Nat 20 / Nat 1 highlight); log panel with Clear; persisted per character.

**Stats**: ability cards show **modifier large / score small**; saves and skills with proficiency dots (no truncated names in the aside); Senses; proficiency badges; Resources + Hit Dice on the mobile Stats tab (and on the xl right rail).

**Resources**: spendable pools only — class-table columns allowlisted as use pools (Rage, Ki/Focus, Sorcery Points, Channel Divinity, Wild Shape, Second Wind, Favored Enemy) plus features that declare limited uses (Action Surge, Bardic Inspiration, …). Progression stats (Cantrips, Prepared Spells, Bardic Die, Sneak Attack, Weapon Mastery, …) are excluded. Feature-backed rows share `featureUsesSpent` with Actions / Features.

## Inventory

Summary card (weight bar, attunement pips, currency). **+ Add item** in the Equipped header. Rows: name + badges, quantity stepper, overflow menu — **Equip** only for weapons/armor/shields, **Use** for consumables (potions, scrolls, …; healing potions roll + consume), **Attune** only when the item requires attunement (or is already attuned), plus Details / Remove. Coin weight, variant encumbrance, and AC adjust live under a **Settings** collapsible (Switch / input).

Add-item sheet tabs: D&D / Amellwind / Custom (multi-select + quantities; long-press preview as an in-sheet step, not a nested Dialog). Equip exclusivity and attunement limits unchanged.

**AC (header):** `getEffectiveArmorClass` from equipped armor/shield + DEX + `session.acAdjust`.

## Overlay / pointer-events (Radix)

Do **not** open a Sheet/Dialog from a modal `DropdownMenu` without `modal={false}` + `setTimeout(0)` before opening (see SheetHeaderBar rest menu, Inventory row menu, Spells upcast Cast). Do **not** stack two Sheets or a Dialog on an open Sheet for browse→detail flows — use internal steps. `SheetContent` / `DialogContent` call `clearStaleBodyPointerLock` on close as a safety net.

## Session rules (summary)

- HP sheet: numeric amount + Damage / Heal / Set Temp; quick ±1/5/10; Full HP; death saves as 3+3 pips + Reset + Roll
- Short / Long rest: same recovery rules as before (via overflow menu); finish rest writes a Roll Log entry listing what recovered (HP, slots, features, …). Opening rest from the overflow menu uses a non-modal dropdown + deferred open so the sheet does not leave the page unclickable.
- Dice: `useSheetRoller` centralizes d20 tests (prompt, locks, exhaustion penalty, log, toast); damage / item-use / non-attack casts skip the Adv/Dis prompt
- Confirmations: `useConfirmDialog` for concentration break, delete sheet, remove item

## Docs map

Linked from `docs/domain/index.md` and `routing.md`.
