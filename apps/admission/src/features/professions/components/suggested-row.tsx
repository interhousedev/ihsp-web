"use client"

import { useLocale, useT } from "@ihsp/i18n"
import { Button, Icons, Skeleton } from "@ihsp/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { useState } from "react"
import { careerKeys, careerPlanQuery, suggest } from "../../career/api"
import { useQuizMajors } from "../../career/components/career-quiz-dialog"
import { careerMajorsQuery, pick } from "../../career/api"
import { ikigaiQuery, searchProfessionsQuery, type Profession } from "../api"
import { EMPTY_IKIGAI, filledCount, MAX_PICKS, SUGGEST_MIN_CIRCLES } from "../model"

/**
 * "Suits you": up to five professions the model proposes from the ikigai words and the profile (a button, never
 * automatic: it is a model call), cached in the career plan. "Add" resolves the title in the catalogue.
 */
export function SuggestedRow({
  pickedIds,
  pickedFull,
  onAdd,
}: {
  pickedIds: readonly string[]
  pickedFull: boolean
  onAdd: (profession: Profession) => void
}) {
  const t = useT("professions")
  const locale = useLocale()
  const client = useQueryClient()
  const ikigai = useQuery(ikigaiQuery())
  const plan = useQuery(careerPlanQuery())
  const majors = useQuery(careerMajorsQuery())
  const quiz = useQuizMajors()
  const [missing, setMissing] = useState<string | null>(null)
  const run = useMutation({
    mutationFn: () => suggest("professions", locale),
    onSuccess: (data) => client.setQueryData(careerKeys.plan(), data),
  })
  const items = (plan.data?.professions ?? []).slice(0, MAX_PICKS)
  const filled = filledCount(ikigai.data ?? EMPTY_IKIGAI)
  const quizNames = quiz.recommendations.map((r) => {
    const major = majors.data?.items.find((m) => m.code === r.code)
    return major ? pick(major.name, locale) : r.code
  })
  if (filled < SUGGEST_MIN_CIRCLES && items.length === 0 && quizNames.length === 0) return null

  async function addByTitle(title: string) {
    setMissing(null)
    const found = await client.fetchQuery(searchProfessionsQuery(title, locale, 1))
    const hit = found.items[0]
    if (hit) onAdd(hit)
    else setMissing(title)
  }
  return (
    <section aria-label={t("suggest.title")} className="flex min-w-0 flex-col gap-2 border-t pt-2.5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <h2 className="text-sm font-semibold">{t("suggest.title")}</h2>
        {quizNames.length > 0 ? (
          <p className="text-muted-foreground min-w-0 text-xs">
            {t("suggest.byQuiz", { majors: quizNames.join(", ") })}{" "}
            <Link href="/career/" className="text-primary font-medium hover:underline">
              {t("suggest.toField")}
            </Link>
          </p>
        ) : null}
        {filled >= SUGGEST_MIN_CIRCLES ? (
          <Button type="button" variant="ghost" size="sm" className="ms-auto" disabled={run.isPending} onClick={() => run.mutate()}>
            <Icons.sparkles aria-hidden />
            {t(items.length > 0 ? "suggest.again" : "suggest.run")}
          </Button>
        ) : null}
      </div>
      {run.isPending ? <Skeleton className="h-9 w-full rounded-full" aria-busy /> : null}
      {run.isError ? (
        <p role="alert" className="text-destructive text-xs">
          {t("suggest.error")}
        </p>
      ) : null}
      {missing ? (
        <p role="status" className="text-muted-foreground text-xs">
          {t("suggest.notInCatalogue", { title: missing })}
        </p>
      ) : null}
      {items.length > 0 && !run.isPending ? (
        <ul className="flex flex-wrap gap-1.5">
          {items.map((item) => (
            <li key={item.title} className="bg-card flex min-h-9 items-center gap-1 rounded-full border ps-3 pe-1" title={item.reason}>
              <span className="text-sm font-medium">{item.title}</span>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 rounded-full px-2"
                disabled={pickedFull || pickedIds.length >= MAX_PICKS}
                aria-label={t("card.addLabel", { name: item.title })}
                onClick={() => void addByTitle(item.title)}
              >
                <Icons.add aria-hidden className="size-4" />
                {t("card.add")}
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}
