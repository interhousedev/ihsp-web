/**
 * Fake-EMIS students for the registration spec. The seed registers `student01` and `student16`; every run of the spec
 * registers one more (the 10 per hour per IP limit of `POST /v1/id/register/emis` forbids probing), so the next unused
 * one is remembered in `e2e/.state/emis-next.json`. When the demo data is used up, reset the dev database.
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { redisCommand } from "./telegram-fake"

const STATE = join(__dirname, "..", ".state", "emis-next.json")

export const EMIS_CANDIDATES = [
  ...Array.from({ length: 14 }, (_, index) => index + 2), // student02..student15 (2TN2)
  ...Array.from({ length: 14 }, (_, index) => index + 17), // student17..student30 (1TN1)
].map((number) => `student${String(number).padStart(2, "0")}`)

export function nextCandidateIndex(): number {
  try {
    const value = (JSON.parse(readFileSync(STATE, "utf8")) as { next?: number }).next
    return typeof value === "number" ? value : 0
  } catch {
    return 0
  }
}

export function rememberCandidateUsed(index: number): void {
  mkdirSync(dirname(STATE), { recursive: true })
  writeFileSync(STATE, JSON.stringify({ next: index + 1 }))
}

/**
 * Registration attempts are limited per IP (10 per hour) and globally (300). Other suites share the dev Redis, so the
 * spec clears these counters before it starts; only the development stack has such a Redis.
 */
export async function clearRegistrationRateLimits(): Promise<void> {
  for (const pattern of ["rl:reg-ip:*", "rl:reg-global"]) {
    const keys = (await redisCommand("KEYS", pattern)) as string[]
    for (const key of keys) await redisCommand("DEL", key)
  }
}
