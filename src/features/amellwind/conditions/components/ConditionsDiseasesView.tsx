/**
 * Conditions & Diseases page body shared by Amellwind MH and D&D 5e:
 * debounced search, tabs, tables and URL-driven detail dialogs
 * (`?condition=` / `?disease=`). Pages only supply data and header copy.
 */
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { AlertTriangle, Biohazard, type LucideIcon } from "lucide-react";
import type { MhCondition, MhDisease } from "@/shared/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClearableSearchInput } from "@/shared/components/list-filters";
import { ConditionEntryDataTable } from "@/shared/components/ConditionEntryDataTable";
import {
  DeferredListResults,
  ListEmptyState,
} from "@/shared/components/DeferredListResults";
import { useDebouncedListSearch } from "@/shared/hooks/useDebouncedListSearch";
import { useListItemUrlParam } from "@/shared/hooks/useListItemUrlParam";
import { useListSessionFilters } from "@/shared/hooks/useListSessionFilters";
import { cn } from "@/shared/utils/cn";
import { DiseaseDetailDialog } from "@/features/amellwind/diseases/components/DiseaseDetailDialog";
import { ConditionDetailDialog } from "./ConditionDetailDialog";

interface NamedEntry {
  name: string;
  summary: string;
}

export function matchesNameOrSummary(item: NamedEntry, query: string): boolean {
  return (
    item.name.toLowerCase().includes(query) ||
    item.summary.toLowerCase().includes(query)
  );
}

function findByName<T extends NamedEntry>(items: T[], name: string | null) {
  if (!name) return null;
  const key = name.toLowerCase();
  return items.find((item) => item.name.toLowerCase() === key) ?? null;
}

const getDiseaseBadge = () => "Disease";

function CountTabTrigger({
  value,
  icon: Icon,
  iconClassName,
  label,
  count,
}: {
  value: string;
  icon: LucideIcon;
  iconClassName: string;
  label: string;
  count: number | null;
}) {
  return (
    <TabsTrigger value={value}>
      <Icon className={cn("h-3.5 w-3.5", iconClassName)} />
      {label}
      {count !== null && (
        <span className="ml-1.5 rounded-full bg-muted-foreground/20 px-1.5 py-0.5 text-[10px]">
          {count}
        </span>
      )}
    </TabsTrigger>
  );
}

interface ConditionsDiseasesViewProps<
  C extends MhCondition,
  D extends MhDisease,
> {
  listId: string;
  /** Must be a stable reference (module-level function). */
  load: () => Promise<[C[], D[]]>;
  description: ReactNode;
  notice?: ReactNode;
  /** Text color for the condition icon in the header and tab. */
  conditionAccentClassName: string;
  /** Must be a stable reference. */
  getConditionBadge: (item: C) => string;
  /** Must be a stable reference; `query` is trimmed and lowercased. */
  matchesCondition?: (item: C, query: string) => boolean;
}

export function ConditionsDiseasesView<
  C extends MhCondition,
  D extends MhDisease,
>({
  listId,
  load,
  description,
  notice,
  conditionAccentClassName,
  getConditionBadge,
  matchesCondition = matchesNameOrSummary,
}: ConditionsDiseasesViewProps<C, D>) {
  const { q, patchFilters } = useListSessionFilters({
    listId,
    stringKeys: ["q"],
    multiKeys: [],
    urlPreserveKeys: ["condition", "disease"],
  });
  const { value: urlCondition, setValue: setUrlCondition } =
    useListItemUrlParam("condition");
  const { value: urlDisease, setValue: setUrlDisease } =
    useListItemUrlParam("disease");
  const [conditions, setConditions] = useState<C[]>([]);
  const [diseases, setDiseases] = useState<D[]>([]);
  const [loading, setLoading] = useState(true);
  const commitSearch = useCallback(
    (nextQ: string) => patchFilters({ q: nextQ }),
    [patchFilters],
  );
  const { searchDraft, setSearchDraft, appliedSearch, isSearchPending } =
    useDebouncedListSearch(q, commitSearch);
  const [tab, setTab] = useState(urlDisease ? "diseases" : "conditions");

  useEffect(() => {
    load()
      .then(([c, d]) => {
        setConditions(c);
        setDiseases(d);
      })
      .finally(() => setLoading(false));
  }, [load]);

  useEffect(() => {
    if (urlDisease) setTab("diseases");
    else if (urlCondition) setTab("conditions");
  }, [urlCondition, urlDisease]);

  const selectedCondition = useMemo(
    () => findByName(conditions, urlCondition),
    [conditions, urlCondition],
  );
  const selectedDisease = useMemo(
    () => findByName(diseases, urlDisease),
    [diseases, urlDisease],
  );

  const query = appliedSearch.trim().toLowerCase();
  const filteredConditions = useMemo(
    () =>
      query
        ? conditions.filter((item) => matchesCondition(item, query))
        : conditions,
    [conditions, query, matchesCondition],
  );
  const filteredDiseases = useMemo(
    () =>
      query
        ? diseases.filter((item) => matchesNameOrSummary(item, query))
        : diseases,
    [diseases, query],
  );

  const openCondition = useCallback(
    (item: C) => {
      setUrlDisease(null);
      setUrlCondition(item.name);
    },
    [setUrlCondition, setUrlDisease],
  );
  const openDisease = useCallback(
    (item: D) => {
      setUrlCondition(null);
      setUrlDisease(item.name);
    },
    [setUrlCondition, setUrlDisease],
  );

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 border-b border-border px-6 py-5">
        <div className="flex items-center gap-3 mb-1">
          <AlertTriangle className={cn("h-6 w-6", conditionAccentClassName)} />
          <Biohazard className="h-5 w-5 text-purple-400" />
          <h1 className="text-xl font-bold text-foreground">
            Conditions &amp; Diseases
          </h1>
        </div>
        <p className="text-sm text-muted-foreground max-w-3xl">{description}</p>
        {notice}
      </div>

      <Tabs
        value={tab}
        onValueChange={setTab}
        className="flex flex-1 min-h-0 flex-col"
      >
        <div className="shrink-0 flex flex-wrap items-center gap-3 border-b border-border bg-card/50 px-6 py-3">
          <ClearableSearchInput
            value={searchDraft}
            onChange={setSearchDraft}
            placeholder="Search conditions or diseases..."
            compact
            className="max-w-xs"
            inputClassName="h-8 text-sm"
          />
          <TabsList>
            <CountTabTrigger
              value="conditions"
              icon={AlertTriangle}
              iconClassName={conditionAccentClassName}
              label="Conditions"
              count={loading ? null : filteredConditions.length}
            />
            <CountTabTrigger
              value="diseases"
              icon={Biohazard}
              iconClassName="text-purple-400"
              label="Diseases"
              count={loading ? null : filteredDiseases.length}
            />
          </TabsList>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <TabsContent value="conditions">
            <DeferredListResults
              loading={loading}
              updating={isSearchPending}
              isEmpty={filteredConditions.length === 0}
              empty={
                <ListEmptyState
                  icon={AlertTriangle}
                  message="No conditions found."
                />
              }
            >
              <ConditionEntryDataTable
                entries={filteredConditions}
                tone="condition"
                getBadge={getConditionBadge}
                onRowClick={openCondition}
              />
            </DeferredListResults>
          </TabsContent>

          <TabsContent value="diseases">
            <DeferredListResults
              loading={loading}
              updating={isSearchPending}
              isEmpty={filteredDiseases.length === 0}
              empty={
                <ListEmptyState icon={Biohazard} message="No diseases found." />
              }
            >
              <ConditionEntryDataTable
                entries={filteredDiseases}
                tone="disease"
                getBadge={getDiseaseBadge}
                onRowClick={openDisease}
              />
            </DeferredListResults>
          </TabsContent>
        </div>
      </Tabs>

      {selectedCondition && (
        <ConditionDetailDialog
          condition={selectedCondition}
          open
          onOpenChange={(open) => {
            if (!open) setUrlCondition(null);
          }}
        />
      )}
      {selectedDisease && (
        <DiseaseDetailDialog
          disease={selectedDisease}
          open
          onOpenChange={(open) => {
            if (!open) setUrlDisease(null);
          }}
        />
      )}
    </div>
  );
}
