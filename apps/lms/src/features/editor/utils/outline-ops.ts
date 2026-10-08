import type { OutlineOp, OutlineSection } from "@ihsp/api"

/** Drag ids: sections and steps share one `DndContext`, so ids carry their kind. */
export const sectionDragId = (id: string) => `section:${id}`
export const stepDragId = (id: string) => `step:${id}`
/** The end of a section's step list: dropping here appends the step (also makes empty sections droppable). */
export const sectionDropId = (id: string) => `drop:${id}`

export type DragTarget = { kind: "section" | "step" | "drop"; id: string }

export function parseDragId(raw: string | number | null | undefined): DragTarget | null {
  if (typeof raw !== "string") return null
  const index = raw.indexOf(":")
  if (index < 0) return null
  const kind = raw.slice(0, index)
  const id = raw.slice(index + 1)
  if ((kind === "section" || kind === "step" || kind === "drop") && id) return { kind, id }
  return null
}

function findStep(outline: readonly OutlineSection[], stepId: string): { sectionIndex: number; index: number } | null {
  for (const [sectionIndex, section] of outline.entries()) {
    const index = section.steps.findIndex((step) => step.step_id === stepId)
    if (index >= 0) return { sectionIndex, index }
  }
  return null
}

/**
 * The outline operations for a finished drag. Positions follow the backend: the index in the target list after the
 * moved item was taken out of its old place (the same meaning as `arrayMove`).
 */
export function computeDragOps(
  outline: readonly OutlineSection[],
  activeId: string | number,
  overId: string | number | null | undefined,
): OutlineOp[] {
  const active = parseDragId(activeId)
  const over = parseDragId(overId)
  if (!active || !over) return []

  if (active.kind === "section") {
    const from = outline.findIndex((section) => section.id === active.id)
    let target: number
    if (over.kind === "step") target = findStep(outline, over.id)?.sectionIndex ?? -1
    else target = outline.findIndex((section) => section.id === over.id)
    if (from < 0 || target < 0 || from === target) return []
    return [{ op: "move_section", section_id: active.id, position: target }]
  }

  if (active.kind === "step") {
    const source = findStep(outline, active.id)
    if (!source) return []
    let targetSectionIndex: number
    let position: number
    if (over.kind === "step") {
      const target = findStep(outline, over.id)
      if (!target) return []
      targetSectionIndex = target.sectionIndex
      position = target.index
    } else {
      targetSectionIndex = outline.findIndex((section) => section.id === over.id)
      if (targetSectionIndex < 0) return []
      const length = outline[targetSectionIndex]?.steps.length ?? 0
      position = targetSectionIndex === source.sectionIndex ? length - 1 : length
    }
    const targetSection = outline[targetSectionIndex]
    if (!targetSection) return []
    if (targetSectionIndex === source.sectionIndex && position === source.index) return []
    return [{ op: "move_step", step_id: active.id, to_section_id: targetSection.id, position }]
  }

  return []
}

/** One step up or down; at the edge of a section the step crosses into the neighbouring section. */
export function moveStepOps(outline: readonly OutlineSection[], stepId: string, direction: "up" | "down"): OutlineOp[] {
  const source = findStep(outline, stepId)
  if (!source) return []
  const section = outline[source.sectionIndex]
  if (!section) return []
  if (direction === "up") {
    if (source.index > 0)
      return [{ op: "move_step", step_id: stepId, to_section_id: section.id, position: source.index - 1 }]
    const previous = outline[source.sectionIndex - 1]
    return previous
      ? [{ op: "move_step", step_id: stepId, to_section_id: previous.id, position: previous.steps.length }]
      : []
  }
  if (source.index < section.steps.length - 1) {
    return [{ op: "move_step", step_id: stepId, to_section_id: section.id, position: source.index + 1 }]
  }
  const next = outline[source.sectionIndex + 1]
  return next ? [{ op: "move_step", step_id: stepId, to_section_id: next.id, position: 0 }] : []
}

export function moveSectionOps(
  outline: readonly OutlineSection[],
  sectionId: string,
  direction: "up" | "down",
): OutlineOp[] {
  const index = outline.findIndex((section) => section.id === sectionId)
  const target = direction === "up" ? index - 1 : index + 1
  if (index < 0 || target < 0 || target >= outline.length) return []
  return [{ op: "move_section", section_id: sectionId, position: target }]
}

/** Applies operations to a copy of the outline (the optimistic update; the server answer replaces it). */
export function applyOutlineOps(outline: readonly OutlineSection[], ops: readonly OutlineOp[]): OutlineSection[] {
  let sections = outline.map((section) => ({ ...section, steps: [...section.steps] }))
  for (const op of ops) {
    if (op.op === "add_section") {
      sections.splice(op.position ?? sections.length, 0, {
        id: `pending-${sections.length}-${op.title}`,
        title: op.title,
        steps: [],
      })
    } else if (op.op === "rename_section") {
      sections = sections.map((section) => (section.id === op.section_id ? { ...section, title: op.title } : section))
    } else if (op.op === "move_section") {
      const index = sections.findIndex((section) => section.id === op.section_id)
      const [moved] = index >= 0 ? sections.splice(index, 1) : []
      if (moved) sections.splice(op.position, 0, moved)
    } else if (op.op === "remove_section") {
      sections = sections.filter((section) => section.id !== op.section_id)
    } else if (op.op === "move_step") {
      const source = sections.find((section) => section.steps.some((step) => step.step_id === op.step_id))
      const step = source?.steps.find((item) => item.step_id === op.step_id)
      const target = sections.find((section) => section.id === op.to_section_id)
      if (source && step && target) {
        source.steps = source.steps.filter((item) => item.step_id !== op.step_id)
        target.steps.splice(op.position, 0, step)
      }
    } else {
      for (const section of sections) section.steps = section.steps.filter((step) => step.step_id !== op.step_id)
    }
  }
  return sections
}
