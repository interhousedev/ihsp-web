"use client"

import { useT } from "@ihsp/i18n"
import { Button, Icons } from "@ihsp/ui"
import { AiTabCard } from "@/components/ai-tab-card"
import type { ReactNode } from "react"
import { useCoach, type CoachOutline, type CoachQuestions, type PlanSection } from "../api"
import { CoachError } from "./coach-error"

function Helper({
  label,
  hint,
  pending,
  disabled,
  onRun,
  error,
  children,
}: {
  label: string
  hint: string
  pending: boolean
  disabled?: boolean
  onRun: () => void
  error: unknown
  children: ReactNode
}) {
  const t = useT("essays")
  return (
    <AiTabCard label={t("coach.tab")} icon={<Icons.sparkles aria-hidden />} className="gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-muted-foreground text-sm">{hint}</p>
        <Button type="button" size="sm" variant="outline" disabled={pending || disabled} onClick={onRun}>
          <Icons.sparkles aria-hidden />
          {label}
        </Button>
      </div>
      <CoachError error={error} />
      {children}
    </AiTabCard>
  )
}

/**
 * The AI coach asks questions, and proposes an outline; it never writes
 * the essay. Each helper runs on the last saved text, so the editor saves before calling it.
 */
export function CoachPanel({
  essayId,
  beforeRun,
  onUseOutline,
}: {
  essayId: string
  beforeRun: () => Promise<unknown>
  onUseOutline: (plan: PlanSection[]) => void
}) {
  const t = useT("essays")
  const brainstorm = useCoach<CoachQuestions>(essayId, "brainstorm")
  const outline = useCoach<CoachOutline>(essayId, "outline")
  const run = (m: { mutate: () => void }) =>
    void beforeRun().then(
      () => m.mutate(),
      () => undefined,
    )
  return (
    <section className="flex flex-col gap-3" aria-label={t("coach.title")}>
      <p className="text-muted-foreground text-xs">{t("coach.note")}</p>
      <Helper
        label={t("coach.brainstorm")}
        hint={t("coach.brainstormHint")}
        pending={brainstorm.isPending}
        onRun={() => run(brainstorm)}
        error={brainstorm.error}
      >
        {brainstorm.data ? (
          <ul className="list-disc pl-5 text-sm animate-in fade-in">
            {brainstorm.data.questions.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ul>
        ) : null}
      </Helper>
      <Helper
        label={t("coach.outline")}
        hint={t("coach.outlineHint")}
        pending={outline.isPending}
        onRun={() => run(outline)}
        error={outline.error}
      >
        {outline.data ? (
          <div className="flex flex-col gap-2 animate-in fade-in">
            <ol className="list-decimal pl-5 text-sm">
              {outline.data.sections.map((s) => (
                <li key={s.heading}>
                  <span className="font-medium">{s.heading}</span>{" "}
                  <span className="text-muted-foreground">· {s.share_percent}%</span>
                  {s.note ? <p className="text-muted-foreground">{s.note}</p> : null}
                </li>
              ))}
            </ol>
            <Button
              type="button"
              size="sm"
              className="self-start"
              onClick={() => onUseOutline(outline.data.sections.map(({ heading, note }) => ({ heading, note })))}
            >
              {t("coach.useOutline")}
            </Button>
          </div>
        ) : null}
      </Helper>
    </section>
  )
}
