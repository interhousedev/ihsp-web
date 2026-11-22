"use client"

import { isApiError } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, Input, LoadingButton, ResponsiveDialog } from "@ihsp/ui"
import { useEffect, useState, type FormEvent } from "react"
import { ScorecardDialog } from "./scorecard-dialog"
import { toast } from "sonner"
import {
  useStaffInstitutionMutations,
  type InstitutionStatus,
  type StaffInstitution,
  type StaffInstitutionInput,
} from "../universities-api"

export const INSTITUTION_KINDS = ["university", "college", "foundation_provider"] as const
export const INSTITUTION_STATUSES: InstitutionStatus[] = ["published", "provisional", "archived"]
const SETTINGS = ["big_city", "college_town", "campus", "small_city"] as const

type Form = {
  name: string
  name_local: string
  country: string
  city: string
  website_domain: string
  kind: StaffInstitution["kind"]
  setting: string
  aliases: string
  languages: string
  logo_url: string
  cover_url: string
  status: InstitutionStatus
}

const EMPTY: Form = {
  name: "",
  name_local: "",
  country: "",
  city: "",
  website_domain: "",
  kind: "university",
  setting: "",
  aliases: "",
  languages: "",
  logo_url: "",
  cover_url: "",
  status: "published",
}

const list = (raw: string) =>
  raw
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean)

function toForm(i: StaffInstitution): Form {
  return {
    name: i.name,
    name_local: i.name_local ?? "",
    country: i.country,
    city: i.city ?? "",
    website_domain: i.website_domain ?? "",
    kind: i.kind,
    setting: i.setting ?? "",
    aliases: i.aliases.join(", "),
    languages: i.languages.join(", "),
    logo_url: i.logo_url ?? "",
    cover_url: i.cover_url ?? "",
    status: i.status,
  }
}

/** Create (`institution` null) or edit one institution; the server refuses a stale form with 409. */
export function UniversityEditDialog({
  open,
  institution,
  onClose,
}: {
  open: boolean
  institution: StaffInstitution | null
  onClose: () => void
}) {
  const t = useT("universitiesManage")
  const errorMessage = useErrorMessage()
  const { create, update } = useStaffInstitutionMutations()
  const [form, setForm] = useState<Form>(EMPTY)
  const [scorecard, setScorecard] = useState(false)
  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }))
  useEffect(() => setForm(institution ? toForm(institution) : EMPTY), [institution, open])

  function submit(event: FormEvent) {
    event.preventDefault()
    const orNull = (v: string) => v.trim() || null
    const body: StaffInstitutionInput = {
      name: form.name.trim(),
      name_local: orNull(form.name_local),
      country: form.country.trim().toUpperCase(),
      city: orNull(form.city),
      website_domain: orNull(form.website_domain),
      kind: form.kind,
      setting: (orNull(form.setting) as StaffInstitution["setting"]) ?? null,
      aliases: list(form.aliases),
      languages: list(form.languages),
      logo_url: orNull(form.logo_url),
      cover_url: orNull(form.cover_url),
      status: form.status,
    }
    const onSuccess = () => {
      toast.success(t("saved"))
      onClose()
    }
    const onError = (error: unknown) => {
      if (isApiError(error) && error.status === 409) toast.error(t("conflict"))
      else toast.error(errorMessage(error))
    }
    if (institution)
      update.mutate({ id: institution.id, body, lock_version: institution.lock_version }, { onSuccess, onError })
    else create.mutate(body, { onSuccess, onError })
  }

  const field = "flex flex-col gap-1 text-sm"
  const select = "border-input bg-background h-10 rounded-md border px-3 text-sm"
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title={institution ? t("editTitle") : t("createTitle")}
      size="md"
      onSubmit={submit}
      footer={
        <LoadingButton
          type="submit"
          loading={create.isPending || update.isPending}
          disabled={form.name.trim() === "" || form.country.trim().length !== 2}
        >
          {t("save")}
        </LoadingButton>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {(institution ? institution.country === "US" : form.country.trim().toUpperCase() === "US") && (
          <div className="sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => setScorecard(true)}>
              {institution ? t("scorecard.fill") : t("scorecard.add")}
            </Button>
            {scorecard && (
              <ScorecardDialog
                open
                institutionId={institution?.id ?? null}
                initialQuery={form.name}
                onClose={() => {
                  setScorecard(false)
                  if (!institution) onClose()
                }}
              />
            )}
          </div>
        )}
        <label className={`${field} sm:col-span-2`}>
          {t("name")}
          <Input value={form.name} maxLength={200} onChange={(e) => set("name", e.target.value)} />
        </label>
        <label className={field}>
          {t("nameLocal")}
          <Input value={form.name_local} maxLength={200} onChange={(e) => set("name_local", e.target.value)} />
        </label>
        <label className={field}>
          {t("country")}
          <Input value={form.country} maxLength={2} onChange={(e) => set("country", e.target.value)} />
        </label>
        <label className={field}>
          {t("city")}
          <Input value={form.city} maxLength={120} onChange={(e) => set("city", e.target.value)} />
        </label>
        <label className={field}>
          {t("domain")}
          <Input value={form.website_domain} onChange={(e) => set("website_domain", e.target.value)} />
        </label>
        <label className={field}>
          {t("kind")}
          <select className={select} value={form.kind} onChange={(e) => set("kind", e.target.value as Form["kind"])}>
            {INSTITUTION_KINDS.map((k) => (
              <option key={k} value={k}>
                {t(`kinds.${k}`)}
              </option>
            ))}
          </select>
        </label>
        <label className={field}>
          {t("setting")}
          <select className={select} value={form.setting} onChange={(e) => set("setting", e.target.value)}>
            <option value="">{t("none")}</option>
            {SETTINGS.map((s) => (
              <option key={s} value={s}>
                {t(`settings.${s}`)}
              </option>
            ))}
          </select>
        </label>
        <label className={field}>
          {t("aliases")}
          <Input value={form.aliases} onChange={(e) => set("aliases", e.target.value)} />
        </label>
        <label className={field}>
          {t("languages")}
          <Input value={form.languages} placeholder="en, ru" onChange={(e) => set("languages", e.target.value)} />
        </label>
        <label className={`${field} sm:col-span-2`}>
          {t("logoUrl")}
          <Input inputMode="url" value={form.logo_url} onChange={(e) => set("logo_url", e.target.value)} />
        </label>
        <label className={`${field} sm:col-span-2`}>
          {t("coverUrl")}
          <Input inputMode="url" value={form.cover_url} onChange={(e) => set("cover_url", e.target.value)} />
        </label>
        <label className={field}>
          {t("status")}
          <select
            className={select}
            value={form.status}
            onChange={(e) => set("status", e.target.value as InstitutionStatus)}
          >
            {INSTITUTION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {t(`statuses.${s}`)}
              </option>
            ))}
          </select>
        </label>
      </div>
    </ResponsiveDialog>
  )
}
