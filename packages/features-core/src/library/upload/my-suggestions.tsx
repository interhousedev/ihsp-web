"use client"

import { getMySuggestionsQuery, type MySuggestion } from "@ihsp/api"
import { formatDate, useT } from "@ihsp/i18n"
import { Badge, Skeleton, StateView, buttonVariants } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { itemHref, uploadHref } from "../utils/hrefs"

const VARIANT: Record<MySuggestion["status"], "secondary" | "default" | "outline"> = {
  new: "secondary",
  accepted: "default",
  declined: "outline",
}

/**
 * "My suggestions" (a tab of My library): the books the user sent from `/upload/`, newest first, with the status
 * (waiting, accepted with a link to the book, declined with the librarian's reason).
 */
export function MySuggestions() {
  const t = useT("library.mySuggestions")
  const query = useQuery(getMySuggestionsQuery())
  const rows = query.data?.items ?? []

  return (
    <section aria-label={t("label")} className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Link href={uploadHref()} className={buttonVariants({ className: "min-h-11 md:min-h-8" })}>
          {t("suggest")}
        </Link>
      </div>
      {query.isPending ? (
        <Skeleton className="h-20 w-full" />
      ) : query.isError ? (
        <StateView state="error" error={query.error} onRetry={() => void query.refetch()} />
      ) : rows.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t("empty")}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map((row) => (
            <li key={row.id} className="flex flex-col gap-1 rounded-xl border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium break-words">{row.title}</span>
                <Badge variant={VARIANT[row.status]}>{t(`status.${row.status}`)}</Badge>
              </div>
              <span className="text-muted-foreground text-xs">{t("sent", { date: formatDate(row.created_at) })}</span>
              {row.status === "declined" && row.reason ? (
                <p className="text-sm break-words whitespace-pre-line">
                  <span className="text-muted-foreground">{t("reason")}: </span>
                  {row.reason}
                </p>
              ) : null}
              {row.status === "accepted" && row.item_id ? (
                <Link href={itemHref(row.item_id)} className="text-sm underline">
                  {t("openBook")}
                </Link>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
