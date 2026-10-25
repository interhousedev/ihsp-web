/** The dates on which the student was late: the lesson results joined to the lessons that give their date. */
export function lateDays(
  lessons: readonly { id: string; date: string }[],
  results: readonly { lesson_id: string; attendance: "present" | "absent" | "late" | null }[],
): Set<string> {
  const dates = new Map(lessons.map((lesson) => [lesson.id, lesson.date]))
  const days = new Set<string>()
  for (const result of results) {
    const date = dates.get(result.lesson_id)
    if (result.attendance === "late" && date) days.add(date)
  }
  return days
}
