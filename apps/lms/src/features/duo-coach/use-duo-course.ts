"use client"

import { getLmsCourseQuery, getLmsCourseStepQuery, getMyBadgesQuery, type CoursePage, type StepView } from "@ihsp/api"
import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"
import { getMyLevel } from "./coach-api"

/** Block types a step of a course is built from (the backend `Block` union) plus the exam. */
export type StepKind =
  | "text"
  | "video"
  | "interactive_video"
  | "test"
  | "flashcards"
  | "h5p"
  | "html"
  | "code"
  | "exam"
  | "ai_review"

export type NodeState = "done" | "current" | "available" | "locked"
export type LockReason = "mastery" | "audience"

export type PathNode = {
  id: string
  title: string
  kind: StepKind
  minutes: number
  state: NodeState
  lock?: { reason: LockReason; needs?: string; current?: number; target?: number; requires?: string }
}

export type PathSection = {
  id: string
  title: string
  mastery?: number
  threshold?: number
  nodes: PathNode[]
}

export type PathMock = { title: string; club: string | null; sections: PathSection[] }

/** A step of the course in the line: where it is, what comes after it. */
export type LessonCtx = {
  slug: string
  courseId: string
  stepId: string
  title: string
  sectionNumber: number
  sectionTitle: string
  nextStepId: string | null
}

export type DuoCourse = {
  id: string
  slug: string
  enrolledVia: string | null
  continueStepId: string | null
  path: PathMock
}

const STEP_KINDS: readonly StepKind[] = [
  "text",
  "video",
  "interactive_video",
  "test",
  "flashcards",
  "h5p",
  "html",
  "code",
  "exam",
  "ai_review",
]

/** Kind of the step: the type of its first block (the player of a step with several blocks starts from the first). */
export function stepKind(step: StepView): StepKind {
  const type: string | undefined = step.blocks[0]?.type
  return STEP_KINDS.find((kind) => kind === type) ?? "text"
}

const asKind = (kind: string | null): StepKind | null => STEP_KINDS.find((k) => k === kind) ?? null

function toPath(page: CoursePage): DuoCourse {
  const continueId = page.continue_step_id
  const sections = page.outline.map((section) => ({
    id: section.id,
    title: section.title,
    nodes: section.steps.map((step): PathNode => {
      const locked = step.locked === true
      const state: NodeState = locked
        ? "locked"
        : step.completed === true
          ? "done"
          : step.step_id === continueId
            ? "current"
            : "available"
      return {
        id: step.step_id,
        title: step.title,
        state,
        kind: asKind(step.kind ?? null) ?? "text",
        minutes: step.estimated_minutes ?? 1,
        ...(locked ? { lock: { reason: step.lock_reason === "mastery" ? ("mastery" as const) : ("audience" as const) } } : {}),
      }
    }),
  }))
  return {
    id: page.id,
    slug: page.slug,
    enrolledVia: page.enrolled_via ?? null,
    continueStepId: continueId ?? null,
    path: { title: page.title, club: null, sections },
  }
}

/** The course line of `/v1/lms/courses/{slug}`: sections, steps, `lock_reason`, `continue_step_id`, `enrolled_via`. */
export function useDuoCourse(slug: string | null) {
  const query = useQuery({ ...getLmsCourseQuery(slug ?? ""), enabled: slug !== null })
  const course = useMemo(() => (query.data ? toPath(query.data) : null), [query.data])
  return { ...query, course }
}

/** The learner's level (platform, or one course with `courseId`). */
export function useMyLevel(courseId?: string) {
  return useQuery({ queryKey: ["lms", "me", "level", courseId ?? "platform"], queryFn: () => getMyLevel(courseId) })
}

/** A step with its real kind; `enabled` stays off until both ids are known. */
export function useDuoStep(courseId: string | undefined, stepId: string | null) {
  return useQuery({ ...getLmsCourseStepQuery(courseId ?? "", stepId ?? ""), enabled: Boolean(courseId && stepId) })
}

/** Context of a step inside its course: section and the next unlocked step after it. */
export function lessonCtx(course: DuoCourse, stepId: string, title: string): LessonCtx {
  const flat = course.path.sections.flatMap((section, sectionIndex) =>
    section.nodes.map((node) => ({ node, sectionIndex, section })),
  )
  const at = flat.findIndex((entry) => entry.node.id === stepId)
  const entry = flat[at]
  const next = flat.slice(at + 1).find((candidate) => candidate.node.state !== "locked")
  return {
    slug: course.slug,
    courseId: course.id,
    stepId,
    title,
    sectionNumber: (entry?.sectionIndex ?? 0) + 1,
    sectionTitle: entry?.section.title ?? "",
    nextStepId: next?.node.id ?? null,
  }
}

export const lessonHref = (slug: string, stepId: string) =>
  `/duo/lesson/?slug=${encodeURIComponent(slug)}&step=${encodeURIComponent(stepId)}`
export const pathHref = (slug: string) => `/duo/path/?slug=${encodeURIComponent(slug)}`

/** Learner badges for the strip under the line. */
export function useMyBadgeStrip() {
  return useQuery(getMyBadgesQuery())
}
