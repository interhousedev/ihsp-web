"use client"

import { AppPageHeader, pageClass } from "../../../components/lib/page"
import { useT } from "@ihsp/i18n"
import { Tabs, TabsList, TabsTrigger } from "@ihsp/ui"
import { useState } from "react"
import { CASELOAD_ROLES } from "../../../config/nav"
import { AdmissionShell } from "../../shell/components/admission-shell"
import { useConsultationQueue, type ConsultStatus } from "../api"
import { ConsultationList } from "./consultation-list"

const FILTERS: Record<string, readonly ConsultStatus[]> = {
  open: ["requested", "proposed", "accepted"],
  closed: ["declined", "completed", "cancelled"],
}

/** The queue of consultation requests for counselors and mentors. */
export function StaffConsultationsPage() {
  const t = useT("consultations")
  const [filter, setFilter] = useState("open")
  const query = useConsultationQueue(FILTERS[filter] ?? FILTERS.open)
  return (
    <AdmissionShell roles={[...CASELOAD_ROLES]}>
      <div className={pageClass()}>
        <AppPageHeader icon="chat" title={t("queueTitle")} />
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList>
            {Object.keys(FILTERS).map((value) => (
              <TabsTrigger key={value} value={value}>
                {t(`filter.${value}`)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <ConsultationList
          items={query.data?.items}
          isPending={query.isPending}
          error={query.error}
          onRetry={() => void query.refetch()}
          emptyKey="queueEmpty"
        />
      </div>
    </AdmissionShell>
  )
}
