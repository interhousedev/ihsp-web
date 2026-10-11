/** WEB-30: the query cache is kept in localStorage per user; the offline badge follows network failures. */
import { beforeEach, describe, expect, test } from "bun:test"
import { networkError } from "@ihsp/api"
import { createTestQueryClient, userMe } from "@ihsp/test-utils"
import { act, screen, waitFor } from "@testing-library/react"
import { dehydrate } from "@tanstack/react-query"
import { OfflineIndicator } from "../features/offline/components/offline-indicator"
import { newestCachedAt } from "../features/offline/hooks/use-cached-data-age"
import { QueryPersistence } from "../features/offline/components/query-persistence"
import {
  PERSIST_MAX_AGE_MS,
  PERSIST_STORAGE_KEY,
  PWA_PERSIST_MAX_AGE_MS,
  clearPersistedQueries,
  isPersistedQueryKey,
  persistBuster,
  persistMaxAgeMs,
} from "../features/offline/utils/persisted-queries"
import { configureTests, renderSp } from "./helpers"

configureTests()

beforeEach(() => window.localStorage.clear())

describe("persisted query helpers", () => {
  test("only the offline pages' keys are persisted", () => {
    expect(isPersistedQueryKey(["me", "today"])).toBe(true)
    expect(isPersistedQueryKey(["me", "grades", "day", "2026-10-07"])).toBe(true)
    expect(isPersistedQueryKey(["me", "messages"])).toBe(false)
    expect(isPersistedQueryKey(["other", "today"])).toBe(false)
    expect(isPersistedQueryKey([])).toBe(false)
  })

  test("max age and buster depend on the installed app", () => {
    expect(persistMaxAgeMs(false)).toBe(PERSIST_MAX_AGE_MS)
    expect(persistMaxAgeMs(true)).toBe(PWA_PERSIST_MAX_AGE_MS)
    expect(persistBuster("u1", false)).toBe("u1")
    expect(persistBuster("u1", true)).toBe("u1|pwa-v1")
  })

  test("clearPersistedQueries removes the stored cache", () => {
    window.localStorage.setItem(PERSIST_STORAGE_KEY, "{}")
    clearPersistedQueries()
    expect(window.localStorage.getItem(PERSIST_STORAGE_KEY)).toBeNull()
  })
})

describe("QueryPersistence", () => {
  test("restores a stored cache of the same user", async () => {
    const source = createTestQueryClient()
    source.setQueryData(["me", "today"], { hello: "world" })
    window.localStorage.setItem(
      PERSIST_STORAGE_KEY,
      JSON.stringify({ buster: persistBuster(userMe.id), timestamp: Date.now(), clientState: dehydrate(source) }),
    )
    const queryClient = createTestQueryClient()

    renderSp(
      <QueryPersistence>
        <p>child</p>
      </QueryPersistence>,
      { queryClient },
    )

    await screen.findByText("child")
    await waitFor(() => expect(queryClient.getQueryData<unknown>(["me", "today"])).toEqual({ hello: "world" }))
  })

  test("discards a cache stored for another user", async () => {
    const source = createTestQueryClient()
    source.setQueryData(["me", "today"], { hello: "world" })
    window.localStorage.setItem(
      PERSIST_STORAGE_KEY,
      JSON.stringify({ buster: "someone-else", timestamp: Date.now(), clientState: dehydrate(source) }),
    )
    const queryClient = createTestQueryClient()

    renderSp(<QueryPersistence>child</QueryPersistence>, { queryClient })

    await screen.findByText("child")
    expect(queryClient.getQueryData(["me", "today"])).toBeUndefined()
  })

  test("writes only successful persisted queries to storage", async () => {
    const queryClient = createTestQueryClient()
    renderSp(<QueryPersistence>child</QueryPersistence>, { queryClient })
    await screen.findByText("child")

    act(() => {
      queryClient.setQueryData(["me", "timetable"], { lessons: [] })
      queryClient.setQueryData(["me", "messages"], { secret: true })
    })

    await waitFor(() => expect(window.localStorage.getItem(PERSIST_STORAGE_KEY)).not.toBeNull(), { timeout: 5000 })
    const stored = JSON.parse(window.localStorage.getItem(PERSIST_STORAGE_KEY) ?? "{}")
    expect(stored.buster).toBe(userMe.id)
    const keys = stored.clientState.queries.map((query: { queryKey: unknown[] }) => query.queryKey)
    expect(keys).toEqual([["me", "timetable"]])
  })

  test("without a session nothing is restored or stored", async () => {
    const queryClient = createTestQueryClient()
    renderSp(<QueryPersistence>child</QueryPersistence>, { queryClient, session: null })
    await screen.findByText("child")
    expect(window.localStorage.getItem(PERSIST_STORAGE_KEY)).toBeNull()
  })
})

describe("OfflineIndicator", () => {
  test("shows the badge after a network error and hides it after a success", async () => {
    const queryClient = createTestQueryClient()
    renderSp(<OfflineIndicator />, { queryClient })
    expect(screen.queryByText("Offline")).toBeNull()

    await act(async () => {
      await queryClient
        .fetchQuery({ queryKey: ["probe"], queryFn: () => Promise.reject(networkError(new Error("down"))) })
        .catch(() => undefined)
    })
    expect(await screen.findByText("Offline")).toBeInTheDocument()

    await act(async () => {
      await queryClient.fetchQuery({ queryKey: ["probe2"], queryFn: () => Promise.resolve(1) })
    })
    await waitFor(() => expect(screen.queryByText("Offline")).toBeNull())
  })

  test("offline, it says how old the cached pages are", async () => {
    const queryClient = createTestQueryClient()
    queryClient.setQueryData(["me", "today"], { semester: 1 })
    queryClient.setQueryData(["me", "messages"], { rows: [] })
    renderSp(<OfflineIndicator />, { queryClient })
    expect(screen.queryByText(/Updated/)).toBeNull()

    await act(async () => {
      await queryClient
        .fetchQuery({ queryKey: ["probe"], queryFn: () => Promise.reject(networkError(new Error("down"))) })
        .catch(() => undefined)
    })
    expect(await screen.findByText("Offline")).toBeInTheDocument()
    expect(screen.getByText(/^Updated /)).toBeInTheDocument()
  })

  test("the age is the newest fetch among the offline pages only", () => {
    const query = (key: unknown[], dataUpdatedAt: number) => ({ queryKey: key, state: { dataUpdatedAt } })
    expect(newestCachedAt([])).toBeNull()
    expect(newestCachedAt([query(["me", "messages"], 500)])).toBeNull()
    expect(newestCachedAt([query(["me", "today"], 100), query(["me", "grades"], 300), query(["me", "messages"], 500)])).toBe(300)
  })
})
