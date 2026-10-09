"use client"

import { getLibraryItems, getUniLibrarySearch, type ItemCard } from "@ihsp/api"
import { keys } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, Icons, Skeleton, StateView } from "@ihsp/ui"
import { useInfiniteQuery } from "@tanstack/react-query"
import { useVisibleCards } from "../hooks/use-uni-library"
import { cardKey } from "./card-utils"
import { ItemGrid, type ItemGridLayout } from "./item-grid"
import { toItemsParams, type BrowseState } from "./use-browse-state"

function LoadingGrid({ layout }: { layout: ItemGridLayout }) {
  return (
    <div
      role="status"
      aria-busy="true"
      className={
        layout === "grid"
          ? "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
          : "flex flex-col gap-3"
      }
    >
      {Array.from({ length: 8 }, (_, index) => (
        <Skeleton key={index} className={layout === "grid" ? "h-64 rounded-xl" : "h-32 rounded-xl"} />
      ))}
    </div>
  )
}

function dedupe(cards: readonly ItemCard[]): ItemCard[] {
  const seen = new Set<string>()
  return cards.filter((card) => {
    const key = cardKey(card)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/** Results of the catalogue search (books and materials), loaded page by page with a "Load more" button. */
export function CatalogueResults({ state, layout }: { state: BrowseState; layout: ItemGridLayout }) {
  const t = useT("library.browse")
  const params = toItemsParams(state)
  const query = useInfiniteQuery({
    queryKey: [...keys.library.items(params), "pages"],
    queryFn: ({ pageParam, signal }) =>
      getLibraryItems({ ...params, ...(pageParam ? { cursor: pageParam } : {}) }, { signal }),
    initialPageParam: "",
    getNextPageParam: (last) => last.next_cursor ?? undefined,
  })
  const cards = useVisibleCards(dedupe(query.data?.pages.flatMap((page) => page.items) ?? []))

  if (query.isPending) return <LoadingGrid layout={layout} />
  if (query.isError) return <StateView state="error" error={query.error} onRetry={() => void query.refetch()} />
  if (cards.length === 0) return <StateView state="empty" emptyText={`${t("empty")}. ${t("emptyHint")}`} />
  return (
    <div className="flex flex-col gap-4">
      <p role="status" className="sr-only">
        {t("resultCount", { count: cards.length })}
      </p>
      <ItemGrid items={cards} layout={layout} label={t("resultsLabel")} />
      {query.hasNextPage ? (
        <Button
          type="button"
          variant="outline"
          className="min-h-11 self-center"
          disabled={query.isFetchingNextPage}
          onClick={() => void query.fetchNextPage()}
        >
          {query.isFetchingNextPage ? <Icons.spinner className="animate-spin" aria-hidden /> : null}
          {query.isFetchingNextPage ? t("loadingMore") : t("loadMore")}
        </Button>
      ) : null}
    </div>
  )
}

/** Results of the UniLibrary tab: link-only records from the server-side search. Rendered only when UniLibrary is on. */
export function ExternalResults({ state, layout }: { state: BrowseState; layout: ItemGridLayout }) {
  const t = useT("library")
  const params = { q: state.q.trim(), ...(state.subject ? { subject_id: state.subject } : {}) }
  const query = useInfiniteQuery({
    queryKey: [...keys.library.unilibrary.search(params), "pages"],
    queryFn: ({ pageParam, signal }) => getUniLibrarySearch({ ...params, page: pageParam }, { signal }),
    initialPageParam: 1,
    getNextPageParam: (last, all) => {
      const loaded = all.reduce((sum, page) => sum + page.items.length, 0)
      return last.items.length > 0 && loaded < last.total ? last.page + 1 : undefined
    },
    retry: false,
  })
  const cards = useVisibleCards(dedupe(query.data?.pages.flatMap((page) => page.items) ?? []))
  const stale = query.data?.pages.some((page) => page.stale) ?? false

  if (query.isPending) return <LoadingGrid layout={layout} />
  if (query.isError)
    return <StateView state="error" emptyText={t("unilibrary.error")} onRetry={() => void query.refetch()} />
  return (
    <div className="flex flex-col gap-4">
      <p className="text-muted-foreground text-xs">{t("unilibrary.universityLevel")}</p>
      {stale ? (
        <p
          role="status"
          className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-100"
        >
          {t("unilibrary.unavailable")}
        </p>
      ) : null}
      {cards.length === 0 ? (
        <StateView state="empty" emptyText={t("unilibrary.empty")} />
      ) : (
        <ItemGrid items={cards} layout={layout} label={t("source.external")} />
      )}
      {query.hasNextPage ? (
        <Button
          type="button"
          variant="outline"
          className="min-h-11 self-center"
          disabled={query.isFetchingNextPage}
          onClick={() => void query.fetchNextPage()}
        >
          {query.isFetchingNextPage ? t("browse.loadingMore") : t("browse.loadMore")}
        </Button>
      ) : null}
    </div>
  )
}
