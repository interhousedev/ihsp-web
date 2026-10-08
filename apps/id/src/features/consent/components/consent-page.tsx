"use client"

import { MissingChallenge } from "../../shared/components/missing-challenge"
import { useQueryParam } from "../../shared/hooks/use-query-param"
import { ConsentFlow } from "./consent-flow"

/** `/consent/?consent_challenge=`: Hydra's consent page for MCP clients; first-party clients are accepted by the backend. */
export function ConsentPage() {
  const challenge = useQueryParam("consent_challenge")
  if (!challenge) return <MissingChallenge />
  return <ConsentFlow challenge={challenge} />
}
