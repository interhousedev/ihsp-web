"use client"

import { keys, postLmsCourseVersionRestore, type CourseDraft } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, ConfirmDialog } from "@ihsp/ui"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { hrefs } from "../../shared/utils/hrefs"

/**
 * Restore copies a version's outline and steps into the draft as pending changes; history is never rewritten (LMS-11).
 * The result is a toast with a "Review pending changes" action, so it is seen wherever the user goes next.
 */
export function RestoreVersionButton({ courseId, number }: { courseId: string; number: number }) {
  const t = useT("versions")
  const errorMessage = useErrorMessage()
  const queryClient = useQueryClient()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const restore = useMutation<CourseDraft, unknown, void>({
    mutationFn: () => postLmsCourseVersionRestore(courseId, number),
    onSuccess: (draft) => {
      queryClient.setQueryData(keys.lms.draft(courseId), draft)
      void queryClient.invalidateQueries({ queryKey: keys.lms.pending(courseId) })
      setOpen(false)
      toast.success(t("restored"), {
        action: { label: t("reviewPending"), onClick: () => router.push(hrefs.publish(courseId)) },
      })
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)} className="min-h-11 md:min-h-7">
        {t("restore")}
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={t("restoreTitle", { number })}
        confirmLabel={t("restore")}
        loading={restore.isPending}
        onConfirm={() => restore.mutate()}
      />
    </>
  )
}
