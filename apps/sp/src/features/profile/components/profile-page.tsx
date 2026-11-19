"use client"

import { useT } from "@ihsp/i18n"
import { PageContainer } from "@ihsp/ui"
import { StudentCardButton } from "../../student-card/components/student-card-button"
import { LinkButton } from "../../shared/components/link-button"
import { MyPhotoField, QueryState } from "@ihsp/features-core"
import { useSession } from "@ihsp/auth"
import { NoStudentRecordNotice } from "../../shared/components/no-student-record-notice"
import { isRecordBlocked, useStudentRecordState } from "../../shared/hooks/use-student-record-state"
import { fullName } from "../../shared/utils/people"
import { HidePhotoSwitch } from "@/features/my-group/components/hide-photo-switch"
import { useAccount, useProfile } from "../hooks/use-profile"
import { ProfileCard } from "./profile-card"
import { CertificatesSection } from "./certificates-section"
import { AccountCard } from "./account-card"
import { EmisCard } from "./emis-card"
import { StorageCard } from "./storage-card"
import { TelegramCard } from "./telegram-card"

/** The profile cards (account, EMIS, Telegram, storage) without a page frame; Settings shows them as its Profile section. */
export function ProfileSections() {
  const profile = useProfile()
  const account = useAccount()
  const record = useStudentRecordState()
  const t = useT("profile")
  const { session } = useSession()
  // The photo belongs to the account, so it is offered to every role and without a student record.
  const photo = session ? (
    <ProfileCard title={t("photo.title")}>
      <div className="flex flex-col gap-4">
        <MyPhotoField name={fullName(session.user)} removeDescription={t("photo.removeDescription")} />
        <p className="text-muted-foreground text-sm">{t("photo.rule")}</p>
        <HidePhotoSwitch />
      </div>
    </ProfileCard>
  ) : null
  if (isRecordBlocked(record.status))
    return (
      <div className="flex flex-col gap-6">
        {photo}
        <NoStudentRecordNotice reason={record.status} />
      </div>
    )
  return (
    <div className="flex flex-col gap-6">
      {photo}
      <QueryState query={profile} rows={4}>
        {(data) => (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <AccountCard profile={data} account={account.data} />
            <div className="flex flex-col gap-4">
              <EmisCard profile={data} />
              <TelegramCard accounts={account.data?.telegram ?? []} />
              <StorageCard />
            </div>
          </div>
        )}
      </QueryState>
      <CertificatesSection />
    </div>
  )
}

/** Profile (WEB-28, UF-WEB-16): the account at a glance; security settings are on the ID service. */
export function ProfilePage() {
  const t = useT("profile")
  return (
    <PageContainer
      title={t("title")}
      actions={
        <div className="flex flex-wrap gap-2">
          <StudentCardButton />
          <LinkButton href="/profile/account/">{t("accountLink")}</LinkButton>
          <LinkButton href="/profile/face/">{t("faceLink")}</LinkButton>
        </div>
      }
    >
      <ProfileSections />
    </PageContainer>
  )
}
