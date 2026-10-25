// LMS — catalog, enrollment, step player, attempts, card study, review.

import { api } from "../client"
import { keys } from "../keys"
import { queryOptions, seg, type RequestOptions } from "../query"
import type {
  AttemptAnswersBody,
  AttemptOverrideBody,
  AttemptResult,
  AttemptReview,
  AttemptStartParams,
  AttemptView,
  CourseCard,
  CourseCatalogParams,
  CourseJoinBody,
  CoursePage,
  CourseStudent,
  LmsCardReviewBody,
  LmsCardStudy,
  MyCourses,
  StepProgressItem,
  StepView,
  VideoStream,
} from "../types/lms-learning"

/** GET /v1/lms/courses?query — bearer; published public courses. */
export function getLmsCourses(params?: CourseCatalogParams, opts?: RequestOptions): Promise<CourseCard[]> {
  return api.get<CourseCard[]>("/v1/lms/courses", { ...opts, query: params })
}
export const getLmsCoursesQuery = (params?: CourseCatalogParams) =>
  queryOptions({
    queryKey: keys.lms.courses(params?.query),
    queryFn: ({ signal }) => getLmsCourses(params, { signal }),
  })

/** GET /v1/lms/my-courses — bearer; enrolled and managed courses. */
export function getLmsMyCourses(opts?: RequestOptions): Promise<MyCourses> {
  return api.get<MyCourses>("/v1/lms/my-courses", opts)
}
export const getLmsMyCoursesQuery = () =>
  queryOptions({
    queryKey: keys.lms.myCourses(),
    queryFn: ({ signal }) => getLmsMyCourses({ signal }),
  })

/** Courses the user manages (`my-courses.managed`), for the connector course picker. */
export async function listMyManagedCourses(opts?: RequestOptions): Promise<CourseCard[]> {
  return (await getLmsMyCourses(opts)).managed
}

/** GET /v1/lms/courses/{slug} — bearer. */
export function getLmsCourse(slug: string, opts?: RequestOptions): Promise<CoursePage> {
  return api.get<CoursePage>(`/v1/lms/courses/${seg(slug)}`, opts)
}
export const getLmsCourseQuery = (slug: string) =>
  queryOptions({
    queryKey: keys.lms.course(slug),
    queryFn: ({ signal }) => getLmsCourse(slug, { signal }),
  })

/** POST /v1/lms/courses/{id}/enroll — bearer; public courses only. */
export function postLmsCourseEnroll(id: string, opts?: RequestOptions): Promise<CoursePage> {
  return api.post<CoursePage>(`/v1/lms/courses/${seg(id)}/enroll`, undefined, opts)
}

/** POST /v1/lms/join — bearer, rate limited; joins by invite code. */
export function postLmsJoin(body: CourseJoinBody, opts?: RequestOptions): Promise<CoursePage> {
  return api.post<CoursePage>("/v1/lms/join", body, opts)
}

/** GET /v1/lms/courses/{id}/steps/{step_id} — enrolled or staff. */
export function getLmsCourseStep(courseId: string, stepId: string, opts?: RequestOptions): Promise<StepView> {
  return api.get<StepView>(`/v1/lms/courses/${seg(courseId)}/steps/${seg(stepId)}`, opts)
}
export const getLmsCourseStepQuery = (courseId: string, stepId: string) =>
  queryOptions({
    queryKey: keys.lms.step(courseId, stepId),
    queryFn: ({ signal }) => getLmsCourseStep(courseId, stepId, { signal }),
  })

/** GET /v1/lms/courses/{id}/steps/{step_id}/blocks/{block_id}/video — enrolled or course staff; short-lived stream URL. */
export function getLmsStepVideo(
  courseId: string,
  stepId: string,
  blockId: string,
  opts?: RequestOptions,
): Promise<VideoStream> {
  return api.get<VideoStream>(
    `/v1/lms/courses/${seg(courseId)}/steps/${seg(stepId)}/blocks/${seg(blockId)}/video`,
    opts,
  )
}
export const getLmsStepVideoQuery = (courseId: string, stepId: string, blockId: string) =>
  queryOptions({
    queryKey: keys.lms.video(courseId, stepId, blockId),
    queryFn: ({ signal }) => getLmsStepVideo(courseId, stepId, blockId, { signal }),
  })

/** GET /v1/lms/courses/{id}/preview/steps/{step_id}/blocks/{block_id}/video — course:view_drafts; stream URL of a draft. */
export function getLmsPreviewStepVideo(
  courseId: string,
  stepId: string,
  blockId: string,
  opts?: RequestOptions,
): Promise<VideoStream> {
  return api.get<VideoStream>(
    `/v1/lms/courses/${seg(courseId)}/preview/steps/${seg(stepId)}/blocks/${seg(blockId)}/video`,
    opts,
  )
}
export const getLmsPreviewStepVideoQuery = (courseId: string, stepId: string, blockId: string) =>
  queryOptions({
    queryKey: keys.lms.previewVideo(courseId, stepId, blockId),
    queryFn: ({ signal }) => getLmsPreviewStepVideo(courseId, stepId, blockId, { signal }),
  })

/** POST /v1/lms/steps/{step_id}/viewed — enrolled. */
export function postLmsStepViewed(stepId: string, opts?: RequestOptions): Promise<StepProgressItem> {
  return api.post<StepProgressItem>(`/v1/lms/steps/${seg(stepId)}/viewed`, undefined, opts)
}

/** POST /v1/lms/steps/{step_id}/blocks/{block_id}/attempts — enrolled; staff with `view_drafts` use `preview: true`. */
export function postLmsStepBlockAttempts(
  stepId: string,
  blockId: string,
  params?: AttemptStartParams,
  opts?: RequestOptions,
): Promise<AttemptView> {
  return api.post<AttemptView>(`/v1/lms/steps/${seg(stepId)}/blocks/${seg(blockId)}/attempts`, undefined, {
    ...opts,
    query: params,
  })
}

/** PUT /v1/lms/attempts/{id}/answers — attempt owner; saves answers. */
export function putLmsAttemptAnswers(
  id: string,
  body: AttemptAnswersBody,
  opts?: RequestOptions,
): Promise<AttemptView> {
  return api.put<AttemptView>(`/v1/lms/attempts/${seg(id)}/answers`, body, opts)
}

/** POST /v1/lms/attempts/{id}/submit — attempt owner. */
export function postLmsAttemptSubmit(id: string, opts?: RequestOptions): Promise<AttemptResult> {
  return api.post<AttemptResult>(`/v1/lms/attempts/${seg(id)}/submit`, undefined, opts)
}

/** POST /v1/lms/steps/{step_id}/cards/{card_id}/review — enrolled. */
export function postLmsStepCardReview(
  stepId: string,
  cardId: string,
  body: LmsCardReviewBody,
  opts?: RequestOptions,
): Promise<LmsCardStudy> {
  return api.post<LmsCardStudy>(`/v1/lms/steps/${seg(stepId)}/cards/${seg(cardId)}/review`, body, opts)
}

/** GET /v1/lms/steps/{step_id}/cards/next?block_id= — enrolled. */
export function getLmsStepCardsNext(stepId: string, blockId: string, opts?: RequestOptions): Promise<LmsCardStudy> {
  return api.get<LmsCardStudy>(`/v1/lms/steps/${seg(stepId)}/cards/next`, {
    ...opts,
    query: { block_id: blockId },
  })
}
export const getLmsStepCardsNextQuery = (stepId: string, blockId: string) =>
  queryOptions({
    queryKey: keys.lms.cardNext(stepId, blockId),
    queryFn: ({ signal }) => getLmsStepCardsNext(stepId, blockId, { signal }),
  })

/** GET /v1/lms/courses/{id}/students — course:review. */
export function getLmsCourseStudents(courseId: string, opts?: RequestOptions): Promise<CourseStudent[]> {
  return api.get<CourseStudent[]>(`/v1/lms/courses/${seg(courseId)}/students`, opts)
}
export const getLmsCourseStudentsQuery = (courseId: string) =>
  queryOptions({
    queryKey: keys.lms.students(courseId),
    queryFn: ({ signal }) => getLmsCourseStudents(courseId, { signal }),
  })

/** GET /v1/lms/attempts/{id} — course:review or owner. */
export function getLmsAttempt(id: string, opts?: RequestOptions): Promise<AttemptReview> {
  return api.get<AttemptReview>(`/v1/lms/attempts/${seg(id)}`, opts)
}
export const getLmsAttemptQuery = (id: string) =>
  queryOptions({
    queryKey: keys.lms.attempt(id),
    queryFn: ({ signal }) => getLmsAttempt(id, { signal }),
  })

/** POST /v1/lms/attempts/{id}/override — course:review. */
export function postLmsAttemptOverride(
  id: string,
  body: AttemptOverrideBody,
  opts?: RequestOptions,
): Promise<AttemptReview> {
  return api.post<AttemptReview>(`/v1/lms/attempts/${seg(id)}/override`, body, opts)
}

// --- Names used by the app plans ---

export const listCourses = getLmsCourses
export const getMyCourses = getLmsMyCourses
export const getCoursePage = getLmsCourse
export const postEnroll = postLmsCourseEnroll
export const postJoin = postLmsJoin
