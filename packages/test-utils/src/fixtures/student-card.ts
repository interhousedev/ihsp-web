import type { StudentCard, StudentCardToken } from "@ihsp/api"

export function studentCard(overrides: Partial<StudentCard> = {}): StudentCard {
  return {
    first_name: "Aleksey",
    last_name: "Brastilov",
    middle_name: "Igorevich",
    full_name: "Brastilov Aleksey Igorevich",
    student_id: "ST-2026-0007",
    group: "11-A",
    course: 2,
    academic_year: "2026-2027",
    org_name: "Academic Lyceum International House Tashkent",
    lyceum_name: { uz: "Akademik litsey", ru: "Академический лицей", en: "Academic Lyceum" },
    direction: "Natural sciences",
    speciality: "Biology",
    has_photo: true,
    qr_token: "my-card-token-0",
    wallet: { apple: true, google: true },
    ...overrides,
  }
}

/** Token number `n` of the QR for the card; each regeneration yields the next one. */
export function studentCardToken(n: number, overrides: Partial<StudentCardToken> = {}): StudentCardToken {
  return { token: `my-card-token-${n}`, ...overrides }
}
