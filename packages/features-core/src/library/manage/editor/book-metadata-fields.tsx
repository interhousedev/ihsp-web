"use client"

import { useT } from "@ihsp/i18n"
import { Input, NativeSelect, NativeSelectOption, Textarea, cn } from "@ihsp/ui"
import { useId } from "react"
import { BOOK_LANGUAGES, BOOK_TYPES, RIGHTS, YEARS_OF_STUDY, type BookForm } from "./book-form"
import type { FormIssues } from "./book-form-checks"
import { FieldRow } from "./field-row"
import { StringListField } from "./string-list-field"
import { SuggestListField } from "./suggest-list-field"

/** Title, authors, language, year, publisher, ISBN, type, description and the years of study. */
export function BookMetadataFields({
  form,
  issues,
  disabled,
  onChange,
}: {
  form: BookForm
  issues: FormIssues
  disabled: boolean
  onChange: (patch: Partial<BookForm>) => void
}) {
  const t = useT("library.manage.editor")
  const error = useT("library.manage.editor.error")
  const type = useT("library.type")
  const language = useT("library.browse.language")
  const browse = useT("library.browse")
  const id = useId()
  const message = (issue: { key: string; values?: Record<string, string | number> } | undefined) =>
    issue ? error(issue.key, issue.values) : undefined

  return (
    <fieldset disabled={disabled} className="grid min-w-0 gap-4 md:grid-cols-2">
      <legend className="sr-only">{t("metadata")}</legend>
      <div className="md:col-span-2">
        <FieldRow id={`${id}-title`} label={t("fieldTitle")} required error={message(issues.title)}>
          <Input
            id={`${id}-title`}
            value={form.title}
            aria-invalid={!!issues.title}
            aria-required
            className="min-h-11 md:min-h-8"
            onChange={(event) => onChange({ title: event.target.value })}
          />
        </FieldRow>
      </div>
      <div className="md:col-span-2">
        <FieldRow id={`${id}-subtitle`} label={t("subtitle")}>
          <Input
            id={`${id}-subtitle`}
            value={form.subtitle}
            className="min-h-11 md:min-h-8"
            onChange={(event) => onChange({ subtitle: event.target.value })}
          />
        </FieldRow>
      </div>
      <SuggestListField
        kind="authors"
        label={t("authors")}
        required
        hint={t("authorsHint")}
        values={form.authors}
        error={message(issues.authors)}
        onChange={(authors) => onChange({ authors })}
      />
      <StringListField
        label={t("translators")}
        values={form.translators}
        onChange={(translators) => onChange({ translators })}
      />
      <div className="md:col-span-2">
        <SuggestListField
          kind="tags"
          label={t("tags")}
          hint={t("tagsHint")}
          values={form.tags}
          onChange={(tags) => onChange({ tags })}
        />
      </div>
      <FieldRow id={`${id}-language`} label={t("language")} hint={t("languageHint")}>
        <NativeSelect
          id={`${id}-language`}
          value={form.language}
          className="w-full"
          onChange={(event) => onChange({ language: event.target.value as BookForm["language"] })}
        >
          {BOOK_LANGUAGES.map((value) => (
            <NativeSelectOption key={value} value={value}>
              {language(value)}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </FieldRow>
      <FieldRow id={`${id}-type`} label={t("type")}>
        <NativeSelect
          id={`${id}-type`}
          value={form.type}
          className="w-full"
          onChange={(event) => onChange({ type: event.target.value as BookForm["type"] })}
        >
          {BOOK_TYPES.map((value) => (
            <NativeSelectOption key={value} value={value}>
              {type(value)}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </FieldRow>
      <FieldRow id={`${id}-rights`} label={t("rights")} hint={t("rightsHint")}>
        <NativeSelect
          id={`${id}-rights`}
          value={form.rights}
          className="w-full"
          onChange={(event) => onChange({ rights: event.target.value as BookForm["rights"] })}
        >
          {RIGHTS.map((value) => (
            <NativeSelectOption key={value} value={value}>
              {t(`rightsOptions.${value}`)}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </FieldRow>
      <FieldRow id={`${id}-year`} label={t("year")} error={message(issues.yearPublished)}>
        <Input
          id={`${id}-year`}
          inputMode="numeric"
          value={form.yearPublished}
          aria-invalid={!!issues.yearPublished}
          className="min-h-11 md:min-h-8"
          onChange={(event) => onChange({ yearPublished: event.target.value })}
        />
      </FieldRow>
      <FieldRow id={`${id}-publisher`} label={t("publisher")}>
        <Input
          id={`${id}-publisher`}
          value={form.publisher}
          className="min-h-11 md:min-h-8"
          onChange={(event) => onChange({ publisher: event.target.value })}
        />
      </FieldRow>
      <FieldRow id={`${id}-isbn`} label={t("isbn")}>
        <Input
          id={`${id}-isbn`}
          value={form.isbn}
          className="min-h-11 md:min-h-8"
          onChange={(event) => onChange({ isbn: event.target.value })}
        />
      </FieldRow>
      <fieldset className="flex flex-col gap-1.5">
        <legend className="text-sm font-medium">{t("yearsOfStudy")}</legend>
        <div className="flex flex-wrap gap-2">
          {YEARS_OF_STUDY.map((year) => {
            const on = form.yearsOfStudy.includes(year)
            return (
              <button
                key={year}
                type="button"
                aria-pressed={on}
                className={cn(
                  "focus-visible:ring-ring min-h-11 rounded-full border px-4 text-sm outline-none focus-visible:ring-2 md:min-h-8",
                  on ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted",
                )}
                onClick={() =>
                  onChange({
                    yearsOfStudy: on
                      ? form.yearsOfStudy.filter((item) => item !== year)
                      : [...form.yearsOfStudy, year].toSorted((a, b) => a - b),
                  })
                }
              >
                {browse("year", { year })}
              </button>
            )
          })}
        </div>
      </fieldset>
      <div className="md:col-span-2">
        <FieldRow id={`${id}-description`} label={t("description")}>
          <Textarea
            id={`${id}-description`}
            rows={5}
            value={form.description}
            onChange={(event) => onChange({ description: event.target.value })}
          />
        </FieldRow>
      </div>
    </fieldset>
  )
}
