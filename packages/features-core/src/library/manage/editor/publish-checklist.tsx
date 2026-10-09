"use client"

import { useT } from "@ihsp/i18n"
import { IconCircleCheck, IconCircleX } from "@tabler/icons-react"
import { useId } from "react"
import type { ChecklistItem } from "./book-form-checks"

/** next-intl types keys from a message file; the missing keys come from the API at run time. */
type LooseTranslator = { (key: string): string; has: (key: string) => boolean }

const NOT_RIGHTS = new Set(["text_status", "cover", "subjects"])

/** The rights fields the API or the form named, without the three other checklist keys. */
export const rightsFieldsOf = (missing: readonly string[]): string[] => missing.filter((key) => !NOT_RIGHTS.has(key))

/**
 * The publish checklist (§ 3.4): rights complete, text status known, cover present, at least one subject. Red items
 * say what to do; the rights item lists the fields still empty (from the form, or from `422 library/rights-incomplete`).
 */
export function PublishChecklist({
  items,
  missing,
  stale,
}: {
  items: readonly ChecklistItem[]
  /** Field names still missing (`rights_basis.rule`, `licence`, ...). */
  missing: readonly string[]
  /** The checklist comes from the form (unsaved changes), not from the saved book. */
  stale: boolean
}) {
  const t = useT("library.manage.editor.checklist")
  const names = useT("library.manage.editor.missing") as unknown as LooseTranslator
  const id = useId()
  const allOk = items.every((item) => item.ok)
  const rightsMissing = rightsFieldsOf(missing)
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
              {!item.ok && item.key === "rights" && rightsMissing.length > 0 ? (
                <ul className="text-muted-foreground mt-1 list-disc ps-5 text-xs">
                  {rightsMissing.map((key) => {
                    const messageKey = key.replace(/\./g, "_")
                    return <li key={key}>{names.has(messageKey) ? names(messageKey) : key}</li>
                  })}
                </ul>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
