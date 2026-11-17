"use client"

import { useT } from "@ihsp/i18n"
import { BarList, PageSection, StatCard, StatGrid } from "../../../components/lib/page"
import { ACTIVITY_CATEGORIES, type Item } from "../api"

const GRADES = ["A", "B", "C", "D", "E"] as const

const share = (count: number, total: number) => (total === 0 ? 0 : Math.round((count / total) * 100))

/** Totals, a bar per category and a bar per title grade of the student's activities. */
export function ItemAnalytics({ items }: { items: Item[] }) {
  const t = useT("items")
  const total = items.length
  const hours = items.reduce((sum, i) => sum + (i.hours_per_week ?? 0) * (i.weeks_per_year ?? 0), 0)
  const graded = items.filter((i) => i.grade)
  const byCategory = [...ACTIVITY_CATEGORIES].map((c) => ({
    key: c,
    count: items.filter((i) => (i.category ?? "other") === c).length,
  }))
  const byGrade = GRADES.map((g) => ({ key: g, count: graded.filter((i) => i.grade?.title_grade === g).length }))
  return (
    <PageSection title={t("analytics.title")}>
      <StatGrid>
        <StatCard label={t("analytics.total")} value={total} />
        <StatCard label={t("analytics.hours")} value={hours} />
        <StatCard label={t("analytics.graded")} value={`${graded.length}/${total}`} />
      </StatGrid>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-medium">{t("analytics.byCategory")}</h3>
          <BarList
            items={byCategory.map((c) => ({
              key: c.key,
              label: t(`category.${c.key}`),
              value: share(c.count, total),
              display: t("analytics.count", { count: c.count }),
            }))}
          />
        </div>
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-medium">{t("analytics.byGrade")}</h3>
          <BarList
            items={byGrade.map((g) => ({
              key: g.key,
              label: g.key,
              value: share(g.count, graded.length),
              display: t("analytics.count", { count: g.count }),
            }))}
          />
        </div>
      </div>
    </PageSection>
  )
}
