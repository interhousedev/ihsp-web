"use client"

import { useT } from "@ihsp/i18n"
import { Button } from "@ihsp/ui"
import { IconAlertTriangle, IconLoader2 } from "@tabler/icons-react"
import type { Rejection } from "./use-add-submit"

type AddFooterProps = {
  count: number
  pending: boolean
  /** More items than one request (or the notebook) can take. */
  tooMany: boolean
  /** Hint under the counter: the selection is capped. */
  capacity: number
  rejections: readonly Rejection[]
  error: string | null
  onSubmit: () => void
}

/** "N selected", the refused items with their reasons, and the one button that adds everything. */
export function AddFooter({ count, pending, tooMany, capacity, rejections, error, onSubmit }: AddFooterProps) {
  const t = useT("notebooks")
  return (
    <div className="flex shrink-0 flex-col gap-2 border-t pt-3">
      {rejections.length > 0 ? (
        <ul role="alert" className="flex flex-col gap-1">
          {rejections.map((rejection) => (
            <li key={rejection.key} className="text-destructive flex items-start gap-1.5 text-xs">
              <IconAlertTriangle aria-hidden className="mt-0.5 size-3.5 shrink-0" />
              <span className="min-w-0 break-words">
                {t("add.rejected", { title: rejection.label, reason: rejection.reason })}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      {error ? (
        <p role="alert" className="text-destructive text-xs">
          {error}
        </p>
      ) : null}
      {tooMany ? (
        <p role="status" className="text-xs text-amber-700 dark:text-amber-400">
          {capacity === 0 ? t("add.full") : t("add.tooMany", { max: capacity })}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-muted-foreground text-sm" aria-live="polite">
          {t("add.selected", { count })}
        </p>
        <Button type="button" className="min-h-11" disabled={count === 0 || tooMany || pending} onClick={onSubmit}>
          {pending ? <IconLoader2 aria-hidden className="animate-spin motion-reduce:animate-none" /> : null}
          {t("add.submit", { count })}
        </Button>
      </div>
    </div>
  )
}
