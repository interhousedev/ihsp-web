"use client"

import { useT } from "@ihsp/i18n"
import { Button } from "@ihsp/ui"
import { IconLoader2 } from "@tabler/icons-react"

type DiscoverFooterProps = {
  count: number
  allPicked: boolean
  canPickAny: boolean
  /** More pages could be ticked but the notebook (or one request) cannot take them. */
  atLimit: boolean
  capacity: number
  pending: boolean
  error: string | null
  onToggleAll: () => void
  onAdd: () => void
}

/** The sticky footer of the results: **Select all** (or clear) and **Add N**, with the limit hint and a failed request. */
export function DiscoverFooter({
  count,
  allPicked,
  canPickAny,
  atLimit,
  capacity,
  pending,
  error,
  onToggleAll,
  onAdd,
}: DiscoverFooterProps) {
  const t = useT("notebooks")
  return (
    <div className="bg-background sticky bottom-0 -mx-2 flex flex-col gap-2 border-t px-3 pt-2 pb-1 md:-mx-3">
      {error ? (
        <p role="alert" className="text-destructive text-xs">
          {error}
        </p>
      ) : null}
      {atLimit ? (
        <p role="status" className="text-xs text-amber-700 dark:text-amber-400">
          {capacity === 0 ? t("add.full") : t("add.tooMany", { max: capacity })}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button
          type="button"
          variant="ghost"
          className="min-h-11 md:min-h-8"
          disabled={!canPickAny && count === 0}
          onClick={onToggleAll}
        >
          {allPicked ? t("discover.selectNone") : t("discover.selectAll")}
        </Button>
        <Button type="button" className="min-h-11 md:min-h-8" disabled={count === 0 || pending} onClick={onAdd}>
          {pending ? <IconLoader2 aria-hidden className="animate-spin motion-reduce:animate-none" /> : null}
          {t("discover.add", { count })}
        </Button>
      </div>
    </div>
  )
}
