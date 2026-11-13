import type { StudentCard, StudentCardToken } from "@ihsp/api"

export function studentCard(overrides: Partial<StudentCard> = {}): StudentCard {
  return {
    first_name: "Aleksey",
    last_name: "Brastilov",
    group: "11-A",
    course: 2,
    lyceum_name: { uz: "Akademik litsey", ru: "Академический лицей", en: "Academic Lyceum" },
    direction: "Natural sciences",
    speciality: "Biology",
    has_photo: true,
    ...overrides,
  }
}

/** Token number `n` of the QR for the card; each call to the API yields the next one. */
export function studentCardToken(n: number, overrides: Partial<StudentCardToken> = {}): StudentCardToken {
  return { token: `my-card-token-${n}`, expires_at: "2026-10-07T05:13:30.000Z", refresh_in: 60, ...overrides }
}
