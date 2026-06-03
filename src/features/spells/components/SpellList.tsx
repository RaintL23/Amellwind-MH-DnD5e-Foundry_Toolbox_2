import { useEffect, useMemo, useState } from "react";
import { Spell } from "@/shared/types";
import { getAllSpells } from "../services/spell.service";
import {
  buildSourceOptions,
  collectEntitySources,
  getBookSourceNames,
  type BookSourceNameMap,
} from "../services/book-source.service";
import { SPELL_LIST_FILTER_CLASSES } from "../utils/spell-class.constants";
import { dedupeSpellsByName, getSpellsByName } from "../utils/spell-dedupe.utils";
import { SpellDetailDialog } from "./SpellDetailDialog";
import { SpellDataTable } from "./SpellDataTable";
import { Sparkles } from "lucide-react";

export function SpellList() {
  const [spells, setSpells] = useState<Spell[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Spell | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bookNames, setBookNames] = useState<BookSourceNameMap>({});

  useEffect(() => {
    void getBookSourceNames().then(setBookNames);
    getAllSpells()
      .then(setSpells)
      .finally(() => setLoading(false));
  }, []);

  const listSpells = useMemo(() => dedupeSpellsByName(spells), [spells]);

  const classOptions = useMemo(() => {
    const present = new Set<string>();
    for (const spell of listSpells) {
      for (const name of spell.classNames) present.add(name);
    }
    return SPELL_LIST_FILTER_CLASSES.filter((name) => present.has(name));
  }, [listSpells]);

  const sourceOptions = useMemo(
    () => buildSourceOptions(collectEntitySources(listSpells), bookNames),
    [listSpells, bookNames],
  );

  const selectedVariants = useMemo(() => {
    if (!selected) return [];
    return getSpellsByName(spells, selected.name);
  }, [selected, spells]);

  function handleSelect(spell: Spell) {
    setSelected(spell);
    setDialogOpen(true);
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 border-b border-border px-6 py-5">
        <div className="flex items-center gap-3 mb-1">
          <Sparkles className="h-6 w-6 text-violet-400" />
          <h1 className="text-xl font-bold text-foreground">Spells (D&amp;D 5e)</h1>
          {!loading && (
            <span className="ml-2 rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
              {listSpells.length} spells
              {listSpells.length < spells.length && (
                <span className="opacity-70"> ({spells.length} entries)</span>
              )}
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          One row per spell name; open a spell to compare sources (PHB, XPHB, etc.).
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
              <span className="text-sm">Loading spells...</span>
            </div>
          </div>
        ) : listSpells.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-2">
            <Sparkles className="h-10 w-10 opacity-20" />
            <p className="text-sm">No spells loaded.</p>
          </div>
        ) : (
          <SpellDataTable
            spells={listSpells}
            classOptions={classOptions}
            sourceOptions={sourceOptions}
            onRowClick={handleSelect}
          />
        )}
      </div>

      <SpellDetailDialog
        spell={selected}
        variants={selectedVariants}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
