"use client"

import { getMyFeedbackQuery } from "@ihsp/api"
import { QueryState } from "@ihsp/features-core"
import { useT } from "@ihsp/i18n"
import { useQuery } from "@tanstack/react-query"
import { FeedbackItemCard } from "./feedback-item-card"

/** The caller's reports with their status, and the administrators' responses (text and images). */
export function MyFeedbackPage() {
  const t = useT("feedback")
  const query = useQuery(getMyFeedbackQuery())
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">{t("page.title")}</h1>
      <QueryState query={query} isEmpty={(data) => data.items.length === 0} emptyText={t("page.empty")}>
        {(data) => (
          <ul className="flex flex-col gap-3">
            {data.items.map((item) => (
              <li key={item.id}>
                <FeedbackItemCard item={item} />
              </li>
            ))}
          </ul>
        )}
      </QueryState>
    </div>
  )
}
