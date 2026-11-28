import type { PublicStudentCard } from "./public-student-cards"

/** Which wallet buttons to show: a wallet without server settings is off. */
export type StudentCardWalletAvailability = { apple: boolean; google: boolean }

/** The signed-in student's card with its permanent QR token. */
export type StudentCard = PublicStudentCard & {
  qr_token: string
  wallet: StudentCardWalletAvailability
}
/** The new permanent QR token; the previous one no longer works. */
export type StudentCardToken = { token: string }
/** The "Add to Google Wallet" link. */
export type StudentCardGoogleWalletLink = { url: string }
