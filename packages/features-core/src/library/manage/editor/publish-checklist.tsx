"use client"

import { useT } from "@ihsp/i18n"
import { IconCircleCheck, IconCircleX } from "@ihsp/ui"
import { useId } from "react"
import type { ChecklistItem } from "./book-form-checks"

/**
 * The publish checklist: text status known, cover present, at least one subject. Red items say what to do.
 */
export function PublishChecklist({
  items,
  stale,
}: {
  items: readonly ChecklistItem[]
  /** The checklist comes from the form (unsaved changes), not from the saved book. */
  stale: boolean
}) {
  const t = useT("library.manage.editor.checklist")
  const id = useId()
  const allOk = items.every((item) => item.ok)
  return (
    <section aria-labelledby={`${id}-title`} className="flex flex-col gap-3 rounded-xl border p-4">
      <div>
        <h2 id={`${id}-title`} className="text-lg font-semibold">
          {t("title")}
        </h2>
        <p className="text-muted-foreground text-sm">{allOk ? t("ready") : t("intro")}</p>
        {stale ? <p className="text-muted-foreground text-xs">{t("unsaved")}</p> : null}
      </div>
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li key={item.key} data-ok={item.ok} className="flex items-start gap-2 text-sm">
            {item.ok ? (
              <IconCircleCheck className="mt-0.5 size-5 shrink-0 text-emerald-700 dark:text-emerald-300" aria-hidden />
            ) : (
              <IconCircleX className="text-destructive mt-0.5 size-5 shrink-0" aria-hidden />
            )}
            <div className="flex min-w-0 flex-col">
              <span className={item.ok ? "font-medium" : "text-destructive font-medium"}>
                {t(`${item.key}.label`)}
                <span className="sr-only">: {item.ok ? t("done") : t("todo")}</span>
              </span>
              {!item.ok ? <span className="text-muted-foreground text-xs">{t(`${item.key}.hint`)}</span> : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
