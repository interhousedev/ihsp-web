import type { PublicStudentCard } from "@ihsp/api"

/** `card-live-token` is a valid token (with a photo), `card-nophoto` one without a photo; others are `404`. */
export const publicStudentCardToken = "card-live-token"
export const publicStudentCardNoPhotoToken = "card-nophoto"

export function publicStudentCard(overrides: Partial<PublicStudentCard> = {}): PublicStudentCard {
  return {
    first_name: "Aziza",
    last_name: "Karimova",
    middle_name: "Rustamovna",
    full_name: "Karimova Aziza Rustamovna",
    student_id: "ST-2026-0042",
    group: "11-A",
    course: 2,
    academic_year: "2026-2027",
    org_name: "Academic Lyceum International House Tashkent",
    lyceum_name: { uz: "Akademik litsey", ru: "Академический лицей", en: "Academic Lyceum" },
    direction: "Natural sciences",
    speciality: "Biology",
    has_photo: true,
    ...overrides,
  }
}
