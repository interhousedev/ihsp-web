"use client"

import { useT } from "@ihsp/i18n"
import { buttonVariants } from "@ihsp/ui"
import type { LimitState } from "./limit-info"
import { showsMcpPrompt } from "./limit-info"

/**
 * Shown when the AI limit is reached: suggests connecting the user's own AI app through the MCP setup wizard.
 * `connectorsHref` is the absolute address of the wizard on the id app, because this module is shared by every app.
 */
export function LimitMcpPrompt({ limit, connectorsHref }: { limit: LimitState; connectorsHref: string }) {
  const t = useT("assistant.limitMcp")
  if (!showsMcpPrompt(limit)) return null
  return (
    <section role="status" className="bg-muted grid gap-2 rounded-card p-4">
      <h2 className="text-sm font-semibold">{t("title")}</h2>
      <p className="text-muted-foreground text-sm">{t("text")}</p>
      <a href={connectorsHref} rel="noopener noreferrer" className={buttonVariants({ className: "w-fit" })}>
        {t("action")}
      </a>
    </section>
  )
}
