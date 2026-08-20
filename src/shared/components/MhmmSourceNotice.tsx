import { Alert, AlertDescription } from "@/components/ui/alert";
import { AMELLWIND_MHMM_PATREON_URL } from "@/shared/constants/api.constants";

/** Attribution for MHMM stat blocks and loot / runes (Patreon PDF 2.0). */
export function MhmmSourceNotice({ className }: { className?: string }) {
  return (
    <Alert className={className}>
      <AlertDescription className="text-muted-foreground">
        Stat blocks, loot tables, runes, conditions, and diseases come from
        Amellwind’s free{" "}
        <a
          href={AMELLWIND_MHMM_PATREON_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-foreground underline underline-offset-2 hover:text-foreground/80"
        >
          Monster Hunter Monster Manual PDF
        </a>{" "}
        on Patreon (Loot Tables 2.0). Names that exist only on the older public
        GitHub JSON are kept as a fallback.
      </AlertDescription>
    </Alert>
  );
}
