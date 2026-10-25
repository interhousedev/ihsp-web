"use client"

import { useQueryParam } from "../../shared/hooks/use-query-param"
import { ActivateFlow } from "./activate-flow"
import { ActivationInvalid } from "./activation-invalid"

/** `/activate/?token=` (UF-ID-13): a staff member sets a password and a recovery email; admins continue to OTP setup. */
export function ActivatePage() {
  const token = useQueryParam("token")
  if (!token) return <ActivationInvalid />
  return <ActivateFlow token={token} />
}
