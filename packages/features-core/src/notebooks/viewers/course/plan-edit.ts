import type { CoursePlan, PlanSection, PlanStep } from "@ihsp/api"

/** Pure edits of the course plan the author changes in the viewer; every function returns a new plan. */

export const MAX_PLAN_SECTIONS = 30
export const MAX_PLAN_STEPS = 30
export const MAX_TITLE = 200

function swap<T>(items: readonly T[], from: number, to: number): T[] {
  if (to < 0 || to >= items.length || from === to) return [...items]
  const copy = [...items]
  const [moved] = copy.splice(from, 1)
  copy.splice(to, 0, moved!)
  return copy
}

function updateSection(plan: CoursePlan, index: number, change: (section: PlanSection) => PlanSection): CoursePlan {
  return { ...plan, sections: plan.sections.map((section, i) => (i === index ? change(section) : section)) }
}

export function setPlanText(plan: CoursePlan, field: "summary", value: string): CoursePlan {
  return { ...plan, [field]: value }
}

export function setPlanGoals(plan: CoursePlan, goals: string[]): CoursePlan {
  return { ...plan, goals }
}

export function renameSection(plan: CoursePlan, index: number, title: string): CoursePlan {
  return updateSection(plan, index, (section) => ({ ...section, title }))
}

export function setSectionGoals(plan: CoursePlan, index: number, goals: string[]): CoursePlan {
  return updateSection(plan, index, (section) => ({ ...section, goals }))
}

export function moveSection(plan: CoursePlan, index: number, delta: -1 | 1): CoursePlan {
  return { ...plan, sections: swap(plan.sections, index, index + delta) }
}

export function removeSection(plan: CoursePlan, index: number): CoursePlan {
  return { ...plan, sections: plan.sections.filter((_, i) => i !== index) }
}

export function addSection(plan: CoursePlan, title: string): CoursePlan {
  if (plan.sections.length >= MAX_PLAN_SECTIONS) return plan
  return { ...plan, sections: [...plan.sections, { title, goals: [], steps: [{ title: "", goals: [], summary: "" }] }] }
}

export function updateStep(
  plan: CoursePlan,
  sectionIndex: number,
  stepIndex: number,
  change: Partial<PlanStep>,
): CoursePlan {
  return updateSection(plan, sectionIndex, (section) => ({
    ...section,
    steps: section.steps.map((step, i) => (i === stepIndex ? { ...step, ...change } : step)),
  }))
}

export function moveStep(plan: CoursePlan, sectionIndex: number, stepIndex: number, delta: -1 | 1): CoursePlan {
  return updateSection(plan, sectionIndex, (section) => ({
    ...section,
    steps: swap(section.steps, stepIndex, stepIndex + delta),
  }))
}

export function removeStep(plan: CoursePlan, sectionIndex: number, stepIndex: number): CoursePlan {
  return updateSection(plan, sectionIndex, (section) => ({
    ...section,
    steps: section.steps.filter((_, i) => i !== stepIndex),
  }))
}

export function addStep(plan: CoursePlan, sectionIndex: number): CoursePlan {
  return updateSection(plan, sectionIndex, (section) =>
    section.steps.length >= MAX_PLAN_STEPS
      ? section
      : { ...section, steps: [...section.steps, { title: "", goals: [], summary: "" }] },
  )
}

/** Goals are edited as one goal per line; blank lines are dropped. */
export function goalsFromText(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "")
}

/**
 * Why the plan cannot be applied yet (empty titles, no steps); `null` when it can. Sections without steps and
 * steps without a title would be refused by the server anyway.
 */
export function planProblem(plan: CoursePlan): "no-sections" | "empty-title" | "no-steps" | null {
  if (plan.sections.length === 0) return "no-sections"
  for (const section of plan.sections) {
    if (section.title.trim() === "") return "empty-title"
    if (section.steps.length === 0) return "no-steps"
    if (section.steps.some((step) => step.title.trim() === "")) return "empty-title"
  }
  return null
}

/** The plan as sent: trimmed titles and goals. */
export function cleanPlan(plan: CoursePlan): CoursePlan {
  return {
    summary: plan.summary.trim(),
    goals: plan.goals.map((goal) => goal.trim()).filter(Boolean),
    sections: plan.sections.map((section) => ({
      title: section.title.trim(),
      goals: section.goals.map((goal) => goal.trim()).filter(Boolean),
      steps: section.steps.map((step) => ({
        title: step.title.trim(),
        goals: step.goals.map((goal) => goal.trim()).filter(Boolean),
        summary: step.summary.trim(),
      })),
    })),
  }
}
