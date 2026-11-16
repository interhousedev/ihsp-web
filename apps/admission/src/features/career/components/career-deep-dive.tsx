"use client"

import { useLocale, useT } from "@ihsp/i18n"
import { Button, Icons, StateView } from "@ihsp/ui"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import {
  careerKeys,
  careerQuestionsQuery,
  pick,
  putAnswers,
  putShortlist,
  putSpike,
  suggest,
  type CareerPlan,
} from "../api"
import { VoiceAnswer } from "./voice-answer"

/** Free-text answers (typed or spoken), AI professions and the spike: the deeper tools behind the quiz. */
export function CareerDeepDive({ data }: { data: CareerPlan }) {
  const t = useT("career")
  const locale = useLocale()
  const client = useQueryClient()
  const questions = useQuery(careerQuestionsQuery())
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>(null)
  async function run(action: () => Promise<CareerPlan>) {
    setBusy(true)
    setError(null)
    try {
      client.setQueryData(careerKeys.plan(), await action())
    } catch (e) {
      setError(e)
    } finally {
      setBusy(false)
    }
  }
  return (
    <details className="bg-card rounded-card border p-4">
      <summary className="min-h-11 cursor-pointer text-base font-semibold">{t("deeper")}</summary>
      <div className="mt-4 space-y-8">
        {error != null && <StateView state="error" error={error} />}
        {questions.isError && (
          <StateView state="error" error={questions.error} onRetry={() => void questions.refetch()} />
        )}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">{t("interests")}</h2>
          {questions.data?.items.map((q) => (
            <div key={q.id} className="space-y-2">
              <label htmlFor={q.id}>{pick(q.prompt, locale)}</label>
              <textarea
                id={q.id}
                className="min-h-24 w-full rounded-md border p-3"
                maxLength={600}
                value={answers[q.id] ?? data.answers[q.id] ?? ""}
                onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
              />
              <VoiceAnswer
                questionId={q.id}
                disabled={busy}
                onText={(text) =>
                  setAnswers((previous) => ({
                    ...previous,
                    [q.id]: [previous[q.id] ?? data.answers[q.id], text].filter(Boolean).join(" "),
                  }))
                }
              />
            </div>
          ))}
          <Button
            disabled={busy}
            onClick={() => void run(() => putAnswers({ ...data.answers, ...answers }, data.lock_version))}
          >
            {t("save")}
          </Button>
        </section>
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">{t("professions")}</h2>
          <Button disabled={busy} onClick={() => void run(() => suggest("professions", locale))}>
            <Icons.sparkles aria-hidden />
            {t("suggest")}
          </Button>
          {data.professions.map((p) => (
            <label key={p.title} className="flex gap-3 rounded-md border p-3">
              <input
                type="checkbox"
                disabled={busy}
                checked={p.shortlisted}
                onChange={(e) =>
                  void run(() =>
                    putShortlist(
                      data.professions
                        .filter((item) => (item.title === p.title ? e.target.checked : item.shortlisted))
                        .map((item) => item.title),
                      data.lock_version,
                    ),
                  )
                }
              />
              <span>
                <strong>{p.title}</strong>
                <p>{p.reason}</p>
              </span>
            </label>
          ))}
        </section>
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">{t("spike")}</h2>
          <Button disabled={busy} onClick={() => void run(() => suggest("spike", locale))}>
            {t("suggestSpike")}
          </Button>
          {data.spike && (
            <div className="space-y-2 rounded-md border p-4">
              <h3>{data.spike.title}</h3>
              <p>{data.spike.summary}</p>
              <ul>
                {data.spike.evidence.map((e) => (
                  <li key={e.item_id}>{e.note}</li>
                ))}
              </ul>
              <ul>
                {data.spike.gaps.map((g) => (
                  <li key={g}>{g}</li>
                ))}
              </ul>
              <Button
                disabled={busy || !!data.spike.confirmed_at}
                onClick={() => void run(() => putSpike(data.spike!, data.lock_version))}
              >
                {t(data.spike.confirmed_at ? "confirmed" : "confirm")}
              </Button>
            </div>
          )}
        </section>
      </div>
    </details>
  )
}
