"use client"

import { useT } from "@ihsp/i18n"
import { Button, Field, FieldError, FieldLabel, Icons, Input } from "@ihsp/ui"
import { useId, useState, type KeyboardEvent } from "react"

/** A list of short texts: chips for tags, rows for outcomes, requirements and audience. */
export function ListEditor({
  label,
  items,
  onChange,
  max,
  maxLength,
  chips,
  error,
}: {
  label: string
  items: string[]
  onChange: (items: string[]) => void
  max: number
  maxLength: number
  chips?: boolean
  error?: string
}) {
  const t = useT("courseSettings")
  const id = useId()
  const [draft, setDraft] = useState("")
  const full = items.length >= max

  function add() {
    const text = draft.trim()
    if (!text || full || items.includes(text)) return
    onChange([...items, text.slice(0, maxLength)])
    setDraft("")
  }
  function onKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return
    event.preventDefault()
    add()
  }
  const remove = (index: number) => onChange(items.filter((_, at) => at !== index))

  return (
    <Field>
      <FieldLabel htmlFor={id}>
        {label}{" "}
        <span className="text-muted-foreground font-normal">
          {items.length}/{max}
        </span>
      </FieldLabel>
      {items.length > 0 ? (
        <ul aria-label={label} className={chips ? "flex flex-wrap gap-2" : "flex flex-col gap-2"}>
          {items.map((item, index) => (
            <li
              key={`${item}-${index}`}
              className={
                chips
                  ? "bg-muted flex min-h-9 items-center gap-1 rounded-full ps-3 pe-1 text-sm"
                  : "flex items-center gap-2 rounded-lg border px-3 py-1 text-sm"
              }
            >
              <span className="min-w-0 flex-1 break-words">{item}</span>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                aria-label={t("removeItem", { item })}
                onClick={() => remove(index)}
                className="size-9 shrink-0 md:size-7"
              >
                <Icons.close aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="flex gap-2">
        <Input
          id={id}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKey}
          maxLength={maxLength}
          disabled={full}
          className="h-11 md:h-8"
        />
        <Button
          type="button"
          variant="outline"
          onClick={add}
          disabled={full || !draft.trim()}
          className="min-h-11 md:min-h-8"
        >
          <Icons.add aria-hidden />
          {t("add")}
        </Button>
      </div>
      {error ? <FieldError>{error}</FieldError> : null}
    </Field>
  )
}
