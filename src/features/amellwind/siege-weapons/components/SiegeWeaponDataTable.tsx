import { useCallback } from "react";
import type { SiegeWeapon } from "@/shared/types";
import { DataTable } from "@/components/data-table/data-table";
import { CompendiumMobileCard } from "@/shared/components/CompendiumMobileCard";
import { siegeWeaponColumns } from "./siege-weapon-columns";

interface SiegeWeaponDataTableProps {
  weapons: SiegeWeapon[];
  onRowClick: (weapon: SiegeWeapon) => void;
}

function getSiegeWeaponRowId(row: SiegeWeapon): string {
  return row.id;
}

export function SiegeWeaponDataTable({
  weapons,
  onRowClick,
}: SiegeWeaponDataTableProps) {
  const renderMobileRow = useCallback(
    (weapon: SiegeWeapon) => (
      <CompendiumMobileCard
        title={weapon.name}
        onSelect={() => onRowClick(weapon)}
        primary={
          <>
            <span>{weapon.objectTypeLabel}</span>
            <span aria-hidden="true">·</span>
            <span>{weapon.sizeLabel}</span>
          </>
        }
        secondary={
          <span>
            AC {weapon.acLabel} · HP {weapon.hpLabel}
          </span>
        }
      />
    ),
    [onRowClick],
  );

  return (
    <DataTable
      columns={siegeWeaponColumns}
      data={weapons}
      getRowId={getSiegeWeaponRowId}
      onRowClick={onRowClick}
      emptyMessage="No siege weapons found."
      pageSize={25}
      enableSearchToolbar={false}
      renderMobileRow={renderMobileRow}
    />
  );
}
