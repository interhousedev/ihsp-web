"use client"

import { getApiClient } from "@ihsp/api"
import { useLocale, useT } from "@ihsp/i18n"
import { Button, Icons, Label, Textarea } from "@ihsp/ui"
import { useMutation } from "@tanstack/react-query"
import { useState, type ReactNode } from "react"
import { useDictation } from "./use-dictation"

const SPEECH_LANG: Record<string, string> = { en: "en-US", ru: "ru-RU", uz: "uz-UZ" }

export type VoiceFieldSpec = {
  key: string
  label: string
  kind?: "text" | "number" | "choice"
  options?: string[]
  max_length?: number
}

type VoiceFillOut = { values: Record<string, string> }

/** POST /voice-fill: the transcript and the field schema in, the values the person's words support out. */
export function useVoiceFill(form: string, fields: VoiceFieldSpec[]) {
  return useMutation({
    mutationFn: (transcript: string) =>
      getApiClient().post<VoiceFillOut>("/v1/admission/voice-fill", {
        form,
        transcript,
        fields: fields.map((f) => ({ kind: "text", options: [], ...f })),
      }),
  })
}

/**
 * "Talk in voice" for any form. Idle: a button above the form (`children`). In voice mode the form collapses and the
 * person sees the questions and a big microphone with the live transcript; where the browser has no recognizer a
 * textarea takes the typed answer instead. Finishing sends the text with `fields` to the server and `onFill` gets
 * the values found; the form is back for manual edits.
 */
export function VoiceFill({
  form,
  questions,
  fields,
  onFill,
  children,
}: {
  form: string
  questions: string[]
  fields: VoiceFieldSpec[]
  onFill: (values: Record<string, string>) => void
  children: ReactNode
}) {
  const t = useT("voiceFill")
  const locale = useLocale()
  const [voice, setVoice] = useState(false)
  const [text, setText] = useState("")
  const [interim, setInterim] = useState("")
  const fill = useVoiceFill(form, fields)
  const dictation = useDictation(
    SPEECH_LANG[locale] ?? "en-US",
    (p) => setText((v) => `${v}${v && !/\s$/.test(v) ? " " : ""}${p.trim()}`),
    setInterim,
  )

  function open() {
    setVoice(true)
    setText("")
    setInterim("")
    fill.reset()
    if (dictation.supported) dictation.start()
  }
  function close() {
    dictation.stop()
    setInterim("")
    setVoice(false)
  }
  function done() {
    dictation.stop()
    const spoken = `${text} ${interim}`.trim()
    if (!spoken) return
    fill.mutate(spoken, {
      onSuccess: (out) => {
        onFill(out.values)
        setVoice(false)
        setInterim("")
      },
    })
  }

  if (!voice) {
    return (
      <div className="flex flex-col gap-4">
        <Button type="button" variant="outline" className="min-h-11 self-start" onClick={open}>
          <Icons.microphone aria-hidden />
          {t("talk")}
        </Button>
        {children}
      </div>
    )
  }

  const shown = `${text} ${interim}`.trim()
  return (
    <section
      className="bg-card flex flex-col items-center gap-4 rounded-card border p-4 text-center"
      aria-label={t("title")}
      data-testid="voice-fill-mode"
    >
      <h3 className="font-medium">{t("title")}</h3>
      <ol className="flex w-full max-w-prose list-decimal flex-col gap-1 pl-6 text-left">
        {questions.map((q) => (
          <li key={q}>{q}</li>
        ))}
      </ol>
      {dictation.supported ? (
        <>
          <Button
            type="button"
            size="lg"
            aria-pressed={dictation.listening}
            aria-label={dictation.listening ? t("stop") : t("resume")}
            className={`size-20 rounded-full ${dictation.listening ? "animate-pulse" : ""}`}
            onClick={dictation.listening ? dictation.stop : dictation.start}
          >
            <Icons.microphone className="size-8" aria-hidden />
          </Button>
          <p className="text-muted-foreground text-sm" aria-live="polite">
            {dictation.listening ? t("listening") : t("paused")}
          </p>
          <p className="min-h-12 w-full max-w-prose whitespace-pre-wrap text-left" data-testid="voice-transcript">
            {shown || t("placeholder")}
          </p>
        </>
      ) : (
        <div className="flex w-full max-w-prose flex-col gap-1.5 text-left">
          <Label htmlFor="voice-fill-typed">{t("typedLabel")}</Label>
          <Textarea
            id="voice-fill-typed"
            rows={6}
            value={text}
            placeholder={t("typedHint")}
            onChange={(e) => setText(e.target.value)}
          />
        </div>
      )}
      {fill.isError ? (
        <p role="alert" className="text-destructive text-sm">
          {t("error")}
        </p>
      ) : null}
      <div className="flex flex-wrap justify-center gap-2">
        <Button type="button" className="min-h-11" disabled={fill.isPending || !shown} onClick={done}>
          <Icons.sparkles aria-hidden />
          {fill.isPending ? t("filling") : t("done")}
        </Button>
        <Button type="button" variant="outline" className="min-h-11" onClick={close}>
          {t("cancel")}
        </Button>
      </div>
    </section>
  )
}
