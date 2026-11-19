"use client"

import { useT } from "@ihsp/i18n"
import { Icons } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { careerPlanQuery } from "../../career/api"

const FIELD_HREF = "/career/?tab=field"

/** The study fields from the career plan: a read-only chip, or a banner asking the student to choose one. */
export function FieldFocus() {
  const t = useT("chooser")
  const plan = useQuery(careerPlanQuery())
  const labels = plan.data?.study_focus?.labels ?? []
  if (!plan.data) return null
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
    <p className="bg-muted inline-flex w-fit max-w-full flex-wrap items-center gap-x-2 rounded-full px-3 py-1.5 text-sm">
      <Icons.search aria-hidden className="size-4" />
      <span>{t("fieldFocus.chip", { labels: labels.join(", ") })}</span>
      <Link href={FIELD_HREF} className="text-primary font-medium underline">
        {t("fieldFocus.change")}
      </Link>
    </p>
  )
}
