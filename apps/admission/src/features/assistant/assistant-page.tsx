"use client"

import { getConfig } from "@ihsp/config"
import { AssistantWorkspace } from "@ihsp/features-core"
import { useT } from "@ihsp/i18n"
import { AdmissionShell } from "../shell/components/admission-shell"
import { AssistantConsentCard } from "./consent-card"

/**
 * `/assistant/` and `/assistant/chat/?id=`: the shared assistant workspace (the one of my.iht) for applicants, with the
 * admission skills (`X-IHSP-App`), OpenUI blocks and the admission consent card.
 */
export function AssistantPage() {
  const t = useT("assistant.page")
  const app = useT("app")
  return (
    <AdmissionShell>
      <div className="h-[calc(100dvh-var(--shell-top-reserve,0px)-var(--bottom-nav-height,0px)-var(--safe-bottom,0px))] min-h-0 md:h-[calc(100dvh-var(--shell-top-reserve,0px))]">
        <h1 className="sr-only">{t("title")}</h1>
        <AssistantWorkspace
          assistant="admission"
          basePath="/assistant"
          connectorsHref={`${getConfig().ID_URL}/connectors/new/`}
          appName={app("name")}
          consentCard={({ retry }) => <AssistantConsentCard retry={retry} />}
        />
      </div>
    </AdmissionShell>
  )
}
