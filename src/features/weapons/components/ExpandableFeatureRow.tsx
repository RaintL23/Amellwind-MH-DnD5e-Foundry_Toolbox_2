import type { ReactNode } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { DndRichText } from "@/shared/components/DndRichText";

interface ExpandableFeatureRowProps {
  name: string;
  paragraphs: string[];
  isExpanded: boolean;
  onToggle: () => void;
  leadingIcon?: ReactNode;
  indent?: boolean;
  className?: string;
  nameClassName?: string;
  trailing?: ReactNode;
}

export function ExpandableFeatureRow({
  name,
  paragraphs,
  isExpanded,
  onToggle,
  leadingIcon,
  indent,
  className,
  nameClassName,
  trailing,
}: ExpandableFeatureRowProps) {
  const hasDesc = paragraphs.length > 0;

  return (
    <div className={cn(indent && "ml-5")}>
      <div
        className={cn(
          "flex items-start gap-2 text-sm",
          hasDesc && "cursor-pointer select-none",
          className,
        )}
        onClick={() => hasDesc && onToggle()}
      >
        {leadingIcon}
        {hasDesc &&
          (isExpanded ? (
            <ChevronDown className="h-3.5 w-3.5 shrink-0 mt-0.5 opacity-60" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 shrink-0 mt-0.5 opacity-40" />
          ))}
        <span className={cn("flex-1 leading-snug", nameClassName)}>{name}</span>
        {trailing}
      </div>
      {hasDesc && isExpanded && (
        <div className="mt-1 ml-6 mb-1 border-l-2 border-border/40 pl-3 space-y-1.5">
          {paragraphs.map((p, pi) => (
            <p
              key={pi}
              className="text-xs text-muted-foreground leading-relaxed"
            >
              <DndRichText text={p} />
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
