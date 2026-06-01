import { CharacterSelectionRef } from "@/shared/types";

interface IdentityDetailBarProps {
  slot: "species" | "background";
  species: CharacterSelectionRef | null;
  background: CharacterSelectionRef | null;
  onChange: () => void;
  onRemove: () => void;
}

export function IdentityDetailBar({
  slot,
  species,
  background,
  onChange,
  onRemove,
}: IdentityDetailBarProps) {
  const label =
    slot === "species"
      ? (species?.name ?? "Sin especie")
      : (background?.name ?? "Sin trasfondo");

  return (
    <div className="w-full rounded-md border border-border bg-background/50 p-3 flex items-center justify-between gap-2">
      <span className="text-sm text-foreground">{label}</span>
      <div className="flex gap-2 shrink-0">
        <button
          type="button"
          onClick={onChange}
          className="px-2 py-0.5 text-xs rounded border border-border hover:bg-accent"
        >
          Cambiar
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="px-2 py-0.5 text-xs rounded border border-border text-destructive hover:bg-destructive/10"
        >
          Quitar
        </button>
      </div>
    </div>
  );
}
