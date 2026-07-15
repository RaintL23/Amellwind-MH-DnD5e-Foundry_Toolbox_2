import { ListAreaLoading } from "@/shared/components/ListAreaLoading";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Spell } from "@/shared/types";
import {
  getAllSpells,
  getListSpells,
  getSpellsByName,
} from "../services/spell.service";
import {
  buildSourceOptions,
  collectEntitySources,
} from "../services/book-source.service";
import { useBookSourceNames } from "@/shared/hooks/useBookSourceNames";
import { useDataTableUrlState } from "@/shared/hooks/useDataTableUrlState";
import { SPELL_COLUMN_URL_MAP } from "./spell-list-url.constants";
import { SPELL_LIST_FILTER_CLASSES } from "../utils/spell-class.constants";
import { SpellDetailDialog } from "./SpellDetailDialog";
import { SpellDataTable } from "./SpellDataTable";
import { Sparkles } from "lucide-react";

export function SpellList() {
  const [spells, setSpells] = useState<Spell[]>([]);
  const [listSpells, setListSpells] = useState<Spell[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Spell | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedVariants, setSelectedVariants] = useState<Spell[]>([]);
  const bookNames = useBookSourceNames();
  const { initialSearch, initialColumnFilters, handleFilterStateChange } =
    useDataTableUrlState(SPELL_COLUMN_URL_MAP);

  useEffect(() => {
    Promise.all([getAllSpells(), getListSpells()])
      .then(([all, list]) => {
        setSpells(all);
        setListSpells(list);
      })
      .finally(() => setLoading(false));
  }, []);

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

  const handleSelect = useCallback((spell: Spell) => {
    setSelected(spell);
    setDialogOpen(true);
    void getSpellsByName(spell.name).then(setSelectedVariants);
  }, []);

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
          <ListAreaLoading />
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
            initialSearch={initialSearch}
            initialColumnFilters={initialColumnFilters}
            onFilterStateChange={handleFilterStateChange}
          />
        )}
      </div>

      {dialogOpen && selected && (
        <SpellDetailDialog
          key={selected.id}
          spell={selected}
          variants={selectedVariants}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
      )}
    </div>
  );
}
