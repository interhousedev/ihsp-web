"use client"

import {
  keys,
  patchAdminBroadcast,
  postAdminBroadcastCancel,
  postAdminBroadcastPreview,
  postAdminBroadcasts,
  postAdminBroadcastSend,
  type BroadcastItem,
} from "@ihsp/api"
import { FileUploadButton } from "@ihsp/features-core"
import { useFormatters, useT } from "@ihsp/i18n"
import { Alert, AlertDescription, Button, ConfirmDialog, Input, PageContainer } from "@ihsp/ui"
import { IconX } from "@ihsp/ui"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { BackLink } from "../../shared/components/back-link"
import { LabeledField } from "../../shared/components/labeled-field"
import { StatusBadge } from "../../shared/components/status-badge"
import { useAdminMutation } from "../../shared/hooks/use-admin-mutation"
import { TOUCH } from "../../shared/utils/touch"
import { useAudienceCount } from "../hooks/use-audience-count"
import {
  broadcastToForm,
  emptyBroadcastForm,
  formToInput,
  isBroadcastValid,
  isEditable,
  TITLE_MAX,
  type BroadcastForm,
} from "../utils/broadcast-form"
import { AudienceBuilder } from "./audience-builder"
import { BroadcastPreview } from "./broadcast-preview"
import { BroadcastStats } from "./broadcast-stats"
import { ScheduleDialog } from "./schedule-dialog"
import { TextEditor } from "./text-editor"

const INVALIDATE = [keys.admin.broadcasts.all(), keys.admin.dashboard()] as const

/**
 * Broadcast editor (ADM-11, UF-ADM-08): title, formatted text, media, audience with a live recipient count, a preview
 * to the admin's own Telegram, and send now or schedule. Only drafts and scheduled broadcasts can be changed.
 * `item` null starts a new draft; the first save creates it.
 */
export function BroadcastEditor({ item }: { item: BroadcastItem | null }) {
  const t = useT("broadcasts.editor")
  const f = useFormatters()
  const router = useRouter()
  const [form, setForm] = useState<BroadcastForm>(() => (item ? broadcastToForm(item) : emptyBroadcastForm()))
  const [sendOpen, setSendOpen] = useState(false)
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const count = useAudienceCount(form.audience)

  const editable = isEditable(item)
  const valid = isBroadcastValid(form)

  /** Create the draft on the first save, then keep patching it. */
  async function persist(): Promise<BroadcastItem> {
    const body = formToInput(form)
    return item ? patchAdminBroadcast(item.id, body) : postAdminBroadcasts(body)
  }
  function open(id: string) {
    router.replace(`/broadcasts/edit/?id=${encodeURIComponent(id)}`)
  }

  const save = useAdminMutation({
    mutationFn: persist,
    invalidate: INVALIDATE,
    success: t("saved"),
    onSuccess: (saved) => {
      if (!item) open(saved.id)
    },
  })
  const preview = useAdminMutation({
    mutationFn: async () => {
      const saved = await persist()
      await postAdminBroadcastPreview(saved.id)
      return saved
    },
    invalidate: INVALIDATE,
    success: t("previewSent"),
    onSuccess: (saved) => {
      if (!item) open(saved.id)
    },
  })
  const send = useAdminMutation({
    mutationFn: async (scheduledAt: string | undefined) => {
      const saved = await persist()
      return postAdminBroadcastSend(saved.id, scheduledAt ? { scheduled_at: scheduledAt } : {})
    },
    invalidate: INVALIDATE,
    success: (sent) => (sent.status === "scheduled" ? t("scheduledDone") : t("sentDone")),
    onSuccess: () => {
      setSendOpen(false)
      setScheduleOpen(false)
      router.push("/broadcasts/")
    },
  })
  const cancel = useAdminMutation({
    mutationFn: () => postAdminBroadcastCancel(item?.id ?? ""),
    invalidate: INVALIDATE,
    success: t("cancelledDone"),
    onSuccess: () => setCancelOpen(false),
  })

  const busy = save.isPending || preview.isPending || send.isPending
  const title = item ? item.title : t("newTitle")

  return (
    <PageContainer title={title} actions={<BackLink href="/broadcasts/" label={t("back")} />}>
      {item ? (
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <StatusBadge status={item.status} />
          {item.scheduled_at ? <span>{t("scheduledFor", { date: f.dateTime(item.scheduled_at) })}</span> : null}
          {item.created_via === "assistant" ? (
            <span className="text-muted-foreground">{t("createdByAssistant")}</span>
          ) : null}
        </div>
      ) : null}
      {item?.stats ? <BroadcastStats stats={item.stats} /> : null}
      {!editable ? (
        <Alert>
          <AlertDescription>{t("readOnly")}</AlertDescription>
        </Alert>
      ) : null}
      {item?.created_via === "assistant" && item.status === "draft" ? (
        <Alert>
          <AlertDescription>{t("assistantDraft")}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <form
          className="flex flex-col gap-5"
          onSubmit={(event) => {
            event.preventDefault()
            if (valid && editable) save.mutate()
          }}
        >
          <LabeledField label={t("titleLabel")} htmlFor="broadcast-title" required>
            <Input
              id="broadcast-title"
              value={form.title}
              maxLength={TITLE_MAX}
              disabled={!editable}
              className={TOUCH}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
            />
          </LabeledField>
          <LabeledField label={t("textLabel")} htmlFor="broadcast-text" required>
            <TextEditor
              id="broadcast-text"
              value={form.text}
              disabled={!editable}
              onChange={(text) => setForm({ ...form, text })}
            />
          </LabeledField>
          <section className="flex flex-col gap-2">
            <h3 className="text-sm font-medium">{t("media")}</h3>
            {form.media.length > 0 ? (
              <ul className="flex flex-col gap-1">
                {form.media.map((file) => (
                  <li
                    key={file.id}
                    className="flex items-center justify-between gap-2 rounded-md border px-3 py-1 text-sm"
                  >
                    <span className="truncate">{file.name}</span>
                    {editable ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-11 md:size-8"
                        aria-label={t("removeMedia", { name: file.name })}
                        onClick={() => setForm({ ...form, media: form.media.filter((entry) => entry.id !== file.id) })}
                      >
                        <IconX aria-hidden />
                      </Button>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : null}
            {editable ? (
              <FileUploadButton
                purpose="link"
                label={t("addMedia")}
                multiple
                onUploaded={(file) =>
                  setForm((current) => ({ ...current, media: [...current.media, { id: file.id, name: file.name }] }))
                }
              />
            ) : null}
          </section>
          <AudienceBuilder
            audience={form.audience}
            disabled={!editable}
            onChange={(audience) => setForm({ ...form, audience })}
          />

          {editable ? (
            <div className="flex flex-wrap gap-2">
              <Button type="submit" variant="outline" className={TOUCH} disabled={!valid || busy}>
                {t("saveDraft")}
              </Button>
              <Button
                type="button"
                variant="outline"
                className={TOUCH}
                disabled={!valid || busy}
                onClick={() => preview.mutate()}
              >
                {t("sendPreview")}
              </Button>
              <Button
                type="button"
                className={TOUCH}
                disabled={!valid || busy || count.pending || count.count === 0}
                onClick={() => setSendOpen(true)}
              >
                {t("sendNow")}
              </Button>
              <Button
                type="button"
                variant="outline"
                className={TOUCH}
                disabled={!valid || busy || count.pending || count.count === 0}
                onClick={() => setScheduleOpen(true)}
              >
                {item?.status === "scheduled" ? t("reschedule") : t("schedule")}
              </Button>
              {item?.status === "scheduled" ? (
                <Button
                  type="button"
                  variant="destructive"
                  className={TOUCH}
                  disabled={busy || cancel.isPending}
                  onClick={() => setCancelOpen(true)}
                >
                  {t("cancelScheduled")}
                </Button>
              ) : null}
            </div>
          ) : null}
        </form>

        <div className="flex flex-col gap-4">
          <BroadcastPreview title={form.title} text={form.text} />
        </div>
      </div>

      <ConfirmDialog
        open={sendOpen}
        onOpenChange={setSendOpen}
        title={t("sendTitle")}
        description={t("sendDescription", { count: count.count ?? "?" })}
        confirmLabel={t("sendNow")}
        loading={send.isPending}
        onConfirm={() => send.mutate(undefined)}
      />
      <ScheduleDialog
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
        initialIso={item?.scheduled_at ?? null}
        loading={send.isPending}
        onSubmit={(iso) => send.mutate(iso)}
      />
      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title={t("cancelTitle")}
        description={t("cancelDescription")}
        confirmLabel={t("cancelScheduled")}
        destructive
        loading={cancel.isPending}
        onConfirm={() => cancel.mutate()}
      />
    </PageContainer>
  )
}
