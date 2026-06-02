import type {
  SpellClassLookupValue,
  SpellSourceLookup,
  SpellSourceLookupEntry,
} from "./spell-lookup.types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RawSpell = Record<string, any>;

function getOrSetClassesList(spell: RawSpell, prop: string): RawSpell[] {
  if (!spell.classes) spell.classes = {};
  if (!Array.isArray(spell.classes[prop])) spell.classes[prop] = [];
  return spell.classes[prop] as RawSpell[];
}

/**
 * Mirrors 5etools `DataUtil.spell._mutEntity` / `_mutSpell_class` so spells from
 * spells-*.json get `classes.fromClassList`, `fromClassListVariant`, and `fromSubclass`.
 */
export function mutateSpellFromLookup(spell: RawSpell, lookup: SpellSourceLookup): RawSpell {
  const entry = lookup[spell.source?.toLowerCase()]?.[spell.name?.toLowerCase()];
  if (!entry) return spell;

  mutateSpellClass(spell, entry, "class", "fromClassList");
  mutateSpellClass(spell, entry, "classVariant", "fromClassListVariant");
  mutateSpellSubclass(spell, entry);

  return spell;
}

function mutateSpellClass(
  spell: RawSpell,
  entry: SpellSourceLookupEntry,
  propSources: "class" | "classVariant",
  propClasses: "fromClassList" | "fromClassListVariant",
): void {
  const sources = entry[propSources];
  if (!sources) return;

  const tgt = getOrSetClassesList(spell, propClasses);

  for (const [classSource, nameTo] of Object.entries(sources)) {
    for (const [name, val] of Object.entries(nameTo)) {
      if (tgt.some((it) => it.name === name && it.source === classSource)) continue;

      const toAdd: RawSpell = { name, source: classSource };

      if (val === true) {
        tgt.push(toAdd);
        continue;
      }

      if (val.definedInSource) {
        toAdd.definedInSource = val.definedInSource;
        tgt.push(toAdd);
        continue;
      }

      if (val.definedInSources) {
        for (const definedInSource of val.definedInSources) {
          const copy = { ...toAdd };
          if (definedInSource != null) copy.definedInSource = definedInSource;
          tgt.push(copy);
        }
        continue;
      }

      tgt.push(toAdd);
    }
  }
}

function mutateSpellSubclass(spell: RawSpell, entry: SpellSourceLookupEntry): void {
  if (!entry.subclass) return;

  const tgt = getOrSetClassesList(spell, "fromSubclass");

  for (const [classSource, classNameTo] of Object.entries(entry.subclass)) {
    for (const [className, sourceTo] of Object.entries(classNameTo)) {
      for (const [subclassSource, nameTo] of Object.entries(sourceTo)) {
        for (const [shortName, val] of Object.entries(nameTo)) {
          if (val === true) continue;

          const exists = tgt.some(
            (it) =>
              it.class?.name === className &&
              it.class?.source === classSource &&
              it.subclass?.name === val.name &&
              it.subclass?.source === subclassSource &&
              ((it.subclass?.subSubclass == null && !val.subSubclasses?.length) ||
                val.subSubclasses?.includes(it.subclass?.subSubclass)),
          );
          if (exists) continue;

          const toAdd: RawSpell = {
            class: { name: className, source: classSource },
            subclass: {
              name: val.name,
              shortName,
              source: subclassSource,
            },
          };

          if (!val.subSubclasses?.length) {
            tgt.push(toAdd);
            continue;
          }

          for (const subSubclass of val.subSubclasses) {
            tgt.push({
              ...toAdd,
              subclass: { ...toAdd.subclass, subSubclass },
            });
          }
        }
      }
    }
  }
}
