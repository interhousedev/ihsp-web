/** WEB-2, WEB-4, WEB-30, GEN-9, UF-WEB-14: the app frame, search and offline support. */
import { afterEach, describe, expect, test } from "bun:test"
import { apiUrl, emptySearchResults, errorHandlers, searchResults, server, teacherMe } from "@ihsp/test-utils"
import { getMeToday, getMeTodayQuery } from "@ihsp/api"
import { screen, waitFor } from "@testing-library/react"
import { useQuery } from "@tanstack/react-query"
import { HttpResponse, http } from "msw"
import { OfflineIndicator } from "../features/offline/components/offline-indicator"
import { QueryPersistence } from "../features/offline/components/query-persistence"
import {
  PERSIST_STORAGE_KEY,
  clearPersistedQueries,
  isPersistedQueryKey,
} from "../features/offline/utils/persisted-queries"
import { SpShell } from "../features/shell/components/sp-shell"
import { toPaletteResults } from "../features/shell/utils/search-results"
import { configureTests, renderSp, setValue, setViewportWidth } from "./helpers"

configureTests()

afterEach(() => setViewportWidth(1280))

const LABELS = {
  subjects: "Subjects",
  lessons: "Lessons",
  homework: "Homework",
  files: "Files",
  flashcardSets: "Flash card sets",
}
const FORMAT = { date: (value: string) => value }

describe("app frame", () => {
  test("has the header with search, notification bell and profile menu", async () => {
    renderSp(
      <SpShell>
        <p>page body</p>
      </SpShell>,
    )

    expect(await screen.findByText("page body")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Open search" })).toBeInTheDocument()
    expect(await screen.findByRole("button", { name: /^Notifications/ })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Account menu" })).toBeInTheDocument()
  })

  test("the sidebar groups follow the app navigation", async () => {
    renderSp(
      <SpShell>
        <p>page body</p>
      </SpShell>,
    )

    await screen.findByText("page body")

    for (const name of [
      "Timetable",
      "Subjects",
      "Grades",
      "Attendance",
      "Homework",
      "Assistant",
      "Flash cards",
      "My files",
      "Links & shares",
      "Notifications",
      "Profile",
      "Settings",
    ]) {
      expect(screen.getAllByRole("link", { name }).length).toBeGreaterThan(0)
    }
  })

  test("the phone bottom bar has Today, Timetable, Grades, Homework and More", async () => {
    setViewportWidth(360)
    renderSp(
      <SpShell>
        <p>page body</p>
      </SpShell>,
    )

    await screen.findByText("page body")
    const bar = screen.getByRole("navigation", { name: "Quick navigation" })

    expect(bar.querySelectorAll("a")).toHaveLength(4)
    expect(bar.textContent).toContain("Today")
    expect(bar.textContent).toContain("More")
  })

  test("a teacher is told the page is not for them", async () => {
    renderSp(
      <SpShell>
        <p>page body</p>
      </SpShell>,
      { session: { user: teacherMe } },
    )

    expect(await screen.findByText("No access")).toBeInTheDocument()
    expect(screen.queryByText("page body")).not.toBeInTheDocument()
  })
})

describe("search", () => {
  test("results are grouped by section and link to their pages", () => {
    const results = toPaletteResults(searchResults, LABELS, FORMAT)

    expect(results.map((item) => item.section)).toEqual([
      ...Array(1).fill("Subjects"),
      ...Array(searchResults.lessons.length).fill("Lessons"),
      "Homework",
      "Files",
      "Flash card sets",
    ])
    expect(results[0]?.url).toMatch(/^\/subjects\/view\/\?id=/)
    expect(results.find((item) => item.section === "Lessons")?.url).toMatch(/^\/lessons\/view\/\?id=/)
    expect(results.find((item) => item.section === "Flash card sets")?.url).toMatch(/^\/flashcards\/set\/\?id=/)
    expect(toPaletteResults(emptySearchResults, LABELS, FORMAT)).toEqual([])
  })

  test("typing in the palette searches the server and shows grouped results", async () => {
    const queries: string[] = []
    server.use(
      http.get(apiUrl("/v1/me/search"), ({ request }) => {
        queries.push(new URL(request.url).searchParams.get("q") ?? "")
        return HttpResponse.json(searchResults)
      }),
    )
    const { user } = renderSp(
      <SpShell>
        <p>page body</p>
      </SpShell>,
    )

    await user.click(await screen.findByRole("button", { name: "Open search" }))
    const input = await screen.findByPlaceholderText("Type a command or search…")
    setValue(input, "phys")

    await waitFor(() => expect(queries).toEqual(["phys"]))
    for (const heading of ["Subjects", "Lessons", "Homework", "Files", "Flash card sets"]) {
      expect((await screen.findAllByText(heading)).length).toBeGreaterThan(0)
    }
  })
})

/** Fetches Today and shows the offline badge, like the page header does. */
function BadgeProbe() {
  useQuery(getMeTodayQuery())
  return <OfflineIndicator />
}

function LoadedProbe() {
  const query = useQuery(getMeTodayQuery())
  return (
    <>
      <OfflineIndicator />
      <p>{query.data ? "loaded" : "loading"}</p>
    </>
  )
}

function RefetchProbe() {
  const query = useQuery({ ...getMeTodayQuery(), queryFn: () => getMeToday() })
  return (
    <>
      <OfflineIndicator />
      <button type="button" onClick={() => void query.refetch()}>
        again
      </button>
    </>
  )
}

function TodayProbe() {
  const query = useQuery(getMeTodayQuery())
  return <p>{query.data ? `semester ${query.data.semester.semester}` : query.isError ? "error" : "loading"}</p>
}

describe("offline", () => {
  test("the badge appears when a request fails because the network is unreachable", async () => {
    server.use(errorHandlers.networkError)
    renderSp(<BadgeProbe />)

    expect(await screen.findByText("Offline")).toBeInTheDocument()
  })

  test("the badge is not shown while requests work", async () => {
    renderSp(<LoadedProbe />)

    expect(await screen.findByText("loaded")).toBeInTheDocument()
    expect(screen.queryByText("Offline")).not.toBeInTheDocument()
  })

  test("the badge disappears after a request succeeds again", async () => {
    let fail = true
    server.use(http.get(apiUrl("/v1/me/today"), () => (fail ? HttpResponse.error() : HttpResponse.json({}))))
    const { user } = renderSp(<RefetchProbe />)

    await screen.findByText("Offline")
    fail = false
    await user.click(screen.getByRole("button", { name: "again" }))

    await waitFor(() => expect(screen.queryByText("Offline")).not.toBeInTheDocument())
  })

  test("today, timetable, homework and grades are stored; other queries are not", () => {
    expect(isPersistedQueryKey(["me", "today"])).toBe(true)
    expect(isPersistedQueryKey(["me", "timetable", { from: "2026-10-05" }])).toBe(true)
    expect(isPersistedQueryKey(["me", "homework", { status: "done" }])).toBe(true)
    expect(isPersistedQueryKey(["me", "grades", "day", "2026-10-06"])).toBe(true)
    expect(isPersistedQueryKey(["me", "record-book"])).toBe(true)
    expect(isPersistedQueryKey(["me", "files", {}])).toBe(false)
    expect(isPersistedQueryKey(["id", "me"])).toBe(false)
    expect(isPersistedQueryKey(["notifications", "list"])).toBe(false)
  })

  test("stored answers are shown again when the network is down", async () => {
    const first = renderSp(
      <QueryPersistence>
        <TodayProbe />
      </QueryPersistence>,
    )
    expect(await screen.findByText("semester 4")).toBeInTheDocument()
    // The write is throttled; a write left over from an earlier test must not count, so wait for today's answer.
    await waitFor(() => expect(window.localStorage.getItem(PERSIST_STORAGE_KEY) ?? "").toContain('"today"'), {
      timeout: 5000,
    })
    first.unmount()

    const stored = window.localStorage.getItem(PERSIST_STORAGE_KEY)
    server.use(errorHandlers.networkError)
    renderSp(
      <QueryPersistence>
        <TodayProbe />
      </QueryPersistence>,
    )
    // renderWithProviders clears nothing between renders in one test, so the stored cache is still there.
    expect(stored).not.toBeNull()

    expect(await screen.findByText("semester 4")).toBeInTheDocument()
  })

  test("the stored answers of another account are discarded", async () => {
    window.localStorage.setItem(
      PERSIST_STORAGE_KEY,
      JSON.stringify({
        timestamp: Date.now(),
        buster: "someone-else",
        clientState: {
          queries: [
            {
              queryKey: ["me", "today"],
              queryHash: '["me","today"]',
              state: {
                data: { semester: { semester: 99 } },
                dataUpdateCount: 1,
                dataUpdatedAt: Date.now(),
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
    server.use(errorHandlers.networkError)
    renderSp(
      <QueryPersistence>
        <TodayProbe />
      </QueryPersistence>,
    )

    expect(await screen.findByText("error")).toBeInTheDocument()
    expect(screen.queryByText("semester 99")).not.toBeInTheDocument()
  })

  test("clearing the stored answers empties the storage key", () => {
    window.localStorage.setItem(PERSIST_STORAGE_KEY, "x")
    clearPersistedQueries()
    expect(window.localStorage.getItem(PERSIST_STORAGE_KEY)).toBeNull()
  })
})
