"use client"

import type { ToolCallView } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Badge, Button, Label, Textarea } from "@ihsp/ui"
import { IconAlertTriangle, IconCheck, IconX } from "@tabler/icons-react"
import { useId, useState } from "react"

const MAX_REASON_LENGTH = 500

type ApprovalCardProps = {
  call: ToolCallView
  busy: boolean
  onApprove: (callId: string) => void
  onReject: (callId: string, reason: string | undefined) => void
}

type Preview = NonNullable<ToolCallView["preview"]>

function PreviewFields({ preview }: { preview: Preview }) {
  const t = useT("assistant.approval")
  return (
    <dl className="grid gap-2 text-sm">
      {preview.fields.map((field) => (
        <div
          key={`${field.label}:${field.value}`}
          data-sensitive={field.sensitive ? "true" : "false"}
          className={
            field.sensitive
              ? "rounded-md border border-amber-500/60 bg-amber-100 px-2 py-1.5 dark:bg-amber-950/60"
              : "px-2 py-0.5"
          }
        >
          <dt className="text-muted-foreground flex items-center gap-1 text-xs">
            {field.sensitive ? <IconAlertTriangle className="size-3.5 text-amber-600" aria-hidden /> : null}
            {field.label}
            {field.sensitive ? <Badge variant="outline">{t("sensitive")}</Badge> : null}
          </dt>
          <dd className="font-medium break-words">{field.value}</dd>
        </div>
      ))}
    </dl>
  )
}

function PreviewItems({ items, open }: { items: string[]; open: boolean }) {
  const t = useT("assistant.approval")
  if (items.length === 0) return null
  return (
    <details open={open} className="text-sm">
      <summary className="text-muted-foreground min-h-8 cursor-pointer text-xs">
        {t("items", { count: items.length })}
      </summary>
      <ul className="mt-1 max-h-60 list-disc space-y-1 overflow-y-auto pl-5">
        {items.map((item, index) => (
          <li key={`${index}:${item}`} className="break-words">
            {item}
          </li>
        ))}
      </ul>
    </details>
  )
}

function StatusLine({ call }: { call: ToolCallView }) {
  const t = useT("assistant.approval")
  const format = useFormatters()
  switch (call.status) {
    case "running":
      return <Badge variant="secondary">{t("status.running")}</Badge>
    case "done":
      return (
        <Badge variant="secondary" className="gap-1">
          <IconCheck className="size-3" aria-hidden />
          {t("status.done")}
        </Badge>
      )
    case "failed":
      return <Badge variant="destructive">{t("status.failed")}</Badge>
    case "expired":
      return <Badge variant="outline">{t("status.expired")}</Badge>
    case "superseded":
      return <Badge variant="outline">{t("status.superseded")}</Badge>
    case "rejected":
      return (
        <span className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <IconX className="size-3" aria-hidden />
            {t("status.rejected")}
          </Badge>
          {call.reject_reason ? (
            <span className="text-muted-foreground text-xs">{t("reasonShown", { reason: call.reject_reason })}</span>
          ) : null}
        </span>
      )
    case "pending_approval":
      return (
        <span className="text-muted-foreground text-xs">
          {call.expires_at ? t("expiresAt", { time: format.dateTime(call.expires_at) }) : t("status.pending")}
        </span>
      )
  }
}

/** A write action of the assistant: what it will do, with sensitive fields highlighted, and Approve / Reject (AI-3, AI-11). */
export function ApprovalCard({ call, busy, onApprove, onReject }: ApprovalCardProps) {
  const t = useT("assistant.approval")
  const reasonId = useId()
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState("")
  const pending = call.status === "pending_approval"
  const preview = call.preview

  return (
    <section
      aria-label={preview?.title ?? call.note}
      data-status={call.status}
      className="bg-card flex flex-col gap-3 rounded-xl border p-3 shadow-xs"
    >
      <header className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="min-w-0 text-sm font-semibold break-words">{preview?.title ?? call.note}</h3>
        <StatusLine call={call} />
      </header>
      {preview ? (
        <>
          <PreviewFields preview={preview} />
          <PreviewItems items={preview.items} open={pending} />
        </>
      ) : null}
      {pending && !rejecting ? (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            className="min-h-11 flex-1 sm:flex-none"
            disabled={busy}
            onClick={() => onApprove(call.id)}
          >
            <IconCheck aria-hidden />
            {t("approve")}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="min-h-11 flex-1 sm:flex-none"
            disabled={busy}
            onClick={() => setRejecting(true)}
          >
            <IconX aria-hidden />
            {t("reject")}
          </Button>
        </div>
      ) : null}
      {pending && rejecting ? (
        <form
          className="flex flex-col gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            onReject(call.id, reason.trim() || undefined)
          }}
        >
          <Label htmlFor={reasonId}>{t("reasonLabel")}</Label>
          <Textarea
            id={reasonId}
            value={reason}
            maxLength={MAX_REASON_LENGTH}
            rows={2}
            placeholder={t("reasonPlaceholder")}
            onChange={(event) => setReason(event.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <Button type="submit" variant="destructive" className="min-h-11 flex-1 sm:flex-none" disabled={busy}>
              {t("sendRejection")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="min-h-11 flex-1 sm:flex-none"
              disabled={busy}
              onClick={() => {
                setRejecting(false)
                setReason("")
              }}
            >
              {t("cancel")}
            </Button>
          </div>
        </form>
      ) : null}
    </section>
  )
}
