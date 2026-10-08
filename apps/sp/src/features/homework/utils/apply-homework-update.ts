import { keys, type HomeworkItem, type StudentLesson, type StudentToday } from "@ihsp/api"
import { addDays, todayIso } from "@ihsp/i18n"
import type { QueryClient } from "@tanstack/react-query"

export type HomeworkStatus = "overdue" | "upcoming" | "later" | "done"

/** `lesson_id` of an item is the stable identity inside every list (one homework per lesson). */
function sameItem(a: HomeworkItem, b: HomeworkItem): boolean {
  return a.lesson_id === b.lesson_id
}

/**
 * Overdue = open and past its due date (the server counts the days in Asia/Tashkent), upcoming = due by the next study
 * day, later = the rest (WEB-18). Done items are not in any of these.
 */
export function bucketOf(item: HomeworkItem, nextStudyDay: string | null): "overdue" | "upcoming" | "later" {
  if (item.days_overdue > 0) return "overdue"
  const limit = nextStudyDay ?? addDays(todayIso(), 1)
  return item.due_date !== null && item.due_date <= limit ? "upcoming" : "later"
}

export function sortHomework(items: HomeworkItem[], status: HomeworkStatus | undefined): HomeworkItem[] {
  if (status === "done") return items.toSorted((a, b) => (b.done_at ?? "").localeCompare(a.done_at ?? ""))
  return items.toSorted(
    (a, b) => (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999") || a.given_on.localeCompare(b.given_on),
  )
}

/** Should `item` be in the list of `status`? `undefined` is the list without a status filter (everything). */
function belongsTo(item: HomeworkItem, status: HomeworkStatus | undefined, nextStudyDay: string | null): boolean {
  if (status === undefined) return true
  if (status === "done") return item.done_at !== null
  return item.done_at === null && bucketOf(item, nextStudyDay) === status
}

/** Computes the new content of one cached list after `item` changed (tick, untick or note). */
export function nextList(
  list: HomeworkItem[],
  item: HomeworkItem,
  status: HomeworkStatus | undefined,
  nextStudyDay: string | null,
): HomeworkItem[] {
  const without = list.filter((existing) => !sameItem(existing, item))
  if (!belongsTo(item, status, nextStudyDay)) return without
  return sortHomework([...without, item], status)
}

type HomeworkQueryKey = readonly unknown[]

function statusOfKey(queryKey: HomeworkQueryKey): HomeworkStatus | undefined {
  const params = queryKey[2]
  const status = typeof params === "object" && params !== null ? (params as { status?: unknown }).status : undefined
  return status === "overdue" || status === "upcoming" || status === "later" || status === "done" ? status : undefined
}

/**
 * Puts the server's answer for one homework item into every cache that shows it: the homework lists (an item moves
 * between Overdue, Upcoming, Later and Done when it is ticked), the Today card and the lesson page. The lists are marked
 * stale, not refetched, so the move is not undone by a response that was computed before the change.
 */
export function applyHomeworkUpdate(queryClient: QueryClient, item: HomeworkItem): void {
  const today = queryClient.getQueryData<StudentToday>(keys.me.today())
  const nextStudyDay = today?.next_study_day ?? null

  for (const [queryKey, list] of queryClient.getQueriesData<HomeworkItem[]>({ queryKey: keys.me.homework() })) {
    if (!Array.isArray(list)) continue
    queryClient.setQueryData(queryKey, nextList(list, item, statusOfKey(queryKey), nextStudyDay))
  }
  void queryClient.invalidateQueries({ queryKey: keys.me.homework(), refetchType: "none" })

  queryClient.setQueryData<StudentToday>(keys.me.today(), (current) =>
    current ? { ...current, due: current.due.map((due) => (sameItem(due, item) ? item : due)) } : current,
  )
  queryClient.setQueryData<StudentLesson>(keys.lessons.detail(item.lesson_id), (current) =>
    current ? { ...current, homework: item } : current,
  )
}
