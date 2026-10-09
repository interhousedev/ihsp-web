"use client"

import { postAdminUserRoles, type AdminUser, type Role } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Badge, Button, ConfirmDialog } from "@ihsp/ui"
import { useEffect, useState } from "react"
import { CheckField } from "../../shared/components/check-field"
import { useAdminMutation } from "../../shared/hooks/use-admin-mutation"
import { fullNameWithMiddle } from "../../shared/utils/names"
import { TOUCH } from "../../shared/utils/touch"
import { userInvalidations } from "./block-actions"

/** Roles an administrator may grant or revoke. Student and teacher come from EMIS and from teacher accounts. */
const GRANTABLE: readonly Role[] = ["admin", "lms_admin", "librarian"]

/**
 * Grant or revoke Administration, LMS admin and Librarian (UF-ADM-11 step 3). A change logs the user out everywhere and a new
 * Administration member sets up OTP at the next login, so it asks for confirmation first.
 */
export function RolesEditor({ user }: { user: AdminUser }) {
  const t = useT("users.roles")
  const [selected, setSelected] = useState<Role[]>(user.roles)
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEffect(() => {
    setSelected(user.roles)
  }, [user.roles])

  const grant = GRANTABLE.filter((role) => selected.includes(role) && !user.roles.includes(role))
  const revoke = GRANTABLE.filter((role) => !selected.includes(role) && user.roles.includes(role))
  const changed = grant.length + revoke.length > 0

  const save = useAdminMutation({
    mutationFn: () => postAdminUserRoles(user.id, { grant, revoke }),
    invalidate: userInvalidations(),
    success: t("saved", { name: fullNameWithMiddle(user) }),
    onSuccess: () => setConfirmOpen(false),
  })

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-1">
        {user.roles
          .filter((role) => !GRANTABLE.includes(role))
          .map((role) => (
            <Badge key={role} variant="outline">
              {t(role)}
            </Badge>
          ))}
      </div>
      <fieldset className="flex flex-col">
        <legend className="sr-only">{t("legend")}</legend>
        {GRANTABLE.map((role) => (
          <CheckField
            key={role}
            checked={selected.includes(role)}
            label={t(role)}
            onChange={(checked) =>
              setSelected((current) => (checked ? [...current, role] : current.filter((item) => item !== role)))
            }
          />
        ))}
      </fieldset>
      <div>
        <Button type="button" className={TOUCH} disabled={!changed} onClick={() => setConfirmOpen(true)}>
          {t("save")}
        </Button>
      </div>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t("confirmTitle")}
        description={t("confirmDescription")}
        confirmLabel={t("save")}
        loading={save.isPending}
        onConfirm={() => save.mutate()}
      >
        <ul className="text-sm">
          {grant.map((role) => (
            <li key={`grant-${role}`}>+ {t(role)}</li>
          ))}
          {revoke.map((role) => (
            <li key={`revoke-${role}`}>− {t(role)}</li>
          ))}
        </ul>
      </ConfirmDialog>
    </div>
  )
}
