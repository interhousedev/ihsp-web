"use client"

import type { DataTableContent } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, Dropdown } from "@ihsp/ui"
import { useId } from "react"
import type { SortState } from "./sort-rows"

type SortControlsProps = {
  columns: DataTableContent["columns"]
  sort: SortState
  onChange: (sort: SortState) => void
}

/** Sorting for the card layout of a phone (no headers there): a column select and the direction. */
export function SortControls({ columns, sort, onChange }: SortControlsProps) {
  const t = useT("notebooks")
  const selectId = useId()
  return (
    <div className="flex items-end gap-2">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <label htmlFor={selectId} className="text-muted-foreground text-xs">
          {t("viewers.table.sortBy")}
        </label>
        <Dropdown
          id={selectId}
          className="w-full"
          value={sort?.key ?? ""}
          onValueChange={(value) => onChange(value === "" ? null : { key: value, direction: sort?.direction ?? "asc" })}
          options={[
            { value: "", label: t("viewers.table.sortNone") },
            ...columns.map((column) => ({ value: column.key, label: column.label })),
          ]}
        />
      </div>
      <Button
        type="button"
        variant="outline"
        className="min-h-11"
        disabled={sort === null}
        onClick={() => sort && onChange({ ...sort, direction: sort.direction === "asc" ? "desc" : "asc" })}
      >
        {sort?.direction === "desc" ? t("viewers.table.descending") : t("viewers.table.ascending")}
      </Button>
    </div>
  )
}
