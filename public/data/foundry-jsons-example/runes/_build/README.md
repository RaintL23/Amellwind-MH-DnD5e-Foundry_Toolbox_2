# Foundry rune build tools

Shared item builders live in `public/data/scripts/runes/build-rune-lib.mjs`.
Batch definitions + meta/ids live here.

## Commands

```bash
# List batches
node public/data/foundry-jsons-example/runes/_build/build.mjs --list

# Build one batch (writes fvtt-Item-*.json under monster folders)
node public/data/foundry-jsons-example/runes/_build/build.mjs user-batch3

# Build every batch
node public/data/foundry-jsons-example/runes/_build/build.mjs --all

# Re-inject shared Item Macro controller into all curated rune JSONs
node public/data/foundry-jsons-example/runes/_build/sync-itemacro.mjs
```

## Layout

```
_build/
  build.mjs                 CLI entry
  sync-itemacro.mjs         Sync unified controller into JSON macros
  migrate-saves-to-activities.mjs   One-off migration (kept for history)
  batches/<name>.mjs        Rune definitions for that batch
  data/<name>/{ids,meta}.json
```

To add a new batch: create `data/<name>/{ids,meta}.json` and `batches/<name>.mjs`
using `createRuneBatch` / `pushRune` from the shared lib.
