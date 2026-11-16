"use client"

import { useErrorMessage, useFormatters, useT } from "@ihsp/i18n"
import { Button, ConfirmDialog, Icons, Pill, StateView } from "@ihsp/ui"
import { useState } from "react"
import { useGuestLinks, useRevokeGuestLink, useRotateGuestLink, type CreatedGuestLink, type GuestLink } from "../api"
import { GuestLinkResultDialog } from "./guest-link-result-dialog"

type Pending = { kind: "revoke" | "rotate"; link: GuestLink }

function linkState(link: GuestLink): "revoked" | "expired" | "active" {
  if (link.revoked_at) return "revoked"
  return new Date(link.expires_at).getTime() < Date.now() ? "expired" : "active"
}

/** The student's guest links: state, use, revoke and rotate; a rotated token is shown once, like a new one. */
export function GuestLinkManager() {
  const t = useT("help")
  const fmt = useFormatters()
  const errorMessage = useErrorMessage()
  const links = useGuestLinks()
  const revoke = useRevokeGuestLink()
  const rotate = useRotateGuestLink()
  const [pending, setPending] = useState<Pending | null>(null)
  const [created, setCreated] = useState<CreatedGuestLink | null>(null)
  const [error, setError] = useState<unknown>(null)

  async function confirm() {
    if (!pending) return
    setError(null)
    try {
      if (pending.kind === "revoke") await revoke.mutateAsync(pending.link.id)
      else setCreated(await rotate.mutateAsync(pending.link.id))
      setPending(null)
    } catch (e) {
      setError(e)
    }
  }

  if (links.isPending) return <StateView state="loading" rows={2} />
  if (links.isError) return <StateView state="error" error={links.error} onRetry={() => links.refetch()} />
  if (links.data.items.length === 0)
    return <StateView state="empty" emptyText={t("link.empty")} icon={<Icons.share aria-hidden />} />

  return (
    <>
      <ul className="flex flex-col gap-2">
        {links.data.items.map((link) => {
          const state = linkState(link)
          return (
            <li key={link.id} className="border-hairline flex flex-wrap items-center gap-3 rounded-card border p-3">
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate font-medium">{link.label ?? `${link.token_prefix}…`}</span>
                  <Pill tone={state === "active" ? "success" : "neutral"}>{t(`link.state.${state}`)}</Pill>
                  {link.claimed ? <Pill tone="primary">{t("link.claimed")}</Pill> : null}
                </div>
                <p className="text-muted-foreground text-xs">
                  {t("link.meta", {
                    expires: fmt.dateTime(new Date(link.expires_at)),
                    used: link.sessions_used,
                    max: link.max_sessions,
                  })}
                </p>
              </div>
              {state === "active" ? (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPending({ kind: "rotate", link })}>
                    {t("link.rotate")}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPending({ kind: "revoke", link })}>
                    {t("link.revoke")}
                  </Button>
                </div>
              ) : null}
            </li>
          )
        })}
      </ul>
      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPending(null)
            setError(null)
          }
        }}
        title={pending ? t(`link.${pending.kind}Title`) : ""}
        description={pending ? t(`link.${pending.kind}Text`) : undefined}
        confirmLabel={pending ? t(`link.${pending.kind}`) : undefined}
        destructive
        loading={revoke.isPending || rotate.isPending}
        onConfirm={confirm}
      >
        {error ? (
          <p role="alert" className="text-destructive text-sm">
            {errorMessage(error)}
          </p>
        ) : null}
      </ConfirmDialog>
      <GuestLinkResultDialog created={created} onClose={() => setCreated(null)} />
    </>
  )
}
