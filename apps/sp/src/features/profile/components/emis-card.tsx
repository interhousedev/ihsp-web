"use client"

import { getMeStudentCardQuery, type StudentProfile } from "@ihsp/api"
import { getConfig } from "@ihsp/config"
import { useFormatters, useT } from "@ihsp/i18n"
import { Badge } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { LinkButton } from "../../shared/components/link-button"
import { needsRelink, retryCardQuery } from "../../student-card/components/student-card-error"
import { InfoRow } from "./info-row"
import { ProfileCard } from "./profile-card"

/**
 * EMIS link status and the last sync. The status is "failed" when the profile says the password needs updating or
 * when the student card request is refused by EMIS (`emis/auth-failed`), whatever the stored status says; then the
 * card explains the next step and "Update EMIS password" leads to the ID service (UF-WEB-16 step 2).
 */
export function EmisCard({ profile }: { profile: StudentProfile }) {
  const t = useT("profile.emis")
  const f = useFormatters()
  const card = useQuery({ ...getMeStudentCardQuery(), retry: retryCardQuery })
  const failed = profile.emis_status === "needs_reauth" || needsRelink(card.error)
  return (
    <ProfileCard title={t("title")}>
      <dl className="divide-y">
        <InfoRow label={t("status")}>
          <Badge variant={failed ? "destructive" : "secondary"}>
            {failed ? t("needsReauth") : profile.emis_status === "active" ? t("active") : t("unknown")}
          </Badge>
        </InfoRow>
        <InfoRow label={t("lastSync")}>{profile.synced_at ? f.dateTime(profile.synced_at) : t("never")}</InfoRow>
      </dl>
      {failed ? (
        <>
          <p role="alert" className="text-destructive mt-3 text-sm">
            {t("authFailedHint")}
          </p>
          <LinkButton href={`${getConfig().ID_URL}/security/emis/`} variant="default" className="mt-3">
            {t("update")}
          </LinkButton>
        </>
      ) : null}
    </ProfileCard>
  )
}
