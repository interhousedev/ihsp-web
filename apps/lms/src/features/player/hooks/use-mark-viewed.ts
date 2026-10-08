"use client"

import { keys, postLmsStepViewed, type StepView } from "@ihsp/api"
import { useQueryClient } from "@tanstack/react-query"
import { useEffect, useRef } from "react"
import { refreshProgress } from "../utils/fresh"

/**
 * Tells the server the student opened the step (a step without tests is completed by this, LMS-19) and refreshes the
 * progress. Runs once per step; staff who are not enrolled get an error, which is ignored.
 */
export function useMarkViewed({
  courseId,
  stepId,
  slug,
  step,
  enabled,
}: {
  courseId: string
  stepId: string
  slug: string | null
  step: StepView | undefined
  enabled: boolean
}) {
  const queryClient = useQueryClient()
  const done = useRef<string | null>(null)
  const needed = enabled && step !== undefined && !step.completed

  useEffect(() => {
    if (!needed || done.current === stepId) return
    done.current = stepId
    postLmsStepViewed(stepId).then(
      (progress) => {
        queryClient.setQueryData<StepView>(keys.lms.step(courseId, stepId), (current) =>
          current ? { ...current, completed: progress.completed } : current,
        )
        void refreshProgress(queryClient, { courseId, stepId, slug, step: false })
      },
      () => undefined,
    )
  }, [needed, stepId, courseId, slug, queryClient])
}
