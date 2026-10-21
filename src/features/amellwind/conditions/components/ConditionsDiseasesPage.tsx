import { ListAreaLoading } from "@/shared/components/ListAreaLoading";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { MhCondition } from "@/shared/types";
import type { MhDisease } from "@/shared/types";
import { useDebouncedListSearch } from "@/shared/hooks/useDebouncedListSearch";
import { useListItemUrlParam } from "@/shared/hooks/useListItemUrlParam";
import { useListSessionFilters } from "@/shared/hooks/useListSessionFilters";
import { ClearableSearchInput } from "@/shared/components/list-filters";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AlertTriangle, Biohazard } from "lucide-react";
import { getAllConditions } from "../services/condition.service";
import { getAllDiseases } from "@/features/amellwind/diseases/services/disease.service";
import { ConditionDetailDialog } from "./ConditionDetailDialog";
import { DiseaseDetailDialog } from "@/features/amellwind/diseases/components/DiseaseDetailDialog";
import { ConditionEntryDataTable } from "@/shared/components/ConditionEntryDataTable";
import { MhmmSourceNotice } from "@/shared/components/MhmmSourceNotice";

const getMhConditionBadge = () => "Blight / Condition";
const getMhDiseaseBadge = () => "Disease";

export function ConditionsDiseasesPage() {
  const { q, patchFilters } = useListSessionFilters({
    listId: "mh-conditions-diseases",
    stringKeys: ["q"],
    multiKeys: [],
    urlPreserveKeys: ["condition", "disease"],
  });
  const { value: urlCondition, setValue: setUrlCondition } =
    useListItemUrlParam("condition");
  const { value: urlDisease, setValue: setUrlDisease } =
    useListItemUrlParam("disease");
  const [conditions, setConditions] = useState<MhCondition[]>([]);
  const [diseases, setDiseases] = useState<MhDisease[]>([]);
  const [loading, setLoading] = useState(true);
  const commitSearch = useCallback(
    (nextQ: string) => patchFilters({ q: nextQ }),
    [patchFilters],
  );
  const { searchDraft, setSearchDraft, appliedSearch, isSearchPending } =
    useDebouncedListSearch(q, commitSearch);
  const [selectedCondition, setSelectedCondition] = useState<MhCondition | null>(null);
  const [selectedDisease, setSelectedDisease] = useState<MhDisease | null>(null);
  const [conditionDialogOpen, setConditionDialogOpen] = useState(false);
  const [diseaseDialogOpen, setDiseaseDialogOpen] = useState(false);
  const [tab, setTab] = useState(urlDisease ? "diseases" : "conditions");

  useEffect(() => {
    Promise.all([getAllConditions(), getAllDiseases()])
      .then(([c, d]) => {
        setConditions(c);
        setDiseases(d);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (urlDisease) setTab("diseases");
    else if (urlCondition) setTab("conditions");
  }, [urlCondition, urlDisease]);

  useEffect(() => {
    if (loading) return;
    if (!urlCondition) {
      setConditionDialogOpen(false);
      setSelectedCondition(null);
    } else {
      const found = conditions.find(
        (item) => item.name.toLowerCase() === urlCondition.toLowerCase(),
      );
      if (found) {
        setSelectedCondition(found);
        setConditionDialogOpen(true);
      }
    }
    if (!urlDisease) {
      setDiseaseDialogOpen(false);
      setSelectedDisease(null);
    } else {
      const found = diseases.find(
        (item) => item.name.toLowerCase() === urlDisease.toLowerCase(),
      );
      if (found) {
        setSelectedDisease(found);
        setDiseaseDialogOpen(true);
      }
    }
  }, [urlCondition, urlDisease, conditions, diseases, loading]);

  const filteredConditions = useMemo(() => {
    const q = appliedSearch.trim().toLowerCase();
    const result = q
      ? conditions.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.summary.toLowerCase().includes(q),
        )
      : conditions;
    return [...result].sort((a, b) => a.name.localeCompare(b.name));
  }, [conditions, appliedSearch]);

  const filteredDiseases = useMemo(() => {
    const q = appliedSearch.trim().toLowerCase();
    const result = q
      ? diseases.filter(
          (d) =>
            d.name.toLowerCase().includes(q) ||
            d.summary.toLowerCase().includes(q),
        )
      : diseases;
    return [...result].sort((a, b) => a.name.localeCompare(b.name));
  }, [diseases, appliedSearch]);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="shrink-0 border-b border-border px-6 py-5">
        <div className="flex items-center gap-3 mb-1">
          <AlertTriangle className="h-6 w-6 text-rose-400" />
          <Biohazard className="h-5 w-5 text-purple-400" />
          <h1 className="text-xl font-bold text-foreground">
            Conditions &amp; Diseases
          </h1>
        </div>
        <p className="text-sm text-muted-foreground max-w-3xl">
          Blight conditions, afflictions and infectious diseases from the{" "}
          <span className="text-foreground/80">Monster Hunter Monster Manual</span>{" "}
          (Conditions, Poisons, and Diseases chapter).
        </p>
        <MhmmSourceNotice className="mt-4" />
      </div>

      <Tabs
        value={tab}
        onValueChange={setTab}
        className="flex flex-1 min-h-0 flex-col"
      >
        {/* Search bar + tabs */}
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
            <TabsTrigger value="conditions">
              <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
              Conditions
              {!loading && (
                <span className="ml-1.5 rounded-full bg-muted-foreground/20 px-1.5 py-0.5 text-[10px]">
                  {filteredConditions.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="diseases">
              <Biohazard className="h-3.5 w-3.5 text-purple-400" />
              Diseases
              {!loading && (
                <span className="ml-1.5 rounded-full bg-muted-foreground/20 px-1.5 py-0.5 text-[10px]">
                  {filteredDiseases.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* Conditions tab */}
          <TabsContent value="conditions">
            {loading || isSearchPending ? (
              <ListAreaLoading />
            ) : filteredConditions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-2">
                <AlertTriangle className="h-10 w-10 opacity-20" />
                <p className="text-sm">No conditions found.</p>
              </div>
            ) : (
              <ConditionEntryDataTable
                entries={filteredConditions}
                tone="condition"
                getBadge={getMhConditionBadge}
                emptyMessage="No conditions found."
                onRowClick={(item) => {
                  setUrlDisease(null);
                  setUrlCondition(item.name);
                }}
              />
            )}
          </TabsContent>

          {/* Diseases tab */}
          <TabsContent value="diseases">
            {loading || isSearchPending ? (
              <ListAreaLoading />
            ) : filteredDiseases.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-2">
                <Biohazard className="h-10 w-10 opacity-20" />
                <p className="text-sm">No diseases found.</p>
              </div>
            ) : (
              <ConditionEntryDataTable
                entries={filteredDiseases}
                tone="disease"
                getBadge={getMhDiseaseBadge}
                emptyMessage="No diseases found."
                onRowClick={(item) => {
                  setUrlCondition(null);
                  setUrlDisease(item.name);
                }}
              />
            )}
          </TabsContent>
        </div>
      </Tabs>

      {conditionDialogOpen && selectedCondition && (
        <ConditionDetailDialog
          condition={selectedCondition}
          open={conditionDialogOpen}
          onOpenChange={(open) => {
            setConditionDialogOpen(open);
            if (!open) setUrlCondition(null);
          }}
        />
      )}
      {diseaseDialogOpen && selectedDisease && (
        <DiseaseDetailDialog
          disease={selectedDisease}
          open={diseaseDialogOpen}
          onOpenChange={(open) => {
            setDiseaseDialogOpen(open);
            if (!open) setUrlDisease(null);
          }}
        />
      )}
    </div>
  );
}
