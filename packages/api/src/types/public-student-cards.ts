/** The lyceum name in the three languages, as EMIS gives it. */
export type LyceumName = { uz: string; ru: string; en: string }

/** The card seen through its permanent QR token (no owner id); `has_photo` is false when the photo is hidden. */
export type PublicStudentCard = {
  first_name: string
  last_name: string
  middle_name: string | null
  /** Surname, name and patronymic. */
  full_name: string
  student_id: string | null
  group: string | null
  course: number | null
  /** `2026-2027`. */
  academic_year: string
  /** The full lyceum name in the request locale. */
  org_name: string
  lyceum_name: LyceumName | null
  direction: string | null
  speciality: string | null
  has_photo: boolean
}
