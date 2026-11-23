"use client"

import {
  CERT_FIELD_KEYS,
  certKeys,
  getCertPreview,
  getCertTemplatesQuery,
  postCertBackground,
  postCertTemplate,
  putCertSettings,
  putCertTemplate,
  type CertField,
  type CertFieldKey,
  type CertPartner,
  type CertSettings,
  type CertTemplate,
} from "@ihsp/api"
import { QueryState } from "@ihsp/features-core"
import { useErrorMessage, useFormatters, useLocale, useT } from "@ihsp/i18n"
import {
  Alert,
  AlertDescription,
  Card,
  CardContent,
  Icons,
  LoadingButton,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  StateView,
} from "@ihsp/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useRef, useState } from "react"
import { pickLabel, useCertFonts } from "../hooks/use-cert-fonts"
import { newField } from "../utils/layout"
import { CertCanvas } from "./cert-canvas"
import { FieldInspector } from "./field-inspector"

/** Saving waits this long after the last change, then the server preview is drawn again. */
const SAVE_DELAY_MS = 800
const SAMPLE_CODE = "IHT-7Q2K-9XZD"

type SaveState = "saved" | "pending" | "saving" | "error"

function ServerPreview({ courseId, template, rev }: { courseId: string; template: CertTemplate; rev: number }) {
  const t = useT("courseCertificates")
  const preview = useQuery({
    queryKey: [...certKeys.templates(courseId), template.id, "preview", rev],
    queryFn: ({ signal }) => getCertPreview(courseId, template.id, t("sample.name"), { signal }),
    staleTime: Infinity,
  })
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!preview.data) return
    const next = URL.createObjectURL(preview.data)
    setUrl(next)
    return () => URL.revokeObjectURL(next)
  }, [preview.data])
  return (
    <figure className="flex flex-col gap-2">
      <figcaption className="text-sm font-medium">{t("design.serverPreview")}</figcaption>
      {preview.isError ? (
        <StateView state="error" error={preview.error} onRetry={() => void preview.refetch()} />
      ) : url ? (
        <img
          src={url}
          alt={t("design.serverPreviewAlt")}
          className={preview.isFetching ? "rounded-md border opacity-60" : "rounded-md border"}
        />
      ) : (
        <Skeleton
          className="w-full rounded-md"
          style={{ aspectRatio: `${template.width_px} / ${template.height_px}` }}
        />
      )}
      <p className="text-muted-foreground text-xs">{t("design.serverPreviewNote")}</p>
    </figure>
  )
}

function Editor({
  courseId,
  saved,
  samples,
}: {
  courseId: string
  saved: CertTemplate
  samples: Record<CertFieldKey, string>
}) {
  const t = useT("courseCertificates")
  const errorMessage = useErrorMessage()
  const queryClient = useQueryClient()
  const [work, setWork] = useState(saved)
  const [dirty, setDirty] = useState(false)
  const [selected, setSelected] = useState<number | null>(null)
  const [dragging, setDragging] = useState(false)
  const [state, setState] = useState<SaveState>("saved")
  const [rev, setRev] = useState(0)
  const fileInput = useRef<HTMLInputElement>(null)

  /** A change by the author: applied at once on the canvas, saved after a pause. */
  function edit(change: (current: CertTemplate) => CertTemplate) {
    setWork(change)
    setDirty(true)
  }

  const save = useMutation({
    mutationFn: (template: CertTemplate) =>
      putCertTemplate(courseId, template.id, { name: template.name, fields: template.fields, qr: template.qr }),
    onMutate: () => setState("saving"),
    onSuccess: (next) => {
      queryClient.setQueryData<{ items: CertTemplate[] }>(certKeys.templates(courseId), (old) =>
        old ? { items: old.items.map((item) => (item.id === next.id ? next : item)) } : old,
      )
      setState("saved")
      setRev((value) => value + 1)
    },
    onError: () => setState("error"),
  })
  const { mutate } = save

  // Debounced autosave: never while a field is being dragged, so the server sees only the final position.
  useEffect(() => {
    if (!dirty || dragging) return
    setState("pending")
    const timer = window.setTimeout(() => {
      setDirty(false)
      mutate(work)
    }, SAVE_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [work, dirty, dragging, mutate])

  const background = useMutation({
    mutationFn: (file: File) => postCertBackground(courseId, work.id, file),
    onSuccess: (next) => {
      queryClient.setQueryData<{ items: CertTemplate[] }>(certKeys.templates(courseId), (old) =>
        old ? { items: old.items.map((item) => (item.id === next.id ? next : item)) } : old,
      )
      setWork((current) => ({
        ...current,
        background_url: next.background_url,
        width_px: next.width_px,
        height_px: next.height_px,
      }))
      setRev((value) => value + 1)
    },
  })

  const setField = (index: number, field: CertField) =>
    edit((current) => ({ ...current, fields: current.fields.map((item, i) => (i === index ? field : item)) }))
  const present = new Set(work.fields.map((field) => field.key))
  const addable = CERT_FIELD_KEYS.filter((key) => key === "custom_text" || !present.has(key))
  const field = selected === null ? undefined : work.fields[selected]

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileInput}
            type="file"
            accept="image/png,image/jpeg,application/pdf"
            className="sr-only"
            tabIndex={-1}
            aria-hidden
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) background.mutate(file)
              event.target.value = ""
            }}
          />
          <LoadingButton
            type="button"
            variant="outline"
            loading={background.isPending}
            onClick={() => fileInput.current?.click()}
            className="min-h-11 md:min-h-8"
          >
            <Icons.upload aria-hidden />
            {work.background_url ? t("design.replaceBackground") : t("design.uploadBackground")}
          </LoadingButton>
          <Select
            value={null}
            items={addable.map((key) => ({ value: key, label: t(`field.${key}`) }))}
            onValueChange={(value) => {
              if (!value) return
              edit((current) => ({ ...current, fields: [...current.fields, newField(value as CertFieldKey, current)] }))
              setSelected(work.fields.length)
            }}
          >
            <SelectTrigger aria-label={t("design.addField")} className="min-h-11 w-auto md:min-h-8">
              <Icons.add aria-hidden />
              <SelectValue placeholder={t("design.addField")} />
            </SelectTrigger>
            <SelectContent>
              {addable.map((key) => (
                <SelectItem key={key} value={key}>
                  {t(`field.${key}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span role="status" className="text-muted-foreground ml-auto text-xs">
            {t(`design.state.${state}`)}
          </span>
        </div>
        <p className="text-muted-foreground text-xs">{t("design.backgroundHint")}</p>
        {background.isError ? (
          <Alert variant="destructive">
            <AlertDescription>{errorMessage(background.error)}</AlertDescription>
          </Alert>
        ) : null}
        {save.isError ? (
          <Alert variant="destructive">
            <AlertDescription>{errorMessage(save.error)}</AlertDescription>
          </Alert>
        ) : null}
        <CertCanvas
          template={work}
          samples={samples}
          selected={selected}
          onSelect={setSelected}
          onChange={setField}
          onDragging={setDragging}
        />
        <ServerPreview courseId={courseId} template={work} rev={rev} />
      </div>
      <Card className="lg:sticky lg:top-16">
        <CardContent>
          {field && selected !== null ? (
            <FieldInspector
              field={field}
              qr={work.qr}
              onField={(next) => setField(selected, next)}
              onQr={(qr) => edit((current) => ({ ...current, qr }))}
              onRemove={() => {
                edit((current) => ({ ...current, fields: current.fields.filter((_, i) => i !== selected) }))
                setSelected(null)
              }}
            />
          ) : (
            <p className="text-muted-foreground text-sm">{t("design.pickField")}</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/** Design tab: the certificate template of the course (one per course; created on first visit with sensible fields). */
export function DesignTab({
  courseId,
  courseTitle,
  settings,
  partners,
}: {
  courseId: string
  courseTitle: string
  settings: CertSettings
  partners: CertPartner[]
}) {
  const t = useT("courseCertificates")
  const locale = useLocale()
  const format = useFormatters()
  const errorMessage = useErrorMessage()
  const queryClient = useQueryClient()
  const templates = useQuery(getCertTemplatesQuery(courseId))
  useCertFonts()
  const [today] = useState(() => new Date())

  const create = useMutation({
    mutationFn: async () => {
      const created = await postCertTemplate(courseId, { name: courseTitle.slice(0, 120) || t("design.defaultName") })
      const fields = (["name", "course", "tier", "date", "code", "qr"] as const).map((key) => newField(key, created))
      const template = await putCertTemplate(courseId, created.id, { name: created.name, fields, qr: created.qr })
      const next = await putCertSettings(courseId, { ...settings, template_id: template.id })
      return { template, next }
    },
    onSuccess: ({ next }) => {
      queryClient.setQueryData(certKeys.settings(courseId), next)
      void queryClient.invalidateQueries({ queryKey: certKeys.templates(courseId) })
    },
  })

  const samples: Record<CertFieldKey, string> = {
    name: t("sample.name"),
    course: courseTitle,
    tier: settings.tiers[0] ? pickLabel(settings.tiers[0].label, locale) : t("sample.tier"),
    date: format.date(today),
    partner: partners[0]?.name ?? t("sample.partner"),
    code: SAMPLE_CODE,
    qr: "",
    custom_text: "",
  }

  return (
    <QueryState query={templates} rows={3}>
      {({ items }) => {
        const active = items.find((item) => item.id === settings.template_id) ?? items[0]
        if (!active) {
          return (
            <div className="flex flex-col items-start gap-3 rounded-card border border-dashed p-6">
              <Icons.certificates aria-hidden className="text-muted-foreground size-8" />
              <p className="text-sm">{t("design.empty")}</p>
              <LoadingButton
                type="button"
                loading={create.isPending}
                onClick={() => create.mutate()}
                className="min-h-11 md:min-h-8"
              >
                {t("design.create")}
              </LoadingButton>
              {create.isError ? (
                <Alert variant="destructive">
                  <AlertDescription>{errorMessage(create.error)}</AlertDescription>
                </Alert>
              ) : null}
            </div>
          )
        }
        return <Editor key={active.id} courseId={courseId} saved={active} samples={samples} />
      }}
    </QueryState>
  )
}
