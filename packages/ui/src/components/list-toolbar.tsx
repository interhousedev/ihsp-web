"use client"

import { useT } from "@ihsp/i18n"
import { useEffect, useState, type ReactNode } from "react"
import { useDebouncedCallback } from "../hooks/use-debounced-callback"
import { cn } from "../lib/utils"
import { DatePicker } from "./date-picker"
import { Icons } from "./icons"
import { Button } from "./ui/button"
import { Dropdown } from "./ui/dropdown"
import { Input } from "./ui/input"

export type ToolbarOption = { value: string; label: string; disabled?: boolean }

export type ToolbarFilter =
  | {
      kind: "search"
      key: string
      label: string
      placeholder?: string
      /** Delay before `onChange`; 0 for a list filtered on the client. */
      debounceMs?: number
    }
  | { kind: "select"; key: string; label: string; options: readonly ToolbarOption[]; allLabel: string }
  | { kind: "date"; key: string; label: string }
  /** A few choices always in view as buttons, scrolling sideways on a phone. `allValue` means "no filter". */
  | { kind: "segment"; key: string; label: string; options: readonly ToolbarOption[]; allValue: string }

/** A filter the toolbar cannot draw itself (one kept in a sheet, a link parameter) shown among the active chips. */
export type ToolbarChip = { key: string; label: string; onRemove: () => void }

const TOUCH = "min-h-11 md:min-h-8"
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
  const delay = filter.debounceMs ?? SEARCH_DEBOUNCE_MS
  const emit = (next: string) => onChange(next.trim() === "" ? null : next.trim())
  const debounced = useDebouncedCallback(emit, delay)

  // The value changed from outside (reset button, chip, back button).
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
        className={cn(TOUCH, "ps-8")}
        onChange={(event) => {
          setText(event.target.value)
          if (delay === 0) emit(event.target.value)
          else debounced(event.target.value)
        }}
      />
    </div>
  )
}

function SegmentFilter({
  filter,
  value,
  onChange,
}: {
  filter: Extract<ToolbarFilter, { kind: "segment" }>
  value: string | null
  onChange: (value: string | null) => void
}) {
  const current = value ?? filter.allValue
  return (
    <div
      role="group"
      aria-label={filter.label}
      className="-mx-4 flex w-screen max-w-none gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:w-auto sm:px-0"
    >
      {filter.options.map((option) => (
        <Button
          key={option.value}
          type="button"
          size="sm"
          variant={option.value === current ? "default" : "outline"}
          className={cn(TOUCH, "shrink-0 rounded-full px-4")}
          disabled={option.disabled}
          aria-pressed={option.value === current}
          onClick={() => onChange(option.value === filter.allValue ? null : option.value)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  )
}

function activeChip(
  filter: ToolbarFilter,
  value: string | null | undefined,
  onChange: (key: string, value: string | null) => void,
): ToolbarChip | null {
  // A segment shows its choice itself; a chip would only repeat it.
  if (!value || filter.kind === "segment") return null
  const shown =
    filter.kind === "select" ? (filter.options.find((option) => option.value === value)?.label ?? value) : value
  return { key: filter.key, label: `${filter.label}: ${shown}`, onRemove: () => onChange(filter.key, null) }
}

/**
 * The filters above a list, the chips of the active ones and a reset. `children` holds the list's own actions (export,
 * new item), `leading` a control placed before the filters (the button of a filter sheet). `extraChips` lists active
 * filters that have no control here. Values usually come from the URL, so the caller owns them.
 */
export function ListToolbar({
  filters,
  values,
  onChange,
  onReset,
  active,
  extraChips,
  leading,
  className,
  children,
}: {
  filters: readonly ToolbarFilter[]
  values: Readonly<Record<string, string | null | undefined>>
  onChange: (key: string, value: string | null) => void
  onReset?: () => void
  /** Whether the reset shows; by default, when any filter has a value. */
  active?: boolean
  extraChips?: readonly ToolbarChip[]
  leading?: ReactNode
  className?: string
  children?: ReactNode
}) {
  const t = useT()
  const chips = [
    ...filters.flatMap((filter) => activeChip(filter, values[filter.key], onChange) ?? []),
    ...(extraChips ?? []),
  ]
  const hasValue = filters.some((filter) => Boolean(values[filter.key]))
  const showReset = Boolean(onReset) && (active ?? (hasValue || chips.length > 0))
  return (
    <div role="toolbar" aria-label={t("common.filters")} className={cn("flex flex-wrap items-end gap-2", className)}>
      {leading}
      {filters.map((filter) => {
        const value = values[filter.key] ?? null
        if (filter.kind === "search") {
          return (
            <SearchFilter
              key={filter.key}
              filter={filter}
              value={value}
              onChange={(next) => onChange(filter.key, next)}
            />
          )
        }
        if (filter.kind === "segment") {
          return (
            <SegmentFilter
              key={filter.key}
              filter={filter}
              value={value}
              onChange={(next) => onChange(filter.key, next)}
            />
          )
        }
        if (filter.kind === "select") {
          return (
            <div key={filter.key} className="w-full sm:w-auto sm:min-w-40">
              <Dropdown
                aria-label={filter.label}
                value={value ?? ""}
                className="w-full [&_button]:min-h-11 md:[&_button]:min-h-8"
                onValueChange={(next) => onChange(filter.key, next === "" ? null : next)}
                options={[{ value: "", label: filter.allLabel }, ...filter.options]}
              />
            </div>
          )
        }
        return (
          <div key={filter.key} className="w-full sm:w-auto">
            <DatePicker
              value={value}
              aria-label={filter.label}
              placeholder={filter.label}
              onChange={(next) => onChange(filter.key, next)}
              className="sm:w-44"
            />
          </div>
        )
      })}
      {children ? <div className="ms-auto flex flex-wrap items-center gap-2">{children}</div> : null}
      {chips.length > 0 || showReset ? (
        <div className="flex w-full flex-wrap items-center gap-2">
          {chips.map((chip) => (
            <Button
              key={chip.key}
              type="button"
              size="sm"
              variant="secondary"
              className={cn(TOUCH, "max-w-full rounded-full")}
              aria-label={`${t("common.clear")}: ${chip.label}`}
              onClick={chip.onRemove}
            >
              <span className="truncate">{chip.label}</span>
              <Icons.close aria-hidden />
            </Button>
          ))}
          {showReset ? (
            <Button type="button" variant="ghost" size="sm" className={TOUCH} onClick={onReset}>
              <Icons.close aria-hidden />
              {t("common.reset")}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
