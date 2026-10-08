"use client"

import type { Role } from "@ihsp/api"
import { useSession } from "@ihsp/auth"
import { NotificationSettingsForm } from "@ihsp/features-core"
import { useT } from "@ihsp/i18n"
import { PageContainer } from "@ihsp/ui"
import { GeneralSettings } from "./general-settings"
import { SettingsSection } from "./settings-section"
import { TelegramCard } from "./telegram-card"

/** The staff portal edits the teacher's notification settings: lesson links and the end-of-lesson prompt. */
const NOTIFICATION_ROLES: Role[] = ["teacher"]

/** Settings (STF-10): language and theme, the Telegram link, and the lesson links and end-of-lesson prompt. */
export function SettingsPage() {
  const t = useT("settings")
  const { session } = useSession()
  if (!session) return null

  return (
    <PageContainer title={t("title")} description={t("description")}>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <SettingsSection title={t("general.title")}>
            <GeneralSettings />
          </SettingsSection>
          <SettingsSection title={t("telegram.title")} description={t("telegram.description")}>
            <TelegramCard />
          </SettingsSection>
        </div>
        <SettingsSection title={t("notifications.title")} description={t("notifications.description")}>
          <NotificationSettingsForm roles={NOTIFICATION_ROLES} />
        </SettingsSection>
      </div>
    </PageContainer>
  )
}
