import type { AssessmentItem, ResourceItem, SubjectDetail } from "@ihsp/api"

export type LessonMaterial = { material: ResourceItem; lesson: SubjectDetail["lessons"][number] }

/**
 * The lesson materials to revise for a control: visible IHSP materials of lessons dated after the previous control
 * (all of them when there was none) and up to `today`, newest lesson first. EMIS materials are wrong more often
 * than not, so they are never listed; a material whose lesson is not in the subject's lessons has no date and is left out.
 */
export function materialsSince(
  detail: Pick<SubjectDetail, "lessons" | "materials">,
  previous: Pick<AssessmentItem, "date"> | null,
  today: string,
): LessonMaterial[] {
  const lessons = new Map(detail.lessons.map((lesson) => [lesson.id, lesson]))
  const entries: LessonMaterial[] = []
  for (const material of detail.materials) {
    if (material.role !== "material" || material.hidden || material.source === "emis") continue
    const lesson = lessons.get(material.lesson_id)
    if (!lesson || lesson.date > today) continue
    if (previous && lesson.date <= previous.date) continue
    entries.push({ material, lesson })
  }
  return entries.toSorted(
    (a, b) => b.lesson.date.localeCompare(a.lesson.date) || b.material.created_at.localeCompare(a.material.created_at),
  )
}
