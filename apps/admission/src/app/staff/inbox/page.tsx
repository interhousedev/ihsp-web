"use client"

import { useT } from "@ihsp/i18n"
import { PageHeader } from "@ihsp/ui"
import { CommentsInbox } from "../../../features/comments/components/inbox"
import { STAFF_ROLES } from "../../../features/staff/components/caseload-page"
import { AdmissionShell } from "../../../features/shell/components/admission-shell"

export default function Page() {
  const t = useT("comments")
  return (
    <AdmissionShell roles={[...STAFF_ROLES]}>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4 md:p-6">
        <PageHeader title={t("inboxTitle")} />
        <CommentsInbox />
      </div>
    </AdmissionShell>
  )
}
