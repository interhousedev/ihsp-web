"use client"

import { getApiClient } from "@ihsp/api"
import { todayIso, useT } from "@ihsp/i18n"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { TASKS_KEY, type Task } from "../tasks/api"
import { buildPlan, type PlanKey } from "./plan"
import type { ListEntry } from "./types"

/**
 * One tap: the application plan of a list entry as tasks that carry its `list_entry_id`, back-planned from the deadline.
 * A toast says how many tasks were made and offers to take them back.
 */
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
    onSuccess: (created) => {
      void client.invalidateQueries({ queryKey: TASKS_KEY })
      toast.success(t("plan.created", { count: created.length }), {
        action: {
          label: t("plan.undo"),
          onClick: () => {
            void Promise.allSettled(created.map((task) => getApiClient().delete<void>(`/v1/admission/tasks/${task.id}`)))
              .then(() => client.invalidateQueries({ queryKey: TASKS_KEY }))
              .then(() => toast(t("plan.undone")))
          },
        },
      })
    },
  })
}
