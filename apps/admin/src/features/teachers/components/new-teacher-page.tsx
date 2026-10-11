"use client"

import { getAdminTeachers, keys, postAdminTeachers, type TeacherCreated } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Alert, AlertDescription, Button, CopyButton, Input, PageContainer, LoadingButton } from "@ihsp/ui"
import Link from "next/link"
import { useState } from "react"
import { BackLink } from "../../shared/components/back-link"
import { LabeledField } from "../../shared/components/labeled-field"
import { useAdminMutation } from "../../shared/hooks/use-admin-mutation"
import { TOUCH } from "../../shared/utils/touch"

type FormState = { last_name: string; first_name: string; middle_name: string; email: string }
const EMPTY: FormState = { last_name: "", first_name: "", middle_name: "", email: "" }
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function sameName(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase()
}

/**
 * Create a teacher account (ADM-4, UF-ADM-02): name and email, then the generated login and the activation link to
 * copy. A teacher with the same name triggers a duplicate warning that must be confirmed once.
 */
export function NewTeacherPage() {
  const t = useT("teachers.create")
  const [form, setForm] = useState<FormState>(EMPTY)
  const [duplicate, setDuplicate] = useState(false)
  const [created, setCreated] = useState<TeacherCreated | null>(null)

  const create = useAdminMutation({
    mutationFn: () =>
      postAdminTeachers({
        last_name: form.last_name.trim(),
        first_name: form.first_name.trim(),
        middle_name: form.middle_name.trim() || undefined,
        email: form.email.trim(),
      }),
    invalidate: [keys.admin.teachers.all(), keys.admin.users.all()],
    onSuccess: (data) => setCreated(data),
  })

  const valid = form.last_name.trim() !== "" && form.first_name.trim() !== "" && EMAIL_PATTERN.test(form.email.trim())

  async function submit() {
    if (!duplicate) {
      try {
        const existing = await getAdminTeachers({ query: form.last_name.trim(), limit: 100 })
        const clash = existing.items.some(
          (teacher) => sameName(teacher.last_name, form.last_name) && sameName(teacher.first_name, form.first_name),
        )
        if (clash) {
          setDuplicate(true)
          return
        }
      } catch {
        // The duplicate check only warns; the server validates the account itself.
      }
    }
    create.mutate()
  }

  function update(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
    setDuplicate(false)
  }

  if (created) {
    return (
      <PageContainer title={t("createdTitle")} actions={<BackLink href="/teachers/" label={t("back")} />}>
        <div className="flex max-w-xl flex-col gap-4">
          <p className="text-sm">{t("createdLogin", { login: created.user.login ?? "—" })}</p>
          <LabeledField label={t("activationLink")} htmlFor="activation-url" description={t("activationHint")}>
            <div className="flex gap-2">
              <Input
                id="activation-url"
                readOnly
                value={created.activation_url}
                className={TOUCH}
                onFocus={(event) => event.currentTarget.select()}
              />
              <CopyButton value={created.activation_url} />
            </div>
          </LabeledField>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/teachers/view/?id=${encodeURIComponent(created.user.id)}`}
              className="text-sm underline-offset-4 hover:underline"
            >
              {t("openProfile")}
            </Link>
            <Button
              type="button"
              variant="outline"
              className={TOUCH}
              onClick={() => {
                setCreated(null)
                setForm(EMPTY)
              }}
            >
              {t("createAnother")}
            </Button>
          </div>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer title={t("title")} actions={<BackLink href="/teachers/" label={t("back")} />}>
      <form
        className="flex max-w-xl flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault()
          if (valid) void submit()
        }}
      >
        <LabeledField label={t("lastName")} htmlFor="teacher-last-name" required>
          <Input
            id="teacher-last-name"
            value={form.last_name}
            className={TOUCH}
            autoComplete="off"
            onChange={(event) => update("last_name", event.target.value)}
          />
        </LabeledField>
        <LabeledField label={t("firstName")} htmlFor="teacher-first-name" required>
          <Input
            id="teacher-first-name"
            value={form.first_name}
            className={TOUCH}
            autoComplete="off"
            onChange={(event) => update("first_name", event.target.value)}
          />
        </LabeledField>
        <LabeledField label={t("middleName")} htmlFor="teacher-middle-name">
          <Input
            id="teacher-middle-name"
            value={form.middle_name}
            className={TOUCH}
            autoComplete="off"
            onChange={(event) => update("middle_name", event.target.value)}
          />
        </LabeledField>
        <LabeledField label={t("email")} htmlFor="teacher-email" required>
          <Input
            id="teacher-email"
            type="email"
            value={form.email}
            className={TOUCH}
            autoComplete="off"
            onChange={(event) => update("email", event.target.value)}
          />
        </LabeledField>
        {duplicate ? (
          <Alert role="alert">
            <AlertDescription>{t("duplicate")}</AlertDescription>
          </Alert>
        ) : null}
        <div>
          <LoadingButton type="submit" className={TOUCH} disabled={!valid} loading={create.isPending}>
            {duplicate ? t("createAnyway") : t("create")}
          </LoadingButton>
        </div>
      </form>
    </PageContainer>
  )
}
