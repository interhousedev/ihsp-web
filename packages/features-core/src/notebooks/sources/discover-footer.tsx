"use client"

import { useT } from "@ihsp/i18n"
import { Button, LoadingButton } from "@ihsp/ui"

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
  const tCommon = useT("common")
  return (
    <div className="bg-background sticky bottom-0 -mx-2 flex flex-col gap-2 border-t px-3 pt-2 pb-1 md:-mx-3">
      {error ? (
        <p role="alert" className="text-destructive text-xs">
          {error}
        </p>
      ) : null}
      {atLimit ? (
        <p role="status" className="text-xs text-warning">
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
        <LoadingButton
          type="button"
          className="min-h-11 md:min-h-8"
          disabled={count === 0}
          loading={pending}
          loadingLabel={tCommon("loading")}
          onClick={onAdd}
        >
          {t("discover.add", { count })}
        </LoadingButton>
      </div>
    </div>
  )
}
