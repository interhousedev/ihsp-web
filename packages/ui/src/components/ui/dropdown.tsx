"use client"

import * as React from "react"

import { cn } from "../../lib/utils"
import { IconCheck, IconChevronDown, IconSearch } from "../icons"

export type DropdownOption = {
  value: string
  label: string
  disabled?: boolean
}

type DropdownBaseProps = {
  options: DropdownOption[]
  /** Shown while nothing is selected. */
  placeholder?: string
  /** Form field name. Single mode posts one value, multi mode posts one entry per selected value. */
  name?: string
  id?: string
  disabled?: boolean
  required?: boolean
  "aria-label"?: string
  "aria-labelledby"?: string
  "aria-describedby"?: string
  "aria-invalid"?: boolean
  /** Shown in the list when a search matches nothing. */
  emptyLabel?: string
  size?: "sm" | "default"
  className?: string
  onOpenChange?: (open: boolean) => void
}

/** Searchable mode needs translated copy: the placeholder and the accessible name of the search field. */
type DropdownSearchProps =
  | {
      /** Adds a search field at the top of the list that filters options by label. */
      searchable: true
      searchPlaceholder: string
      /** Accessible name of the search field (translated). */
      searchLabel: string
    }
  | {
      searchable?: false
      searchPlaceholder?: never
      searchLabel?: never
    }

type DropdownSingleProps = DropdownBaseProps &
  DropdownSearchProps & {
    multiple?: false
    value?: string
    defaultValue?: string
    onValueChange?: (value: string) => void
  }

type DropdownMultiProps = DropdownBaseProps &
  DropdownSearchProps & {
    multiple: true
    value?: string[]
    defaultValue?: string[]
    onValueChange?: (value: string[]) => void
  }

export type DropdownProps = DropdownSingleProps | DropdownMultiProps

const TYPE_AHEAD_RESET_MS = 600

function isPrintable(key: string) {
  return key.length === 1 && key !== " "
}

/**
 * Custom select with a listbox popup. Focus stays on the trigger (or on the search field when `searchable`), and
 * the highlighted option is announced through `aria-activedescendant`.
 *
 * Keys: Arrow keys move, Home/End jump, Enter or Space choose, Esc closes and returns focus to the trigger, Tab
 * closes, and printable keys jump to the next option whose label starts with what was typed.
 */
function Dropdown(props: DropdownProps) {
  const {
    options,
    placeholder = "",
    name,
    id,
    disabled,
    required,
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
    "aria-describedby": ariaDescribedBy,
    "aria-invalid": ariaInvalid,
    searchable = false,
    searchPlaceholder = "",
    searchLabel = "",
    emptyLabel = "",
    size = "default",
    className,
    onOpenChange,
  } = props
  const multiple = props.multiple === true

  const generatedId = React.useId()
  const listboxId = `${generatedId}-listbox`
  const optionId = (index: number) => `${generatedId}-option-${index}`

  // Selection is held as a list internally so single and multi share one code path.
  const isControlled = props.value !== undefined
  const [innerValue, setInnerValue] = React.useState<string[]>(() => toList(props.defaultValue, multiple))
  const selected: string[] = isControlled ? toList(props.value, multiple) : innerValue

  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [active, setActive] = React.useState(-1)
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const searchRef = React.useRef<HTMLInputElement>(null)
  const listRef = React.useRef<HTMLDivElement>(null)
  const typeAhead = React.useRef<{ text: string; timer?: ReturnType<typeof setTimeout> }>({ text: "" })

  const visible = React.useMemo(() => {
    const needle = query.trim().toLowerCase()
    return needle ? options.filter((option) => option.label.toLowerCase().includes(needle)) : options
  }, [options, query])

  const selectedLabels = selected
    .map((value) => options.find((option) => option.value === value)?.label)
    .filter((label): label is string => label !== undefined)

  const setOpenState = (next: boolean) => {
    setOpen(next)
    onOpenChange?.(next)
    if (!next) {
      setQuery("")
      setActive(-1)
    }
  }

  const commit = (next: string[]) => {
    if (!isControlled) setInnerValue(next)
    if (multiple) {
      ;(props.onValueChange as ((value: string[]) => void) | undefined)?.(next)
    } else {
      ;(props.onValueChange as ((value: string) => void) | undefined)?.(next[0] ?? "")
    }
  }

  const choose = (option: DropdownOption) => {
    if (option.disabled) return
    if (multiple) {
      const next = selected.includes(option.value)
        ? selected.filter((value) => value !== option.value)
        : [...selected, option.value]
      commit(next)
      return
    }
    commit([option.value])
    setOpenState(false)
    triggerRef.current?.focus()
  }

  const enabledIndexes = visible.flatMap((option, index) => (option.disabled ? [] : [index]))

  const moveActive = (delta: 1 | -1 | "first" | "last") => {
    if (enabledIndexes.length === 0) return
    if (delta === "first") return setActive(enabledIndexes[0])
    if (delta === "last") return setActive(enabledIndexes[enabledIndexes.length - 1])
    const current = enabledIndexes.indexOf(active)
    const next = current === -1 ? (delta === 1 ? 0 : enabledIndexes.length - 1) : current + delta
    const clamped = Math.min(enabledIndexes.length - 1, Math.max(0, next))
    setActive(enabledIndexes[clamped])
  }

  const openList = () => {
    if (disabled) return
    const firstSelected = visible.findIndex((option) => option.value === selected[0] && !option.disabled)
    setOpenState(true)
    setActive(firstSelected !== -1 ? firstSelected : (enabledIndexes[0] ?? -1))
  }

  const jumpByText = (char: string) => {
    const ta = typeAhead.current
    clearTimeout(ta.timer)
    ta.text += char.toLowerCase()
    ta.timer = setTimeout(() => {
      ta.text = ""
    }, TYPE_AHEAD_RESET_MS)
    const start = Math.max(active, -1)
    const matches = (option: DropdownOption) => !option.disabled && option.label.toLowerCase().startsWith(ta.text)
    const after = visible.findIndex((option, index) => index > start && matches(option))
    const index = after !== -1 ? after : visible.findIndex(matches)
    if (index !== -1) setActive(index)
  }

  const handleKey = (event: React.KeyboardEvent<HTMLElement>) => {
    if (disabled) return
    const key = event.key
    if (!open) {
      if (key === "ArrowDown" || key === "ArrowUp" || key === "Enter" || (key === " " && !searchable)) {
        event.preventDefault()
        openList()
      } else if (isPrintable(key) && !multiple) {
        // Closed single select: type-ahead picks the option directly.
        const ta = typeAhead.current
        clearTimeout(ta.timer)
        ta.text += key.toLowerCase()
        ta.timer = setTimeout(() => {
          ta.text = ""
        }, TYPE_AHEAD_RESET_MS)
        const match = options.find((option) => !option.disabled && option.label.toLowerCase().startsWith(ta.text))
        if (match) commit([match.value])
      }
      return
    }

    switch (key) {
      case "ArrowDown":
        event.preventDefault()
        moveActive(1)
        return
      case "ArrowUp":
        event.preventDefault()
        moveActive(-1)
        return
      case "Home":
        if (!searchable) {
          event.preventDefault()
          moveActive("first")
        }
        return
      case "End":
        if (!searchable) {
          event.preventDefault()
          moveActive("last")
        }
        return
      case "Enter": {
        event.preventDefault()
        const option = visible[active]
        if (option) choose(option)
        else if (!multiple) setOpenState(false)
        return
      }
      case " ":
        if (!searchable) {
          event.preventDefault()
          const option = visible[active]
          if (option) choose(option)
        }
        return
      case "Escape":
        event.preventDefault()
        event.stopPropagation()
        setOpenState(false)
        triggerRef.current?.focus()
        return
      case "Tab":
        setOpenState(false)
        return
      default:
        if (!searchable && isPrintable(key)) {
          event.preventDefault()
          jumpByText(key)
        }
    }
  }

  // Close on outside pointer down.
  React.useEffect(() => {
    if (!open) return
    const onDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (triggerRef.current?.contains(target) || listRef.current?.contains(target)) return
      setOpenState(false)
    }
    document.addEventListener("pointerdown", onDown)
    return () => document.removeEventListener("pointerdown", onDown)
    // setOpenState is recreated each render but only reads stable setters and props
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Focus the search field when the list opens in searchable mode.
  React.useEffect(() => {
    if (open && searchable) searchRef.current?.focus()
  }, [open, searchable])

  // Keep the highlighted option in view.
  React.useEffect(() => {
    if (!open || active < 0) return
    const el = document.getElementById(optionId(active))
    el?.scrollIntoView?.({ block: "nearest" })
    // optionId only depends on generatedId
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, open])

  const activeId = open && active >= 0 ? optionId(active) : undefined
  const triggerText = selectedLabels.length === 0 ? null : multiple ? selectedLabels.join(", ") : selectedLabels[0]

  return (
    <div
      data-slot="dropdown"
      data-size={size}
      className={cn("relative w-fit min-w-0", disabled && "opacity-50", className)}
    >
      {multiple
        ? selected.map((value) => <input key={value} type="hidden" name={name} value={value} />)
        : name !== undefined && <input type="hidden" name={name} value={selected[0] ?? ""} />}
      {required ? (
        // Native `required` only works on form controls, so a visually hidden input mirrors the selection and
        // blocks submit while it is empty. An invalid submit moves focus to the trigger.
        <input
          type="text"
          tabIndex={-1}
          aria-hidden
          data-slot="dropdown-required"
          className="sr-only"
          required
          disabled={disabled}
          value={multiple ? selected.join(",") : (selected[0] ?? "")}
          onChange={() => {}}
          onInvalid={(event) => {
            event.preventDefault()
            triggerRef.current?.focus()
          }}
        />
      ) : null}
      <button
        ref={triggerRef}
        id={id}
        type="button"
        role="combobox"
        data-slot="dropdown-trigger"
        data-value={multiple ? selected.join(",") : (selected[0] ?? "")}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-activedescendant={searchable ? undefined : activeId}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        aria-invalid={ariaInvalid}
        aria-required={required || undefined}
        disabled={disabled}
        onClick={() => (open ? setOpenState(false) : openList())}
        onKeyDown={handleKey}
        className={cn(
          "flex w-full min-w-0 cursor-pointer items-center justify-between gap-2 rounded-lg border border-input bg-transparent px-2.5 text-left text-base transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:hover:bg-input/50 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
          size === "sm" ? "h-7 py-0.5 text-sm" : "h-8 py-1",
        )}
      >
        <span data-slot="dropdown-value" className={cn("truncate", triggerText === null && "text-muted-foreground")}>
          {triggerText ?? placeholder}
        </span>
        <IconChevronDown className="pointer-events-none size-4 shrink-0 text-muted-foreground" aria-hidden />
      </button>

      {open ? (
        <div
          ref={listRef}
          data-slot="dropdown-content"
          className="absolute top-full left-0 z-50 mt-1 w-full min-w-40 overflow-hidden rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10"
        >
          {searchable ? (
            <div className="flex items-center gap-2 border-b border-border px-2.5 py-1.5">
              <IconSearch className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              <input
                ref={searchRef}
                type="text"
                role="combobox"
                aria-expanded
                aria-autocomplete="list"
                aria-controls={listboxId}
                aria-activedescendant={activeId}
                aria-label={searchLabel}
                data-slot="dropdown-search"
                value={query}
                placeholder={searchPlaceholder}
                onChange={(event) => {
                  setQuery(event.target.value)
                  setActive(-1)
                }}
                onKeyDown={handleKey}
                className="h-7 w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
          ) : null}
          <div
            id={listboxId}
            role="listbox"
            aria-multiselectable={multiple || undefined}
            aria-labelledby={ariaLabelledBy}
            aria-label={ariaLabelledBy ? undefined : ariaLabel}
            className="max-h-64 overflow-y-auto p-1"
          >
            {visible.length === 0 ? (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">{emptyLabel}</div>
            ) : (
              visible.map((option, index) => {
                const isSelected = selected.includes(option.value)
                const isActive = index === active
                return (
                  <div
                    key={option.value}
                    id={optionId(index)}
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={option.disabled || undefined}
                    data-slot="dropdown-option"
                    data-value={option.value}
                    data-highlighted={isActive || undefined}
                    data-selected={isSelected || undefined}
                    onPointerMove={() => {
                      if (!option.disabled && index !== active) setActive(index)
                    }}
                    tabIndex={-1}
                    onClick={() => {
                      if (!option.disabled) choose(option)
                    }}
                    onKeyDown={(event) => {
                      if (event.key !== "Enter" && event.key !== " ") return
                      event.preventDefault()
                      if (!option.disabled) choose(option)
                    }}
                    className={cn(
                      "relative flex w-full cursor-default items-center gap-1.5 rounded-md py-1 pr-8 pl-1.5 text-sm outline-none select-none",
                      isActive && "bg-accent text-accent-foreground",
                      option.disabled && "pointer-events-none opacity-50",
                    )}
                  >
                    <span className="truncate">{option.label}</span>
                    {isSelected ? (
                      <IconCheck className="pointer-events-none absolute right-2 size-4" aria-hidden />
                    ) : null}
                  </div>
                )
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function toList(value: string | string[] | undefined, multiple: boolean): string[] {
  if (value === undefined) return []
  if (Array.isArray(value)) return multiple ? value : value.slice(0, 1)
  return [value]
}

export { Dropdown }
