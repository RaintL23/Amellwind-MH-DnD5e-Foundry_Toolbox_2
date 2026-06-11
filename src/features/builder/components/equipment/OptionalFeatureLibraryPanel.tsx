import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, Wand2, X } from "lucide-react";
import type { Class, DndOptionalFeature, Subclass } from "@/shared/types";
import type {
  BuilderOptionalFeatureSelection,
  BuilderOptionalFeatureSelections,
  BuilderOptionalFeatureSlot,
} from "@/shared/types";
import { BuilderPanel } from "../shared/BuilderPanel";
import { ScrollableWhenNeeded } from "../shared/ScrollableWhenNeeded";
import { cn } from "@/shared/utils/cn";
import { getAllDndOptionalFeatures } from "@/features/dnd-optionalfeatures/services/dnd-optionalfeature.service";
import {
  collectOptionPoolRefs,
  dndOptionalFeatureToSelection,
  filterCatalogForProgression,
  getProgressionPicks,
  parseOptionalFeatureSlot,
  type ResolvedOptionalFeatureProgression,
} from "../../utils/class-optional-features.utils";
import {
  getPrerequisiteSummary,
  isOptionalFeatureAvailable,
} from "../../utils/optional-feature-prerequisites.utils";

interface OptionalFeatureLibraryPanelProps {
  selectedSlot: BuilderOptionalFeatureSlot;
  progressions: ResolvedOptionalFeatureProgression[];
  classData: Class;
  subclass: Subclass | null;
  level: number;
  selections: BuilderOptionalFeatureSelections;
  onSetSelections: (
    progressionId: string,
    picks: BuilderOptionalFeatureSelection[],
  ) => void;
}

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function OptionalFeatureLibraryPanel({
  selectedSlot,
  progressions,
  classData,
  subclass,
  level,
  selections,
  onSetSelections,
}: OptionalFeatureLibraryPanelProps) {
  const parsed = parseOptionalFeatureSlot(selectedSlot);
  const [catalog, setCatalog] = useState<DndOptionalFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const activeProgression = useMemo(() => {
    if (!parsed) return null;
    return (
      progressions.find((p) => p.progression.id === parsed.progressionId) ??
      null
    );
  }, [parsed, progressions]);

  useEffect(() => {
    setSearch("");
  }, [selectedSlot]);

  useEffect(() => {
    setLoading(true);
    getAllDndOptionalFeatures()
      .then(setCatalog)
      .finally(() => setLoading(false));
  }, []);

  const picked = useMemo(() => {
    if (!parsed) return [];
    return getProgressionPicks(selections, parsed.progressionId);
  }, [parsed, selections]);

  const slotCount = activeProgression?.slotCount ?? 0;
  const atCapacity = picked.length >= slotCount;

  const catalogOptions = useMemo(() => {
    if (!activeProgression || !parsed) return [];
    const poolRefs = collectOptionPoolRefs(classData, subclass, level);
    return filterCatalogForProgression(
      catalog,
      poolRefs,
      activeProgression.progression.featureTypes,
    );
  }, [activeProgression, parsed, catalog, classData, subclass, level]);

  const q = search.trim().toLowerCase();
  const filteredOptions = useMemo(() => {
    if (!q) return catalogOptions;
    return catalogOptions.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.entries.some((e) => e.toLowerCase().includes(q)),
    );
  }, [catalogOptions, q]);

  const isPicked = useCallback(
    (feature: DndOptionalFeature) =>
      picked.some((p) => normalizeName(p.name) === normalizeName(feature.name)),
    [picked],
  );

  const canAdd = useCallback(
    (feature: DndOptionalFeature) => {
      if (isPicked(feature)) return true;
      if (atCapacity) return false;
      return isOptionalFeatureAvailable(feature, {
        className: classData.name,
        classLevel: level,
        selectedFeatures: picked,
        progressionId: parsed!.progressionId,
      });
    },
    [isPicked, atCapacity, classData.name, level, picked, parsed],
  );

  const handleToggle = useCallback(
    (feature: DndOptionalFeature) => {
      if (!parsed) return;

      if (isPicked(feature)) {
        onSetSelections(
          parsed.progressionId,
          picked.filter(
            (p) => normalizeName(p.name) !== normalizeName(feature.name),
          ),
        );
        return;
      }

      if (atCapacity) return;
      if (
        !isOptionalFeatureAvailable(feature, {
          className: classData.name,
          classLevel: level,
          selectedFeatures: picked,
          progressionId: parsed.progressionId,
        })
      ) {
        return;
      }

      onSetSelections(parsed.progressionId, [
        ...picked,
        dndOptionalFeatureToSelection(feature, parsed.progressionId),
      ]);
    },
    [
      parsed,
      isPicked,
      atCapacity,
      picked,
      onSetSelections,
      classData.name,
      level,
    ],
  );

  const handleRemove = useCallback(
    (selection: BuilderOptionalFeatureSelection) => {
      if (!parsed) return;
      onSetSelections(
        parsed.progressionId,
        picked.filter((p) => p.id !== selection.id),
      );
    },
    [parsed, picked, onSetSelections],
  );

  const handleClearAll = useCallback(() => {
    if (!parsed) return;
    onSetSelections(parsed.progressionId, []);
  }, [parsed, onSetSelections]);

  if (!parsed || !activeProgression) {
    return (
      <BuilderPanel title="Optional Features">
        <p className="text-xs italic text-muted-foreground">
          Selecciona un slot de optional feature.
        </p>
      </BuilderPanel>
    );
  }

  return (
    <BuilderPanel
      title={
        <>
          <Wand2 className="h-3.5 w-3.5" aria-hidden />
          {activeProgression.progression.name}
        </>
      }
      action={
        picked.length > 0 ? (
          <button
            type="button"
            onClick={handleClearAll}
            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" />
            Quitar todas
          </button>
        ) : (
          <span className="text-[11px] text-muted-foreground">
            {picked.length}/{slotCount} elegidas
          </span>
        )
      }
    >
      <p className="mb-2 text-[11px] text-muted-foreground">
        <span
          className={cn(
            "font-medium tabular-nums",
            atCapacity ? "text-amber-300" : "text-emerald-400",
          )}
        >
          {picked.length}/{slotCount}
        </span>{" "}
        opciones elegidas · elige de la lista (crece con tu nivel)
      </p>

      {picked.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {picked.map((selection) => (
            <button
              key={selection.id}
              type="button"
              onClick={() => handleRemove(selection)}
              className="inline-flex items-center gap-1 rounded-md border border-violet-700/50 bg-violet-950/30 px-1.5 py-0.5 text-[10px] text-violet-200 hover:border-rose-600/50 hover:bg-rose-950/30 hover:text-rose-200"
              title="Quitar"
            >
              {selection.name}
              <X className="h-2.5 w-2.5" />
            </button>
          ))}
        </div>
      )}

      <div className="relative mb-2">
        <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Buscar ${activeProgression.progression.name.toLowerCase()}…`}
          className="h-8 w-full rounded-md border border-border/70 bg-background/60 pl-7 pr-2 text-xs"
        />
      </div>

      <ScrollableWhenNeeded className="max-h-[1200px]">
        {loading ? (
          <p className="py-4 text-center text-xs text-muted-foreground">
            Cargando opciones…
          </p>
        ) : filteredOptions.length === 0 ? (
          <p className="py-4 text-center text-xs italic text-muted-foreground">
            No hay opciones en el catálogo para esta progresión.
          </p>
        ) : (
          <ul className="space-y-1">
            {filteredOptions.map((feature) => {
              const selected = isPicked(feature);
              const addable = canAdd(feature);
              const prereq = getPrerequisiteSummary(feature);
              return (
                <li key={feature.id}>
                  <button
                    type="button"
                    disabled={!selected && !addable}
                    onClick={() => handleToggle(feature)}
                    className={cn(
                      "w-full rounded-md border px-2 py-1.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-45",
                      selected
                        ? "border-violet-500/60 bg-violet-950/30"
                        : addable
                          ? "border-border/60 hover:border-violet-500/40 hover:bg-muted/30"
                          : "border-border/40 bg-muted/10",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-foreground">
                        {feature.name}
                      </span>
                      <span className="shrink-0 text-[9px] text-muted-foreground">
                        {selected ? "Elegida" : feature.source}
                      </span>
                    </div>
                    {prereq && !selected && (
                      <p className="mt-0.5 text-[10px] text-amber-300/80">
                        {prereq}
                      </p>
                    )}
                    {feature.entries[0] && (
                      <p className="mt-0.5 line-clamp-2 text-[10px] text-muted-foreground">
                        {feature.entries[0]}
                      </p>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </ScrollableWhenNeeded>
    </BuilderPanel>
  );
}
