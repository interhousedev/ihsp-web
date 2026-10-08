"use client"

import { keys, patchAdminTeacher, type AdminUser } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Input } from "@ihsp/ui"
import { useEffect, useState } from "react"
import { LabeledField } from "../../shared/components/labeled-field"
import { useAdminMutation } from "../../shared/hooks/use-admin-mutation"
import { TOUCH } from "../../shared/utils/touch"

/** Edit the name and email of a teacher (ADM-4). Only changed fields are sent. */
export function EditTeacherDialog({
  teacher,
  open,
  onOpenChange,
}: {
  teacher: AdminUser
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const t = useT("teachers.edit")
  const [lastName, setLastName] = useState(teacher.last_name)
  const [firstName, setFirstName] = useState(teacher.first_name)
  const [middleName, setMiddleName] = useState(teacher.middle_name ?? "")
  const [email, setEmail] = useState(teacher.recovery_email ?? "")

  useEffect(() => {
    if (!open) return
    setLastName(teacher.last_name)
    setFirstName(teacher.first_name)
    setMiddleName(teacher.middle_name ?? "")
    setEmail(teacher.recovery_email ?? "")
  }, [open, teacher])

  const save = useAdminMutation({
    mutationFn: () =>
      patchAdminTeacher(teacher.id, {
        ...(lastName.trim() !== teacher.last_name ? { last_name: lastName.trim() } : {}),
        ...(firstName.trim() !== teacher.first_name ? { first_name: firstName.trim() } : {}),
        ...(middleName.trim() !== (teacher.middle_name ?? "") ? { middle_name: middleName.trim() } : {}),
        ...(email.trim() !== (teacher.recovery_email ?? "") && email.trim() !== "" ? { email: email.trim() } : {}),
      }),
    invalidate: [keys.admin.teachers.all(), keys.admin.users.all()],
    success: t("saved"),
    onSuccess: () => onOpenChange(false),
  })

  const valid = lastName.trim() !== "" && firstName.trim() !== ""
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
          <LabeledField label={t("lastName")} htmlFor="edit-last-name" required>
            <Input
              id="edit-last-name"
              value={lastName}
              className={TOUCH}
              onChange={(event) => setLastName(event.target.value)}
            />
          </LabeledField>
          <LabeledField label={t("firstName")} htmlFor="edit-first-name" required>
            <Input
              id="edit-first-name"
              value={firstName}
              className={TOUCH}
              onChange={(event) => setFirstName(event.target.value)}
            />
          </LabeledField>
          <LabeledField label={t("middleName")} htmlFor="edit-middle-name">
            <Input
              id="edit-middle-name"
              value={middleName}
              className={TOUCH}
              onChange={(event) => setMiddleName(event.target.value)}
            />
          </LabeledField>
          <LabeledField label={t("email")} htmlFor="edit-email">
            <Input
              id="edit-email"
              type="email"
              value={email}
              className={TOUCH}
              onChange={(event) => setEmail(event.target.value)}
            />
          </LabeledField>
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
