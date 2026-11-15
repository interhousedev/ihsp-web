"use client"

import {
  getLmsCourseAccessQuery,
  keys,
  putLmsCourseAccess,
  putLmsStepAccess,
  type AccessRuleBody,
  type CourseAccessRules,
} from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { useSession } from "@ihsp/auth"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

/** The access rules of a course: the course rule and the restricted lessons. */
export function useAccessRules(courseId: string) {
  return useQuery(getLmsCourseAccessQuery(courseId))
}

/** Only the owner and LMS administrators change the rules; the other staff read them. */
export function useCanManageAccess(permissions: readonly string[] | undefined): boolean {
  const { session } = useSession()
  const admin = session?.user.roles.includes("lms_admin") ?? false
  return admin || (permissions?.includes("manage_staff") ?? false)
}

/** Saves the course rule (`stepId` null) or a lesson rule; the answer is the whole rule set. */
export function useSaveAccess(courseId: string, stepId: string | null) {
  const queryClient = useQueryClient()
  const t = useT("access")
  return useMutation<CourseAccessRules, unknown, AccessRuleBody>({
    mutationFn: (body) => (stepId ? putLmsStepAccess(courseId, stepId, body) : putLmsCourseAccess(courseId, body)),
    onSuccess: (rules) => {
      queryClient.setQueryData(keys.lms.access(courseId), rules)
      toast.success(t("saved"))
    },
  })
}
