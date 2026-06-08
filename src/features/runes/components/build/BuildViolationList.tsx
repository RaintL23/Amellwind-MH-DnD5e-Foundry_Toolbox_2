import { AlertTriangle } from "lucide-react";
import { RuleViolation } from "../../utils/build.validation";

interface BuildViolationListProps {
  violations: RuleViolation[];
}

export function BuildViolationList({ violations }: BuildViolationListProps) {
  if (violations.length === 0) return null;

  return (
    <div className="space-y-1 mt-2">
      {violations.map((v, i) => (
        <div
          key={i}
          className="flex gap-2 rounded-md bg-orange-900/20 border border-orange-700/40 px-3 py-2"
        >
          <AlertTriangle className="h-3.5 w-3.5 text-orange-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-orange-300 font-medium">{v.rule}</p>
            <p className="text-xs text-orange-400/60 mt-0.5">
              Conflicto: {v.offenders.join(", ")}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
