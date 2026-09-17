import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AMELLWIND_MHMM_PATREON_URL } from "@/shared/constants/api.constants";
import { cn } from "@/shared/utils/cn";

const PDF_LINK = (
  <a
    href={AMELLWIND_MHMM_PATREON_URL}
    target="_blank"
    rel="noopener noreferrer"
    className="font-medium text-foreground underline underline-offset-2 hover:text-foreground/80"
  >
    Monster Hunter Monster Manual PDF
  </a>
);

/** Attribution for MHMM stat blocks and loot / runes (Patreon PDF 2.0). */
export function MhmmSourceNotice({ className }: { className?: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Alert className={className}>
      <AlertDescription className="text-muted-foreground">
        {/* Mobile: compact + expand */}
        <span className="md:hidden">
          Data from Amellwind’s free {PDF_LINK} on Patreon.
          {!expanded && (
            <>
              {" "}
              <button
                type="button"
                className="font-medium text-foreground underline underline-offset-2"
                onClick={() => setExpanded(true)}
              >
                More
              </button>
            </>
          )}
          {expanded && (
            <span className={cn("mt-1 block")}>
              Includes loot tables, runes, conditions, and diseases (Loot Tables
              2.0). Names that exist only on the older public GitHub JSON are kept
              as a fallback.{" "}
              <button
                type="button"
                className="font-medium text-foreground underline underline-offset-2"
                onClick={() => setExpanded(false)}
              >
                Less
              </button>
            </span>
          )}
        </span>

        {/* Desktop: full text */}
        <span className="hidden md:inline">
          Stat blocks, loot tables, runes, conditions, and diseases come from
          Amellwind’s free {PDF_LINK} on Patreon (Loot Tables 2.0). Names that
          exist only on the older public GitHub JSON are kept as a fallback.
        </span>
      </AlertDescription>
    </Alert>
  );
}
