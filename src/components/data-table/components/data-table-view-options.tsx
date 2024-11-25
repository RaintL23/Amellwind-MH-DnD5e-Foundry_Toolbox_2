import { DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import {
  MixerHorizontalIcon,
  EyeOpenIcon,
  EyeNoneIcon,
} from "@radix-ui/react-icons";
import { Table } from "@tanstack/react-table";

import { Button } from "../../ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "../../ui/dropdown-menu";
import { ColumnBasic } from "../data-table-interfaces";

interface DataTableViewOptionsProps<TData> {
  table: Table<TData>;
  columns: ColumnBasic<TData>[];
  canFilter: boolean;
  setCanFilter: React.Dispatch<React.SetStateAction<boolean>>;
}

export function DataTableViewOptions<TData>({
  table,
  columns,
  canFilter,
  setCanFilter,
}: DataTableViewOptionsProps<TData>) {
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="ml-auto hidden h-8 lg:flex"
          >
            <MixerHorizontalIcon className="mr-2 size-4" />
            Alternar
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="max-h-80 w-full max-w-[200px] overflow-y-auto"
        >
          <DropdownMenuLabel className="text-center">
            Alternar Columnas
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {table
            .getAllColumns()
            .filter(
              (column) =>
                typeof column.accessorFn !== "undefined" && column.getCanHide(),
            )
            .map((column) => {
              const columnBasic = columns.find((x) => x.id == column.id);
              return (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="capitalize"
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                >
                  {columnBasic != undefined || columnBasic != null
                    ? columnBasic.headerTitle
                    : column.id}
                </DropdownMenuCheckboxItem>
              );
            })}
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="hidden h-8 lg:flex"
        onClick={() => setCanFilter(!canFilter)}
      >
        {canFilter ? (
          <EyeOpenIcon className="mr-2 size-4" />
        ) : (
          <EyeNoneIcon className="mr-2 size-4" />
        )}
        Filtros
      </Button>
    </>
  );
}
