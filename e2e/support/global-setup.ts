import { URLS } from "../fixtures/env"
import { mailpitReachable } from "../fixtures/mailpit"
import { redisReachable } from "../fixtures/telegram-fake"

async function reachable(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(5_000) })
    return response.ok
  } catch {
    return false
  }
}

/** Fails fast with instructions when the backend stack is not running; the suite needs the real services. */
export default async function globalSetup(): Promise<void> {
  if (process.env.E2E_SKIP_PREFLIGHT === "1") return
  const problems: string[] = []
  if (!(await reachable(`${URLS.api}/health`))) {
    problems.push(
      `API ${URLS.api}/health does not answer: run \`cd backend && scripts/dev.sh all\` (+ worker, scheduler, bot).`,
    )
  }
  if (!(await reachable(`${URLS.hydra}/.well-known/openid-configuration`))) {
    problems.push(
      `Hydra ${URLS.hydra} does not answer: start the dev compose (\`backend/scripts/dev.sh\`) and run scripts/hydra_bootstrap.py.`,
    )
  }
  if (!(await mailpitReachable())) {
    problems.push(`Mailpit ${URLS.mailpit} does not answer: it ships with the dev compose.`)
  }
  if (!(await redisReachable())) {
    // Only the broadcast spec reads the fake Telegram outbox; do not block the rest of the suite.
    process.stderr.write(
      `warning: Redis ${URLS.redis} does not answer; specs that read the fake Telegram outbox will fail.\n`,
    )
  }
  if (problems.length > 0) {
    throw new Error(
      `The e2e suite needs the backend stack:\n - ${problems.join("\n - ")}\nSet E2E_SKIP_PREFLIGHT=1 to skip this check.`,
    )
  }
}
