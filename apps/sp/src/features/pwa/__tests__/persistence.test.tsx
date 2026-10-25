/** The installed app keeps the offline answers for 7 days, versioned; the portal keeps them for 24 hours. */
import { beforeEach, describe, expect, test } from "bun:test"
import { getMeTodayQuery } from "@ihsp/api"
import { errorHandlers, server, userMe } from "@ihsp/test-utils"
import { screen, waitFor } from "@testing-library/react"
import { useQuery } from "@tanstack/react-query"
import { QueryPersistence } from "../../offline/components/query-persistence"
import {
  PERSIST_MAX_AGE_MS,
  PERSIST_STORAGE_KEY,
  PWA_PERSIST_MAX_AGE_MS,
  PWA_PERSIST_VERSION,
  persistBuster,
  persistMaxAgeMs,
} from "../../offline/utils/persisted-queries"
import { configureTests } from "../../../tests/helpers"
import { renderPwa, setRuntimeConfig } from "./pwa-test-support"

configureTests()

const DAY = 24 * 60 * 60 * 1000

function TodayProbe() {
  const query = useQuery(getMeTodayQuery())
  return <p>{query.data ? `semester ${query.data.semester.semester}` : query.isError ? "error" : "loading"}</p>
}

/** A stored cache with a `today` answer that was written `ageMs` ago. */
function storeToday(ageMs: number, buster: string): void {
  const writtenAt = Date.now() - ageMs
  window.localStorage.setItem(
    PERSIST_STORAGE_KEY,
    JSON.stringify({
      timestamp: writtenAt,
      buster,
      clientState: {
        queries: [
          {
            queryKey: ["me", "today"],
            queryHash: '["me","today"]',
            state: {
              data: { semester: { semester: 7 } },
              dataUpdateCount: 1,
              dataUpdatedAt: writtenAt,
              error: null,
              errorUpdateCount: 0,
              errorUpdatedAt: 0,
              fetchFailureCount: 0,
              fetchFailureReason: null,
              fetchMeta: null,
              isInvalidated: false,
              status: "success",
              fetchStatus: "idle",
            },
          },
        ],
        mutations: [],
      },
    }),
  )
}

describe("persistence limits", () => {
  test("24 hours in the portal, 7 days in the installable app", () => {
    expect(persistMaxAgeMs(false)).toBe(PERSIST_MAX_AGE_MS)
    expect(persistMaxAgeMs(true)).toBe(PWA_PERSIST_MAX_AGE_MS)
    expect(PWA_PERSIST_MAX_AGE_MS).toBe(7 * DAY)
  })

  test("the portal's buster is the user id; the app's also carries the storage version", () => {
    expect(persistBuster("u1", false)).toBe("u1")
    expect(persistBuster("u1", true)).toBe(`u1|pwa-v${PWA_PERSIST_VERSION}`)
  })

  test("a persisted query follows the mode of the running app", () => {
    setRuntimeConfig("sp")
    expect(persistMaxAgeMs()).toBe(PERSIST_MAX_AGE_MS)

    setRuntimeConfig("pwa")

    expect(persistMaxAgeMs()).toBe(PWA_PERSIST_MAX_AGE_MS)
  })
})

describe("QueryPersistence in the installed app", () => {
  beforeEach(() => setRuntimeConfig("pwa"))

  test("shows a 3-day-old answer while offline", async () => {
    storeToday(3 * DAY, persistBuster(userMe.id, true))
    server.use(errorHandlers.networkError)

    renderPwa(
      <QueryPersistence>
        <TodayProbe />
      </QueryPersistence>,
    )

    expect(await screen.findByText("semester 7")).toBeInTheDocument()
  })

  test("drops an answer older than 7 days", async () => {
    storeToday(8 * DAY, persistBuster(userMe.id, true))
    server.use(errorHandlers.networkError)

    renderPwa(
      <QueryPersistence>
        <TodayProbe />
      </QueryPersistence>,
    )

    expect(await screen.findByText("error")).toBeInTheDocument()
  })

  test("drops answers stored by another storage version", async () => {
    storeToday(DAY, `${userMe.id}|pwa-v0`)
    server.use(errorHandlers.networkError)

    renderPwa(
      <QueryPersistence>
        <TodayProbe />
      </QueryPersistence>,
    )

    expect(await screen.findByText("error")).toBeInTheDocument()
  })

  test("writes the answers with the versioned buster", async () => {
    renderPwa(
      <QueryPersistence>
        <TodayProbe />
      </QueryPersistence>,
    )
    await screen.findByText(/^semester/)

    await waitFor(() => expect(window.localStorage.getItem(PERSIST_STORAGE_KEY) ?? "").toContain('"today"'), {
      timeout: 5000,
    })
    const stored = JSON.parse(window.localStorage.getItem(PERSIST_STORAGE_KEY) ?? "{}") as { buster?: string }
    expect(stored.buster).toBe(persistBuster(userMe.id, true))
  })
})

describe("QueryPersistence in the portal", () => {
  test("still discards a 3-day-old answer (24 hours)", async () => {
    setRuntimeConfig("sp")
    storeToday(3 * DAY, userMe.id)
    server.use(errorHandlers.networkError)

    renderPwa(
      <QueryPersistence>
        <TodayProbe />
      </QueryPersistence>,
    )

    expect(await screen.findByText("error")).toBeInTheDocument()
  })
})
