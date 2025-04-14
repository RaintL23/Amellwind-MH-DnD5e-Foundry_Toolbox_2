import MonsterRune from "@/models/monster/monsterRune1";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";

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
    accessorKey: "tier",
    header: "Tier",
    cell: ({ row }) => {
      if (row.original.tier) {
        const size = Tiers.filter((x) => row.original.tier === x.value);
        return (
          <div className="flex space-x-2">
            {size.map((x) => (
              <div key={x.label}>
                {x && <Badge variant="outline">T{x.value}</Badge>}
              </div>
            ))}
          </div>
        );
      } else {
        return <span></span>;
      }
    },
    filterFn: (row, columnId, filterValue) => {
      const cellValue = row.getValue(columnId) as number | undefined;

      if (
        !filterValue ||
        (Array.isArray(filterValue) && filterValue.length === 0)
      ) {
        return true;
      }

      return (filterValue as number[]).includes(cellValue ?? -1);
    },
  },
  {
    id: "type.tags",
    accessorKey: "type.tags",
    header: "Tags",
    filterFn: (row, columnId, filterValue) => {
      const cellValue = row.getValue(columnId) as string[] | undefined;

      if (
        !filterValue ||
        (Array.isArray(filterValue) && filterValue.length === 0)
      ) {
        return true;
      }

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

export const Tiers = [
  {
    value: 0,
    label: "T0",
    color: "",
  },
  {
    value: 1,
    label: "T1",
    color: "",
  },
  {
    value: 2,
    label: "T2",
    color: "",
  },
  {
    value: 3,
    label: "T3",
    color: "",
  },
  {
    value: 4,
    label: "T4",
    color: "",
  },
  {
    value: 5,
    label: "T5",
    color: "",
  },
];
