"use client"

import { Button } from "@ihsp/ui"
import Link from "next/link"
import type { AdmissionPreferences as Preferences } from "@ihsp/api"
import { sentenceValues, tagLabel, type QuestionSources } from "../questions"
import { TagChips } from "./tag-chips"

type Translate = (key: string, values?: Record<string, string>) => string

/** "Your tags": the chips, the one-sentence profile and the way on to the swipe page. */
export function AlgorithmSummary({
  preferences,
  sources,
  t,
  onEdit,
}: {
  preferences: Preferences
  sources: QuestionSources
  t: Translate
  onEdit: () => void
}) {
  const { answers } = preferences
  const major = sources.majors.find((item) => item.value === answers.major)?.label
  const budget = answers.budget && answers.budget !== "any" ? t(`summary.budgetPhrase.${answers.budget}`) : undefined
  const region = answers.region?.length ? answers.region.map((code) => sources.regionName(code)).join(", ") : undefined
  return (
    <section className="flex flex-col gap-6" aria-labelledby="algorithm-summary-title">
      <header className="flex flex-col gap-2">
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{t("summary.eyebrow")}</p>
        <h2 id="algorithm-summary-title" className="text-2xl font-semibold tracking-tight md:text-3xl">
          {t("summary.title")}
        </h2>
      </header>
      <p className="text-lg md:text-xl">{t("summary.sentence", sentenceValues({ major, budget, region }))}</p>
      <TagChips tags={preferences.tags.map((tag) => ({ key: tag, label: tagLabel(tag, t, sources) }))} />
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Button type="button" variant="outline" onClick={onEdit}>
          {t("summary.edit")}
        </Button>
        <Button render={<Link href="/colleges/discover/" />} nativeButton={false}>
          {t("summary.cta")}
        </Button>
      </div>
    </section>
  )
}
