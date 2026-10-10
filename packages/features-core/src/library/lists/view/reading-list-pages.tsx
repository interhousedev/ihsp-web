"use client"

import { getReadingListQuery, getReadingListsQuery, isApiError } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { PageContainer, StateView, buttonVariants } from "@ihsp/ui"
import { IconPlus } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { NotAvailable } from "../../catalog/not-available"
import { useLibraryAccess } from "../../hooks/use-library-access"
import { listEditHref } from "../../utils/hrefs"
import { ReadingListCardView } from "./reading-list-card"
import { ReadingListView } from "./reading-list-view"

/** `/lists/`: the reading lists of my groups (students) or my subjects (teachers), with "New list" for those who write them. */
export function ReadingListsPage() {
  const t = useT("library.readingList")
  const { canWriteLists } = useLibraryAccess()
  const query = useQuery(getReadingListsQuery())
  return (
    <PageContainer
      title={t("title")}
      actions={
        canWriteLists ? (
          <Link href={listEditHref()} className={buttonVariants({ className: "min-h-11 md:min-h-8" })}>
            <IconPlus aria-hidden />
            {t("new")}
          </Link>
        ) : null
      }
    >
      {query.isPending ? (
        <StateView state="loading" />
      ) : query.isError ? (
        <StateView state="error" error={query.error} onRetry={() => void query.refetch()} />
      ) : query.data.length === 0 ? (
        <StateView state="empty" emptyText={t("empty")} />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {query.data.map((list) => (
            <li key={list.id}>
              <ReadingListCardView list={list} />
            </li>
          ))}
        </ul>
      )}
    </PageContainer>
  )
}

/** `/lists/view/?id=`: one reading list. */
export function ReadingListPage() {
  const id = useSearchParams().get("id")
  const query = useQuery({ ...getReadingListQuery(id ?? ""), enabled: Boolean(id), retry: false })
  if (!id) return <NotAvailable />
  if (query.isPending) {
    return (
      <div className="px-4 pt-4 md:px-6">
        <StateView state="loading" />
      </div>
    )
  }
  if (query.isError) {
    if (isApiError(query.error) && (query.error.status === 404 || query.error.status === 403)) return <NotAvailable />
    return (
      <div className="px-4 pt-4 md:px-6">
        <StateView state="error" error={query.error} onRetry={() => void query.refetch()} />
      </div>
    )
  }
  return <ReadingListView list={query.data} />
}
