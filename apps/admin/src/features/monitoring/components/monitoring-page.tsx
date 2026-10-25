"use client"

import { useT } from "@ihsp/i18n"
import { PageContainer, Tabs, TabsList, TabsTrigger } from "@ihsp/ui"
import { parseAsStringLiteral, useQueryState } from "nuqs"
import { AuditTab } from "./audit-tab"
import { ProcessesTab } from "./processes-tab"
import { SyncTab } from "./sync-tab"

const TABS = ["sync", "processes", "audit"] as const

/** Monitoring (ADM-14, UF-ADM-13): EMIS sync runs, worker processes and the audit log. */
export function MonitoringPage() {
  const t = useT("monitoring")
  const [tab, setTab] = useQueryState("tab", parseAsStringLiteral(TABS).withDefault("sync"))
  return (
    <PageContainer title={t("title")}>
      <Tabs
        value={tab}
        onValueChange={(value) => void setTab(value === "sync" ? null : (value as (typeof TABS)[number]))}
      >
        <TabsList className="w-full justify-start sm:w-fit">
          <TabsTrigger value="sync" className="min-h-11 md:min-h-7">
            {t("tabs.sync")}
          </TabsTrigger>
          <TabsTrigger value="processes" className="min-h-11 md:min-h-7">
            {t("tabs.processes")}
          </TabsTrigger>
          <TabsTrigger value="audit" className="min-h-11 md:min-h-7">
            {t("tabs.audit")}
          </TabsTrigger>
        </TabsList>
      </Tabs>
      {tab === "sync" ? <SyncTab /> : tab === "processes" ? <ProcessesTab /> : <AuditTab />}
    </PageContainer>
  )
}
