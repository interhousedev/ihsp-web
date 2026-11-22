"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, Input, LoadingButton, ResponsiveDialog, Textarea } from "@ihsp/ui"
import { useEffect, useState, type FormEvent } from "react"
import { toast } from "sonner"
import { HELP_TAGS, HELP_TYPES, type Helper, type HelperIn } from "../../projects/api"
import { emptyHelper, useStaffHelperMutations } from "../api"
import { cleanHelper, validateHelper } from "../validate"

const LANGS = ["en", "ru", "uz"] as const
const CONTACTS = ["email", "phone", "telegram", "website"] as const
const AREAS_MAX = 12

function Chips({
  label,
  options,
  value,
  onChange,
  name,
}: {
  label: string
  options: readonly string[]
  value: string[]
  onChange: (next: string[]) => void
  name: (option: string) => string
}) {
  const toggle = (o: string) => onChange(value.includes(o) ? value.filter((v) => v !== o) : [...value, o])
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="text-sm font-medium">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <Button
            key={o}
            type="button"
            size="sm"
            className="min-h-11"
            variant={value.includes(o) ? "default" : "outline"}
            aria-pressed={value.includes(o)}
            onClick={() => toggle(o)}
          >
            {name(o)}
          </Button>
        ))}
      </div>
    </fieldset>
  )
}

/** Create or edit one helper: every `HelperIn` field. */
export function HelperDialog({ helper, onClose }: { helper: Helper | "new" | null; onClose: () => void }) {
  const t = useT("projects")
  const errorMessage = useErrorMessage()
  const { create, update } = useStaffHelperMutations()
  const [form, setForm] = useState<HelperIn>(emptyHelper)
  const [area, setArea] = useState("")
  const [tried, setTried] = useState(false)
  const open = helper !== null

  useEffect(() => {
    if (!helper) return
    setTried(false)
    setArea("")
    setForm(helper === "new" ? emptyHelper : { ...helper })
  }, [helper])

  const errors = validateHelper(form)
  const set = <K extends keyof HelperIn>(key: K, value: HelperIn[K]) => setForm((f) => ({ ...f, [key]: value }))
  const bad = (key: keyof typeof errors) => tried && errors[key]
  const addArea = () => {
    const v = area.trim()
    if (!v || form.expertise_areas.includes(v) || form.expertise_areas.length >= AREAS_MAX) return
    set("expertise_areas", [...form.expertise_areas, v])
    setArea("")
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    setTried(true)
    if (Object.keys(errors).length > 0) return
    const body = cleanHelper(form)
    const callbacks = {
      onSuccess: () => {
        toast.success(t("staff.saved"))
        onClose()
      },
      onError: (error: unknown) => toast.error(errorMessage(error)),
    }
    if (helper && helper !== "new") update.mutate({ id: helper.id, body }, callbacks)
    else create.mutate(body, callbacks)
  }

  const field = "flex flex-col gap-1 text-sm"
  const invalid = "text-destructive text-xs"
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title={helper === "new" ? t("staff.createTitle") : t("staff.editTitle")}
      size="lg"
      noValidate
      onSubmit={submit}
      footer={
        <LoadingButton type="submit" loading={create.isPending || update.isPending}>
          {t("staff.save")}
        </LoadingButton>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <label className={field}>
          {t("staff.kind")}
          <select
            className="border-input bg-background h-11 rounded-md border px-3 text-sm"
            value={form.kind}
            onChange={(e) => set("kind", e.target.value as HelperIn["kind"])}
          >
            <option value="person">{t("helpers.kind.person")}</option>
            <option value="organization">{t("helpers.kind.organization")}</option>
          </select>
        </label>
        <label className={field}>
          {t("staff.city")}
          <Input className="h-11" maxLength={120} value={form.city} onChange={(e) => set("city", e.target.value)} />
        </label>
        <label className={`${field} sm:col-span-2`}>
          {t("staff.name")}
          <Input
            className="h-11"
            maxLength={200}
            aria-invalid={bad("name") ? true : undefined}
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
          />
          {bad("name") && <span className={invalid}>{t("staff.required")}</span>}
        </label>
        {LANGS.map((l) => (
          <label key={l} className={`${field} sm:col-span-2`}>
            {t("staff.description", { lang: l.toUpperCase() })}
            <Textarea
              rows={3}
              maxLength={1200}
              aria-invalid={bad("description") && !form.description[l].trim() ? true : undefined}
              value={form.description[l]}
              onChange={(e) => set("description", { ...form.description, [l]: e.target.value })}
            />
          </label>
        ))}
        {bad("description") && <span className={`${invalid} sm:col-span-2`}>{t("staff.descriptionRequired")}</span>}
        <div className="sm:col-span-2">
          <Chips
            label={t("staff.tags")}
            options={HELP_TAGS}
            value={form.tags}
            onChange={(v) => set("tags", v)}
            name={(o) => t(`helpTags.${o}`)}
          />
          {bad("tags") && <span className={invalid}>{t("staff.tagsRequired")}</span>}
        </div>
        <div className="sm:col-span-2">
          <Chips
            label={t("staff.helpTypes")}
            options={HELP_TYPES}
            value={form.help_types}
            onChange={(v) => set("help_types", v)}
            name={(o) => t(`helpTypes.${o}`)}
          />
        </div>
        <fieldset className="flex flex-col gap-1.5 sm:col-span-2">
          <legend className="text-sm font-medium">{t("staff.expertise")}</legend>
          <ul className="flex flex-wrap gap-2">
            {form.expertise_areas.map((a) => (
              <li key={a}>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="min-h-11"
                  aria-label={t("staff.removeArea", { name: a })}
                  onClick={() =>
                    set(
                      "expertise_areas",
                      form.expertise_areas.filter((x) => x !== a),
                    )
                  }
                >
                  {a} ×
                </Button>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <Input
              className="h-11"
              maxLength={80}
              aria-label={t("staff.expertiseNew")}
              placeholder={t("staff.expertiseNew")}
              value={area}
              onChange={(e) => setArea(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  addArea()
                }
              }}
            />
            <Button type="button" variant="outline" className="min-h-11" onClick={addArea}>
              {t("staff.addArea")}
            </Button>
          </div>
        </fieldset>
        {CONTACTS.map((c) => (
          <label key={c} className={field}>
            {t(`staff.contact.${c}`)}
            <Input
              className="h-11"
              maxLength={200}
              inputMode={c === "email" ? "email" : c === "phone" ? "tel" : c === "website" ? "url" : "text"}
              aria-invalid={bad(c) ? true : undefined}
              value={form.contacts[c]}
              onChange={(e) => set("contacts", { ...form.contacts, [c]: e.target.value })}
            />
            {bad(c) && <span className={invalid}>{t(`staff.invalid.${c}`)}</span>}
          </label>
        ))}
        <label className="flex min-h-11 items-center gap-2 text-sm sm:col-span-2">
          <input
            type="checkbox"
            className="size-5"
            checked={form.active}
            onChange={(e) => set("active", e.target.checked)}
          />
          {t("staff.active")}
        </label>
      </div>
    </ResponsiveDialog>
  )
}
