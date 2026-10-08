"use client"

import type { Student360 } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Card, CardContent } from "@ihsp/ui"
import { StatusBadge } from "../../shared/components/status-badge"
import { fullName } from "../../shared/utils/names"

/** Identity, group, curator and EMIS status of a student (ADM-3 "Overview"). */
export function StudentOverviewTab({ profile }: { profile: Student360["profile"] }) {
  const t = useT("students")
  const f = useFormatters()
  const rows: [string, React.ReactNode][] = [
    [t("overview.login"), profile.login ?? "—"],
    [t("overview.mailbox"), profile.mailbox ?? "—"],
    [t("overview.group"), profile.group.name],
    [t("overview.subgroup"), profile.subgroup ?? "—"],
    [t("overview.semester"), profile.current_semester ?? "—"],
    [t("overview.curator"), profile.curator ? fullName(profile.curator) : "—"],
    [t("overview.headStudent"), profile.head_student ? fullName(profile.head_student) : "—"],
    [t("overview.status"), <StatusBadge key="status" status={profile.status} />],
    [t("overview.emis"), <StatusBadge key="emis" status={profile.emis_status} />],
    [t("overview.synced"), profile.synced_at ? f.dateTime(profile.synced_at) : "—"],
    [t("overview.roles"), profile.roles.join(", ")],
  ]
  return (
    <Card>
      <CardContent>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
          {rows.map(([label, value]) => (
            <div key={label} className="flex flex-col gap-0.5">
              <dt className="text-muted-foreground text-xs">{label}</dt>
              <dd className="text-sm break-words">{value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  )
}
