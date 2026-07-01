import { useEffect, useMemo, useState } from "react";
import type { MhCondition } from "@/shared/types";
import type { MhDisease } from "@/shared/types";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AlertTriangle, Biohazard, Search } from "lucide-react";
import { getAllConditions } from "../services/condition.service";
import { getAllDiseases } from "@/features/diseases/services/disease.service";
import { ConditionCard } from "./ConditionCard";
import { ConditionDetailDialog } from "./ConditionDetailDialog";
import { DiseaseCard } from "@/features/diseases/components/DiseaseCard";
import { DiseaseDetailDialog } from "@/features/diseases/components/DiseaseDetailDialog";

export function ConditionsDiseasesPage() {
  const [conditions, setConditions] = useState<MhCondition[]>([]);
  const [diseases, setDiseases] = useState<MhDisease[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCondition, setSelectedCondition] = useState<MhCondition | null>(null);
  const [selectedDisease, setSelectedDisease] = useState<MhDisease | null>(null);
  const [conditionDialogOpen, setConditionDialogOpen] = useState(false);
  const [diseaseDialogOpen, setDiseaseDialogOpen] = useState(false);

  useEffect(() => {
    Promise.all([getAllConditions(), getAllDiseases()])
      .then(([c, d]) => {
        setConditions(c);
        setDiseases(d);
      })
      .finally(() => setLoading(false));
  }, []);

  const debouncedSearch = useDebouncedValue(search);

  const filteredConditions = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    const result = q
      ? conditions.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.summary.toLowerCase().includes(q),
        )
      : conditions;
    return [...result].sort((a, b) => a.name.localeCompare(b.name));
  }, [conditions, debouncedSearch]);

  const filteredDiseases = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    const result = q
      ? diseases.filter(
          (d) =>
            d.name.toLowerCase().includes(q) ||
            d.summary.toLowerCase().includes(q),
        )
      : diseases;
    return [...result].sort((a, b) => a.name.localeCompare(b.name));
  }, [diseases, debouncedSearch]);

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
      </div>

      {/* Search bar */}
      <div className="shrink-0 border-b border-border bg-card/50 px-6 py-3">
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conditions or diseases..."
            className="pl-9 h-8 text-sm"
          />
        </div>
      </div>

      {/* Tabs + content */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <Tabs defaultValue="conditions">
          <TabsList className="mb-5">
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

          {/* Conditions tab */}
          <TabsContent value="conditions">
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-rose-500 border-t-transparent" />
                  <span className="text-sm">Loading conditions...</span>
                </div>
              </div>
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
                    onClick={() => {
                      setSelectedCondition(item);
                      setConditionDialogOpen(true);
                    }}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Diseases tab */}
          <TabsContent value="diseases">
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
                  <span className="text-sm">Loading diseases...</span>
                </div>
              </div>
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
                      setSelectedDisease(item);
                      setDiseaseDialogOpen(true);
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
          onOpenChange={setConditionDialogOpen}
        />
      )}
      {diseaseDialogOpen && selectedDisease && (
        <DiseaseDetailDialog
          disease={selectedDisease}
          open={diseaseDialogOpen}
          onOpenChange={setDiseaseDialogOpen}
        />
      )}
    </div>
  );
}
