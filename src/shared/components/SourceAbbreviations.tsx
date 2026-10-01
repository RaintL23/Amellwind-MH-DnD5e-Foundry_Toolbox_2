import { memo } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useBookSourceNames } from "@/shared/hooks/useBookSourceNames";
import { resolveBookSourceName } from "@/shared/services/source-catalog.service";
import { cn } from "@/shared/utils/cn";

interface SourceAbbreviationsProps {
  source: string;
  variantSources?: string[];
  /** How many codes to show before collapsing to `CODE +N`. Default 2. */
  maxVisible?: number;
  className?: string;
  /**
   * Use native `title` instead of Radix Tooltip.
   * Prefer this inside interactive parents (e.g. `<button>` mobile cards).
   */
  nativeTitle?: boolean;
}

function SourceCodeTooltip({
  code,
  label,
  nativeTitle,
}: {
  code: string;
  label: string;
  nativeTitle?: boolean;
}) {
  if (nativeTitle) {
    return (
      <span className="cursor-default" title={label}>
        {code}
      </span>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="cursor-default border-b border-dotted border-muted-foreground/35">
          {code}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  );
}

/**
 * Renders source book abbreviations with hover tooltips for full names.
 * Collapses long variant lists to `first +N` (tooltip lists the rest).
 */
export const SourceAbbreviations = memo(function SourceAbbreviations({
  source,
  variantSources,
  maxVisible = 2,
  className,
  nativeTitle = false,
}: SourceAbbreviationsProps) {
  const bookNames = useBookSourceNames();
  const sources = variantSources ?? [source];
  const collapsed = sources.length > maxVisible;
  const visible = collapsed ? sources.slice(0, 1) : sources;
  const overflow = collapsed ? sources.slice(1) : [];

  return (
    <span
      className={cn(
        "text-muted-foreground text-xs whitespace-nowrap",
        className,
      )}
    >
      {visible.map((code, index) => {
        const label = resolveBookSourceName(bookNames, code);
        return (
          <span key={`${code}-${index}`}>
            {index > 0 ? ", " : null}
            <SourceCodeTooltip
              code={code}
              label={label}
              nativeTitle={nativeTitle}
            />
          </span>
        );
      })}
      {overflow.length > 0 ? (
        <>
          {" "}
          {nativeTitle ? (
            <span
              className="cursor-default"
              title={overflow
                .map(
                  (code) =>
                    `${code} — ${resolveBookSourceName(bookNames, code)}`,
                )
                .join("\n")}
            >
              +{overflow.length}
            </span>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="cursor-default border-b border-dotted border-muted-foreground/35">
                  +{overflow.length}
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <ul className="space-y-0.5">
                  {overflow.map((code) => (
                    <li key={code}>
                      <span className="font-medium">{code}</span>
                      {" — "}
                      {resolveBookSourceName(bookNames, code)}
                    </li>
                  ))}
                </ul>
              </TooltipContent>
            </Tooltip>
          )}
        </>
      ) : null}
    </span>
  );
});
