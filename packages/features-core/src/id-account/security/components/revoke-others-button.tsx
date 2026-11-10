"use client"

import { keys, revokeOtherSessions } from "@ihsp/api"
import { Button, ConfirmDialog } from "@ihsp/ui"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { ErrorAlert } from "../../shared/components/error-alert"
import { useTr } from "../../shared/hooks/use-tr"

/** UF-ID-11 step 2: **Log out everywhere else**, with a confirmation. */
export function RevokeOthersButton({ disabled }: { disabled?: boolean }) {
  const t = useTr()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const mutation = useMutation({
    mutationFn: () => revokeOtherSessions(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: keys.id.sessions() })
      setOpen(false)
    },
  })
  return (
    <>
      <Button type="button" variant="outline" className="h-11" disabled={disabled} onClick={() => setOpen(true)}>
        {t("security.sessions.revokeOthers")}
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={t("security.sessions.revokeOthersTitle")}
        description={t("security.sessions.revokeOthersDescription")}
        confirmLabel={t("security.sessions.revokeOthers")}
        destructive
        loading={mutation.isPending}
        onConfirm={() => mutation.mutate()}
      >
        <ErrorAlert error={mutation.error} />
      </ConfirmDialog>
    </>
  )
}
