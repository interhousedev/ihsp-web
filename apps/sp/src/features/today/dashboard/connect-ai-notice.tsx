"use client"

import { getConfig } from "@ihsp/config"
import { usePreferences, useUpdatePreferences } from "@ihsp/features-core"
import { useT } from "@ihsp/i18n"
import { Button, buttonVariants } from "@ihsp/ui"
import { useAlerts } from "../hooks/use-today"

/** The onboarding dismiss list (`onboarding_dismissed`) holds this id once the student dismissed the notice. */
export const CONNECT_AI_DISMISS_ID = "connect_ai"

/**
 * MCP-5: a student without a connected AI client is pointed to the setup wizard. The alert comes from the backend only
 * while the student has no client and the chat AI is not revoked; a dismiss is kept in the preferences.
 */
export function ConnectAiNotice() {
  const t = useT("today.connectAi")
  const app = useT("app")
  const alerts = useAlerts()
  const preferences = usePreferences()
  const update = useUpdatePreferences()

  const alert = (alerts.data ?? []).find((item) => item.kind === "connect_ai")
  if (!preferences || !alert) return null
  const dismissed = preferences.onboarding_dismissed
  if (dismissed.includes(CONNECT_AI_DISMISS_ID)) return null

  return (
    <section role="status" className="bg-muted mb-3 grid gap-2 rounded-card p-4">
      <h2 className="text-sm font-semibold">{t("title", { app: app("name") })}</h2>
      <p className="text-muted-foreground text-sm">{t("text")}</p>
      <div className="flex flex-wrap gap-2">
        <a
          href={alert.action_url ?? `${getConfig().ID_URL}/connectors/new/`}
          rel="noopener noreferrer"
          className={buttonVariants({ className: "w-fit" })}
        >
          {t("action")}
        </a>
        <Button
          type="button"
          variant="ghost"
          disabled={update.isPending}
          onClick={() => update.mutate({ onboarding_dismissed: [...new Set([...dismissed, CONNECT_AI_DISMISS_ID])] })}
        >
          {t("dismiss")}
        </Button>
      </div>
    </section>
  )
}
