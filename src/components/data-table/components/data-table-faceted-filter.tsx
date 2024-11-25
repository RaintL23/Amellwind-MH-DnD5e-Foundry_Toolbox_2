import * as React from "react";
import { CheckIcon, PlusCircledIcon } from "@radix-ui/react-icons";
import { Column } from "@tanstack/react-table";

import { cn } from "@/lib/utils";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "../../ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import { Separator } from "../../ui/separator";

interface DataTableFacetedFilterProps<TData, TValue> {
  column?: Column<TData, TValue>;
  title?: string;
  options: DataTableFacetedFiltersOptions[];
}

export interface DataTableFacetedFiltersOptions {
  value: number | boolean;
  name: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export function DataTableFacetedFilter<TData, TValue>({
  column,
  title,
  options,
}: DataTableFacetedFilterProps<TData, TValue>) {
  const facets = column?.getFacetedUniqueValues();
  const selectedValues = new Set(column?.getFilterValue() as string[]);

  return (
    <Popover>
      <PopoverTrigger asChild className="h-6">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mb-0.5 h-6 border border-gray-200 bg-transparent px-2 shadow-sm"
        >
          <PlusCircledIcon className="mr-2 size-3.5" />
          {title}
          {selectedValues?.size > 0 && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <div className="hidden h-4 space-x-1 lg:flex">
                <Badge
                  variant="default"
                  className="rounded-sm px-1 text-xs hover:bg-primary"
                >
                  {selectedValues.size}
                </Badge>
              </div>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar opciones" />
          <CommandList>
            <CommandEmpty>No se han encontrado resultados.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selectedValues.has(option.value.toString());
                return (
                  <CommandItem
                    key={option.name}
                    onSelect={() => {
                      if (isSelected) {
                        selectedValues.delete(option.value.toString());
                      } else {
                        selectedValues.add(option.value.toString());
                      }
                      const filterValues = Array.from(selectedValues);
                      column?.setFilterValue(
                        filterValues.length ? filterValues : undefined,
                      );
                    }}
                  >
                    <div
                      className={cn(
                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "opacity-50 [&_svg]:invisible",
                      )}
                    >
                      <CheckIcon className={cn("h-4 w-4")} />
                    </div>
                    {option.icon && (
                      <option.icon className="mr-2 size-4 text-muted-foreground" />
                    )}
                    <span>{option.name}</span>
                    {facets?.get(option.value) && (
                      <span className="ml-auto flex size-4 items-center justify-center font-mono text-xs">
                        {facets.get(option.value)}
                      </span>
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
            {selectedValues.size > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => column?.setFilterValue(undefined)}
                    className="justify-center text-center"
                  >
                    Limpiar filtro
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
