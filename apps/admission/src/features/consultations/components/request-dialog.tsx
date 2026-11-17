"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import {
  Button,
  Icons,
  Input,
  Label,
  LoadingButton,
  ResponsiveDialog,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@ihsp/ui"
import { useRef, useState, type FormEvent } from "react"
import { toast } from "sonner"
import { useRequestConsultation, type ConsultFormat, type LinkedKind, type WithKind } from "../api"

const WITH_KINDS: readonly WithKind[] = ["counselor", "mentor"]
const FORMATS: readonly ConsultFormat[] = ["online", "offline"]
const TOPIC_MAX = 200
const DETAILS_MAX = 2000

export type ConsultationLink = { kind: LinkedKind; id: string }

function Choice<T extends string>({
  label,
  value,
  options,
  render,
  onChange,
}: {
  label: string
  value: T
  options: readonly T[]
  render: (value: T) => string
  onChange: (value: T) => void
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <Button
            key={option}
            type="button"
            size="sm"
            variant={value === option ? "default" : "outline"}
            aria-pressed={value === option}
            onClick={() => onChange(option)}
          >
            {render(option)}
          </Button>
        ))}
      </div>
    </div>
  )
}

/** Asks a counselor or a mentor for a talk; `link` ties it to an item or an essay. */
export function RequestConsultationDialog({
  open,
  onOpenChange,
  link,
  defaultTopic = "",
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  link?: ConsultationLink
  defaultTopic?: string
}) {
  const t = useT("consultations")
  const errorMessage = useErrorMessage()
  const request = useRequestConsultation()
  const [withKind, setWithKind] = useState<WithKind>("counselor")
  const [format, setFormat] = useState<ConsultFormat>("online")
  const [topic, setTopic] = useState(defaultTopic)
  const [details, setDetails] = useState("")
  const [time, setTime] = useState("")
  const [error, setError] = useState<string | null>(null)
  const inFlight = useRef(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (inFlight.current || !topic.trim()) return
    inFlight.current = true
    setError(null)
    try {
      await request.mutateAsync({
        with_kind: withKind,
        format,
        topic: topic.trim(),
        details: details.trim(),
        linked_kind: link?.kind ?? "other",
        linked_id: link?.id ?? null,
        preferred_times: time ? [new Date(time).toISOString()] : [],
      })
      toast.success(t("sent"))
      onOpenChange(false)
      setTopic(defaultTopic)
      setDetails("")
      setTime("")
    } catch (err) {
      const { type, params } = (err ?? {}) as { type?: string; params?: { kind?: string; limit?: number } }
      setError(
        type === "admission/item_limit" && params?.kind === "consultation"
          ? t("limit", { limit: params.limit ?? 3 })
          : errorMessage(err),
      )
    } finally {
      inFlight.current = false
    }
  }

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("request.title")}
      onSubmit={submit}
      footer={
        <LoadingButton type="submit" loading={request.isPending} disabled={!topic.trim()}>
          {t("request.send")}
        </LoadingButton>
      }
    >
      <div className="flex flex-col gap-3">
        {error ? (
          <p role="alert" className="text-destructive text-sm">
            {error}
          </p>
        ) : null}
        <Choice
          label={t("request.with")}
          value={withKind}
          options={WITH_KINDS}
          render={(v) => t(`with.${v}`)}
          onChange={setWithKind}
        />
        <Choice
          label={t("request.format")}
          value={format}
          options={FORMATS}
          render={(v) => t(`format.${v}`)}
          onChange={setFormat}
        />
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="consult-topic">{t("request.topic")}</Label>
          <Input
            id="consult-topic"
            maxLength={TOPIC_MAX}
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="consult-details">{t("request.details")}</Label>
          <Textarea
            id="consult-details"
            maxLength={DETAILS_MAX}
            value={details}
            onChange={(event) => setDetails(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="consult-time">{t("request.time")}</Label>
          <Input
            id="consult-time"
            type="datetime-local"
            value={time}
            onChange={(event) => setTime(event.target.value)}
          />
        </div>
      </div>
    </ResponsiveDialog>
  )
}

/** A button that opens the request dialog; used on pages with something to discuss (an item, an essay). */
export function RequestConsultationButton({
  link,
  defaultTopic,
  variant = "outline",
}: {
  link?: ConsultationLink
  defaultTopic?: string
  variant?: "outline" | "default"
}) {
  const t = useT("consultations")
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button type="button" variant={variant} size="sm" onClick={() => setOpen(true)}>
        <Icons.chat data-icon="inline-start" aria-hidden />
        {t("request.open")}
      </Button>
      <RequestConsultationDialog open={open} onOpenChange={setOpen} link={link} defaultTopic={defaultTopic} />
    </>
  )
}
