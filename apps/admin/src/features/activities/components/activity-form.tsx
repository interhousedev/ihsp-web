"use client"

import { useT } from "@ihsp/i18n"
import { Button, Card, CardContent, CardHeader, CardTitle, Icons, Input, PageContainer, Textarea } from "@ihsp/ui"
import { useState } from "react"
import { AUDIENCES, KINDS, useSaveActivity, type Activity, type ActivityDraft } from "../api"
import { SELECT_CLASS, shortDate } from "./activities-page"

const EMPTY: ActivityDraft = {
  kind: "event",
  audience: "both",
  title: "",
  summary: "",
  org: "",
  link: "",
  deadline: null,
}

function Field({
  label,
  htmlFor,
  required,
  error,
  hint,
  children,
}: {
  label: string
  htmlFor: string
  required?: boolean
  error?: string | null
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="grid min-w-0 content-start gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </label>
      {children}
      {error ? (
        <p className="text-destructive text-xs">{error}</p>
      ) : hint ? (
        <p className="text-muted-foreground text-xs">{hint}</p>
      ) : null}
    </div>
  )
}

/** Create or edit one opportunity of the shared catalog. An archived one is saved as it is; restoring is a separate action on the list. */
export function ActivityForm({
  activity,
  onCancel,
  onSaved,
}: {
  activity: Activity | null
  onCancel: () => void
  onSaved: () => void
}) {
  const t = useT("activities")
  const [a, setA] = useState<ActivityDraft>(activity ?? EMPTY)
  const [tried, setTried] = useState(false)
  const save = useSaveActivity(onSaved)
  const set = <K extends keyof ActivityDraft>(k: K, v: ActivityDraft[K]) => setA((x) => ({ ...x, [k]: v }))
  const errors = {
    title: a.title.trim() === "" ? t("form.errTitle") : null,
    link: a.link.trim() !== "" && !/^https:\/\/\S+$/i.test(a.link.trim()) ? t("form.errUrl") : null,
  }
  const submit = () => {
    setTried(true)
    if (errors.title || errors.link) return
    save.mutate({ id: activity?.id ?? null, lockVersion: activity?.lockVersion ?? 0, draft: a })
  }
  const show = (k: keyof typeof errors) => (tried ? errors[k] : null)
  return (
    <PageContainer
      title={activity ? t("form.editTitle") : t("form.createTitle")}
      back={
        <Button variant="ghost" size="sm" type="button" onClick={onCancel}>
          <Icons.chevronLeft data-icon="inline-start" aria-hidden />
          {t("form.back")}
        </Button>
      }
    >
      <form
        className="grid max-w-3xl gap-4"
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <p className="text-muted-foreground text-xs">{t("form.requiredNote")}</p>
        <Card>
          <CardHeader>
            <CardTitle>{t("form.texts")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Field label={t("form.title")} htmlFor="f-title" required error={show("title")}>
              <Input
                id="f-title"
                value={a.title}
                maxLength={200}
                aria-invalid={!!show("title")}
                onChange={(e) => set("title", e.target.value)}
                className="min-h-11 md:min-h-9"
              />
            </Field>
            <Field label={t("form.summary")} htmlFor="f-sum">
              <Textarea
                id="f-sum"
                rows={4}
                maxLength={2000}
                value={a.summary}
                onChange={(e) => set("summary", e.target.value)}
              />
            </Field>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("form.details")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Field label={t("form.org")} htmlFor="f-org">
              <Input
                id="f-org"
                value={a.org}
                onChange={(e) => set("org", e.target.value)}
                className="min-h-11 md:min-h-9"
              />
            </Field>
            <Field label={t("filters.kind")} htmlFor="f-kind">
              <select
                id="f-kind"
                className={SELECT_CLASS}
                value={a.kind}
                onChange={(e) => set("kind", e.target.value as ActivityDraft["kind"])}
              >
                {KINDS.map((k) => (
                  <option key={k} value={k}>
                    {t(`kinds.${k}`)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t("filters.audience")} htmlFor="f-aud" hint={t(`form.seen.${a.audience}`)}>
              <select
                id="f-aud"
                className={SELECT_CLASS}
                value={a.audience}
                onChange={(e) => set("audience", e.target.value as ActivityDraft["audience"])}
              >
                {AUDIENCES.map((x) => (
                  <option key={x} value={x}>
                    {t(`audiences.${x}`)}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              label={t("form.deadline")}
              htmlFor="f-dl"
              hint={a.deadline ? t("until", { date: shortDate(a.deadline) }) : t("form.deadlineEmpty")}
            >
              <Input
                id="f-dl"
                type="date"
                value={a.deadline ?? ""}
                onChange={(e) => set("deadline", e.target.value || null)}
                className="min-h-11 md:min-h-9"
              />
            </Field>
            <Field label={t("form.link")} htmlFor="f-link" error={show("link")}>
              <Input
                id="f-link"
                type="url"
                value={a.link}
                placeholder="https://"
                aria-invalid={!!show("link")}
                onChange={(e) => set("link", e.target.value)}
                className="min-h-11 md:min-h-9"
              />
            </Field>
          </CardContent>
        </Card>
        <div className="bg-background/95 sticky bottom-0 z-10 -mx-4 flex gap-2 border-t p-3 backdrop-blur md:static md:mx-0 md:justify-start md:border-0 md:bg-transparent md:p-0">
          <Button type="submit" className="flex-1 md:flex-none" disabled={save.isPending}>
            {activity ? t("form.saveChanges") : t("publish")}
          </Button>
        </div>
      </form>
    </PageContainer>
  )
}
