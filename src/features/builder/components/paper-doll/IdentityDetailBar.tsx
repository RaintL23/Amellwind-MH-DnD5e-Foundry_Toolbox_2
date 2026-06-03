import { CharacterSelectionRef } from "@/shared/types";

interface IdentityDetailBarProps {
  slot: "species" | "background";
  species: CharacterSelectionRef | null;
  background: CharacterSelectionRef | null;
  onRemove: () => void;
}

export function IdentityDetailBar({
  slot,
  species,
  background,
  onRemove,
}: IdentityDetailBarProps) {
  const label =
    slot === "species"
      ? (species?.name ?? "Sin especie")
      : (background?.name ?? "Sin trasfondo");

  return (
    <div className="flex w-full items-center justify-between gap-2 rounded-md border border-border bg-background/50 p-3">
      <span className="text-sm text-foreground">{label}</span>
      <button
        type="button"
        onClick={onRemove}
        className="shrink-0 rounded border border-border px-2 py-0.5 text-xs text-destructive hover:bg-destructive/10"
      >
        Quitar
      </button>
    </div>
  );
}
