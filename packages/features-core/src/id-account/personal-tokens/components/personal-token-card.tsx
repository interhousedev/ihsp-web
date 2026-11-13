"use client"

import { deleteIdPersonalToken, keys, type PersonalToken } from "@ihsp/api"
import { useFormatters } from "@ihsp/i18n"
import { Badge, Button, Card, CardContent, ConfirmDialog } from "@ihsp/ui"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { DocsLink } from "../../shared/components/docs-link"
import { ErrorAlert } from "../../shared/components/error-alert"
import { useClientConfig } from "../../shared/hooks/use-client-config"
import { useTr } from "../../shared/hooks/use-tr"

/** One personal token: prefix, scopes, expires and last used, and **Revoke** (immediate, with a confirmation). */
export function PersonalTokenCard({ token }: { token: PersonalToken }) {
  const t = useTr()
  const docsUrl = useClientConfig()?.docs.personal_tokens_url
  const format = useFormatters()
  const queryClient = useQueryClient()
  const [confirming, setConfirming] = useState(false)
  const [renderedAt] = useState(() => Date.now())
  const revoke = useMutation({
    mutationFn: () => deleteIdPersonalToken(token.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: keys.id.personalTokens() })
      setConfirming(false)
    },
  })
  const revoked = token.revoked_at !== null
  const expired = !revoked && new Date(token.expires_at).getTime() < renderedAt

  return (
    <Card>
      <CardContent className="grid gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="grid min-w-0 gap-1">
            <span className="font-medium break-words">{token.name}</span>
            <div className="flex flex-wrap items-center gap-2">
              <code className="text-muted-foreground text-xs">{token.prefix}…</code>
              {revoked ? <Badge variant="destructive">{t("personalTokens.revoked")}</Badge> : null}
              {expired ? <Badge variant="destructive">{t("personalTokens.expired")}</Badge> : null}
            </div>
          </div>
          {revoked ? null : (
            <Button type="button" variant="outline" className="h-11" onClick={() => setConfirming(true)}>
              {t("personalTokens.revoke")}
            </Button>
          )}
        </div>
        <ul className="flex flex-wrap gap-1" aria-label={t("personalTokens.scopes")}>
          {token.scopes.map((scope) => (
            <li key={scope}>
              <code className="bg-muted rounded px-1.5 py-0.5 text-xs">{scope}</code>
            </li>
          ))}
        </ul>
        <dl className="text-muted-foreground grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt>{t("personalTokens.lastUsed")}</dt>
          <dd>{token.last_used_at ? format.dateTime(token.last_used_at) : t("personalTokens.never")}</dd>
          <dt>{t("personalTokens.expires")}</dt>
          <dd>{format.dateTime(token.expires_at)}</dd>
        </dl>
        <DocsLink href={docsUrl}>{t("personalTokens.docs")}</DocsLink>
      </CardContent>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={t("personalTokens.revokeTitle", { name: token.name })}
        description={t("personalTokens.revokeDescription")}
        confirmLabel={t("personalTokens.revoke")}
        destructive
        loading={revoke.isPending}
        onConfirm={() => revoke.mutate()}
      >
        <ErrorAlert error={revoke.error} />
      </ConfirmDialog>
    </Card>
  )
}
