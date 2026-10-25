import type { AssessmentItem } from "@ihsp/api"
import { splitExams } from "./exam-list"

/**
 * The controls the Today card shows: not past and not cancelled, dated ones by date first and the weeks without a date
 * after them (a week is a range, not a day to count down to, so it should not push a real date out of the big slot).
 */
export function nextControls(items: AssessmentItem[]): AssessmentItem[] {
  const { upcoming } = splitExams(items.filter((item) => item.status !== "cancelled"))
  return [...upcoming.filter((item) => item.has_date), ...upcoming.filter((item) => !item.has_date)]
}
