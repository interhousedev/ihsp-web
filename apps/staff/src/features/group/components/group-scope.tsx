"use client"

import { getStaffGroupsQuery, type GroupItem } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { NativeSelect } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { parseAsString, useQueryState } from "nuqs"
import { useId, type ReactNode } from "react"
import { QueryState } from "../../shared/components/query-state"

/**
 * Finds the group of the "My group" pages: the groups the teacher curates (`GET /v1/staff/groups`). A teacher who
 * curates nothing sees an explanation; a curator of several groups gets a picker (`?group=`).
 */
export function GroupScope({ children }: { children: (group: GroupItem) => ReactNode }) {
  const t = useT("group")
  const selectId = useId()
  const query = useQuery(getStaffGroupsQuery())
  const [param, setParam] = useQueryState("group", parseAsString)

  return (
    <QueryState query={query} rows={3} isEmpty={(groups) => groups.length === 0} emptyText={t("noGroup")}>
      {(groups) => {
        const group = groups.find((item) => item.id === param) ?? groups[0]
        if (!group) return null
        return (
          <>
            {groups.length > 1 ? (
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
                  {groups.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
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
