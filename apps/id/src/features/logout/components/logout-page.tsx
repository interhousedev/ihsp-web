"use client"

import { MissingChallenge } from "../../shared/components/missing-challenge"
import { useQueryParam } from "../../shared/hooks/use-query-param"
import { LogoutFlow } from "./logout-flow"

/** `/logout/?logout_challenge=`: Hydra's logout page. Accepts the logout and follows `redirect_to`. */
export function LogoutPage() {
  const challenge = useQueryParam("logout_challenge")
  if (!challenge) return <MissingChallenge />
  return <LogoutFlow challenge={challenge} />
}
