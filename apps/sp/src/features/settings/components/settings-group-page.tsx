"use client"

import { getMeProfileQuery } from "@ihsp/api"
import { useSession } from "@ihsp/auth"
import { getConfig } from "@ihsp/config"
import { FeedbackDialog, LicenseSection, NotificationSettingsForm, ReplayTourButton } from "@ihsp/features-core"
import { useT } from "@ihsp/i18n"
import { Button, Icons, PageContainer } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { useState, type ReactNode } from "react"
import { CalendarFeedPanel } from "../../calendar-feed/components/calendar-feed-panel"
import { StudentCardButton } from "../../student-card/components/student-card-button"
import { ProfileSections } from "../../profile/components/profile-page"
import { AppLockSection } from "../../pwa/components/app-lock-section"
import { getServiceWorkerRegistration } from "../../pwa/utils/service-worker-registration"
import { LinkButton } from "../../shared/components/link-button"
import { BottomBarEditor } from "./bottom-bar-editor"
import { EmisSyncSection } from "./emis-sync-section"
import { GeneralSettings } from "./general-settings"
import type { SettingsGroupId } from "./settings-groups"
import { SettingsSection } from "./settings-section"
import { TelegramHint } from "./telegram-hint"

function NotificationsGroup() {
  const t = useT("settings")
  const { session } = useSession()
  const profile = useQuery(getMeProfileQuery())
  if (!session) return null
  return (
    <SettingsSection title={t("notifications.title")}>
      <TelegramHint />
      <NotificationSettingsForm
        roles={session.user.roles}
        isHeadStudent={profile.data?.head_student?.id === session.user.id}
        getPushRegistration={getServiceWorkerRegistration}
      />
    </SettingsSection>
  )
}

function HelpGroup() {
  const t = useT("settings")
  const tOnboarding = useT("onboarding.replay")
  const tFeedback = useT("feedback")
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  return (
    <>
      <SettingsSection title={tOnboarding("title")}>
        <ReplayTourButton />
      </SettingsSection>
      <SettingsSection title={t("help.feedbackTitle")}>
        <div className="flex flex-col gap-2">
          <Button type="button" className="min-h-11 md:min-h-8" onClick={() => setFeedbackOpen(true)}>
            {tFeedback("menu.suggest")}
          </Button>
          <LinkButton href="/feedback/">{tFeedback("menu.mine")}</LinkButton>
        </div>
        <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} defaultArea="my" />
      </SettingsSection>
      <LicenseSection />
    </>
  )
}

function SecurityGroup() {
  const t = useT("settings")
  return (
    <>
      <AppLockSection />
      <div className="flex flex-wrap gap-2">
        <LinkButton href="/profile/account/">{t("security.account")}</LinkButton>
        <LinkButton href={`${getConfig().ID_URL}/security/`}>{t("security.openId")}</LinkButton>
      </div>
    </>
  )
}

function ProfileGroup() {
  const tProfile = useT("profile")
  return (
    <>
      <div className="flex flex-wrap gap-2">
        <StudentCardButton />
        <LinkButton href="/profile/account/">{tProfile("accountLink")}</LinkButton>
        <LinkButton href="/profile/face/">{tProfile("faceLink")}</LinkButton>
      </div>
      <ProfileSections />
    </>
  )
}

/** The sections of one Settings topic. */
function GroupBody({ group }: { group: SettingsGroupId }): ReactNode {
  const t = useT("settings")
  switch (group) {
    case "profile":
      return <ProfileGroup />
    case "appearance":
      return (
        <>
          <SettingsSection title={t("general.title")}>
            <GeneralSettings />
          </SettingsSection>
          <SettingsSection title={t("bottomNav.title")}>
            <BottomBarEditor />
          </SettingsSection>
        </>
      )
    case "notifications":
      return <NotificationsGroup />
    case "schedule":
      return (
        <>
          <SettingsSection title={t("calendar.title")}>
            <CalendarFeedPanel />
          </SettingsSection>
          <SettingsSection title={t("emisSync.title")}>
            <EmisSyncSection />
          </SettingsSection>
        </>
      )
    case "security":
      return <SecurityGroup />
    case "help":
      return <HelpGroup />
  }
}

/** One topic of Settings with a link back to the index. */
export function SettingsGroupPage({ group }: { group: SettingsGroupId }) {
  const t = useT("settings")
  return (
    <PageContainer title={t(`groups.${group}.title`)}>
      <Link
        href="/settings/"
        className="text-muted-foreground hover:text-foreground flex min-h-11 w-fit items-center gap-1 text-sm md:min-h-8"
      >
        <Icons.chevronLeft aria-hidden className="size-4 rtl:rotate-180" />
        {t("allSettings")}
      </Link>
      <div className="flex max-w-3xl flex-col gap-4">
        <GroupBody group={group} />
      </div>
    </PageContainer>
  )
}
