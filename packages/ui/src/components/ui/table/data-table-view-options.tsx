"use client"

import { useT } from "@ihsp/i18n"

import type { Table } from "@tanstack/react-table"
import { Icons } from "../../icons"

import { Button } from "../button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "../command"
import { Popover, PopoverContent, PopoverTrigger } from "../popover"
import { cn } from "../../../lib/utils"
import * as React from "react"

interface DataTableViewOptionsProps<TData> {
  table: Table<TData>
}

export function DataTableViewOptions<TData>({ table }: DataTableViewOptionsProps<TData>) {
  const t = useT()
  const columns = React.useMemo(
    () => table.getAllColumns().filter((column) => typeof column.accessorFn !== "undefined" && column.getCanHide()),
    [table],
  )

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button aria-label={t("table.columns")} variant="outline" size="sm" className="ml-auto hidden h-8 lg:flex" />
        }
      >
        <Icons.adjustments />
        {t("table.columns")}
        <Icons.chevronsUpDown className="ml-auto opacity-50" />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-44 p-0">
        <Command>
          <CommandInput placeholder={t("table.searchColumns")} />
          <CommandList>
            <CommandEmpty>{t("table.noColumns")}</CommandEmpty>
            <CommandGroup>
              {columns.map((column) => (
                <CommandItem key={column.id} onSelect={() => column.toggleVisibility(!column.getIsVisible())}>
                  <span className="truncate">{column.columnDef.meta?.label ?? column.id}</span>
                  <Icons.check
                    className={cn("ml-auto size-4 shrink-0", column.getIsVisible() ? "opacity-100" : "opacity-0")}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
