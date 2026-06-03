import { Badge } from "@/components/ui/badge";
import { cn } from "@/shared/utils/cn";
import {
  resolveBookSourceName,
  type BookSourceNameMap,
} from "../services/book-source.service";

interface SourceBadgeProps {
  source: string;
  bookNames: BookSourceNameMap;
  className?: string;
}

export function SourceBadge({ source, bookNames, className }: SourceBadgeProps) {
  const fullName = resolveBookSourceName(bookNames, source);
  const hasFullName = fullName !== source;

  return (
    <Badge
      variant="secondary"
      className={cn(hasFullName && "max-w-[14rem] truncate", className)}
      title={hasFullName ? source : undefined}
    >
      {hasFullName ? fullName : source}
    </Badge>
  );
}
