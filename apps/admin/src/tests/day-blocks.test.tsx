/** ACA-4: every weekday has its own lesson blocks; a day can be copied from another one. */
import { describe, expect, mock, test } from "bun:test"
import type { Bell, Term, TimetableEntry } from "@ihsp/api"
import { currentTerm } from "@ihsp/test-utils"
import { fireEvent, screen, within } from "@testing-library/react"
import { BellsEditor } from "../features/terms/components/bells-editor"
import { copyDayBlocks, dayBlocks, resetPeriodToEmis, setDayBlocks } from "../features/terms/utils/day-blocks"
import { emptyTermForm, termToForm, validateTerm } from "../features/terms/utils/term-form"
import { TimetableGrid, termWeekdays } from "../features/timetable/components/timetable-grid"
import { configureTests, renderAdmin, setValue } from "./helpers"

configureTests()

const emis: Bell = { period: 1, start: "08:30", end: "09:50", weekdays: [1, 2, 3, 4, 5], source: "emis" }
const other: Bell = { period: 2, start: "10:10", end: "11:30", weekdays: [1, 2, 3, 4, 5], source: "emis" }

describe("day blocks", () => {
  test("changing Friday keeps the other days' time and makes the whole period an override", () => {
    const friday = dayBlocks([emis, other], 5).map((block) =>
      block.period === 1 ? { ...block, start: "08:00", end: "08:40" } : block,
    )

    const next = setDayBlocks([emis, other], 5, friday)

    expect(next).toEqual([
      { ...emis, weekdays: [1, 2, 3, 4], source: "override", emis_start: "08:30", emis_end: "09:50" },
      {
        ...emis,
        start: "08:00",
        end: "08:40",
        weekdays: [5],
        source: "override",
        emis_start: "08:30",
        emis_end: "09:50",
      },
      other,
    ])
  })

  test("copying a day to Saturday opens it and leaves the school week with EMIS", () => {
    const next = copyDayBlocks([emis], 1, 6)

    expect(dayBlocks(next, 6).map((block) => [block.period, block.start, block.source])).toEqual([
      [1, "08:30", "manual"],
    ])
    expect(next.find((bell) => bell.weekdays.includes(1))).toEqual(emis)
  })

  test("copying Monday onto a different Friday makes the days equal", () => {
    const different = setDayBlocks([emis], 5, [{ period: 1, start: "08:00", end: "08:40", source: "manual" }])

    const next = copyDayBlocks(different, 1, 5)

    expect(dayBlocks(next, 5)[0]?.start).toBe("08:30")
  })

  test("reset brings the whole school week back to EMIS and keeps the weekend", () => {
    const edited = copyDayBlocks(
      setDayBlocks([emis], 5, [{ period: 1, start: "08:00", end: "08:40", source: "manual" }]),
      1,
      6,
    )

    const next = resetPeriodToEmis(edited, 1)

    expect(dayBlocks(next, 5)[0]).toMatchObject({ start: "08:30", source: "emis" })
    expect(dayBlocks(next, 6)).toHaveLength(1)
  })

  test("two overlapping blocks of a day stop the form; on different days they do not", () => {
    const form = { ...emptyTermForm(), academic_year: "2026", starts_on: "2026-09-01", ends_on: "2026-12-01" }
    const first: Bell = { period: 1, start: "09:00", end: "10:00", weekdays: [5], source: "manual" }

    const same = validateTerm({ ...form, bells: [first, { ...first, period: 2, start: "09:30", end: "10:30" }] })
    const apart = validateTerm({
      ...form,
      bells: [first, { ...first, period: 2, start: "09:30", end: "10:30", weekdays: [4] }],
    })

    expect(same).toContain("bellOverlap")
    expect(apart).not.toContain("bellOverlap")
  })

  test("a stored Saturday block stays in the form", () => {
    const saturday: Bell = { period: 1, start: "09:00", end: "10:00", weekdays: [6], source: "manual" }

    expect(termToForm({ ...currentTerm, bells: [saturday] }).bells).toEqual([saturday])
  })
})

describe("the editor of one day", () => {
  test("offers seven days, shows the chosen day and edits only it", () => {
    const onChange = mock((_bells: Bell[]) => undefined)
    renderAdmin(<BellsEditor bells={[emis]} onChange={onChange} />)
    const days = screen.getByRole("group", { name: "Day of the week" })
    expect(within(days).getAllByRole("button")).toHaveLength(7)

    fireEvent.click(within(days).getByRole("button", { name: "Friday" }))
    setValue(screen.getByLabelText("End"), "09:00")

    const next = onChange.mock.lastCall?.[0] as Bell[]
    expect(dayBlocks(next, 5)[0]?.end).toBe("09:00")
    expect(dayBlocks(next, 1)[0]?.end).toBe("09:50")
  })

  test("an empty Saturday says so", () => {
    renderAdmin(<BellsEditor bells={[emis]} onChange={() => undefined} />)

    fireEvent.click(screen.getByRole("button", { name: "Saturday" }))

    expect(screen.getByText(/No lessons on this day/)).toBeInTheDocument()
  })
})

describe("the timetable grid", () => {
  const week: Term = {
    ...currentTerm,
    bells: [
      { period: 2, start: "10:10", end: "11:30", weekdays: [1], source: "manual" },
      { period: 2, start: "11:00", end: "12:20", weekdays: [2], source: "manual" },
    ],
  }

  test("each cell shows the time of its own day", () => {
    renderAdmin(
      <TimetableGrid term={week} entries={[]} view="group" onAdd={() => undefined} onOpen={() => undefined} />,
    )

    expect(screen.getByText("10:10–11:30")).toBeInTheDocument()
    expect(screen.getByText("11:00–12:20")).toBeInTheDocument()
  })

  test("the weekend appears only when it has blocks or entries", () => {
    expect(termWeekdays(week)).toEqual([1, 2, 3, 4, 5])
    const saturday: Bell = { period: 1, start: "09:00", end: "10:00", weekdays: [6], source: "manual" }
    expect(termWeekdays({ ...week, bells: [saturday] })).toEqual([1, 2, 3, 4, 5, 6])
    expect(termWeekdays(week, [{ weekday: 7 } as TimetableEntry])).toEqual([1, 2, 3, 4, 5, 7])
  })
})
