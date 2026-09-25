import { Textarea } from "@/components/ui/textarea";
import type { PlaySessionAction } from "../utils/play-session-reducer";

interface NotesPanelProps {
  notes: string;
  dispatch: (a: PlaySessionAction) => void;
}

export function NotesPanel({ notes, dispatch }: NotesPanelProps) {
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold">Notes</h3>
      <Textarea
        value={notes}
        placeholder="Session notes…"
        className="min-h-[120px] text-sm"
        onChange={(e) =>
          dispatch({ type: "SET_NOTES", notes: e.target.value })
        }
      />
    </section>
  );
}
