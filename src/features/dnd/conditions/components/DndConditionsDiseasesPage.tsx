import { ListAreaLoading } from "@/shared/components/ListAreaLoading";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { DndCondition, DndDisease } from "@/shared/types";
import { useDebouncedListSearch } from "@/shared/hooks/useDebouncedListSearch";
import { useListItemUrlParam } from "@/shared/hooks/useListItemUrlParam";
import { useListSessionFilters } from "@/shared/hooks/useListSessionFilters";
import { ClearableSearchInput } from "@/shared/components/list-filters";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AlertTriangle, Biohazard } from "lucide-react";
import {
  getListDndConditions,
  getListDndDiseases,
} from "../services/dnd-condition.service";
import { ConditionCard } from "@/features/amellwind/conditions/components/ConditionCard";
import { ConditionDetailDialog } from "@/features/amellwind/conditions/components/ConditionDetailDialog";
import { DiseaseCard } from "@/features/amellwind/diseases/components/DiseaseCard";
import { DiseaseDetailDialog } from "@/features/amellwind/diseases/components/DiseaseDetailDialog";

export function DndConditionsDiseasesPage() {
  const { q, patchFilters } = useListSessionFilters({
    listId: "dnd-conditions-diseases",
    stringKeys: ["q"],
    multiKeys: [],
    urlPreserveKeys: ["condition", "disease"],
  });
  const { value: urlCondition, setValue: setUrlCondition } =
    useListItemUrlParam("condition");
  const { value: urlDisease, setValue: setUrlDisease } =
    useListItemUrlParam("disease");
  const [conditions, setConditions] = useState<DndCondition[]>([]);
  const [diseases, setDiseases] = useState<DndDisease[]>([]);
  const [loading, setLoading] = useState(true);
  const commitSearch = useCallback(
    (nextQ: string) => patchFilters({ q: nextQ }),
    [patchFilters],
  );
  const { searchDraft, setSearchDraft, appliedSearch, isSearchPending } =
    useDebouncedListSearch(q, commitSearch);
  const [selectedCondition, setSelectedCondition] =
    useState<DndCondition | null>(null);
  const [selectedDisease, setSelectedDisease] = useState<DndDisease | null>(
    null,
  );
  const [conditionDialogOpen, setConditionDialogOpen] = useState(false);
  const [diseaseDialogOpen, setDiseaseDialogOpen] = useState(false);
  const [tab, setTab] = useState(urlDisease ? "diseases" : "conditions");

  useEffect(() => {
    Promise.all([getListDndConditions(), getListDndDiseases()])
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
    const query = appliedSearch.trim().toLowerCase();
    const result = query
      ? conditions.filter(
          (c) =>
            c.name.toLowerCase().includes(query) ||
            c.summary.toLowerCase().includes(query) ||
            c.category.toLowerCase().includes(query),
        )
      : conditions;
    return [...result].sort((a, b) => a.name.localeCompare(b.name));
  }, [conditions, appliedSearch]);

  const filteredDiseases = useMemo(() => {
    const query = appliedSearch.trim().toLowerCase();
    const result = query
      ? diseases.filter(
          (d) =>
            d.name.toLowerCase().includes(query) ||
            d.summary.toLowerCase().includes(query),
        )
      : diseases;
    return [...result].sort((a, b) => a.name.localeCompare(b.name));
  }, [diseases, appliedSearch]);

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 border-b border-border px-6 py-5">
        <div className="flex items-center gap-3 mb-1">
          <AlertTriangle className="h-6 w-6 text-amber-400" />
          <Biohazard className="h-5 w-5 text-purple-400" />
          <h1 className="text-xl font-bold text-foreground">
            Conditions &amp; Diseases
          </h1>
        </div>
        <p className="text-sm text-muted-foreground max-w-3xl">
          Classic D&amp;D 5e conditions, statuses, and diseases from the Player&apos;s
          Handbook, DMG, and other official sources (2014 / 2024).
        </p>
      </div>

      <div className="shrink-0 border-b border-border bg-card/50 px-6 py-3">
        <ClearableSearchInput
          value={searchDraft}
          onChange={setSearchDraft}
          placeholder="Search conditions or diseases..."
          compact
          className="max-w-xs"
          inputClassName="h-8 text-sm"
        />
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-5">
            <TabsTrigger value="conditions">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
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

          <TabsContent value="conditions">
            {loading || isSearchPending ? (
              <ListAreaLoading variant="cards" />
            ) : filteredConditions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-2">
                <AlertTriangle className="h-10 w-10 opacity-20" />
                <p className="text-sm">No conditions found.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredConditions.map((item) => (
                  <ConditionCard
                    key={item.id}
                    condition={item}
                    badge={
                      item.category === "status" ? "Status" : "Condition"
                    }
                    onClick={() => {
                      setUrlDisease(null);
                      setUrlCondition(item.name);
                    }}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="diseases">
            {loading || isSearchPending ? (
              <ListAreaLoading variant="cards" />
            ) : filteredDiseases.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-2">
                <Biohazard className="h-10 w-10 opacity-20" />
                <p className="text-sm">No diseases found.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDiseases.map((item) => (
                  <DiseaseCard
                    key={item.id}
                    disease={item}
                    onClick={() => {
                      setUrlCondition(null);
                      setUrlDisease(item.name);
                    }}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

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
