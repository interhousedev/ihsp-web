"use client"

import { useT } from "@ihsp/i18n"
import Link from "next/link"

const CHIP = "rounded-full border px-3 py-1 text-sm hover:bg-muted"

/** Chips from Ideas to the scholarships list and the saved plan; the kinds are the only tab row. */
export function OpportunityTabs({ value, planCount }: { value: "catalog" | "scholarships"; planCount: number }) {
  const t = useT("opportunities")
  return (
    <nav aria-label={t("view.tabs")} className="flex flex-wrap gap-2">
      {value === "catalog" ? (
        <Link href="/opportunities/scholarships/" className={CHIP}>
          {t("view.scholarships")}
        </Link>
      ) : (
        <Link href="/opportunities/" className={CHIP}>
          {t("view.catalog")}
        </Link>
      )}
      <Link href="/plan/?view=saved" className={CHIP}>
        {t("view.plan")}
        {planCount > 0 ? ` (${planCount})` : ""}
      </Link>
    </nav>
  )
}
