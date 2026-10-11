import type { ReactNode } from "react";
import { CircleHelp } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/shared/utils/cn";
import {
  BUILDER_GLOSSARY,
  type BuilderGlossaryTerm,
} from "../../data/builder-glossary";

/**
 * Tap/click/keyboard-friendly term explanation (Popover, not hover-only
 * Tooltip). With children it underlines the term; without, it renders a
 * small help icon to place next to an existing label.
 */
export function GlossaryHint({
  term,
  children,
  className,
}: Readonly<{
  term: BuilderGlossaryTerm;
  children?: ReactNode;
  className?: string;
}>) {
  const entry = BUILDER_GLOSSARY[term];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={children ? undefined : `What is ${entry.title}?`}
          className={cn(
            "rounded-sm text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            children
              ? "cursor-help underline decoration-dotted decoration-muted-foreground/60 underline-offset-2 hover:decoration-foreground"
              : "inline-flex h-4 w-4 items-center justify-center text-muted-foreground hover:text-foreground",
            className,
          )}
        >
          {children ?? <CircleHelp className="h-3.5 w-3.5" aria-hidden />}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 space-y-1 p-3">
        <p className="text-xs font-semibold text-foreground">{entry.title}</p>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {entry.text}
        </p>
      </PopoverContent>
    </Popover>
  );
}
