import { Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/shared/utils/cn";
import {
  FOUNDRY_EXPORT_TARGET,
  formatModuleRequirementsSummary,
  getFoundryModuleRequirements,
  type FoundryExportKind,
} from "@/features/builder/foundry-export/module-requirements";

interface FoundryModuleRequirementsNoticeProps {
  kind: FoundryExportKind;
  className?: string;
  compact?: boolean;
}

/**
 * Short notice listing Foundry modules needed so exported JSON references
 * (Midi flags, content links, animations) resolve in the destination world.
 */
export function FoundryModuleRequirementsNotice({
  kind,
  className,
  compact = false,
}: FoundryModuleRequirementsNoticeProps) {
  const { required, recommended } = formatModuleRequirementsSummary(kind);
  const modules = getFoundryModuleRequirements(kind);

  if (compact) {
    return (
      <p
        className={cn(
          "text-[10px] leading-snug text-muted-foreground",
          className,
        )}
      >
        Foundry {FOUNDRY_EXPORT_TARGET.coreVersion} / dnd5e{" "}
        {FOUNDRY_EXPORT_TARGET.systemVersion}. For Midi automation enable:{" "}
        {required}. Recommended: {recommended}.
      </p>
    );
  }

  return (
    <Alert className={cn("py-2", className)}>
      <Info className="h-4 w-4" />
      <AlertTitle className="text-xs">
        Foundry VTT modules (JSON + stack)
      </AlertTitle>
      <AlertDescription className="text-[11px] text-muted-foreground space-y-1.5">
        <p>
          Target: Core {FOUNDRY_EXPORT_TARGET.coreVersion}, system{" "}
          {FOUNDRY_EXPORT_TARGET.systemId} {FOUNDRY_EXPORT_TARGET.systemVersion}.
          The JSON embeds schema and references; companion modules activate them.
        </p>
        <p>
          <span className="font-medium text-foreground">Required (Midi):</span>{" "}
          {required}.
        </p>
        <p>
          <span className="font-medium text-foreground">Recommended:</span>{" "}
          {recommended}.
        </p>
        <ul className="list-disc pl-4 space-y-0.5">
          {modules
            .filter((m) => m.tier === "recommended")
            .map((m) => (
              <li key={m.id}>
                {m.name}: {m.reason}
              </li>
            ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}
