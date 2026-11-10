"use client"

import { useSession } from "@ihsp/auth"
import { getConfig } from "@ihsp/config"
import {
  AppearancePage,
  ConnectorsPage,
  IdAccountBaseProvider,
  PersonalTokensPage,
  SecurityOverview,
} from "@ihsp/features-core/id-account"
import { useT } from "@ihsp/i18n"
import { PageContainer } from "@ihsp/ui"

/** The iht.id account (security, connectors, personal tokens, appearance) inside the sp shell; sub-pages open on the ID app. */
export function AccountPage() {
  const t = useT("profile.accountPage")
  const { session } = useSession()
  if (!session) return null
  return (
    <IdAccountBaseProvider base={getConfig().ID_URL}>
      <PageContainer title={t("title")}>
        <section aria-labelledby="account-security" className="grid gap-3">
          <h2 id="account-security" className="text-lg font-medium">
            {t("security")}
          </h2>
          <SecurityOverview user={session.user} />
        </section>
        <ConnectorsPage />
        <PersonalTokensPage />
        <AppearancePage />
      </PageContainer>
    </IdAccountBaseProvider>
  )
}
