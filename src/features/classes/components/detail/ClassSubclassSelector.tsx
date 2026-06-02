import { memo } from "react";
import { Subclass } from "@/shared/types";
import { Select } from "@/components/ui/select";

interface ClassSubclassSelectorProps {
  subclasses: Subclass[];
  activeSubclassId: string;
  onSelect: (id: string) => void;
  subclassTitle?: string;
}

export const ClassSubclassSelector = memo(function ClassSubclassSelector({
  subclasses,
  activeSubclassId,
  onSelect,
  subclassTitle,
}: ClassSubclassSelectorProps) {
  if (subclasses.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        {subclassTitle ?? "Subclass"}
      </p>
      <Select
        value={activeSubclassId}
        onChange={(e) => onSelect(e.target.value)}
        className="h-8 text-sm w-full max-w-md"
      >
        <option value="">— No subclass selected —</option>
        {subclasses.map((sc) => (
          <option key={sc.id} value={sc.id}>
            {sc.name}
            {sc.source !== sc.classSource ? ` (${sc.source})` : ""}
          </option>
        ))}
      </Select>
    </div>
  );
});
