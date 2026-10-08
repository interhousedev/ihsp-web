"use client"

import { keys, postAdminUserBlock, postAdminUserSessionsRevoke, postAdminUserUnblock } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, ConfirmDialog } from "@ihsp/ui"
import { useState } from "react"
import { ReasonDialog } from "../../shared/components/reason-dialog"
import { useAdminMutation } from "../../shared/hooks/use-admin-mutation"
import { TOUCH } from "../../shared/utils/touch"

/** Queries that show a user somewhere; refetched after any account change. */
export function userInvalidations() {
  return [keys.admin.users.all(), keys.admin.students.all(), keys.admin.teachers.all()] as const
}

/**
 * Revoke all sessions, block (with a reason) and unblock a user (UF-ADM-03 step 3, UF-ADM-11).
 * Blocking stops sessions, refresh tokens and connectors, so the dialog says so.
 */
export function BlockActions({ userId, name, blocked }: { userId: string; name: string; blocked: boolean }) {
  const t = useT("account")
  const [revokeOpen, setRevokeOpen] = useState(false)
  const [blockOpen, setBlockOpen] = useState(false)

  const revoke = useAdminMutation({
    mutationFn: () => postAdminUserSessionsRevoke(userId),
    invalidate: userInvalidations(),
    success: t("sessionsRevoked"),
    onSuccess: () => setRevokeOpen(false),
  })
  const block = useAdminMutation({
    mutationFn: (reason: string) => postAdminUserBlock(userId, { reason }),
    invalidate: userInvalidations(),
    success: t("blocked", { name }),
    onSuccess: () => setBlockOpen(false),
  })
  const unblock = useAdminMutation({
    mutationFn: () => postAdminUserUnblock(userId),
    invalidate: userInvalidations(),
    success: t("unblocked", { name }),
  })

  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="outline" className={TOUCH} onClick={() => setRevokeOpen(true)}>
        {t("revokeSessions")}
      </Button>
      {blocked ? (
        <Button
          type="button"
          variant="outline"
          className={TOUCH}
          disabled={unblock.isPending}
          onClick={() => unblock.mutate()}
        >
          {t("unblock")}
        </Button>
      ) : (
        <Button type="button" variant="destructive" className={TOUCH} onClick={() => setBlockOpen(true)}>
          {t("block")}
        </Button>
      )}
      <ConfirmDialog
        open={revokeOpen}
        onOpenChange={setRevokeOpen}
        title={t("revokeTitle", { name })}
        description={t("revokeDescription")}
        confirmLabel={t("revokeSessions")}
        loading={revoke.isPending}
        onConfirm={() => revoke.mutate()}
      />
      <ReasonDialog
        open={blockOpen}
        onOpenChange={setBlockOpen}
        title={t("blockTitle", { name })}
        description={t("blockDescription")}
        reasonLabel={t("reason")}
        confirmLabel={t("block")}
        loading={block.isPending}
        onSubmit={(reason) => block.mutate(reason)}
      />
    </div>
  )
}
