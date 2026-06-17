import type { PDFDocument } from "pdf-lib";
import type { CharacterSheetExportData } from "../utils/character-sheet-export.types";
import {
  sanitizeTextForPdf,
  getClassFeaturesFontSize,
} from "../utils/character-sheet-export.utils";

const TEMPLATE_URL = "/character-sheet/dnd-2024-character-sheet.pdf";

function setText(
  form: ReturnType<PDFDocument["getForm"]>,
  fieldName: string,
  value: string | number | undefined | null,
  fontSize?: number,
) {
  if (value === undefined || value === null || value === "") return;
  try {
    const field = form.getTextField(fieldName);
    if (fontSize !== undefined) {
      // Update the field-level DA (AcroField)
      field.setFontSize(fontSize);
      // Also patch each widget's own /DA (widget-level DA takes precedence
      // over the field-level DA in PDF spec, so we must update both)
      for (const widget of field.acroField.getWidgets()) {
        const da = widget.getDefaultAppearance();
        if (da) {
          const patched = da.replace(/\d+(?:\.\d+)?\s+Tf/, `${fontSize} Tf`);
          if (patched !== da) widget.setDefaultAppearance(patched);
        }
      }
    }
    field.setText(sanitizeTextForPdf(String(value)));
  } catch {
    /* field may not exist on all template revisions */
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
  const { PDFDocument } = await import("pdf-lib");
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
    WIS: "WIS SAVE",
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

  setText(form, "LANGUAGES", data.languages, 12);
  setText(form, "WEAPON PROF", data.weaponProficiencies);
  setText(form, "ARMOR", data.armorProficiencies);
  setText(form, "TOOL PROF", data.toolProficiencies);
  setText(form, "FEATS", data.feats);
  const cfFontSize = getClassFeaturesFontSize(
    data.classFeatures ?? "",
    data.classFeatures2 ?? "",
  );
  setText(form, "CLASS FEATURES 1", data.classFeatures, cfFontSize);
  setText(form, "CLASS FEATURES 2", data.classFeatures2, cfFontSize);
  setText(form, "SPECIES TRAITS", data.speciesTraits);
  setText(form, "EQUIPMENT", data.equipment, 12);
  setCheckbox(form, "shield chk", data.hasShield);
  setCheckbox(form, data.alignmentCheckbox ?? "", true);
  setText(form, "GP", data.goldPieces);

  data.attunementSlots.forEach((slot, index) => {
    setText(form, `ATTUNMENT ${index + 1}`, slot);
  });

  data.weapons.slice(0, 6).forEach((weapon, index) => {
    const n = index + 1;
    setText(form, `NAME - WEAPON ${n}`, weapon.name);
    setText(form, `BONUS/DC - WEAPON ${n}`, weapon.attackBonus);
    setText(form, `DAMAGE/TYPE - WEAPON ${n}`, weapon.damage);
    setText(form, `NOTES - WEAPON ${n}`, weapon.notes);
  });

  data.spells.slice(0, 29).forEach((spell, index) => {
    setText(form, `SPELL NAME${index}`, spell.name);
    setText(form, `SPELL LEVEL${index}`, spell.level);
    setText(form, `RANGE${index}`, spell.range);
    setText(form, `CASTING TIME${index}`, spell.castingTime);
    setText(form, `SPELL NOTES${index}`, spell.notes);
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
  setText(form, "PERSONALITY", personalityLines);

  form.flatten();
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
