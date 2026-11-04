export type SquareState = "present" | "absent" | "excused" | "not_taken" | "future"

export type Square = { lessonId: string; state: SquareState }
export type WeekdaySquares = { weekday: number; squares: Square[] }

/**
 * One square per lesson, grouped Monday (1) to Friday (5). A past lesson is present unless it is in `missed`; today's
 * lesson without a mark is not taken yet; a later lesson is future.
 */
export function weekSquares(
  lessons: { id: string; date: string }[],
  missed: { lessonId: string; excused: boolean }[],
  today: string,
): WeekdaySquares[] {
  const missedById = new Map(missed.map((item) => [item.lessonId, item]))
  return [1, 2, 3, 4, 5].map((weekday) => ({
    weekday,
    squares: lessons
      .filter((lesson) => new Date(`${lesson.date}T00:00:00Z`).getUTCDay() === weekday)
      .toSorted((a, b) => a.date.localeCompare(b.date))
      .map((lesson) => {
        const miss = missedById.get(lesson.id)
        let state: SquareState
        if (miss) state = miss.excused ? "excused" : "absent"
        else if (lesson.date > today) state = "future"
        else if (lesson.date === today) state = "not_taken"
        else state = "present"
        return { lessonId: lesson.id, state }
      }),
  }))
}
