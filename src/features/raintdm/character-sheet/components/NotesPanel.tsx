import { useEffect, useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import type { PlaySessionAction } from "../utils/play-session-reducer";

interface NotesPanelProps {
  notes: string;
  dispatch: (a: PlaySessionAction) => void;
}

const DEBOUNCE_MS = 500;

export function NotesPanel({ notes, dispatch }: NotesPanelProps) {
  const [local, setLocal] = useState(notes);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef(local);
  latest.current = local;

  useEffect(() => {
    setLocal(notes);
  }, [notes]);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
      // Flush pending notes on unmount
      if (latest.current !== notes) {
        dispatch({ type: "SET_NOTES", notes: latest.current });
      }
    };
  }, []);

  const flush = (value: string) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    dispatch({ type: "SET_NOTES", notes: value });
  };

  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold">Notes</h3>
      <Textarea
        value={local}
        placeholder="Session notes…"
        className="min-h-[120px] text-sm"
        onChange={(e) => {
          const value = e.target.value;
          setLocal(value);
          if (timer.current) clearTimeout(timer.current);
          timer.current = setTimeout(() => flush(value), DEBOUNCE_MS);
        }}
        onBlur={() => flush(local)}
      />
    </section>
  );
}
