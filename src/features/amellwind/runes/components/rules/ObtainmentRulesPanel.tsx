import { useState } from "react";
import { Package, Scissors, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-1.5 text-muted-foreground hover:text-foreground"
      >
        <Package className="h-3.5 w-3.5 text-emerald-400" />
        Obtaining Materials
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-emerald-400" />
              Obtaining Materials
            </DialogTitle>
            <DialogDescription>
              Carving, capturing &amp; loot tables (AGMH)
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-5 pt-2">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {OBTAINMENT_INTRO}
            </p>

            <section className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-orange-400">
                <Scissors className="h-4 w-4" />
                Carving
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
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
                <p className="text-sm font-semibold text-amber-400/90">
                  {CARVING_VARIANT.name}
                </p>
                {CARVING_VARIANT.entries.map((entry, i) => (
                  <p
                    key={i}
                    className={`text-sm leading-relaxed ${
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
                  className={`text-sm leading-relaxed ${
                    i === CAPTURING_RULES.length - 1
                      ? "text-muted-foreground/70 italic"
                      : "text-muted-foreground"
                  }`}
                >
                  <DndRichText text={rule} />
                </p>
              ))}
            </section>

            <p className="text-xs text-muted-foreground/60 border-t border-border pt-3">
              Carve / Capture values for each material in the table match the
              monster&apos;s loot table. Use the &quot;Both&quot; obtainment filter to
              see only carveable or capturable materials.
            </p>
          </DialogBody>
        </DialogContent>
      </Dialog>
    </>
  );
}
