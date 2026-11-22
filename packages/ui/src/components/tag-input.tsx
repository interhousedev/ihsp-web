"use client"

import { useState, type KeyboardEvent, type ReactNode } from "react"
import { cn } from "../lib/utils"
import { Icons } from "./icons"
import { Pill } from "./pill"

/**
 * Free-text tags: Enter or a comma adds the typed text, Backspace in an empty field removes the last tag. Duplicates
 * (ignoring case) and tags beyond `max` are dropped. All labels come from the caller, so the text is translated there.
 * With `options` the field is a searchable multi-select: only listed values can be added, each shown by its label.
 */
export type TagOption = {
  value: string
  label: string
  icon?: ReactNode
  /** Listed (and searchable) but not selectable; `hint` says why. */
  disabled?: boolean
  hint?: string
}

export function TagInput({
  value,
  onChange,
  placeholder,
  removeLabel,
  max,
  options,
  maxLength = 60,
  disabled,
  id,
  className,
  "aria-label": ariaLabel,
}: {
  value: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  /** Accessible name of a tag's remove button; gets the tag's text. */
  removeLabel: (tag: string) => string
  max?: number
  options?: TagOption[]
  maxLength?: number
  disabled?: boolean
  id?: string
  className?: string
  "aria-label"?: string
}) {
  const [draft, setDraft] = useState("")
  const full = max !== undefined && value.length >= max

  const labelOf = (tag: string) => options?.find((option) => option.value === tag)?.label ?? tag
  const query = draft.trim().toLowerCase()
  const matches = options
    ? options
        .filter((option) => !value.includes(option.value) && (!query || option.label.toLowerCase().includes(query)))
        .slice(0, 8)
    : []

  function commit(text: string) {
    let tag = text.trim().slice(0, maxLength)
    setDraft("")
    if (options) {
      const found = options.find((option) => option.label.toLowerCase() === tag.toLowerCase())
      if (!found || found.disabled) return
      tag = found.value
    }
    if (!tag || full || value.some((existing) => existing.toLowerCase() === tag.toLowerCase())) return
    onChange([...value, tag])
  }

  function add(tag: string) {
    setDraft("")
    if (!full) onChange([...value, tag])
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault()
      const first = matches.find((option) => !option.disabled)
      if (options && first) add(first.value)
      else commit(draft)
    } else if (event.key === "Backspace" && draft === "" && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div
      className={cn(
        "border-input bg-background relative flex min-h-10 flex-wrap items-center gap-1.5 rounded-lg border px-2 py-1.5",
        "focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50",
        disabled && "opacity-50",
        className,
      )}
    >
      {value.map((tag) => (
        <Pill key={tag} className="h-6 gap-1 pr-1 pl-2.5 text-xs">
          {options?.find((option) => option.value === tag)?.icon}
          {labelOf(tag)}
          <button
            type="button"
            disabled={disabled}
            aria-label={removeLabel(labelOf(tag))}
            onClick={() => onChange(value.filter((existing) => existing !== tag))}
            className="hover:bg-accent flex size-5 cursor-pointer items-center justify-center rounded-full focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <Icons.close className="size-3" />
          </button>
        </Pill>
      ))}
      <input
        id={id}
        aria-label={ariaLabel}
        value={draft}
        disabled={disabled || full}
        placeholder={value.length === 0 ? placeholder : undefined}
        maxLength={maxLength}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => (options ? setDraft("") : commit(draft))}
        className="placeholder:text-muted-foreground min-w-24 flex-1 bg-transparent text-sm outline-none"
      />
      {options && query && matches.length > 0 && (
        <ul className="bg-popover text-popover-foreground absolute inset-x-0 top-full z-20 mt-1 max-h-56 overflow-auto rounded-lg border p-1 shadow-md">
          {matches.map((option) => (
            <li key={option.value}>
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                disabled={option.disabled}
                onClick={() => add(option.value)}
                className="hover:bg-accent flex min-h-11 w-full cursor-pointer items-center gap-2 rounded-md px-2 text-left text-sm disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent md:min-h-8"
              >
                {option.icon}
                {option.label}
                {option.disabled && option.hint ? (
                  <span className="text-muted-foreground ms-auto text-xs">{option.hint}</span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
