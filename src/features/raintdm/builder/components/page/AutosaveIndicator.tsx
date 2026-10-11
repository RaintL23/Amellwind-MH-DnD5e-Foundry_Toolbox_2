import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { subscribeBuilderAutosave } from "../../storage/builder-autosave.storage";

/** Quiet confirmation that the build is saved in this browser. */
export function AutosaveIndicator() {
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => subscribeBuilderAutosave(setSavedAt), []);

  if (savedAt === null) return null;

  const time = new Date(savedAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <span
      className="flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground"
      title={`Saved in this browser at ${time}`}
      role="status"
    >
      <Check className="h-3.5 w-3.5" aria-hidden />
      <span className="sr-only sm:not-sr-only">Saved</span>
    </span>
  );
}
