"use client"

import { AppPageHeader, pageClass } from "../../../components/lib/page"
import { useT } from "@ihsp/i18n"

import { useSession } from "@ihsp/auth"
import { DOCUMENT_ROLES } from "../../../config/nav"
import { CoveringOfficers } from "../../staff/components/covering-officers"
import { AdmissionShell } from "../../shell/components/admission-shell"
import { OfficerQueue } from "./officer-queue"
import { PickupForm } from "./pickup-form"
import { StaffOverview } from "./staff-overview"

function Body() {
  const { session } = useSession()
  const roles: readonly string[] = session?.user.roles ?? []
  const officer = roles.includes("transcript_officer")
  return (
    <>
      {roles.includes("admin") ? <CoveringOfficers /> : null}
      {officer ? (
        <>
          <PickupForm />
          <OfficerQueue />
        </>
      ) : (
        <StaffOverview />
      )}
    </>
  )
}

export function StaffTranscriptsPage() {
  const t = useT("transcripts")
  return (
    <AdmissionShell roles={[...DOCUMENT_ROLES]}>
      <div className={pageClass()}>
        <AppPageHeader icon="page" title={t("staffTitle")} />
        <Body />
      </div>
    </AdmissionShell>
  )
}
