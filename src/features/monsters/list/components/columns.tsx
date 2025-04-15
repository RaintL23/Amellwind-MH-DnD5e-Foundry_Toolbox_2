// import { ColumnBasic } from "@/components/data-table/data-table-interfaces";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import MonsterType from "@/models/monster/monsterType";
import { capitalizeFirstLetter } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import { DropdownMonsterMenu } from "./monsterMenu";
import { getMonster } from "@/api/monsters/monstersClient";

export const columns: ColumnDef<MonsterType>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="bg-transparent"
        >
          Name
          <ArrowUpDown />
        </Button>
      );
    },
  },
  {
    accessorKey: "size",
    header: "Size",
    cell: ({ row }) => {
      if (row.original.size) {
        const size = Sizes.filter((x) => row.original.size?.includes(x.label));
        return (
          <div className="flex space-x-2">
            {size.map((x) => (
              <div key={x.label}>
                {x && <Badge variant="outline">{x.value}</Badge>}
              </div>
            ))}
          </div>
        );
      } else {
        return <span></span>;
      }
    },
  },
  {
    accessorKey: "group",
    header: "Type",
    cell: ({ row }) => {
      if (row.original.group) {
        return (
          <div className="flex space-x-2">
            <Badge variant="outline" className="whitespace-nowrap">
              {row.original.group}
            </Badge>
          </div>
        );
      } else if (row.original.type) {
        return (
          <div className="flex space-x-2">
            <Badge variant="outline" className="whitespace-nowrap">
              {capitalizeFirstLetter(
                typeof row.original.type === "string"
                  ? row.original.type
                  : typeof row.original.type === "object"
                  ? row.original.type.type
                  : ""
              )}
            </Badge>
          </div>
        );
      } else {
        return <span></span>;
      }
    },
  },
  {
    accessorKey: "environment",
    header: "Environment",
    cell: ({ row }) => {
      if (row.original.environment) {
        const evns = Enviroments.filter((x) =>
          row.original.environment?.includes(x.value)
        );
        return (
          <div className="flex space-x-2">
            {evns.map((env) => (
              <div key={env.label}>
                {env && <Badge className={env.color}>{env.label}</Badge>}
              </div>
            ))}
          </div>
        );
      } else {
        return <span></span>;
      }
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      return <DropdownMonsterMenu monsterName={row.original.name} />;
    },
  },
];

export const Enviroments = [
  {
    value: "arctic",
    label: "Arctic",
    color: "bg-[#b0f2ff] text-black",
  },
  {
    value: "coastal",
    label: "Coastal",
    color: "bg-[#e6d597] text-black",
  },
  {
    value: "desert",
    label: "Desert",
    color: "bg-[#e0c35a] text-black",
  },
  {
    value: "forest",
    label: "Forest",
    color: "bg-[#157d1c] text-white",
  },
  {
    value: "grassland",
    label: "Grassland",
    color: "bg-[#1bfa2a] text-black",
  },
  {
    value: "mountain",
    label: "Mountain",
    color: "bg-[#7d5c15] text-white",
  },
  {
    value: "underdark",
    label: "Underdark",
    color: "bg-[#292929] text-white",
  },
  {
    value: "urban",
    label: "Urban",
    color: "bg-[#737270] text-white",
  },
];

export const Sizes = [
  {
    value: "Tiny",
    label: "T",
  },
  {
    value: "Small",
    label: "S",
  },
  {
    value: "Medium",
    label: "M",
  },
  {
    value: "Large",
    label: "L",
  },
  {
    value: "Huge",
    label: "H",
  },
  {
    value: "Gargantuan",
    label: "G",
  },
];
