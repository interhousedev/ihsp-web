"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, Input, LoadingButton, ResponsiveDialog } from "@ihsp/ui"
import { useState, type FormEvent } from "react"
import { toast } from "sonner"
import { useAssignmentMutations } from "../api"

/** POST /staff/assignments: gives a staff member a role for this student (scope `student`). */
export function AssignDialog({ studentId }: { studentId: string }) {
  const t = useT("staff")
  const errorMessage = useErrorMessage()
  const { assign } = useAssignmentMutations()
  const [open, setOpen] = useState(false)
  const [userId, setUserId] = useState("")
  const [roleId, setRoleId] = useState("")

  async function submit(event: FormEvent) {
    event.preventDefault()
    try {
      await assign.mutateAsync({
        user_id: userId.trim(),
        staff_role_id: roleId.trim(),
        scope_kind: "student",
        scope_ref: studentId,
      })
      toast.success(t("assign.done"))
      setOpen(false)
      setUserId("")
      setRoleId("")
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        {t("assign.open")}
      </Button>
      <ResponsiveDialog
        open={open}
        onOpenChange={setOpen}
        title={t("assign.title")}
        onSubmit={submit}
        footer={
          <LoadingButton type="submit" loading={assign.isPending} disabled={!userId.trim() || !roleId.trim()}>
            {t("assign.submit")}
          </LoadingButton>
        }
      >
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            {t("assign.userId")}
            <Input value={userId} onChange={(event) => setUserId(event.target.value)} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {t("assign.roleId")}
            <Input value={roleId} onChange={(event) => setRoleId(event.target.value)} />
          </label>
        </div>
      </ResponsiveDialog>
    </>
  )
}
