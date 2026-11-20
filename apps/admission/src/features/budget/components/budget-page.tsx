"use client"

import { useT } from "@ihsp/i18n"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ScholarshipsView } from "../../chooser/components/scholarships-view"
import { BudgetView } from "./budget-view"

/** `/chooser/?step=budget`: the budget, or with `?view=scholarships` the scholarships of the catalog. */
export function BudgetPage({ onViewed }: { onViewed?: () => void } = {}) {
  const t = useT("budget")
  const scholarships = useSearchParams().get("view") === "scholarships"
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <nav aria-label={t("views.label")} className="flex gap-2 overflow-x-auto">
        {(
          [
            { key: "budget", href: "/chooser/?step=budget", current: !scholarships },
            { key: "scholarships", href: "/chooser/?step=budget&view=scholarships", current: scholarships },
          ] as const
        ).map(({ key, href, current }) => (
          <Link
            key={key}
            href={href}
            aria-current={current ? "page" : undefined}
            className="aria-[current=page]:bg-primary aria-[current=page]:text-primary-foreground bg-muted inline-flex min-h-11 items-center rounded-full px-4 text-sm font-medium whitespace-nowrap md:min-h-9"
          >
            {t(`views.${key}`)}
          </Link>
        ))}
      </nav>
      {scholarships ? (
        <>
          <ScholarshipsView />
          <Link href="/opportunities/scholarships/" className="text-sm underline underline-offset-2">
            {t("moreScholarships")}
          </Link>
        </>
      ) : (
        <BudgetView onViewed={onViewed} />
      )}
    </div>
  )
}
