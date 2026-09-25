import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FileJson, Plus, ScrollText, Trash2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { parseBuilderCharacter } from "@/features/raintdm/builder/builder-json/parse-builder-character";
import { createPlayCharacterRecord } from "../compile/compile-play-character";
import { useLoadFromBuilder } from "../hooks/useLoadFromBuilder";
import { useConfirmDialog } from "../hooks/useConfirmDialog";
import {
  deletePlayCharacter,
  listPlayCharacters,
  savePlayCharacter,
} from "../services/play-character.service";
import type { PlayCharacterRecord } from "../utils/play-character.types";
import { setLinkedSheetId } from "../utils/linked-sheet.storage";

function relativeUpdated(iso: string): string {
  try {
    const ms = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(ms / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  } catch {
    return "";
  }
}

export function CharacterRosterPage() {
  const [records, setRecords] = useState<PlayCharacterRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { busy: loadingFromBuilder, loadFromBuilder } = useLoadFromBuilder();
  const { confirm, confirmDialog } = useConfirmDialog();

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setRecords(await listPlayCharacters());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load sheets");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const onImportFile = async (file: File) => {
    setImporting(true);
    try {
      const text = await file.text();
      const raw = JSON.parse(text) as unknown;
      const parsed = parseBuilderCharacter(raw);
      if (!parsed.ok) {
        toast.error(parsed.error);
        return;
      }
      const record = await createPlayCharacterRecord(parsed.data);
      await savePlayCharacter(record);
      setLinkedSheetId(record.id);
      toast.success(`Imported ${record.compiled.name}`);
      navigate(`/sheet/${record.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Import failed");
    } finally {
      setImporting(false);
    }
  };

  const onDelete = async (id: string, name: string) => {
    const ok = await confirm({
      title: "Delete sheet?",
      description: `Delete sheet for ${name}? This cannot be undone.`,
      confirmLabel: "Delete",
    });
    if (!ok) return;
    await deletePlayCharacter(id);
    toast.success("Deleted");
    void reload();
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 pb-24">
      {confirmDialog}
      <header className="space-y-2">
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <ScrollText className="h-6 w-6" />
          Character Sheet
        </h1>
        <p className="text-sm text-muted-foreground">
          In-session play sheets compiled from the Character Builder. Import a
          Builder JSON, load the active Builder character (when creation checks
          are complete), or send from the Builder.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={importing || loadingFromBuilder}
          onClick={() => fileRef.current?.click()}
          className="gap-2"
        >
          <FileJson className="h-4 w-4" />
          Import Builder JSON
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={importing || loadingFromBuilder}
          onClick={() => void loadFromBuilder()}
          className="gap-2"
        >
          <UserRound className="h-4 w-4" />
          Load from Builder
        </Button>
        <Link
          to="/builder"
          className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent"
        >
          <Plus className="h-4 w-4" />
          Open Builder
        </Link>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void onImportFile(f);
            e.target.value = "";
          }}
        />
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : records.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No sheets yet. Import a Builder JSON, use{" "}
          <strong>Load from Builder</strong>, or{" "}
          <strong>Send to Character Sheet</strong> from the Builder.
        </div>
      ) : (
        <ul className="space-y-2">
          {records.map((r) => (
            <li key={r.id}>
              <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-muted/40">
                <Link
                  to={`/sheet/${r.id}`}
                  className="flex min-w-0 flex-1 items-center gap-3"
                >
                  {r.compiled.portraitImage ? (
                    <img
                      src={r.compiled.portraitImage}
                      alt=""
                      className="h-12 w-12 rounded object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded bg-muted text-lg font-semibold">
                      {r.compiled.name.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{r.compiled.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {r.compiled.className}
                      {r.compiled.subclass ? ` (${r.compiled.subclass})` : ""} ·
                      Level {r.compiled.level}
                      {r.compiled.species ? ` · ${r.compiled.species}` : ""}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      HP {r.session.hp.current}/{r.session.hp.max}
                      <span className="mx-1.5">·</span>
                      Updated {relativeUpdated(r.updatedAt)}
                    </p>
                  </div>
                </Link>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Delete ${r.compiled.name}`}
                  onClick={() => void onDelete(r.id, r.compiled.name)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
