// The signed-in student's card, its permanent QR token and the wallet passes.

import { api } from "../client"
import { keys } from "../keys"
import { queryOptions, type RequestOptions } from "../query"
import type { StudentCard, StudentCardGoogleWalletLink, StudentCardToken } from "../types/student-card"

/** GET /v1/me/student-card — student. */
export function getMeStudentCard(opts?: RequestOptions): Promise<StudentCard> {
  return api.get<StudentCard>("/v1/me/student-card", opts)
}
export const getMeStudentCardQuery = () =>
  queryOptions({ queryKey: keys.me.studentCard(), queryFn: ({ signal }) => getMeStudentCard({ signal }) })

/** POST /v1/me/student-card/tokens — student; replaces the permanent QR token, the previous one stops working. */
export function postMeStudentCardToken(opts?: RequestOptions): Promise<StudentCardToken> {
  return api.post<StudentCardToken>("/v1/me/student-card/tokens", undefined, opts)
}

/** GET /v1/me/student-card/wallet/apple — student; the `.pkpass` file. `404 student_card_wallet_unavailable` when off. */
export function getMeStudentCardApplePass(opts?: RequestOptions): Promise<Blob> {
  return api.get<Blob>("/v1/me/student-card/wallet/apple", { ...opts, responseType: "blob" })
}

/** POST /v1/me/student-card/wallet/google — student; the "Add to Google Wallet" link. `404` when off. */
export function postMeStudentCardGoogleWallet(opts?: RequestOptions): Promise<StudentCardGoogleWalletLink> {
  return api.post<StudentCardGoogleWalletLink>("/v1/me/student-card/wallet/google", undefined, opts)
}
