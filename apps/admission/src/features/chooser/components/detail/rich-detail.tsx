"use client"

import { useT } from "@ihsp/i18n"
import type { ReactNode } from "react"
import type { Institution } from "../../types"
import { DeadlinesTable } from "./deadlines-table"
import { DetailRows } from "./detail-rows"
import { FactorsTable } from "./factors-table"
import { DETAIL_GROUPS, rowsOf } from "./groups"
import { SectionNav } from "./section-nav"
import { sectionId } from "./section-id"

/** Sections of a school with recorded details: key/value tables, admission factors and deadlines; empty sections are hidden. */
export function RichDetail({ institution, chances }: { institution: Institution; chances: ReactNode }) {
  const t = useT("chooserDetails")
  const { details, factors, deadlines } = institution
  const content = DETAIL_GROUPS.flatMap((name) => {
    const rows = rowsOf(details, name)
    const extra: ReactNode[] = []
    if (name === "selectivity" && factors.length > 0) extra.push(<FactorsTable key="factors" factors={factors} />)
    if (name === "application" && deadlines.length > 0) extra.push(<DeadlinesTable key="deadlines" items={deadlines} />)
    if (rows.length === 0 && extra.length === 0) return []
    return [{ name, rows, extra }]
  })
  const names = [...content.map((section) => section.name), "chances"]
  return (
    <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[12rem_minmax(0,1fr)] lg:gap-8" data-testid="rich-detail">
      <SectionNav sections={names} />
      <div className="flex min-w-0 flex-col gap-8">
        {content.map(({ name, rows, extra }) => (
          <section
            key={name}
            id={sectionId(name)}
            aria-label={t(`groups.${name}`)}
            className="flex scroll-mt-16 flex-col gap-3"
          >
            <h2 className="text-base font-semibold">{t(`groups.${name}`)}</h2>
            {rows.length > 0 ? <DetailRows rows={rows} label={t(`groups.${name}`)} /> : null}
            {extra}
          </section>
        ))}
        <section
          id={sectionId("chances")}
          aria-label={t("groups.chances")}
          className="flex scroll-mt-16 flex-col gap-3"
        >
          <h2 className="text-base font-semibold">{t("groups.chances")}</h2>
          {chances}
        </section>
      </div>
    </div>
  )
}
