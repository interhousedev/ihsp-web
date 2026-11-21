"use client"

import { formatDate, useErrorMessage, useLocale, useT } from "@ihsp/i18n"
import { Button, cn, Icons, Label, Textarea } from "@ihsp/ui"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { CoachError } from "../coach-error"
import { useDictation } from "../use-dictation"
import { useEvaluatePractice, useSavePractice, type PracticeEntry, type PracticeToday } from "../../flow/api"

const SAVE_DELAY = 1000
const SPEECH_LANG: Record<string, string> = { en: "en-US", ru: "ru-RU", uz: "uz-UZ" }
const countWords = (text: string) => text.trim().split(/\s+/).filter(Boolean).length

/** A finished day, read-only: its date, theme and text. */
export function PastDay({ entry }: { entry: PracticeEntry }) {
  const t = useT("essayPractice")
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
      <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
        {formatDate(entry.day, undefined, { day: "numeric", month: "long" })}
      </p>
      <h2 className="text-xl font-semibold">{entry.theme}</h2>
      <p
        className="min-h-0 flex-1 overflow-y-auto text-sm whitespace-pre-wrap [scrollbar-gutter:stable]"
        data-testid="practice-past-body"
      >
        {entry.body}
      </p>
      <p className="text-muted-foreground text-sm">{t("words", { count: entry.word_count })}</p>
    </div>
  )
}

/** Today's prompt and a textarea that fills the column; the text saves itself, the button asks the AI coach. */
export function PracticeWriter({ today, onScored }: { today: PracticeToday; onScored: () => void }) {
  const t = useT("essayPractice")
  const tf = useT("essayFlow")
  const errorMessage = useErrorMessage()
  const locale = useLocale()
  const save = useSavePractice()
  const evaluate = useEvaluatePractice()
  const [text, setText] = useState<string | null>(null)
  const saved = today.entry?.body ?? ""
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
  const words = countWords(body)
  const status = save.isPending ? "saving" : dirty ? "pending" : words > 0 ? "saved" : "idle"
  const evaluateNow = async () => {
    clearTimeout(timer.current)
    if (dirty && text !== null) await save.mutateAsync(text)
    evaluate.mutate(undefined, { onSuccess: onScored })
  }
  const action = (
    <Button
      type="button"
      disabled={words < 5 || evaluate.isPending || save.isPending}
      onClick={() => void evaluateNow()}
      className="min-h-11 lg:min-h-9"
    >
      <Icons.sparkles aria-hidden />
      {evaluate.isPending
        ? tf("practice.evaluating")
        : tf(today.entry?.evaluation ? "practice.reevaluate" : "practice.evaluate")}
    </Button>
  )
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
      <div className="flex flex-col gap-1">
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          {t("todayLabel", { date: formatDate(today.day, undefined, { day: "numeric", month: "long" }) })}
        </p>
        <h2 className="text-xl font-semibold">{today.theme}</h2>
        <p className="text-muted-foreground text-sm">{today.prompt}</p>
      </div>
      <Label htmlFor="practice-body" className="sr-only">
        {tf("practice.label")}
      </Label>
      <Textarea
        id="practice-body"
        maxLength={6000}
        value={body}
        placeholder={tf("practice.placeholder")}
        onChange={(e) => setText(e.target.value)}
        className="min-h-[40dvh] flex-1 resize-none lg:min-h-0"
      />
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="text-muted-foreground" aria-live="polite" data-testid="practice-status">
          {tf(`practice.status.${status}`)} · {tf("practice.wordCount", { count: words })}
        </span>
        <div className="flex gap-2">
          {dictation.supported ? (
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={tf(dictation.listening ? "practice.dictateStop" : "practice.dictate")}
              title={tf(dictation.listening ? "practice.dictateStop" : "practice.dictate")}
              onClick={dictation.listening ? dictation.stop : dictation.start}
              aria-pressed={dictation.listening}
              className={cn("size-11 lg:size-9")}
            >
              <Icons.microphone aria-hidden />
            </Button>
          ) : null}
          <span className="hidden lg:inline-flex">{action}</span>
        </div>
      </div>
      <CoachError error={evaluate.error} />
      <div className="bg-background/95 border-hairline sticky bottom-[calc(var(--bottom-nav-height,0px)+var(--safe-bottom,0px))] z-10 -mx-4 -mb-4 flex border-t p-3 backdrop-blur lg:hidden">
        <span className="flex w-full [&>button]:w-full">{action}</span>
      </div>
    </div>
  )
}
