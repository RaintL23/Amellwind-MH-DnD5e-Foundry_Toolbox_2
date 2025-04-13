import MonsterRune from "@/models/monster/monsterRune1";
import { ColumnDef } from "@tanstack/react-table";

export const columns: ColumnDef<MonsterRune>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    id: "type.type",
    accessorKey: "type.type",
    header: "Type",
  },
  {
    id: "type.tags",
    accessorKey: "type.tags",
    header: "Tags",
    filterFn: (row, columnId, filterValue) => {
      const cellValue = row.getValue(columnId) as string[] | undefined;

      // 👇 Si no hay filtros seleccionados, mostrar todo
      if (
        !filterValue ||
        (Array.isArray(filterValue) && filterValue.length === 0)
      ) {
        return true;
      }

      // Comparar tags
      return (filterValue as string[]).some((tag) => cellValue?.includes(tag));
    },
  },

  {
    accessorKey: "monsterName",
    header: "Origin",
  },
  {
    accessorKey: "effect",
    header: "Effect",
  },
];
