"use client"

import type { Role } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { PushToggle, type GetRegistration } from "../push"
import { AlertsSection } from "./alerts-section"
import { LessonsSection } from "./lessons-section"
import { MarksSection } from "./marks-section"
import { PreferenceSwitch } from "./preference-switch"
import { useUpdatePreferences, usePreferences } from "./use-update-preferences"

export type NotificationSettingsFormProps = {
  /** Sections follow the roles: students get marks and alerts, teachers get lesson settings. */
  roles: readonly Role[]
  /** Head students also get the lesson links lead time (UF-BOT-06). */
  isHeadStudent?: boolean
  /**
   * Shows "Push notifications on this device" (default). Apps without a service worker (the staff and admin portals)
   * pass `false` instead of showing a switch that cannot be used there.
   */
  showPush?: boolean
  /** The app's service worker registration, handed to the push switch (apps/sp: `getServiceWorkerRegistration`). */
  getPushRegistration?: GetRegistration
}

/**
 * Notification settings of the account (BOT-13, UF-WEB-17): every change is saved at once with
 * `PATCH /v1/id/me/preferences` and shows in the next sync.
 */
export function NotificationSettingsForm({
  roles,
  isHeadStudent = false,
  showPush = true,
  getPushRegistration,
}: NotificationSettingsFormProps) {
  const t = useT("notificationSettings")
  const errorMessage = useErrorMessage()
  const preferences = usePreferences()
  const update = useUpdatePreferences()

  if (!preferences) return null
  const isStudent = roles.includes("student")
  const isTeacher = roles.includes("teacher")
  const save = update.mutate

  return (
    <form className="flex flex-col gap-6" onSubmit={(event) => event.preventDefault()}>
      {isStudent ? <MarksSection preferences={preferences} onChange={save} /> : null}
      {isStudent ? <AlertsSection preferences={preferences} onChange={save} /> : null}
      {isTeacher || isHeadStudent ? (
        <LessonsSection preferences={preferences} showPrompt={isTeacher} onChange={save} />
      ) : null}
      {isStudent || isTeacher ? (
        <section aria-labelledby="ns-mail" className="flex flex-col gap-2">
          <h3 id="ns-mail" className="text-base font-semibold">
            {t("mail.title")}
          </h3>
          <PreferenceSwitch
            label={t("mail.forward")}
            description={t("mail.forwardHint")}
            checked={preferences.mail_forward_to_telegram}
            onCheckedChange={(value) => save({ mail_forward_to_telegram: value })}
          />
        </section>
      ) : null}
      {showPush ? (
        <section aria-labelledby="ns-push" className="flex flex-col gap-2">
          <h3 id="ns-push" className="text-base font-semibold">
            {t("push.title")}
          </h3>
          <PushToggle getRegistration={getPushRegistration} />
        </section>
      ) : null}
      <p role="status" aria-live="polite" className="text-muted-foreground min-h-5 text-xs">
        {update.isPending ? t("saving") : null}
        {update.isSuccess ? t("saved") : null}
        {update.isError ? <span className="text-destructive">{errorMessage(update.error)}</span> : null}
      </p>
    </form>
  )
}
