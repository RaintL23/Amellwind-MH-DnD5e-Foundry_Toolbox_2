# MHMM with Loot Tables 2.0

Organized from Amellwind’s free Patreon PDF:
[MHMM with Loot Tables 2.0](https://www.patreon.com/amellwind/posts/monster-hunter-137502033).

Wired into the app via `supplement.json` (monsters, conditions, diseases).
Local sheets win over the public GitHub MHMM JSON; GitHub only fills names
the PDF does not have.

| Want | Use |
| --- | --- |
| Runtime overlay | `supplement.json` (`pnpm build:mm-data` or `pnpm build:mm-supplement`) |
| Rebuild from edited `.md` sheets | `pnpm build:mm-data` |
| Process into JSON / mappers | `catalog.json` + `runes.json` + [`SCHEMA.md`](SCHEMA.md) |
| Read one creature | `monsters/<family>/<slug>.md` |
| Browse a family | `02-amphibians.md` … `21-monster-templates.md` |
| Review parse gaps | [`QA.md`](QA.md) |

- Monsters in catalog: **404** (Guardian Template skipped in the overlay)
- Materials / runes parsed: **2435**
