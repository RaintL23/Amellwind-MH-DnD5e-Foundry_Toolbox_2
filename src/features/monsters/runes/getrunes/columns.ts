import MonsterCarveTableItem from "@/models/monster/monsterCarveTableItem";
import { ColumnDef } from "@tanstack/react-table";

export const columns: ColumnDef<MonsterCarveTableItem>[] = [
  {
    accessorKey: "carveRange",
    header: "Carve Chance",
  },
  {
    accessorKey: "captureRange",
    header: "Capture Chance",
  },
  {
    id: "name",
    accessorKey: "runeName",
    header: "Rune",
  },
  {
    accessorKey: "slot",
    header: "Slot",
  },
];
