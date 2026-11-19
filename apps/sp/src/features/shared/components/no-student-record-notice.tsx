"use client"

import { getConfig } from "@ihsp/config"
import { useT } from "@ihsp/i18n"
import { StateView } from "@ihsp/ui"
import { LinkButton } from "./link-button"

/**
 * The one explanation a page shows when the student has no academic record or EMIS refuses the stored login: what
 * happened, what to do and whom to contact. It replaces the page's error cards, which a retry cannot fix.
 */
export function NoStudentRecordNotice({ reason }: { reason: "missing" | "emis-failed" }) {
  const t = useT(`studentRecord.${reason}`)
  return (
    <StateView
      state="empty"
      role="status"
      data-testid="no-student-record"
      title={t("title")}
      description={t("description")}
      action={
        reason === "emis-failed" ? (
          <LinkButton href={`${getConfig().ID_URL}/security/emis/`} variant="default">
            {t("action")}
          </LinkButton>
        ) : null
      }
    />
  )
}
