"use client"

import { useT } from "@ihsp/i18n"
import { Button, Icons, Label, Textarea } from "@ihsp/ui"
import { useState } from "react"
import { AiTabCard } from "@/components/ai-tab-card"
import { REVIEW_MODES, useReview, type ReviewMode } from "../api"
import { CoachError } from "./coach-error"

/** Feedback on the saved draft: overall, sentence by sentence, both, or on a passage the student pastes. */
export function ReviewPanel({ essayId, beforeRun }: { essayId: string; beforeRun: () => Promise<unknown> }) {
  const t = useT("essays")
  const review = useReview(essayId)
  const [mode, setMode] = useState<ReviewMode>("overall")
  const [excerpt, setExcerpt] = useState("")
  const partialEmpty = mode === "partial" && !excerpt.trim()
  const run = () =>
    void beforeRun().then(
      () => review.mutate({ mode, excerpt: mode === "partial" ? excerpt : "" }),
      () => undefined,
    )
  const data = review.data
  return (
    <AiTabCard label={t("review.tab")} icon={<Icons.sparkles aria-hidden />} className="gap-3">
      <div role="radiogroup" aria-label={t("review.modeLabel")} className="flex flex-wrap gap-2">
        {REVIEW_MODES.map((m) => (
          <Button
            key={m}
            type="button"
            size="sm"
            role="radio"
            aria-checked={mode === m}
            variant={mode === m ? "default" : "outline"}
            onClick={() => setMode(m)}
          >
            {t(`review.mode.${m}`)}
          </Button>
        ))}
      </div>
      {mode === "partial" ? (
        <div className="flex flex-col gap-1">
          <Label htmlFor="review-excerpt">{t("review.excerpt")}</Label>
          <Textarea id="review-excerpt" rows={4} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} />
        </div>
      ) : null}
      <Button type="button" size="sm" className="self-start" disabled={review.isPending || partialEmpty} onClick={run}>
        <Icons.sparkles aria-hidden />
        {t("review.run")}
      </Button>
      <CoachError error={review.error} />
      {data ? (
        <div className="flex flex-col gap-2 text-sm animate-in fade-in">
          {data.summary ? <p>{data.summary}</p> : null}
          {data.strengths.length ? (
            <>
              <h4 className="font-medium">{t("coach.strengths")}</h4>
              <ul className="list-disc pl-5">
                {data.strengths.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </>
          ) : null}
          {data.suggestions.length ? (
            <>
              <h4 className="font-medium">{t("coach.suggestions")}</h4>
              <ul className="list-disc pl-5">
                {data.suggestions.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </>
          ) : null}
          {data.sentences?.length ? (
            <>
              <h4 className="font-medium">{t("review.sentences")}</h4>
              <ul className="flex flex-col gap-2">
                {data.sentences.map((n) => (
                  <li key={n.quote} className="border-hairline rounded-card border p-2">
                    <q className="text-muted-foreground">{n.quote}</q>
                    <p>{n.comment}</p>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </div>
      ) : null}
    </AiTabCard>
  )
}
