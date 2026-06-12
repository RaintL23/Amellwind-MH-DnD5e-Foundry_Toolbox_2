import { Book, ClipboardPaste } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/shared/utils/cn";
import { useCharacterBuilder } from "../../context/CharacterBuilderContext";
import { useXanatharBackstory } from "@/features/xanathar-backstory/context/XanatharBackstoryContext";
import { useSelectedDndBackground } from "../../hooks/useSelectedDndBackground";
import { useSelectedBackground } from "../../hooks/useSelectedBackground";
import { BuilderPanel } from "../shared/BuilderPanel";
import type { BuilderPersonality } from "../../storage/builder-personality.storage";

const PERSONALITY_FIELDS: Array<{
  key: keyof BuilderPersonality;
  label: string;
  placeholder: string;
}> = [
  {
    key: "trait1",
    label: "Personality Trait 1",
    placeholder: "A distinctive mannerism or habit…",
  },
  {
    key: "trait2",
    label: "Personality Trait 2",
    placeholder: "Another trait that defines your character…",
  },
  {
    key: "ideal",
    label: "Ideal",
    placeholder: "What principle guides your character?",
  },
  {
    key: "bond",
    label: "Bond",
    placeholder: "Who or what matters most to your character?",
  },
  {
    key: "flaw",
    label: "Flaw",
    placeholder: "A weakness, vice, or fear…",
  },
];

export function BackstoryNotesPanel() {
  const {
    backstoryNotes,
    setBackstoryNotes,
    personality,
    setPersonalityField,
  } = useCharacterBuilder();
  const { getSummaryText } = useXanatharBackstory();
  const { dndBackground } = useSelectedDndBackground();
  const mhBackground = useSelectedBackground();

  const summaryText = getSummaryText();
  const canImport = summaryText.length > 0;

  const suggestedTables = [
    ...(dndBackground?.suggestedCharacteristics ?? []),
    ...(mhBackground?.suggestedCharacteristics ?? []),
  ];

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
          Backstory & Personality
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
      <div className="space-y-3">
        {PERSONALITY_FIELDS.map(({ key, label, placeholder }) => (
          <div key={key} className="space-y-1">
            <label className="text-[10px] font-medium text-muted-foreground">
              {label}
            </label>
            <input
              type="text"
              value={personality[key]}
              onChange={(e) => setPersonalityField(key, e.target.value)}
              placeholder={placeholder}
              className={cn(
                "w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs text-foreground shadow-sm",
                "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
              )}
            />
          </div>
        ))}

        {suggestedTables.length > 0 && (
          <details className="rounded-md border border-border/60 bg-muted/20 px-2.5 py-2">
            <summary className="cursor-pointer text-[11px] font-medium text-primary">
              Suggestions from background
            </summary>
            <div className="mt-2 space-y-2">
              {suggestedTables.flatMap((section) =>
                (section.tables ?? []).map((table, tableIdx) => (
                  <div key={`${section.name}-${tableIdx}`}>
                    {table.caption && (
                      <p className="text-[10px] font-medium text-muted-foreground">
                        {table.caption}
                      </p>
                    )}
                    <ul className="mt-1 space-y-0.5">
                      {table.rows.map((row, rowIdx) => (
                        <li key={rowIdx}>
                          <button
                            type="button"
                            className="w-full rounded px-1 py-0.5 text-left text-[10px] text-foreground hover:bg-muted/60"
                            onClick={() => {
                              const text = row[1] ?? row[0] ?? "";
                              if (!text) return;
                              if (table.rollKind === "personality") {
                                if (!personality.trait1) {
                                  setPersonalityField("trait1", text);
                                } else if (!personality.trait2) {
                                  setPersonalityField("trait2", text);
                                } else {
                                  setPersonalityField("trait1", text);
                                }
                              } else if (
                                table.rollKind &&
                                table.rollKind !== "other"
                              ) {
                                setPersonalityField(table.rollKind, text);
                              } else {
                                setBackstoryNotes((current) =>
                                  current.trim()
                                    ? `${current.trimEnd()}\n${text}`
                                    : text,
                                );
                              }
                            }}
                          >
                            {row[1] ?? row[0]}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )),
              )}
            </div>
          </details>
        )}

        <div className="space-y-1">
          <label className="text-[10px] font-medium text-muted-foreground">
            Free-form notes
          </label>
          <textarea
            value={backstoryNotes}
            onChange={(e) => setBackstoryNotes(e.target.value)}
            placeholder="Connections, history, roleplaying hooks…"
            rows={8}
            className={cn(
              "w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm leading-relaxed text-foreground shadow-sm",
              "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            )}
            aria-label="Character's backstory notes"
          />
        </div>
      </div>
    </BuilderPanel>
  );
}
