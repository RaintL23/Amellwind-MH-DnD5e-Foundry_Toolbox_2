import { useNavigate } from "react-router-dom";
import { ArrowLeft, User } from "lucide-react";
import { Class } from "@/shared/types";
import { Badge } from "@/components/ui/badge";
import { SourceBadge } from "@/features/dnd/spells/components/SourceBadge";
import { type BookSourceNameMap } from "@/features/dnd/spells/services/book-source.service";
import { ClassSourceSwitcher } from "./ClassSourceSwitcher";
import { type ClassVariantField } from "../../utils/class-variant.utils";

interface ClassDetailHeaderProps {
  active: Class;
  variants: Class[];
  varyingFields: ClassVariantField[];
  bookNames: BookSourceNameMap;
  onSourceSelect: (id: string) => void;
}

/** Hit die / spellcasting live in the Overview section; the header only identifies the class and its source. */
export function ClassDetailHeader({
  active,
  variants,
  varyingFields,
  bookNames,
  onSourceSelect,
}: ClassDetailHeaderProps) {
  const navigate = useNavigate();
  return (
    <header className="@container/classheader shrink-0 border-b border-border">
      <div className="mx-auto max-w-[88rem] px-3 py-3 @lg/classheader:px-4 @4xl/classheader:px-6 @4xl/classheader:py-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="-ml-1 mb-2 inline-flex items-center gap-1.5 rounded px-1 py-0.5 text-xs text-muted-foreground transition-colors hover:text-sky-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring @lg/classheader:text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>
            <span className="hidden @lg/classheader:inline">Back to </span>
            Classes
          </span>
        </button>

        <div className="flex items-start gap-2.5">
          <User className="mt-0.5 h-5 w-5 shrink-0 text-sky-400 @lg/classheader:mt-1 @lg/classheader:h-6 @lg/classheader:w-6" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <h1 className="min-w-0 truncate text-xl font-bold leading-tight text-sky-400 @lg/classheader:text-2xl">
                {active.name}
              </h1>
              {variants.length > 1 && (
                <div className="shrink-0">
                  <ClassSourceSwitcher
                    variants={variants}
                    activeId={active.id}
                    onSelect={onSourceSelect}
                    varyingFields={varyingFields}
                    bookNames={bookNames}
                  />
                </div>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <SourceBadge source={active.source} bookNames={bookNames} />
              {active.page !== undefined && (
                <span className="text-xs text-muted-foreground">
                  p. {active.page}
                </span>
              )}
              {active.edition && (
                <Badge variant="outline" className="text-[10px] font-normal">
                  {active.edition === "one" ? "2024" : "2014"}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
