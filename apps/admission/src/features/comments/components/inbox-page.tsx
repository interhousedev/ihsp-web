"use client"

import { useT } from "@ihsp/i18n"
import { AppPageHeader, pageClass } from "../../../components/lib/page"
import { AdmissionShell } from "../../shell/components/admission-shell"
import { STAFF_ROLES } from "../../staff/components/caseload-page"
import { CommentsInbox } from "./inbox"

/** `/staff/inbox/`: comments addressed to the signed-in staff member. */
export function CommentsInboxPage() {
  const t = useT("comments")
  return (
    <AdmissionShell roles={[...STAFF_ROLES]}>
      <div className={pageClass()}>
        <AppPageHeader icon="inbox" title={t("inboxTitle")} />
        <CommentsInbox />
      </div>
    </AdmissionShell>
  )
}
