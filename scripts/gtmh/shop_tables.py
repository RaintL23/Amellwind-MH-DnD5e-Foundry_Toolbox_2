#!/usr/bin/env python3
"""Convert GTMH dump shop/item/weapon/armor pricing blocks → markdown tables."""

from __future__ import annotations

import re

ITEM_HEADER = re.compile(r"^Item Cost Weight$")
COST_TOKEN = r"(?:\d[\d,]*(?:\.\d+)?\s*(?:gp|sp|cp)|—+|-+)"
# Allow em-dash OR ASCII --- for empty weight (Provision Stockpile uses ---)
WEIGHT_TOKEN = (
    r"(?:—+|-{2,}|"
    r"(?:\d+/\d+|\d+(?:\.\d+)?)\s*lb\.?(?:\s*\([^)]+\))?|0 lb\.)"
)
ITEM_ROW = re.compile(
    rf"^(.+?)\s+({COST_TOKEN})\s+({WEIGHT_TOKEN})$",
    re.I,
)
ITEM_CATEGORIES = {
    "Barrel Bombs",
    "Fishing Lures",
    "Handheld Bombs",
    "Horns",
    "Meat",
    "Traps",
    "Light Armor",
    "Medium Armor",
    "Heavy Armor",
}

# Section titles that must end an Item Cost Weight block (never category rows)
ITEM_TABLE_STOPS = {
    "Shops",
    "Combo List",
    "Magic Items",
    "The Provision Stockpile",
    "The General Store",
    "Traveling Merchants",
    "The Smithy",
    "The Smithy Continued",
    "Adventuring Gear",
    "Tools",
    "Ammo",
    "Ammo Vendor",
    "Example Traveling Merchant 1",
    "Example Traveling Merchant 2",
    "Material Base Price",
    "Let's walk through it all",
    "Using the Combo List",
}

WEAPON_HEADER = re.compile(
    r"^Weapons\*?\s+Cost Damage AC Weight Properties$"
)
WEAPON_ROW = re.compile(
    r"^(.+?)\s+(\d[\d,]*\s*gp)\s+(.+?)\s+(—|\+?\d+|Varies)\s+"
    r"(\d[\d,]*(?:\.\d+)?\s*lb\.)\s+(.+)$",
    re.I,
)

ARMOR_HEADER = re.compile(
    r"^Armor\*{0,2}\s+Cost Armour Class \(AC\) Strength Stealth Weight$"
)
ARMOR_ROW = re.compile(
    r"^(.+?)\s+(\d[\d,]*\s*gp)\s+(.+?)\s+(—|Str \d+)\s+(—|Disadvantage)\s+"
    r"(—|\d[\d,]*(?:\.\d+)?\s*lb\.)$",
    re.I,
)

CR_HEADER = re.compile(r"^Material Base Price$")
CR_SUB = re.compile(r"^Creatures CR level Base Price\*?$")
CR_ROW = re.compile(r"^(\d+(?:\s*-\s*\d+)?|\d+\+)\s+(\d[\d,]*\s*gp)$")

SHOP_SUBHEADINGS = {
    "Magic Items",
    "Example Traveling Merchant 1",
    "Example Traveling Merchant 2",
}


def esc_foot(s: str) -> str:
    s = s.lstrip("\\")
    if s.startswith("*"):
        return "\\" + s
    return s


def split_mangled_footnotes(s: str) -> list[str]:
    """Split dump glues like '**Shields…. \\***No other…' into separate notes."""
    parts = re.split(r"(?<=\.)\s+\\\*{3}", s)
    if len(parts) == 1:
        parts = re.split(r"(?<=\.)\s+\*{3}", s)
    out: list[str] = []
    for idx, part in enumerate(parts):
        part = part.strip()
        if not part:
            continue
        if idx == 0:
            out.append(esc_foot(part) if part.startswith("*") else part)
        else:
            out.append(esc_foot("***" + part) if not part.startswith("*") else esc_foot(part))
    return out or [esc_foot(s)]


def try_item_cost_weight_table(
    lines: list[str], i: int
) -> tuple[list[str], int] | None:
    if not ITEM_HEADER.match(lines[i].strip()):
        return None
    rows: list[str] = []
    footnotes: list[str] = []
    j = i + 1
    while j < len(lines):
        s = lines[j].strip()
        if not s:
            k = j + 1
            while k < len(lines) and not lines[k].strip():
                k += 1
            if k < len(lines) and ITEM_HEADER.match(lines[k].strip()):
                j = k + 1
                continue
            break
        if s.startswith("*") or s.startswith("\\*"):
            for note in split_mangled_footnotes(s):
                footnotes.append(note)
            j += 1
            while j < len(lines) and (
                lines[j].strip().startswith("*")
                or lines[j].strip().startswith("\\*")
            ):
                for note in split_mangled_footnotes(lines[j].strip()):
                    footnotes.append(note)
                j += 1
            break
        if ITEM_HEADER.match(s):
            j += 1
            continue
        if s in SHOP_SUBHEADINGS or s in ITEM_TABLE_STOPS:
            break
        if (
            s.startswith("#")
            or WEAPON_HEADER.match(s)
            or ARMOR_HEADER.match(s)
            or CR_HEADER.match(s)
            or s.startswith("Example Traveling")
            or s.startswith("The ")
        ):
            break
        if s in ITEM_CATEGORIES:
            rows.append(f"| **{s}** | | |")
            j += 1
            continue
        m = ITEM_ROW.match(s)
        if not m:
            # Only promote known category labels — never invent section titles as rows
            break
        name, cost, weight = (
            m.group(1).strip(),
            m.group(2).strip(),
            m.group(3).strip(),
        )
        if set(cost.replace("—", "")) <= {"-"} or set(cost) <= {"—"}:
            cost = "—"
        if set(weight.replace("—", "")) <= {"-"} or set(weight) <= {"—"}:
            weight = "—"
        cost = re.sub(r"(\d)(gp|sp|cp)$", r"\1 \2", cost, flags=re.I)
        rows.append(f"| {name} | {cost} | {weight} |")
        j += 1
    if not rows:
        return None
    out = [
        "| Item | Cost | Weight |",
        "| --- | ---: | --- |",
        *rows,
        "",
    ]
    for fn in footnotes:
        out.append(fn)
        out.append("")
    return out, j


def try_weapons_table(lines: list[str], i: int) -> tuple[list[str], int] | None:
    if not WEAPON_HEADER.match(lines[i].strip()):
        return None
    rows: list[str] = []
    j = i + 1
    while j < len(lines):
        s = lines[j].strip()
        if (
            not s
            or ARMOR_HEADER.match(s)
            or s.startswith("*")
            or s.startswith("\\*")
            or s.startswith("#")
        ):
            break
        m = WEAPON_ROW.match(s)
        if not m:
            break
        name, cost, dmg, ac, weight, props = (g.strip() for g in m.groups())
        dmg = dmg.rstrip(",")
        rows.append(
            f"| {name} | {cost} | {dmg} | {ac} | {weight} | {props} |"
        )
        j += 1
    if len(rows) < 2:
        return None
    return (
        [
            "| Weapon | Cost | Damage | AC | Weight | Properties |",
            "| --- | ---: | --- | :---: | --- | --- |",
            *rows,
            "",
        ],
        j,
    )


def try_armor_table(lines: list[str], i: int) -> tuple[list[str], int] | None:
    if not ARMOR_HEADER.match(lines[i].strip()):
        return None
    rows: list[str] = []
    footnotes: list[str] = []
    j = i + 1
    while j < len(lines):
        s = lines[j].strip()
        if not s:
            break
        if s.startswith("*") or s.startswith("\\*") or s.startswith("**"):
            for note in split_mangled_footnotes(s):
                footnotes.append(note if note.startswith("**") and not note.startswith("\\") else note)
            j += 1
            continue
        if s in {"Light Armor", "Medium Armor", "Heavy Armor"}:
            rows.append(f"| **{s}** | | | | | |")
            j += 1
            continue
        if s.startswith("#") or s.startswith("The Smithy") or s.startswith("Let's"):
            break
        m = ARMOR_ROW.match(s)
        if not m:
            break
        name, cost, ac, strength, stealth, weight = (
            g.strip() for g in m.groups()
        )
        rows.append(
            f"| {name} | {cost} | {ac} | {strength} | {stealth} | {weight} |"
        )
        j += 1
    if len(rows) < 2:
        return None
    out = [
        "| Armor | Cost | Armor Class (AC) | Strength | Stealth | Weight |",
        "| --- | ---: | --- | --- | --- | --- |",
        *rows,
        "",
    ]
    for fn in footnotes:
        out.append(fn)
        out.append("")
    return out, j


def try_material_cr_table(
    lines: list[str], i: int
) -> tuple[list[str], int] | None:
    if not CR_HEADER.match(lines[i].strip()):
        return None
    j = i + 1
    if j < len(lines) and CR_SUB.match(lines[j].strip()):
        j += 1
    rows: list[str] = []
    footnotes: list[str] = []
    while j < len(lines):
        s = lines[j].strip()
        if not s:
            break
        if s.startswith("*") or s.startswith("\\*"):
            for note in split_mangled_footnotes(s):
                footnotes.append(note)
            j += 1
            continue
        if (
            s.startswith("Example")
            or s.startswith("#")
            or ITEM_HEADER.match(s)
        ):
            break
        m = CR_ROW.match(s)
        if not m:
            break
        rows.append(f"| {m.group(1)} | {m.group(2)} |")
        j += 1
    if len(rows) < 2:
        return None
    out = [
        "| Creatures CR | Base Price |",
        "| --- | ---: |",
        *rows,
        "",
    ]
    for fn in footnotes:
        out.append(fn)
        out.append("")
    return out, j


def try_shop_catalog_table(
    lines: list[str], i: int
) -> tuple[list[str], int] | None:
    """Try CR / weapons / armor / item-cost-weight converters in priority order."""
    for fn in (
        try_material_cr_table,
        try_weapons_table,
        try_armor_table,
        try_item_cost_weight_table,
    ):
        res = fn(lines, i)
        if res:
            return res
    return None
