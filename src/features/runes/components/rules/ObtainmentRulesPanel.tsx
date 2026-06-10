import { useState } from "react";
import { ChevronDown, ChevronUp, Package, Scissors, Target } from "lucide-react";
import { DndRichText } from "@/shared/components/DndRichText";
import {
  CAPTURING_RULES,
  CARVING_RULE_AFTER_LINK,
  CARVING_RULE_BEFORE_LINK,
  CARVING_VARIANT,
  LOOT_TABLE_PDF_URL,
  OBTAINMENT_INTRO,
} from "../../constants/obtainment.constants";

export function ObtainMaterialsPanel() {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border border-border bg-muted/10 overflow-hidden mb-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/20 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-emerald-400" />
          <span className="text-sm font-semibold text-foreground">
            Obtaining Materials
          </span>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            — Carving, capturing & loot tables (AGMH)
          </span>
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
      </button>

      {open && (
        <div className="border-t border-border px-4 py-4 space-y-5">
          <p className="text-xs text-muted-foreground leading-relaxed">
            {OBTAINMENT_INTRO}
          </p>

          <section className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-orange-400">
              <Scissors className="h-4 w-4" />
              Carving
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {CARVING_RULE_BEFORE_LINK}{" "}
              <a
                href={LOOT_TABLE_PDF_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-400 hover:text-amber-300 underline underline-offset-2"
              >
                loot table (PDF)
              </a>
              . {CARVING_RULE_AFTER_LINK}
            </p>
            <div className="rounded-md border border-amber-600/25 bg-amber-600/5 px-3 py-3 space-y-2">
              <p className="text-xs font-semibold text-amber-400/90">
                {CARVING_VARIANT.name}
              </p>
              {CARVING_VARIANT.entries.map((entry, i) => (
                <p
                  key={i}
                  className={`text-xs leading-relaxed ${
                    i === CARVING_VARIANT.entries.length - 1
                      ? "text-muted-foreground/70 italic"
                      : "text-muted-foreground"
                  }`}
                >
                  <DndRichText text={entry} />
                </p>
              ))}
            </div>
          </section>

          <section className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-blue-400">
              <Target className="h-4 w-4" />
              Capturing
            </div>
            {CAPTURING_RULES.map((rule, i) => (
              <p
                key={i}
                className={`text-xs leading-relaxed ${
                  i === CAPTURING_RULES.length - 1
                    ? "text-muted-foreground/70 italic"
                    : "text-muted-foreground"
                }`}
              >
                <DndRichText text={rule} />
              </p>
            ))}
          </section>

          <p className="text-[10px] text-muted-foreground/60 border-t border-border pt-3">
            Los valores Carve / Capture de cada material en la tabla corresponden a la
            tabla de botín del monstruo. Usa el filtro &quot;Toda obtención&quot; para
            ver solo materiales carveables o capturables.
          </p>
        </div>
      )}
    </div>
  );
}
