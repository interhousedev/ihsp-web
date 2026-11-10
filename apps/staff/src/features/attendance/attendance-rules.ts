import type { Journal } from "@ihsp/api"

type Cell = Journal["students"][number]["cells"][number]

export type AttendanceState = "present" | "absent" | "late" | "excused"

/** The next state of the three-state cycle (present, absent, late, present); the same order as the lesson sheet. */
export function nextAttendanceState(current: { absent: boolean; late?: boolean | null }): {
  absent: boolean
  late: boolean
} {
  const late = current.late ?? false
  return { absent: !current.absent && !late, late: current.absent }
}

/** The state a cell shows; an excused absence is its own state. */
export function stateOfCell(cell: Pick<Cell, "absent" | "late" | "excused">): AttendanceState {
  if (cell.absent) return cell.excused ? "excused" : "absent"
  return cell.late ? "late" : "present"
}

/** Only an absence inside the edit window can be excused or have its excuse removed. */
export function canExcuse(cell: Pick<Cell, "absent">, editable: boolean): boolean {
  return editable && cell.absent
}

/** An excused absence is held by an excuse (or the curator's mark): its status control is off and the server answers 409 `academic.attendance_excused_locked`. */
export function isExcusedLocked(cell: Pick<Cell, "absent" | "excused">, editable: boolean): boolean {
  return editable && cell.absent && cell.excused
}
