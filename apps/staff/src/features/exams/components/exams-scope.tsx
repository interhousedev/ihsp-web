"use client"

import { useT } from "@ihsp/i18n"
import { NativeSelect } from "@ihsp/ui"
import { parseAsString, useQueryState } from "nuqs"
import { useId, useMemo, type ReactNode } from "react"
import { QueryState } from "../../shared/components/query-state"
import { useTeachingGroups } from "../hooks/use-teaching-groups"
import { useTentativeExams } from "../hooks/use-tentative-exams"
import { suggestionsByGroup, type TeachingGroup } from "../utils/teaching"

/**
 * Finds the group of the exams page: the groups the teacher curates and the groups they teach (`?group=`). A teacher
 * with several groups gets a picker that tells how many suggested dates wait in each group.
 */
export function ExamsScope({ children }: { children: (group: TeachingGroup) => ReactNode }) {
  const t = useT("exams")
  const selectId = useId()
  const groups = useTeachingGroups()
  const tentative = useTentativeExams()
  const [param, setParam] = useQueryState("group", parseAsString)
  const counts = useMemo(() => suggestionsByGroup(tentative.items), [tentative.items])

  return (
    <QueryState query={groups} rows={3} isEmpty={(list) => list.length === 0} emptyText={t("noGroups")}>
      {(list) => {
        const group = list.find((item) => item.id === param) ?? list[0]
        if (!group) return null
        return (
          <>
            {list.length > 1 ? (
              <div className="flex flex-col gap-1.5">
                <label htmlFor={selectId} className="text-sm font-medium">
                  {t("pickGroup")}
                </label>
                <NativeSelect
                  id={selectId}
                  className="w-full sm:w-60 [&_select]:h-11 md:[&_select]:h-8"
                  value={group.id}
                  onChange={(event) => void setParam(event.target.value)}
                >
                  {list.map((item) => {
                    const waiting = counts.get(item.id) ?? 0
                    return (
                      <option key={item.id} value={item.id}>
                        {waiting > 0 ? t("groupOption", { name: item.name, count: waiting }) : item.name}
                      </option>
                    )
                  })}
                </NativeSelect>
              </div>
            ) : null}
            {children(group)}
          </>
        )
      }}
    </QueryState>
  )
}
