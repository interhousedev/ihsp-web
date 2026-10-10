"use client"

import { getConfig } from "@ihsp/config"
import { useT } from "@ihsp/i18n"
import { PageContainer } from "@ihsp/ui"
import { LinkButton } from "../../shared/components/link-button"
import { QueryState } from "../../shared/components/query-state"
import { useAccount, useProfile } from "../hooks/use-profile"
import { AccountCard } from "./account-card"
import { EmisCard } from "./emis-card"
import { StorageCard } from "./storage-card"
import { TelegramCard } from "./telegram-card"

/** The profile cards (account, EMIS, Telegram, storage) without a page frame; Settings shows them as its Profile section. */
export function ProfileSections() {
  const profile = useProfile()
  const account = useAccount()
  return (
    <QueryState query={profile} rows={4}>
      {(data) => (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <AccountCard profile={data} account={account.data} />
          <div className="flex flex-col gap-4">
            <EmisCard profile={data} />
            <TelegramCard accounts={account.data?.telegram ?? []} />
            <StorageCard />
          </div>
        </div>
      )}
    </QueryState>
  )
}

/** Profile (WEB-28, UF-WEB-16): the account at a glance; security settings are on the ID service. */
export function ProfilePage() {
  const t = useT("profile")
  return (
    <PageContainer
      title={t("title")}
      description={t("description")}
      actions={<LinkButton href={`${getConfig().ID_URL}/security/`}>{t("security")}</LinkButton>}
    >
      <ProfileSections />
    </PageContainer>
  )
}
