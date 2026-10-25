"use client"

import { useOpenCourseNotebook } from "@ihsp/features-core"
import { useT } from "@ihsp/i18n"
import { Alert, AlertDescription, Button } from "@ihsp/ui"
import { useRouter } from "next/navigation"
import { notebookHref } from "../../notebooks/utils/hrefs"

/**
 * "Course notebook": get-or-create the student's own notebook of the course (its materials are the sources) and open
 * it. Shown to enrolled students only; the server answers 404 for anyone else.
 */
export function CourseNotebookButton({ courseId }: { courseId: string }) {
  const t = useT("course")
  const router = useRouter()
  const open = useOpenCourseNotebook()

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="outline"
        className="min-h-11 self-start"
        disabled={open.isPending}
        onClick={() =>
          open.mutate(courseId, {
            onSuccess: (notebook) => router.push(notebookHref(notebook.id)),
          })
        }
      >
        {t("notebook")}
      </Button>
      {open.isError ? (
        <Alert variant="destructive">
          <AlertDescription>{t("notebookFailed")}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  )
}
