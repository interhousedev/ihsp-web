"use client"

import { FlowCard } from "../../shared/components/flow-card"
import { LinkButton } from "../../shared/components/link-button"
import { useQueryParam } from "../../shared/hooks/use-query-param"
import { useTr } from "../../shared/hooks/use-tr"

const ERROR_CODE = /^[a-z_]{1,64}$/

/**
 * `/error/`: Hydra's `urls.error`, for errors it cannot send to a client's redirect URI. Anyone can craft this link,
 * so the query only selects fixed text: its description and hint are never shown.
 */
export function OAuthErrorPage() {
  const t = useTr()
  const error = useQueryParam("error")
  const details = `${useQueryParam("error_description") ?? ""} ${useQueryParam("error_hint") ?? ""}`
  const code = error && ERROR_CODE.test(error) ? error : null
  const description = details.includes("redirect_uri") ? t("oauthError.redirectMismatch") : t("oauthError.description")
  return (
    <FlowCard title={t("oauthError.title")} description={description}>
      {code ? <p className="text-muted-foreground text-sm">{t("oauthError.code", { code })}</p> : null}
      <LinkButton href="/connectors/">{t("oauthError.action")}</LinkButton>
    </FlowCard>
  )
}
