"use client"

import { getManageBooks, keys, type ItemStatus } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import {
  Button,
  Icons,
  Input,
  NativeSelect,
  NativeSelectOption,
  PageContainer,
  Skeleton,
  StateView,
  buttonVariants,
  useDebounce,
} from "@ihsp/ui"
import { IconFileImport, IconPlus } from "@tabler/icons-react"
import { useInfiniteQuery } from "@tanstack/react-query"
import Link from "next/link"
import { useState } from "react"
import { manageBookEditHref } from "../../utils/hrefs"
import { BooksTable } from "./books-table"
import { BulkImport } from "./bulk-import"

const STATUSES: readonly ItemStatus[] = ["draft", "published", "held", "unpublished"]
const PAGE_SIZE = 25

/**
 * `/manage/books/`: the librarian's table of library books (title, rights, status, visibility, text status), a search
 * box, a status filter, **New book** and **Bulk import**.
 */
export function BooksPage() {
  const t = useT("library.manage.books")
  const statusLabel = useT("library.item.status")
  const [text, setText] = useState("")
  const [status, setStatus] = useState<ItemStatus | "">("")
  const [importing, setImporting] = useState(false)
  const q = useDebounce(text.trim(), 300)

  const params = { ...(q ? { q } : {}), ...(status ? { status } : {}), limit: PAGE_SIZE }
  const query = useInfiniteQuery({
    queryKey: [...keys.library.manage.books(params), "pages"],
    queryFn: ({ pageParam, signal }) =>
      getManageBooks({ ...params, ...(pageParam ? { cursor: pageParam } : {}) }, { signal }),
    initialPageParam: "",
    getNextPageParam: (last) => last.next_cursor ?? undefined,
  })
  const rows = query.data?.pages.flatMap((page) => page.items) ?? []

  return (
    <PageContainer
      title={t("title")}
      description={t("description")}
      actions={
        <>
          <Button type="button" variant="outline" className="min-h-11 md:min-h-8" onClick={() => setImporting(true)}>
            <IconFileImport aria-hidden />
            {t("import")}
          </Button>
          <Link href={manageBookEditHref()} className={buttonVariants({ className: "min-h-11 md:min-h-8" })}>
            <IconPlus aria-hidden />
            {t("new")}
          </Link>
        </>
      }
    >
      <form
        role="search"
        aria-label={t("filters")}
        className="flex flex-wrap gap-2"
        onSubmit={(e) => e.preventDefault()}
      >
        <Input
          type="search"
          value={text}
          aria-label={t("search")}
          placeholder={t("search")}
          className="min-h-11 min-w-0 flex-1 basis-56 md:min-h-8"
          onChange={(event) => setText(event.target.value)}
        />
        <NativeSelect
          aria-label={t("statusFilter")}
          value={status}
          onChange={(event) => setStatus(event.target.value as ItemStatus | "")}
        >
          <NativeSelectOption value="">{t("allStatuses")}</NativeSelectOption>
          {STATUSES.map((value) => (
            <NativeSelectOption key={value} value={value}>
              {statusLabel(value)}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </form>

      {query.isPending ? (
        <div role="status" aria-busy="true" className="flex flex-col gap-2">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : query.isError ? (
        <StateView state="error" error={query.error} onRetry={() => void query.refetch()} />
      ) : rows.length === 0 ? (
        <StateView
          state="empty"
          emptyText={q || status ? t("noMatches") : t("empty")}
          action={
            q || status ? undefined : (
              <Link href={manageBookEditHref()} className={buttonVariants({ className: "min-h-11 md:min-h-8" })}>
                <IconPlus aria-hidden />
                {t("new")}
              </Link>
            )
          }
        />
      ) : (
        <>
          <BooksTable rows={rows} />
          {query.hasNextPage ? (
            <Button
              type="button"
              variant="outline"
              className="min-h-11 self-center"
              disabled={query.isFetchingNextPage}
              onClick={() => void query.fetchNextPage()}
            >
              {query.isFetchingNextPage ? <Icons.spinner className="animate-spin" aria-hidden /> : null}
              {t("loadMore")}
            </Button>
          ) : null}
        </>
      )}
      <BulkImport open={importing} onOpenChange={setImporting} />
    </PageContainer>
  )
}
