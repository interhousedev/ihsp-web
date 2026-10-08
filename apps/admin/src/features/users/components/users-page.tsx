"use client"

import { useT } from "@ihsp/i18n"
import { PageContainer, Tabs, TabsList, TabsTrigger } from "@ihsp/ui"
import { parseAsStringLiteral, useQueryState } from "nuqs"
import { OauthClientsTab } from "./oauth-clients-tab"
import { UsersList } from "./users-list"

const TABS = ["users", "clients"] as const

/** Users & roles (ADM-5): the user list and, in a second tab, OAuth clients and their verification. */
export function UsersPage() {
  const t = useT("users")
  const [tab, setTab] = useQueryState("tab", parseAsStringLiteral(TABS).withDefault("users"))
  return (
    <PageContainer title={t("title")} description={t("description")}>
      <Tabs
        value={tab}
        onValueChange={(value) => void setTab(value === "users" ? null : (value as (typeof TABS)[number]))}
      >
        <TabsList className="w-full justify-start sm:w-fit">
          <TabsTrigger value="users" className="min-h-11 md:min-h-7">
            {t("tabs.users")}
          </TabsTrigger>
          <TabsTrigger value="clients" className="min-h-11 md:min-h-7">
            {t("tabs.clients")}
          </TabsTrigger>
        </TabsList>
      </Tabs>
      {tab === "users" ? <UsersList /> : <OauthClientsTab />}
    </PageContainer>
  )
}
