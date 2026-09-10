#!/usr/bin/env python3
"""
Split + format public/data/gtmh-patreon/gtmh-patreon.md into smaller markdown slices.

Outputs (under public/data/gtmh-patreon/):
  gtmh-patreon-intro.md
  gtmh-patreon-chapter{1-5}.md
  gtmh-patreon-appendix{A,B,C}.md

Formatting goals (agent/parser friendly):
  - Real markdown headings from TOC titles
  - Bold field labels on location/stat lines
  - Simple dice tables → markdown tables when unambiguous
  - Feature lead-ins `Name. Rest` → ### Name + body when Name is short
  - Stable YAML front matter (source, slice id)
"""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
RAW = ROOT / "public/data/gtmh-patreon/gtmh-patreon.md"
OUT_DIR = ROOT / "public/data/gtmh-patreon"

# Exact TOC titles that should be ## (everything else from TOC → ###)
H2_TITLES = {
    # intro
    "What is Different",
    "How do I obtain Materials?",
    "Carving",
    "Carving Rules",
    "Capturing",
    "Capturing Rules",
    # ch1
    "Campaigns in Monster Hunter",
    "The Tale of the Five",
    "The History and Myths of the Old World",
    "The Gods of Monster Hunter",
    "The Races of Monster Hunter",
    "Factions & PC Backgrounds",
    # ch2
    "Character Options",
    "Creating a Character",
    "Creating a Character at a Higher Level",
    "Creating a Higher Level Character",
    "Skills and Their Uses",
    "Player Race Options",
    "New Feats",
    "Your Role on a Hunt",
    "New Downtime Activities",
    # ch3
    "Equipment, Resources, & Crafting",
    "Equipment",
    "Monster Hunter Items",
    "Shops",
    "Combo List",
    # ch4
    "Dungeon Master Resources",
    "Creating a Hunt",
    "Going on a Hunt",
    "Overworld Travel Rules",
    "Siege Weapons",
    "Dragonships",
    "Creating your own Loot Tables",
    "Creating Materials",
    "Material Effects Creation Tables",
    "Runes",
    "MHMLT Named Material List",
    "Weapon Material Effects",
    "Armor Material Effects",
    # ch5
    "The Old World",
    "The Calendar and the Passage of Time",
    "The Schrade Kingdom",
    "The Western Schrade Kingdom",
    "The Eastern Schrade Kingdom",
    "Schrade Hunting Grounds",
    "The Marshlands",
    "The North El De Region",
    "The South El De Region",
    "The Odibatorasu Region",
    "The Terosu Jungle",
    "The Northern Region",
    "Siki Country",
    "The Fonron Continent",
    "The Western Continent",
    "The Great Ocean",
    "Other Notable Locations",
    # appendix A
    "Location Stat Blocks",
    "Ancestral Steppes",
    "The Dunes",
    "Jungle",
    "Ocean",
    "Rotten Vale",
    "Snowy Mountains",
    "Verdant Hills",
    "Volcano",
    "The Wetlands",
    # appendix B
    "Monster Hunter Weapons",
    "Accel Axe",
    "Charge Blade",
    "Dual Blades",
    "Great Sword",
    "Gunlance",
    "Hammer",
    "Hunting Horn",
    "Insect Glaive",
    "Lance",
    "Longsword",
    "Magnet Spike",
    "Magus Staff",
    "Splint Rapier",
    "Switch Axe",
    "Sword and Shield",
    "Tonfas",
    "Wire Knuckles",
    "Wyvern Boomerang",
    "Bow",
    "Dual Repeaters",
    "Heavy Bowgun",
    "Light Bowgun",
    # appendix C
    "Old World Bestiary",
    "Monstie Sidekick Class",
}

# Extra body-only titles commonly used as section breaks
EXTRA_H2 = {
    "The Artificer",
    "Druid Wildshapes",
    "Creator's Note",
    "Variant Carve Rule: Rewarding the natural 20",
    "Welcome to Monster Hunter",
}

EXTRA_H3 = {
    "Duergar",
    "Hill Dwarves",
    "Mountain Dwarves",
    "High Elves",
    "Wood Elves",
    "Dark Elves (Drow)",
    "Forest Gnomes",
    "Rock Gnomes",
    "Artificer Infusions",
    "Starting Wealth",
    "Starting Weapons",
    "Starting Armor",
    "Starting Armor*",
    "Starting Monster Materials",
    "What Materials do I start with?",
    "Options",
    "Areas",
    "Encounters",
    "Weather",
    "Resources",
}

# In chapter 3, promote Resources to ## (TOC top-level under equipment chapter)
H2_BY_SLICE = {
    "chapter3": {"Resources"},
}

LOCATION_FIELD_PREFIXES = (
    "Biome",
    "Common Small Monsters",
    "Common Large Monsters",
    "Common Weather",
)

RANK_RX = re.compile(
    r"^(?:Low Rank|High Rank|G Rank|Master Rank)?\s*"
    r"\(?(?:Player\s+[Ll]evel\s+\d+(?:\s*-\s*\d+)?)\)?$"
)
RANK_INLINE_RX = re.compile(
    r"^(.+?)\s+Player\s+[Ll]evel\s+(\d+(?:\s*-\s*\d+)?)\s*$"
)
PLAYER_LEVEL_ONLY_RX = re.compile(r"^Player\s+[Ll]evel\s+(\d+(?:\s*-\s*\d+)?)\s*$", re.I)

FEATURE_LEAD_RX = re.compile(r"^([A-Z][A-Za-z0-9'’\- ]{1,40})\.\s+(.+)$")
RARITY_RX = re.compile(
    r"^(Nonmagical|Common|Uncommon|Rare|Very Rare|Legendary|All Rarities|All Rarites)\s*$",
    re.I,
)
DICE_HEADER_RX = re.compile(r"^(d\d+)\s+(.+)$", re.I)
DICE_ROW_RX = re.compile(r"^(\d+(?:\s*-\s*\d+)?)\s+(.+)$")
TOC_ENTRY_RX = re.compile(r"^(\d+)\s+(.+)$")
CHAPTER_MARK_RX = re.compile(r"^Chapter\s+(\d+)\.\s*$", re.I)
APPENDIX_MARK_RX = re.compile(r"^Appendix\s+([A-C])\.\s*$", re.I)

BODY_SPLITS = [
    ("intro", None, "Chapter 1"),
    ("chapter1", "Chapter 1", "Chapter 2"),
    ("chapter2", "Chapter 2", "Chapter 3"),
    ("chapter3", "Chapter 3", "Chapter 4"),
    ("chapter4", "Chapter 4", "Chapter 5"),
    ("chapter5", "Chapter 5", "Appendix A: Location Stat Blocks"),
    ("appendixA", "Appendix A: Location Stat Blocks", "Appendix B: Monster Hunter Weapons"),
    ("appendixB", "Appendix B: Monster Hunter Weapons", "Appendix C: Old World Bestiary"),
    ("appendixC", "Appendix C: Old World Bestiary", None),
]

FILE_MAP = {
    "intro": "gtmh-patreon-intro.md",
    "chapter1": "gtmh-patreon-chapter1.md",
    "chapter2": "gtmh-patreon-chapter2.md",
    "chapter3": "gtmh-patreon-chapter3.md",
    "chapter4": "gtmh-patreon-chapter4.md",
    "chapter5": "gtmh-patreon-chapter5.md",
    "appendixA": "gtmh-patreon-appendixA.md",
    "appendixB": "gtmh-patreon-appendixB.md",
    "appendixC": "gtmh-patreon-appendixC.md",
}

TITLE_MAP = {
    "intro": "Welcome / Front Matter",
    "chapter1": "Chapter 1 — Campaigns in Monster Hunter",
    "chapter2": "Chapter 2 — Character Options",
    "chapter3": "Chapter 3 — Equipment, Resources, & Crafting",
    "chapter4": "Chapter 4 — Dungeon Master Resources",
    "chapter5": "Chapter 5 — The Old World",
    "appendixA": "Appendix A — Location Stat Blocks",
    "appendixB": "Appendix B — Monster Hunter Weapons",
    "appendixC": "Appendix C — Old World Bestiary",
}


def parse_toc_by_slice(lines: list[str]) -> dict[str, set[str]]:
    """TOC titles grouped by output slice (avoids cross-chapter false headings)."""
    mark_to_key = {
        "1": "chapter1",
        "2": "chapter2",
        "3": "chapter3",
        "4": "chapter4",
        "5": "chapter5",
        "A": "appendixA",
        "B": "appendixB",
        "C": "appendixC",
    }
    out: dict[str, set[str]] = {k: set() for k in FILE_MAP}
    current = "intro"
    in_toc = False
    for line in lines:
        if line.strip() == "Table of Contents":
            in_toc = True
            continue
        if in_toc and line.strip() == "Chapter 1":
            break
        if not in_toc:
            continue
        s = line.strip()
        if not s:
            continue
        cm = CHAPTER_MARK_RX.match(s)
        am = APPENDIX_MARK_RX.match(s)
        if cm:
            current = mark_to_key[cm.group(1)]
            continue
        if am:
            current = mark_to_key[am.group(1).upper()]
            continue
        m = TOC_ENTRY_RX.match(s)
        if m:
            out[current].add(m.group(2).strip())
    return out


def slice_body(text: str) -> dict[str, str]:
    # Body starts at first standalone "Chapter 1" line after TOC.
    marker = "\nChapter 1\n"
    idx = text.find(marker)
    if idx == -1:
        raise SystemExit("Could not find body start (Chapter 1)")
    intro = text[:idx].strip()
    body = text[idx + 1 :]  # keep "Chapter 1\n..."

    out: dict[str, str] = {"intro": intro}
    for key, start, end in BODY_SPLITS:
        if key == "intro":
            continue
        start_pat = f"{start}\n"
        start_idx = body.find(start_pat)
        if start_idx == -1:
            # allow exact file start
            if body.startswith(start + "\n"):
                start_idx = 0
            else:
                raise SystemExit(f"Missing start marker: {start}")
        from_idx = start_idx
        if end is None:
            chunk = body[from_idx:]
        else:
            end_pat = f"\n{end}\n"
            end_idx = body.find(end_pat, from_idx + len(start_pat))
            if end_idx == -1:
                raise SystemExit(f"Missing end marker: {end}")
            chunk = body[from_idx:end_idx]
        out[key] = chunk.strip() + "\n"
    return out


def normalize_title(title: str) -> str:
    t = title.strip()
    t = t.rstrip("\\").strip()
    t = re.sub(r"[.*]+\s*$", "", t).strip()  # trailing * or .
    return t


def titles_equal(a: str, b: str) -> bool:
    return normalize_title(a).casefold() == normalize_title(b).casefold()


def set_match(title: str, candidates: set[str]) -> str | None:
    for item in candidates:
        if titles_equal(title, item):
            return item
    return None


def heading_for(title: str, slice_titles: set[str], slice_key: str) -> str | None:
    t = title.strip()
    if not t:
        return None
    n = normalize_title(t)

    if set_match(n, H2_BY_SLICE.get(slice_key, set())) or set_match(
        t, H2_BY_SLICE.get(slice_key, set())
    ):
        return f"## {n or t}"

    extra_h2 = set_match(t, EXTRA_H2) or set_match(n, EXTRA_H2)
    toc_h2 = set_match(t, H2_TITLES) or set_match(n, H2_TITLES)
    if extra_h2 or (toc_h2 and (set_match(t, slice_titles) or slice_key == "intro")):
        return f"## {extra_h2 or toc_h2 or t}"

    matched = (
        set_match(t, slice_titles)
        or set_match(n, slice_titles)
        or set_match(t, EXTRA_H3)
        or set_match(n, EXTRA_H3)
    )
    if matched:
        return f"### {matched}"
    return None


def format_location_field(line: str) -> str | None:
    for prefix in LOCATION_FIELD_PREFIXES:
        if line.startswith(prefix + " ") and not line.startswith(prefix + "."):
            rest = line[len(prefix) :].strip()
            return f"**{prefix}:** {rest}"
    return None


def try_dc_triple(lines: list[str], i: int) -> tuple[list[str], int] | None:
    """Navigation DC Encounter DC Investigation DC / values → table."""
    if i + 1 >= len(lines):
        return None
    header = lines[i].strip()
    values = lines[i + 1].strip()
    if header != "Navigation DC Encounter DC Investigation DC":
        return None
    parts = values.split()
    if len(parts) != 3 or not all(p.isdigit() for p in parts):
        return None
    table = [
        "| Navigation DC | Encounter DC | Investigation DC |",
        "| ---: | ---: | ---: |",
        f"| {parts[0]} | {parts[1]} | {parts[2]} |",
        "",
    ]
    return table, i + 2


def try_multi_col_resource_table(lines: list[str], i: int) -> tuple[list[str], int] | None:
    """
    Fence multi-column d6 resource blocks so parsers can find clear boundaries:
      d6 Bonepile (DC 11) Fish (DC 12) Insect (DC 10)
      1 Bone Sushifish Insect Husk
      ...
    """
    m = DICE_HEADER_RX.match(lines[i].strip())
    if not m:
        return None
    label = m.group(2).strip()
    if label.count("(DC") < 2:
        return None
    j = i
    block: list[str] = []
    while j < len(lines):
        s = lines[j].strip()
        if not s:
            break
        if j == i or DICE_HEADER_RX.match(s) or DICE_ROW_RX.match(s):
            # continue through contiguous d6 headers + rows
            if j > i and DICE_HEADER_RX.match(s) and "(DC" not in s:
                break
            block.append(s)
            j += 1
            continue
        break
    if len(block) < 3:
        return None
    out = ["```text", *block, "```", ""]
    return out, j


def try_simple_dice_table(lines: list[str], i: int) -> tuple[list[str], int] | None:
    """
    Convert:
      d20 Weather
      1 Thunder Storm.
      2-5 Hot...
    into a 2-column markdown table. Stops on blank or non-row.
    Skips multi-column resource headers (more than one obvious column name after die).
    """
    m = DICE_HEADER_RX.match(lines[i].strip())
    if not m:
        return None
    die, label = m.group(1), m.group(2).strip()
    # Heuristic: multi-column resource tables have several Title (DC n) chunks
    if re.search(r"\(DC\s*\d+\)", label) and label.count("(DC") >= 2:
        return None
    if " " in label and label.count(" ") >= 4 and not label.lower().startswith("encounter"):
        # likely multi-col header like "Bonepile (DC 11) Fish (DC 12) Insect (DC 10)"
        if re.search(r"\bDC\b", label):
            return None

    rows: list[tuple[str, str]] = []
    j = i + 1
    while j < len(lines):
        s = lines[j].strip()
        if not s:
            break
        rm = DICE_ROW_RX.match(s)
        if not rm:
            break
        rows.append((rm.group(1).replace(" ", ""), rm.group(2).strip()))
        j += 1
    if len(rows) < 2:
        return None

    out = [
        f"| {die} | {label} |",
        "| --- | --- |",
        *[f"| {a} | {b} |" for a, b in rows],
        "",
    ]
    return out, j


def format_intro(raw: str, toc_by_slice: dict[str, set[str]]) -> str:
    """Front matter + structured TOC; prose sections still go through format_lines."""
    text = raw.replace("\r\n", "\n")
    toc_idx = text.find("\nTable of Contents\n")
    if toc_idx == -1:
        return format_lines(text, toc_by_slice.get("intro", set()), "intro")

    prose = text[:toc_idx].strip()
    toc_block = text[toc_idx + 1 :].strip()  # starts with Table of Contents
    prose_fmt = format_lines(prose, toc_by_slice.get("intro", set()), "intro")

    toc_lines = ["## Table of Contents", ""]
    current_chapter: str | None = None
    for line in toc_block.split("\n"):
        s = line.strip()
        if not s or s == "Table of Contents":
            continue
        cm = CHAPTER_MARK_RX.match(s)
        am = APPENDIX_MARK_RX.match(s)
        if cm:
            current_chapter = f"Chapter {cm.group(1)}"
            toc_lines.append(f"### {current_chapter}")
            toc_lines.append("")
            continue
        if am:
            current_chapter = f"Appendix {am.group(1)}"
            toc_lines.append(f"### {current_chapter}")
            toc_lines.append("")
            continue
        m = TOC_ENTRY_RX.match(s)
        if m:
            page, title = m.group(1), m.group(2).strip()
            toc_lines.append(f"- `{page}` {title}")
            continue
        toc_lines.append(f"- {s}")
    toc_lines.append("")
    return prose_fmt.rstrip() + "\n\n" + "\n".join(toc_lines)


def format_lines(raw: str, slice_titles: set[str], slice_key: str) -> str:
    lines = raw.replace("\r\n", "\n").split("\n")
    out: list[str] = []
    i = 0
    skip_first_chapter_line = slice_key.startswith("chapter") or slice_key.startswith(
        "appendix"
    )

    while i < len(lines):
        line = lines[i]
        stripped = line.strip()

        if not stripped:
            if out and out[-1] != "":
                out.append("")
            i += 1
            continue

        # Drop redundant top title (replaced by H1 in front matter)
        if skip_first_chapter_line and i < 3:
            if stripped.startswith("Chapter ") or stripped.startswith("Appendix "):
                i += 1
                continue

        # Normalize escaped trailing asterisks from dump
        if stripped.endswith("\\*"):
            stripped = stripped[:-2] + "*"
        if "\\*" in stripped and len(stripped) < 40:
            stripped = stripped.replace("\\*", "*")

        # Rank / player-level bands
        if RANK_RX.match(stripped) or PLAYER_LEVEL_ONLY_RX.match(stripped):
            out.append(f"#### {stripped}")
            out.append("")
            i += 1
            continue

        m_rank = RANK_INLINE_RX.match(stripped)
        if m_rank and slice_key == "appendixA":
            lvl = m_rank.group(2).strip()
            out.append(f"#### Player Level {lvl}")
            out.append("")
            i += 1
            continue

        # Weapon rarity headers
        if RARITY_RX.match(stripped):
            out.append(f"#### {stripped}")
            out.append("")
            i += 1
            continue

        # TOC / known headings (scoped to this slice)
        heading = heading_for(stripped, slice_titles, slice_key)
        if heading:
            out.append(heading)
            out.append("")
            i += 1
            continue

        # Standalone Title Case section lines (body-only, not in TOC)
        if (
            i + 1 < len(lines)
            and not stripped.endswith(".")
            and 1 <= len(stripped.split()) <= 10
            and len(stripped) <= 80
        ):
            small = {"of", "and", "the", "a", "an", "to", "for", "in", "on", "or", "during"}
            words = stripped.split()
            if words[0][0:1].isupper() and all(
                (w[:1].isupper() or w.lower() in small) for w in words
            ):
                nxt = lines[i + 1].strip()
                if nxt and len(nxt) > 60 and not nxt.startswith("#"):
                    out.append(f"### {stripped}")
                    out.append("")
                    i += 1
                    continue

        # DC triple table
        dc = try_dc_triple(lines, i)
        if dc:
            chunk, nxt = dc
            out.extend(chunk)
            i = nxt
            continue

        # Multi-column resource dice blocks (fenced)
        multi = try_multi_col_resource_table(lines, i)
        if multi:
            chunk, nxt = multi
            out.extend(chunk)
            i = nxt
            continue

        # Simple dice tables
        dice = try_simple_dice_table(lines, i)
        if dice:
            chunk, nxt = dice
            out.extend(chunk)
            i = nxt
            continue

        # Location field lines
        loc_field = format_location_field(stripped)
        if loc_field:
            out.append(loc_field)
            i += 1
            continue

        # Definition-style: "Label. rest" short label → ### + paragraph
        feat = FEATURE_LEAD_RX.match(stripped)
        if feat:
            name, rest = feat.group(1).strip(), feat.group(2).strip()
            blocked = ("when", "if", "as", "on", "for", "while", "after", "before", "during")
            small = {"of", "and", "the", "a", "an", "to", "for", "in", "on", "or"}
            words = name.split()
            title_case = all(
                (w[:1].isupper() or w.lower() in small) for w in words if w
            )
            if len(words) <= 6 and title_case and words[0].lower() not in blocked:
                glossary = {
                    "Biome",
                    "Navigation DC",
                    "Encounter DC",
                    "Investigation DC",
                    "Total Resources",
                    "Resources",
                    "Common Small Monsters",
                    "Common Large Monsters",
                    "Common Weather",
                }
                if name in glossary:
                    out.append(f"**{name}.** {rest}")
                else:
                    out.append(f"### {name}")
                    out.append("")
                    out.append(rest)
                out.append("")
                i += 1
                continue

        # Compatible proficiency / martial lines under weapons
        if stripped.startswith("Compatible Proficiency "):
            out.append(f"**Compatible Proficiency:** {stripped[len('Compatible Proficiency '):]}")
            i += 1
            continue
        if stripped in {"Martial Melee Weapon", "Martial Ranged Weapon", "Simple Melee Weapon", "Simple Ranged Weapon"}:
            out.append(f"*{stripped}*")
            i += 1
            continue

        out.append(stripped)
        i += 1

    # Collapse excessive blank lines
    text = "\n".join(out)
    text = re.sub(r"\n{3,}", "\n\n", text).strip() + "\n"
    return text


def front_matter(slice_key: str) -> str:
    return (
        f"---\n"
        f"slice: {slice_key}\n"
        f"source: public/data/gtmh-patreon/gtmh-patreon.md\n"
        f"generatedBy: scripts/gtmh/format-raw-slices.py\n"
        f"---\n\n"
        f"# {TITLE_MAP[slice_key]}\n\n"
        f"> Formatted staging slice of Amellwind's Guide to Monster Hunting (Patreon/GMBinder).\n"
        f"> Canonical raw dump remains `public/data/gtmh-patreon/gtmh-patreon.md` for build scripts.\n\n"
    )


def main() -> None:
    raw = RAW.read_text(encoding="utf-8")
    lines = raw.splitlines()
    toc_by_slice = parse_toc_by_slice(lines)
    chunks = slice_body(raw)

    for key, filename in FILE_MAP.items():
        if key == "intro":
            body = format_intro(chunks[key], toc_by_slice)
        else:
            body = format_lines(chunks[key], toc_by_slice.get(key, set()), key)
        path = OUT_DIR / filename
        path.write_text(front_matter(key) + body, encoding="utf-8", newline="\n")
        print(f"wrote {path.relative_to(ROOT)} ({body.count(chr(10)) + 1} body lines)")


if __name__ == "__main__":
    main()
