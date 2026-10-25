"use client"

import {
  getLibrarySubjectsQuery,
  getLibraryTagsQuery,
  getLibraryTopicsQuery,
  type ItemType,
  type Topic,
} from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import {
  Button,
  Label,
  Dropdown,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  cn,
} from "@ihsp/ui"
import { IconAdjustmentsHorizontal } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { useId, useState, type ReactNode } from "react"
import { SuggestInput, useDebouncedValue, type SuggestOption } from "../utils/suggest-input"
import { useLibraryAccess } from "../hooks/use-library-access"
import { useUniLibraryEnabled } from "../hooks/use-uni-library"
import { BROWSE_SOURCES, countActiveFilters, type BrowseState } from "./use-browse-state"

const TYPES: readonly ItemType[] = [
  "textbook",
  "manual",
  "fiction",
  "poetry",
  "drama",
  "nonfiction",
  "reference",
  "dictionary",
  "lab_manual",
  "problem_book",
  "article",
  "teaching_material",
  "presentation",
  "worksheet",
  "lecture_notes",
  "notes",
  "practice_set",
  "formula_sheet",
  "other",
]
const LANGUAGES = ["uz_latn", "uz_cyrl", "ru", "en", "qq"] as const

type Patch = Partial<BrowseState>

function flattenTopics(topics: readonly Topic[], depth = 0): { id: string; label: string }[] {
  return topics.flatMap((topic) => [
    { id: topic.id, label: `${" ".repeat(depth * 2)}${topic.name}` },
    ...flattenTopics(topic.children, depth + 1),
  ])
}

/** The source chips: All, Library books, Materials and, only when UniLibrary is on, UniLibrary. */
export function SourceChips({
  value,
  onChange,
}: {
  value: BrowseState["source"]
  onChange: (source: BrowseState["source"]) => void
}) {
  const t = useT("library.source")
  const label = useT("library.browse.filter")("source")
  const uniLibrary = useUniLibraryEnabled()
  const sources = BROWSE_SOURCES.filter((source) => source !== "external" || uniLibrary)
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {sources.map((source) => (
        <Button
          key={source}
          type="button"
          size="sm"
          variant={value === source ? "default" : "outline"}
          aria-pressed={value === source}
          className="min-h-11 rounded-full px-4 md:min-h-8"
          onClick={() => onChange(source)}
        >
          {t(source)}
        </Button>
      ))}
    </div>
  )
}

function Field({ label, id, children }: { label: string; id: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  )
}

/** The tag filter: a tag picked from the suggestions (or typed and entered), shown as a chip that clears it. */
function TagFilter({ tag, onChange }: { tag: string | null; onChange: (tag: string | null) => void }) {
  const t = useT("library.browse")
  const id = useId()
  const [draft, setDraft] = useState("")
  const query = useDebouncedValue(draft.trim())
  const found = useQuery(getLibraryTagsQuery({ q: query, limit: 8 }))
  const options: SuggestOption[] = (found.data ?? []).map((row) => ({ value: row.name, hint: String(row.item_count) }))
  function choose(value: string) {
    setDraft("")
    onChange(value)
  }
  return (
    <Field id={`${id}-tag`} label={t("filter.tag")}>
      {tag ? (
        <div className="flex items-center justify-between gap-2 rounded-md border px-3 py-1 text-sm">
          <span className="truncate">{tag}</span>
          <Button type="button" variant="ghost" className="min-h-11 md:min-h-8" onClick={() => onChange(null)}>
            {t("filter.clearTag")}
          </Button>
        </div>
      ) : (
        <SuggestInput
          id={`${id}-tag`}
          label={t("filter.tag")}
          value={draft}
          onChange={setDraft}
          options={options}
          placeholder={t("filter.tagPlaceholder")}
          listLabel={t("filter.tagSuggestions")}
          noMatchesText={t("filter.noTags", { value: draft.trim() })}
          onPick={(option) => choose(option.value)}
          onSubmitText={choose}
        />
      )}
    </Field>
  )
}

function FilterFields({ state, onChange }: { state: BrowseState; onChange: (patch: Patch) => void }) {
  const t = useT("library.browse")
  const library = useT("library")
  const { signedIn } = useLibraryAccess()
  const subjects = useQuery(getLibrarySubjectsQuery())
  const topics = useQuery({
    ...getLibraryTopicsQuery({ subject_id: state.subject ?? "" }),
    enabled: Boolean(state.subject),
  })
  const topicOptions = flattenTopics(topics.data ?? [])
  const any = { value: "", label: t("any") }
  return (
    <div className="flex flex-col gap-4">
      <Field id="filter-subject" label={t("filter.subject")}>
        <Dropdown
          id="filter-subject"
          className="w-full"
          value={state.subject ?? ""}
          onValueChange={(value) => onChange({ subject: value || null, topic: null })}
          options={[
            any,
            ...(subjects.data ?? []).map((subject) => ({
              value: subject.id,
              label: `${subject.name} (${subject.item_count})`,
            })),
          ]}
        />
      </Field>
      {state.subject && topicOptions.length > 0 ? (
        <Field id="filter-topic" label={t("filter.topic")}>
          <Dropdown
            id="filter-topic"
            className="w-full"
            value={state.topic ?? ""}
            onValueChange={(value) => onChange({ topic: value || null })}
            options={[any, ...topicOptions.map((topic) => ({ value: topic.id, label: topic.label }))]}
          />
        </Field>
      ) : null}
      <TagFilter tag={state.tag} onChange={(tag) => onChange({ tag })} />
      <Field id="filter-year" label={t("filter.year")}>
        <Dropdown
          id="filter-year"
          className="w-full"
          value={state.year ? String(state.year) : ""}
          onValueChange={(value) => onChange({ year: value ? Number(value) : null })}
          options={[any, ...[1, 2].map((year) => ({ value: String(year), label: t("year", { year }) }))]}
        />
      </Field>
      <Field id="filter-type" label={t("filter.type")}>
        <Dropdown
          id="filter-type"
          className="w-full"
          value={state.type ?? ""}
          onValueChange={(value) => onChange({ type: value || null })}
          options={[any, ...TYPES.map((type) => ({ value: type, label: library(`type.${type}`) }))]}
        />
      </Field>
      <Field id="filter-language" label={t("filter.language")}>
        <Dropdown
          id="filter-language"
          className="w-full"
          value={state.lang ?? ""}
          onValueChange={(value) => onChange({ lang: value || null })}
          options={[any, ...LANGUAGES.map((language) => ({ value: language, label: t(`language.${language}`) }))]}
        />
      </Field>
      {state.source !== "book" ? (
        <Field id="filter-uploader" label={t("filter.uploader")}>
          <Dropdown
            id="filter-uploader"
            className="w-full"
            value={state.uploader ?? ""}
            onValueChange={(value) => onChange({ uploader: value === "student" || value === "teacher" ? value : null })}
            options={[
              any,
              { value: "student", label: t("uploader.student") },
              { value: "teacher", label: t("uploader.teacher") },
            ]}
          />
        </Field>
      ) : null}
      {signedIn ? (
        <Field id="filter-shelf" label={t("filter.shelf")}>
          <Dropdown
            id="filter-shelf"
            className="w-full"
            value={state.shelf ?? ""}
            onValueChange={(value) =>
              onChange({
                shelf: value === "any" || value === "want" || value === "reading" || value === "done" ? value : null,
              })
            }
            options={[
              any,
              { value: "any", label: t("filter.shelf") },
              ...(["want", "reading", "done"] as const).map((shelf) => ({
                value: shelf,
                label: library(`shelf.${shelf}`),
              })),
            ]}
          />
        </Field>
      ) : null}
      <Label className="min-h-11 cursor-pointer gap-3 font-normal md:min-h-9">
        <input
          type="checkbox"
          className="size-4"
          checked={state.hasText}
          onChange={(event) => onChange({ hasText: event.target.checked })}
        />
        {t("filter.hasText")}
      </Label>
    </div>
  )
}

/**
 * The filter button with a counter and a sheet holding every filter (subject, topic, year, type, language, uploader,
 * shelf, has text). The source chips are separate (`SourceChips`) and always visible.
 */
export function ItemFilters({
  state,
  onChange,
  onClear,
  className,
}: {
  state: BrowseState
  onChange: (patch: Patch) => void
  onClear: () => void
  className?: string
}) {
  const t = useT("library.browse")
  const [open, setOpen] = useState(false)
  const active = countActiveFilters(state)
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button type="button" variant="outline" className="min-h-11 md:min-h-8" onClick={() => setOpen(true)}>
        <IconAdjustmentsHorizontal aria-hidden />
        {t("filters")}
        {active > 0 ? (
          <span
            className="bg-primary text-primary-foreground ms-1 rounded-full px-1.5 text-xs tabular-nums"
            aria-label={String(active)}
          >
            {active}
          </span>
        ) : null}
      </Button>
      {active > 0 ? (
        <Button type="button" variant="ghost" className="min-h-11 md:min-h-8" onClick={onClear}>
          {t("clear")}
        </Button>
      ) : null}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-sm">
          <SheetHeader>
            <SheetTitle>{t("filters")}</SheetTitle>
            <SheetDescription className="sr-only">{t("filters")}</SheetDescription>
          </SheetHeader>
          <div className="px-4">
            <FilterFields state={state} onChange={onChange} />
          </div>
          <SheetFooter className="flex-row gap-2">
            <Button type="button" className="min-h-11 flex-1" onClick={() => setOpen(false)}>
              {t("showResults")}
            </Button>
            {active > 0 ? (
              <Button type="button" variant="outline" className="min-h-11" onClick={onClear}>
                {t("clear")}
              </Button>
            ) : null}
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
