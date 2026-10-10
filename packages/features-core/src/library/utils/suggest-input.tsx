"use client"

import { Input, cn } from "@ihsp/ui"
import { useEffect, useState } from "react"

export type SuggestOption = { value: string; hint?: string }

/** `value` after `delay` ms without a change: the search waits for the user to pause. */
export function useDebouncedValue<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

/**
 * A text input with suggestions under it (an ARIA combobox). Arrow keys move through the list; Enter picks the
 * highlighted suggestion, or, with none highlighted, passes the typed text to `onSubmitText`. Enter never submits the
 * surrounding form. Escape closes the list. The parent filters `options` (for example, drops values already chosen).
 */
export function SuggestInput({
  id,
  value,
  onChange,
  options,
  loading = false,
  label,
  placeholder,
  noMatchesText,
  listLabel,
  invalid = false,
  disabled = false,
  className,
  onPick,
  onSubmitText,
}: {
  id: string
  value: string
  onChange: (value: string) => void
  options: readonly SuggestOption[]
  loading?: boolean
  label: string
  placeholder?: string
  /** Shown under the input when nothing matches and something is typed. */
  noMatchesText?: string
  listLabel: string
  invalid?: boolean
  disabled?: boolean
  className?: string
  onPick: (option: SuggestOption) => void
  onSubmitText?: (text: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const listId = `${id}-listbox`
  const showList = open && !disabled && (options.length > 0 || (value.trim() !== "" && noMatchesText !== undefined))
  const optionId = (index: number) => `${id}-option-${index}`

  function pick(option: SuggestOption) {
    onPick(option)
    setActive(-1)
  }

  return (
    <div className="relative">
      <Input
        id={id}
        role="combobox"
        aria-label={label}
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={showList && active >= 0 ? optionId(active) : undefined}
        aria-invalid={invalid}
        autoComplete="off"
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        className={cn("min-h-11 md:min-h-8", className)}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          setOpen(false)
          setActive(-1)
        }}
        onChange={(event) => {
          onChange(event.target.value)
          setOpen(true)
          setActive(-1)
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault()
            setOpen(true)
            setActive((current) => Math.min(current + 1, options.length - 1))
          } else if (event.key === "ArrowUp") {
            event.preventDefault()
            setActive((current) => Math.max(current - 1, -1))
          } else if (event.key === "Escape") {
            setOpen(false)
            setActive(-1)
          } else if (event.key === "Enter") {
            event.preventDefault()
            const chosen = showList && active >= 0 ? options[active] : undefined
            if (chosen) pick(chosen)
            else if (value.trim() !== "") onSubmitText?.(value.trim())
          }
        }}
      />
      {showList ? (
        <div
          id={listId}
          role="listbox"
          aria-label={listLabel}
          className="bg-popover text-popover-foreground absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-md border shadow-md"
        >
          {options.map((option, index) => (
            <div
              key={option.value}
              id={optionId(index)}
              role="option"
              tabIndex={-1}
              aria-selected={index === active}
              className={cn(
                "flex min-h-11 cursor-pointer items-center justify-between gap-3 px-3 text-sm md:min-h-8",
                index === active && "bg-accent text-accent-foreground",
              )}
              onMouseDown={(event) => {
                event.preventDefault()
                pick(option)
              }}
            >
              <span className="truncate">{option.value}</span>
              {option.hint ? <span className="text-muted-foreground shrink-0 text-xs">{option.hint}</span> : null}
            </div>
          ))}
          {options.length === 0 && !loading && value.trim() !== "" && noMatchesText ? (
            <div className="text-muted-foreground px-3 py-2 text-sm">{noMatchesText}</div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
