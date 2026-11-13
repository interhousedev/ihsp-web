import type { PublicStudentCard } from "@ihsp/api"

/** `card-live-token` is a valid token (with a photo), `card-nophoto` one without a photo; others are `404`. */
export const publicStudentCardToken = "card-live-token"
export const publicStudentCardNoPhotoToken = "card-nophoto"

export function publicStudentCard(overrides: Partial<PublicStudentCard> = {}): PublicStudentCard {
  return {
    first_name: "Aziza",
    last_name: "Karimova",
    group: "11-A",
    course: 2,
    lyceum_name: { uz: "Akademik litsey", ru: "Академический лицей", en: "Academic Lyceum" },
    direction: "Natural sciences",
    speciality: "Biology",
    has_photo: true,
    expires_at: new Date(Date.now() + 90_000).toISOString(),
    ...overrides,
  }
}
