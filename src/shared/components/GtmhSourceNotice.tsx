import { Alert, AlertDescription } from "@/components/ui/alert";
import { GTMH_GMBINDER_URL } from "@/shared/constants/api.constants";

/** Attribution for GTMH data merged from the local GMBinder/Patreon overlay. */
export function GtmhSourceNotice({ className }: { className?: string }) {
  return (
    <Alert className={className}>
      <AlertDescription className="text-muted-foreground">
        GTMH data is merged from a local{" "}
        <a
          href={GTMH_GMBINDER_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-foreground underline underline-offset-2 hover:text-foreground/80"
        >
          GMBinder source
        </a>{" "}
        and the public GitHub feed. Local entries win by name, while missing names
        are kept from GitHub as fallback.
      </AlertDescription>
    </Alert>
  );
}
