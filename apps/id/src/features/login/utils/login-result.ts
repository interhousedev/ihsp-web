import type { LoginResult } from "@ihsp/api"
import { redirectTo } from "../../shared/utils/redirect"

export type SecondFactor = NonNullable<LoginResult["second_factor"]>

/** What a password or OTP login step led to: a second factor to enter, a redirect back to Hydra, or nothing usable. */
export function applyLoginResult(result: LoginResult, onSecondFactor: (factor: SecondFactor) => void): void {
  if (result.second_factor) {
    onSecondFactor(result.second_factor)
    return
  }
  if (result.redirect_to) redirectTo(result.redirect_to)
}
