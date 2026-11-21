import type { Opportunity } from "./api"

const GRADUATE =
  /\b(ph\.?d|doctoral|doctorate|master'?s?|msc|mba|postgraduate|graduate (?:school|program))\b|магистр|докторант|аспирант|magistr|doktorant/i

/**
 * Entries for people past a bachelor's degree. The catalog has no level field: an entry that names a grade is school
 * level; one without grades whose title or summary names a master's or doctoral degree is graduate level.
 */
export function isGraduateLevel(item: Opportunity): boolean {
  const { fields } = item
  if ((fields.grades?.length ?? 0) > 0) return false
  return GRADUATE.test(`${fields.title} ${fields.summary ?? ""}`)
}

/**
 * School-level entries first (the order of the server is kept inside each part). A student below university
 * (`grade` known) never sees graduate-level entries; staff see them after the rest.
 */
export function bySchoolLevel(items: Opportunity[], studentGrade: number | null): Opportunity[] {
  const school = items.filter((item) => !isGraduateLevel(item))
  if (studentGrade !== null) return school
  return [...school, ...items.filter(isGraduateLevel)]
}
