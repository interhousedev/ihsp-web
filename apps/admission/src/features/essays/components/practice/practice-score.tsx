"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, Icons, Pill } from "@ihsp/ui"
import { toast } from "sonner"
import { useAddIdea, useIdeas } from "../../api"
import type { PracticeEntry } from "../../flow/api"

/** The sum of the four criteria, out of 20. */
export const totalOf = (entry: PracticeEntry | null | undefined): number | null =>
  entry?.evaluation && entry.evaluation.scores.length > 0 ? entry.evaluation.scores.reduce((n, s) => n + s.score, 0) : null

/** The score column: the total, one row per criterion, what works, what to try and the idea seeds. */
export function PracticeScore({ entry, canSeed }: { entry: PracticeEntry | null | undefined; canSeed: boolean }) {
  const t = useT("essayPractice")
  const tf = useT("essayFlow")
  const errorMessage = useErrorMessage()
  const add = useAddIdea()
  const ideas = useIdeas()
  const known = new Set((ideas.data?.items ?? []).map((i) => i.body))
  const ev = entry?.evaluation
  if (!ev)
    return (
      <p className="text-muted-foreground p-4 text-sm" data-testid="practice-score-empty">
        {t("scoreEmpty")}
      </p>
    )
  const total = totalOf(entry)
  return (
    <div className="flex flex-col gap-4 p-4" data-testid="practice-evaluation">
      <div className="flex items-baseline gap-2">
        <span className="text-4xl font-semibold tabular-nums" data-testid="practice-total">
          {total}
        </span>
        <span className="text-muted-foreground text-lg">/ {ev.scores.length * 5}</span>
      </div>
      <ul className="flex flex-col gap-3">
        {ev.scores.map((s) => (
          <li key={s.key} className="flex min-w-0 flex-col gap-1 text-sm">
            <span className="flex items-center justify-between gap-2 font-medium">
              {tf(`practice.score.${s.key}`)}
              <span aria-label={tf("practice.scoreOf", { score: s.score })} className="text-muted-foreground tabular-nums">
                {s.score}/5
              </span>
            </span>
            <span aria-hidden className="bg-muted h-1.5 overflow-hidden rounded-full">
              <span className="bg-primary block h-full" style={{ width: `${(s.score / 5) * 100}%` }} />
            </span>
            <span className="text-muted-foreground">{s.comment}</span>
          </li>
        ))}
      </ul>
      <p className="text-sm">{ev.summary}</p>
      {ev.praise.length ? (
        <div className="flex flex-col gap-1 text-sm">
          <h3 className="font-medium">{tf("practice.praise")}</h3>
          <ul className="list-disc pl-5">
            {ev.praise.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {ev.try_next.length ? (
        <div className="flex flex-col gap-1 text-sm">
          <h3 className="font-medium">{tf("practice.tryNext")}</h3>
          <ul className="list-disc pl-5">
            {ev.try_next.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {canSeed && ev.idea_seeds.length ? (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-medium">{tf("practice.seeds")}</h3>
          <ul className="flex flex-col gap-2">
            {ev.idea_seeds.map((seed) => (
              <li key={seed} className="flex min-w-0 flex-wrap items-center justify-between gap-2 text-sm">
                <span className="min-w-0 flex-1 break-words">{seed}</span>
                {known.has(seed) ? (
                  <Pill tone="success">{tf("practice.seedAdded")}</Pill>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={add.isPending}
                    onClick={() =>
                      add.mutate({ body: seed, tags: [tf("practice.seedTag")], essay_id: null }, { onError: (error) => toast.error(errorMessage(error)) })
                    }
                  >
                    <Icons.add aria-hidden />
                    {tf("practice.addSeed")}
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
