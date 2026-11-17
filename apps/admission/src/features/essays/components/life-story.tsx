"use client"

import { useLocale, useT } from "@ihsp/i18n"
import { Button, Icons, Label, Textarea } from "@ihsp/ui"
import { useState } from "react"
import { AiTabCard } from "@/components/ai-tab-card"
import { useLifeStory } from "../api"
import { CoachError } from "./coach-error"
import { useDictation } from "./use-dictation"

const SPEECH_LANG: Record<string, string> = { en: "en-US", ru: "ru-RU", uz: "uz-UZ" }

function Group({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null
  return (
    <div className="flex flex-col gap-1">
      <h4 className="font-medium">{title}</h4>
      <ul className="list-disc pl-5">
        {items.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
    </div>
  )
}

/** Free writing about one's life, typed or dictated; the AI names what drives the student and what to support or leave out. */
export function LifeStory() {
  const t = useT("essays")
  const locale = useLocale()
  const [text, setText] = useState("")
  const reading = useLifeStory()
  const dictation = useDictation(SPEECH_LANG[locale] ?? "en-US", (p) =>
    setText((v) => `${v}${v && !/\s$/.test(v) ? " " : ""}${p.trim()}`),
  )
  return (
    <section className="flex flex-col gap-3" aria-label={t("life.title")}>
      <div className="flex flex-col gap-1">
        <Label htmlFor="life-story-text">{t("life.label")}</Label>
        <Textarea id="life-story-text" rows={10} value={text} onChange={(e) => setText(e.target.value)} />
      </div>
      <div className="flex flex-wrap gap-2">
        {dictation.supported ? (
          <Button
            type="button"
            variant="outline"
            aria-pressed={dictation.listening}
            onClick={dictation.listening ? dictation.stop : dictation.start}
          >
            <Icons.microphone aria-hidden />
            {dictation.listening ? t("life.dictateStop") : t("life.dictate")}
          </Button>
        ) : null}
        <Button type="button" disabled={reading.isPending || !text.trim()} onClick={() => reading.mutate(text)}>
          <Icons.sparkles aria-hidden />
          {t("life.run")}
        </Button>
      </div>
      <CoachError error={reading.error} />
      {reading.data ? (
        <AiTabCard
          label={t("life.result")}
          icon={<Icons.sparkles aria-hidden />}
          className="gap-3 text-sm animate-in fade-in"
        >
          <Group title={t("life.drivers")} items={reading.data.drivers} />
          <Group title={t("life.support")} items={reading.data.support} />
          <Group title={t("life.leaveOut")} items={reading.data.leave_out} />
          <Group title={t("life.ideas")} items={reading.data.ideas} />
        </AiTabCard>
      ) : null}
    </section>
  )
}
