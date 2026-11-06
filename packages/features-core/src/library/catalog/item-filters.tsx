"use client"

import {
  getLibraryCollectionQuery,
  getLibrarySubjectsQuery,
  getLibraryTagsQuery,
  getLibraryTopicsQuery,
  type ItemType,
  type Topic,
} from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import {
  Button,
  Dropdown,
  Field,
  FieldLabel,
  Icons,
  Label,
  ListToolbar,
  type ToolbarChip,
  StateView,
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
import { useId, useState } from "react"
import { SuggestInput, useDebouncedValue, type SuggestOption } from "../utils/suggest-input"
import { useLibraryAccess } from "../hooks/use-library-access"
import { useUniLibraryEnabled } from "../hooks/use-uni-library"
import { BROWSE_SOURCES, countActiveFilters, type BrowseState } from "./use-browse-state"

/** The backend takes a year of study from 1 to 12 (`year_of_study` on the items query). */
const YEARS_OF_STUDY = Array.from({ length: 12 }, (_, index) => index + 1)

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

/** The one collection a shared link filters by, shown as a chip that removes the filter. */
function CollectionChip({ id, onRemove }: { id: string; onRemove: () => void }) {
  const t = useT("library.browse")
  const collection = useQuery(getLibraryCollectionQuery(id))
  const title = collection.data?.title ?? t("filter.collection")
  return (
    <Button
      type="button"
      variant="secondary"
      className="min-h-11 md:min-h-8"
      aria-label={t("filter.removeCollection", { title })}
      onClick={onRemove}
    >
      {title}
      <Icons.close aria-hidden />
    </Button>
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
    <Field>
      <FieldLabel htmlFor={`${id}-tag`}>{t("filter.tag")}</FieldLabel>
      {found.isError ? <StateView state="error" error={found.error} onRetry={() => void found.refetch()} /> : null}
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
      <Field>
        <FieldLabel htmlFor="filter-subject">{t("filter.subject")}</FieldLabel>
        {subjects.isError ? (
          <StateView state="error" error={subjects.error} onRetry={() => void subjects.refetch()} />
        ) : null}
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
        <Field>
          <FieldLabel htmlFor="filter-topic">{t("filter.topic")}</FieldLabel>
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
      <Field>
        <FieldLabel htmlFor="filter-year">{t("filter.year")}</FieldLabel>
        <Dropdown
          id="filter-year"
          className="w-full"
          value={state.year ? String(state.year) : ""}
          onValueChange={(value) => onChange({ year: value ? Number(value) : null })}
          options={[any, ...YEARS_OF_STUDY.map((year) => ({ value: String(year), label: t("year", { year }) }))]}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="filter-type">{t("filter.type")}</FieldLabel>
        <Dropdown
          id="filter-type"
          className="w-full"
          value={state.type ?? ""}
          onValueChange={(value) => onChange({ type: value || null })}
          options={[any, ...TYPES.map((type) => ({ value: type, label: library(`type.${type}`) }))]}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="filter-language">{t("filter.language")}</FieldLabel>
        <Dropdown
          id="filter-language"
          className="w-full"
          value={state.lang ?? ""}
          onValueChange={(value) => onChange({ lang: value || null })}
          options={[any, ...LANGUAGES.map((language) => ({ value: language, label: t(`language.${language}`) }))]}
        />
      </Field>
      {state.source !== "book" ? (
        <Field>
          <FieldLabel htmlFor="filter-uploader">{t("filter.uploader")}</FieldLabel>
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
        <Field>
          <FieldLabel htmlFor="filter-shelf">{t("filter.shelf")}</FieldLabel>
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
  const library = useT("library")
  const subjects = useQuery(getLibrarySubjectsQuery())
  const topics = useQuery({
    ...getLibraryTopicsQuery({ subject_id: state.subject ?? "" }),
    enabled: Boolean(state.subject),
  })
  const active = countActiveFilters(state)
  const chip = (key: string, label: string, value: string, patch: Patch): ToolbarChip => ({
    key,
    label: `${label}: ${value}`,
    onRemove: () => onChange(patch),
  })
  const chips: ToolbarChip[] = [
    ...(state.subject
      ? [
          chip(
            "subject",
            t("filter.subject"),
            subjects.data?.find((subject) => subject.id === state.subject)?.name ?? state.subject,
            { subject: null, topic: null },
          ),
        ]
      : []),
    ...(state.topic
      ? [
          chip(
            "topic",
            t("filter.topic"),
            flattenTopics(topics.data ?? [])
              .find((topic) => topic.id === state.topic)
              ?.label.trim() ?? state.topic,
            { topic: null },
          ),
        ]
      : []),
    ...(state.tag ? [chip("tag", t("filter.tag"), state.tag, { tag: null })] : []),
    ...(state.year ? [chip("year", t("filter.year"), t("year", { year: state.year }), { year: null })] : []),
    ...(state.type ? [chip("type", t("filter.type"), library(`type.${state.type}`), { type: null })] : []),
    ...(state.lang ? [chip("lang", t("filter.language"), t(`language.${state.lang}`), { lang: null })] : []),
    ...(state.uploader
      ? [chip("uploader", t("filter.uploader"), t(`uploader.${state.uploader}`), { uploader: null })]
      : []),
    ...(state.shelf
      ? [
          state.shelf === "any"
            ? { key: "shelf", label: t("filter.shelf"), onRemove: () => onChange({ shelf: null }) }
            : chip("shelf", t("filter.shelf"), library(`shelf.${state.shelf}`), { shelf: null }),
        ]
      : []),
    ...(state.hasText
      ? [{ key: "hasText", label: t("filter.hasText"), onRemove: () => onChange({ hasText: false }) }]
      : []),
  ]
  return (
    <div className={cn("min-w-0 flex-1", className)}>
      <ListToolbar
        filters={[]}
        values={{}}
        onChange={() => {}}
        extraChips={chips}
        active={active > 0}
        onReset={onClear}
        leading={
          <>
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
            {state.collection ? (
              <CollectionChip id={state.collection} onRemove={() => onChange({ collection: null })} />
            ) : null}
          </>
        }
      />
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
