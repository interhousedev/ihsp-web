"use client"

import { getApiClient } from "@ihsp/api"
import { todayIso, useT } from "@ihsp/i18n"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { TASKS_KEY, type Task } from "../tasks/api"
import { buildPlan, type PlanKey } from "./plan"
import type { ListEntry } from "./types"

/** One tap: the application plan of a list entry as tasks that carry its `list_entry_id`, back-planned from the deadline. */
export function usePlanTasks() {
  const t = useT("uniList")
  const client = useQueryClient()
  return useMutation({
    mutationFn: (entry: ListEntry) => {
      const name = entry.institution.name
      const plan = buildPlan(entry, todayIso(new Date()), (key: PlanKey) => ({
        title: t(`plan.steps.${key}.title`, { name }),
        description: t(`plan.steps.${key}.text`, { name }),
      }))
      return Promise.all(plan.map((body) => getApiClient().post<Task>("/v1/admission/tasks", body)))
    },
    onSuccess: () => client.invalidateQueries({ queryKey: TASKS_KEY }),
  })
}
