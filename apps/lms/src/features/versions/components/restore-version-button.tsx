"use client"

import { keys, postLmsCourseVersionRestore, type CourseDraft } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Alert, AlertDescription, Button, ConfirmDialog, Icons } from "@ihsp/ui"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { LinkButton } from "../../shared/components/link-button"
import { hrefs } from "../../shared/utils/hrefs"

/** Restore copies a version's outline and steps into the draft as pending changes; history is never rewritten (LMS-11). */
export function RestoreVersionButton({ courseId, number }: { courseId: string; number: number }) {
  const t = useT("versions")
  const errorMessage = useErrorMessage()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)

  const restore = useMutation<CourseDraft, unknown, void>({
    mutationFn: () => postLmsCourseVersionRestore(courseId, number),
    onSuccess: (draft) => {
      queryClient.setQueryData(keys.lms.draft(courseId), draft)
      void queryClient.invalidateQueries({ queryKey: keys.lms.pending(courseId) })
      setOpen(false)
    },
  })

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)} className="min-h-11 md:min-h-7">
        {t("restore")}
      </Button>
      {restore.isSuccess ? (
        <Alert role="status" className="basis-full">
          <Icons.circleCheck aria-hidden />
          <AlertDescription className="flex flex-wrap items-center gap-2">
            <span>{t("restored")}</span>
            <LinkButton href={hrefs.publish(courseId)} variant="link" size="sm">
              {t("reviewPending")}
            </LinkButton>
          </AlertDescription>
        </Alert>
      ) : null}
      {restore.isError ? (
        <Alert variant="destructive" className="basis-full">
          <AlertDescription>{errorMessage(restore.error)}</AlertDescription>
        </Alert>
      ) : null}
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={t("restoreTitle", { number })}
        description={t("restoreDescription")}
        confirmLabel={t("restore")}
        loading={restore.isPending}
        onConfirm={() => restore.mutate()}
      />
    </>
  )
}
