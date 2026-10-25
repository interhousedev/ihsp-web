"use client"

import { keys, postAdminUserSetPassword } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
} from "@ihsp/ui"
import { useEffect, useState } from "react"
import { CheckField } from "../../shared/components/check-field"
import { LabeledField } from "../../shared/components/labeled-field"
import { useAdminMutation } from "../../shared/hooks/use-admin-mutation"
import { TOUCH } from "../../shared/utils/touch"

/** The same rules as the backend password policy: 8+ characters with a digit, an upper and a lower case letter. */
export function isStrongPassword(value: string): boolean {
  return value.length >= 8 && /\d/.test(value) && /[A-Z\p{Lu}]/u.test(value) && /[a-z\p{Ll}]/u.test(value)
}

/**
 * "Задать пароль": the initial password of an account that has no email (a teacher the EMIS sync created). The
 * account becomes active; with the deployment flag on, the user must change it at the next login.
 */
export function SetPasswordDialog({
  userId,
  name,
  open,
  onOpenChange,
}: {
  userId: string
  name: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const t = useT("users.setPassword")
  const [password, setPassword] = useState("")
  const [requireChange, setRequireChange] = useState(true)

  useEffect(() => {
    if (open) {
      setPassword("")
      setRequireChange(true)
    }
  }, [open])

  const save = useAdminMutation({
    mutationFn: () => postAdminUserSetPassword(userId, { password, require_change: requireChange }),
    invalidate: [keys.admin.users.all(), keys.admin.teachers.all()],
    success: t("saved", { name }),
    onSuccess: () => onOpenChange(false),
  })

  const valid = isStrongPassword(password)
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
            <DialogTitle>{t("title", { name })}</DialogTitle>
            <DialogDescription>{t("description")}</DialogDescription>
          </DialogHeader>
          <LabeledField label={t("password")} htmlFor="set-password" description={t("rules")} required>
            <Input
              id="set-password"
              type="text"
              autoComplete="off"
              value={password}
              className={TOUCH}
              onChange={(event) => setPassword(event.target.value)}
            />
          </LabeledField>
          <CheckField checked={requireChange} onChange={setRequireChange} label={t("requireChange")} />
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
