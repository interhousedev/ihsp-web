"use client"

import type { StudentProfile } from "@ihsp/api"
import { getConfig } from "@ihsp/config"
import { useFormatters, useT } from "@ihsp/i18n"
import { Badge } from "@ihsp/ui"
import { LinkButton } from "../../shared/components/link-button"
import { InfoRow } from "./info-row"
import { ProfileCard } from "./profile-card"

/** EMIS link status and the last sync; "Update EMIS password" leads to the ID service (UF-WEB-16 step 2). */
export function EmisCard({ profile }: { profile: StudentProfile }) {
  const t = useT("profile.emis")
  const f = useFormatters()
  const needsReauth = profile.emis_status === "needs_reauth"
  return (
    <ProfileCard title={t("title")}>
      <dl className="divide-y">
        <InfoRow label={t("status")}>
          <Badge variant={needsReauth ? "destructive" : "secondary"}>
            {needsReauth ? t("needsReauth") : profile.emis_status === "active" ? t("active") : t("unknown")}
          </Badge>
        </InfoRow>
        <InfoRow label={t("lastSync")}>{profile.synced_at ? f.dateTime(profile.synced_at) : t("never")}</InfoRow>
      </dl>
      {needsReauth ? (
        <LinkButton href={`${getConfig().ID_URL}/security/emis/`} variant="default" className="mt-3">
          {t("update")}
        </LinkButton>
      ) : null}
    </ProfileCard>
  )
}
