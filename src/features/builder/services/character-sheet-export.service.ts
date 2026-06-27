import type { PDFDocument } from "pdf-lib";
import type { CharacterSheetExportData } from "../utils/character-sheet-export.types";
import {
  estimatePdfFontSize,
  PDF_ARMOR_TRAINING_CHECKBOXES,
  sanitizeTextForPdf,
  type ArmorTrainingCategory,
} from "../utils/character-sheet-export.utils";

const TEMPLATE_URL = "/character-sheet/dnd-2024-character-sheet.pdf";

type SetTextOptions = {
  fontSize?: number;
  autoFit?: { maxSize: number; minSize: number };
  disableScroll?: boolean;
  /** When true, writes an empty string to clear template placeholder values. */
  allowEmpty?: boolean;
};

function applyFieldFontSize(
  field: ReturnType<ReturnType<PDFDocument["getForm"]>["getTextField"]>,
  fontSize: number,
) {
  field.setFontSize(fontSize);
  for (const widget of field.acroField.getWidgets()) {
    const da = widget.getDefaultAppearance();
    if (da) {
      const patched = da.replace(/\d+(?:\.\d+)?\s+Tf/, `${fontSize} Tf`);
      if (patched !== da) widget.setDefaultAppearance(patched);
    }
  }
}

function setText(
  form: ReturnType<PDFDocument["getForm"]>,
  fieldName: string,
  value: string | number | undefined | null,
  options?: number | SetTextOptions,
) {
  if (value === undefined || value === null) return;

  const opts: SetTextOptions =
    typeof options === "number" ? { fontSize: options } : (options ?? {});
  const text = sanitizeTextForPdf(String(value));
  if (!text && !opts.allowEmpty) return;

  try {
    const field = form.getTextField(fieldName);

    if (opts.disableScroll && field.isMultiline() && field.isScrollable()) {
      field.disableScrolling();
    }

    let fontSize = opts.fontSize;
    if (opts.autoFit && text) {
      const widget = field.acroField.getWidgets()[0];
      const rect = widget?.getRectangle();
      if (rect) {
        fontSize = estimatePdfFontSize(
          text,
          rect.width,
          rect.height,
          field.isMultiline(),
          opts.autoFit.maxSize,
          opts.autoFit.minSize,
        );
      }
    }

    if (fontSize !== undefined) {
      applyFieldFontSize(field, fontSize);
    }

    field.setText(text);
  } catch {
    /* field may not exist on all template revisions */
  }
}

function clearWeaponRows(form: ReturnType<PDFDocument["getForm"]>) {
  for (let n = 1; n <= 6; n++) {
    for (const suffix of ["NAME", "BONUS/DC", "DAMAGE/TYPE", "NOTES"]) {
      setText(form, `${suffix} - WEAPON ${n}`, "", { allowEmpty: true });
    }
  }
}

function setCheckbox(
  form: ReturnType<PDFDocument["getForm"]>,
  fieldName: string,
  checked: boolean | undefined,
) {
  if (!checked) return;
  try {
    form.getCheckBox(fieldName).check();
  } catch {
    /* field may not exist on all template revisions */
  }
}

export async function exportCharacterSheetPdf(
  data: CharacterSheetExportData,
): Promise<Uint8Array> {
  const response = await fetch(TEMPLATE_URL);
  if (!response.ok) {
    throw new Error("No se pudo cargar la plantilla de la hoja de personaje.");
  }

  const templateBytes = await response.arrayBuffer();
  const { PDFDocument, StandardFonts } = await import("pdf-lib");
  const pdfDoc = await PDFDocument.load(templateBytes);
  const form = pdfDoc.getForm();

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

  setText(form, "LANGUAGES", data.languages, 12);
  setText(form, "WEAPON PROF", data.weaponProficiencies);
  if (data.armorTrainingProficiencies) {
    for (const [category, checked] of Object.entries(data.armorTrainingProficiencies)) {
      const cbName =
        PDF_ARMOR_TRAINING_CHECKBOXES[category as ArmorTrainingCategory];
      if (cbName) setCheckbox(form, cbName, checked);
    }
  }
  setText(form, "TOOL PROF", data.toolProficiencies);
  setText(form, "FEATS", data.feats, {
    autoFit: { maxSize: 7, minSize: 4 },
    disableScroll: true,
  });
  setText(form, "CLASS FEATURES 1", data.classFeatures, {
    autoFit: { maxSize: 7, minSize: 4 },
    disableScroll: true,
  });
  setText(form, "CLASS FEATURES 2", data.classFeatures2, {
    autoFit: { maxSize: 7, minSize: 4 },
    disableScroll: true,
  });
  setText(form, "SPECIES TRAITS", data.speciesTraits, {
    autoFit: { maxSize: 7, minSize: 4 },
    disableScroll: true,
  });
  setText(form, "EQUIPMENT", data.equipment, {
    autoFit: { maxSize: 12, minSize: 6 },
    disableScroll: true,
  });
  setCheckbox(form, "shield chk", data.hasShield);
  setCheckbox(form, data.alignmentCheckbox ?? "", true);
  setText(form, "GP", data.goldPieces);

  data.attunementSlots.forEach((slot, index) => {
    setText(form, `ATTUNMENT ${index + 1}`, slot);
  });

  clearWeaponRows(form);

  data.weapons.slice(0, 6).forEach((weapon, index) => {
    const n = index + 1;
    setText(form, `NAME - WEAPON ${n}`, weapon.name, {
      autoFit: { maxSize: 8, minSize: 5 },
    });
    setText(form, `BONUS/DC - WEAPON ${n}`, weapon.attackBonus, {
      autoFit: { maxSize: 8, minSize: 5 },
    });
    setText(form, `DAMAGE/TYPE - WEAPON ${n}`, weapon.damage, {
      autoFit: { maxSize: 8, minSize: 5 },
    });
    setText(form, `NOTES - WEAPON ${n}`, weapon.notes, {
      autoFit: { maxSize: 8, minSize: 5 },
    });
  });

  // C / R / M checkboxes per spell row, ordered top-to-bottom (index 0–28).
  const SPELL_C_CHECKBOXES = [
    "Check Box0",   "Check Box64",  "Check Box67",  "Check Box70",  "Check Box73",
    "Check Box76",  "Check Box79",  "Check Box85",  "Check Box82",  "Check Box88",
    "Check Box91",  "Check Box94",  "Check Box97",  "Check Box100", "Check Box103",
    "Check Box106", "Check Box109", "Check Box112", "Check Box115", "Check Box118",
    "Check Box121", "Check Box124", "Check Box127", "Check Box130", "Check Box133",
    "Check Box136", "Check Box139", "Check Box142", "Check Box145",
  ] as const;
  const SPELL_R_CHECKBOXES = [
    "Check Box59",  "Check Box65",  "Check Box68",  "Check Box71",  "Check Box74",
    "Check Box77",  "Check Box80",  "Check Box86",  "Check Box83",  "Check Box89",
    "Check Box92",  "Check Box95",  "Check Box98",  "Check Box101", "Check Box104",
    "Check Box107", "Check Box110", "Check Box113", "Check Box116", "Check Box119",
    "Check Box122", "Check Box125", "Check Box128", "Check Box131", "Check Box134",
    "Check Box137", "Check Box140", "Check Box143", "Check Box146",
  ] as const;
  const SPELL_M_CHECKBOXES = [
    "Check Box60",  "Check Box66",  "Check Box69",  "Check Box72",  "Check Box75",
    "Check Box78",  "Check Box81",  "Check Box87",  "Check Box84",  "Check Box90",
    "Check Box93",  "Check Box96",  "Check Box99",  "Check Box102", "Check Box105",
    "Check Box108", "Check Box111", "Check Box114", "Check Box117", "Check Box120",
    "Check Box123", "Check Box126", "Check Box129", "Check Box132", "Check Box135",
    "Check Box138", "Check Box141", "Check Box144", "Check Box147",
  ] as const;

  data.spells.slice(0, 29).forEach((spell, index) => {
    setText(form, `SPELL NAME${index}`, spell.name);
    setText(form, `SPELL LEVEL${index}`, spell.level);
    setText(form, `RANGE${index}`, spell.range);
    setText(form, `CASTING TIME${index}`, spell.castingTime);
    setText(form, `SPELL NOTES${index}`, spell.materialNotes);
    setCheckbox(form, SPELL_C_CHECKBOXES[index], spell.isConcentration);
    setCheckbox(form, SPELL_R_CHECKBOXES[index], spell.isRitual);
    setCheckbox(form, SPELL_M_CHECKBOXES[index], spell.hasMaterial);
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

  const personalityLines = [
    data.personality.trait1 && `Trait 1: ${data.personality.trait1}`,
    data.personality.trait2 && `Trait 2: ${data.personality.trait2}`,
    data.personality.ideal && `Ideal: ${data.personality.ideal}`,
    data.personality.bond && `Bond: ${data.personality.bond}`,
    data.personality.flaw && `Flaw: ${data.personality.flaw}`,
    data.personality.notes,
  ]
    .filter(Boolean)
    .join("\n");
  setText(form, "PERSONALITY", personalityLines, {
    autoFit: { maxSize: 8, minSize: 5 },
    disableScroll: true,
  });

  // Regenerate appearance streams so viewers show the same text when focused
  // and unfocused (avoids "blank field on click" with long multiline content).
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  form.updateFieldAppearances(font);

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
  URL.revokeObjectURL(url);
}
