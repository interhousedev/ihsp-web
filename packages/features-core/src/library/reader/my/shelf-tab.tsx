"use client"

import { deleteShelfEntry, getMeLibraryQuery, getShelf, keys, type ShelfEntry } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, StateView, ToggleGroup, ToggleGroupItem, buttonVariants } from "@ihsp/ui"
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { parseAsStringLiteral, useQueryState } from "nuqs"
import { toast } from "sonner"
import { ItemCardView, ShelfButton, cardKey } from "../../catalog"
import { useUniLibraryEnabled } from "../../hooks/use-uni-library"
import { browseHref } from "../../utils/hrefs"

const FILTERS = ["all", "want", "reading", "done"] as const
const PAGE_SIZE = 24

/** A shelf row whose item was taken down: the title stays, the item cannot be opened. */
function RemovedRow({ entry }: { entry: ShelfEntry }) {
  const t = useT("library.my")
  const errorMessage = useErrorMessage()
  const queryClient = useQueryClient()
  const remove = useMutation({
    mutationFn: () => deleteShelfEntry(entry.item.id!),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: keys.library.me() }),
    onError: (error) => toast.error(errorMessage(error)),
  })
  return (
    <div className="bg-muted/40 flex h-full flex-col gap-2 rounded-xl border border-dashed p-3">
      <p className="font-medium break-words">{entry.item.title}</p>
      {entry.item.author_label ? <p className="text-muted-foreground text-xs">{entry.item.author_label}</p> : null}
      <p className="text-muted-foreground text-sm">{t("shelf.removed")}</p>
      <p className="text-muted-foreground text-xs">{t("shelf.removedHint")}</p>
      {entry.item.id ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-auto min-h-11 self-start md:min-h-7"
          disabled={remove.isPending}
          onClick={() => remove.mutate()}
        >
          {t("shelf.removeEntry")}
        </Button>
      ) : null}
    </div>
  )
}

/** The user's shelf with a filter (all, want to read, reading, finished) and counts; removed items stay as rows. */
export function ShelfTab() {
  const t = useT("library.my")
  const shelf = useT("library.shelf")
  const home = useT("library.home")
  const [filter, setFilter] = useQueryState("state", parseAsStringLiteral(FILTERS).withDefault("all"))
  const unilibrary = useUniLibraryEnabled()
  const counts = useQuery(getMeLibraryQuery())
  const query = useInfiniteQuery({
    queryKey: keys.library.shelf({ state: filter, limit: PAGE_SIZE, paged: true }),
    queryFn: ({ pageParam, signal }) =>
      getShelf(
        {
          ...(filter === "all" ? {} : { state: filter }),
          limit: PAGE_SIZE,
          ...(pageParam ? { cursor: pageParam } : {}),
        },
        { signal },
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.next_cursor ?? undefined,
  })
  const entries = (query.data?.pages.flatMap((page) => page.items) ?? []).filter(
    (entry) => unilibrary || entry.item.kind !== "external",
  )
  const total = counts.data
    ? counts.data.shelf_counts.want + counts.data.shelf_counts.reading + counts.data.shelf_counts.done
    : null

  return (
    <div className="flex flex-col gap-4">
      <ToggleGroup
        aria-label={t("shelf.filter")}
        value={[filter]}
        onValueChange={(value) => {
          const next = value[0]
          if (next === "all" || next === "want" || next === "reading" || next === "done") void setFilter(next)
        }}
        className="flex-wrap"
      >
        {FILTERS.map((name) => {
          const count = name === "all" ? total : (counts.data?.shelf_counts[name] ?? null)
          return (
            <ToggleGroupItem key={name} value={name} className="min-h-11 px-3 md:min-h-8">
              {name === "all" ? t("shelf.all") : shelf(name)}
              {count !== null ? <span className="text-muted-foreground ms-1.5 tabular-nums">{count}</span> : null}
            </ToggleGroupItem>
          )
        })}
      </ToggleGroup>

      {query.isPending ? (
        <StateView state="loading" rows={3} />
      ) : query.isError ? (
        <StateView state="error" error={query.error} onRetry={() => void query.refetch()} />
      ) : entries.length === 0 ? (
        <StateView
          state="empty"
          emptyText={filter === "all" ? t("shelf.empty") : t("shelf.emptyFiltered")}
          action={
            <Link href={browseHref()} className={buttonVariants({ className: "min-h-11 md:min-h-8" })}>
              {home("emptyAction")}
            </Link>
          }
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-label={t("tabs.shelf")}>
          {entries.map((entry) => (
            <li key={cardKey(entry.item)}>
              {entry.removed ? (
                <RemovedRow entry={entry} />
              ) : (
                <ItemCardView item={entry.item} footer={<ShelfButton item={entry.item} />} />
              )}
            </li>
          ))}
        </ul>
      )}
      {query.hasNextPage ? (
        <Button
          type="button"
          variant="outline"
          className="min-h-11 self-center md:min-h-8"
          disabled={query.isFetchingNextPage}
          onClick={() => void query.fetchNextPage()}
        >
          {t("showMore")}
        </Button>
      ) : null}
    </div>
  )
}
