"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useCallback, useEffect, useState } from "react"
import {
  checkAuthorship,
  checkWork,
  createMediaJob,
  drawFromBank,
  listMediaJobs,
  retryMediaJob,
  generateHandout,
  generateLessonPlan,
  generateQuestions,
  getBankTopics,
  getCurriculumTopics,
  getMediaJob,
  getStaffSubjects,
  type AuthorshipResult,
  type BankQuestion,
  type CheckWorkResult,
  type Difficulty,
  type MediaJob,
  type MediaJobBody,
  type QuestionItem,
} from "../api"
import type { MockQuestion, ToolId } from "../mock-data"

export type ToolResult = { kind: "questions"; questions: MockQuestion[] } | { kind: "text"; text: string }

/** The subjects the signed-in teacher teaches with their groups (`GET /v1/staff/subjects`). */
export function useSubjects() {
  const query = useQuery({ queryKey: ["staff", "subjects"], queryFn: getStaffSubjects })
  return { subjects: query.data ?? [], loading: query.isPending }
}

/** A generated question as the list shows it: the answer is the option that equals the stored answer. */
export function toListQuestion(id: string, q: { question: string; answer: string; options: string[] }): MockQuestion {
  const at = q.options.indexOf(q.answer)
  return { id, text: q.question, options: q.options.length > 0 ? q.options : [q.answer], correct: at >= 0 ? [at] : [0] }
}

export type ToolParams = {
  subjectId: string
  groupId: string | null
  topic: string
  level?: string
  language?: string
  count?: number
  planMinutes?: number
}

/** Runs a teacher tool. The server stores the output in the subject notebook of the chosen subject and group. */
export function useRunTool(tool: ToolId) {
  const mutation = useMutation({
    mutationFn: async (p: ToolParams): Promise<ToolResult> => {
      const base = {
        topic: p.topic,
        subject_id: p.subjectId,
        group_id: p.groupId,
        level: p.level,
        language: p.language,
      }
      if (tool === "questions") {
        const out = await generateQuestions({ ...base, count: p.count })
        return {
          kind: "questions",
          questions: out.questions.map((q: QuestionItem, i) =>
            toListQuestion(`g${i}`, { ...q, options: q.options ?? [] }),
          ),
        }
      }
      if (tool === "handout") {
        const out = await generateHandout(base)
        return { kind: "text", text: `# ${out.title}\n\n${out.markdown}` }
      }
      const out = await generateLessonPlan({ ...base, duration_minutes: p.planMinutes })
      return { kind: "text", text: `# ${out.title}\n\n${out.markdown}` }
    },
  })
  return {
    result: mutation.data ?? null,
    pending: mutation.isPending,
    error: mutation.error,
    run: mutation.mutate,
  }
}

export type BankFilter = { subjectId: string; topic: string; difficulty: Difficulty | "any"; count: number }

/** Topics of the subject in the question bank with the number of questions the teacher sees. */
export function useBankTopics(subjectId: string) {
  const query = useQuery({
    queryKey: ["staff", "question-bank", subjectId, "topics"],
    queryFn: () => getBankTopics(subjectId),
    enabled: subjectId !== "",
  })
  return { topics: query.data ?? [], loading: query.isPending && subjectId !== "" }
}

/** EMIS curriculum-plan topics of the subject: the only topics a question can be saved under. */
export function useCurriculumTopics(subjectId: string) {
  const query = useQuery({
    queryKey: ["staff", "question-bank", subjectId, "curriculum-topics"],
    queryFn: () => getCurriculumTopics(subjectId),
    enabled: subjectId !== "",
  })
  return { topics: query.data ?? [], loading: query.isPending && subjectId !== "" }
}

/** A random draw from the bank of a subject and topic, without repeats. */
export function useBankPick() {
  const mutation = useMutation({
    mutationFn: (f: BankFilter) =>
      drawFromBank(f.subjectId, {
        topic: f.topic,
        count: f.count,
        difficulty: f.difficulty === "any" ? null : f.difficulty,
      }),
  })
  return {
    picked: mutation.data ? { questions: mutation.data } : null,
    pending: mutation.isPending,
    error: mutation.error,
    pick: mutation.mutate,
  }
}

export type { BankQuestion }

export type WorkCheckResult = {
  result: CheckWorkResult
  authorship: AuthorshipResult
}

export type WorkCheckInput =
  | { submissionId: string }
  | { text: string; subjectId: string; groupId: string | null; rubric?: string }

/**
 * Checks a student's work: the criteria and the signs of machine writing in one pass. A submission is read on the
 * server (the comment and every attached file); the result lands in the subject notebook of its lesson.
 */
export function useWorkCheck() {
  const mutation = useMutation({
    mutationFn: async (input: WorkCheckInput): Promise<WorkCheckResult> => {
      if ("submissionId" in input) {
        const [result, authorship] = await Promise.all([
          checkWork({ submission_id: input.submissionId }),
          checkAuthorship({ submission_id: input.submissionId }),
        ])
        return { result, authorship }
      }
      const [result, authorship] = await Promise.all([
        checkWork({
          assignment: input.rubric?.trim() || "—",
          student_work: input.text,
          subject_id: input.subjectId,
          group_id: input.groupId,
          rubric: input.rubric?.trim() || undefined,
        }),
        checkAuthorship({ text: input.text }),
      ])
      return { result, authorship }
    },
  })
  return { result: mutation.data ?? null, pending: mutation.isPending, error: mutation.error, run: mutation.mutate }
}

const ACTIVE: MediaJob["status"][] = ["queued", "voicing", "rendering"]

/** The teacher's recent media jobs from the server, refreshed while one is running. */
export function useJobs() {
  const client = useQueryClient()
  const query = useQuery({
    queryKey: ["staff", "media-jobs"],
    queryFn: () => listMediaJobs(),
    refetchInterval: (q) => (q.state.data?.items.some((j) => ACTIVE.includes(j.status)) ? 3000 : false),
  })
  const retry = useMutation({
    mutationFn: retryMediaJob,
    onSuccess: () => client.invalidateQueries({ queryKey: ["staff", "media-jobs"] }),
  })
  return { jobs: query.data?.items ?? [], retry: retry.mutate, retrying: retry.isPending }
}

/** Starts a media job and follows it until it is done or failed. The finished file is an mp4 (or audio for audio-only). */
export function useMediaJob() {
  const client = useQueryClient()
  const [id, setId] = useState<string | null>(null)
  const start = useMutation({
    mutationFn: (body: MediaJobBody) => createMediaJob(body),
    onSuccess: (job) => {
      setId(job.id)
      void client.invalidateQueries({ queryKey: ["staff", "media-jobs"] })
    },
  })
  const query = useQuery({
    queryKey: ["staff", "media-job", id],
    queryFn: () => getMediaJob(id as string),
    enabled: id !== null,
    refetchInterval: (q) => (q.state.data && !ACTIVE.includes(q.state.data.status) ? false : 2000),
  })
  const reset = useCallback(() => {
    setId(null)
    start.reset()
  }, [start])
  const job = query.data ?? start.data ?? null
  return { job, starting: start.isPending, error: start.error, start: start.mutate, reset }
}
