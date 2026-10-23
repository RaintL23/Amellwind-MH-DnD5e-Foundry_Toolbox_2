# Source Reference

**Source of truth:** the formatted chapter slices. Every GTMH build script reads
these files; edit them directly when the guide changes.

- `public/data/gtmh-patreon/gtmh-patreon-intro.md`
- `public/data/gtmh-patreon/gtmh-patreon-chapter{1-5}.md`
- `public/data/gtmh-patreon/gtmh-patreon-appendix{A,B,C}.md`
- Curated extracts under `public/data/gtmh-patreon/chapters/`

Legacy raw dump (original split input, no longer read by build scripts):

- `public/data/gtmh-patreon/gtmh-patreon.md`

`python scripts/gtmh/format-raw-slices.py` regenerated the slices from that dump
once; it now refuses to overwrite existing slices unless run with `--force`,
which would discard any edit made to the slices.
