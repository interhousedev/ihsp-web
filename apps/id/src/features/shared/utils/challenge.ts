import { isApiError } from "@ihsp/api"
import { redirectTo } from "./redirect"

/** `410 auth/challenge-used`: Hydra already handled this login/consent/logout challenge; the web follows `params.redirect_to`. */
export function challengeUsedTarget(error: unknown): string | null {
  if (!isApiError(error) || error.type !== "auth/challenge-used") return null
  const target = error.params.redirect_to
  return typeof target === "string" && target ? target : null
}

/** Follows the redirect of a used challenge. Returns `true` when the error was that case (the caller shows nothing). */
export function followChallengeUsed(error: unknown): boolean {
  const target = challengeUsedTarget(error)
  if (!target) return false
  redirectTo(target)
  return true
}

/** `/path/` with the Hydra challenge carried in the query string (links between login pages keep the flow alive). */
export function withChallenge(path: string, name: string, challenge: string | null): string {
  return challenge ? `${path}?${name}=${encodeURIComponent(challenge)}` : path
}
