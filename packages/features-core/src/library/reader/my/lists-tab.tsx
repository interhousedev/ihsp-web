"use client"

import { getReadingListsQuery } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { StateView, buttonVariants } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { ReadingListCardView } from "../../lists/view"
import { listsHref } from "../../utils/hrefs"

/** The reading lists of the user's groups, with their progress on the essential entries. */
export function ListsTab() {
  const t = useT("library.my")
  const query = useQuery(getReadingListsQuery())
  if (query.isPending) return <StateView state="loading" rows={3} />
  if (query.isError) return <StateView state="error" error={query.error} onRetry={() => void query.refetch()} />
  if (query.data.length === 0) {
    return (
      <StateView
        state="empty"
        emptyText={t("lists.empty")}
        action={
          <Link href={listsHref()} className={buttonVariants({ variant: "outline", className: "min-h-11 md:min-h-8" })}>
            {t("lists.all")}
          </Link>
        }
      />
    )
  }
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-label={t("tabs.lists")}>
      {query.data.map((list) => (
        <li key={list.id}>
          <ReadingListCardView list={list} />
        </li>
      ))}
    </ul>
  )
}
