"use client"

import { useT } from "@ihsp/i18n"
import { PageHeader } from "@ihsp/ui"
import { useSession } from "@ihsp/auth"
import { DOCUMENT_ROLES } from "../../../config/nav"
import { AdmissionShell } from "../../shell/components/admission-shell"
import { OfficerQueue } from "./officer-queue"
import { PickupForm } from "./pickup-form"
import { StaffOverview } from "./staff-overview"

function Body() {
  const { session } = useSession()
  const roles: readonly string[] = session?.user.roles ?? []
  const officer = roles.includes("transcript_officer")
  return officer ? (
    <>
      <PickupForm />
      <OfficerQueue />
    </>
  ) : (
    <StaffOverview />
  )
}

export function StaffTranscriptsPage() {
  const t = useT("transcripts")
  return (
    <AdmissionShell roles={[...DOCUMENT_ROLES]}>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 md:p-6">
        <PageHeader title={t("staffTitle")} />
        <Body />
      </div>
    </AdmissionShell>
  )
}
