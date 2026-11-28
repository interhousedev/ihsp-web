"use client"

import { keys, putAdminGroupHidden } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, ConfirmDialog, Icons } from "@ihsp/ui"
import { useState } from "react"
import { useAdminMutation } from "../../shared/hooks/use-admin-mutation"

/** Hides a group from lists, pickers and standings, or shows it again; nothing is deleted, so a plain confirm is enough. */
export function HideGroupButton({
  groupId,
  groupName,
  hidden,
}: {
  groupId: string
  groupName: string
  hidden: boolean
}) {
  const t = useT(hidden ? "groups.unhide" : "groups.hide")
  const [open, setOpen] = useState(false)
  const toggle = useAdminMutation({
    mutationFn: () => putAdminGroupHidden(groupId, !hidden),
    invalidate: [keys.admin.groups.all()],
    success: () => t("done", { name: groupName }),
    onSuccess: () => setOpen(false),
  })

  return (
    <>
      <Button type="button" variant="outline" className="min-h-11 md:min-h-8" onClick={() => setOpen(true)}>
        {hidden ? <Icons.eye aria-hidden /> : <Icons.eyeOff aria-hidden />}
        {t("action")}
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={t("title", { name: groupName })}
        description={t("description")}
        confirmLabel={t("submit")}
        cancelLabel={t("keep")}
        loading={toggle.isPending}
        onConfirm={() => toggle.mutate()}
      />
    </>
  )
}
