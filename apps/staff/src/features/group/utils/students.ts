import type { CuratorStudent } from "@ihsp/api"

export type StudentFlag = CuratorStudent["flags"][number]

/** Students who need attention first (more flags first), then by last name and first name (STF-14, UF-STF-09). */
export function sortStudents(students: readonly CuratorStudent[]): CuratorStudent[] {
  return students
    .filter((student) => student.status === "active")
    .toSorted(
      (a, b) =>
        b.flags.length - a.flags.length ||
        a.last_name.localeCompare(b.last_name) ||
        a.first_name.localeCompare(b.first_name),
    )
}

/** `0.083` becomes `8%`; no data gives a dash. */
export function formatRate(rate: number | null): string {
  return rate === null ? "–" : `${Math.round(rate * 100)}%`
}

export function formatGpa(gpa: number | null): string {
  return gpa === null ? "–" : gpa.toFixed(2)
}
