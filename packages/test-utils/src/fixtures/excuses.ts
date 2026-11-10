import type { Excuse, ExcuseMessage, ExcuseTemplate } from "@ihsp/api"
import { FIXTURE_TODAY, ids, uuid } from "./world"

const CREATED = "2026-10-06T07:00:00Z"

/** The ready reasons; illness needs no document, the olympiad does. */
export const excuseTemplates: ExcuseTemplate[] = [
  {
    id: uuid(60, 1),
    code: "illness",
    title: { uz: "Kasallik", ru: "Болезнь", en: "Illness" },
    requires_document: false,
  },
  {
    id: uuid(60, 2),
    code: "olympiad",
    title: { uz: "Olimpiada", ru: "Олимпиада", en: "Olympiad" },
    requires_document: true,
  },
  {
    id: uuid(60, 3),
    code: "other",
    title: { uz: "Boshqa", ru: "Другое", en: "Other" },
    requires_document: false,
  },
]

export function excuseTemplate(overrides: Partial<ExcuseTemplate> = {}): ExcuseTemplate {
  return { ...excuseTemplates[0]!, ...overrides }
}

export function excuseMessage(overrides: Partial<ExcuseMessage> = {}): ExcuseMessage {
  return {
    id: uuid(62, 1),
    author_id: ids.student,
    author_name: "Brastilov Aleksey",
    body: "",
    attachments: [],
    created_at: CREATED,
    ...overrides,
  }
}

export function excuse(overrides: Partial<Excuse> = {}): Excuse {
  return {
    id: uuid(61, 1),
    student_id: ids.student,
    student_name: "Brastilov Aleksey",
    origin: "request",
    status: "pending",
    template: excuseTemplates[0]!,
    reason: "Fever since Monday",
    starts_on: FIXTURE_TODAY,
    ends_on: null,
    lesson_ids: [],
    subject_ids: [],
    created_by: ids.student,
    decided_by: null,
    decided_at: null,
    decision_comment: null,
    created_at: CREATED,
    updated_at: CREATED,
    thread: [],
    ...overrides,
  }
}

/** The caller's excuses at the start of every test: one pending, one approved with a curator's line. */
export function seedExcuses(): Excuse[] {
  return [
    excuse(),
    excuse({
      id: uuid(61, 2),
      status: "approved",
      template: excuseTemplates[1]!,
      reason: "Regional olympiad",
      starts_on: "2026-09-21",
      ends_on: "2026-09-23",
      decided_by: ids.teacherKalandarova,
      decided_at: "2026-09-20T09:00:00Z",
      created_at: "2026-09-19T07:00:00Z",
      updated_at: "2026-09-20T09:00:00Z",
      thread: [
        excuseMessage({
          id: uuid(62, 2),
          author_id: ids.teacherKalandarova,
          author_name: "Kalandarova Gavxar",
          body: "Approved, good luck!",
        }),
      ],
    }),
  ]
}
