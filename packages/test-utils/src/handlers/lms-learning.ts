import type { AttemptAnswersBody, AttemptOverrideBody, CourseJoinBody } from "@ihsp/api"
import { HttpResponse, http } from "msw"
import {
  attemptReview,
  attemptResultPassed,
  attemptView,
  courseCards,
  coursePage,
  courseStudents,
  lmsCardStudy,
  myCourses,
  stepProgress,
  stepViews,
} from "../fixtures/lms-learning"
import { apiUrl, matches, notFound, param, problem, query, readJson } from "./utils"

export const lmsLearningHandlers = [
  http.get(apiUrl("/v1/lms/courses"), ({ request }) => {
    const needle = query(request).get("query")
    return HttpResponse.json(
      courseCards.filter((course) => matches(course.title, needle) || matches(course.description, needle)),
    )
  }),
  http.get(apiUrl("/v1/lms/my-courses"), () => HttpResponse.json(myCourses)),
  http.get(apiUrl("/v1/lms/courses/:slug"), ({ params }) => {
    const slug = param(params, "slug")
    return slug === coursePage.slug || slug === coursePage.id ? HttpResponse.json(coursePage) : notFound("Course")
  }),
  http.post(apiUrl("/v1/lms/courses/:id/enroll"), () => HttpResponse.json({ ...coursePage, enrolled: true })),
  // The code `BADCODE` does not exist (`404`).
  http.post(apiUrl("/v1/lms/join"), async ({ request }) => {
    const body = await readJson<CourseJoinBody>(request)
    if (body.code === "BADCODE") return notFound("Invite code")
    return HttpResponse.json({ ...coursePage, enrolled: true })
  }),
  http.get(apiUrl("/v1/lms/courses/:courseId/steps/:stepId"), ({ params }) => {
    const step = stepViews.find((item) => item.step_id === param(params, "stepId"))
    return step ? HttpResponse.json(step) : notFound("Step")
  }),
  // Streams of uploaded videos: the file id in the URL is the block id, so tests can tell the calls apart.
  http.get(apiUrl("/v1/lms/courses/:courseId/steps/:stepId/blocks/:blockId/video"), ({ params }) =>
    HttpResponse.json({
      url: `https://storage.test/video/${param(params, "blockId")}.mp4?sig=1`,
      expires_in: 900,
    }),
  ),
  http.get(apiUrl("/v1/lms/courses/:courseId/preview/steps/:stepId/blocks/:blockId/video"), ({ params }) =>
    HttpResponse.json({
      url: `https://storage.test/draft/${param(params, "blockId")}.mp4?sig=1`,
      expires_in: 900,
    }),
  ),
  http.post(apiUrl("/v1/lms/steps/:stepId/viewed"), ({ params }) =>
    HttpResponse.json({ ...stepProgress, step_id: param(params, "stepId") }),
  ),
  http.post(apiUrl("/v1/lms/steps/:stepId/blocks/:blockId/attempts"), ({ params }) =>
    HttpResponse.json({ ...attemptView, block_id: param(params, "blockId") }),
  ),
  http.put(apiUrl("/v1/lms/attempts/:id/answers"), async ({ params, request }) => {
    const body = await readJson<AttemptAnswersBody>(request)
    return HttpResponse.json({
      ...attemptView,
      id: param(params, "id"),
      answers: body.answers ?? {},
    })
  }),
  http.post(apiUrl("/v1/lms/attempts/:id/submit"), ({ params }) =>
    HttpResponse.json({ ...attemptResultPassed, id: param(params, "id") }),
  ),
  http.post(apiUrl("/v1/lms/steps/:stepId/cards/:cardId/review"), () => HttpResponse.json(lmsCardStudy)),
  http.get(apiUrl("/v1/lms/steps/:stepId/cards/next"), ({ request }) => {
    const blockId = query(request).get("block_id")
    if (!blockId) return problem(422, "common/request-validation", "block_id is required")
    return HttpResponse.json({ ...lmsCardStudy, block_id: blockId })
  }),
  http.get(apiUrl("/v1/lms/courses/:id/students"), () => HttpResponse.json(courseStudents)),
  http.get(apiUrl("/v1/lms/attempts/:id"), ({ params }) =>
    HttpResponse.json({ ...attemptReview, id: param(params, "id") }),
  ),
  http.post(apiUrl("/v1/lms/attempts/:id/override"), async ({ params, request }) => {
    const body = await readJson<AttemptOverrideBody>(request)
    return HttpResponse.json({
      ...attemptReview,
      id: param(params, "id"),
      override_score: body.score ?? null,
      override_comment: body.comment ?? null,
    })
  }),
]
