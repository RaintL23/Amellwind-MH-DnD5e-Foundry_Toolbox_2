# Third-party content and attributions

The project's **source code** is MIT-licensed (see [`LICENSE`](./LICENSE)). The MIT license does **not** extend to the third-party material listed here, which keeps its original authorship, rights, and terms. It is included or loaded to make the tool usable, not claimed as original work.

If you are a rights holder and want something here credited differently, changed, or removed, please open an issue on the repository.

## Content

| Material | Owner / source | Where it appears | Notes |
| --- | --- | --- | --- |
| Amellwind's Monster Hunter homebrew (rules, species, backgrounds, feats, classes, weapons, items) | [Amellwind](https://www.patreon.com/cw/amellwind) via [TheGiddyLimit/homebrew](https://github.com/TheGiddyLimit/homebrew) | Fetched at runtime and cached in IndexedDB | Public feed; no license is stated in that repository. |
| *MHMM with Loot Tables 2.0* (monster sheets, loot tables, runes, conditions, diseases) | Amellwind, free [Patreon PDF](https://www.patreon.com/amellwind/posts/monster-hunter-137502033) | `public/data/mhmm-patreon-2.0/` | Transcribed and restructured into Markdown/JSON for the app. All rights remain with Amellwind. |
| GTMH chapters (feats, hunt roles, downtime variants) | Amellwind, [GMBinder](https://www.gmbinder.com/share/-LCk9FgQaqaXBVmLeCeT#newfeats) | `public/data/gtmh-patreon/` | Same as above. |
| D&D 5e compendium (spells, classes, items, bestiary, races, backgrounds, feats) | Wizards of the Coast, via the [5etools-src](https://github.com/5etools-mirror-3/5etools-src) mirror ([5e.tools](https://5e.tools)) | Fetched at runtime; a small subset is committed under `public/5etools/` | Dungeons & Dragons is a trademark of Wizards of the Coast. |
| Unearthed Arcana / playtest material | Wizards of the Coast, via [TheGiddyLimit/unearthed-arcana](https://github.com/TheGiddyLimit/unearthed-arcana) | Fetched at runtime on demand | |
| Monster Hunter names, monsters, and imagery | Capcom | `public/mh-icons/`, `public/mh-tokens/`, monster names across the app | Monster Hunter is a trademark of Capcom. Not covered by the MIT license. |
| Magic item pricing | VaranSL / [Dump Stat Adventures](https://dumpstatadventures.com/the-gm-is-always-right/pricing-magic-items-2024-dungeon-masters-guide) | `scripts/data/magic-item-pricing.csv` and generated data | Attributed in the app (`magic-item-pricing-attribution.ts`); not original calculations. |
| Class optimization ratings | [RPGBot](https://rpgbot.net) | `src/features/raintdm/builder/data/rpgbot-ratings.json` (built by `scripts/scrape-rpgbot.mjs`) | Ratings remain RPGBot's work. |
| D&D 2024 character sheet | Wizards of the Coast | `public/character-sheet/dnd-2024-character-sheet.pdf` | Official sheet distributed by Wizards of the Coast. |
| Foundry VTT automation format | [TheGiddyLimit/plutonium-addon-automation](https://github.com/TheGiddyLimit/plutonium-addon-automation) (MIT) | `src/shared/foundry/weapons/automation.data.ts`, `feature-automation.data.ts` | Ported as reference data. License text below. |
| Midi QoL / DAE flag semantics | [tposney/midi-qol](https://github.com/tposney/midi-qol), [DAE](https://foundryvtt.com/packages/dae) | `src/shared/foundry/midi.ts` and Active Effect builders | Only flag keys and formats are reproduced; the modules themselves are not included. |

Neither Foundry VTT, Plutonium, Midi QoL, nor DAE are bundled; the exported actors require them in the destination world.

## npm dependencies

Runtime and build dependencies (React, Radix UI, shadcn/ui, TanStack Table, Tailwind CSS, `idb`, `pdf-lib`, `lucide-react`, and others) are distributed under their own licenses, listed in each package published on npm.

## plutonium-addon-automation — MIT License

```text
MIT License

Copyright (c) 2022 TheGiddyLimit

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
