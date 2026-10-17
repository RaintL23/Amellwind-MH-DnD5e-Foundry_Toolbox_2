# DM Screen & GM Session — planning

> Status: **planning**. Nothing here is implemented. Once built, the settled rules move to
> `docs/domain/features-dm-screen.md`.

## 1. Vision

A **GM Session** page (DM Screen) where the GM sees the whole party as compact cards, keeps
classic DM-screen reference panels at hand (reorderable), applies HP changes and conditions to
one or many characters, calls for group rolls and resolves pass/fail in bulk, and jumps into the
Combat Tracker with the party already loaded.

**Phase 2** adds an online layer: the GM's browser hosts a peer-to-peer session, players join
from their own Character Sheet, and everything the GM does is mirrored on each player's sheet
(and vice versa).

Out of scope for the whole feature: enemy/NPC cards outside combat, maps, tokens, chat (keep the
DM Screen about *party state* and *reference*, not a VTT).

---

## 2. v0.1 scope — "basic and green"

First version is **offline only** and deliberately small. Anything not listed as IN is
postponed, not rejected.

| Area | IN for v0.1 | OUT (later) |
| --- | --- | --- |
| Sessions | List page, create / rename / delete; each session has its own party, layout and notes | Duplicate, templates, campaign grouping |
| Party | Pick characters from the existing roster; cards with portrait, name, class/level, HP bar, AC, condition chips; multi-select | Density toggle |
| Card menu | Damage / Heal / Temp HP (reuse `HpAdjustDialog`), apply / remove condition (reuse status catalog), **Open sheet** (navigates to `/sheet/:id`) | Sheet inside a side panel |
| Group roll | Targets, roll type (save / check / skill), optional DC, **Secret** flag (only effective online), **Mark only** and **Enter results** modes, bulk consequence on failures (damage, optional half on success, condition) | **Auto-roll** (v0.2, needs the pure roller extracted from `useSheetRoller`), session log |
| Combat | "Start combat" navigates to `/combat-tracker` with the selected PCs loaded (data is **copied**; HP may drift if the sheet is edited mid-combat — known limitation) | Linked HP between sheet and tracker |
| Reference panels | The 11 classic panels (§3.1), show/hide + **drag & drop reorder** with `@dnd-kit` (cut to show/hide only if v0.1 needs trimming) | Free-text / custom panels, extra catalog |
| Online | **Nothing.** Only keep the rule that the DM Screen mutates characters exclusively by dispatching `PlaySessionAction`s | All of Phase 2 |

Prerequisite inside v0.1: a **minimal shared character store** (§4.1) so the DM Screen and an
open sheet never overwrite each other. Without it the feature can lose player data.

Party source: the GM imports each player's Builder JSON into their own roster
(`/sheet` → Import Builder JSON). The DM Screen picks characters from that roster.

---

## 3. Features (offline)

### 3.1 Reference panels

- Grid of panels around (or beside) the party area. Each panel: title, collapse, show/hide.
- **Edit layout** mode: show/hide, **drag & drop to reorder** (`@dnd-kit`, with keyboard and touch
  sensors and a visible drag handle), width 1–2 columns.
- Layout persisted per session; new sessions start from a default layout.
- No free-text panels at first.

| # | Panel | Content source |
| --- | --- | --- |
| 1 | **Party overview** — passive Perception / Investigation / Insight, AC, spell save DC per character | Computed from the party's `compiled` data (no rules text) |
| 2 | **Conditions** (D&D 5e, 2014/2024) | Existing 5e conditions data |
| 3 | **Amellwind conditions / blights / diseases** | Existing Amellwind conditions feature |
| 4 | **Exhaustion** (2014 vs 2024) | Existing exhaustion rules used by the sheet |
| 5 | **Actions in combat** (Attack, Dash, Disengage, Dodge, Help, Hide, Ready, Search, Use an Object…) | 5etools actions data |
| 6 | **Cover** | 5etools variant rules |
| 7 | **Light & vision** (bright / dim / darkness, obscurement) | 5etools variant rules |
| 8 | **Typical DCs & damage by level** (DC by difficulty, improvised damage, object AC/HP) | 5etools DMG tables |
| 9 | **Travel pace** | 5etools variant rules |
| 10 | **Encounter difficulty** quick calc | Existing Encounter Calculator logic |
| 11 | **Dice roller** | New, small |

Later candidates: Notes (free text), skill ↔ ability reference, rest rules, falling / suffocation,
NPC attitudes, random encounter tables.

> **Legal constraint (AGENTS.md):** this repo organizes published content; it must not invent or
> rewrite rules. Every rule panel renders entries from existing data (5etools / Amellwind JSON) by
> reference, never hand-typed rule text.

### 3.2 Party cards

Compact card per character, center of the screen. All fields derive from `compiled` + `session`:

- Portrait thumbnail, name, player name, class + level
- HP bar `current / max (+temp)`; at 0 HP → death-save pips instead
- AC (effective)
- Condition chips, exhaustion level, concentration chip, inspiration
- Selection checkbox (for bulk actions)

### 3.3 Card click menu

Click → `DropdownMenu` (or `Popover`) with:

1. **Damage / Heal / Temp HP** → reuse `HpAdjustDialog` from the Combat Tracker (already supports
   multi-target, critical-at-0, temp). Dispatches `SET_HP_DELTA` / `SET_TEMP_HP`.
2. **Apply condition** → status picker built from `loadStatusCatalog()` → `ADD_CONDITION`
   (also exhaustion +/-, concentration clear).
3. **Open Character Sheet** → navigates to `/sheet/:characterId` (the back button returns to the
   DM Screen). Full edit rights, as if the GM were the player.

Radix pitfall (see `features-character-sheet.md` → Overlay): opening a Sheet/Dialog from a
`DropdownMenu` needs `modal={false}` + `setTimeout(0)`.

### 3.4 Group rolls

1. GM selects targets (all / checked cards) → **Request roll**.
2. Chooses roll type: saving throw (ability), ability check, skill check, or custom; optional
   **DC**; optional **Secret** flag.
3. Chooses a resolution mode per request:
   - **Auto-roll**: the app rolls for each character with their modifier and condition-driven
     advantage/disadvantage/penalty (needs the pure roller, §4.5). v0.2.
   - **Enter results**: players roll physical dice, GM types each total.
   - **Mark only**: GM toggles pass/fail per character.
   - **Players roll** (online only): the request appears on each player's sheet, they roll with
     their own roller, and the result arrives in the GM's table.
4. Results table: character, roll, total, pass/fail (auto from DC, GM can override per row in
   every mode).
5. **Bulk consequence** in the same dialog:
   - Damage on fail, **half on success** toggle, or no damage on success.
   - Apply condition to failures (or to successes, or to all).
   - Heal all.
6. Result written to each character's roll log (and the session log, v0.2).

**Secret:** stored as `secret: boolean` from v0.1. It only has effect online: a secret request's DC
and results are not sent to players.

### 3.5 Start combat

- **Start combat** with selected cards navigates to `/combat-tracker` and creates combatants with
  `kind: "pc"`, `name`, `playerName`, `ac` (effective), `initiativeMod`, `dexScore`
  (`compiled.abilities.dex.score`), `levelOrCr: "Lv N"`.
- The GM then adds enemies with the existing compendium picker.
- v0.1 copies HP into the combatant. **Later:** add `linkedCharacterId?: string` to `Combatant` so
  HP / temp / death saves of linked PCs are read from and written to the character store
  (`APPLY_HP` / death-save actions routed to `dispatchToCharacter`; NPCs keep using the combat
  reducer). Rules stay identical because both sides use `hp-actor.utils.ts`.

---

## 4. Architecture

### 4.1 Shared character store (required)

Gap in the current code: `usePlayCharacter` keeps the record in React state and autosaves after
400 ms. If the DM Screen also writes the same record (or the sheet is open in another tab), the
last autosave silently overwrites the other one.

Create a module-level store, e.g.
`src/features/raintdm/character-sheet/store/play-character-store.ts`:

```ts
// sketch
dispatchToCharacter(characterId: string, action: PlaySessionAction, origin?: ActionOrigin): void
subscribe(characterId: string, cb: () => void): () => void   // used via useSyncExternalStore
getSnapshot(characterId: string): PlayCharacterRecord | undefined
```

- Owns the debounced IndexedDB persistence that `usePlayCharacter` does today.
- `usePlayCharacter` becomes a thin wrapper over it (no behaviour change for the sheet).
- Optional: `BroadcastChannel` to sync two tabs of the same browser.
- **Hinge for Phase 2:** the online layer only hooks into `dispatchToCharacter` (send the action)
  and into incoming messages (apply the action). No UI knows about the network.

### 4.2 Every mutation is an action

The DM Screen never edits `session` objects directly: it only dispatches `PlaySessionAction`s.
New needs (e.g. bulk HP) are N actions, not an ad-hoc writer. Avoid `Math.random()` inside
reducers for anything that will be replicated (the combat reducer's `ROLL_INITIATIVE` does it
today; fine while the host is authoritative).

### 4.3 GM Session entity & persistence

```ts
interface GmSession {
  id: string;
  version: 1;
  name: string;                 // "Session 12 — Ancient Forest"
  characterIds: string[];       // play_characters ids (Phase 2: + remote uids)
  layout: DmScreenLayout;       // panels, order, widths, collapsed
  notes: string;
  log: GmSessionLogEntry[];     // group rolls, bulk HP, conditions (capped); v0.2
  createdAt: string;
  updatedAt: string;
}
```

- New IndexedDB store `gm_sessions` (bump `DB_VERSION` 3 → 4), not `localStorage`: it links
  records and grows with the log.
- **Many sessions**: one record each; a character may belong to several sessions (referenced by id).

### 4.4 Feature location

- `src/features/raintdm/dm-screen/` (components, hooks, services, utils, data) — RaintDM → GM Tools.
- Routes: `/dm-screen` (session list), `/dm-screen/:sessionId`. Nav in `nav-sections.ts`.
- Imports from `character-sheet` and `combat-tracker` stay inside `raintdm` (allowed). Pure
  utilities other features need (roller, status catalog) can move to `src/shared/`.

### 4.5 Other gaps to close

- **Pure roller:** `useSheetRoller` is a hook tied to one open sheet. Auto-roll needs a pure
  `rollForCharacter(compiled, session, kind, …)` that works for N characters and respects
  `CONDITION_EFFECTS`, `rollModeForKind` and exhaustion 2014/2024 exactly like the sheet.
- **Stable character identity:** `PlayCharacterRecord.id` is local and `BuilderCharacterJson.meta`
  has no UID, so the GM's copy and the player's copy cannot be matched. Add a `uid` (needed in
  Phase 2, cheap to add earlier).

### 4.6 Existing pieces to reuse

| Piece | Where |
| --- | --- |
| Play character records (IndexedDB `play_characters`) | `character-sheet/services/play-character.service.ts` |
| Pure session reducer `playSessionReducer(compiled, session, action)`; dice are rolled *outside* it, so replaying an action is deterministic | `character-sheet/utils/play-session-reducer.ts` |
| Shared HP / death-save rules (sheet and tracker already agree) | `src/shared/utils/hp-actor.utils.ts` |
| Status catalog (conditions / diseases / status, D&D + Amellwind) | `character-sheet/utils/status-catalog.ts` |
| Condition effects, action locks, roll modes | `character-sheet/utils/condition-effects.data.ts`, `derive-action-locks.ts` |
| Effective AC | `character-sheet/utils/effective-armor-class.ts` |
| Combat Tracker reducer + multi-target `HpAdjustDialog` | `src/features/raintdm/combat-tracker/` |
| shadcn primitives (`dropdown-menu`, `popover`, `dialog`, `checkbox`, `command`, …); no `context-menu` primitive, a click menu via `DropdownMenu` / `Popover` is enough | `src/components/ui/` |

---

## 5. Phase 2 — Online (P2P)

### 5.1 Topology

**Star, host-authoritative.** The GM's browser is the hub; each player has one connection to the
GM (players don't connect to each other). The GM applies every action and re-broadcasts the
result. No conflict-resolution algorithms (no CRDTs).

```
 Player A sheet ─┐
 Player B sheet ─┼── WebRTC DataChannel ──► GM browser (DM Screen, source of truth)
 Player C sheet ─┘
```

### 5.2 What "P2P" requires in a browser

WebRTC sends data peer-to-peer, but **cannot start without help**:

| Need | Why | Options |
| --- | --- | --- |
| **Signaling** | Peers must exchange an offer/answer (SDP) + ICE candidates before connecting; only used for the initial handshake, never sees character data. | **Trystero** (public infra: BitTorrent trackers, Nostr, MQTT, Firebase/Supabase) or **PeerJS** (free public broker, or self-hosted PeerServer). A third-party public signaling service is accepted; self-hosting stays an option. |
| **STUN** | Lets each peer discover its public address. | Free public STUN servers. |
| **TURN** | Relay when both sides are behind strict/symmetric NAT (some mobile carriers, corporate/university networks). Without it a fraction of connections fail. | Free-tier TURN providers (verify current limits/pricing) or self-hosted coturn. |

To verify when Phase 2 starts: which library (Trystero or PeerJS) is still maintained, bundle size,
message chunking for large payloads, reconnection behaviour, TURN free-tier limits. Adding the
dependency needs explicit approval (AGENTS.md: no heavy deps / backend unless asked).

### 5.3 Join flow

1. GM opens a session → **Go online** → gets a room code / link (e.g. `…/sheet?join=ABCD-1234`).
2. Player opens their sheet → **Join session** → enters the code (or opens the link).
3. Player sends `hello` with their character (`uid`, `compiled`, `session`, art thumbnail).
4. GM sees a **join request** and approves or rejects (the room code is not the only gate).
5. If the GM already has a record with the same `uid`, the **player's version wins**: the GM's copy
   is overwritten by what the player sends. If the GM's copy is newer (`updatedAt`) than the
   player's, the GM sees a warning before it is replaced.
6. The card appears on the DM Screen with an "online" indicator. From here the host is
   authoritative for the whole session.

### 5.4 Visibility and permissions

- Players see every character's **public summary** (name, HP, temp HP, AC, conditions, exhaustion,
  concentration) — the host broadcasts it to all clients. The full `session` goes only to its owner.
- Players can edit **anything** on their own sheet during a session, as today. No field locks; the
  host still applies and re-broadcasts every change.
- The GM can do everything described in §3 on remote characters; changes are mirrored on the
  players' sheets.

### 5.5 Protocol sketch

Versioned, JSON, small. Send **full session snapshots** (a few KB) instead of patches: simpler and
self-healing after packet loss / reconnect.

```ts
type ClientToHost =
  | { t: "hello"; protocol: 1; playerName: string; character: RemoteCharacterPayload }
  | { t: "intent"; uid: string; action: PlaySessionAction; clientSeq: number }
  | { t: "roll-result"; requestId: string; uid: string; total: number; natural?: number; detail: string }
  | { t: "roll-shared"; uid: string; entry: PlayRollEntry }
  | { t: "resync" };

type HostToClient =
  | { t: "welcome"; protocol: 1; sessionName: string }
  | { t: "rejected"; reason: string }
  | { t: "state"; uid: string; rev: number; session: PlaySessionState }      // to the owner only
  | { t: "party"; members: PublicCharacterSummary[] }                        // to everyone
  | { t: "roll-request"; requestId: string; kind: "save" | "check" | "skill" | "custom";
      ability?: AbilityKey; skill?: SkillKey; dc?: number; secret?: boolean }
  | { t: "combat"; round: number; activeName: string | null; order: CombatOrderEntry[] }
  | { t: "kick" };
```

Rules:
- Player actions: apply locally (optimistic), send `intent`; host applies the same action, bumps
  `rev`, broadcasts `state`; the client replaces its session when `rev` is newer.
- GM actions on a remote character: applied on host → `state` to that player.
- `compiled` and art are sent once at join (can be 100s of KB with portraits → chunking or
  thumbnails only).
- Secret roll requests omit the DC and results from anything sent to players.

### 5.6 Failure modes

| Case | Handling |
| --- | --- |
| Player's phone locks / tab sleeps | Connection drops. Auto-reconnect with the same identity → host sends full `state`. Card shows "offline"; the GM can keep editing (host is truth). |
| GM refreshes or closes the tab | Session ends for everyone. Players keep their last state locally. GM reopens → same room code → players reconnect. (Optional: Wake Lock API on host.) |
| Connection never establishes (NAT) | Needs TURN; clear error + "use offline mode" fallback. |
| Two edits at once on the same character | Host order wins; the client is overwritten by the next `state`. |
| Version mismatch (app updated on one side) | `protocol` field in `hello`/`welcome`; reject with a clear message. |

### 5.7 Security / trust

- WebRTC data channels are encrypted (DTLS) by default.
- Signaling servers only see connection metadata, never character data.
- Room code + GM approval per join; GM can kick.
- Players can cheat on rolls — same as at a physical table; not a goal to prevent.
- No accounts, no persistence on any server.

### 5.8 Testing strategy

Define a `SessionTransport` interface (`send`, `onMessage`, `onPeerJoin`, `onPeerLeave`) with:

- `BroadcastChannelTransport` — two tabs in the same browser (GM tab + player tab). Lets the whole
  online flow be built and tested **before** choosing a WebRTC library.
- `WebRtcTransport` — the real one (Trystero/PeerJS behind the same interface).

Protocol handlers are unit-testable with Vitest using an in-memory transport.

---

## 6. Roadmap

| # | Milestone | Size |
| --- | --- | --- |
| **v0.1** | | |
| M0 | Minimal shared character store (§4.1) | M |
| M1 | DM Screen skeleton: route, nav, `gm_sessions` store, session list, pick party from roster, party cards | M |
| M2 | Card menu: HP (reuse `HpAdjustDialog`), conditions, open sheet + multi-select bulk HP | S–M |
| M3 | Group rolls: mark-only + enter-results modes, bulk consequences, Secret flag | M |
| M4 | "Start combat": send selected PCs to `/combat-tracker` (copied data) | S |
| M5 | Reference panels (11) + edit layout with drag & drop. Verify first which 5etools files (`actions`, `variantrules`, DMG tables) the app already loads or caches; panels 5–9 need a small curation step (entry names to show) and loaders if missing | M–L (content curation is the slow part) |
| **v0.2** | | |
| M6 | Pure roller extracted from `useSheetRoller` + auto-roll mode + session log + `uid` on records | M |
| M7 | Linked combatants (HP shared between sheet and tracker) | M |
| **Phase 2** | | |
| M8 | `SessionTransport` + protocol + `BroadcastChannelTransport` (two-tab online) | M |
| M9 | WebRTC transport, join flow, approval, reconnect, "Players roll" requests, public party summary | L |
| M10 | Polish: TURN config, wake lock, thumbnails, protocol versioning | S–M |

M0 goes first: it fixes a real data-loss risk the DM Screen would otherwise introduce. M1–M5 can be
reordered after that.

---

## 7. Risks

- **Scope creep** toward a VTT.
- **Data loss** from two writers on the same record — mitigated by M0.
- **Reference content curation** (§3.1) is slow and legally constrained — render existing data only.
- **WebRTC reliability** on mobile networks — TURN + clear offline fallback.
- **Payload size** of `compiled` + portraits over data channels — chunking/thumbnails.
- **HP drift** between sheet and tracker in v0.1 (copied combatants) — removed by M7.
