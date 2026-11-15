"use client"

import { postManageCoversBackfill, postManagePagesBackfill } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, ConfirmDialog, IconRefresh } from "@ihsp/ui"
import { useMutation } from "@tanstack/react-query"
import { useState } from "react"
import { toast } from "sonner"

/**
 * **Rebuild covers and text**: queues both library backfills (covers for books without one, stored page text of
 * old items). Both answer `202` without a body, so the toast only says the jobs started.
 */
export function BackfillButton() {
  const t = useT("library.manage.books.backfill")
  const errorMessage = useErrorMessage()
  const [open, setOpen] = useState(false)
  const run = useMutation({
    mutationFn: () => Promise.all([postManageCoversBackfill(), postManagePagesBackfill()]),
    onSuccess: () => {
      setOpen(false)
      toast.success(t("started"))
    },
  })

  return (
    <>
      <Button type="button" variant="outline" className="min-h-11 md:min-h-8" onClick={() => setOpen(true)}>
        <IconRefresh aria-hidden />
        {t("button")}
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (!next) run.reset()
        }}
        title={t("title")}
        description={t("description")}
        confirmLabel={t("confirm")}
        loading={run.isPending}
        onConfirm={() => run.mutate()}
      >
        {run.isError ? (
          <p role="alert" className="text-destructive text-sm">
            {errorMessage(run.error)}
          </p>
        ) : null}
      </ConfirmDialog>
    </>
  )
}
