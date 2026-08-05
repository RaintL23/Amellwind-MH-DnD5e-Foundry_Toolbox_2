import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useBookSourceNames } from "@/shared/hooks/useBookSourceNames";
import { useSourceCatalog } from "@/shared/hooks/useSourceCatalog";
import { useDebouncedListSearch } from "@/shared/hooks/useDebouncedListSearch";
import { useListSessionFilters } from "@/shared/hooks/useListSessionFilters";
import { useListItemUrlParam } from "@/shared/hooks/useListItemUrlParam";
import {
  buildSourcesFilterSection,
  entityMatchesSourceFilter,
} from "@/shared/utils/compendium-source-filter.utils";
import { defaultOfficialSourceCodes } from "@/shared/services/source-catalog.service";

const INACTIVE_URL_PARAM = "__compendium_list_inactive__";

export interface CompendiumNamedEntity {
  id: string;
  name: string;
  source: string;
  variantSources?: string[];
}

export interface CompendiumListLoadResult<T> {
  all: T[];
  list: T[];
  filterSourceCodes: string[];
  loadedSources?: string[];
}

export interface CompendiumListSessionConfig {
  listId: string;
  stringKeys?: readonly string[];
  multiKeys: readonly string[];
  urlPreserveKeys?: readonly string[];
}

export interface CompendiumListUrlDialogConfig<T extends CompendiumNamedEntity> {
  paramKey: string;
  getVariantsByName: (name: string) => Promise<T[]>;
}

export interface UseCompendiumListPageOptions<T extends CompendiumNamedEntity> {
  session: CompendiumListSessionConfig;
  load: () => Promise<CompendiumListLoadResult<T>>;
  ensureSourcesLoaded?: (
    selectedSources: string[],
    ctx: { loadedSources: string[] | undefined },
  ) => Promise<boolean | void>;
  sourceFilterKey?: string;
  urlDialog?: CompendiumListUrlDialogConfig<T>;
}

export interface CompendiumListDialogState<T> {
  selected: T | null;
  selectedVariants: T[];
  dialogOpen: boolean;
  openItem: (item: T) => void;
  handleDialogOpenChange: (open: boolean) => void;
}

function useInactiveListItemUrlParam(activeKey: string | undefined) {
  const { value, setValue } = useListItemUrlParam(
    activeKey ?? INACTIVE_URL_PARAM,
  );
  if (!activeKey) {
    return { value: null as string | null, setValue: (_next: string | null) => {} };
  }
  return { value, setValue };
}

/**
 * Shared compendium list page state: data load, session filters, debounced
 * search, default official sources, lazy UA/source loading, and optional URL
 * dialog sync.
 */
export function useCompendiumListPage<T extends CompendiumNamedEntity>(
  options: UseCompendiumListPageOptions<T>,
) {
  const {
    session,
    load,
    ensureSourcesLoaded,
    sourceFilterKey = "src",
    urlDialog,
  } = options;

  // Callers typically pass inline `load` / `urlDialog` / `ensureSourcesLoaded`.
  // Keep the latest via refs so dependency-driven effects do not re-fire every
  // render (which previously caused an infinite load → setState → freeze).
  const loadRef = useRef(load);
  loadRef.current = load;
  const ensureSourcesLoadedRef = useRef(ensureSourcesLoaded);
  ensureSourcesLoadedRef.current = ensureSourcesLoaded;
  const urlDialogRef = useRef(urlDialog);
  urlDialogRef.current = urlDialog;

  const [all, setAll] = useState<T[]>([]);
  const [list, setList] = useState<T[]>([]);
  const [filterSourceCodes, setFilterSourceCodes] = useState<string[]>([]);
  const [loadedSources, setLoadedSources] = useState<string[] | undefined>(
    undefined,
  );
  const [loading, setLoading] = useState(true);

  const [selected, setSelected] = useState<T | null>(null);
  const [selectedVariants, setSelectedVariants] = useState<T[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  const bookNames = useBookSourceNames();
  const catalog = useSourceCatalog();

  const dialogParamKey = urlDialog?.paramKey;
  const sessionPreserveKey = (session.urlPreserveKeys ?? []).join("\0");

  const urlPreserveKeys = useMemo(() => {
    const keys = sessionPreserveKey
      ? sessionPreserveKey.split("\0")
      : [];
    if (dialogParamKey && !keys.includes(dialogParamKey)) {
      keys.push(dialogParamKey);
    }
    return keys;
  }, [sessionPreserveKey, dialogParamKey]);

  const { q, getString, getAll, patchFilters, ensureMultiIfEmpty } =
    useListSessionFilters({
      listId: session.listId,
      stringKeys: session.stringKeys,
      multiKeys: session.multiKeys,
      urlPreserveKeys,
    });

  const { value: urlParamValue, setValue: setUrlParamValue } =
    useInactiveListItemUrlParam(dialogParamKey);

  const sourceFilter = getAll(sourceFilterKey);

  const refresh = useCallback(async () => {
    const result = await loadRef.current();
    setAll(result.all);
    setList(result.list);
    setFilterSourceCodes(result.filterSourceCodes);
    if (result.loadedSources !== undefined) {
      setLoadedSources(result.loadedSources);
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  useEffect(() => {
    if (
      sourceFilter.length > 0 ||
      catalog.size === 0 ||
      filterSourceCodes.length === 0
    ) {
      return;
    }
    const defaults = defaultOfficialSourceCodes(filterSourceCodes, catalog);
    if (defaults.length === 0) return;
    ensureMultiIfEmpty(sourceFilterKey, defaults);
  }, [
    catalog,
    filterSourceCodes,
    sourceFilter.length,
    ensureMultiIfEmpty,
    sourceFilterKey,
  ]);

  useEffect(() => {
    const ensure = ensureSourcesLoadedRef.current;
    if (!ensure || sourceFilter.length === 0) return;
    void ensure(sourceFilter, { loadedSources }).then((changed) => {
      if (changed) void refresh();
    });
  }, [sourceFilter, loadedSources, refresh]);

  const commitSearch = useCallback(
    (nextQ: string) => patchFilters({ q: nextQ }),
    [patchFilters],
  );
  const {
    searchDraft,
    setSearchDraft,
    appliedSearch,
    isSearchPending,
  } = useDebouncedListSearch(q, commitSearch);

  const sourceSection = useMemo(
    () => buildSourcesFilterSection(filterSourceCodes, catalog, bookNames),
    [filterSourceCodes, catalog, bookNames],
  );

  const matchesSourceFilter = useCallback(
    (entity: T, selectedSources: string[]) =>
      entityMatchesSourceFilter(entity, selectedSources, catalog, bookNames),
    [catalog, bookNames],
  );

  const openItem = useCallback(
    (item: T) => {
      const dialog = urlDialogRef.current;
      if (!dialog) return;
      setSelected(item);
      setDialogOpen(true);
      setUrlParamValue(item.name);
      void dialog.getVariantsByName(item.name).then(setSelectedVariants);
    },
    [setUrlParamValue],
  );

  useEffect(() => {
    const dialog = urlDialogRef.current;
    if (!dialog) return;
    if (!urlParamValue) {
      setDialogOpen(false);
      setSelected(null);
      setSelectedVariants([]);
      return;
    }
    if (loading) return;

    const decoded = decodeURIComponent(urlParamValue);
    const found =
      list.find((item) => item.name.toLowerCase() === decoded.toLowerCase()) ??
      all.find((item) => item.name.toLowerCase() === decoded.toLowerCase());
    if (!found || (selected?.name === found.name && dialogOpen)) return;

    setSelected(found);
    setDialogOpen(true);
    void dialog.getVariantsByName(found.name).then(setSelectedVariants);
  }, [
    urlParamValue,
    loading,
    list,
    all,
    selected?.name,
    dialogOpen,
  ]);

  const handleDialogOpenChange = useCallback(
    (open: boolean) => {
      setDialogOpen(open);
      if (!open) {
        setSelected(null);
        setSelectedVariants([]);
        if (urlDialogRef.current) setUrlParamValue(null);
      }
    },
    [setUrlParamValue],
  );

  const dialog: CompendiumListDialogState<T> | undefined = urlDialog
    ? {
        selected,
        selectedVariants,
        dialogOpen,
        openItem,
        handleDialogOpenChange,
      }
    : undefined;

  return {
    all,
    list,
    filterSourceCodes,
    loadedSources,
    loading,
    refresh,
    bookNames,
    catalog,
    q,
    getString,
    getAll,
    patchFilters,
    ensureMultiIfEmpty,
    sourceFilter,
    sourceSection,
    matchesSourceFilter,
    searchDraft,
    setSearchDraft,
    appliedSearch,
    isSearchPending,
    dialog,
  };
}
