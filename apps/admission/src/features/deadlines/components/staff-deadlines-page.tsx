"use client"

import { useSession } from "@ihsp/auth"
import { useT } from "@ihsp/i18n"
import { useState } from "react"
import { AppPageHeader, pageClass } from "../../../components/lib/page"
import { UnderlineTabs } from "../../../components/lib/underline-tabs"
import { CASELOAD_ROLES, CURATOR_ROLES } from "../../../config/nav"
import { AdmissionShell } from "../../shell/components/admission-shell"
import { StaffCaseloadTimeline } from "./staff-caseload-timeline"
import { StaffDeadlineCatalog } from "./staff-deadline-catalog"

/** «Сроки» of the staff: the caseload timeline for every caseload role; the deadline catalog is a second tab for curators. */
export function StaffDeadlinesPage() {
  const t = useT("deadlines")
  const { session } = useSession()
  const roles = session?.user.roles ?? []
  const curator = roles.some((role) => (CURATOR_ROLES as readonly string[]).includes(role))
  const [tab, setTab] = useState("students")
  return (
    <AdmissionShell roles={[...CASELOAD_ROLES]}>
      <div className={pageClass()}>
        <AppPageHeader icon="calendar" title={t("staffPageTitle")} />
        {curator ? (
          <UnderlineTabs
            label={t("staffTimeline.tabs")}
            value={tab}
            onValueChange={setTab}
            tabs={[
              { value: "students", label: t("staffTimeline.students") },
              { value: "catalog", label: t("staffTitle") },
            ]}
          />
        ) : null}
        {curator && tab === "catalog" ? (
          <StaffDeadlineCatalog />
        ) : (
          <StaffCaseloadTimeline canSeeAll={roles.includes("admin")} />
        )}
      </div>
    </AdmissionShell>
  )
}
