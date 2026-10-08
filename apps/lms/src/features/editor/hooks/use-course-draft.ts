"use client"

import {
  getLmsCourseDraftQuery,
  keys,
  patchLmsCourseSettings,
  postLmsCourseDraftOutline,
  postLmsCourseSteps,
  putLmsCourseDraftMeta,
  type CourseDraft,
  type CourseSettingsBody,
  type OutlineOp,
  type StepCreateBody,
  type StepDraft,
} from "@ihsp/api"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useRef } from "react"
import { applyOutlineOps } from "../utils/outline-ops"

export function useCourseDraft(courseId: string) {
  return useQuery(getLmsCourseDraftQuery(courseId))
}

function isMove(op: OutlineOp): boolean {
  return op.op === "move_section" || op.op === "move_step"
}

/**
 * Writes to the course draft. Meta saves and outline operations share the course's `lock_version`, so they run one at a
 * time and each reads the newest version from the cache when it starts. Moves update the outline at once and roll back
 * when the server refuses them.
 */
export function useDraftActions(courseId: string) {
  const queryClient = useQueryClient()
  const queue = useRef<Promise<unknown>>(Promise.resolve())
  const draftKey = keys.lms.draft(courseId)

  function enqueue<T>(task: () => Promise<T>): Promise<T> {
    const run = queue.current.then(task, task)
    queue.current = run.catch(() => undefined)
    return run
  }

  const lockVersion = () => queryClient.getQueryData<CourseDraft>(draftKey)?.lock_version ?? 0

  function store(draft: CourseDraft) {
    queryClient.setQueryData(draftKey, draft)
    void queryClient.invalidateQueries({ queryKey: keys.lms.pending(courseId) })
  }

  const outline = useMutation<CourseDraft, unknown, OutlineOp[]>({
    mutationFn: (ops) => enqueue(() => postLmsCourseDraftOutline(courseId, { ops, lock_version: lockVersion() })),
    onMutate: async (ops) => {
      if (!ops.every(isMove)) return
      await queryClient.cancelQueries({ queryKey: draftKey })
      queryClient.setQueryData<CourseDraft>(draftKey, (draft) =>
        draft ? { ...draft, outline: applyOutlineOps(draft.outline, ops) } : draft,
      )
    },
    onSuccess: store,
    onError: () => void queryClient.invalidateQueries({ queryKey: draftKey }),
  })

  const meta = useMutation<CourseDraft, unknown, { title: string; description: string }>({
    mutationFn: (body) => enqueue(() => putLmsCourseDraftMeta(courseId, { ...body, lock_version: lockVersion() })),
    onSuccess: store,
  })

  const settings = useMutation<CourseDraft, unknown, CourseSettingsBody>({
    mutationFn: (body) => patchLmsCourseSettings(courseId, body),
    onSuccess: store,
  })

  const createStep = useMutation<StepDraft, unknown, StepCreateBody>({
    mutationFn: (body) => postLmsCourseSteps(courseId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: draftKey })
      void queryClient.invalidateQueries({ queryKey: keys.lms.pending(courseId) })
    },
  })

  return { outline, meta, settings, createStep, store }
}
