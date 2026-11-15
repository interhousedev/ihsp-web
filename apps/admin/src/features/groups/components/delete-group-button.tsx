"use client"

import { deleteAdminGroup, isApiError, keys } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Alert, AlertDescription, Button, ConfirmDialog, Icons, Input, Label } from "@ihsp/ui"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { useAdminMutation } from "../../shared/hooks/use-admin-mutation"

/**
 * Danger action of the group page. The dialog says the students are detached, not deleted, and the confirm button
 * stays disabled until the group name is typed. On success the list is refreshed and the page goes back to it. A 404
 * means the group is already gone: the error stays in the dialog and closing it leads to the list.
 */
export function DeleteGroupButton({ groupId, groupName }: { groupId: string; groupName: string }) {
  const t = useT("groups.delete")
  const errorMessage = useErrorMessage()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [typed, setTyped] = useState("")
  const busy = useRef(false)
  const errorRef = useRef<HTMLDivElement>(null)
  const remove = useAdminMutation({
    mutationFn: () => deleteAdminGroup(groupId),
    invalidate: [keys.admin.groups.all()],
    success: t("done", { name: groupName }),
    onSuccess: () => {
      setOpen(false)
      router.push("/groups/")
    },
    inlineError: true,
  })
  const matches = typed.trim() === groupName
  const gone = remove.isError && isApiError(remove.error) && remove.error.status === 404

  // The confirm button is disabled while the request runs, which drops the focus; the error takes it over.
  useEffect(() => {
    if (remove.isError) errorRef.current?.focus()
  }, [remove.isError])

  function confirm() {
    if (busy.current) return
    busy.current = true
    remove.mutate(undefined, {
      onError: () => {
        busy.current = false
      },
    })
  }

  function onOpenChange(next: boolean) {
    setOpen(next)
    if (!next) {
      busy.current = false
      setTyped("")
      remove.reset()
      if (gone) router.push("/groups/")
    }
  }

  return (
    <>
      <Button type="button" variant="destructive" className="min-h-11 md:min-h-8" onClick={() => setOpen(true)}>
        <Icons.trash aria-hidden />
        {t("action")}
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={onOpenChange}
        title={t("title", { name: groupName })}
        description={t("description")}
        confirmLabel={t("submit")}
        cancelLabel={t("keep")}
        destructive
        loading={remove.isPending}
        confirmDisabled={!matches}
        onConfirm={confirm}
      >
        <div className="flex min-w-0 flex-col gap-2">
          <Label htmlFor="delete-group-name" className="block leading-normal [overflow-wrap:anywhere]">
            {t("confirmLabel", { name: groupName })}
          </Label>
          <Input
            id="delete-group-name"
            value={typed}
            autoComplete="off"
            className="min-h-11 md:min-h-8"
            onChange={(event) => setTyped(event.target.value)}
          />
        </div>
        {remove.isError ? (
          <Alert ref={errorRef} tabIndex={-1} variant="destructive" role="alert" className="[overflow-wrap:anywhere]">
            <AlertDescription>{errorMessage(remove.error)}</AlertDescription>
          </Alert>
        ) : null}
      </ConfirmDialog>
    </>
  )
}
