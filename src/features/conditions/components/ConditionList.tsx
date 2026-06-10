import { useEffect, useMemo, useState } from "react";
import type { MhCondition } from "@/shared/types";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Search } from "lucide-react";
import { getAllConditions } from "../services/condition.service";
import { ConditionCard } from "./ConditionCard";
import { ConditionDetailDialog } from "./ConditionDetailDialog";

export function ConditionList() {
  const [conditions, setConditions] = useState<MhCondition[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<MhCondition | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    getAllConditions()
      .then(setConditions)
      .finally(() => setLoading(false));
  }, []);

  const debouncedSearch = useDebouncedValue(search);

  const filtered = useMemo(() => {
    let result = conditions;

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (condition) =>
          condition.name.toLowerCase().includes(q) ||
          condition.summary.toLowerCase().includes(q),
      );
    }

    return [...result].sort((a, b) => a.name.localeCompare(b.name));
  }, [conditions, debouncedSearch]);

  function handleSelect(item: MhCondition) {
    setSelected(item);
    setDialogOpen(true);
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 border-b border-border px-6 py-5">
        <div className="flex items-center gap-3 mb-1">
          <AlertTriangle className="h-6 w-6 text-rose-400" />
          <h1 className="text-xl font-bold text-foreground">Conditions</h1>
          {!loading && (
            <span className="ml-2 rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
              {filtered.length} / {conditions.length}
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground max-w-3xl">
          Blight conditions and other afflictions from the{" "}
          <span className="text-foreground/80">
            Monster Hunter Monster Manual
          </span>{" "}
          (Conditions, Poisons, and Diseases chapter).
        </p>
      </div>

      <div className="shrink-0 border-b border-border bg-card/50 px-6 py-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search condition..."
            className="pl-9 h-8 text-sm"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-rose-500 border-t-transparent" />
              <span className="text-sm">Loading conditions...</span>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-2">
            <AlertTriangle className="h-10 w-10 opacity-20" />
            <p className="text-sm">No conditions found with those filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((item) => (
              <ConditionCard
                key={item.id}
                condition={item}
                onClick={() => handleSelect(item)}
              />
            ))}
          </div>
        )}
      </div>

      {dialogOpen && selected && (
        <ConditionDetailDialog
          condition={selected}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
      )}
    </div>
  );
}
