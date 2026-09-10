import { useState } from "react";
import { Ship } from "lucide-react";
import { DndRichText } from "@/shared/components/DndRichText";
import { cn } from "@/shared/utils/cn";
import generated from "../data/dragonship.generated.json";

export function DragonshipRulesPanel() {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border border-border bg-card/50">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-muted/40"
      >
        <div className="flex items-center gap-2">
          <Ship className="h-4 w-4 text-orange-400" />
          <div>
            <p className="text-sm font-semibold text-foreground">
              Dragonships
            </p>
            <p className="text-xs text-muted-foreground">
              Blueprint, upgrades, and desert travel/combat (Chapter 4, p.{" "}
              {generated.page})
            </p>
          </div>
        </div>
        <span className="text-xs text-muted-foreground">
          {open ? "Hide" : "Show"}
        </span>
      </button>

      <div className={cn(!open && "hidden", "border-t border-border px-4 py-4 space-y-4")}>
        <p className="text-sm text-muted-foreground">{generated.intro}</p>
        {generated.paragraphs?.map((line, i) => (
          <p key={i} className="text-sm text-muted-foreground leading-relaxed">
            <DndRichText text={line} />
          </p>
        ))}
        {generated.subsections?.map((subsection) => (
          <div
            key={subsection.name}
            className="rounded-md border border-border bg-card p-3 space-y-2"
          >
            <h3 className="text-sm font-semibold text-foreground">
              {subsection.name}
            </h3>
            {subsection.paragraphs?.map((line, i) => (
              <p
                key={i}
                className="text-sm text-muted-foreground leading-relaxed"
              >
                <DndRichText text={line} />
              </p>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
