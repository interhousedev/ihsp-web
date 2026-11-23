"use client"

import { isApiError } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { LoadingButton, ResponsiveDialog, Skeleton } from "@ihsp/ui"
import { Input } from "@ihsp/ui"
import { useEffect, useState, type FormEvent } from "react"
import { toast } from "sonner"
import { DateListField, cleanDates } from "../../../components/lib/date-list-field"
import { ImageUrlField, isHttpsImageUrl } from "../../../components/lib/image-url-field"
import { useStaffOpportunity, useStaffOpportunityMutations, type StaffOppFields } from "../api"

export const OPP_KINDS = [
  "exam",
  "certification",
  "course",
  "event",
  "recurring",
  "program",
  "scholarship",
  "research",
] as const

type Form = {
  kind: string
  title: string
  provider: string
  url: string
  logo_url: string
  country: string
  summary: string
  registration_deadlines: string[]
  exam_dates: string[]
  note: string
}

const EMPTY: Form = {
  kind: "course",
  title: "",
  provider: "",
  url: "",
  logo_url: "",
  country: "",
  summary: "",
  registration_deadlines: [],
  exam_dates: [],
  note: "",
}

const text = (v: unknown) => (typeof v === "string" ? v : "")
const dates = (v: unknown): string[] => (Array.isArray(v) ? v.filter((d): d is string => typeof d === "string") : [])

/** Create (`id` null) or edit one entry; fields the form does not show are sent back as loaded. */
export function OpportunityEditDialog({
  open,
  id,
  onClose,
}: {
  open: boolean
  id: string | null
  onClose: () => void
}) {
  const t = useT("opportunitiesManage")
  const errorMessage = useErrorMessage()
  const detail = useStaffOpportunity(open ? id : null)
  const { create, update } = useStaffOpportunityMutations()
  const [form, setForm] = useState<Form>(EMPTY)
  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }))

  useEffect(() => {
    if (id === null) return setForm(EMPTY)
    const f = detail.data?.fields
    if (!f) return
    setForm({
      kind: f.kind,
      title: f.title,
      provider: text(f.provider),
      url: text(f.url),
      logo_url: text(f.logo_url),
      country: text(f.country),
      summary: text(f.summary),
      registration_deadlines: dates(f.registration_deadlines),
      exam_dates: dates(f.exam_dates),
      note: text(f.note),
    })
  }, [id, open, detail.data])

  function submit(event: FormEvent) {
    event.preventDefault()
    const reg = cleanDates(form.registration_deadlines)
    const exam = cleanDates(form.exam_dates)
    const orNull = (v: string) => v.trim() || null
    const fields: StaffOppFields = {
      ...detail.data?.fields,
      kind: form.kind,
      title: form.title.trim(),
      provider: orNull(form.provider),
      url: orNull(form.url),
      logo_url: orNull(form.logo_url),
      country: orNull(form.country.toUpperCase()),
      summary: orNull(form.summary),
      registration_deadlines: reg,
      exam_dates: exam,
      note: orNull(form.note),
    }
    const onError = (error: unknown) =>
      toast.error(isApiError(error) && error.status === 409 ? t("stale") : errorMessage(error))
    const onSuccess = () => {
      toast.success(t("saved"))
      onClose()
    }
    if (id === null) create.mutate(fields, { onSuccess, onError })
    else if (detail.data) update.mutate({ id, fields, lock_version: detail.data.lock_version }, { onSuccess, onError })
  }

  const loading = id !== null && detail.isPending
  const field = "flex flex-col gap-1 text-sm"
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title={id === null ? t("createTitle") : t("editTitle")}
      size="md"
      onSubmit={submit}
      footer={
        <LoadingButton
          type="submit"
          loading={create.isPending || update.isPending}
          disabled={
            loading ||
            form.title.trim() === "" ||
            [form.url, form.logo_url].some((v) => v.trim() !== "" && !isHttpsImageUrl(v))
          }
        >
          {t("save")}
        </LoadingButton>
      }
    >
      {loading ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className={field}>
            {t("kind")}
            <select
              className="border-input bg-background h-10 rounded-md border px-3 text-sm"
              value={form.kind}
              onChange={(e) => set("kind", e.target.value)}
            >
              {OPP_KINDS.map((k) => (
                <option key={k} value={k}>
                  {t(`kinds.${k}`)}
                </option>
              ))}
            </select>
          </label>
          <label className={field}>
            {t("country")}
            <Input value={form.country} maxLength={2} onChange={(e) => set("country", e.target.value)} />
          </label>
          <label className={`${field} sm:col-span-2`}>
            {t("titleField")}
            <Input value={form.title} maxLength={200} onChange={(e) => set("title", e.target.value)} />
          </label>
          <label className={field}>
            {t("provider")}
            <Input value={form.provider} maxLength={300} onChange={(e) => set("provider", e.target.value)} />
          </label>
          <label className={field}>
            {t("url")}
            <Input
              type="url"
              inputMode="url"
              placeholder="https://"
              aria-invalid={form.url.trim() !== "" && !isHttpsImageUrl(form.url) ? true : undefined}
              value={form.url}
              onChange={(e) => set("url", e.target.value)}
            />
          </label>
          <div className="sm:col-span-2">
            <ImageUrlField
              id="opp-logo"
              label={t("logoUrl")}
              value={form.logo_url}
              onChange={(v) => set("logo_url", v)}
            />
          </div>
          <DateListField
            label={t("registrationDeadlines")}
            value={form.registration_deadlines}
            onChange={(v) => set("registration_deadlines", v)}
          />
          <DateListField label={t("examDates")} value={form.exam_dates} onChange={(v) => set("exam_dates", v)} />
          <label className={`${field} sm:col-span-2`}>
            {t("summary")}
            <textarea
              className="border-input bg-background min-h-20 rounded-md border px-3 py-2 text-sm"
              maxLength={2000}
              value={form.summary}
              onChange={(e) => set("summary", e.target.value)}
            />
          </label>
          <label className={`${field} sm:col-span-2`}>
            {t("note")}
            <Input value={form.note} onChange={(e) => set("note", e.target.value)} />
          </label>
        </div>
      )}
    </ResponsiveDialog>
  )
}
