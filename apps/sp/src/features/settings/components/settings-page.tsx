"use client"

import { getMeProfileQuery } from "@ihsp/api"
import { useSession } from "@ihsp/auth"
import { NotificationSettingsForm } from "@ihsp/features-core"
import { useT } from "@ihsp/i18n"
import { PageContainer } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { getConfig } from "@ihsp/config"
import { CalendarFeedPanel } from "../../calendar-feed/components/calendar-feed-panel"
import { ProfileSections } from "../../profile/components/profile-page"
import { LinkButton } from "../../shared/components/link-button"
import { AppLockSection } from "../../pwa/components/app-lock-section"
import { getServiceWorkerRegistration } from "../../pwa/utils/service-worker-registration"
import { BottomBarEditor } from "./bottom-bar-editor"
import { EmisSyncSection } from "./emis-sync-section"
import { GeneralSettings } from "./general-settings"
import { SettingsSection } from "./settings-section"
import { TelegramHint } from "./telegram-hint"

/** Settings (WEB-29, UF-WEB-17): language and theme, notifications (as BOT-13), the calendar feed. */
export function SettingsPage() {
  const t = useT("settings")
  const tProfile = useT("profile")
  const { session } = useSession()
  const profile = useQuery(getMeProfileQuery())
  if (!session) return null
  const isHeadStudent = profile.data?.head_student?.id === session.user.id

  return (
    <PageContainer title={t("title")}>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <SettingsSection title={t("general.title")}>
            <GeneralSettings />
          </SettingsSection>
          <SettingsSection title={t("bottomNav.title")}>
            <BottomBarEditor />
          </SettingsSection>
          <SettingsSection title={t("calendar.title")}>
            <CalendarFeedPanel />
          </SettingsSection>
          <SettingsSection title={t("emisSync.title")}>
            <EmisSyncSection />
          </SettingsSection>
          <AppLockSection />
        </div>
        <SettingsSection title={t("notifications.title")}>
          <TelegramHint />
          <NotificationSettingsForm
            roles={session.user.roles}
            isHeadStudent={isHeadStudent}
            getPushRegistration={getServiceWorkerRegistration}
          />
        </SettingsSection>
      </div>
      <div id="profile" className="mt-4 flex scroll-mt-20 flex-col gap-4">
        <h2 className="text-lg font-semibold">{tProfile("title")}</h2>
        <ProfileSections />
        <div>
          <LinkButton href={`${getConfig().ID_URL}/security/`}>{tProfile("security")}</LinkButton>
        </div>
      </div>
    </PageContainer>
  )
}
