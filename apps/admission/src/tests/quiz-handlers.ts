import { apiUrl, server } from "@ihsp/test-utils"
import { HttpResponse, http } from "msw"
import type { Interests, QuizAnswers, QuizName } from "../features/profile/details-api"

/** In-memory `/me/quizzes/{quiz}` and `/me/profile/{details,interests}`: what is PUT is what the next GET returns. */
export function mockQuizzes(initial: Partial<Record<QuizName, QuizAnswers>> = {}) {
  const quizzes: Record<QuizName, QuizAnswers> = {
    career: { answers: {}, completed: false },
    algorithm: { answers: {}, completed: false },
    ...initial,
  }
  const interests: Interests = { fields: [], services: [] }
  const puts: { quiz: QuizName; body: QuizAnswers }[] = []
  const interestPuts: Interests[] = []
  server.use(
    http.get(apiUrl("/v1/admission/me/quizzes/:quiz"), ({ params }) =>
      HttpResponse.json(quizzes[params.quiz as QuizName]),
    ),
    http.put(apiUrl("/v1/admission/me/quizzes/:quiz"), async ({ params, request }) => {
      const body = (await request.json()) as QuizAnswers
      quizzes[params.quiz as QuizName] = body
      puts.push({ quiz: params.quiz as QuizName, body })
      return HttpResponse.json(body)
    }),
    http.get(apiUrl("/v1/admission/me/profile/details"), () =>
      HttpResponse.json({
        interests,
        three_words: [],
        completion_percent: 40,
        missing: [{ key: "career_quiz", label: "Take the career quiz" }],
      }),
    ),
    http.put(apiUrl("/v1/admission/me/profile/interests"), async ({ request }) => {
      const body = (await request.json()) as Interests
      interests.fields = body.fields
      interests.services = body.services
      interestPuts.push(body)
      return HttpResponse.json(body)
    }),
  )
  return { quizzes, interests, puts, interestPuts }
}
