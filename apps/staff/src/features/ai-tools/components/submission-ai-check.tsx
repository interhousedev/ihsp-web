"use client"

import { useT } from "@ihsp/i18n"
import { Button, IconLoader, IconSparkles, StateView } from "@ihsp/ui"
import { useWorkCheck } from "../hooks/use-ai-tools"
import { NotebookSaved } from "./saved-to"
import { WorkCheckResultView } from "./work-check-result"

/**
 * "Check the work" on one homework submission: the server reads the comment and every attached file by `submissionId`,
 * the criteria and AI signs show inline under the row, and the result is always stored in the subject notebook of the
 * lesson. Only the teacher sees it.
 */
export function SubmissionAiCheck({ submissionId, fileCount }: { submissionId: string; fileCount: number }) {
  const t = useT("aiTools")
  const { result, pending, error, run } = useWorkCheck()
  const label = fileCount > 0 ? t("workCheck.checkedFiles", { count: fileCount }) : t("workCheck.checkedComment")
  return (
    <div className="flex flex-col gap-3 pt-1">
      {result ? null : (
        <Button type="button" variant="outline" size="sm" className="self-start" disabled={pending} onClick={() => run({ submissionId })}>
          {pending ? <IconLoader className="animate-spin" aria-hidden /> : <IconSparkles aria-hidden />}
          {pending ? t("workCheck.checking") : t("workCheck.inline")}
        </Button>
      )}
      {pending ? <StateView state="loading" /> : null}
      {error ? <p className="text-destructive text-sm">{t("workCheck.failed")}</p> : null}
      {result ? (
        <div className="bg-muted/40 rounded-card flex flex-col gap-3 p-4">
          <WorkCheckResultView result={result} source={label} />
          <NotebookSaved destination={t("workCheck.lessonNotebook")} />
        </div>
      ) : null}
    </div>
  )
}
