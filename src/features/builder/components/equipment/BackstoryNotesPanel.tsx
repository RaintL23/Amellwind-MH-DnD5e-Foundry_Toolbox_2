import { Book, ClipboardPaste } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/shared/utils/cn";
import { useCharacterBuilder } from "../../context/CharacterBuilderContext";
import { useXanatharBackstory } from "@/features/xanathar-backstory/context/XanatharBackstoryContext";
import { BuilderPanel } from "../shared/BuilderPanel";

export function BackstoryNotesPanel() {
  const { backstoryNotes, setBackstoryNotes } = useCharacterBuilder();
  const { getSummaryText } = useXanatharBackstory();

  const summaryText = getSummaryText();
  const canImport = summaryText.length > 0;

  function handleImportFromXanathar() {
    if (!canImport) return;

    setBackstoryNotes((current) => {
      if (!current.trim()) return summaryText;
      return `${current.trimEnd()}\n\n${summaryText}`;
    });
  }

  return (
    <BuilderPanel
      title={
        <>
          <Book className="h-3.5 w-3.5" aria-hidden />
          Backstory
        </>
      }
      action={
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 gap-1.5 text-[11px]"
          disabled={!canImport}
          onClick={handleImportFromXanathar}
          title={
            canImport
              ? "Paste the Xanathar Backstory summary"
              : "No results in Xanathar Backstory yet"
          }
        >
          <ClipboardPaste className="h-3.5 w-3.5" aria-hidden />
          Import from Xanathar
        </Button>
      }
    >
      <textarea
        value={backstoryNotes}
        onChange={(e) => setBackstoryNotes(e.target.value)}
        placeholder="Write your character's backstory, roleplaying notes, world connections…"
        rows={12}
        className={cn(
          "w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm leading-relaxed text-foreground shadow-sm",
          "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        )}
        aria-label="Character's backstory notes"
      />
      <p className="mt-2 text-[10px] text-muted-foreground">
        {backstoryNotes.trim()
          ? `${backstoryNotes.trim().split(/\s+/).length} words approx.`
          : "Empty — use Import from Xanathar to paste your last summary."}
      </p>
    </BuilderPanel>
  );
}
