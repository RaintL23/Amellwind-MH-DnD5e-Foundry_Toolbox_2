import { useEffect, useMemo, useState } from "react";
import type { MhDisease } from "@/shared/types";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { useListUrlState } from "@/shared/hooks/useListUrlState";
import { Input } from "@/components/ui/input";
import { Biohazard, Search } from "lucide-react";
import { getAllDiseases } from "../services/disease.service";
import { DiseaseCard } from "./DiseaseCard";
import { DiseaseDetailDialog } from "./DiseaseDetailDialog";

export function DiseaseList() {
  const { getString, setString } = useListUrlState();
  const [diseases, setDiseases] = useState<MhDisease[]>([]);
  const [loading, setLoading] = useState(true);
  const search = getString("q");
  const [selected, setSelected] = useState<MhDisease | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    getAllDiseases()
      .then(setDiseases)
      .finally(() => setLoading(false));
  }, []);

  const debouncedSearch = useDebouncedValue(search);

  const filtered = useMemo(() => {
    let result = diseases;

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (disease) =>
          disease.name.toLowerCase().includes(q) ||
          disease.summary.toLowerCase().includes(q),
      );
    }

    return [...result].sort((a, b) => a.name.localeCompare(b.name));
  }, [diseases, debouncedSearch]);

  function handleSelect(item: MhDisease) {
    setSelected(item);
    setDialogOpen(true);
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 border-b border-border px-6 py-5">
        <div className="flex items-center gap-3 mb-1">
          <Biohazard className="h-6 w-6 text-purple-400" />
          <h1 className="text-xl font-bold text-foreground">Diseases</h1>
          {!loading && (
            <span className="ml-2 rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
              {filtered.length} / {diseases.length}
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground max-w-3xl">
          Infectious diseases from the{" "}
          <span className="text-foreground/80">
            Monster Hunter Monster Manual
          </span>
          , including the Frenzy Virus and other ailments.
        </p>
      </div>

      <div className="shrink-0 border-b border-border bg-card/50 px-6 py-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setString("q", e.target.value)}
            placeholder="Search disease..."
            className="pl-9 h-8 text-sm"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
              <span className="text-sm">Loading diseases...</span>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-2">
            <Biohazard className="h-10 w-10 opacity-20" />
            <p className="text-sm">No diseases found with those filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((item) => (
              <DiseaseCard
                key={item.id}
                disease={item}
                onClick={() => handleSelect(item)}
              />
            ))}
          </div>
        )}
      </div>

      {dialogOpen && selected && (
        <DiseaseDetailDialog
          disease={selected}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
      )}
    </div>
  );
}
