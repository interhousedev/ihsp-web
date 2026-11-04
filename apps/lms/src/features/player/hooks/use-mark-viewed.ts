"use client"

import { keys, postLmsStepViewed, type StepView } from "@ihsp/api"
import { useErrorMessage } from "@ihsp/i18n"
import { useQueryClient } from "@tanstack/react-query"
import { useEffect, useRef } from "react"
import { toast } from "sonner"
import { refreshProgress } from "../utils/fresh"

/**
 * Tells the server the student opened the step (a step without tests is completed by this, LMS-19) and refreshes the
 * progress. Runs once per step. A failure is shown as an error toast: the step stays unmarked until it is opened again.
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
  const errorMessage = useErrorMessage()
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
        // The viewed mark passes the text blocks of the step, so the step is read again as well as the course page.
        void refreshProgress(queryClient, { courseId, stepId, slug })
      },
      (error: unknown) => toast.error(errorMessage(error)),
    )
  }, [needed, stepId, courseId, slug, queryClient, errorMessage])
}
