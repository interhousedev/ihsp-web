"use client"

import { type WorkOffGroupBy } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { PageContainer, Tabs, TabsList, TabsTrigger } from "@ihsp/ui"
import { parseAsInteger, parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs"
import { defaultRange } from "../utils/dates"
import { WorkOffList } from "./work-off-list"
import { WorkOffStatsTable } from "./work-off-stats-table"
import { WorkOffsRangeFields } from "./work-offs-range-fields"

export const GROUPS = ["subject", "teacher", "group", "student"] as const satisfies readonly WorkOffGroupBy[]
export const STATUSES = ["open", "done", "all"] as const

/** Work-off tasks statistics: open and done counts per subject, teacher, group or student, with a drill-down (WO-8). */
export function WorkOffsPage() {
  const t = useT("workOffs")
  const [state, setState] = useQueryStates({
    by: parseAsStringLiteral(GROUPS).withDefault("subject"),
    from: parseAsString,
    to: parseAsString,
    key: parseAsString,
    name: parseAsString,
    status: parseAsStringLiteral(STATUSES).withDefault("open"),
    page: parseAsInteger.withDefault(1),
  })
  const range = defaultRange()
  const from = state.from ?? range.from
  const to = state.to ?? range.to

  return (
    <PageContainer title={t("title")}>
      <Tabs
        value={state.by}
        onValueChange={(by) => void setState({ by: by as WorkOffGroupBy, key: null, name: null, page: null })}
      >
        <TabsList className="w-full justify-start sm:w-fit">
          {GROUPS.map((group) => (
            <TabsTrigger key={group} value={group} className="min-h-11 md:min-h-7">
              {t(`tabs.${group}`)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <div className="flex flex-wrap items-end gap-3">
        <WorkOffsRangeFields
          from={from}
          to={to}
          onChange={(nextFrom, nextTo) => void setState({ from: nextFrom, to: nextTo, page: null })}
        />
      </div>
      {state.key ? (
        <WorkOffList
          by={state.by}
          id={state.key}
          name={state.name ?? ""}
          from={from}
          to={to}
          status={state.status}
          page={state.page}
          onStatus={(status) => void setState({ status, page: null })}
          onPage={(page) => void setState({ page })}
          onBack={() => void setState({ key: null, name: null, status: null, page: null })}
        />
      ) : (
        <WorkOffStatsTable
          by={state.by}
          from={from}
          to={to}
          onOpen={(key, name) => void setState({ key, name, status: null, page: null })}
        />
      )}
    </PageContainer>
  )
}
