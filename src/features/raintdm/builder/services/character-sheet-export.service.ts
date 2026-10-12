import type { PDFDocument, PDFFont, PDFTextField } from "pdf-lib";
import type { CharacterSheetExportData } from "../utils/character-sheet-export.types";
import {
  fitSingleLine,
  fitTextToBox,
  layoutSectionsIntoBoxes,
  PDF_ARMOR_TRAINING_CHECKBOXES,
  PDF_SPELL_ROWS,
  sanitizeTextForPdf,
  type ArmorTrainingCategory,
  type ExportTextSection,
  type PdfTextBox,
} from "../utils/character-sheet-export.utils";
import {
  appendContinuationPages,
  type ContinuationGroup,
} from "./character-sheet-continuation";

const TEMPLATE_URL = "/character-sheet/dnd-2024-character-sheet.pdf";

/** Smallest size used for long text on the sheet; the rest moves to page 3. */
const MIN_READABLE_SIZE = 5.5;
const CONTINUED_NOTE = "(continued on page 3)";

type PdfForm = ReturnType<PDFDocument["getForm"]>;

function applyFieldFontSize(field: PDFTextField, fontSize: number) {
  field.setFontSize(fontSize);
  for (const widget of field.acroField.getWidgets()) {
    const da = widget.getDefaultAppearance();
    if (da) {
      const patched = da.replace(/\d+(?:\.\d+)?\s+Tf/, `${fontSize} Tf`);
      if (patched !== da) widget.setDefaultAppearance(patched);
    }
  }
}

function getTextField(form: PdfForm, fieldName: string): PDFTextField | null {
  try {
    return form.getTextField(fieldName);
  } catch {
    return null; // field may not exist on all template revisions
  }
}

/**
 * Viewers render the non-embedded Helvetica with metric-compatible fonts that
 * can run slightly wider than its AFM widths; wrap a bit early so lines that
 * measure "just fits" never get clipped at the field edge.
 */
const WRAP_WIDTH_SAFETY = 0.97;

/** Text area pdf-lib draws into: widget rect minus border and 1pt padding. */
function getInnerBox(field: PDFTextField): PdfTextBox | null {
  const widget = field.acroField.getWidgets()[0];
  if (!widget) return null;
  const rect = widget.getRectangle();
  const inset = (widget.getBorderStyle()?.getWidth() ?? 0) + 1;
  return {
    width: (rect.width - inset * 2) * WRAP_WIDTH_SAFETY,
    height: rect.height - inset * 2,
  };
}

function setText(
  form: PdfForm,
  fieldName: string,
  value: string | number | undefined | null,
  options?: { fontSize?: number; allowEmpty?: boolean },
) {
  if (value === undefined || value === null) return;
  const text = sanitizeTextForPdf(String(value));
  if (!text && !options?.allowEmpty) return;
  const field = getTextField(form, fieldName);
  if (!field) return;
  if (field.isMultiline() && field.isScrollable()) field.disableScrolling();
  if (options?.fontSize !== undefined) applyFieldFontSize(field, options.fontSize);
  field.setText(text);
}

/** Multiline field: largest size in range that fits, wrapped with real metrics. */
function setFittedText(
  form: PdfForm,
  font: PDFFont,
  fieldName: string,
  value: string,
  range: { maxSize: number; minSize: number },
) {
  const text = sanitizeTextForPdf(value);
  if (!text) return;
  const field = getTextField(form, fieldName);
  const box = field && getInnerBox(field);
  if (!box) return;
  const fitted = fitTextToBox(text, font, box, range);
  setText(form, fieldName, fitted.text, { fontSize: fitted.fontSize });
}

/** Single-line field: largest size in range whose width fits the box. */
function setSingleLineText(
  form: PdfForm,
  font: PDFFont,
  fieldName: string,
  value: string | undefined,
  range: { maxSize: number; minSize: number },
) {
  const text = sanitizeTextForPdf(value ?? "");
  if (!text) return;
  const field = getTextField(form, fieldName);
  const box = field && getInnerBox(field);
  if (!box) return;
  setText(form, fieldName, text, { fontSize: fitSingleLine(text, font, box.width, range) });
}

/**
 * Lays sections out across one or more multiline fields and returns what did
 * not fit (for the continuation page).
 */
function setSections(
  form: PdfForm,
  font: PDFFont,
  fieldNames: string[],
  sections: ExportTextSection[],
  options: { maxSize: number; minSize?: number; sectionGap?: boolean },
): ExportTextSection[] {
  const clean = sections
    .map((section) => ({
      title: sanitizeTextForPdf(section.title),
      body: sanitizeTextForPdf(section.body),
    }))
    .filter((section) => section.title.trim() || section.body.trim());
  if (clean.length === 0) return [];

  const fields = fieldNames
    .map((name) => {
      const field = getTextField(form, name);
      const box = field && getInnerBox(field);
      return field && box ? { name, box } : null;
    })
    .filter((entry): entry is { name: string; box: PdfTextBox } => entry !== null);
  if (fields.length === 0) return clean;

  const layout = layoutSectionsIntoBoxes(
    clean,
    fields.map((entry) => entry.box),
    font,
    {
      maxSize: options.maxSize,
      minSize: options.minSize ?? MIN_READABLE_SIZE,
      sectionGap: options.sectionGap,
      continuationNote: CONTINUED_NOTE,
    },
  );
  fields.forEach((entry, idx) => {
    setText(form, entry.name, layout.texts[idx] ?? "", {
      fontSize: layout.fontSize,
      allowEmpty: true,
    });
  });
  return layout.overflow;
}

function clearWeaponRows(form: PdfForm) {
  for (let n = 1; n <= 6; n++) {
    for (const suffix of ["NAME", "BONUS/DC", "DAMAGE/TYPE", "NOTES"]) {
      setText(form, `${suffix} - WEAPON ${n}`, "", { allowEmpty: true });
    }
  }
}

function setCheckbox(form: PdfForm, fieldName: string, checked: boolean | undefined) {
  if (!checked) return;
  try {
    form.getCheckBox(fieldName).check();
  } catch {
    /* field may not exist on all template revisions */
  }
}

/** Decodes a base64 data URL into its raw bytes and mime type. */
function decodeDataUrl(
  dataUrl: string,
): { bytes: Uint8Array; mime: string } | null {
  const match = /^data:([^;,]+)?(?:;base64)?,(.*)$/s.exec(dataUrl);
  if (!match) return null;
  const mime = match[1] ?? "image/png";
  try {
    const binary = atob(match[2]);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return { bytes, mime };
  } catch {
    return null;
  }
}

/** Places the character portrait into the sheet's "Character Portrait" button field. */
async function setPortrait(
  pdfDoc: PDFDocument,
  form: PdfForm,
  portraitImage: string | null | undefined,
) {
  if (!portraitImage) return;
  const decoded = decodeDataUrl(portraitImage);
  if (!decoded) return;
  try {
    const image = /png/i.test(decoded.mime)
      ? await pdfDoc.embedPng(decoded.bytes)
      : await pdfDoc.embedJpg(decoded.bytes);
    form.getButton("Character Portrait").setImage(image);
  } catch {
    /* unsupported image format or missing field — skip silently */
  }
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** The casting-time column is ~29pt wide: shorten the long common values. */
function abbreviateCastingTime(value: string | undefined): string | undefined {
  if (!value) return value;
  return capitalize(
    value
      .replace(/^1\s+(?=(?:bonus\s+)?action|reaction)/i, "")
      .replace(/\bbonus action\b/i, "Bonus")
      .replace(/\bminutes?\b/i, "min")
      .replace(/\bhours?\b/i, "hr"),
  );
}

/** The range column is ~41pt wide: "Self (15-foot cone)" → "Self (15-ft cone)". */
function abbreviateRange(value: string | undefined): string | undefined {
  return value?.replace(/-foot\b/gi, "-ft").replace(/\bfeet\b/gi, "ft");
}

/**
 * Equipment as one item per line; when the list is too long for the box it
 * falls back to a comma-separated paragraph before using the continuation page.
 */
function setEquipment(form: PdfForm, font: PDFFont, lines: string[]): ExportTextSection[] {
  if (lines.length === 0) return [];
  const field = getTextField(form, "EQUIPMENT");
  const box = field && getInnerBox(field);
  if (!box) return [];
  const asList = lines.map((line) => ({ title: sanitizeTextForPdf(line), body: "" }));
  const listLayout = layoutSectionsIntoBoxes(asList, [box], font, {
    maxSize: 9,
    minSize: 6,
    sectionGap: false,
  });
  if (listLayout.overflow.length === 0) {
    setText(form, "EQUIPMENT", listLayout.texts[0], {
      fontSize: listLayout.fontSize,
      allowEmpty: true,
    });
    return [];
  }
  const overflow = setSections(
    form,
    font,
    ["EQUIPMENT"],
    [{ title: "", body: lines.join(", ") }],
    { maxSize: 8, minSize: 6 },
  );
  return overflow.map((section) => ({ ...section, title: "Equipment (continued)" }));
}

function spellLevelLabel(level: number): string {
  return level === 0 ? "Cantrip" : `Level ${level}`;
}

function buildPersonalitySections(data: CharacterSheetExportData): ExportTextSection[] {
  const { personality } = data;
  const sections: ExportTextSection[] = [
    { title: "Alignment:", body: data.alignment ?? "" },
    { title: "Trait:", body: personality.trait1 },
    { title: "Trait:", body: personality.trait2 },
    { title: "Ideal:", body: personality.ideal },
    { title: "Bond:", body: personality.bond },
    { title: "Flaw:", body: personality.flaw },
  ].filter((section) => section.body?.trim());
  if (personality.notes?.trim()) {
    sections.push({ title: "Backstory:", body: personality.notes });
  }
  return sections;
}

export async function exportCharacterSheetPdf(
  data: CharacterSheetExportData,
): Promise<Uint8Array> {
  const response = await fetch(TEMPLATE_URL);
  if (!response.ok) {
    throw new Error("Could not load the character sheet template.");
  }

  const templateBytes = await response.arrayBuffer();
  const { PDFDocument, StandardFonts } = await import("pdf-lib");
  const pdfDoc = await PDFDocument.load(templateBytes);
  const form = pdfDoc.getForm();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const continuation: ContinuationGroup[] = [];

  setText(form, "Name", data.name);
  setText(form, "Species", data.species);
  setText(form, "Background", data.background);
  setText(form, "Class", data.className);
  setText(form, "Subclass", data.subclass);
  setText(form, "Level", data.level);
  setText(form, "XP Points", data.xp);
  setText(form, "SIZE", data.size);
  setText(form, "SPEED", data.speed);
  setText(form, "init", data.initiative);
  setText(form, "PASSIVE PERCEPTION", data.passivePerception);
  setText(form, "PROF BONUS", `+${data.proficiencyBonus}`);
  setText(form, "Armor Class", data.armorClass);
  setText(form, "Max HP", data.maxHp);
  setText(form, "Max HD", data.hitDice);

  const abilities = data.abilities;
  setText(form, "STR SCORE", abilities.str.score);
  setText(form, "STR MOD", abilities.str.mod);
  setText(form, "DEX SCORE", abilities.dex.score);
  setText(form, "DEX MOD", abilities.dex.mod);
  setText(form, "CON SCORE", abilities.con.score);
  setText(form, "CON MOD", abilities.con.mod);
  setText(form, "INT SCORE", abilities.int.score);
  setText(form, "INT MOD", abilities.int.mod);
  setText(form, "WIS SCORE", abilities.wis.score);
  setText(form, "WIS MOD", abilities.wis.mod);
  setText(form, "CHA SCORE", abilities.cha.score);
  setText(form, "CHA MOD", abilities.cha.mod);

  const saveMap: Record<string, string> = {
    STR: "STR SAVE",
    DEX: "DEX SAVE",
    CON: "CON SAVE",
    INT: "INT SAVE",
    WIS: "Text Field71", // PDF field for WIS saving throw (non-standard name)
    CHA: "CHA SAVE",
  };
  for (const [key, field] of Object.entries(saveMap)) {
    setText(form, field, data.savingThrows[key]);
  }

  const skillMap: Record<string, string> = {
    acr: "ACROBATICS",
    ani: "ANIMAL HANDLING",
    arc: "ARCANA",
    ath: "ATHLETICS",
    dec: "DECEPTION",
    his: "HISTORY",
    ins: "INSIGHT",
    itm: "INTIMIDATE",
    inv: "INVESTIGATION",
    med: "MEDICINE",
    nat: "NATURE",
    prc: "PERCEPTION",
    prf: "PERFORMANCE",
    per: "PERSUASION",
    rel: "RELIGION",
    slt: "SLEIGHT OF HAND",
    ste: "STEALTH",
    sur: "SURVIVAL",
  };
  for (const [key, field] of Object.entries(skillMap)) {
    setText(form, field, data.skills[key]);
  }

  // Skill proficiency checkboxes (the circle "O" next to each skill/save)
  const SKILL_PROF_CHECKBOXES: Record<string, string> = {
    acr: "Check Box8",   ath: "Check Box19",  slt: "Check Box9",   ste: "Check Box10",
    ani: "Check Box15",  ins: "Check Box13",  med: "Check Box12",  prc: "Check Box14",
    sur: "Check Box16",  arc: "Check Box24",  his: "Check Box20",  inv: "Check Box21",
    nat: "Check Box22",  rel: "Check Box23",  dec: "Check Box5",   itm: "Check Box4",
    per: "Check Box2",   prf: "Check Box3",
  };
  const SAVE_PROF_CHECKBOXES: Record<string, string> = {
    str: "Check Box18",  dex: "Check Box11",  con: "Check Box7",
    int: "Check Box25",  wis: "Check Box17",  cha: "Check Box6",
  };
  if (data.skillProficiencies) {
    for (const [key, proficient] of Object.entries(data.skillProficiencies)) {
      const cbName = SKILL_PROF_CHECKBOXES[key];
      if (cbName) setCheckbox(form, cbName, proficient);
    }
  }
  if (data.saveProficiencies) {
    for (const [key, proficient] of Object.entries(data.saveProficiencies)) {
      const cbName = SAVE_PROF_CHECKBOXES[key];
      if (cbName) setCheckbox(form, cbName, proficient);
    }
  }

  setFittedText(form, font, "LANGUAGES", data.languages, { maxSize: 10, minSize: 6 });
  setFittedText(form, font, "WEAPON PROF", data.weaponProficiencies, { maxSize: 10, minSize: 6 });
  setFittedText(form, font, "TOOL PROF", data.toolProficiencies, { maxSize: 10, minSize: 6 });
  if (data.armorTrainingProficiencies) {
    for (const [category, checked] of Object.entries(data.armorTrainingProficiencies)) {
      const cbName =
        PDF_ARMOR_TRAINING_CHECKBOXES[category as ArmorTrainingCategory];
      if (cbName) setCheckbox(form, cbName, checked);
    }
  }

  const classOverflow = setSections(
    form,
    font,
    ["CLASS FEATURES 1", "CLASS FEATURES 2"],
    data.classFeatures,
    { maxSize: 7 },
  );
  const speciesOverflow = setSections(form, font, ["SPECIES TRAITS"], data.speciesTraits, {
    maxSize: 7,
  });
  const featOverflow = setSections(form, font, ["FEATS"], data.feats, { maxSize: 7 });
  const equipmentOverflow = setEquipment(form, font, data.equipment);
  const personalityOverflow = setSections(
    form,
    font,
    ["PERSONALITY"],
    buildPersonalitySections(data),
    { maxSize: 8, sectionGap: false },
  );

  setCheckbox(form, "shield chk", data.hasShield);
  setText(form, "GP", data.goldPieces);

  clearWeaponRows(form);
  data.weapons.slice(0, 6).forEach((weapon, index) => {
    const n = index + 1;
    const range = { maxSize: 8, minSize: 5 };
    setSingleLineText(form, font, `NAME - WEAPON ${n}`, weapon.name, range);
    setSingleLineText(form, font, `BONUS/DC - WEAPON ${n}`, weapon.attackBonus, range);
    setSingleLineText(form, font, `DAMAGE/TYPE - WEAPON ${n}`, weapon.damage, range);
    setSingleLineText(form, font, `NOTES - WEAPON ${n}`, weapon.notes, range);
  });

  data.spells.slice(0, PDF_SPELL_ROWS.length).forEach((spell, index) => {
    const row = PDF_SPELL_ROWS[index];
    const range = { maxSize: 8, minSize: 4 };
    setSingleLineText(form, font, `SPELL NAME${row.fieldIndex}`, spell.name, range);
    setSingleLineText(form, font, `SPELL LEVEL${row.fieldIndex}`, String(spell.level), range);
    setSingleLineText(form, font, `RANGE${row.fieldIndex}`, abbreviateRange(spell.range), range);
    setSingleLineText(
      form,
      font,
      `CASTING TIME${row.fieldIndex}`,
      abbreviateCastingTime(spell.castingTime),
      range,
    );
    setSingleLineText(form, font, `SPELL NOTES${row.fieldIndex}`, spell.notes, range);
    setCheckbox(form, row.c, spell.isConcentration);
    setCheckbox(form, row.r, spell.isRitual);
    setCheckbox(form, row.m, spell.hasMaterial);
  });

  if (data.spellcastingAbility) {
    setText(form, "SPELLCASTING ABILITY", data.spellcastingAbility);
    setText(form, "SPELLCASTING MOD", data.spellcastingMod);
    setText(form, "SPELL SAVE DC", data.spellSaveDc);
    setText(form, "SPELL ATTACK BONUS", data.spellAttackBonus);
  }

  if (data.spellSlotTotals) {
    for (let level = 1; level <= 9; level++) {
      const total = data.spellSlotTotals[level];
      if (total) setText(form, `LVL${level} TOTAL`, total);
    }
  }

  // ─── Continuation page content ───
  continuation.push(
    { heading: "Class Features", sections: classOverflow },
    { heading: "Species Traits", sections: speciesOverflow },
    { heading: "Feats", sections: featOverflow },
    {
      heading: "Weapons & Damage Cantrips",
      sections: data.weapons.slice(6).map((weapon) => ({
        title: weapon.name,
        body: [weapon.attackBonus, weapon.damage, weapon.notes]
          .filter(Boolean)
          .join(" | "),
      })),
    },
    {
      heading: "Spells",
      sections: data.spells.slice(PDF_SPELL_ROWS.length).map((spell) => ({
        title: `${spell.name} (${spellLevelLabel(spell.level)})`,
        body: [
          spell.castingTime,
          spell.range,
          spell.isConcentration && "Concentration",
          spell.isRitual && "Ritual",
          spell.hasMaterial && "Material",
          spell.notes,
        ]
          .filter(Boolean)
          .join(" | "),
      })),
    },
    { heading: "Equipment", sections: equipmentOverflow },
    { heading: "Personality & Backstory", sections: personalityOverflow },
  );

  // Regenerate appearance streams so viewers show the same text when focused
  // and unfocused (avoids "blank field on click" with long multiline content).
  form.updateFieldAppearances(font);

  // Set the portrait after appearance regeneration so the button image is not
  // overwritten by the text appearance provider.
  await setPortrait(pdfDoc, form, data.portraitImage);

  await appendContinuationPages(pdfDoc, {
    characterName: data.name,
    groups: continuation,
    regular: font,
    bold: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
  });

  return pdfDoc.save();
}

export function downloadPdf(bytes: Uint8Array, filename: string) {
  const copy = new Uint8Array(bytes);
  const blob = new Blob([copy], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  // Revoking synchronously can cancel the download in some mobile browsers.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
