import { afterEach, describe, expect, it, setSystemTime } from "bun:test"
import type { NotebookDetail } from "@ihsp/api"
import { apiUrl, nbIds, notebookDetail, renderWithProviders, server } from "@ihsp/test-utils"
import { screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { allowSlowRenders } from "../test-support"
import { useNotebook } from "./use-notebooks"

allowSlowRenders()

const POLL_MS = 4000

type Status = NotebookDetail["summary_status"]

function Probe() {
  const notebook = useNotebook(nbIds.notebook)
  return <p>{notebook.data ? `status: ${notebook.data.summary_status}` : "loading"}</p>
}

/** The notebook answers with these summary statuses in turn; the last one repeats. Counts the requests. */
function serveStatuses(...statuses: Status[]) {
  const requests = { count: 0 }
  server.use(
    http.get(apiUrl(`/v1/notebooks/${nbIds.notebook}`), () => {
      const status = statuses[Math.min(requests.count, statuses.length - 1)] as Status
      requests.count += 1
      return HttpResponse.json({ ...notebookDetail, summary_status: status })
    }),
  )
  return requests
}

afterEach(() => setSystemTime())

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

describe("useNotebook: summary polling", () => {
  it("polls every 4 s while the summary is building and stops once it is ready", async () => {
    const requests = serveStatuses("building", "building", "ready")
    renderWithProviders(<Probe />)

    expect(await screen.findByText("status: building")).toBeInTheDocument()
    expect(requests.count).toBe(1)
    await waitFor(() => expect(requests.count).toBe(2), { timeout: POLL_MS + 3000 })
    await waitFor(() => expect(requests.count).toBe(3), { timeout: POLL_MS + 3000 })
    expect(await screen.findByText("status: ready")).toBeInTheDocument()

    await pause(POLL_MS + 1000)
    expect(requests.count).toBe(3)
  })

  it("gives up two minutes after the first poll when the summary never finishes", async () => {
    const requests = serveStatuses("building")
    renderWithProviders(<Probe />)
    expect(await screen.findByText("status: building")).toBeInTheDocument()

    setSystemTime(new Date(Date.now() + 2 * 60_000))
    await waitFor(() => expect(requests.count).toBe(2), { timeout: POLL_MS + 3000 })
    await pause(POLL_MS + 1000)

    expect(requests.count).toBe(2)
  })

  it("leaves no timer behind after it unmounts", async () => {
    const requests = serveStatuses("building")
    const { unmount } = renderWithProviders(<Probe />)
    expect(await screen.findByText("status: building")).toBeInTheDocument()

    unmount()
    await pause(POLL_MS + 1000)

    expect(requests.count).toBe(1)
  })
})
