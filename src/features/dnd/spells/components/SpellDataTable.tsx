import { useCallback } from "react";
import type { Spell } from "@/shared/types";
import { DataTable } from "@/components/data-table/data-table";
import { CompendiumMobileCard } from "@/shared/components/CompendiumMobileCard";
import { SourceAbbreviations } from "@/shared/components/SourceAbbreviations";
import { spellColumns } from "./spell-columns";

interface SpellDataTableProps {
  spells: Spell[];
  onRowClick: (spell: Spell) => void;
}

function getSpellRowId(row: Spell): string {
  return row.id;
}

export function SpellDataTable({ spells, onRowClick }: SpellDataTableProps) {
  const renderMobileRow = useCallback(
    (spell: Spell) => (
      <CompendiumMobileCard
        title={spell.name}
        onSelect={() => onRowClick(spell)}
        primary={
          <>
            <span className="rounded border border-violet-800/50 bg-violet-950/40 px-1.5 py-0.5 text-[10px] font-bold text-violet-400">
              {spell.level === 0 ? "Cantrip" : `Lvl ${spell.level}`}
            </span>
            <span>{spell.schoolName}</span>
          </>
        }
        secondary={
          <>
            <span className="truncate">{spell.classNames.slice(0, 3).join(", ")}</span>
            {spell.classNames.length > 3 ? (
              <span>+{spell.classNames.length - 3}</span>
            ) : null}
            <span aria-hidden="true">·</span>
            <SourceAbbreviations
              source={spell.source}
              variantSources={spell.variantSources}
              maxVisible={1}
              nativeTitle
            />
          </>
        }
      />
    ),
    [onRowClick],
  );

  return (
    <DataTable
      columns={spellColumns}
      data={spells}
      getRowId={getSpellRowId}
      initialSorting={[
        { id: "level", desc: false },
        { id: "name", desc: false },
      ]}
      onRowClick={onRowClick}
      emptyMessage="No spells found with those filters."
      pageSize={25}
      initialColumnVisibility={{ classNames: false }}
      enableSearchToolbar={false}
      renderMobileRow={renderMobileRow}
    />
  );
}
