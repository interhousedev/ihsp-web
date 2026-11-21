"use client"

import { useLocale, useT } from "@ihsp/i18n"
import { Icons } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { ANY } from "../../algorithm/mapping"
import { careerMajorsQuery, careerPlanQuery, pick } from "../../career/api"
import { fetchQuiz, quizKey } from "../../profile/details-api"

const FIELD_HREF = "/career/?tab=field"

/**
 * The student's study-field labels: the career plan's, or else the major answered in the quiz (the quiz and the plan
 * are saved apart, so a fresh quiz answer counts at once). `undefined` while loading.
 */
export function useStudyFocusLabels(): string[] | undefined {
  const locale = useLocale()
  const plan = useQuery(careerPlanQuery())
  const quiz = useQuery({ queryKey: quizKey("algorithm"), queryFn: () => fetchQuiz("algorithm") })
  const majors = useQuery(careerMajorsQuery())
  if (!plan.data) return undefined
  const labels = plan.data.study_focus?.labels ?? []
  if (labels.length > 0) return labels
  const answer = quiz.data?.answers.major
  const codes = (Array.isArray(answer) ? answer : answer ? [answer] : []).filter(
    (code): code is string => typeof code === "string" && code !== "" && code !== ANY,
  )
  return codes.map((code) => {
    const major = majors.data?.items.find((item) => item.code === code)
    return major ? pick(major.name, locale) : code
  })
}

/** The study fields: a read-only chip, or a banner asking the student to choose one. */
export function FieldFocus() {
  const t = useT("chooser")
  const found = useStudyFocusLabels()
  if (!found) return null
  const labels = found
  if (labels.length === 0) {
    return (
      <div role="note" className="bg-muted flex flex-wrap items-center justify-between gap-2 rounded-lg p-3 text-sm">
        <span className="font-medium">{t("fieldFocus.bannerTitle")}</span>
        <Link href={FIELD_HREF} className="text-primary inline-flex min-h-9 items-center font-medium underline">
          {t("fieldFocus.bannerAction")}
        </Link>
      </div>
    )
  }
  return (
    <p className="bg-muted inline-flex w-fit max-w-full min-w-0 items-center gap-x-2 rounded-full px-3 py-1.5 text-sm">
      <Icons.search aria-hidden className="size-4 shrink-0 max-md:hidden" />
      <span className="max-md:hidden">{t("fieldFocus.chip", { labels: labels.join(", ") })}</span>
      <span className="max-w-28 truncate md:hidden">{labels.join(", ")}</span>
      <Link
        href={FIELD_HREF}
        aria-label={t("fieldFocus.change")}
        className="text-primary inline-flex items-center font-medium underline max-md:no-underline"
      >
        <span className="max-md:sr-only">{t("fieldFocus.change")}</span>
        <Icons.edit aria-hidden className="size-4 md:hidden" />
      </Link>
    </p>
  )
}
