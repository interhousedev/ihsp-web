"use client"

import { useT } from "@ihsp/i18n"
import { PageContainer, Tabs, TabsList, TabsTrigger } from "@ihsp/ui"
import { parseAsStringLiteral, useQueryState } from "nuqs"
import { AcademicTab } from "./academic-tab"
import { HealthTab } from "./health-tab"
import { UsageTab } from "./usage-tab"

const TABS = ["health", "usage", "academic"] as const

/** Reports: system health, usage and academic figures, as cards and charts. */
export function ReportsPage() {
  const t = useT("reports")
  const labels = { health: t("tabs.health"), usage: t("tabs.usage"), academic: t("tabs.academic") }
  const [tab, setTab] = useQueryState("tab", parseAsStringLiteral(TABS).withDefault("health"))
  return (
    <PageContainer title={t("title")}>
      <Tabs
        value={tab}
        onValueChange={(value) => void setTab(value === "health" ? null : (value as (typeof TABS)[number]))}
      >
        <TabsList className="w-full justify-start sm:w-fit">
          {TABS.map((name) => (
            <TabsTrigger key={name} value={name} className="min-h-11 md:min-h-7">
              {labels[name]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      {tab === "health" ? <HealthTab /> : tab === "usage" ? <UsageTab /> : <AcademicTab />}
    </PageContainer>
  )
}
