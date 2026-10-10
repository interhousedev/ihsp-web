"use client"

import { getMeLibraryQuery } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { StateView, buttonVariants } from "@ihsp/ui"
import { IconBook } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { cardKey, cardRouteId, ItemCardView } from "../../catalog"
import { useVisibleCards } from "../../hooks/use-uni-library"
import { browseHref, readHref } from "../../utils/hrefs"

/** How many books "Continue" shows (docs/reference/study-library.md § 3.9). */
export const CONTINUE_LIMIT = 6

/** The last books the user was reading, each with its progress and a link that opens it where they stopped. */
export function ContinueTab() {
  const t = useT("library.my")
  const home = useT("library.home")
  const query = useQuery(getMeLibraryQuery())
  const cards = useVisibleCards(query.data?.continue).slice(0, CONTINUE_LIMIT)

  if (query.isPending) return <StateView state="loading" rows={3} />
  if (query.isError) return <StateView state="error" error={query.error} onRetry={() => void query.refetch()} />
  if (cards.length === 0) {
    return (
      <StateView
        state="empty"
        emptyText={t("continue.empty")}
        action={
          <Link href={browseHref()} className={buttonVariants({ className: "min-h-11 md:min-h-8" })}>
            {home("emptyAction")}
          </Link>
        }
      />
    )
  }
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-label={t("tabs.continue")}>
      {cards.map((card) => {
        const id = cardRouteId(card)
        return (
          <li key={cardKey(card)}>
            <ItemCardView
              item={card}
              footer={
                id ? (
                  <Link
                    href={readHref({ item: id })}
                    className={buttonVariants({ size: "sm", className: "min-h-11 md:min-h-7" })}
                  >
                    <IconBook aria-hidden />
                    {t("continue.action")}
                  </Link>
                ) : null
              }
            />
          </li>
        )
      })}
    </ul>
  )
}
