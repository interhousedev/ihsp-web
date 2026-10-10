import type { OutlineSection } from "@ihsp/api"

export type FlatStep = {
  step_id: string
  title: string
  sectionId: string
  sectionTitle: string
  completed: boolean
}

/** The steps of all sections in reading order. */
export function flattenOutline(outline: readonly OutlineSection[]): FlatStep[] {
  return outline.flatMap((section) =>
    section.steps.map((step) => ({
      step_id: step.step_id,
      title: step.title,
      sectionId: section.id,
      sectionTitle: section.title,
      completed: step.completed ?? false,
    })),
  )
}

/** The step to open with "Continue": the first one that is not completed, otherwise the first step. */
export function continueStep(outline: readonly OutlineSection[]): FlatStep | null {
  const steps = flattenOutline(outline)
  return steps.find((step) => !step.completed) ?? steps[0] ?? null
}

export function neighbours(
  outline: readonly OutlineSection[],
  stepId: string,
): {
  previous: FlatStep | null
  next: FlatStep | null
  position: number
  total: number
} {
  const steps = flattenOutline(outline)
  const index = steps.findIndex((step) => step.step_id === stepId)
  return {
    previous: index > 0 ? (steps[index - 1] ?? null) : null,
    next: index >= 0 ? (steps[index + 1] ?? null) : null,
    position: index + 1,
    total: steps.length,
  }
}

/**
 * Stepik-style numbers of the lessons by step id: the module number, a dot and the lesson's place in its module
 * ("3.6" is the sixth lesson of the third module).
 */
export function lessonNumbers(outline: readonly OutlineSection[]): Map<string, string> {
  const numbers = new Map<string, string>()
  outline.forEach((section, sectionIndex) => {
    section.steps.forEach((step, stepIndex) => numbers.set(step.step_id, `${sectionIndex + 1}.${stepIndex + 1}`))
  })
  return numbers
}
