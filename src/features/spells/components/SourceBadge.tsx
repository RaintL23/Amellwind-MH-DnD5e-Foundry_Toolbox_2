import { Badge } from "@/components/ui/badge";
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
      className={className}
      title={hasFullName ? fullName : undefined}
    >
      {source}
    </Badge>
  );
}
