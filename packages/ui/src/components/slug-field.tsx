"use client"

import { useEffect, useState } from "react"
import { slugify } from "../lib/slugify"
import { Button } from "./ui/button"
import { Field, FieldDescription, FieldError, FieldLabel } from "./ui/field"
import { Input } from "./ui/input"

/**
 * An address (slug) that follows a title: shown read-only as a URL preview, derived while the title is typed.
 * "Edit address" reveals the raw input; once edited by hand the address stops following the title.
 * Text comes from the caller (the package has no namespace of its own).
 */
export function SlugField({
  id,
  label,
  title,
  value,
  onChange,
  urlPrefix = "",
  editLabel,
  autoLabel,
  hint,
  error,
  maxLength = 60,
  disabled,
  followTitle = value === "",
}: {
  id: string
  label: string
  /** The title the address is derived from. */
  title: string
  value: string
  onChange: (slug: string) => void
  /** Shown before the slug in the preview, e.g. "lms.example.uz/courses/". */
  urlPrefix?: string
  editLabel: string
  /** Button that returns to the address derived from the title. */
  autoLabel: string
  hint?: string
  error?: string | null
  maxLength?: number
  disabled?: boolean
  /** Start in the derived mode (default: when the address is still empty). */
  followTitle?: boolean
}) {
  const [follow, setFollow] = useState(followTitle)
  const [editing, setEditing] = useState(false)
  useEffect(() => {
    if (follow) onChange(slugify(title).slice(0, maxLength))
  }, [follow, title, maxLength, onChange])

  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      {editing ? (
        <Input
          id={id}
          value={value}
          aria-invalid={Boolean(error)}
          maxLength={maxLength}
          disabled={disabled}
          autoComplete="off"
          spellCheck={false}
          onChange={(event) => {
            setFollow(false)
            onChange(event.target.value)
          }}
          className="h-11 font-mono md:h-8"
        />
      ) : (
        <div className="bg-muted flex min-h-11 items-center rounded-md px-3 font-mono text-sm md:min-h-8">
          {urlPrefix ? <span className="text-muted-foreground shrink-0">{urlPrefix}</span> : null}
          {/* A read-only input keeps the label association valid (a label cannot name a <p>). */}
          <input
            id={id}
            readOnly
            value={value}
            placeholder="…"
            className="min-w-0 flex-1 bg-transparent outline-none"
          />
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        {editing ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled}
            onClick={() => {
              setFollow(true)
              setEditing(false)
            }}
          >
            {autoLabel}
          </Button>
        ) : (
          <Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={() => setEditing(true)}>
            {editLabel}
          </Button>
        )}
      </div>
      {hint ? <FieldDescription>{hint}</FieldDescription> : null}
      {error ? <FieldError>{error}</FieldError> : null}
    </Field>
  )
}
