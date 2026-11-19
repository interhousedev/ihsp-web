"use client"

import { useErrorMessage, useFormatters, useT } from "@ihsp/i18n"
import { Button, CopyButton, Input, Label, ResponsiveDialog, StateView, Switch } from "@ihsp/ui"
import { useState, type FormEvent } from "react"
import {
  INVITE_AUDIENCES,
  reviewUrl,
  TTL_DEFAULT,
  TTL_MAX,
  TTL_MIN,
  useCreateInvite,
  useEssayInvites,
  useRevokeInvite,
  type EssayInvite,
  type InviteAudience,
} from "../api"

const CONTROL =
  "border-input bg-background h-11 w-full rounded-lg border px-2.5 text-sm md:h-9 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"

function InviteRow({ invite, onRevoke, pending }: { invite: EssayInvite; onRevoke: () => void; pending: boolean }) {
  const t = useT("essayInvites")
  const fmt = useFormatters()
  return (
    <li className="border-hairline rounded-card flex flex-wrap items-center justify-between gap-2 border p-3 text-sm">
      <div className="flex min-w-0 flex-col">
        <span className="font-medium">
          {t(`audience.${invite.audience}`)} · {invite.can_comment ? t("canComment") : t("readOnly")}
        </span>
        <span className="text-muted-foreground">
          {t("expires", { time: fmt.dateTime(new Date(invite.expires_at)) })}
          {invite.comment_count === undefined ? "" : ` · ${t("comments", { count: invite.comment_count })}`}
        </span>
      </div>
      <Button type="button" variant="outline" size="sm" disabled={pending} onClick={onRevoke}>
        {t("revoke")}
      </Button>
    </li>
  )
}

/** Review links of an essay: make one, copy it (shown once), see the active ones and revoke them. */
export function ShareDialog({
  essayId,
  open,
  onOpenChange,
}: {
  essayId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const t = useT("essayInvites")
  const errorMessage = useErrorMessage()
  const [audience, setAudience] = useState<InviteAudience>("classmate")
  const [canComment, setCanComment] = useState(true)
  const [ttl, setTtl] = useState(String(TTL_DEFAULT))
  const [link, setLink] = useState<string | null>(null)
  const invites = useEssayInvites(essayId, open)
  const create = useCreateInvite(essayId)
  const revoke = useRevokeInvite(essayId)
  const days = Number(ttl)
  const ttlValid = Number.isInteger(days) && days >= TTL_MIN && days <= TTL_MAX
  const active = (invites.data?.items ?? []).filter((invite) => invite.active)

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!ttlValid) return
    create.mutate(
      { audience, can_comment: canComment, ttl_days: days },
      { onSuccess: (created) => setLink(reviewUrl(created.token)) },
    )
  }

  function change(next: boolean) {
    if (!next) setLink(null)
    onOpenChange(next)
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={change} title={t("title")} description={t("description")}>
      <div className="flex flex-col gap-6">
        <form onSubmit={submit} noValidate className="flex flex-col gap-3" aria-label={t("formLabel")}>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="invite-audience">{t("audienceLabel")}</Label>
            <select
              id="invite-audience"
              className={CONTROL}
              value={audience}
              onChange={(event) => setAudience(event.target.value as InviteAudience)}
            >
              {INVITE_AUDIENCES.map((key) => (
                <option key={key} value={key}>
                  {t(`audience.${key}`)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="invite-comment">{t("canComment")}</Label>
            <Switch id="invite-comment" checked={canComment} onCheckedChange={setCanComment} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="invite-ttl">{t("ttlLabel")}</Label>
            <Input
              id="invite-ttl"
              type="number"
              inputMode="numeric"
              min={TTL_MIN}
              max={TTL_MAX}
              value={ttl ?? ""}
              aria-invalid={!ttlValid}
              onChange={(event) => setTtl(event.target.value)}
            />
            {ttlValid ? null : (
              <p role="alert" className="text-destructive text-sm">
                {t("ttlInvalid", { min: TTL_MIN, max: TTL_MAX })}
              </p>
            )}
          </div>
          {create.isError ? (
            <p role="alert" className="text-destructive text-sm">
              {errorMessage(create.error)}
            </p>
          ) : null}
          <Button type="submit" className="self-start" disabled={create.isPending || !ttlValid}>
            {t("create")}
          </Button>
        </form>
        {link ? (
          <section aria-label={t("linkLabel")} className="bg-muted flex flex-col gap-2 rounded-lg p-3">
            <p className="text-sm font-medium">{t("linkOnce")}</p>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                aria-label={t("linkLabel")}
                value={link}
                onFocus={(event) => event.currentTarget.select()}
              />
              <CopyButton value={link} label={t("copy")} />
            </div>
          </section>
        ) : null}
        <section aria-label={t("activeTitle")} className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold">{t("activeTitle")}</h3>
          {invites.isLoading ? (
            <StateView state="loading" rows={2} />
          ) : invites.isError ? (
            <StateView state="error" error={invites.error} onRetry={() => void invites.refetch()} />
          ) : active.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t("none")}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {active.map((invite) => (
                <InviteRow
                  key={invite.id}
                  invite={invite}
                  pending={revoke.isPending}
                  onRevoke={() => revoke.mutate(invite.id)}
                />
              ))}
            </ul>
          )}
          {revoke.isError ? (
            <p role="alert" className="text-destructive text-sm">
              {errorMessage(revoke.error)}
            </p>
          ) : null}
        </section>
      </div>
    </ResponsiveDialog>
  )
}
