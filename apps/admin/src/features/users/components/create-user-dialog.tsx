"use client"

import {
  ACCOUNT_KINDS,
  keys,
  postAdminUsers,
  type AccountKind,
  type InvitedUser,
  type Role,
  type UserCreateBody,
} from "@ihsp/api"
import { useServerFieldErrors } from "@ihsp/features-core"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, CopyButton, Input, QrCode, ResponsiveDialog } from "@ihsp/ui"
import { useEffect, useState } from "react"
import { CheckField } from "../../shared/components/check-field"
import { LabeledField } from "../../shared/components/labeled-field"
import { SelectField } from "../../shared/components/select-field"
import { useAdminMutation } from "../../shared/hooks/use-admin-mutation"
import { TOUCH } from "../../shared/utils/touch"

/** Students and teachers come from EMIS and the teacher form; every other role can be given to a new account. */
export const CREATABLE_ROLES: readonly Role[] = [
  "admin",
  "lms_admin",
  "lms_creator",
  "librarian",
  "counselor",
  "mentor",
  "transcript_officer",
]

type FormState = {
  last_name: string
  first_name: string
  middle_name: string
  phone: string
  email: string
  account_kind: AccountKind
  roles: Role[]
}
const EMPTY: FormState = {
  last_name: "",
  first_name: "",
  middle_name: "",
  phone: "",
  email: "",
  account_kind: "staff",
  roles: [],
}

/**
 * Create a non-student, non-teacher account (name, phone, roles, account kind). The result dialog shows the one-time
 * Telegram invitation as a link to copy and a QR code to scan.
 */
export function CreateUserDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useT("users.create")
  const tRoles = useT("users.roles")
  const errorMessage = useErrorMessage()
  const [form, setForm] = useState<FormState>(EMPTY)
  const [created, setCreated] = useState<InvitedUser | null>(null)

  useEffect(() => {
    if (open) {
      setForm(EMPTY)
      setCreated(null)
    }
  }, [open])

  const create = useAdminMutation<UserCreateBody, InvitedUser>({
    inlineError: true,
    mutationFn: (body) => postAdminUsers(body),
    invalidate: [keys.admin.users.all()],
    onSuccess: setCreated,
  })
  const fieldErrors = useServerFieldErrors(create.error)
  const valid = form.last_name.trim() !== "" && form.first_name.trim() !== "" && form.roles.length > 0

  function toggle(role: Role, checked: boolean) {
    setForm((current) => ({
      ...current,
      roles: checked ? [...current.roles, role] : current.roles.filter((item) => item !== role),
    }))
  }

  if (created) {
    return (
      <ResponsiveDialog
        open={open}
        onOpenChange={onOpenChange}
        size="sm"
        title={t("resultTitle")}
        description={t("resultDescription", { name: `${created.user.last_name} ${created.user.first_name}` })}
        footer={
          <Button type="button" className={TOUCH} onClick={() => onOpenChange(false)}>
            {t("done")}
          </Button>
        }
      >
        <LabeledField label={t("inviteLink")} htmlFor="create-user-invite" description={t("inviteHint")}>
          <div className="flex gap-2">
            <Input
              id="create-user-invite"
              readOnly
              value={created.invite_url}
              className={TOUCH}
              onFocus={(event) => event.currentTarget.select()}
            />
            <CopyButton value={created.invite_url} />
          </div>
        </LabeledField>
        <div className="flex justify-center">
          <QrCode value={created.invite_url} label={t("qr")} />
        </div>
      </ResponsiveDialog>
    )
  }

  return (
    <ResponsiveDialog
      formRef={fieldErrors.ref}
      open={open}
      onOpenChange={onOpenChange}
      size="md"
      title={t("title")}
      description={t("description")}
      onSubmit={(event) => {
        event.preventDefault()
        if (!valid) return
        create.mutate({
          last_name: form.last_name.trim(),
          first_name: form.first_name.trim(),
          middle_name: form.middle_name.trim() || null,
          phone: form.phone.trim() || null,
          email: form.email.trim() || null,
          account_kind: form.account_kind,
          roles: form.roles,
        })
      }}
      footer={
        <>
          <Button type="button" variant="outline" className={TOUCH} onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button type="submit" className={TOUCH} disabled={!valid || create.isPending}>
            {t("submit")}
          </Button>
        </>
      }
    >
      <LabeledField label={t("lastName")} htmlFor="create-user-last-name" required>
        <Input
          id="create-user-last-name"
          value={form.last_name}
          className={TOUCH}
          onChange={(event) => setForm({ ...form, last_name: event.target.value })}
        />
      </LabeledField>
      <LabeledField label={t("firstName")} htmlFor="create-user-first-name" required>
        <Input
          id="create-user-first-name"
          value={form.first_name}
          className={TOUCH}
          onChange={(event) => setForm({ ...form, first_name: event.target.value })}
        />
      </LabeledField>
      <LabeledField label={t("middleName")} htmlFor="create-user-middle-name">
        <Input
          id="create-user-middle-name"
          value={form.middle_name}
          className={TOUCH}
          onChange={(event) => setForm({ ...form, middle_name: event.target.value })}
        />
      </LabeledField>
      <LabeledField label={t("phone")} htmlFor="create-user-phone">
        <Input
          id="create-user-phone"
          type="tel"
          inputMode="tel"
          value={form.phone}
          className={TOUCH}
          onChange={(event) => setForm({ ...form, phone: event.target.value })}
        />
      </LabeledField>
      <LabeledField label={t("email")} htmlFor="create-user-email">
        <Input
          id="create-user-email"
          type="email"
          value={form.email}
          className={TOUCH}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
        />
      </LabeledField>
      <LabeledField label={t("accountKind")} htmlFor="create-user-kind">
        <SelectField
          id="create-user-kind"
          value={form.account_kind}
          onChange={(value) => setForm({ ...form, account_kind: value as AccountKind })}
          options={ACCOUNT_KINDS.map((kind) => ({ value: kind, label: t(`kinds.${kind}`) }))}
        />
      </LabeledField>
      <fieldset className="grid gap-1">
        <legend className="mb-1 text-sm font-medium">{t("roles")}</legend>
        {CREATABLE_ROLES.map((role) => (
          <CheckField
            key={role}
            checked={form.roles.includes(role)}
            onChange={(checked) => toggle(role, checked)}
            label={tRoles(role)}
          />
        ))}
      </fieldset>
      {create.isError ? (
        <p role="alert" className="text-destructive text-sm">
          {errorMessage(create.error)}
        </p>
      ) : null}
    </ResponsiveDialog>
  )
}
