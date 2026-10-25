"use client"

import { MissingChallenge } from "../../shared/components/missing-challenge"
import { useQueryParam } from "../../shared/hooks/use-query-param"
import { LoginFlow } from "./login-flow"

/** `/login/?login_challenge=`: Hydra's login page. */
export function LoginPage() {
  const challenge = useQueryParam("login_challenge")
  if (!challenge) return <MissingChallenge />
  return <LoginFlow challenge={challenge} />
}
