"use client"

import { getAdminDashboardQuery } from "@ihsp/api"
import { todayIso, useT } from "@ihsp/i18n"
import { Icons, PageContainer } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { QueryState } from "../../shared/components/query-state"
import { DashboardTile } from "./dashboard-tile"
import { MissingAttendanceCard } from "./missing-attendance-card"
import { ScheduledBroadcastsCard } from "./scheduled-broadcasts-card"
import { SyncCard } from "./sync-card"

/** Dashboard (ADM-2, UF-ADM-01): what needs action today; every tile opens its list. */
export function DashboardPage() {
  const t = useT("dashboard")
  const query = useQuery(getAdminDashboardQuery())
  const today = todayIso()
  return (
    <PageContainer title={t("title")}>
      <QueryState query={query} rows={4}>
        {(data) => (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <DashboardTile
                href={`/lessons/?from=${today}&to=${today}`}
                label={t("lessonsToday")}
                value={data.today.lessons}
                icon={<Icons.calendarEvent aria-hidden />}
              />
              <DashboardTile
                href={`/lessons/?from=${today}&to=${today}&status=cancelled`}
                label={t("cancelledToday")}
                value={data.today.cancelled}
                icon={<Icons.circleX aria-hidden />}
              />
              <DashboardTile
                href={`/lessons/?teacher_needed=true`}
                label={t("teacherNeeded")}
                value={data.today.teacher_needed}
                icon={<Icons.employee aria-hidden />}
              />
              <DashboardTile
                href="/students/?emis_status=needs_reauth"
                label={t("needsReauth")}
                value={data.sync.needs_reauth}
                icon={<Icons.lock aria-hidden />}
              />
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              <MissingAttendanceCard items={data.missing_attendance} />
              <SyncCard sync={data.sync} />
              <ScheduledBroadcastsCard items={data.scheduled_broadcasts} />
            </div>
          </div>
        )}
      </QueryState>
    </PageContainer>
  )
}
