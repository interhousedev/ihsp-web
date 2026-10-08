"use client"

import type { StudentProfile, UserMe } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { CopyButton } from "@ihsp/ui"
import { fullName } from "../../shared/utils/people"
import { InfoRow } from "./info-row"
import { ProfileCard } from "./profile-card"

/** Name, login, mailbox, group, subgroup, curator and head student (WEB-28, UF-WEB-16 step 1). */
export function AccountCard({ profile, account }: { profile: StudentProfile; account: UserMe | undefined }) {
  const t = useT("profile.account")
  const mailbox = profile.mailbox ?? account?.mailbox ?? null
  return (
    <ProfileCard title={t("title")}>
      <dl className="divide-y">
        <InfoRow label={t("name")}>{fullName(profile)}</InfoRow>
        <InfoRow label={t("login")}>{profile.login ?? "–"}</InfoRow>
        <InfoRow label={t("mailbox")}>
          {mailbox ? (
            <>
              <span className="min-w-0 truncate">{mailbox}</span>
              <CopyButton value={mailbox} variant="ghost" />
            </>
          ) : (
            "–"
          )}
        </InfoRow>
        <InfoRow label={t("group")}>{profile.group.name}</InfoRow>
        <InfoRow label={t("subgroup")}>{profile.subgroup ?? t("subgroupUnset")}</InfoRow>
        <InfoRow label={t("curator")}>{profile.curator ? fullName(profile.curator) : "–"}</InfoRow>
        <InfoRow label={t("headStudent")}>{profile.head_student ? fullName(profile.head_student) : "–"}</InfoRow>
      </dl>
    </ProfileCard>
  )
}
