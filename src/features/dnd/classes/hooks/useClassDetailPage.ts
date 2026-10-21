import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Class, ClassFeatureEntry } from "@/shared/types";
import { useBookSourceNames } from "@/shared/hooks/useBookSourceNames";
import { useListItemUrlParam } from "@/shared/hooks/useListItemUrlParam";
import { readListSessionState } from "@/shared/utils/list-session-storage.utils";
import { mergeProgressionWithSubclass, mergeClassTableGroups } from "../mappers/class.mapper";
import {
  ensureClassUaSourcesLoaded,
  findSubclassSourcesForClass,
  getAllClasses,
  getClassesByName,
  getUnloadedSubclassSourceCodes,
} from "../services/class.service";
import {
  sortClassVariants,
} from "../utils/class-dedupe.utils";
import { subclassesForClassVariant } from "../utils/class-subclass.utils";
import {
  getAllFeatureUids,
  toggleHiddenFeature,
} from "../utils/class-feature-selection.utils";
import {
  getFieldsThatVaryAcrossVariants,
  type ClassVariantField,
} from "../utils/class-variant.utils";
import { collectClassOptionalFeatureProgressions } from "../utils/class-optional-feature-browse.utils";

function classListSourceFilterFromSession(): string[] {
  const raw = readListSessionState("classes");
  const src = raw?.src;
  return Array.isArray(src)
    ? src.filter((item): item is string => typeof item === "string")
    : [];
}

/** `SOURCE::Name` → SOURCE; bare names return null. */
function sourceFromEntityId(id: string): string | null {
  const decoded = decodeURIComponent(id);
  const sep = decoded.indexOf("::");
  if (sep <= 0) return null;
  const source = decoded.slice(0, sep).trim();
  return source || null;
}

/** "Add source" picker state: on-demand sources that hold subclasses of this class. */
export interface SubclassSourceControls {
  /** Whether the Add source button should render at all. */
  visible: boolean;
  /** Unloaded sources with at least one subclass of the viewed class. */
  codes: string[];
  /** Source code → number of subclasses of the viewed class. */
  counts: ReadonlyMap<string, number>;
  scanProgress: { done: number; total: number } | null;
  loadingLabel: string | null;
  /** Starts the (cached) background scan the first time it is called per class. */
  onOpen: () => void;
  onLoad: (codes: string[], label: string) => void;
}

type SubclassScanState = "idle" | "scanning" | "done";

export function useClassDetailPage(classId: string) {
  const navigate = useNavigate();
  const { value: urlSubclass, setValue: setUrlSubclass } =
    useListItemUrlParam("subclass");
  const urlSubclassRef = useRef(urlSubclass);
  urlSubclassRef.current = urlSubclass;

  const [cls, setCls] = useState<Class | null>(null);
  const [resolvedVariants, setResolvedVariants] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [subclassEnsureDone, setSubclassEnsureDone] = useState(false);
  const [unloadedSubclassSources, setUnloadedSubclassSources] = useState<
    string[]
  >([]);
  const [loadingSubclassSource, setLoadingSubclassSource] = useState<
    string | null
  >(null);
  const [subclassMatches, setSubclassMatches] = useState<
    ReadonlyMap<string, number>
  >(() => new Map());
  const [scanState, setScanState] = useState<SubclassScanState>("idle");
  const [scanProgress, setScanProgress] = useState<{
    done: number;
    total: number;
  } | null>(null);
  const scanTokenRef = useRef(0);

  const [activeId, setActiveId] = useState("");
  const [activeSubclassId, setActiveSubclassId] = useState("");
  const [hiddenFeatureUids, setHiddenFeatureUids] = useState<Set<string>>(
    () => new Set(),
  );
  const bookNames = useBookSourceNames();

  useEffect(() => {
    if (!classId) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    setSubclassEnsureDone(false);

    const sources = new Set(classListSourceFilterFromSession());
    const classSource = sourceFromEntityId(classId);
    if (classSource) sources.add(classSource);
    const initialSubclass = urlSubclassRef.current;
    const subclassSource = initialSubclass
      ? sourceFromEntityId(initialSubclass)
      : null;
    if (subclassSource) sources.add(subclassSource);

    void (async () => {
      if (sources.size > 0) {
        await ensureClassUaSourcesLoaded([...sources]);
      }
      const classes = await getAllClasses();
      if (cancelled) return;
      const decoded = decodeURIComponent(classId);
      const found =
        classes.find((c) => c.id === classId || c.id === decoded) ??
        sortClassVariants(
          classes.filter(
            (c) => c.name.toLowerCase() === decoded.toLowerCase(),
          ),
        )[0];
      if (!found) {
        setNotFound(true);
        setCls(null);
        setResolvedVariants([]);
        return;
      }
      setCls(found);
      setActiveId(found.id);
      setSubclassEnsureDone(true);
    })().finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [classId]);

  useEffect(() => {
    if (!cls) {
      setResolvedVariants([]);
      return;
    }
    let cancelled = false;
    void getClassesByName(cls.name).then((byName) => {
      if (cancelled) return;
      const sorted =
        byName.length > 0 ? sortClassVariants(byName) : [cls];
      setResolvedVariants(sorted);
    });
    return () => {
      cancelled = true;
    };
  }, [cls]);

  useEffect(() => {
    if (!urlSubclass || loading || !cls) {
      if (!urlSubclass) setSubclassEnsureDone(true);
      return;
    }

    const subclassSource = sourceFromEntityId(urlSubclass);
    if (!subclassSource) {
      setSubclassEnsureDone(true);
      return;
    }

    let cancelled = false;
    setSubclassEnsureDone(false);
    void ensureClassUaSourcesLoaded([
      ...classListSourceFilterFromSession(),
      subclassSource,
    ]).then(async (changed) => {
      if (cancelled) return;
      if (changed) {
        const byName = await getClassesByName(cls.name);
        if (cancelled) return;
        setResolvedVariants(
          byName.length > 0 ? sortClassVariants(byName) : [cls],
        );
      }
      setSubclassEnsureDone(true);
    });

    return () => {
      cancelled = true;
    };
  }, [urlSubclass, loading, cls]);

  useEffect(() => {
    if (!cls) return;
    let cancelled = false;
    void getUnloadedSubclassSourceCodes().then((codes) => {
      if (!cancelled) setUnloadedSubclassSources(codes);
    });
    return () => {
      cancelled = true;
    };
  }, [cls]);

  // A different class invalidates any scan results and in-flight scan.
  const className = cls?.name;
  useEffect(() => {
    scanTokenRef.current++;
    setSubclassMatches(new Map());
    setScanState("idle");
    setScanProgress(null);
  }, [className]);

  const variants = resolvedVariants;

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

  useEffect(() => {
    if (loading || !subclassEnsureDone || !cls) return;

    if (!urlSubclass) {
      if (activeSubclassId) setActiveSubclassId("");
      return;
    }

    // Wait until same-name variants (and attached subclasses) are resolved.
    if (resolvedVariants.length === 0) return;

    const decoded = decodeURIComponent(urlSubclass);
    const match =
      variantSubclasses.find(
        (s) => s.id === urlSubclass || s.id === decoded,
      ) ?? null;

    if (match) {
      if (activeSubclassId !== match.id) setActiveSubclassId(match.id);
      return;
    }

    setActiveSubclassId("");
    setUrlSubclass(null);
  }, [
    loading,
    subclassEnsureDone,
    cls,
    urlSubclass,
    resolvedVariants.length,
    variantSubclasses,
    activeSubclassId,
    setUrlSubclass,
  ]);

  const activeSubclass = useMemo(() => {
    if (!activeSubclassId) return null;
    return variantSubclasses.find((s) => s.id === activeSubclassId) ?? null;
  }, [variantSubclasses, activeSubclassId]);

  const mergedTableGroups = useMemo(() => {
    if (!active) return [];
    return mergeClassTableGroups(active.spellProgression, activeSubclass);
  }, [active, activeSubclass]);

  const mergedProgression = useMemo(() => {
    if (!active) return [];
    return mergeProgressionWithSubclass(
      active.progression,
      activeSubclass,
      mergedTableGroups,
    );
  }, [active, activeSubclass, mergedTableGroups]);

  const allFeatureUids = useMemo(
    () => getAllFeatureUids(mergedProgression),
    [mergedProgression],
  );

  useEffect(() => {
    setHiddenFeatureUids(new Set());
  }, [allFeatureUids]);

  const toggleFeatureVisibility = useCallback(
    (uid: string) => {
      setHiddenFeatureUids((prev) =>
        toggleHiddenFeature(prev, uid, allFeatureUids),
      );
    },
    [allFeatureUids],
  );

  const showFeature = useCallback((uid: string) => {
    setHiddenFeatureUids((prev) => {
      if (!prev.has(uid)) return prev;
      const next = new Set(prev);
      next.delete(uid);
      return next;
    });
  }, []);

  const showAllFeatures = useCallback(() => {
    setHiddenFeatureUids(new Set());
  }, []);

  const handleSourceSelect = useCallback(
    (id: string) => {
      setActiveId(id);
      setActiveSubclassId("");
      setUrlSubclass(null);
      navigate(`/classes/${encodeURIComponent(id)}`, { replace: true });
    },
    [navigate, setUrlSubclass],
  );

  const handleSubclassSelect = useCallback(
    (id: string) => {
      setActiveSubclassId(id);
      setUrlSubclass(id || null);
    },
    [setUrlSubclass],
  );

  const handleLoadSubclassSource = useCallback(
    async (codes: string[], label: string) => {
      if (!cls || !active) return;
      const activeVariantId = active.id;
      setLoadingSubclassSource(label);
      try {
        await ensureClassUaSourcesLoaded(codes);
        const byName = await getClassesByName(cls.name);
        const sorted = byName.length > 0 ? sortClassVariants(byName) : [cls];
        setResolvedVariants(sorted);

        const variant = sorted.find((v) => v.id === activeVariantId);
        const added = variant
          ? subclassesForClassVariant(variant).filter((s) =>
              codes.includes(s.source),
            )
          : [];
        if (added.length > 0) {
          toast.success(
            `Loaded ${added.length} ${cls.name} subclass${added.length === 1 ? "" : "es"} from ${label}`,
          );
        } else {
          toast.info(`${label} has no ${cls.name} subclasses for this version`);
        }
      } catch {
        toast.error(`Could not load ${label}`);
      } finally {
        setLoadingSubclassSource(null);
        setUnloadedSubclassSources(await getUnloadedSubclassSourceCodes());
      }
    },
    [cls, active],
  );

  const scanSubclassSources = useCallback(() => {
    if (!cls || scanState !== "idle" || unloadedSubclassSources.length === 0) {
      return;
    }
    const token = ++scanTokenRef.current;
    setScanState("scanning");
    setScanProgress({ done: 0, total: unloadedSubclassSources.length });
    void findSubclassSourcesForClass(
      cls.name,
      unloadedSubclassSources,
      (matches, done, total) => {
        if (token !== scanTokenRef.current) return;
        setSubclassMatches(matches);
        setScanProgress({ done, total });
      },
      () => token !== scanTokenRef.current,
    ).then(() => {
      if (token !== scanTokenRef.current) return;
      setScanState("done");
      setScanProgress(null);
    });
  }, [cls, scanState, unloadedSubclassSources]);

  const subclassSources = useMemo(
    (): SubclassSourceControls => {
      const codes = unloadedSubclassSources.filter((code) =>
        subclassMatches.has(code),
      );
      return {
        visible:
          loadingSubclassSource != null ||
          codes.length > 0 ||
          (unloadedSubclassSources.length > 0 && scanState !== "done"),
        codes,
        counts: subclassMatches,
        scanProgress,
        loadingLabel: loadingSubclassSource,
        onOpen: scanSubclassSources,
        onLoad: handleLoadSubclassSource,
      };
    },
    [
      unloadedSubclassSources,
      subclassMatches,
      scanState,
      scanProgress,
      loadingSubclassSource,
      scanSubclassSources,
      handleLoadSubclassSource,
    ],
  );

  const varyingFields = useMemo(
    () => getFieldsThatVaryAcrossVariants(variants),
    [variants],
  );

  const differs = useMemo(() => {
    const set = new Set(varyingFields);
    return (field: ClassVariantField) => set.has(field);
  }, [varyingFields]);

  const visibleFeatures = useMemo(() => {
    const features: ClassFeatureEntry[] = [];
    for (const row of mergedProgression) {
      for (const feature of row.features) {
        if (!hiddenFeatureUids.has(feature.uid)) {
          features.push(feature);
        }
      }
    }
    return features;
  }, [mergedProgression, hiddenFeatureUids]);

  const optionalFeatureProgressions = useMemo(
    () => collectClassOptionalFeatureProgressions(active, activeSubclass),
    [active, activeSubclass],
  );

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
    mergedTableGroups,
    hiddenFeatureUids,
    visibleFeatures,
    totalFeatureCount: allFeatureUids.length,
    activeSubclass,
    optionalFeatureProgressions,
    activeSubclassId,
    toggleFeatureVisibility,
    showFeature,
    showAllFeatures,
    handleSourceSelect,
    handleSubclassSelect,
    subclassSources,
  };
}
