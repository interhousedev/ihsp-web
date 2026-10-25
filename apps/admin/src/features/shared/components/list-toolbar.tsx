"use client"

import { useT } from "@ihsp/i18n"
import { Button, DatePicker, Icons, Input, useDebouncedCallback } from "@ihsp/ui"
import { useEffect, useState, type ReactNode } from "react"
import { TOUCH } from "../utils/touch"
import { SelectField, type SelectOption } from "./select-field"

export type ToolbarFilter =
  | { kind: "search"; key: string; label: string; placeholder?: string }
  | { kind: "select"; key: string; label: string; options: readonly SelectOption[]; allLabel: string }
  | { kind: "date"; key: string; label: string }

const SEARCH_DEBOUNCE_MS = 300

function SearchFilter({
  filter,
  value,
  onChange,
}: {
  filter: Extract<ToolbarFilter, { kind: "search" }>
  value: string | null
  onChange: (value: string | null) => void
}) {
  const [text, setText] = useState(value ?? "")
  const push = useDebouncedCallback(
    (next: string) => onChange(next.trim() === "" ? null : next.trim()),
    SEARCH_DEBOUNCE_MS,
  )

  // The URL changed from outside (reset button, back button).
  useEffect(() => {
    setText(value ?? "")
  }, [value])

  return (
    <div className="relative w-full sm:w-64">
      <Icons.search
        className="text-muted-foreground pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2"
        aria-hidden
      />
      <Input
        type="search"
        value={text}
        aria-label={filter.label}
        placeholder={filter.placeholder ?? filter.label}
        className={`${TOUCH} ps-8`}
        onChange={(event) => {
          setText(event.target.value)
          push(event.target.value)
        }}
      />
    </div>
  )
}

/**
 * Search box, select filters and date filters above a list. Values come from `useFilterState` (the URL); `children`
 * holds the list's own actions (export, new item).
 */
export function ListToolbar({
  filters,
  values,
  onChange,
  onReset,
  active,
  children,
}: {
  filters: readonly ToolbarFilter[]
  values: Record<string, string | null>
  onChange: (key: string, value: string | null) => void
  onReset: () => void
  active: boolean
  children?: ReactNode
}) {
  const t = useT()
  return (
    <div role="toolbar" aria-label={t("shared.filters")} className="flex flex-wrap items-end gap-2">
      {filters.map((filter) => {
        if (filter.kind === "search") {
          return (
            <SearchFilter
              key={filter.key}
              filter={filter}
              value={values[filter.key] ?? null}
              onChange={(next) => onChange(filter.key, next)}
            />
          )
        }
        if (filter.kind === "select") {
          return (
            <div key={filter.key} className="w-full sm:w-auto sm:min-w-40">
              <SelectField
                aria-label={filter.label}
                value={values[filter.key]}
                emptyLabel={filter.allLabel}
                options={filter.options}
                onChange={(next) => onChange(filter.key, next === "" ? null : next)}
              />
            </div>
          )
        }
        const value = values[filter.key] ?? null
        return (
          <div key={filter.key} className="flex w-full items-center gap-1 sm:w-auto">
            <DatePicker
              value={value}
              aria-label={filter.label}
              placeholder={filter.label}
              onChange={(next) => onChange(filter.key, next)}
              className="sm:w-44"
            />
            {value ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-11 md:size-8"
                aria-label={`${t("common.clear")}: ${filter.label}`}
                onClick={() => onChange(filter.key, null)}
              >
                <Icons.close aria-hidden />
              </Button>
            ) : null}
          </div>
        )
      })}
      {active ? (
        <Button type="button" variant="outline" className={TOUCH} onClick={onReset}>
          <Icons.close aria-hidden />
          {t("common.reset")}
        </Button>
      ) : null}
      {children ? <div className="ms-auto flex flex-wrap items-center gap-2">{children}</div> : null}
    </div>
  )
}
