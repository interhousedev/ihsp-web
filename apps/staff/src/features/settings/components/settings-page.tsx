"use client"

import type { Role } from "@ihsp/api"
import { useSession } from "@ihsp/auth"
import { deleteStaffMePhoto, getStaffMeContacts, keys, putStaffMeContacts, putStaffMePhoto } from "@ihsp/api"
import { NotificationSettingsForm, PhotoField, TeacherContactsForm } from "@ihsp/features-core"
import { AppLockSection } from "@ihsp/features-core/pwa/lock"
import { useT } from "@ihsp/i18n"
import { PageContainer } from "@ihsp/ui"
import { useState } from "react"
import { GeneralSettings } from "./general-settings"
import { SettingsSection } from "./settings-section"
import { TelegramCard } from "./telegram-card"
import { WorkOffTemplates } from "./work-off-templates"

/** The staff portal edits the teacher's notification settings: lesson links and the end-of-lesson prompt. */
const NOTIFICATION_ROLES: Role[] = ["teacher"]

/** Settings (STF-10): language and theme, the Telegram link, and the lesson links and end-of-lesson prompt. */
export function SettingsPage() {
  const t = useT("settings")
  const { session } = useSession()
  const [photoUrl, setPhotoUrl] = useState<string | null | undefined>(undefined)
  if (!session) return null
  const { user } = session
  const name = [user.last_name, user.first_name, user.middle_name].filter(Boolean).join(" ")

  return (
    <PageContainer title={t("title")}>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <SettingsSection title={t("general.title")}>
            <GeneralSettings />
          </SettingsSection>
          <SettingsSection title={t("telegram.title")}>
            <TelegramCard />
          </SettingsSection>
          <SettingsSection title={t("photo.title")} description={t("photo.description")}>
            <PhotoField
              name={name}
              photoUrl={photoUrl === undefined ? user.photo_url : photoUrl}
              onUpload={async (file) => setPhotoUrl((await putStaffMePhoto(file)).photo_url)}
              onRemove={async () => setPhotoUrl((await deleteStaffMePhoto()).photo_url)}
            />
          </SettingsSection>
          <SettingsSection title={t("contacts.title")} description={t("contacts.description")}>
            <TeacherContactsForm
              queryKey={keys.staff.contacts()}
              load={(signal) => getStaffMeContacts({ signal })}
              save={putStaffMeContacts}
            />
          </SettingsSection>
          <SettingsSection title={t("workOffs.title")}>
            <WorkOffTemplates />
          </SettingsSection>
          <AppLockSection />
        </div>
        <SettingsSection title={t("notifications.title")}>
          <NotificationSettingsForm roles={NOTIFICATION_ROLES} showPush={false} />
        </SettingsSection>
      </div>
    </PageContainer>
  )
}
