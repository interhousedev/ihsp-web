"use client"

import { keys, patchAdminUser, type AdminUser } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Input } from "@ihsp/ui"
import { useEffect, useState } from "react"
import { LabeledField } from "../../shared/components/labeled-field"
import { useAdminMutation } from "../../shared/hooks/use-admin-mutation"
import { TOUCH } from "../../shared/utils/touch"

/**
 * Edit the names, login and email of any user. Only the changed fields are sent.
 * A taken login or email (409) keeps the dialog open with the message inline.
 */
export function EditUserDialog({
  user,
  open,
  onOpenChange,
}: {
  user: AdminUser
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const t = useT("users.edit")
  const [lastName, setLastName] = useState(user.last_name)
  const [firstName, setFirstName] = useState(user.first_name)
  const [middleName, setMiddleName] = useState(user.middle_name ?? "")
  const [login, setLogin] = useState(user.login ?? "")
  const [email, setEmail] = useState(user.recovery_email ?? "")
  const errorMessage = useErrorMessage()

  useEffect(() => {
    if (!open) return
    setLastName(user.last_name)
    setFirstName(user.first_name)
    setMiddleName(user.middle_name ?? "")
    setLogin(user.login ?? "")
    setEmail(user.recovery_email ?? "")
  }, [open, user])

  const save = useAdminMutation({
    inlineError: true,
    mutationFn: () =>
      patchAdminUser(user.id, {
        ...(lastName.trim() !== user.last_name ? { last_name: lastName.trim() } : {}),
        ...(firstName.trim() !== user.first_name ? { first_name: firstName.trim() } : {}),
        ...(middleName.trim() !== (user.middle_name ?? "") ? { middle_name: middleName.trim() } : {}),
        ...(login.trim().toLowerCase() !== (user.login ?? "") && login.trim() !== ""
          ? { login: login.trim().toLowerCase() }
          : {}),
        ...(email.trim() !== (user.recovery_email ?? "") && email.trim() !== "" ? { email: email.trim() } : {}),
      }),
    invalidate: [keys.admin.users.all(), keys.admin.teachers.all(), keys.admin.students.all()],
    success: t("saved"),
    onSuccess: () => onOpenChange(false),
  })

  const valid = lastName.trim() !== "" && firstName.trim() !== "" && login.trim() !== ""
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            if (valid) save.mutate()
          }}
        >
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
          </DialogHeader>
          <LabeledField label={t("lastName")} htmlFor="edit-user-last-name" required>
            <Input
              id="edit-user-last-name"
              value={lastName}
              className={TOUCH}
              onChange={(event) => setLastName(event.target.value)}
            />
          </LabeledField>
          <LabeledField label={t("firstName")} htmlFor="edit-user-first-name" required>
            <Input
              id="edit-user-first-name"
              value={firstName}
              className={TOUCH}
              onChange={(event) => setFirstName(event.target.value)}
            />
          </LabeledField>
          <LabeledField label={t("middleName")} htmlFor="edit-user-middle-name">
            <Input
              id="edit-user-middle-name"
              value={middleName}
              className={TOUCH}
              onChange={(event) => setMiddleName(event.target.value)}
            />
          </LabeledField>
          <LabeledField label={t("login")} htmlFor="edit-user-login" required>
            <Input
              id="edit-user-login"
              value={login}
              autoComplete="off"
              spellCheck={false}
              className={TOUCH}
              aria-invalid={save.error ? true : undefined}
              onChange={(event) => setLogin(event.target.value)}
            />
          </LabeledField>
          <LabeledField label={t("email")} htmlFor="edit-user-email">
            <Input
              id="edit-user-email"
              type="email"
              value={email}
              className={TOUCH}
              onChange={(event) => setEmail(event.target.value)}
            />
          </LabeledField>
          {save.isError ? (
            <p role="alert" className="text-destructive text-sm">
              {errorMessage(save.error)}
            </p>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" className={TOUCH} onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </Button>
            <Button type="submit" className={TOUCH} disabled={!valid || save.isPending}>
              {t("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
