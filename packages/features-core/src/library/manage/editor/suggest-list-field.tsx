"use client"

import { getLibraryAuthorsQuery, getLibraryTagsQuery } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, Label } from "@ihsp/ui"
import { IconPlus, IconX } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { useId, useState } from "react"
import { SuggestInput, useDebouncedValue, type SuggestOption } from "../../utils/suggest-input"

const MAX_ENTRIES = 20

/**
 * Authors or tags: chips of the values chosen so far, and a box that suggests existing ones while typing. Authors are
 * matched fuzzily on the server (Latin and Cyrillic spellings meet); tags show how many items carry them. A value that
 * is not in the list is added as it is (Enter or Add).
 */
export function SuggestListField({
  kind,
  label,
  values,
  onChange,
  required = false,
  error,
  hint,
}: {
  kind: "authors" | "tags"
  label: string
  values: string[]
  onChange: (values: string[]) => void
  required?: boolean
  error?: string
  hint?: string
}) {
  const t = useT("library.manage.editor")
  const id = useId()
  const [draft, setDraft] = useState("")
  const query = useDebouncedValue(draft.trim())
  const authors = useQuery({ ...getLibraryAuthorsQuery(query), enabled: kind === "authors" })
  const tags = useQuery({ ...getLibraryTagsQuery({ q: query, limit: 8 }), enabled: kind === "tags" })

  const found: SuggestOption[] =
    kind === "authors"
      ? (authors.data ?? []).map((name) => ({ value: name }))
      : (tags.data ?? []).map((tag) => ({ value: tag.name, hint: t("tagCount", { count: tag.item_count }) }))
  const options = found.filter((option) => !values.includes(option.value))
  const loading = kind === "authors" ? authors.isFetching : tags.isFetching

  function add(text: string) {
    const value = text.trim()
    setDraft("")
    if (!value || values.includes(value) || values.length >= MAX_ENTRIES) return
    onChange([...values, value])
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>
        {label}
        {required ? <span aria-hidden> *</span> : null}
      </Label>
      {values.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5" aria-label={label}>
          {values.map((value) => (
            <li
              key={value}
              className="bg-secondary text-secondary-foreground flex items-center gap-1 rounded-full py-0.5 ps-3 pe-1 text-sm"
            >
              {value}
              <button
                type="button"
                className="hover:bg-background/60 focus-visible:ring-ring flex size-8 items-center justify-center rounded-full outline-none focus-visible:ring-2"
                aria-label={t("removeEntry", { name: value })}
                onClick={() => onChange(values.filter((item) => item !== value))}
              >
                <IconX className="size-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="flex gap-2">
        <div className="min-w-0 flex-1">
          <SuggestInput
            id={id}
            label={label}
            value={draft}
            onChange={setDraft}
            options={options}
            loading={loading}
            invalid={!!error}
            placeholder={t(kind === "authors" ? "authorsPlaceholder" : "tagsPlaceholder")}
            listLabel={t(kind === "authors" ? "authorSuggestions" : "tagSuggestions")}
            noMatchesText={t("noSuggestions", { value: draft.trim() })}
            onPick={(option) => add(option.value)}
            onSubmitText={add}
          />
        </div>
        <Button type="button" variant="outline" className="min-h-11 md:min-h-8" onClick={() => add(draft)}>
          <IconPlus aria-hidden />
          {t("addEntry")}
        </Button>
      </div>
      {hint ? <p className="text-muted-foreground text-xs">{hint}</p> : null}
      {error ? (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      ) : null}
    </div>
  )
}
