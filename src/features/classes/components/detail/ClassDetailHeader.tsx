import { Link } from "react-router-dom";
import { ArrowLeft, User } from "lucide-react";
import { Class } from "@/shared/types";
import { Badge } from "@/components/ui/badge";
import { SourceBadge } from "@/features/spells/components/SourceBadge";
import { type BookSourceNameMap } from "@/features/spells/services/book-source.service";
import { getCasterLabel } from "../../mappers/class.mapper";

interface ClassDetailHeaderProps {
  active: Class;
  bookNames: BookSourceNameMap;
}

export function ClassDetailHeader({ active, bookNames }: ClassDetailHeaderProps) {
  return (
    <div className="shrink-0 border-b border-border px-6 py-5">
      <Link
        to="/classes"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-sky-400 transition-colors mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Classes
      </Link>

      <div className="flex items-start gap-3">
        <User className="h-6 w-6 text-sky-400 shrink-0 mt-1" />
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold text-sky-400">{active.name}</h1>
          <div className="flex items-center gap-2 flex-wrap mt-2">
            <Badge variant="secondary">{active.hitDie}</Badge>
            <Badge variant="secondary">
              {getCasterLabel(active.casterProgression)}
            </Badge>
            {active.edition && (
              <Badge variant="secondary">
                {active.edition === "one" ? "2024" : "2014"}
              </Badge>
            )}
            <SourceBadge source={active.source} bookNames={bookNames} />
            {active.page !== undefined && (
              <span className="text-xs text-muted-foreground">
                p. {active.page}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
