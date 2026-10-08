"use client"

import { postAdminUserMailResume, postAdminUserMailSuspend, type AdminUser } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Badge, Button } from "@ihsp/ui"
import { useState } from "react"
import { ReasonDialog } from "../../shared/components/reason-dialog"
import { useAdminMutation } from "../../shared/hooks/use-admin-mutation"
import { fullNameWithMiddle } from "../../shared/utils/names"
import { TOUCH } from "../../shared/utils/touch"
import { userInvalidations } from "./block-actions"

/** Suspend or resume sending from the user's mailbox (MAIL-8, UF-ADM-15); receiving keeps working. */
export function MailActions({ user }: { user: AdminUser }) {
  const t = useT("users.mail")
  const [open, setOpen] = useState(false)
  const name = fullNameWithMiddle(user)

  const suspend = useAdminMutation({
    mutationFn: (reason: string) => postAdminUserMailSuspend(user.id, { reason }),
    invalidate: userInvalidations(),
    success: t("suspended", { name }),
    onSuccess: () => setOpen(false),
  })
  const resume = useAdminMutation({
    mutationFn: () => postAdminUserMailResume(user.id),
    invalidate: userInvalidations(),
    success: t("resumed", { name }),
  })

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">{user.login ? `${user.login}@mail` : t("noMailbox")}</span>
        <Badge variant={user.mail_suspended ? "destructive" : "secondary"}>
          {user.mail_suspended ? t("stateSuspended") : t("stateActive")}
        </Badge>
      </div>
      {user.mail_suspended ? (
        <div>
          <Button
            type="button"
            variant="outline"
            className={TOUCH}
            disabled={resume.isPending}
            onClick={() => resume.mutate()}
          >
            {t("resume")}
          </Button>
        </div>
      ) : (
        <div>
          <Button type="button" variant="destructive" className={TOUCH} onClick={() => setOpen(true)}>
            {t("suspend")}
          </Button>
        </div>
      )}
      <ReasonDialog
        open={open}
        onOpenChange={setOpen}
        title={t("suspendTitle", { name })}
        description={t("suspendDescription")}
        reasonLabel={t("reason")}
        confirmLabel={t("suspend")}
        loading={suspend.isPending}
        onSubmit={(reason) => suspend.mutate(reason)}
      />
    </div>
  )
}
