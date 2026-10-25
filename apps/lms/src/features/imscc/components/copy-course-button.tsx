"use client"

import { postLmsCourseCopy, type LmsCourseCopied } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Alert, AlertDescription, ConfirmDialog, LoadingButton } from "@ihsp/ui"
import { useMutation } from "@tanstack/react-query"
import { useState } from "react"
import { LinkButton } from "../../shared/components/link-button"
import { hrefs } from "../../shared/utils/hrefs"

/** "Copy course": after a confirm, copies the draft as "<title> (copy)" owned by the caller (course editors). */
export function CopyCourseButton({ courseId }: { courseId: string }) {
  const t = useT("imscc")
  const errorMessage = useErrorMessage()
  const [open, setOpen] = useState(false)
  const copy = useMutation<LmsCourseCopied, unknown, void>({
    mutationFn: () => postLmsCourseCopy(courseId),
    onSettled: () => setOpen(false),
  })
  return (
    <div className="flex flex-col gap-2">
      <LoadingButton
        type="button"
        variant="outline"
        className="min-h-11 self-start md:min-h-8"
        loading={copy.isPending}
        onClick={() => setOpen(true)}
      >
        {t("copy")}
      </LoadingButton>
      <ConfirmDialog
        open={open}
        onOpenChange={(next) => (copy.isPending ? undefined : setOpen(next))}
        title={t("copyTitle")}
        description={t("copyDescription")}
        confirmLabel={t("copyConfirm")}
        loading={copy.isPending}
        onConfirm={() => copy.mutate()}
      />
      {copy.isPending ? (
        <p role="status" className="text-muted-foreground text-sm">
          {t("copying")}
        </p>
      ) : null}
      {copy.isSuccess ? (
        <div role="status" className="flex flex-col gap-2 text-sm">
          <span>{t("copied", { title: copy.data.title })}</span>
          <LinkButton
            href={hrefs.edit(copy.data.course_id)}
            variant="outline"
            className="min-h-11 self-start md:min-h-8"
          >
            {t("openCopy")}
          </LinkButton>
        </div>
      ) : null}
      {copy.isError ? (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage(copy.error)}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  )
}
