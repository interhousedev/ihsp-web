"use client"

import { useT } from "@ihsp/i18n"
import { Button, Skeleton, StateView } from "@ihsp/ui"
import { IconLoader2 } from "@tabler/icons-react"
import { useEffect, useMemo, useRef } from "react"
import { useSourcePassages } from "../api"
import { PassageBlock } from "./passage-block"
import { usePassageFocus } from "./use-passage-focus"

type PassageListProps = {
  notebookId: string
  sourceId: string
  /** The passage a citation points at: loaded, scrolled to the middle and highlighted. */
  passageId?: string | null
}

/** The text of a source: passages in order, 60 at a time (infinite scroll, with a "Load more" button as fallback). */
export function PassageList({ notebookId, sourceId, passageId }: PassageListProps) {
  const t = useT("notebooks")
  const passages = useSourcePassages(notebookId, sourceId)
  const listRef = useRef<HTMLDivElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const items = useMemo(() => passages.data?.pages.flatMap((page) => page.items) ?? [], [passages.data])
  const focus = usePassageFocus({
    notebookId,
    passageId,
    items,
    pages: {
      pageCount: passages.data?.pages.length ?? 0,
      isSuccess: passages.isSuccess,
      hasNextPage: passages.hasNextPage,
      isFetchingNextPage: passages.isFetchingNextPage,
      fetchNextPage: passages.fetchNextPage,
    },
    containerRef: listRef,
  })

  const { hasNextPage, isFetchingNextPage, fetchNextPage } = passages
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !hasNextPage || typeof IntersectionObserver === "undefined") return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting) && !isFetchingNextPage) void fetchNextPage()
      },
      { rootMargin: "400px" },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  if (passages.isPending) {
    return (
      <div role="status" aria-busy="true" aria-label={t("viewer.loadingText")} className="flex flex-col gap-3">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-16 w-full" />
        ))}
      </div>
    )
  }
  if (passages.isError) {
    return <StateView state="error" error={passages.error} onRetry={() => void passages.refetch()} />
  }
  if (items.length === 0) return <StateView state="empty" emptyText={t("viewer.empty")} />

  return (
    <div className="flex flex-col gap-2">
      {focus.changed ? (
        <div role="status" className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
          <p className="font-medium">{t("viewer.changed")}</p>
          <p className="text-muted-foreground text-xs">{t("viewer.changedHint")}</p>
          {focus.nearby ? (
            <div className="mt-2 flex flex-col">
              {[...focus.nearby.before, focus.nearby.passage, ...focus.nearby.after].map((passage, index, all) => (
                <PassageBlock
                  key={passage.id}
                  passage={passage}
                  previous={all[index - 1] ?? null}
                  highlighted={passage.id === focus.nearby?.passage.id}
                />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
      <div ref={listRef} className="flex flex-col">
        {items.map((passage, index) => (
          <PassageBlock
            key={passage.id}
            passage={passage}
            previous={items[index - 1] ?? null}
            highlighted={passage.id === focus.highlightedId}
            pulsing={focus.pulsing}
          />
        ))}
      </div>
      {passages.hasNextPage ? (
        <div ref={sentinelRef} className="flex justify-center py-2">
          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            disabled={passages.isFetchingNextPage}
            onClick={() => void passages.fetchNextPage()}
          >
            {passages.isFetchingNextPage ? (
              <IconLoader2 aria-hidden className="animate-spin motion-reduce:animate-none" />
            ) : null}
            {t("viewer.loadMore")}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
