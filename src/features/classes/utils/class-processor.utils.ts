import {
  DEFAULT_CLASS_SOURCE,
  type RawClassDefinition,
  type RawClassFeature,
  type RawSubclassDefinition,
  type RawSubclassFeature,
  type ResolvedFeature,
} from "./class-raw.types";
import {
  classFeatureKey,
  classIdentityKey,
  subclassDefKey,
  subclassFeatureKey,
  unpackClassFeatureUid,
  unpackSubclassFeatureUid,
} from "./class-uids.utils";
import {
  collectDirectRefSubclassFeatureUids,
  resolveFeatureEntries,
} from "./class-feature-entries.utils";

/** Expand 5etools `_copy` stubs (e.g. XPHB links to PHB subclass data). */
export function resolveSubclassCopies(
  subclasses: RawSubclassDefinition[],
): RawSubclassDefinition[] {
  const index = new Map<string, RawSubclassDefinition>();
  for (const sc of subclasses) {
    index.set(subclassDefKey(sc), sc);
  }

  return subclasses.map((sc) => {
    if (!sc._copy) return sc;

    const ref = sc._copy as unknown as RawSubclassDefinition;
    const base = index.get(subclassDefKey(ref));
    if (!base) return sc;

    const { _copy: _ignored, ...overrides } = sc;
    const merged: RawSubclassDefinition = {
      ...base,
      ...overrides,
      classSource: overrides.classSource ?? sc.classSource ?? base.classSource,
      subclassFeatures:
        overrides.subclassFeatures ?? base.subclassFeatures,
      additionalSpells:
        overrides.additionalSpells ?? base.additionalSpells,
      subclassTableGroups:
        overrides.subclassTableGroups ?? base.subclassTableGroups,
    };
    delete merged._copy;
    return merged;
  });
}

function matchClassFeature(
  index: Map<string, RawClassFeature>,
  uid: string,
): RawClassFeature | undefined {
  const u = unpackClassFeatureUid(uid);
  if (Number.isNaN(u.level)) return undefined;
  return index.get(
    classFeatureKey({
      name: u.name,
      className: u.className,
      classSource: u.classSource,
      level: u.level,
      source: u.source,
    }),
  );
}

function matchSubclassFeature(
  index: Map<string, RawSubclassFeature>,
  uid: string,
): RawSubclassFeature | undefined {
  const u = unpackSubclassFeatureUid(uid);
  if (Number.isNaN(u.level)) return undefined;
  return index.get(
    subclassFeatureKey({
      name: u.name,
      className: u.className,
      classSource: u.classSource,
      subclassShortName: u.subclassShortName,
      subclassSource: u.subclassSource,
      level: u.level,
      source: u.source,
    }),
  );
}

export function buildClassFeatureIndex(
  features: RawClassFeature[],
): Map<string, RawClassFeature> {
  const map = new Map<string, RawClassFeature>();
  for (const f of features) {
    map.set(
      classFeatureKey({
        name: f.name,
        className: f.className,
        classSource: f.classSource || DEFAULT_CLASS_SOURCE,
        level: f.level,
        source: f.source,
      }),
      f,
    );
  }
  return map;
}

export function buildSubclassFeatureIndex(
  features: RawSubclassFeature[],
): Map<string, RawSubclassFeature> {
  const map = new Map<string, RawSubclassFeature>();
  for (const f of features) {
    map.set(
      subclassFeatureKey({
        name: f.name,
        className: f.className,
        classSource: f.classSource || DEFAULT_CLASS_SOURCE,
        subclassShortName: f.subclassShortName,
        subclassSource: f.subclassSource || DEFAULT_CLASS_SOURCE,
        level: f.level,
        source: f.source,
      }),
      f,
    );
  }
  return map;
}

function toResolvedFeature(
  feature: RawClassFeature | RawSubclassFeature,
  featureIndex: Map<string, RawClassFeature>,
  meta?: { gainSubclassFeature?: boolean; tableDisplayName?: string },
  subclassFeatureIndex?: Map<string, RawSubclassFeature>,
  skipRefSubclassFeature = false,
): ResolvedFeature {
  const classSource = feature.classSource || DEFAULT_CLASS_SOURCE;
  const rawEntries = feature.entries ?? [];
  const entries = resolveFeatureEntries(rawEntries, featureIndex, {
    subclassFeatureIndex,
    skipRefSubclassFeature,
  });
  return {
    name: feature.name,
    source: feature.source,
    className: feature.className,
    classSource,
    level: feature.level,
    entries,
    displayName: meta?.tableDisplayName ?? feature.name,
    gainSubclassFeature: meta?.gainSubclassFeature,
    tableDisplayName: meta?.tableDisplayName,
  };
}

function groupFeaturesByLevel(
  features: ResolvedFeature[],
  maxLevel = 20,
): ResolvedFeature[][] {
  const byLevel: Record<number, ResolvedFeature[]> = {};
  for (const f of features) {
    (byLevel[f.level] ??= []).push(f);
  }
  return Array.from({ length: maxLevel }, (_, i) => byLevel[i + 1] ?? []);
}

export function dereferenceClassFeatures(
  cls: RawClassDefinition,
  featureIndex: Map<string, RawClassFeature>,
): RawClassDefinition {
  const resolved: ResolvedFeature[] = [];

  for (const ref of cls.classFeatures ?? []) {
    const uid = typeof ref === "string" ? ref : ref.classFeature;
    const feature = matchClassFeature(featureIndex, uid);
    if (!feature) continue;

    const meta =
      typeof ref === "string"
        ? undefined
        : {
            gainSubclassFeature: ref.gainSubclassFeature,
            tableDisplayName: ref.tableDisplayName,
          };

    resolved.push(toResolvedFeature(feature, featureIndex, meta));
  }

  return {
    ...cls,
    classFeaturesByLevel: groupFeaturesByLevel(resolved),
  };
}

export function dereferenceSubclassFeatures(
  sc: RawSubclassDefinition,
  featureIndex: Map<string, RawSubclassFeature>,
) {
  const resolved: ResolvedFeature[] = [];
  const addedKeys = new Set<string>();

  const addResolvedFeature = (
    feature: RawSubclassFeature,
    meta?: { gainSubclassFeature?: boolean; tableDisplayName?: string },
    skipRefSubclassFeature = false,
  ) => {
    const key = subclassFeatureKey({
      name: feature.name,
      className: feature.className,
      classSource: feature.classSource || DEFAULT_CLASS_SOURCE,
      subclassShortName: feature.subclassShortName,
      subclassSource: feature.subclassSource || DEFAULT_CLASS_SOURCE,
      level: feature.level,
      source: feature.source,
    });
    if (addedKeys.has(key)) return;
    addedKeys.add(key);

    resolved.push(
      toResolvedFeature(
        feature,
        new Map(),
        meta,
        featureIndex,
        skipRefSubclassFeature,
      ),
    );
  };

  for (const ref of sc.subclassFeatures ?? []) {
    const uid = typeof ref === "string" ? ref : ref.subclassFeature;
    const feature = matchSubclassFeature(featureIndex, uid);
    if (!feature) continue;

    const meta =
      typeof ref === "string"
        ? undefined
        : {
            gainSubclassFeature: ref.gainSubclassFeature,
            tableDisplayName: ref.tableDisplayName,
          };

    addResolvedFeature(feature, meta, true);

    for (const childUid of collectDirectRefSubclassFeatureUids(
      feature.entries ?? [],
    )) {
      const child = matchSubclassFeature(featureIndex, childUid);
      if (child) addResolvedFeature(child);
    }
  }

  return {
    ...sc,
    subclassFeaturesByLevel: groupFeaturesByLevel(resolved),
  };
}

export function attachSubclasses(
  classes: RawClassDefinition[],
  subclasses: RawSubclassDefinition[],
  subclassFeatureIndex: Map<string, RawSubclassFeature>,
): RawClassDefinition[] {
  const byKey = new Map(
    classes.map((c) => [classIdentityKey(c.name, c.source), c]),
  );

  for (const sc of subclasses) {
    const parentKey = classIdentityKey(
      sc.className,
      sc.classSource || DEFAULT_CLASS_SOURCE,
    );
    const parent = byKey.get(parentKey);
    if (!parent) continue;

    const processed = dereferenceSubclassFeatures(sc, subclassFeatureIndex);
    (parent.subclasses ??= []).push(processed);
  }

  for (const cls of classes) {
    if (cls.subclasses) {
      cls.subclasses.sort((a, b) => a.name.localeCompare(b.name));
    }
  }

  return classes;
}

export function processAllClasses(
  classes: RawClassDefinition[],
  subclasses: RawSubclassDefinition[],
  classFeatures: RawClassFeature[],
  subclassFeatures: RawSubclassFeature[],
): RawClassDefinition[] {
  const classFeatureIndex = buildClassFeatureIndex(classFeatures);
  const subclassFeatureIndex = buildSubclassFeatureIndex(subclassFeatures);
  const resolvedSubclasses = resolveSubclassCopies(subclasses);

  let processed = classes.map((c) =>
    dereferenceClassFeatures(c, classFeatureIndex),
  );
  processed = attachSubclasses(
    processed,
    resolvedSubclasses,
    subclassFeatureIndex,
  );
  return processed;
}
