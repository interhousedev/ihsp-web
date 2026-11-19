"use client"

import { isApiError } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import {
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
import { useState, type FormEvent, type ReactNode } from "react"
import { toast } from "sonner"
import { InstitutionCombobox } from "../../chooser/components/institution-combobox"
import type { Institution } from "../../chooser/types"
import { countWords } from "../../essays/diff"
import {
  EXEMPLAR_KINDS,
  EXEMPLAR_STATUSES,
  useCreateExemplar,
  usePatchExemplar,
  type Exemplar,
  type ExemplarInput,
  type ExemplarKind,
  type ExemplarStatus,
} from "../api"

const HTTP_URL = /^https?:\/\/\S+$/i

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string
  label: string
  error?: string | null
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor={id} className="text-muted-foreground text-[13px] font-normal">
        {label}
      </Label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-destructive text-xs">
          {error}
        </p>
      ) : null}
    </div>
  )
}

/** The comma-separated tags of the form as a clean list. */
export function parseTags(raw: string): string[] {
  return [
    ...new Set(
      raw
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  ]
}

/** Create (no `exemplar`) or edit one exemplar of the library. */
export function ExemplarDialog({
  open,
  onOpenChange,
  exemplar,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  exemplar?: Exemplar
}) {
  const t = useT("exemplarsStaff")
  const errorMessage = useErrorMessage()
  const create = useCreateExemplar()
  const patch = usePatchExemplar()
  const [title, setTitle] = useState(exemplar?.title ?? "")
  const [kind, setKind] = useState<ExemplarKind>(exemplar?.kind ?? "personal_statement")
  const [status, setStatus] = useState<ExemplarStatus>(exemplar?.status ?? "draft")
  const [institution, setInstitution] = useState<Institution | null>(null)
  const [schoolName, setSchoolName] = useState(exemplar?.school_name ?? "")
  const [year, setYear] = useState(exemplar?.year != null ? String(exemplar.year) : "")
  const [sourceUrl, setSourceUrl] = useState(exemplar?.source_url ?? "")
  const [sourceName, setSourceName] = useState(exemplar?.source_name ?? "")
  const [prompt, setPrompt] = useState(exemplar?.prompt ?? "")
  const [notes, setNotes] = useState(exemplar?.notes ?? "")
  const [tags, setTags] = useState((exemplar?.tags ?? []).join(", "))
  const [body, setBody] = useState(exemplar?.body ?? "")
  const [duplicate, setDuplicate] = useState(false)
  const [touched, setTouched] = useState(false)

  const yearNumber = year.trim() === "" ? null : Number(year)
  const yearValid = yearNumber === null || (Number.isInteger(yearNumber) && yearNumber >= 1900 && yearNumber <= 2100)
  const urlValid = HTTP_URL.test(sourceUrl.trim())
  const ready = title.trim() !== "" && body.trim() !== "" && urlValid && yearValid
  const pending = create.isPending || patch.isPending

  async function submit(event: FormEvent) {
    event.preventDefault()
    setTouched(true)
    if (!ready) return
    const school = institution?.name ?? schoolName.trim()
    const fields = {
      title: title.trim(),
      kind,
      status,
      body,
      source_url: sourceUrl.trim(),
      source_name: sourceName.trim(),
      school_name: school,
      year: yearNumber,
      prompt: prompt.trim(),
      notes: notes.trim(),
      tags: parseTags(tags),
    }
    try {
      if (exemplar) {
        await patch.mutateAsync({
          id: exemplar.id,
          lock_version: exemplar.lock_version,
          ...fields,
          ...(institution ? { institution_id: institution.id } : {}),
        })
      } else {
        const input: ExemplarInput = { ...fields, institution_id: institution?.id ?? null }
        await create.mutateAsync(input)
      }
      toast.success(t("saved"))
      onOpenChange(false)
    } catch (error) {
      if (isApiError(error) && error.type === "admission/exemplar_duplicate") setDuplicate(true)
      else toast.error(errorMessage(error))
    }
  }

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={exemplar ? t("editTitle") : t("createTitle")}
      onSubmit={submit}
      size="lg"
      footer={
        <LoadingButton type="submit" loading={pending}>
          {t("save")}
        </LoadingButton>
      }
    >
      <div className="flex flex-col gap-3">
        {duplicate ? (
          <p role="alert" className="text-destructive rounded-card border border-destructive/30 p-2 text-sm">
            {t("duplicate")}
          </p>
        ) : null}
        <Field id="ex-title" label={t("fieldTitle")} error={touched && title.trim() === "" ? t("required") : null}>
          <Input
            id="ex-title"
            maxLength={300}
            value={title}
            onChange={(event) => {
              setTitle(event.target.value)
              setDuplicate(false)
            }}
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field id="ex-kind" label={t("fieldKind")}>
            <Select value={kind} onValueChange={(value) => value && setKind(value as ExemplarKind)}>
              <SelectTrigger id="ex-kind" className="min-h-11 w-full md:min-h-8">
                <SelectValue>{t(`kind.${kind}`)}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {EXEMPLAR_KINDS.map((value) => (
                  <SelectItem key={value} value={value}>
                    {t(`kind.${value}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field id="ex-status" label={t("fieldStatus")}>
            <Select value={status} onValueChange={(value) => value && setStatus(value as ExemplarStatus)}>
              <SelectTrigger id="ex-status" className="min-h-11 w-full md:min-h-8">
                <SelectValue>{t(`status.${status}`)}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {EXEMPLAR_STATUSES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {t(`status.${value}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field id="ex-institution" label={t("fieldInstitution")}>
            <InstitutionCombobox id="ex-institution" value={institution} onChange={setInstitution} />
            {exemplar && !institution && exemplar.school_name ? (
              <p className="text-muted-foreground text-xs">{exemplar.school_name}</p>
            ) : null}
          </Field>
          <Field id="ex-year" label={t("fieldYear")} error={touched && !yearValid ? t("yearInvalid") : null}>
            <Input
              id="ex-year"
              type="number"
              inputMode="numeric"
              value={year}
              onChange={(event) => setYear(event.target.value)}
            />
          </Field>
        </div>
        {institution ? null : (
          <Field id="ex-school" label={t("fieldSchoolName")}>
            <Input id="ex-school" value={schoolName} onChange={(event) => setSchoolName(event.target.value)} />
          </Field>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <Field id="ex-source-url" label={t("fieldSourceUrl")} error={touched && !urlValid ? t("urlInvalid") : null}>
            <Input
              id="ex-source-url"
              type="url"
              inputMode="url"
              value={sourceUrl}
              onChange={(event) => {
                setSourceUrl(event.target.value)
                setDuplicate(false)
              }}
            />
          </Field>
          <Field id="ex-source-name" label={t("fieldSourceName")}>
            <Input id="ex-source-name" value={sourceName} onChange={(event) => setSourceName(event.target.value)} />
          </Field>
        </div>
        <Field id="ex-prompt" label={t("fieldPrompt")}>
          <Input id="ex-prompt" value={prompt} onChange={(event) => setPrompt(event.target.value)} />
        </Field>
        <Field id="ex-notes" label={t("fieldNotes")}>
          <Textarea id="ex-notes" rows={2} value={notes} onChange={(event) => setNotes(event.target.value)} />
        </Field>
        <Field id="ex-tags" label={t("fieldTags")}>
          <Input id="ex-tags" value={tags} onChange={(event) => setTags(event.target.value)} />
        </Field>
        <Field id="ex-body" label={t("fieldBody")} error={touched && body.trim() === "" ? t("required") : null}>
          <Textarea id="ex-body" rows={10} value={body} onChange={(event) => setBody(event.target.value)} />
          <p className="text-muted-foreground text-xs tabular-nums" data-testid="ex-word-count">
            {t("words", { count: countWords(body) })}
          </p>
        </Field>
      </div>
    </ResponsiveDialog>
  )
}
