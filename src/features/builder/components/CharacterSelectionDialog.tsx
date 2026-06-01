import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getAllSpecies } from "@/features/species/services/species.service";
import { getAllBackgrounds } from "@/features/backgrounds/services/background.service";
import { useCharacterBuilder } from "../context/CharacterBuilderContext";

interface CharacterSelectionDialogProps {
  open: boolean;
  slot: "species" | "background" | null;
  onClose: () => void;
}

export function CharacterSelectionDialog({
  open,
  slot,
  onClose,
}: CharacterSelectionDialogProps) {
  const { setSpecies, setBackground } = useCharacterBuilder();
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<Array<{ id: string; name: string }>>(
    [],
  );

  useEffect(() => {
    if (!open || !slot) return;
    setLoading(true);
    setSearch("");

    const load =
      slot === "species"
        ? getAllSpecies().then((list) =>
            list.map((s) => ({ id: s.id, name: s.name })),
          )
        : getAllBackgrounds().then((list) =>
            list.map((b) => ({ id: b.id, name: b.name })),
          );

    load.then(setOptions).finally(() => setLoading(false));
  }, [open, slot]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return options;
    return options.filter((o) => o.name.toLowerCase().includes(q));
  }, [options, search]);

  function handleSelect(id: string, name: string) {
    if (!slot) return;
    const ref = { id, name };
    if (slot === "species") setSpecies(ref);
    else setBackground(ref);
    onClose();
    setSearch("");
  }

  function handleClear() {
    if (!slot) return;
    if (slot === "species") setSpecies(null);
    else setBackground(null);
    onClose();
  }

  const title =
    slot === "species"
      ? "Seleccionar especie"
      : slot === "background"
        ? "Seleccionar trasfondo"
        : "";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-border bg-background pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <button
            type="button"
            onClick={handleClear}
            className="w-full text-left px-3 py-2 rounded-md border border-border/50 text-sm text-destructive hover:bg-destructive/10 transition-colors"
          >
            Quitar selección
          </button>

          <div className="max-h-[300px] overflow-y-auto space-y-1">
            {loading && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Cargando...
              </p>
            )}
            {!loading &&
              filtered.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => handleSelect(o.id, o.name)}
                  className="w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors text-sm font-medium text-foreground"
                >
                  {o.name}
                </button>
              ))}
            {!loading && filtered.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Sin resultados.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
