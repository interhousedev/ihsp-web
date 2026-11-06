"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, Icons } from "@ihsp/ui"
import { useOpenSubjectNotebook } from "../hooks/use-subject-hub"

/** The subject notebook, compact in the page header; an error shows under the button. */
export function SubjectNotebookButton({ subjectId }: { subjectId: string }) {
  const t = useT("subjects.overview")
  const errorMessage = useErrorMessage()
  const open = useOpenSubjectNotebook(subjectId)
  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="outline"
        className="min-h-11 md:min-h-8"
        disabled={open.isPending}
        onClick={() => open.mutate({})}
      >
        <Icons.journal aria-hidden />
        {t("openNotebook")}
      </Button>
      {open.isError ? (
        <p role="alert" className="text-destructive text-sm">
          {errorMessage(open.error)}
        </p>
      ) : null}
    </div>
  )
}
