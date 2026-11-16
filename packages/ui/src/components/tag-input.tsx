"use client"

import { useState, type KeyboardEvent } from "react"
import { cn } from "../lib/utils"
import { Icons } from "./icons"
import { Pill } from "./pill"

/**
 * Free-text tags: Enter or a comma adds the typed text, Backspace in an empty field removes the last tag. Duplicates
 * (ignoring case) and tags beyond `max` are dropped. All labels come from the caller, so the text is translated there.
 */
export function TagInput({
  value,
  onChange,
  placeholder,
  removeLabel,
  max,
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
  maxLength?: number
  disabled?: boolean
  id?: string
  className?: string
  "aria-label"?: string
}) {
  const [draft, setDraft] = useState("")
  const full = max !== undefined && value.length >= max

  function commit(text: string) {
    const tag = text.trim().slice(0, maxLength)
    setDraft("")
    if (!tag || full || value.some((existing) => existing.toLowerCase() === tag.toLowerCase())) return
    onChange([...value, tag])
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault()
      commit(draft)
    } else if (event.key === "Backspace" && draft === "" && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div
      className={cn(
        "border-input bg-background flex min-h-10 flex-wrap items-center gap-1.5 rounded-lg border px-2 py-1.5",
        "focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50",
        disabled && "opacity-50",
        className,
      )}
    >
      {value.map((tag) => (
        <Pill key={tag} className="h-6 gap-1 pr-1 pl-2.5 text-xs">
          {tag}
          <button
            type="button"
            disabled={disabled}
            aria-label={removeLabel(tag)}
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
        onBlur={() => commit(draft)}
        className="placeholder:text-muted-foreground min-w-24 flex-1 bg-transparent text-sm outline-none"
      />
    </div>
  )
}
