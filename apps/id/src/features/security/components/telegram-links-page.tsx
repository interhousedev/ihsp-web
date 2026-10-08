"use client"

import { getIdMeQuery, getIdMeTelegramQuery } from "@ihsp/api"
import { PageContainer, StateView } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { QueryBoundary } from "../../shared/components/query-boundary"
import { useTr } from "../../shared/hooks/use-tr"
import { LinkTelegramCard } from "./link-telegram-card"
import { TelegramAccountRow } from "./telegram-account-row"

const POLL_MS = 5000

/** `/security/telegram/` (UF-ID-04, UF-ID-05): linked accounts; the list refreshes every 5 s while the page is open. */
export function TelegramLinksPage() {
  const t = useTr()
  const accounts = useQuery({ ...getIdMeTelegramQuery(), refetchInterval: POLL_MS })
  const me = useQuery(getIdMeQuery())
  return (
    <PageContainer title={t("security.telegram.title")} description={t("security.telegram.description")}>
      <LinkTelegramCard />
      <QueryBoundary query={accounts}>
        {(items) => {
          if (items.length === 0) return <StateView state="empty" emptyText={t("security.telegram.empty")} />
          const user = me.data
          if (!user) return <StateView state="loading" />
          return (
            <ul className="grid gap-3">
              {items.map((account) => (
                <li key={account.telegram_user_id}>
                  <TelegramAccountRow account={account} user={user} />
                </li>
              ))}
            </ul>
          )
        }}
      </QueryBoundary>
    </PageContainer>
  )
}
