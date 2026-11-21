"use client"

import { useErrorMessage, useLocale, useT } from "@ihsp/i18n"
import { Button, Icons, Label, Pill, Skeleton, StateView, Textarea } from "@ihsp/ui"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { useAddIdea, useIdeas } from "../api"
import { CoachError } from "../components/coach-error"
import { useDictation } from "../components/use-dictation"
import {
  useEvaluatePractice,
  usePracticeHistory,
  usePracticeToday,
  useSavePractice,
  type PracticeEntry,
} from "./api"

const SAVE_DELAY = 1000
const SPEECH_LANG: Record<string, string> = { en: "en-US", ru: "ru-RU", uz: "uz-UZ" }
const countWords = (text: string) => text.trim().split(/\s+/).filter(Boolean).length

function Evaluation({ entry, seeds }: { entry: PracticeEntry; seeds: boolean }) {
  const t = useT("essayFlow")
  const errorMessage = useErrorMessage()
  const add = useAddIdea()
  const ideas = useIdeas()
  const known = new Set((ideas.data?.items ?? []).map((i) => i.body))
  const ev = entry.evaluation
  if (!ev) return null
  return (
    <div className="bg-muted/30 rounded-card animate-in fade-in flex flex-col gap-4 border p-4" data-testid="practice-evaluation">
      <p className="text-sm">{ev.summary}</p>
      <ul className="grid gap-2 sm:grid-cols-2">
        {ev.scores.map((s) => (
          <li key={s.key} className="flex min-w-0 flex-col gap-1 text-sm">
            <span className="flex items-center justify-between gap-2 font-medium">
              {t(`practice.score.${s.key}`)}
              <span aria-label={t("practice.scoreOf", { score: s.score })} className="text-muted-foreground tabular-nums">
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
      <div className="grid gap-4 sm:grid-cols-2">
        {ev.praise.length ? (
          <div className="flex flex-col gap-1 text-sm">
            <h4 className="font-medium">{t("practice.praise")}</h4>
            <ul className="list-disc pl-5">
              {ev.praise.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {ev.try_next.length ? (
          <div className="flex flex-col gap-1 text-sm">
            <h4 className="font-medium">{t("practice.tryNext")}</h4>
            <ul className="list-disc pl-5">
              {ev.try_next.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
      {seeds && ev.idea_seeds.length ? (
        <div className="flex flex-col gap-2">
          <h4 className="text-sm font-medium">{t("practice.seeds")}</h4>
          <ul className="flex flex-col gap-2">
            {ev.idea_seeds.map((seed) => (
              <li key={seed} className="flex min-w-0 flex-wrap items-center justify-between gap-2 text-sm">
                <span className="min-w-0 flex-1 break-words">{seed}</span>
                {known.has(seed) ? (
                  <Pill tone="success">{t("practice.seedAdded")}</Pill>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={add.isPending}
                    onClick={() =>
                      add.mutate(
                        { body: seed, tags: [t("practice.seedTag")], essay_id: null },
                        { onError: (error) => toast.error(errorMessage(error)) },
                      )
                    }
                  >
                    <Icons.add aria-hidden />
                    {t("practice.addSeed")}
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

function History({ today }: { today: string }) {
  const t = useT("essayFlow")
  const query = usePracticeHistory()
  const items = (query.data?.items ?? []).filter((e) => e.day !== today)
  return (
    <section className="flex flex-col gap-2" aria-labelledby="practice-history">
      <h3 id="practice-history" className="text-base font-semibold">
        {t("practice.history")}
      </h3>
      {query.isPending ? (
        <Skeleton className="h-12 w-full" />
      ) : items.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t("practice.historyEmpty")}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((e) => (
            <li key={e.day} className="border-hairline rounded-card border">
              <details className="group">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 px-3 text-sm">
                  <span className="min-w-0 truncate">
                    <span className="font-medium">{e.day}</span> · {e.theme}
                  </span>
                  <span className="text-muted-foreground shrink-0 text-xs">
                    {t("practice.wordCount", { count: e.word_count })}
                  </span>
                </summary>
                <div className="flex flex-col gap-3 border-t p-3">
                  <p className="text-sm whitespace-pre-wrap">{e.body}</p>
                  <Evaluation entry={e} seeds={false} />
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

/** Step 2: a few free minutes on today's theme; the text saves itself, the AI answers as a writing coach. */
export function PracticeStep() {
  const t = useT("essayFlow")
  const errorMessage = useErrorMessage()
  const locale = useLocale()
  const query = usePracticeToday()
  const save = useSavePractice()
  const evaluate = useEvaluatePractice()
  const [text, setText] = useState<string | null>(null)
  const saved = query.data?.entry?.body ?? ""
  const body = text ?? saved
  const dictation = useDictation(SPEECH_LANG[locale] ?? "en-US", (spoken) =>
    setText((v) => {
      const base = v ?? saved
      return `${base}${base && !/\s$/.test(base) ? " " : ""}${spoken.trim()}`
    }),
  )
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const dirty = text !== null && text !== saved

  useEffect(() => {
    if (!dirty || text === null) return
    timer.current = setTimeout(() => save.mutate(text, { onError: (e) => toast.error(errorMessage(e)) }), SAVE_DELAY)
    return () => clearTimeout(timer.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, dirty])

  if (query.isPending) return <StateView state="loading" rows={3} />
  if (query.isError) return <StateView state="error" error={query.error} onRetry={() => void query.refetch()} />
  const today = query.data
  const words = countWords(body)
  const status = save.isPending ? "saving" : dirty ? "pending" : words > 0 ? "saved" : "idle"
  const evaluateNow = async () => {
    clearTimeout(timer.current)
    if (dirty && text !== null) await save.mutateAsync(text)
    evaluate.mutate()
  }
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          {t("practice.today", { day: today.day })}
        </p>
        <h3 className="text-lg font-semibold">{today.theme}</h3>
        <p className="text-muted-foreground text-sm">{today.prompt}</p>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="practice-body">{t("practice.label")}</Label>
        <Textarea
          id="practice-body"
          rows={9}
          maxLength={6000}
          value={body}
          placeholder={t("practice.placeholder")}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="text-muted-foreground" aria-live="polite" data-testid="practice-status">
            {t(`practice.status.${status}`)} · {t("practice.wordCount", { count: words })}
          </span>
          <div className="flex gap-2">
            {dictation.supported ? (
              <Button type="button" variant="outline" size="sm" onClick={dictation.listening ? dictation.stop : dictation.start} aria-pressed={dictation.listening}>
                <Icons.microphone aria-hidden />
                {t(dictation.listening ? "practice.dictateStop" : "practice.dictate")}
              </Button>
            ) : null}
            <Button type="button" size="sm" disabled={words < 5 || evaluate.isPending || save.isPending} onClick={() => void evaluateNow()}>
              <Icons.sparkles aria-hidden />
              {evaluate.isPending ? t("practice.evaluating") : t(today.entry?.evaluation ? "practice.reevaluate" : "practice.evaluate")}
            </Button>
          </div>
        </div>
        <CoachError error={evaluate.error} />
      </div>
      {today.entry ? <Evaluation entry={today.entry} seeds /> : null}
      <History today={today.day} />
    </div>
  )
}
