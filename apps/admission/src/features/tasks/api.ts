"use client"

// Tasks endpoints (`/v1/admission/tasks*`, `/v1/admission/students/{id}/tasks`).
// Types mirror the backend schemas until the OpenAPI document is regenerated.

import {
  type AdmissionTask,
  type AdmissionTaskIn,
  type AdmissionTaskPatch,
  type AdmissionTasks,
  getApiClient,
} from "@ihsp/api"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useAdmissionConfig } from "../../lib/config"

const BASE = "/v1/admission"

export type Task = AdmissionTask
export type TaskPriority = Task["priority"]
export type TaskStatus = Task["status"]
export type TaskStep = Task["steps"][number]
export type TaskLink = Task["links"][number]
export type TasksOut = AdmissionTasks
export type TaskIn = AdmissionTaskIn
export type TaskStepIn = NonNullable<TaskIn["steps"]>[number]
export type TaskPatch = AdmissionTaskPatch

/** Task vocabulary of `GET /v1/admission/config` (`workflow`). */
export interface TaskVocab {
  task_statuses: string[]
  task_priorities: string[]
  task_sources: string[]
  task_link_kinds: string[]
  task_horizons: string[]
}

const EMPTY_VOCAB: TaskVocab = {
  task_statuses: [],
  task_priorities: [],
  task_sources: [],
  task_link_kinds: [],
  task_horizons: [],
}

/** Task option lists of the backend; empty until the configuration has loaded. */
export function useTaskVocab(): TaskVocab {
  const workflow = useAdmissionConfig().data?.workflow as Partial<TaskVocab> | undefined
  return { ...EMPTY_VOCAB, ...workflow }
}

export interface TaskFilters {
  status?: string
  priority?: string
  source?: string
  horizon?: string
}

export const TASKS_KEY = ["admission", "tasks"] as const

function path(studentId: string | undefined) {
  return studentId ? `${BASE}/students/${studentId}/tasks` : `${BASE}/tasks`
}

function query(filters: TaskFilters): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) if (value) params.set(key, value)
  const text = params.toString()
  return text ? `?${text}` : ""
}

/** The student's tasks (the signed-in student's own when `studentId` is not given). */
export function useTasks(filters: TaskFilters = {}, studentId?: string) {
  return useQuery({
    queryKey: [...TASKS_KEY, studentId ?? "me", filters] as const,
    queryFn: ({ signal }) => getApiClient().get<TasksOut>(`${path(studentId)}${query(filters)}`, { signal }),
  })
}

function useInvalidate() {
  const client = useQueryClient()
  return () => client.invalidateQueries({ queryKey: TASKS_KEY })
}

export function useCreateTask(studentId?: string) {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (body: TaskIn) => getApiClient().post<Task>(path(studentId), body),
    onSuccess: invalidate,
  })
}

export function useUpdateTask() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: ({ id, ...body }: TaskPatch & { id: string }) =>
      getApiClient().patch<Task>(`${BASE}/tasks/${id}`, body),
    onSuccess: invalidate,
  })
}

/** Moves a task's dates; the cached lists change at once and roll back when the server refuses. */
export function useMoveTask() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }: TaskPatch & { id: string }) =>
      getApiClient().patch<Task>(`${BASE}/tasks/${id}`, body),
    onMutate: async ({ id, deadline, start_date }) => {
      await client.cancelQueries({ queryKey: TASKS_KEY })
      const previous = client.getQueriesData<TasksOut>({ queryKey: TASKS_KEY })
      client.setQueriesData<TasksOut>({ queryKey: TASKS_KEY }, (data) =>
        data
          ? {
              ...data,
              items: data.items.map((task) =>
                task.id === id
                  ? {
                      ...task,
                      deadline: deadline === undefined ? task.deadline : deadline,
                      start_date: start_date === undefined ? task.start_date : start_date,
                    }
                  : task,
              ),
            }
          : data,
      )
      return { previous }
    },
    onError: (_error, _vars, context) => {
      for (const [key, data] of context?.previous ?? []) client.setQueryData(key, data)
    },
    onSettled: () => client.invalidateQueries({ queryKey: TASKS_KEY }),
  })
}

export function useDeleteTask() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (id: string) => getApiClient().delete<void>(`${BASE}/tasks/${id}`),
    onSuccess: invalidate,
  })
}

export function useToggleStep() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: ({ taskId, stepId, done }: { taskId: string; stepId: string; done: boolean }) =>
      getApiClient().patch<Task>(`${BASE}/tasks/${taskId}/steps/${stepId}`, { done }),
    onSuccess: invalidate,
  })
}

/** AI drafts: nothing is saved until `useAcceptTasks`. */
export function useSuggestTasks(locale: string) {
  return useMutation({
    mutationFn: () =>
      getApiClient().post<TasksOut>(`${BASE}/tasks/suggest`, undefined, { headers: { "Accept-Language": locale } }),
  })
}

export function useAcceptTasks() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (tasks: TaskIn[]) => getApiClient().post<TasksOut>(`${BASE}/tasks/suggest/accept`, { tasks }),
    onSuccess: invalidate,
  })
}

/** A task as a creation request, for accepting an AI draft. */
export function toTaskIn(task: Task): TaskIn {
  return {
    title: task.title,
    description: task.description,
    priority: task.priority,
    start_date: task.start_date,
    deadline: task.deadline,
    steps: task.steps.map(({ id, title, done, link }) => ({ id, title, done, link })),
    links: task.links,
  }
}
