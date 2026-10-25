"use client"

import { MissingChallenge } from "../../shared/components/missing-challenge"
import { useQueryParam } from "../../shared/hooks/use-query-param"
import { OtpLoginFlow } from "./otp-login-flow"

/** `/login/otp/?login_challenge=`: passwordless login with an OTP. */
export function OtpLoginPage() {
  const challenge = useQueryParam("login_challenge")
  if (!challenge) return <MissingChallenge />
  return <OtpLoginFlow challenge={challenge} />
}
