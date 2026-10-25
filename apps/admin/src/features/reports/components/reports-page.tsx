"use client"

import { useT } from "@ihsp/i18n"
import { PageContainer, Skeleton, Tabs, TabsList, TabsTrigger } from "@ihsp/ui"
import { parseAsStringLiteral, useQueryState } from "nuqs"
import { lazy, Suspense } from "react"
import { HealthTab } from "./health-tab"

/** The two chart tabs carry Recharts, so they arrive in their own chunks when first opened. */
const UsageTab = lazy(() => import("./usage-tab").then((m) => ({ default: m.UsageTab })))
const AcademicTab = lazy(() => import("./academic-tab").then((m) => ({ default: m.AcademicTab })))

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
      {tab === "health" ? (
        <HealthTab />
      ) : (
        <Suspense fallback={<Skeleton className="h-72 w-full rounded-xl" />}>
          {tab === "usage" ? <UsageTab /> : <AcademicTab />}
        </Suspense>
      )}
    </PageContainer>
  )
}
