import { useCallback } from "react";
import { Weapon, DMG_TYPE_LABELS } from "@/shared/types";
import { DataTable } from "@/components/data-table/data-table";
import { CompendiumMobileCard } from "@/shared/components/CompendiumMobileCard";
import {
  getWeaponDamageDisplay,
  getWeaponRowId,
  weaponColumns,
} from "./weapon-columns";

interface WeaponDataTableProps {
  weapons: Weapon[];
  onRowClick: (weapon: Weapon) => void;
}

export function WeaponDataTable({ weapons, onRowClick }: WeaponDataTableProps) {
  const renderMobileRow = useCallback(
    (weapon: Weapon) => (
      <CompendiumMobileCard
        title={weapon.name}
        onSelect={() => onRowClick(weapon)}
        primary={
          <span>
            {getWeaponDamageDisplay(weapon)}{" "}
            {DMG_TYPE_LABELS[weapon.dmgType] ?? weapon.dmgType}
          </span>
        }
        secondary={
          weapon.range ? <span>Range: {weapon.range}</span> : undefined
        }
      />
    ),
    [onRowClick],
  );

  return (
    <DataTable
      columns={weaponColumns}
      data={weapons}
      getRowId={getWeaponRowId}
      onRowClick={onRowClick}
      emptyMessage="No weapons found with those filters."
      pageSize={25}
      enableSearchToolbar={false}
      initialSorting={[]}
      renderMobileRow={renderMobileRow}
    />
  );
}
