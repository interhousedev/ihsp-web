import { server } from "@ihsp/test-utils"
import { waitUntil } from "./helpers"

/** A create (`POST`) or change (`PATCH`, `DELETE`) the page sent; `id` is empty for a create. */
export type SentMutation = { method: string; id: string; body: unknown }

/** What the admin exams page asked of the API. */
export type ExamWatcher = {
  /** The search parameters of every list request, in order. */
  requests: URLSearchParams[]
  mutations: SentMutation[]
  /** Waits until a list request satisfies `matches`. */
  waitFor: (matches: (params: URLSearchParams) => boolean, message?: string) => Promise<void>
  /** Waits for the first create or change and returns it. */
  waitForMutation: () => Promise<SentMutation>
  stop: () => void
}

const PATH = /\/v1\/admin\/assessments(?:\/([^/]+))?$/

/** Records the requests to `/v1/admin/assessments` without replacing the stateful test handler. */
export function watchExamRequests(): ExamWatcher {
  const requests: URLSearchParams[] = []
  const mutations: SentMutation[] = []
  const listener = ({ request }: { request: Request }) => {
    const url = new URL(request.url)
    const match = PATH.exec(url.pathname)
    if (!match) return
    if (request.method === "GET") {
      requests.push(url.searchParams)
      return
    }
    const id = match[1] ?? ""
    void request
      .clone()
      .json()
      .catch(() => undefined)
      .then((body: unknown) => {
        mutations.push({ method: request.method, id, body })
      })
  }
  server.events.on("request:start", listener)
  return {
    requests,
    mutations,
    waitFor: (matches, message = "no matching request") => waitUntil(() => requests.some(matches), message),
    waitForMutation: async () => {
      await waitUntil(() => mutations.length > 0, "no create or change was sent")
      return mutations[0] as SentMutation
    },
    stop: () => {
      server.events.removeListener("request:start", listener)
    },
  }
}
