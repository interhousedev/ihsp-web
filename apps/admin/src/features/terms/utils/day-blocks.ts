import type { Bell } from "@ihsp/api"
import { STUDY_WEEKDAYS } from "../../shared/utils/weekdays"

/** One lesson block of one weekday, with where it came from. */
export type DayBlock = Omit<Bell, "weekdays">

function isStudyDay(day: number): boolean {
  return STUDY_WEEKDAYS.some((study) => study === day)
}

function same(a: DayBlock, b: DayBlock): boolean {
  return a.period === b.period && a.start === b.start && a.end === b.end
}

function blockOf(bell: Bell): DayBlock {
  const { weekdays: _weekdays, ...block } = bell
  return block
}

/** The column of a weekday, by lesson number. */
export function dayBlocks(bells: Bell[], day: number): DayBlock[] {
  return bells
    .filter((bell) => bell.weekdays.includes(day))
    .map(blockOf)
    .toSorted((a, b) => a.period - b.period)
}

/** Rows with the same block on several days become one row, as the API stores them. */
function regroup(cells: { day: number; block: DayBlock }[]): Bell[] {
  const rows = new Map<string, Bell>()
  for (const { day, block } of cells) {
    const key = JSON.stringify([block.period, block.start, block.end, block.source, block.emis_start, block.emis_end])
    const row = rows.get(key)
    if (row) row.weekdays = [...row.weekdays, day].toSorted((a, b) => a - b)
    else rows.set(key, { ...block, weekdays: [day] })
  }
  return [...rows.values()].toSorted((a, b) => a.period - b.period || (a.weekdays[0] ?? 0) - (b.weekdays[0] ?? 0))
}

/**
 * Replace the column of one weekday. Changing a Monday-to-Friday block of a period from EMIS makes all rows of that
 * period an override, so the sync keeps the different day, or the block removed from it. Weekends are never EMIS's.
 */
export function setDayBlocks(bells: Bell[], day: number, blocks: DayBlock[]): Bell[] {
  const before = dayBlocks(bells, day)
  const changed = new Set<number>()
  for (const block of [...before, ...blocks]) {
    const kept = before.some((item) => same(item, block)) && blocks.some((item) => same(item, block))
    if (!kept) changed.add(block.period)
  }
  const cells = bells.flatMap((bell) =>
    bell.weekdays.filter((weekday) => weekday !== day).map((weekday) => ({ day: weekday, block: blockOf(bell) })),
  )
  for (const block of blocks) cells.push({ day, block })
  if (!isStudyDay(day)) return regroup(cells)

  return regroup(
    cells.map((cell) => {
      if (!changed.has(cell.block.period) || !isStudyDay(cell.day)) return cell
      const origin = bells.find(
        (bell) =>
          bell.period === cell.block.period &&
          bell.weekdays.some(isStudyDay) &&
          (bell.source === "emis" || bell.source === "override"),
      )
      if (!origin) return cell
      return {
        day: cell.day,
        block: {
          ...cell.block,
          source: "override" as const,
          emis_start: origin.emis_start ?? origin.start,
          emis_end: origin.emis_end ?? origin.end,
        },
      }
    }),
  )
}

/** Make a day's column equal to another day's. */
export function copyDayBlocks(bells: Bell[], from: number, to: number): Bell[] {
  const copied = dayBlocks(bells, from).map((block) => {
    if (isStudyDay(to) || block.source === "manual") return block
    return { period: block.period, start: block.start, end: block.end, source: "manual" as const }
  })
  return setDayBlocks(bells, to, copied)
}

/** Back to the EMIS time on Monday to Friday; weekend blocks of the period stay. */
export function resetPeriodToEmis(bells: Bell[], period: number): Bell[] {
  const origin = bells.find((bell) => bell.period === period && bell.emis_start && bell.emis_end)
  if (!origin?.emis_start || !origin.emis_end) return bells
  const rest = bells.flatMap((bell) => {
    if (bell.period !== period) return [bell]
    const weekend = bell.weekdays.filter((day) => !isStudyDay(day))
    return weekend.length > 0 ? [{ ...bell, weekdays: weekend, source: "manual" as const }] : []
  })
  const reset: Bell = {
    period,
    start: origin.emis_start,
    end: origin.emis_end,
    weekdays: [...STUDY_WEEKDAYS],
    source: "emis",
    emis_start: null,
    emis_end: null,
  }
  return [...rest, reset].toSorted((a, b) => a.period - b.period || (a.weekdays[0] ?? 0) - (b.weekdays[0] ?? 0))
}
