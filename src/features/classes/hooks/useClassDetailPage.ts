import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Class, ClassFeatureEntry } from "@/shared/types";
import {
  getBookSourceNames,
  type BookSourceNameMap,
} from "@/features/spells/services/book-source.service";
import { mergeProgressionWithSubclass } from "../mappers/class.mapper";
import { getAllClasses, getClassById } from "../services/class.service";
import {
  getClassesByName,
  sortClassVariants,
} from "../utils/class-dedupe.utils";
import { subclassesForClassVariant } from "../utils/class-subclass.utils";
import {
  getAllFeatureUids,
  nextFeatureSelection,
  setAllFeatureUids,
} from "../utils/class-feature-selection.utils";
import {
  getFieldsThatVaryAcrossVariants,
  type ClassVariantField,
} from "../utils/class-variant.utils";

export function useClassDetailPage(classId: string) {
  const navigate = useNavigate();

  const [cls, setCls] = useState<Class | null>(null);
  const [allClasses, setAllClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [activeId, setActiveId] = useState("");
  const [activeSubclassId, setActiveSubclassId] = useState("");
  const [enabledFeatureUids, setEnabledFeatureUids] = useState<Set<string>>(
    () => new Set(),
  );
  const [bookNames, setBookNames] = useState<BookSourceNameMap>({});

  useEffect(() => {
    if (!classId) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setNotFound(false);

    Promise.all([getClassById(classId), getAllClasses(), getBookSourceNames()])
      .then(([found, classes, names]) => {
        if (cancelled) return;
        if (!found) {
          setNotFound(true);
          setCls(null);
          return;
        }
        setCls(found);
        setAllClasses(classes);
        setBookNames(names);
        setActiveId(found.id);
        setActiveSubclassId("");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [classId]);

  const variants = useMemo(() => {
    if (!cls) return [];
    const byName = getClassesByName(allClasses, cls.name);
    return byName.length > 0 ? sortClassVariants(byName) : [cls];
  }, [cls, allClasses]);

  const active = useMemo(
    () =>
      variants.find((v) => v.id === activeId) ??
      variants.find((v) => v.id === classId) ??
      variants[0] ??
      cls,
    [variants, activeId, classId, cls],
  );

  const variantSubclasses = useMemo(() => {
    if (!active) return [];
    return subclassesForClassVariant(active);
  }, [active]);

  const activeSubclass = useMemo(() => {
    if (!activeSubclassId) return null;
    return variantSubclasses.find((s) => s.id === activeSubclassId) ?? null;
  }, [variantSubclasses, activeSubclassId]);

  const mergedProgression = useMemo(() => {
    if (!active) return [];
    return mergeProgressionWithSubclass(active.progression, activeSubclass);
  }, [active, activeSubclass]);

  const allFeatureUids = useMemo(
    () => getAllFeatureUids(mergedProgression),
    [mergedProgression],
  );

  useEffect(() => {
    setEnabledFeatureUids(setAllFeatureUids(allFeatureUids));
  }, [allFeatureUids]);

  const toggleFeature = useCallback(
    (uid: string) => {
      setEnabledFeatureUids((prev) =>
        nextFeatureSelection(prev, uid, allFeatureUids),
      );
    },
    [allFeatureUids],
  );

  const handleSourceSelect = useCallback(
    (id: string) => {
      setActiveId(id);
      setActiveSubclassId("");
      navigate(`/classes/${encodeURIComponent(id)}`, { replace: true });
    },
    [navigate],
  );

  const handleSubclassSelect = useCallback((id: string) => {
    setActiveSubclassId(id);
  }, []);

  const varyingFields = useMemo(
    () => getFieldsThatVaryAcrossVariants(variants),
    [variants],
  );

  const differs = useMemo(() => {
    const set = new Set(varyingFields);
    return (field: ClassVariantField) => set.has(field);
  }, [varyingFields]);

  const enabledFeatures = useMemo(() => {
    const features: ClassFeatureEntry[] = [];
    for (const row of mergedProgression) {
      for (const feature of row.features) {
        if (enabledFeatureUids.has(feature.uid)) {
          features.push(feature);
        }
      }
    }
    return features;
  }, [mergedProgression, enabledFeatureUids]);

  return {
    loading,
    notFound,
    cls,
    active,
    variants,
    variantSubclasses,
    bookNames,
    varyingFields,
    differs,
    mergedProgression,
    enabledFeatureUids,
    enabledFeatures,
    activeSubclassId,
    toggleFeature,
    handleSourceSelect,
    handleSubclassSelect,
  };
}
