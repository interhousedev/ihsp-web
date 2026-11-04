/** The shared attendance rules and the journal cell's excuse control. */
import { describe, expect, test } from "bun:test"
import { screen } from "@testing-library/react"
import { AttendanceCell } from "../features/attendance/attendance-cell"
import { nextAttendanceState, stateOfCell } from "../features/attendance/attendance-rules"
import { configureTests, renderStaff } from "./helpers"

configureTests()

const base = { lesson_id: "l1", absent: false, late: false, excused: false, marks: [], temporary_mark: null } as never

describe("attendance rules", () => {
  test("cycles present, absent, late, present", () => {
    expect(nextAttendanceState({ absent: false, late: false })).toEqual({ absent: true, late: false })
    expect(nextAttendanceState({ absent: true, late: false })).toEqual({ absent: false, late: true })
    expect(nextAttendanceState({ absent: false, late: true })).toEqual({ absent: false, late: false })
  })
  test("names the state", () => {
    expect(stateOfCell({ absent: true, excused: true } as never)).toBe("excused")
    expect(stateOfCell({ absent: true, excused: false } as never)).toBe("absent")
    expect(stateOfCell({ absent: false, late: true } as never)).toBe("late")
    expect(stateOfCell({ absent: false, late: false } as never)).toBe("present")
  })
})

describe("attendance cell", () => {
  test("an editable absence has a labelled excuse control", async () => {
    let opened = 0
    const { user } = renderStaff(
      <AttendanceCell
        cell={{ ...(base as object), absent: true } as never}
        studentName="Ismoilov Jasur"
        date="5 Oct"
        editable
        notTaken={false}
        onToggle={() => undefined}
        onExcuse={() => opened++}
      />,
    )
    await user.click(screen.getByRole("button", { name: "Excuse Ismoilov Jasur, 5 Oct" }))
    expect(opened).toBe(1)
  })
  test("no excuse control for a present student or a closed window", () => {
    renderStaff(
      <AttendanceCell
        cell={base}
        studentName="A B"
        date="5 Oct"
        editable
        notTaken={false}
        onToggle={() => undefined}
        onExcuse={() => undefined}
      />,
    )
    expect(screen.queryByRole("button", { name: /^Excuse/ })).toBeNull()
  })
})
