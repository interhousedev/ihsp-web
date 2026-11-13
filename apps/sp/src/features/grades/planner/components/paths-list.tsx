"use client"

import type { PlannerPath } from "@ihsp/api"
import { useLocale, useT } from "@ihsp/i18n"

/** One path as one sentence: "Get 2 more fives on lessons and at least 4 on the final (FC)." */
export function PathsList({ paths, midtermCount }: { paths: PlannerPath[]; midtermCount: number }) {
  const t = useT("planner.target.paths")
  const locale = useLocale()
  const list = new Intl.ListFormat(locale, { type: "conjunction", style: "long" })
  const sentence = (path: PlannerPath): string => {
    const parts: string[] = []
    if (path.extra_lesson_fives > 0) parts.push(t("fives", { count: path.extra_lesson_fives }))
    if (path.midterm !== null) parts.push(t("midterm", { value: path.midterm, count: midtermCount }))
    if (path.final !== null) parts.push(t("final", { value: path.final }))
    return t("line", { parts: list.format(parts) })
  }
  return (
    <div className="flex flex-col gap-1">
      <p className="text-muted-foreground text-xs">{t("title")}</p>
      <ul className="flex flex-col gap-1" data-testid="planner-paths">
        {paths.map((path, index) => (
          <li key={`${path.extra_lesson_fives}-${path.midterm}-${path.final}`} className="text-sm">
            {index > 0 ? <span className="text-muted-foreground me-1">{t("alternative")}</span> : null}
            {sentence(path)}
          </li>
        ))}
      </ul>
    </div>
  )
}
