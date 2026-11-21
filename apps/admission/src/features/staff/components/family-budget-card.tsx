"use client"

import { useT } from "@ihsp/i18n"
import { Icons } from "@ihsp/ui"
import { useStudentSection } from "../api"

/** The family budget band, only when the student shares it; otherwise a plain note. Hidden while the profile is unshared. */
export function FamilyBudgetCard({ studentId }: { studentId: string }) {
  const t = useT("staff")
  const profile = useStudentSection(studentId, "profile")
  if (!profile.data) return null
  const shared = profile.data.budget_shared && !!profile.data.family_budget
  return (
    <section aria-label={t("budget.title")} className="bg-card rounded-card flex items-center gap-3 border p-4 text-sm">
      {shared ? <Icons.badgeCheck aria-hidden className="size-4" /> : <Icons.lock aria-hidden className="size-4" />}
      <div className="flex flex-col">
        <span className="text-muted-foreground text-xs">{t("budget.title")}</span>
        <span className={shared ? "font-medium" : "text-muted-foreground"}>
          {shared ? profile.data.family_budget : t("budget.notShared")}
        </span>
      </div>
    </section>
  )
}
