"use client"

import { getMeProfileQuery } from "@ihsp/api"
import { useSession } from "@ihsp/auth"
import { NotificationSettingsForm } from "@ihsp/features-core"
import { useT } from "@ihsp/i18n"
import { PageContainer } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { CalendarFeedPanel } from "../../calendar-feed/components/calendar-feed-panel"
import { AppLockSection } from "../../pwa/components/app-lock-section"
import { getServiceWorkerRegistration } from "../../pwa/utils/service-worker-registration"
import { GeneralSettings } from "./general-settings"
import { SettingsSection } from "./settings-section"
import { TelegramHint } from "./telegram-hint"
import { TodayCardsEditor } from "./today-cards-editor"

/** Settings (WEB-29, UF-WEB-17): language and theme, notifications (as BOT-13), Today cards and the calendar feed. */
export function SettingsPage() {
  const t = useT("settings")
  const { session } = useSession()
  const profile = useQuery(getMeProfileQuery())
  if (!session) return null
  const isHeadStudent = profile.data?.head_student?.id === session.user.id

  return (
    <PageContainer title={t("title")} description={t("description")}>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <SettingsSection title={t("general.title")}>
            <GeneralSettings />
          </SettingsSection>
          <SettingsSection title={t("today.title")} description={t("today.description")}>
            <TodayCardsEditor />
          </SettingsSection>
          <SettingsSection title={t("calendar.title")}>
            <CalendarFeedPanel />
          </SettingsSection>
          <AppLockSection />
        </div>
        <SettingsSection title={t("notifications.title")} description={t("notifications.description")}>
          <TelegramHint />
          <NotificationSettingsForm
            roles={session.user.roles}
            isHeadStudent={isHeadStudent}
            getPushRegistration={getServiceWorkerRegistration}
          />
        </SettingsSection>
      </div>
    </PageContainer>
  )
}
