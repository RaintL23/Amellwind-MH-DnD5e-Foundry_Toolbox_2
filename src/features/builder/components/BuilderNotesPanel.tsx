import { useEffect, useRef, useState } from "react";
import { NotebookPen } from "lucide-react";
import { useCharacterBuilder } from "../context/CharacterBuilderContext";
import { BuilderPanel } from "./BuilderPanel";

const NOTES_KEY = "builder-notes";

export function BuilderNotesPanel() {
  const { mainHand, offHand, armor, trinket1, trinket2, species, background } =
    useCharacterBuilder();
  const [notes, setNotes] = useState(() => localStorage.getItem(NOTES_KEY) ?? "");
  const [changelog, setChangelog] = useState<string[]>([]);
  const prevRef = useRef<string>("");

  useEffect(() => {
    localStorage.setItem(NOTES_KEY, notes);
  }, [notes]);

  useEffect(() => {
    const snapshot = JSON.stringify({
      mainHand: mainHand?.weapon.name ?? null,
      offHand: offHand?.weapon.name ?? null,
      armor: armor?.armor.name ?? null,
      trinket1: trinket1?.name ?? null,
      trinket2: trinket2?.name ?? null,
      species: species?.name ?? null,
      background: background?.name ?? null,
    });

    if (prevRef.current && prevRef.current !== snapshot) {
      const prev = JSON.parse(prevRef.current) as Record<string, string | null>;
      const next = JSON.parse(snapshot) as Record<string, string | null>;
      const labels: Record<string, string> = {
        mainHand: "Mano principal",
        offHand: "Mano secundaria",
        armor: "Armadura",
        trinket1: "Trinket 1",
        trinket2: "Trinket 2",
        species: "Especie",
        background: "Antecedente",
      };

      const newEntries: string[] = [];
      for (const key of Object.keys(labels)) {
        if (prev[key] !== next[key]) {
          if (next[key]) {
            newEntries.push(`${labels[key]}: ${next[key]}`);
          } else if (prev[key]) {
            newEntries.push(`${labels[key]} desequipado`);
          }
        }
      }

      if (newEntries.length > 0) {
        setChangelog((entries) => [...newEntries.map((e) => `— ${e}`), ...entries].slice(0, 20));
      }
    }

    prevRef.current = snapshot;
  }, [mainHand, offHand, armor, trinket1, trinket2, species, background]);

  return (
    <BuilderPanel
      title={<><NotebookPen className="h-3.5 w-3.5" aria-hidden /> Notas de build</>}
      className="flex flex-col"
    >
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Estrategia, combos, notas..."
        className="h-24 w-full resize-none rounded-md border border-border/60 bg-muted/30 p-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
      />
      <p className="mb-1 mt-3 text-[11px] uppercase tracking-wide text-muted-foreground">
        Historial de cambios
      </p>
      <div className="max-h-20 space-y-0.5 overflow-y-auto text-[11px] text-muted-foreground">
        {changelog.length === 0 ? (
          <p>— Sin cambios aún</p>
        ) : (
          changelog.map((entry, i) => <div key={`${entry}-${i}`}>{entry}</div>)
        )}
      </div>
    </BuilderPanel>
  );
}
