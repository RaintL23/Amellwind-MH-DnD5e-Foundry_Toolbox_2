# Foundry rune build tools

The curated `fvtt-Item-*.json` files under `runes/<Monster>/` are the source of truth.
Edit them directly; the old per-batch generators were removed (they had drifted from the JSONs).

## Commands

```bash
# Re-inject the shared Item Macro controller into all curated rune JSONs
node public/data/foundry-jsons-example/runes/_build/sync-itemacro.mjs
```

Shared controller: `public/data/scripts/runes/unified-rune-controller.js`.
Per-rune combat / on-equip code stays inside each JSON.
