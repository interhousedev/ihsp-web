import { api, keys, seg, type CoursePage, type StepView } from "@ihsp/api"
import type { QueryClient } from "@tanstack/react-query"

/**
 * Learning GETs are served with `Cache-Control: private, max-age=60`, so a plain refetch right after a submit would
 * show the old `attempts_left`, `best` and progress. `cache: "no-cache"` revalidates against the server instead.
 */
export function getStepFresh(courseId: string, stepId: string, signal?: AbortSignal): Promise<StepView> {
  return api.get<StepView>(`/v1/lms/courses/${seg(courseId)}/steps/${seg(stepId)}`, { cache: "no-cache", signal })
}

export function getCourseFresh(slug: string, signal?: AbortSignal): Promise<CoursePage> {
  return api.get<CoursePage>(`/v1/lms/courses/${seg(slug)}`, { cache: "no-cache", signal })
}

/**
 * After a submit or a "viewed" mark: loads the step and the course page again past the HTTP cache and puts them into
 * the query cache; the course list refetches normally (it is not shown on the same page).
 */
export async function refreshProgress(
  queryClient: QueryClient,
  { courseId, stepId, slug, step = true }: { courseId: string; stepId: string; slug: string | null; step?: boolean },
): Promise<void> {
  const tasks: Promise<unknown>[] = [queryClient.invalidateQueries({ queryKey: keys.lms.myCourses() })]
  if (step) {
    tasks.push(
      queryClient.fetchQuery({
        queryKey: keys.lms.step(courseId, stepId),
        queryFn: ({ signal }) => getStepFresh(courseId, stepId, signal),
        staleTime: 0,
      }),
    )
  }
  if (slug) {
    tasks.push(
      queryClient.fetchQuery({
        queryKey: keys.lms.course(slug),
        queryFn: ({ signal }) => getCourseFresh(slug, signal),
        staleTime: 0,
      }),
    )
  }
  await Promise.allSettled(tasks)
}
