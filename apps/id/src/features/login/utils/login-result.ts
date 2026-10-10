import type { LoginResult } from "@ihsp/api"
import { redirectTo } from "../../shared/utils/redirect"

export type SecondFactor = NonNullable<LoginResult["second_factor"]>

/**
 * What a password or OTP login step led to: a second factor to enter, a new password to choose (the old one was set
 * by an administrator), a redirect back to Hydra, or nothing usable.
 */
export function applyLoginResult(
  result: LoginResult,
  onSecondFactor: (factor: SecondFactor) => void,
  onPasswordChange?: (ticket: string) => void,
): void {
  if (result.second_factor) {
    onSecondFactor(result.second_factor)
    return
  }
  if (result.password_change && onPasswordChange) {
    onPasswordChange(result.password_change.ticket)
    return
  }
  if (result.redirect_to) redirectTo(result.redirect_to)
}
