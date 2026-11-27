"use client"

import { useT } from "@ihsp/i18n"
import { Button } from "@ihsp/ui"
import { useMutation } from "@tanstack/react-query"
import { explainCoachMistake, openCoachSession } from "../../duo-coach/coach-api"

/** "Explain my mistake": asks the AI coach why this answer of the learner is wrong; shown only when answers are allowed. */
export function ExplainMistake({ stepId, blockId, answer }: { stepId: string; blockId: string; answer: string }) {
  const t = useT("test")
  const explain = useMutation({
    mutationFn: async () => {
      const session = await openCoachSession(stepId, "wrong_answer", blockId)
      return explainCoachMistake(session.id, answer)
    },
  })
  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="self-start"
        disabled={explain.isPending}
        onClick={() => explain.mutate()}
      >
        {explain.isPending ? t("explaining") : t("explainMistake")}
      </Button>
      {explain.data ? (
        <p className="bg-muted rounded-md p-2" role="status">
          {explain.data.message}
        </p>
      ) : null}
      {explain.isError ? <p className="text-destructive">{t("explainUnavailable")}</p> : null}
    </div>
  )
}
