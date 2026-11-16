import { apiUrl, server } from "@ihsp/test-utils"
import { http, HttpResponse } from "msw"
import type { AdmissionConfig, Profile, Question } from "../features/profile/types"

export function question(overrides: Partial<Question> & { id: string }): Question {
  return { section: "about", kind: "text", required: false, options: [], ...overrides }
}

export function wizardConfig(questions: Question[]): AdmissionConfig {
  return { question_set: "v1", questions, options: {}, limits: {}, wellbeing_questions_enabled: false }
}

export function profile(overrides: Partial<Profile> = {}): Profile {
  return {
    student_id: "s1",
    account_kind: "student",
    stage: "setup",
    question_set_version: "v1",
    answers: {},
    next_question: null,
    missing_required: [],
    setup_completed: false,
    lock_version: 1,
    ...overrides,
  }
}

/** Serves the wizard's config and profile. */
export function useSetupHandlers(config: AdmissionConfig, me: Profile) {
  server.use(
    http.get(apiUrl("/v1/admission/config"), () => HttpResponse.json(config)),
    http.get(apiUrl("/v1/admission/me/profile"), () => HttpResponse.json(me)),
    http.put(apiUrl("/v1/admission/me/profile"), async ({ request }) => {
      const body = (await request.json()) as { answers: Profile["answers"] }
      return HttpResponse.json({ ...me, answers: { ...me.answers, ...body.answers } })
    }),
  )
}
