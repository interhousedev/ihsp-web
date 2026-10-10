"use client"

import { useT } from "@ihsp/i18n"
import type { BookForm } from "./book-form"
import { VisibilityFields } from "./visibility-fields"

/** Who sees the book, and whether it can be downloaded. The only access setting of a book. */
export function VisibilityPanel({
  form,
  disabled = false,
  onChange,
}: {
  form: BookForm
  disabled?: boolean
  onChange: (patch: Partial<BookForm>) => void
}) {
  const t = useT("library.manage.editor.visibility")
  return (
    <section aria-labelledby="book-visibility-title" className="flex flex-col gap-4 rounded-xl border p-4">
      <h2 id="book-visibility-title" className="text-lg font-semibold">
        {t("title")}
      </h2>
      <fieldset disabled={disabled} className="flex min-w-0 flex-col gap-4">
        <VisibilityFields form={form} onChange={onChange} />
      </fieldset>
    </section>
  )
}
