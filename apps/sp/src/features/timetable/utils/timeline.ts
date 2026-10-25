import type { LessonItem } from "@ihsp/api"
import { tashkentMinutes } from "../../shared/utils/period-times"

/** A stretch of one day in minutes since midnight, Asia/Tashkent. */
export type Interval = { startMin: number; endMin: number }

/** Empty time of at least this many minutes between lessons is "free"; shorter gaps are breaks. */
export const FREE_GAP_MINUTES = 30

/** Scale of the timelines: the phone day view is taller than the desktop week grid. */
export const PHONE_PX_PER_MINUTE = 1.5
export const DESKTOP_PX_PER_MINUTE = 1.2

/** Pixels for a number of minutes. Every vertical position and height on a timeline goes through here. */
export function minutesToPx(minutes: number, pxPerMinute: number): number {
  return minutes * pxPerMinute
}

/** The part of the day a lesson takes, on the timeline clock. */
export function intervalOf(lesson: Pick<LessonItem, "starts_at" | "ends_at">): Interval {
  return { startMin: tashkentMinutes(lesson.starts_at), endMin: tashkentMinutes(lesson.ends_at) }
}

/** Minutes of the day of an instant (the "now" line). */
export function minuteOfInstant(ms: number): number {
  return tashkentMinutes(new Date(ms).toISOString())
}

/** Whole hours around every interval: from the hour before the first start to the hour after the last end. */
export function timelineRange(intervals: readonly Interval[]): Interval | null {
  if (intervals.length === 0) return null
  const startMin = Math.floor(Math.min(...intervals.map((item) => item.startMin)) / 60) * 60
  const endMin = Math.ceil(Math.max(...intervals.map((item) => item.endMin)) / 60) * 60
  return { startMin, endMin: Math.max(endMin, startMin + 60) }
}

/** Top and height of an interval on a timeline whose first minute is `origin`. */
export function boxOf(interval: Interval, origin: number, pxPerMinute: number): { top: number; height: number } {
  return {
    top: minutesToPx(interval.startMin - origin, pxPerMinute),
    height: minutesToPx(interval.endMin - interval.startMin, pxPerMinute),
  }
}

/** The full hours of a range for the time axis: 08:00, 09:00 … 14:00. */
export function hourMarks(range: Interval): number[] {
  const marks: number[] = []
  for (let minute = range.startMin; minute <= range.endMin; minute += 60) marks.push(minute)
  return marks
}

/** `08:30` for minutes since midnight. */
export function clockOf(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`
}

export type Gap = Interval & { minutes: number; kind: "break" | "free" }

/**
 * The empty stretches between the lessons of one day. Overlapping lessons count as one block, so a gap is time with
 * no lesson at all. Time before the first and after the last lesson is not a gap.
 */
export function gapsBetween(intervals: readonly Interval[]): Gap[] {
  const sorted = intervals.toSorted((a, b) => a.startMin - b.startMin || a.endMin - b.endMin)
  const gaps: Gap[] = []
  let reached: number | null = null
  for (const item of sorted) {
    if (reached !== null && item.startMin > reached) {
      const minutes = item.startMin - reached
      gaps.push({
        startMin: reached,
        endMin: item.startMin,
        minutes,
        kind: minutes >= FREE_GAP_MINUTES ? "free" : "break",
      })
    }
    reached = reached === null ? item.endMin : Math.max(reached, item.endMin)
  }
  return gaps
}

export type LaneSlot = { lane: number; lanes: number }

/**
 * Side-by-side lanes for items that overlap in time (two subgroups in the same period). Each item comes back with its
 * `lane` (0-based) and the number of `lanes` of its overlapping group; items that do not overlap get one lane.
 */
export function laneLayout<T extends Interval>(items: readonly T[]): (T & LaneSlot)[] {
  const slots = new Map<T, LaneSlot>(items.map((item): [T, LaneSlot] => [item, { lane: 0, lanes: 1 }]))
  const order = items.toSorted((a, b) => a.startMin - b.startMin || a.endMin - b.endMin)
  let group: T[] = []
  let laneEnds: number[] = []
  let groupEnd = Number.NEGATIVE_INFINITY

  const closeGroup = () => {
    for (const item of group) slots.set(item, { lane: slots.get(item)?.lane ?? 0, lanes: laneEnds.length })
    group = []
    laneEnds = []
    groupEnd = Number.NEGATIVE_INFINITY
  }

  for (const item of order) {
    if (item.startMin >= groupEnd) closeGroup()
    let lane = laneEnds.findIndex((end) => end <= item.startMin)
    if (lane === -1) {
      lane = laneEnds.length
      laneEnds.push(item.endMin)
    } else {
      laneEnds[lane] = item.endMin
    }
    slots.set(item, { lane, lanes: 1 })
    group.push(item)
    groupEnd = Math.max(groupEnd, item.endMin)
  }
  closeGroup()

  return items.map((item) => ({ ...item, ...(slots.get(item) ?? { lane: 0, lanes: 1 }) }))
}
