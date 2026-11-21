"use client"

import { useT } from "@ihsp/i18n"
import type { ReactNode } from "react"
import type { Institution } from "../../types"
import { DeadlinesTable } from "./deadlines-table"
import { DetailRows } from "./detail-rows"
import { FactorsTable } from "./factors-table"
import { rowsOf, type DetailGroupKey } from "./groups"
import { SectionSource } from "./section-source"

/** True when at least one of the groups has rows (or, for selectivity and application, factors or deadlines). */
export function hasSections(institution: Institution, groups: readonly DetailGroupKey[]): boolean {
  return groups.some(
    (name) =>
      rowsOf(institution.details, name).length > 0 ||
      (name === "selectivity" && institution.factors.length > 0) ||
      (name === "application" && institution.deadlines.length > 0),
  )
}

/** The chosen sections of a school with recorded details: a key/value table, factors or deadlines, one source line. */
export function RichSections({
  institution,
  groups,
  after,
}: {
  institution: Institution
  groups: readonly DetailGroupKey[]
  /** Extra content under a section, by group name. */
  after?: Partial<Record<DetailGroupKey, ReactNode>>
}) {
  const t = useT("chooserDetails")
  const { details, factors, deadlines } = institution
  return (
    <div className="flex min-w-0 flex-col gap-6" data-testid="rich-detail">
      {groups.map((name) => {
        const rows = rowsOf(details, name)
        const extra: ReactNode[] = []
        if (name === "selectivity" && factors.length > 0) extra.push(<FactorsTable key="factors" factors={factors} />)
        if (name === "application" && deadlines.length > 0) extra.push(<DeadlinesTable key="deadlines" items={deadlines} />)
        if (rows.length === 0 && extra.length === 0 && !after?.[name]) return null
        return (
          <section key={name} aria-label={t(`groups.${name}`)} className="flex flex-col gap-2">
            <h3 className="text-base font-semibold">{t(`groups.${name}`)}</h3>
            {rows.length > 0 ? <DetailRows rows={rows} label={t(`groups.${name}`)} /> : null}
            {extra}
            {after?.[name]}
            <SectionSource rows={rows} />
          </section>
        )
      })}
    </div>
  )
}
