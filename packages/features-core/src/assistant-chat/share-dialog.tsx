"use client"

import { getMeLinksQuery, postLinkRevoke, postShare, type LinkItem, type ShareCreateBody } from "@ihsp/api"
import { useErrorMessage, useFormatters, useT } from "@ihsp/i18n"
import {
  Alert,
  AlertDescription,
  Badge,
  Button,
  ConfirmDialog,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  StateView,
} from "@ihsp/ui"
import { IconAlertTriangle } from "@ihsp/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useId, useState } from "react"
import { toast } from "sonner"
import { CopyLinkButton } from "./copy-link-button"

export type ShareDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  kind: "chat" | "flashcard_set"
  /** Id of the chat or set; the existing shares are listed with `GET /v1/me/links?target_id=`. */
  targetId: string
}

/** End of the chosen day in Tashkent (UTC+5) as an ISO datetime. */
export function expiryToIso(date: string): string {
  return `${date}T23:59:59+05:00`
}

function tomorrowIso(): string {
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
  return tomorrow.toISOString().slice(0, 10)
}

async function copyToClipboard(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value)
    return true
  } catch {
    return false
  }
}

type LinkRowProps = { link: LinkItem; kind: ShareDialogProps["kind"]; onRevoke: (link: LinkItem) => void }

function LinkRow({ link, kind, onRevoke }: LinkRowProps) {
  const t = useT("assistant.share")
  const format = useFormatters()
  return (
    <li className="flex flex-col gap-2 rounded-lg border p-2 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        {kind === "chat" && link.share_mode ? (
          <Badge variant="secondary">{link.share_mode === "live" ? t("modeLive") : t("modeSnapshot")}</Badge>
        ) : null}
        <span className="text-muted-foreground text-xs">
          {t("hits", { count: link.hits })}
          {link.expires_at ? ` · ${t("expires", { date: format.date(link.expires_at) })}` : ""}
        </span>
      </div>
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        className="break-all underline-offset-2 hover:underline"
      >
        {link.url}
      </a>
      <div className="flex flex-wrap gap-2">
        <CopyLinkButton value={link.url} label={t("copy")} />
        <Button type="button" variant="outline" className="min-h-11" onClick={() => onRevoke(link)}>
          {t("revoke")}
        </Button>
      </div>
    </li>
  )
}

/** Creates public links for a chat (Snapshot or Live) or a flash card set, lists the existing ones (SHR-1–SHR-8). */
export function ShareDialog({ open, onOpenChange, kind, targetId }: ShareDialogProps) {
  const t = useT("assistant.share")
  const errorMessage = useErrorMessage()
  const queryClient = useQueryClient()
  const switchId = useId()
  const expiryId = useId()
  const [live, setLive] = useState(false)
  const [expiry, setExpiry] = useState("")
  const [created, setCreated] = useState<LinkItem[]>([])
  const [revoking, setRevoking] = useState<LinkItem | null>(null)

  const links = useQuery({ ...getMeLinksQuery({ kind, target_id: targetId, limit: 100 }), enabled: open })

  const create = useMutation({
    mutationFn: (body: ShareCreateBody) => postShare(body),
    onSuccess: async (link) => {
      setCreated((current) => [link, ...current])
      void queryClient.invalidateQueries({ queryKey: ["me", "links"] })
      void queryClient.invalidateQueries({ queryKey: ["ai", "chats"] })
      const copied = await copyToClipboard(link.url)
      toast.success(copied ? t("createdCopied") : t("created"))
    },
  })

  const revoke = useMutation({
    mutationFn: (link: LinkItem) => postLinkRevoke(link.id),
    onSuccess: (link) => {
      setCreated((current) => current.filter((item) => item.id !== link.id))
      void queryClient.invalidateQueries({ queryKey: ["me", "links"] })
      void queryClient.invalidateQueries({ queryKey: ["ai", "chats"] })
      setRevoking(null)
      toast.success(t("revoked"))
    },
  })

  const existing = (links.data?.items ?? []).filter((link) => link.revoked_at === null && !link.disabled)
  const known = new Set<string>()
  const rows = [...created, ...existing].filter((link) => {
    if (known.has(link.id) || link.revoked_at !== null) return false
    known.add(link.id)
    return true
  })

  function createLink() {
    const body: ShareCreateBody = { kind, target_id: targetId }
    if (kind === "chat") body.share_mode = live ? "live" : "snapshot"
    if (expiry) body.expires_at = expiryToIso(expiry)
    create.mutate(body)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{kind === "chat" ? t("titleChat") : t("titleSet")}</DialogTitle>
            <DialogDescription>{kind === "chat" ? t("descriptionChat") : t("descriptionSet")}</DialogDescription>
          </DialogHeader>

          {kind === "chat" ? (
            <Alert>
              <IconAlertTriangle aria-hidden />
              <AlertDescription>{t("warning")}</AlertDescription>
            </Alert>
          ) : null}

          {kind === "chat" ? (
            <div className="flex items-start gap-3">
              <input
                id={switchId}
                type="checkbox"
                role="switch"
                aria-checked={live}
                className="mt-0.5 size-5 shrink-0"
                checked={live}
                onChange={(event) => setLive(event.target.checked)}
              />
              <div className="flex flex-col">
                <Label htmlFor={switchId} className="min-h-6 text-sm font-medium">
                  {t("includeFuture")}
                </Label>
                <span className="text-muted-foreground text-xs" data-testid="share-mode-hint">
                  {live ? t("liveHint") : t("snapshotHint")}
                </span>
              </div>
            </div>
          ) : null}

          <div className="flex flex-col gap-1">
            <Label htmlFor={expiryId}>{t("expiryLabel")}</Label>
            <Input
              id={expiryId}
              type="date"
              min={tomorrowIso()}
              value={expiry}
              className="min-h-11"
              onChange={(event) => setExpiry(event.target.value)}
            />
          </div>

          {create.isError ? (
            <p role="alert" className="text-destructive text-sm">
              {errorMessage(create.error)}
            </p>
          ) : null}
          <Button type="button" className="min-h-11" disabled={create.isPending} onClick={createLink}>
            {t("create")}
          </Button>

          <section aria-label={t("existing")} className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold">{t("existing")}</h3>
            {links.isPending ? <StateView state="loading" rows={1} /> : null}
            {links.isError ? (
              <StateView state="error" error={links.error} onRetry={() => void links.refetch()} />
            ) : null}
            {!links.isPending && !links.isError && rows.length === 0 ? (
              <p className="text-muted-foreground text-sm">{t("noLinks")}</p>
            ) : null}
            {rows.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {rows.map((link) => (
                  <LinkRow key={link.id} link={link} kind={kind} onRevoke={setRevoking} />
                ))}
              </ul>
            ) : null}
          </section>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={revoking !== null}
        onOpenChange={(next) => {
          if (!next) setRevoking(null)
        }}
        title={t("revokeTitle")}
        description={t("revokeDescription")}
        confirmLabel={t("revoke")}
        destructive
        loading={revoke.isPending}
        onConfirm={() => {
          if (revoking) revoke.mutate(revoking)
        }}
      />
    </>
  )
}
