/**
 * Source codes (XPHB, TCE, UA…, brew) a build depends on, read from catalog
 * ids and selection `source` fields. Used for `meta.sources` on export and to
 * load on-demand UA/brew catalogs before an import resolves its refs.
 *
 * Id formats differ by catalog: classes, subclasses and spells use
 * `SOURCE::Name`; species, races, backgrounds and feats use `Name::SOURCE`.
 */
import type { CharacterSelectionRef } from "@/shared/types";
import type { BuilderPersistedBuild } from "../storage/builder-autosave.storage";

const SOURCE_CODE = /^[A-Za-z0-9][\w-]*$/;

function idPart(id: string | undefined | null, index: 0 | 1): string | null {
  const part = id?.split("::")[index]?.trim();
  return part && SOURCE_CODE.test(part) ? part : null;
}

/** `SOURCE::Name` (classes, subclasses, spells, optional features). */
export function sourceFromLeadingId(id: string | undefined | null): string | null {
  return idPart(id, 0);
}

/** `Name::SOURCE[::Parent]` (species, races, backgrounds, feats). */
export function sourceFromTrailingId(id: string | undefined | null): string | null {
  return idPart(id, 1);
}

export function collectBuildSources(build: BuilderPersistedBuild): string[] {
  const codes = new Set<string>();
  const add = (code: string | null | undefined) => {
    if (code && SOURCE_CODE.test(code)) codes.add(code);
  };
  const addTrailingRef = (ref: CharacterSelectionRef | null) => {
    add(sourceFromTrailingId(ref?.id));
    add(sourceFromTrailingId(ref?.subraceId));
  };

  const { identity, multiclass, snapshot } = build;
  add(sourceFromLeadingId(identity.class?.id));
  add(sourceFromLeadingId(identity.subclass?.id));
  for (const entry of multiclass.enabled ? multiclass.entries : []) {
    add(sourceFromLeadingId(entry.classRef?.id));
    add(sourceFromLeadingId(entry.subclass?.id));
  }
  addTrailingRef(identity.species);
  addTrailingRef(identity.background);

  for (const feat of [
    ...snapshot.featSelections,
    snapshot.speciesOriginFeat,
    snapshot.backgroundOriginFeat,
    ...snapshot.optionalFeatureOriginFeats,
  ]) {
    if (feat && feat.source !== "asi") add(sourceFromTrailingId(feat.id));
  }
  for (const picks of Object.values(snapshot.optionalFeatureSelections)) {
    for (const pick of picks) add(pick?.source);
  }
  for (const spells of Object.values(snapshot.spellSelections)) {
    for (const spell of spells) add(spell.source);
  }

  return [...codes].sort();
}
