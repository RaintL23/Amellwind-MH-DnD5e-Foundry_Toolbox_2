import { Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HintTooltip } from "@/shared/components/HintTooltip";
import { cn } from "@/shared/utils/cn";
import {
  FOUNDRY_EXPORT_TARGET,
  formatModuleRequirementsSummary,
  getFoundryModuleRequirements,
  type FoundryExportKind,
} from "@/shared/foundry/module-requirements";

interface FoundryModuleRequirementsNoticeProps {
  kind: FoundryExportKind;
  className?: string;
  compact?: boolean;
  /**
   * Collapsible accordion (closed by default). Prefer for preview panels so
   * the module stack does not dominate the primary content.
   */
  collapsible?: boolean;
}

function NoticeBody({ kind }: { kind: FoundryExportKind }) {
  const { required, recommended } = formatModuleRequirementsSummary(kind);
  const modules = getFoundryModuleRequirements(kind);

  return (
    <div className="text-[11px] text-muted-foreground space-y-1.5">
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
    </div>
  );
}

/**
 * Short notice listing Foundry modules needed so exported JSON references
 * (Midi flags, content links, animations) resolve in the destination world.
 */
export function FoundryModuleRequirementsNotice({
  kind,
  className,
  compact = false,
  collapsible = false,
}: FoundryModuleRequirementsNoticeProps) {
  const { required, recommended } = formatModuleRequirementsSummary(kind);

  if (compact) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1 text-[10px] leading-snug text-muted-foreground",
          className,
        )}
      >
        <span>
          Foundry {FOUNDRY_EXPORT_TARGET.coreVersion} / dnd5e{" "}
          {FOUNDRY_EXPORT_TARGET.systemVersion}
        </span>
        <HintTooltip
          side="bottom"
          align="start"
          className="max-w-[min(20rem,calc(100vw-2rem))]"
          content={
            <>
              For Midi automation enable: {required}.
              {"\n"}
              Recommended: {recommended}.
            </>
          }
        >
          <button
            type="button"
            className="inline-flex shrink-0 rounded-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            aria-label="Foundry module requirements"
          >
            <Info className="h-3 w-3" aria-hidden />
          </button>
        </HintTooltip>
      </div>
    );
  }

  if (collapsible) {
    return (
      <Accordion
        type="single"
        collapsible
        className={cn(
          "rounded-md border border-border/60 bg-muted/20 px-3",
          className,
        )}
      >
        <AccordionItem value="modules" className="border-b-0">
          <AccordionTrigger className="py-2.5 text-xs hover:no-underline">
            <span className="flex items-center gap-2 text-left">
              <Info className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="font-medium text-foreground">
                Foundry VTT modules (JSON + stack)
              </span>
            </span>
          </AccordionTrigger>
          <AccordionContent className="pb-3">
            <NoticeBody kind={kind} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    );
  }

  return (
    <Alert className={cn("py-2", className)}>
      <Info className="h-4 w-4" />
      <AlertTitle className="text-xs">
        Foundry VTT modules (JSON + stack)
      </AlertTitle>
      <AlertDescription>
        <NoticeBody kind={kind} />
      </AlertDescription>
    </Alert>
  );
}
